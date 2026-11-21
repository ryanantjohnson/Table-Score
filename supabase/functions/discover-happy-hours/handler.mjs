import {inspectWebsite} from './website.mjs';
export function withinRadius(p,c,r){const rad=n=>n*Math.PI/180,dLat=rad(p.latitude-c.latitude),dLon=rad(p.longitude-c.longitude),a=Math.sin(dLat/2)**2+Math.cos(rad(c.latitude))*Math.cos(rad(p.latitude))*Math.sin(dLon/2)**2;return Number.isFinite(a)&&6371000*2*Math.asin(Math.sqrt(Math.min(1,a)))<=r;}
const origins=new Set(['https://tablerec.co','https://www.tablerec.co','https://ryanantjohnson.github.io','capacitor://localhost','https://localhost','http://localhost']);
const hash=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(n=>n.toString(16).padStart(2,'0')).join('');
export function createHandler({env=k=>Deno.env.get(k),fetcher=fetch,inspect=inspectWebsite}={}){return async req=>{
 const origin=req.headers.get('origin'),headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
 if(origins.has(origin))headers['Access-Control-Allow-Origin']=origin;const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers});
 if(origin&&!origins.has(origin))return reply(403,{error:'Origin not allowed'});if(req.method==='OPTIONS')return new Response(null,{status:204,headers});if(req.method!=='POST')return reply(405,{error:'POST required'});
 const auth=req.headers.get('authorization')||'';if(!/^Bearer .+$/i.test(auth))return reply(401,{error:'Sign in required'});
 try{
  const raw=await req.text();if(raw.length>1024)return reply(413,{error:'Request too large'});let body;try{body=JSON.parse(raw);}catch{return reply(400,{error:'Invalid request'});}
  if(!body||Object.keys(body).some(k=>!['latitude','longitude','radius','cursor'].includes(k)))return reply(400,{error:'Invalid search'});
  const {latitude,longitude}=body,radius=body.radius??5000,cursor=body.cursor??0;
  if(typeof latitude!=='number'||!Number.isFinite(latitude)||Math.abs(latitude)>90||typeof longitude!=='number'||!Number.isFinite(longitude)||Math.abs(longitude)>180||!Number.isFinite(radius)||radius<500||radius>15000||!Number.isInteger(cursor)||cursor<0||cursor>16||cursor%4)return reply(400,{error:'Zoom in to search an area up to 15 km around the map center'});
  const base=env('SUPABASE_URL'),service=env('SUPABASE_SERVICE_ROLE_KEY'),google=env('GOOGLE_PLACES_API_KEY');if(!base||!service||!google)return reply(503,{error:'Discovery is unavailable'});
  const call=(path,options={})=>fetcher(base+path,{...options,signal:AbortSignal.timeout(10000)});
  const userResponse=await call('/auth/v1/user',{headers:{apikey:service,Authorization:auth}});if(!userResponse.ok)return reply(401,{error:'Sign in required'});const user=await userResponse.json();if(!user.id||user.is_anonymous)return reply(403,{error:'Sign in required'});
  const pro=await call('/rest/v1/rpc/has_tablerec_pro',{method:'POST',headers:{apikey:service,Authorization:auth,'Content-Type':'application/json'},body:'{}'});if(!pro.ok)return reply(503,{error:'Unable to check membership'});if(await pro.json()!==true)return reply(403,{error:'Pro access required'});
  const rpc=async(name,payload)=>{const r=await call('/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:service,Authorization:'Bearer '+service,'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!r.ok)throw Error('Storage unavailable');const text=await r.text();return text?JSON.parse(text):null;};
  const limit=async(limiter,caller,amount,seconds)=>{const r=await rpc('consume_edge_rate_limit',{p_limiter:limiter,p_caller_hash:await hash(caller),p_limit:amount,p_window_seconds:seconds});return (Array.isArray(r)?r[0]:r)?.allowed===true;};
  if(!await limit('happy-discovery-user',user.id,6,60))return reply(429,{error:'Please wait a minute before checking more venues'});
  const center={latitude:Math.round(latitude*10000)/10000,longitude:Math.round(longitude*10000)/10000};
  const areaKey=await hash('hh-discovery-v2:'+JSON.stringify({...center,radius}));let venues=await rpc('get_edge_cache',{p_cache_key:areaKey});
  if(!venues){
   if(!await limit('happy-discovery-provider','tablerec-global-provider-budget',100,3600))return reply(429,{error:'Discovery is busy. Existing sourced specials remain available; try later'});
   const r=await fetcher('https://places.googleapis.com/v1/places:searchText',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':google,'X-Goog-FieldMask':'places.id,places.displayName,places.formattedAddress,places.location,places.websiteUri,places.businessStatus,places.attributions'},body:JSON.stringify({textQuery:'happy hour',pageSize:20,locationBias:{circle:{center,radius}}}),signal:AbortSignal.timeout(12000)});
   if(!r.ok)return reply(502,{error:'Nearby venue search failed. Try again'});venues=(await r.json()).places||[];if(!Array.isArray(venues))throw Error('Invalid venue response');venues=venues.filter(p=>p.businessStatus==='OPERATIONAL'&&p.id&&p.location&&withinRadius(p.location,center,radius));
   await rpc('set_edge_cache',{p_cache_key:areaKey,p_payload:venues,p_ttl_seconds:600});
  }
  const results=await Promise.all(venues.slice(cursor,cursor+4).map(async p=>{
   const key=await hash('hh-website-v2:'+p.id+':'+p.websiteUri+':'+p.formattedAddress);let report=await rpc('get_edge_cache',{p_cache_key:key});
   if(!report){const checked= p.websiteUri?await inspect(p):{status:'no_website',reason:'No official website supplied by the venue listing'};report={...checked,checked_at:new Date().toISOString(),valid_until:new Date(Date.now()+6*3600000).toISOString()};await rpc('set_edge_cache',{p_cache_key:key,p_payload:report,p_ttl_seconds:21600});}
   return {place_id:p.id,name:p.displayName?.text||'Venue',address:p.formattedAddress||'',latitude:p.location.latitude,longitude:p.location.longitude,attributions:p.attributions||[],...report};
  }));
  return reply(200,{results,venues_found:venues.length,checked_from:cursor,checked_to:Math.min(cursor+4,venues.length),next_cursor:cursor+4<venues.length?cursor+4:null,limited:venues.length===20,radius,attribution:'Venue information: Google Maps. Specials: linked venue websites.',coverage:'Checks up to 20 nearby venues in batches of four. Website text only; PDFs, images, social pages and blocked sites may remain unconfirmed. This is not an exhaustive search.'});
 }catch{return reply(503,{error:'Discovery could not finish. Your existing specials are still available'});}
};}
