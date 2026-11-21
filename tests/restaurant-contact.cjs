const assert=require('node:assert/strict');
(async()=>{
 const {createHandler}=await import('../supabase/functions/restaurant-contact/handler.mjs');
 const calls=[];let member=true,allowed=true,auth=true,phone=true,wrong=false,fail=false;
 const json=(body,status=200)=>new Response(JSON.stringify(body),{status});
 const handler=createHandler({env:key=>({SUPABASE_URL:'https://backend.test',SUPABASE_SERVICE_ROLE_KEY:'server-only',GOOGLE_PLACES_API_KEY:'google-only'})[key],fetcher:async(url,opts)=>{
  calls.push({url,opts});
  if(url.endsWith('/auth/v1/user'))return auth?json({id:'user-a'}):json({},401);
  if(url.endsWith('/has_tablerec_pro')){assert.equal(opts.headers.Authorization,'Bearer user-token');return json(member);}
  if(url.endsWith('/consume_edge_rate_limit')){assert.equal(opts.headers.Authorization,'Bearer server-only');return json([{allowed}]);}
  if(fail)throw Error('timeout');
  assert(url==='https://places.googleapis.com/v1/places/ChIJtest');assert(opts.signal);assert(!opts.headers['X-Goog-FieldMask'].includes('*'));
  return json({id:wrong?'other':'ChIJtest',displayName:{text:'Test Restaurant'},formattedAddress:'Exact address',types:['mexican_restaurant'],internationalPhoneNumber:phone?'+1 512-555-0123':undefined});
 }});
 const req=(body={place_id:'ChIJtest'},extra={})=>new Request('https://function.test',{method:'POST',headers:{Authorization:'Bearer user-token',Origin:'capacitor://localhost',...extra},body:JSON.stringify(body)});
 let r=await handler(req());assert.equal(r.status,200);assert.equal(r.headers.get('access-control-allow-origin'),'capacitor://localhost');let data=await r.json();assert.equal(data.phone,'+1 512-555-0123');assert(!JSON.stringify(data).includes('server-only'));assert.equal(r.headers.get('cache-control'),'no-store');
 phone=false;r=await handler(req());assert.equal((await r.json()).phone,null);phone=true;
 let n=calls.length;r=await handler(req({place_id:'../../secrets'}));assert.equal(r.status,400);assert.equal(calls.length,n);
 r=await handler(req({place_id:'ChIJtest',needs:['Milk']}));assert.equal(r.status,400);assert.equal(calls.length,n);
 r=await handler(req(undefined,{Origin:'https://evil.test'}));assert.equal(r.status,403);assert.equal(calls.length,n);
 r=await handler(req(undefined,{Authorization:''}));assert.equal(r.status,401);
 auth=false;r=await handler(req());assert.equal(r.status,401);auth=true;
 member=false;n=calls.filter(x=>x.url.startsWith('https://places')).length;r=await handler(req());assert.equal(r.status,403);assert.equal(calls.filter(x=>x.url.startsWith('https://places')).length,n);member=true;
 allowed=false;r=await handler(req());assert.equal(r.status,429);assert.equal(calls.filter(x=>x.url.startsWith('https://places')).length,n);allowed=true;
 wrong=true;r=await handler(req());assert.equal(r.status,404);wrong=false;
 fail=true;r=await handler(req());assert.equal(r.status,503);
 console.log('PASS: exact-location contact, auth/Pro guard, bounded requests, no dietary payload, phone absence and provider errors.');
})().catch(e=>{console.error(e);process.exit(1);});
