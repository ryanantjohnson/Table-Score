import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { guestCaller, guestBudget } from "../_shared/guest-access.ts";

const ALLOWED_WEB_ORIGIN = "https://ryanantjohnson.github.io";
const ALLOWED_ORIGINS = new Set(["https://tablerec.co", "https://www.tablerec.co", ALLOWED_WEB_ORIGIN, "capacitor://localhost", "http://localhost", "https://localhost"]);
const MAX_BODY_BYTES = 4096;
const RATE_LIMIT = 6;
const RATE_WINDOW_SECONDS = 60;
const MAX_RADIUS_MILES = 25;
const MAX_SEARCH_POINTS = 18;
const GOOGLE_TIMEOUT_MS = 9000;

function cors(origin: string | null) {
  const h: Record<string,string> = {
    "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":"POST, OPTIONS",
    "Vary":"Origin"
  };
  if (!origin || ALLOWED_ORIGINS.has(origin)) h["Access-Control-Allow-Origin"] = origin || ALLOWED_WEB_ORIGIN;
  return h;
}
function json(body: unknown, status: number, h: Record<string,string>, extra: Record<string,string> = {}) {
  return new Response(JSON.stringify(body), {status, headers:{...h,"Content-Type":"application/json","Cache-Control":"no-store",...extra}});
}
async function sha256(v:string){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,"0")).join("");}
const rad=(v:number)=>v*Math.PI/180;
function miles(a:number,b:number,c:number,d:number){const x=rad(c-a),y=rad(d-b);const q=Math.sin(x/2)**2+Math.cos(rad(a))*Math.cos(rad(c))*Math.sin(y/2)**2;return 2*3958.7613*Math.asin(Math.sqrt(q));}

Deno.serve(async req => {
  const origin=req.headers.get("origin"), h=cors(origin);
  if(origin && !ALLOWED_ORIGINS.has(origin)) return json({error:"Origin not allowed"},403,h);
  if(req.method==="OPTIONS") return new Response("ok",{status:200,headers:h});
  if(req.method!=="POST") return json({error:"Method not allowed"},405,h);
  try {
    const userId=guestCaller(req);
    if(!userId) return json({error:"Guest discovery is temporarily unavailable"},503,h);
    const len=Number(req.headers.get("content-length")||"0");
    if(Number.isFinite(len)&&len>MAX_BODY_BYTES) return json({error:"Request too large"},413,h);
    const raw=await req.text(); if(raw.length>MAX_BODY_BYTES) return json({error:"Request too large"},413,h);
    let body:any; try{body=raw?JSON.parse(raw):{};}catch{return json({error:"Invalid JSON"},400,h);}
    const latitude=Number(body?.latitude), longitude=Number(body?.longitude);
    if(!Number.isFinite(latitude)||latitude < -90||latitude > 90||!Number.isFinite(longitude)||longitude < -180||longitude > 180) return json({error:"Valid latitude and longitude are required"},400,h);
    const radiusMiles=Math.min(MAX_RADIUS_MILES,Math.max(1,Number(body?.radiusMiles)||10));
    const key=Deno.env.get("GOOGLE_PLACES_API_KEY")||Deno.env.get("GOOGLE_MAPS_API_KEY")||Deno.env.get("GOOGLE_API_KEY");
    const url=Deno.env.get("SUPABASE_URL"), service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if(!key||!url||!service) return json({error:"Restaurant discovery is temporarily unavailable"},500,h);
    const sb=createClient(url,service,{global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(8000)})},auth:{persistSession:false,autoRefreshToken:false}});
    if(!await guestBudget(sb))return json({error:"Guest searches are busy. Please try again shortly."},429,h,{"Retry-After":"60"});
    const callerHash=await sha256(`tablescore:${userId}`);
    const {data:rd,error:re}=await sb.rpc("consume_edge_rate_limit",{p_limiter:"guest-where-to-eat",p_caller_hash:callerHash,p_limit:RATE_LIMIT,p_window_seconds:RATE_WINDOW_SECONDS});
    if(re) return json({error:"Restaurant discovery is temporarily unavailable"},500,h);
    const rr=Array.isArray(rd)?rd[0]:rd, remaining=Number(rr?.remaining??0), reset=rr?.reset_at?String(rr.reset_at):null;
    const rateHeaders:Record<string,string>={"X-RateLimit-Limit":String(RATE_LIMIT),"X-RateLimit-Remaining":String(Math.max(0,remaining))}; if(reset)rateHeaders["X-RateLimit-Reset"]=reset;
    if(!rr?.allowed) return json({error:"Too many discovery requests. Please wait a moment and try again."},429,h,{...rateHeaders,"Retry-After":"60"});
    const cuisine=String(body?.cuisine||"");
    const cuisineQueries:Record<string,string>={mexican:"Mexican restaurants",burger:"burger restaurants",barbecue:"barbecue restaurants",italian:"Italian restaurants",chinese:"Chinese restaurants",thai:"Thai restaurants",sushi:"sushi restaurants",breakfast:"breakfast and brunch restaurants",sandwich:"sandwich restaurants",indian:"Indian restaurants",mediterranean:"Mediterranean restaurants",american:"American restaurants"};
    if(cuisine&&!cuisineQueries[cuisine])return json({error:"Unknown cuisine"},400,h);
    const cacheInput=JSON.stringify({cuisine,lat:Math.round(latitude*500)/500,lng:Math.round(longitude*500)/500,radius:Math.round(radiusMiles)});
    const cacheKey=await sha256(`where-to-eat-v3:${cacheInput}`);
    const {data:cached}=await sb.rpc("get_edge_cache",{p_cache_key:cacheKey});
    if(cached) return json({...cached,cached:true},200,h,rateHeaders);

    const points:{lat:number;lng:number;radiusM:number}[]=[];
    const add=(lat:number,lng:number,rMi:number)=>points.push({lat,lng,radiusM:Math.min(10000,Math.round(rMi*1609.344))});
    if(radiusMiles<=6) add(latitude,longitude,radiusMiles); else {
      add(latitude,longitude,6);
      for(let ring=5;ring<=radiusMiles;ring+=5){
        const count=Math.max(6,Math.ceil(2*Math.PI*ring/7.5));
        for(let i=0;i<count;i++){
          const angle=2*Math.PI*i/count,north=Math.cos(angle)*ring,east=Math.sin(angle)*ring;
          add(latitude+north/69,longitude+east/(69*Math.cos(rad(latitude))),Math.min(6,radiusMiles-ring+5));
        }
      }
    }
    const searchPoints=points.slice(0,MAX_SEARCH_POINTS), places=new Map<string,any>();
    const fieldMask="places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType,places.primaryTypeDisplayName,places.priceLevel,places.businessStatus,places.dineIn";
    async function searchPoint(p:{lat:number;lng:number;radiusM:number}){
      const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),GOOGLE_TIMEOUT_MS);
      try{
        const res=await fetch("https://places.googleapis.com/v1/places:searchNearby",{method:"POST",headers:{"Content-Type":"application/json","X-Goog-Api-Key":key!,"X-Goog-FieldMask":fieldMask},body:JSON.stringify({includedTypes:["restaurant"],maxResultCount:20,rankPreference:"POPULARITY",locationRestriction:{circle:{center:{latitude:p.lat,longitude:p.lng},radius:p.radiusM}}}),signal:controller.signal});
        if(!res.ok){console.error("Google Nearby error",res.status);return;}
        const data=await res.json(); for(const place of data?.places||[]) if(place?.id) places.set(place.id,place);
      }catch(e){console.error("Google Nearby request failed",e);}finally{clearTimeout(timer);}
    }
    // Dedicated cuisine searches paginate up to 60 provider results, retaining up to 50 eligible places.
    // Mixed searches use 12 cuisine queries plus three general pages: at most 15 calls.
    let calls=0, failures=0;
    const searchStarted=Date.now();
    const latSpan=radiusMiles/69, lngSpan=Math.min(179,radiusMiles/(69*Math.max(.05,Math.cos(rad(latitude)))));
    const wrap=(n:number)=>((n+540)%360)-180;
    const rectangle={low:{latitude:Math.max(-90,latitude-latSpan),longitude:wrap(longitude-lngSpan)},high:{latitude:Math.min(90,latitude+latSpan),longitude:wrap(longitude+lngSpan)}};
    async function searchCuisine(textQuery:string,pages:number){
      let pageToken:string|undefined;
      for(let page=0;page<pages;page++){
        if(calls>=MAX_SEARCH_POINTS||Date.now()-searchStarted>=20000){failures++;break;}
        calls++;
        const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),GOOGLE_TIMEOUT_MS);
        try{
          const response=await fetch("https://places.googleapis.com/v1/places:searchText",{method:"POST",headers:{"Content-Type":"application/json","X-Goog-Api-Key":key!,"X-Goog-FieldMask":fieldMask+",nextPageToken"},body:JSON.stringify({textQuery,includedType:"restaurant",strictTypeFiltering:true,pageSize:20,locationRestriction:{rectangle},...(pageToken?{pageToken}:{})}),signal:controller.signal});
          if(!response.ok){failures++;break;}
          const data=await response.json();
          for(const p of data.places||[])if(p.id)places.set(p.id,p);
          pageToken=data.nextPageToken;
          if(!pageToken)break;
        }catch{failures++;break;}finally{clearTimeout(timer);}
      }
    }
    if(cuisine)await searchCuisine(cuisineQueries[cuisine],3);
    else{
      const queries=Object.values(cuisineQueries);
      for(let i=0;i<queries.length;i+=3)await Promise.all(queries.slice(i,i+3).map(q=>searchCuisine(q,1)));
      await searchCuisine("restaurants",3);
    }
    if(!places.size&&failures)return json({error:"Restaurant search is temporarily unavailable. Please try again."},502,h,rateHeaders);
    const priceMap:Record<string,number>={PRICE_LEVEL_FREE:1,PRICE_LEVEL_INEXPENSIVE:1,PRICE_LEVEL_MODERATE:2,PRICE_LEVEL_EXPENSIVE:3,PRICE_LEVEL_VERY_EXPENSIVE:4};
    const restaurants=[...places.values()].map((p:any)=>{const lat=Number(p?.location?.latitude),lng=Number(p?.location?.longitude),dist=Number.isFinite(lat)&&Number.isFinite(lng)?miles(latitude,longitude,lat,lng):9999;return {place_id:p.id,google_place_id:p.id,name:p?.displayName?.text||"Restaurant",address:p?.formattedAddress||"",latitude:lat,longitude:lng,distance_miles:Number(dist.toFixed(2)),primary_type:p?.primaryType||"",type:p?.primaryTypeDisplayName?.text||"Restaurant",types:Array.isArray(p?.types)?p.types:[],price_level:priceMap[p?.priceLevel]??null,google_price_level:p?.priceLevel||null,business_status:p?.businessStatus||null,dine_in:typeof p.dineIn==="boolean"?p.dineIn:null};}).filter((r:any)=>r.distance_miles<=radiusMiles+0.05&&r.business_status!=="CLOSED_PERMANENTLY"&&!/^(gas_station|convenience_store)$/.test(r.primary_type)&&! /\b(cefco|7[- ]eleven|circle k|quiktrip|race ?trac|speedway|love.s travel|pilot travel)\b/i.test(r.name)).slice(0,cuisine?50:500);
    const payload={restaurants,radius_miles:radiusMiles,searched_points:calls,cuisine,partial:failures>0,unique_places:restaurants.length};
    const {error:ce}=await sb.rpc("set_edge_cache",{p_cache_key:cacheKey,p_payload:payload,p_ttl_seconds:failures?30:300}); if(ce)console.error("Cache write error",ce.message);
    return json({...payload,cached:false},200,h,rateHeaders);
  } catch(e){console.error("where-to-eat error",e);return json({error:"Unexpected server error"},500,cors(req.headers.get("origin")));}
});

