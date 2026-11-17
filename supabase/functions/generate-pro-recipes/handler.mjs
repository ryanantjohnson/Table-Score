import {parseInput,generationPayload,validateOutput} from './core.mjs';
const origins=new Set(['https://tablerec.co','https://www.tablerec.co','https://ryanantjohnson.github.io','capacitor://localhost','https://localhost','http://localhost']);
export function createHandler({env=(key)=>Deno.env.get(key),fetcher=fetch}={}){return async function(req){
 const origin=req.headers.get('origin');const headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
 if(origin&&origins.has(origin))headers['Access-Control-Allow-Origin']=origin;
 const reply=(code,body)=>new Response(JSON.stringify(body),{status:code,headers});
 if(origin&&!origins.has(origin))return reply(403,{error:'Origin not allowed'});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});if(req.method!=='POST')return reply(405,{error:'POST required'});
 const url=env('SUPABASE_URL'),service=env('SUPABASE_SERVICE_ROLE_KEY'),auth=req.headers.get('authorization')||'';
 if(!url||!service)return reply(503,{error:'Recipe creation is unavailable'});if(!/^Bearer .+$/i.test(auth))return reply(401,{error:'Sign in required'});
 try{
  const userResponse=await fetcher(url+'/auth/v1/user',{headers:{apikey:service,Authorization:auth},signal:AbortSignal.timeout(10000)});
  if(!userResponse.ok)return reply(401,{error:'Sign in required'});const user=await userResponse.json();
  if(!user.id||user.is_anonymous||!user.email_confirmed_at)return reply(403,{error:'Confirm your account first'});
  const entitlement=await fetcher(url+'/rest/v1/rpc/has_tablerec_pro',{method:'POST',headers:{apikey:service,Authorization:auth,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(10000)});
  if(!entitlement.ok)return reply(503,{error:'Unable to check membership'});if(await entitlement.json()!==true)return reply(403,{error:'Pro access required'});
  if(Number(req.headers.get('content-length'))>12000)return reply(413,{error:'Request too large'});
  const raw=await req.text();if(raw.length>12000)return reply(413,{error:'Request too large'});let body;try{body=JSON.parse(raw);}catch{return reply(400,{error:'Invalid request'});}
  const key=env('OPENAI_API_KEY'),model=env('PRO_RECIPES_AI_MODEL'),available=!!key&&!!model&&env('PRO_RECIPES_AI_ENABLED')==='true';
  if(body.action==='status')return reply(200,{available,state:available?'ready':'setup_pending'});
  if(body.action!=='generate')return reply(400,{error:'Invalid action'});
  if(!available)return reply(503,{error:'Custom recipe creation is not available in this test build yet',code:'setup_pending'});
  if(typeof body.request_id!=='string'||! /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.request_id))return reply(400,{error:'Invalid request ID'});
  let input;try{input=parseInput(body);}catch(err){return reply(400,{error:err.message});}
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(input)));const fingerprint=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
  const bound=(name,fallback,max)=>{const n=Number(env(name)||fallback);return Number.isInteger(n)&&n>0&&n<=max?n:fallback;};
  const rpc=async(name,payload)=>{const r=await fetcher(url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:service,Authorization:'Bearer '+service,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Storage unavailable');return r.json();};
  const claim=await rpc('claim_pro_recipe_generation',{p_id:body.request_id,p_user:user.id,p_fingerprint:fingerprint,p_user_limit:bound('PRO_RECIPES_AI_DAILY_USER_LIMIT',5,20),p_global_limit:bound('PRO_RECIPES_AI_DAILY_GLOBAL_LIMIT',100,1000)});
  if(claim.status==='ready')return reply(200,{state:'ready',...claim.response});
  if(claim.status==='pending')return reply(202,{state:'pending',message:'Your recipe request is still being processed. Check again shortly.'});
  if(claim.status==='failed')return reply(200,{state:'failed',message:'That recipe request could not finish. You can try a new request.'});
  if(claim.status==='limited')return reply(429,{error:'Recipe creation has reached its test allowance. Please try again tomorrow.'});
  if(claim.status!=='claimed')return reply(409,{error:'This request changed. Edit your ingredients and try again.'});
  let validated=null;
  try{
   const response=await fetcher('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(generationPayload(input,model)),signal:AbortSignal.timeout(40000)});
   if(!response.ok)throw Error('Provider unavailable');const generated=await response.json();
   if(generated.status!=='completed')throw Error('Incomplete generation');
   const text=generated.output?.flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('');
   if(!text)throw Error('No recipe returned');const result=validateOutput(JSON.parse(text),input,body.request_id);validated=result;
   const saved=await rpc('finish_pro_recipe_generation',{p_id:body.request_id,p_user:user.id,p_response:result,p_success:true});
   if(saved!==true)return reply(503,{error:'Your request is awaiting confirmation. Check it again shortly.'});
   return reply(200,{state:'ready',...result});
  }catch{
   if(validated)return reply(503,{error:'Your request is awaiting confirmation. Check it again shortly.'});
   try{await rpc('finish_pro_recipe_generation',{p_id:body.request_id,p_user:user.id,p_response:null,p_success:false});}catch{}
   return reply(200,{state:'failed',message:'Recipe creation could not finish. Your ingredients have not been changed. Please try again later.'});
  }
 }catch{return reply(503,{error:'Recipe creation is unavailable right now. Please try again later.'});}
};}
