import nodemailer from 'npm:nodemailer@10.5.0';
const recipient='support@tablerec.co';
const origins=new Set(['https://tablerec.co','https://www.tablerec.co','https://ryanantjohnson.github.io','capacitor://localhost','https://localhost','http://localhost']);
export async function handle(req:Request){
 const origin=req.headers.get('origin');
 const headers:Record<string,string>={'Content-Type':'application/json','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
 if(origin&&origins.has(origin))headers['Access-Control-Allow-Origin']=origin;
 const reply=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers});
 if(origin&&!origins.has(origin))return reply(403,{error:'Origin not allowed'});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply(405,{error:'POST required'});
 const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),password=Deno.env.get('FEEDBACK_SMTP_PASSWORD');
 if(!url||!key||!password)return reply(503,{error:'Feedback email is not configured'});
 const auth=req.headers.get('authorization')||'';
 if(!/^Bearer .+$/i.test(auth))return reply(401,{error:'Sign in required'});
 const authResponse=await fetch(url+'/auth/v1/user',{headers:{apikey:key,Authorization:auth},signal:AbortSignal.timeout(10000)});
 if(!authResponse.ok)return reply(401,{error:'Sign in required'});
 const user=await authResponse.json();
 if(!user.id||user.is_anonymous||!user.email_confirmed_at)return reply(403,{error:'Confirm your account first'});
 const raw=await req.text();if(raw.length>12000)return reply(413,{error:'Message too large'});
 let body;try{body=JSON.parse(raw);}catch{return reply(400,{error:'Invalid request'});}
 const {request_id,kind,message}=body;
 if(typeof request_id!=='string'||!/^([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.test(request_id)||!['suggestion','problem','love'].includes(kind)||typeof message!=='string'||message.trim().length<5||message.length>4000)return reply(400,{error:'Check your message'});
 const metadata=Object.fromEntries(['version','build','platform'].map(k=>[k,String(body[k]||'unknown').slice(0,80)]));
 const serverHeaders={apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'};
 const rest=async(path:string,options:RequestInit={})=>fetch(url+'/rest/v1/'+path,{...options,headers:serverHeaders,signal:AbortSignal.timeout(10000)});
 const claim=await rest('rpc/claim_feedback',{method:'POST',body:JSON.stringify({p_id:request_id,p_user:user.id,p_kind:kind,p_message:message.trim(),p_metadata:metadata})});
 if(!claim.ok)return reply(503,{error:'Unable to save feedback'});
 const state=await claim.json();
 if(state==='sent')return reply(200,{sent:true});
 if(state==='limited')return reply(429,{error:'Please try again later'});
 // An uncertain SMTP result is never automatically re-sent under the same ID.
 if(state!=='claimed')return reply(409,{error:'Delivery pending or requires support review'});
 const profile=await rest('profiles?id=eq.'+encodeURIComponent(user.id)+'&select=username');
 const rows=profile.ok?await profile.json():[];
 const username=rows[0]?.username||user.id;
 const smtp=nodemailer.createTransport({host:'smtp.porkbun.com',port:587,secure:false,requireTLS:true,auth:{user:recipient,pass:password},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:20000,disableFileAccess:true,disableUrlAccess:true});
 try{
  const result=await smtp.sendMail({from:{name:'TableRec Feedback',address:recipient},to:recipient,replyTo:user.email,messageId:'<'+request_id+'@tablerec.co>',subject:'TableRec feedback: '+kind,text:['Type: '+kind,'Account: @'+username,'User ID: '+user.id,'App: '+metadata.version+' / '+metadata.build+' / '+metadata.platform,'Reference: '+request_id,'',message.trim()].join('\n')});
  if(!result.accepted?.includes(recipient))return reply(502,{error:'Email not accepted'});
  const saved=await rest('feedback_outbox?id=eq.'+request_id,{method:'PATCH',body:JSON.stringify({state:'sent'})});
  if(!saved.ok)return reply(503,{error:'Delivery awaiting confirmation'});
  return reply(200,{sent:true});
 }catch{return reply(502,{error:'Delivery could not be confirmed'});}
 finally{smtp.close();}
}
Deno.serve((req:Request)=>handle(req).catch(()=>new Response(JSON.stringify({error:'Please try again later'}),{status:503,headers:{'Content-Type':'application/json'}})));
