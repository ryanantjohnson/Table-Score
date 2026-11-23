import {inspectWebsite} from './website.mjs';
export function withinRadius(p,c,r){const rad=n=>n*Math.PI/180,dLat=rad(p.latitude-c.latitude),dLon=rad(p.longitude-c.longitude),a=Math.sin(dLat/2)**2+Math.cos(rad(c.latitude))*Math.cos(rad(p.latitude))*Math.sin(dLon/2)**2;return Number.isFinite(a)&&6371000*2*Math.asin(Math.sqrt(Math.min(1,a)))<=r;}
export function validBounds(b){return b&&Object.keys(b).length===4&&['north','south','east','west'].every(k=>typeof b[k]==='number'&&Number.isFinite(b[k]))&&b.north<=85&&b.south>=-85&&b.west>=-180&&b.east<=180&&b.north>b.south&&b.east>b.west&&b.north-b.south<=2&&b.east-b.west<=3;}
export function searchSections(b){const out=[];for(let row=0;row<3;row++)for(let col=0;col<3;col++){const south=b.south+(b.north-b.south)*row/3,north=b.south+(b.north-b.south)*(row+1)/3,west=b.west+(b.east-b.west)*col/3,east=b.west+(b.east-b.west)*(col+1)/3;out.push({north,south,west,east});}return out;}
const inside=(p,b)=>p.latitude>=b.south&&p.latitude<=b.north&&p.longitude>=b.west&&p.longitude<=b.east;
const origins=new Set(['https://tablerec.co','https://www.tablerec.co','https://ryanantjohnson.github.io','capacitor://localhost','https://localhost','http://localhost']);
const hash=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(n=>n.toString(16).padStart(2,'0')).join('');
export function createHandler({env=k=>Deno.env.get(k),fetcher=fetch,inspect=inspectWebsite}={}){return async req=>{
 const origin=req.headers.get('origin'),headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
 if(origins.has(origin))headers['Access-Control-Allow-Origin']=origin;const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers});
 if(origin&&!origins.has(origin))return reply(403,{error:'Origin not allowed'});if(req.method==='OPTIONS')return new Response(null,{status:204,headers});if(req.method!=='POST')return reply(405,{error:'POST required'});
 const auth=req.headers.get('authorization')||'';if(!/^Bearer .+$/i.test(auth))return reply(401,{error:'Sign in required'});
 try{
  const raw=await req.text();if(raw.length>1024)return reply(413,{error:'Request too large'});let body;try{body=JSON.parse(raw);}catch{return reply(400,{error:'Invalid request'});}
  if(!body||Object.keys(body).some(k=>!['latitude','longitude','radius','cursor','bounds'].includes(k)))return reply(400,{error:'Invalid search'});
  const bounds=body.bounds;if(bounds!==undefined&&!validBounds(bounds))return reply(400,{error:'Zoom in to a city or metro area, then search again'});
  const cap=bounds?180:20;
  const {latitude,longitude}=body,radius=body.radius??5000,cursor=body.cursor??0;
  if(typeof latitude!=='number'||!Number.isFinite(latitude)||Math.abs(latitude)>90||typeof longitude!=='number'||!Number.isFinite(longitude)||Math.abs(longitude)>180||!Number.isFinite(radius)||radius<500||radius>15000||!Number.isInteger(cursor)||cursor<0||cursor>cap-4||cursor%4)return reply(400,{error:'Zoom in to search an area up to 15 km around the map center'});
  const base=env('SUPABASE_URL'),service=env('SUPABASE_SERVICE_ROLE_KEY'),google=env('GOOGLE_PLACES_API_KEY');if(!base||!service||!google)return reply(503,{error:'Discovery is unavailable'});
  const call=(path,options={})=>fetcher(base+path,{...options,signal:AbortSignal.timeout(10000)});
  const userResponse=await call('/auth/v1/user',{headers:{apikey:service,Authorization:auth}});if(!userResponse.ok)return reply(401,{error:'Sign in required'});const user=await userResponse.json();if(!user.id||user.is_anonymous)return reply(403,{error:'Sign in required'});
  const pro=await call('/rest/v1/rpc/has_tablerec_pro',{method:'POST',headers:{apikey:service,Authorization:auth,'Content-Type':'application/json'},body:'{}'});if(!pro.ok)return reply(503,{error:'Unable to check membership'});if(await pro.json()!==true)return reply(403,{error:'Pro access required'});
  const rpc=async(name,payload)=>{const r=await call('/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:service,Authorization:'Bearer '+service,'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!r.ok)throw Error('Storage unavailable');const text=await r.text();return text?JSON.parse(text):null;};
  const limit=async(limiter,caller,amount,seconds)=>{const r=await rpc('consume_edge_rate_limit',{p_limiter:limiter,p_caller_hash:await hash(caller),p_limit:amount,p_window_seconds:seconds});return (Array.isArray(r)?r[0]:r)?.allowed===true;};
  if(!await limit('happy-discovery-user',user.id,36,60))return reply(429,{error:'Please wait a minute before checking more venues'});
  const center={latitude:Math.round(latitude*10000)/10000,longitude:Math.round(longitude*10000)/10000};
  const areaKey=await hash('hh-discovery-v7:'+JSON.stringify({...center,radius,bounds}));let cached=await rpc('get_edge_cache',{p_cache_key:areaKey}),venues=cached?.venues,failedSections=cached?.failed_sections||0;
  if(!venues){
   const sections=bounds?searchSections(bounds):[null],groups=[];
   const queries=bounds?['happy hour','drink specials']:['happy hour','drink specials','bar happy hour'];
   // Fetch independent map sections concurrently, but cap active provider requests.
   // Rate budget is consumed before each request, including retries.
   const tasks=sections.flatMap(section=>queries.map(query=>({section,query})));
   let taskIndex=0,successful=0,budgetExhausted=false;
   async function worker(){
    while(taskIndex<tasks.length&&!budgetExhausted){
     const {section,query}=tasks[taskIndex++];
     try{
      if(!await limit('happy-discovery-provider','tablerec-global-provider-budget',100,3600)){budgetExhausted=true;break;}
      const location=section?{locationRestriction:{rectangle:{low:{latitude:section.south,longitude:section.west},high:{latitude:section.north,longitude:section.east}}}}:{locationBias:{circle:{center,radius}}};
      let r;
      for(let attempt=0;attempt<2;attempt++){
       if(attempt&&!(await limit('happy-discovery-provider','tablerec-global-provider-budget',100,3600))){budgetExhausted=true;break;}
       r=await fetcher('https://places.googleapis.com/v1/places:searchText',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':google,'X-Goog-FieldMask':'places.id,places.displayName,places.formattedAddress,places.location,places.websiteUri,places.businessStatus,places.attributions'},body:JSON.stringify({textQuery:query,pageSize:20,...location}),signal:AbortSignal.timeout(12000)});
       if(r.ok||r.status<500)break;
      }
      if(!r?.ok)throw Error('Provider unavailable');
      const places=(await r.json()).places||[];
      if(!Array.isArray(places))throw Error('Invalid venue response');
      successful++;
      groups.push(places.filter(p=>p.businessStatus==='OPERATIONAL'&&p.id&&p.location&&(bounds?inside(p.location,bounds):withinRadius(p.location,center,radius))));
     }catch{failedSections++;}
    }
   }
   await Promise.all(Array.from({length:Math.min(5,tasks.length)},()=>worker()));
   if(!successful&&budgetExhausted)return reply(429,{error:'Discovery is busy. Existing sourced specials remain available; try later'});
   if(budgetExhausted)failedSections++;
   if(!groups.length)return reply(502,{error:'Happy Hour search is temporarily unavailable. Please try again; this does not mean the area has no specials.'});
   // Interleave sections so dense neighborhoods cannot crowd out the rest of the map.
   const seen=new Set();venues=[];for(let i=0;i<20;i++)for(const group of groups){const p=group[i];if(p&&!seen.has(p.id)&&venues.length<cap){seen.add(p.id);venues.push(p);}}
   await rpc('set_edge_cache',{p_cache_key:areaKey,p_payload:{venues,failed_sections:failedSections},p_ttl_seconds:failedSections?30:600});
  }
  const results=await Promise.all(venues.slice(cursor,cursor+4).map(async p=>{
   const key=await hash('hh-website-v2:'+p.id+':'+p.websiteUri+':'+p.formattedAddress);let report=await rpc('get_edge_cache',{p_cache_key:key});
   if(!report){const checked= p.websiteUri?await inspect(p):{status:'no_website',reason:'No official website supplied by the venue listing'};report={...checked,checked_at:new Date().toISOString(),valid_until:new Date(Date.now()+6*3600000).toISOString()};await rpc('set_edge_cache',{p_cache_key:key,p_payload:report,p_ttl_seconds:21600});}
   return {place_id:p.id,name:p.displayName?.text||'Venue',address:p.formattedAddress||'',latitude:p.location.latitude,longitude:p.location.longitude,attributions:p.attributions||[],...report};
  }));
  return reply(200,{results,partial:failedSections>0,failed_sections:failedSections,venues_found:venues.length,checked_from:cursor,checked_to:Math.min(cursor+4,venues.length),next_cursor:cursor+4<venues.length?cursor+4:null,limited:venues.length===cap,search_limit:cap,radius,attribution:'Venue information: Google Maps. Specials: linked venue websites.',coverage:'Checks up to ' + cap + ' venues in batches of four. Website text only; PDFs, images, social pages and blocked sites may remain unconfirmed. This is not an exhaustive search.'});
 }catch{return reply(503,{error:'Discovery could not finish. Your existing specials are still available'});}
};}
