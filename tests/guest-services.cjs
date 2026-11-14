const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');const {stripTypeScriptTypes}=require('node:module');
(async()=>{
 for(const folder of ['guest-restaurants','guest-where-to-eat']){
  let handler,allowed=true,cache={restaurants:[{name:'Test restaurant'}]},calls=[];
  const context={Request,Response,Headers,URL,AbortController,AbortSignal,setTimeout,clearTimeout,TextEncoder,crypto:require('node:crypto').webcrypto,console,
   Deno:{env:{get:()=> 'test-only'},serve:fn=>handler=fn},createClient:()=>({rpc:async(name,args)=>{calls.push({name,args});return name==='consume_edge_rate_limit'?{data:[{allowed,remaining:5}]}:{data:cache}}}),fetch:async()=>{throw Error('Provider must not be contacted for rejected/cached requests')}};
  vm.createContext(context);
  let shared=stripTypeScriptTypes(fs.readFileSync('supabase/functions/_shared/guest-access.ts','utf8')).replaceAll('export ','');
  let src=stripTypeScriptTypes(fs.readFileSync('supabase/functions/'+folder+'/index.ts','utf8')).replace(/^import .*;$/gm,'');vm.runInContext(shared+'\n'+src,context);
  const request=(body,headers={})=>new Request('https://example.com/functions/v1/'+folder,{method:'POST',headers:{origin:'capacitor://localhost','x-forwarded-for':'192.0.2.1','content-type':'application/json',...headers},body:JSON.stringify(body)});
  let res=await handler(request({mode:'create',latitude:30,longitude:-97}));if(folder==='guest-restaurants')assert.equal(res.status,400,'guest create blocked');
  const body=folder==='guest-restaurants'?{mode:'nearby',latitude:30,longitude:-97}:{latitude:30,longitude:-97,radiusMiles:10};
  calls=[];res=await handler(request(body));assert.equal(res.status,200);assert((await res.json()).restaurants.length);assert(calls.some(c=>c.args?.p_limiter==='guest-discovery-global'));assert(!calls.some(c=>/create|insert|update|link/.test(c.name)));
  res=await handler(request(body,{origin:'https://untrusted.example'}));assert.equal(res.status,403);
  res=await handler(request(body,{'x-forwarded-for':''}));assert.equal(res.status,503);
  allowed=false;res=await handler(request(body));assert.equal(res.status,429,'limiter fail closed');allowed=true;
  res=await handler(request({...body,latitude:999}));assert.equal(res.status,400);
  res=await handler(new Request('https://example.com',{method:'OPTIONS',headers:{origin:'https://tablerec.co'}}));assert.equal(res.status,200);assert.equal(res.headers.get('access-control-allow-origin'),'https://tablerec.co');
 }
 console.log('PASS: guest services reject writes, invalid origin/coordinates/missing caller, enforce budgets, and return read-only cached results');
})().catch(e=>{console.error(e);process.exit(1)});
