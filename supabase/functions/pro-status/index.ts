import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { membership } from './policy.mjs';
const origins=new Set(['https://tablerec.co','https://www.tablerec.co','https://ryanantjohnson.github.io','capacitor://localhost','http://localhost','https://localhost']);
Deno.serve(async request=>{
  const origin=request.headers.get('origin');
  const headers:Record<string,string>={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'};
  if(origin&&origins.has(origin))headers['Access-Control-Allow-Origin']=origin;
  const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
  if(origin&&!origins.has(origin))return reply({error:'origin'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(request.method!=='POST')return reply({error:'method'},405);
  const authorization=request.headers.get('authorization')||'';
  if(!authorization.startsWith('Bearer '))return reply({error:'sign_in_required'},401);
  // The caller cannot choose the target account; getUser validates the JWT remotely.
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error}=await db.auth.getUser(authorization.slice(7));
  if(error||!user)return reply({error:'sign_in_required'},401);
  const {data:rows,error:markError}=await db.rpc('get_account_contributor_status',{p_user_ids:[user.id]});
  if(markError)return reply({error:'membership_unavailable'},503);
  const marks=rows?.find((row:{user_id:string})=>row.user_id===user.id)?.marks||[];
  if(marks.includes('first_round'))return reply(membership({userId:user.id,marks}));
  const key=Deno.env.get('REVENUECAT_SECRET_KEY');
  const enabled=Deno.env.get('PRO_PURCHASES_ENABLED')==='true'&&Deno.env.get('PRO_FEATURES_READY')==='true';
  if(!key)return reply(membership({userId:user.id,marks,purchasesEnabled:false}));
  try{
    const response=await fetch('https://api.revenuecat.com/v1/subscribers/'+encodeURIComponent(user.id),{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(10000)});
    if(response.status===404)return reply(membership({userId:user.id,marks,purchasesEnabled:enabled}));
    if(!response.ok)throw Error('provider_unavailable');
    const body=await response.json();
    return reply(membership({userId:user.id,marks,subscriber:body.subscriber,allowSandbox:Deno.env.get('PRO_ALLOW_SANDBOX')==='true',purchasesEnabled:enabled}));
  }catch{return reply({error:'membership_unavailable'},503);}
});
