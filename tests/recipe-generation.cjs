const assert=require('node:assert/strict');const path=require('node:path');const {pathToFileURL}=require('node:url');
(async()=>{
 const {createHandler}=await import(pathToFileURL(path.resolve('supabase/functions/generate-pro-recipes/handler.mjs')));
 const {parseInput,validateOutput}=await import(pathToFileURL(path.resolve('supabase/functions/generate-pro-recipes/core.mjs')));
 const recipe={name:'Butter toast',summary:'A simple warm snack.',minutes:5,ingredients:[{pantry_index:0,quantity:'2 slices',preparation:'toasted'},{pantry_index:1,quantity:'1 tablespoon',preparation:'softened'}],steps:['Toast the bread until golden.','Spread the butter over the warm toast.']};
 const input=parseInput({pantry:['Bread','butter'],servings:2});assert.deepEqual(input.pantry,['bread','butter']);assert(!parseInput({pantry:['bread']}).pantry.includes('salt'));
 assert(parseInput({pantry:['bread'],assume_staples:true}).pantry.includes('salt'));
 assert.throws(()=>parseInput({pantry:[]}));assert.throws(()=>parseInput({pantry:['bread'],servings:0}));
 assert.throws(()=>validateOutput({message:'',recipes:[{...recipe,ingredients:[{pantry_index:99,quantity:'1 cup',preparation:''}]}]},input,'id'));
 assert.throws(()=>validateOutput({message:'',recipes:[{...recipe,steps:['Only one']} ]},input,'id'));
 const validated=validateOutput({message:'',recipes:[recipe]},input,'request');assert(validated.recipes[0].generated);assert(!validated.recipes[0].source_url);assert(validated.recipes[0].ingredients.every(x=>/bread|butter/.test(x)));
 const config={SUPABASE_URL:'https://backend.test',SUPABASE_SERVICE_ROLE_KEY:'test-service',OPENAI_API_KEY:'test-provider',PRO_RECIPES_AI_ENABLED:'true',PRO_RECIPES_AI_MODEL:'test-model'};
 let pro=true,authenticated=true,providerCalls=0,limited=false,invalidOutput=false,incomplete=false,finishUnavailable=false;const jobs=new Map();let providerBody;
 const json=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{'Content-Type':'application/json'}});
 const fetcher=async(url,options)=>{
  if(url.endsWith('/auth/v1/user'))return authenticated?json({id:'00000000-0000-4000-8000-000000000001',email_confirmed_at:'2026-01-01',is_anonymous:false}):json({},401);
  if(url.endsWith('has_tablerec_pro'))return json(pro);
  if(url.endsWith('claim_pro_recipe_generation')){const p=JSON.parse(options.body),j=jobs.get(p.p_id);if(j)return json(j.fingerprint===p.p_fingerprint?{status:j.status,response:j.response}:{status:'mismatch'});if(limited)return json({status:'limited'});jobs.set(p.p_id,{fingerprint:p.p_fingerprint,status:'pending'});return json({status:'claimed'});}
  if(url.endsWith('finish_pro_recipe_generation')){if(finishUnavailable)throw Error('Storage timeout');const p=JSON.parse(options.body),j=jobs.get(p.p_id);j.status=p.p_success?'ready':'failed';j.response=p.p_response;return json(true);}
  if(url==='https://api.openai.com/v1/responses'){providerCalls++;providerBody=JSON.parse(options.body);return json({status:incomplete?'incomplete':'completed',output:[{content:[{type:'output_text',text:JSON.stringify({message:'Two pantry ingredients.',recipes:[invalidOutput?{...recipe,ingredients:[{pantry_index:50,quantity:'1',preparation:''}]}:recipe]})}]}]});}
  throw Error('Unexpected URL '+url);
 };
 const handle=createHandler({env:k=>config[k],fetcher});const request=(body,auth=true,origin='https://tablerec.co')=>new Request('https://backend.test/functions/v1/generate-pro-recipes',{method:'POST',headers:{'Content-Type':'application/json',origin,...(auth?{Authorization:'Bearer user-token'}:{})},body:JSON.stringify(body)});
 const next=()=>crypto.randomUUID();const body=()=>({action:'generate',request_id:next(),pantry:['bread','butter'],servings:2});
 assert.equal((await handle(request({action:'status'},false))).status,401);assert.equal((await handle(request({},true,'https://untrusted.test'))).status,403);
 authenticated=false;assert.equal((await handle(request({action:'status'}))).status,401);authenticated=true;
 pro=false;assert.equal((await handle(request(body()))).status,403);assert.equal(providerCalls,0);pro=true;
 config.PRO_RECIPES_AI_ENABLED='false';assert.equal((await (await handle(request({action:'status'}))).json()).available,false);assert.equal((await handle(request(body()))).status,503);assert.equal(providerCalls,0);config.PRO_RECIPES_AI_ENABLED='true';
 const b=body();let r=await handle(request(b));assert.equal(r.status,200);assert.equal((await r.json()).state,'ready');assert.equal(providerCalls,1);assert.equal(providerBody.store,false);assert(!providerBody.input.includes('user-token'));assert.equal(providerBody.text.format.strict,true);
 await handle(request(b));assert.equal(providerCalls,1,'Duplicate request must reuse its result');
 assert.equal((await handle(request({...b,pantry:['rice']}))).status,409);assert.equal(providerCalls,1);
 limited=true;assert.equal((await handle(request(body()))).status,429);assert.equal(providerCalls,1);limited=false;
 invalidOutput=true;r=await handle(request(body()));assert.equal((await r.json()).state,'failed');invalidOutput=false;
 incomplete=true;r=await handle(request(body()));assert.equal((await r.json()).state,'failed');incomplete=false;
 finishUnavailable=true;const uncertain=body();r=await handle(request(uncertain));assert.equal(r.status,503);const before=providerCalls;finishUnavailable=false;r=await handle(request(uncertain));assert.equal(r.status,202);assert.equal(providerCalls,before,'Uncertain save must not repeat a paid provider call');
 console.log('PASS: generation authentication, Pro guard, disabled setup, allowed pantry IDs, structured output validation, privacy, request limits, idempotent retries and uncertain-save handling. Live provider quality is not tested.');
})().catch(e=>{console.error(e);process.exit(1)});
