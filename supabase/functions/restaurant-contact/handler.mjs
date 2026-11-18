const origins=new Set(['https://tablerec.co','https://www.tablerec.co','https://ryanantjohnson.github.io','capacitor://localhost','https://localhost','http://localhost']);
export function createHandler({env=(key)=>Deno.env.get(key),fetcher=fetch}={}){return async function(req){
 const origin=req.headers.get('origin'),headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
 if(origin&&origins.has(origin))headers['Access-Control-Allow-Origin']=origin;
 const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers});
 if(origin&&!origins.has(origin))return reply(403,{error:'Origin not allowed'});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply(405,{error:'POST required'});
 const auth=req.headers.get('authorization')||'';
 if(!/^Bearer .+$/i.test(auth))return reply(401,{error:'Sign in required'});
 if(Number(req.headers.get('content-length'))>1024)return reply(413,{error:'Request too large'});
 try{
  const raw=await req.text();if(raw.length>1024)return reply(413,{error:'Request too large'});
  let body;try{body=JSON.parse(raw);}catch{return reply(400,{error:'Invalid request'});}
  if(!body||Object.keys(body).some(k=>k!=='place_id')||typeof body.place_id!=='string'||! /^[A-Za-z0-9_-]{1,255}$/.test(body.place_id))return reply(400,{error:'Valid Place ID required'});
  const url=env('SUPABASE_URL'),service=env('SUPABASE_SERVICE_ROLE_KEY'),key=env('GOOGLE_PLACES_API_KEY');
  if(!url||!service||!key)return reply(503,{error:'Restaurant contact information is unavailable'});
  const call=(path,options={})=>fetcher(url+path,{...options,signal:AbortSignal.timeout(10000)});
  const userResponse=await call('/auth/v1/user',{headers:{apikey:service,Authorization:auth}});
  if(!userResponse.ok)return reply(401,{error:'Sign in required'});
  const user=await userResponse.json();if(!user.id||user.is_anonymous)return reply(403,{error:'Sign in required'});
  const member=await call('/rest/v1/rpc/has_tablerec_pro',{method:'POST',headers:{apikey:service,Authorization:auth,'Content-Type':'application/json'},body:'{}'});
  if(!member.ok)return reply(503,{error:'Unable to check membership'});
  if(await member.json()!==true)return reply(403,{error:'Pro access required'});
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('restaurant-contact:'+user.id));
  const hash=[...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');
  const limited=await call('/rest/v1/rpc/consume_edge_rate_limit',{method:'POST',headers:{apikey:service,Authorization:'Bearer '+service,'Content-Type':'application/json'},body:JSON.stringify({p_limiter:'restaurant-contact',p_caller_hash:hash,p_limit:20,p_window_seconds:60})});
  if(!limited.ok)return reply(503,{error:'Contact lookup is unavailable'});
  const rates=await limited.json(),rate=Array.isArray(rates)?rates[0]:rates;
  if(rate?.allowed!==true)return reply(429,{error:'Please wait a moment before checking another restaurant'});
  const response=await fetcher('https://places.googleapis.com/v1/places/'+encodeURIComponent(body.place_id),{headers:{'X-Goog-Api-Key':key,'X-Goog-FieldMask':'id,displayName,formattedAddress,internationalPhoneNumber,nationalPhoneNumber,googleMapsUri,types,attributions'},signal:AbortSignal.timeout(10000)});
  if(!response.ok)return reply(502,{error:'Could not load this location’s contact information'});
  const p=await response.json();
  if(p.id!==body.place_id||!Array.isArray(p.types)||!p.types.some(t=>['restaurant','cafe','bar','bakery','meal_takeaway','meal_delivery'].includes(t)||t.endsWith('_restaurant')))return reply(404,{error:'Restaurant contact information not found'});
  return reply(200,{place_id:p.id,name:p.displayName?.text||'',address:p.formattedAddress||'',phone:p.internationalPhoneNumber||p.nationalPhoneNumber||null,google_maps_url:p.googleMapsUri||null,attributions:(p.attributions||[]).map(a=>({name:a.provider||'',url:a.providerUri||''}))});
 }catch{return reply(503,{error:'Restaurant contact information is unavailable. Try again.'});}
};}
