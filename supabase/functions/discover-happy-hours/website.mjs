import https from 'node:https';
import {Buffer} from 'node:buffer';
import {lookup} from 'node:dns/promises';
// The hosted Deno runtime does not implement Node's custom DNS lookup option.
// Dial the validated IP directly, then upgrade with hostname-verified TLS.
export function decodeChunked(body){const parts=[];let offset=0,total=0;while(true){const end=body.indexOf('\r\n',offset);if(end<0)throw Error('Incomplete chunk');const sizeText=body.subarray(offset,end).toString().split(';')[0];if(!/^[0-9a-f]+$/i.test(sizeText))throw Error('Invalid chunk');const size=parseInt(sizeText,16);offset=end+2;if(size===0)return Buffer.concat(parts);if(size>1000000||offset+size+2>body.length||body.subarray(offset+size,offset+size+2).toString()!=='\r\n')throw Error('Incomplete chunk');total+=size;if(total>1000000)throw Error('Page too large');parts.push(body.subarray(offset,offset+size));offset+=size+2;}}
export async function readPinnedDeno(u,ip,runtime=globalThis.Deno){
 let connection,expired=false,timer;
 const work=async()=>{connection=await runtime.connect({hostname:ip,port:443});if(expired){connection.close();throw Error('Website timeout');}connection=await runtime.startTls(connection,{hostname:u.hostname,alpnProtocols:['http/1.1']});if(expired){connection.close();throw Error('Website timeout');}
 const request=new TextEncoder().encode('GET '+u.pathname+u.search+' HTTP/1.1\r\nHost: '+u.hostname+'\r\nUser-Agent: TableRecSpecials/1.0 (+https://tablerec.co; support@tablerec.co)\r\nAccept: text/html,text/plain\r\nAccept-Encoding: identity\r\nConnection: close\r\n\r\n');let sent=0;while(sent<request.length)sent+=await connection.write(request.subarray(sent));
 const chunks=[];let length=0;while(true){const buffer=new Uint8Array(16384),n=await connection.read(buffer);if(n===null)break;length+=n;if(length>1016384)throw Error('Page too large');chunks.push(Buffer.from(buffer.subarray(0,n)));}
 const raw=Buffer.concat(chunks),end=raw.indexOf('\r\n\r\n');if(end<0||end>16384)throw Error('Invalid response headers');const lines=raw.subarray(0,end).toString().split('\r\n'),status=Number(lines.shift().match(/^HTTP\/1\.[01] (\d{3})\b/)?.[1]);const headers={};for(const line of lines){const i=line.indexOf(':');if(i<1)throw Error('Invalid response headers');headers[line.slice(0,i).toLowerCase()]=line.slice(i+1).trim();}
 if(status>=300&&status<400)return {redirect:headers.location};if(status===404)return {status:404,text:''};if(status!==200||!/(?:text\/html|text\/plain)/i.test(headers['content-type']||''))throw Error('Unreadable website');if(headers['content-encoding']&&!/^identity$/i.test(headers['content-encoding']))throw Error('Unsupported compression');let body=raw.subarray(end+4);if(headers['transfer-encoding']){if(!/^chunked$/i.test(headers['transfer-encoding']))throw Error('Unsupported encoding');body=decodeChunked(body);}else if(headers['content-length']&&(!/^\d+$/.test(headers['content-length'])||Number(headers['content-length'])!==body.length))throw Error('Incomplete body');if(body.length>1000000)throw Error('Page too large');return {status,text:body.toString('utf8'),url:u.href};};
 try{return await Promise.race([work(),new Promise((_,reject)=>{timer=setTimeout(()=>{expired=true;try{connection?.close();}catch{}reject(Error('Website timeout'));},8000);})]);}finally{clearTimeout(timer);try{connection?.close();}catch{}}
}

export function publicIPv4(ip){const n=ip.split('.').map(Number);if(n.length!==4||n.some(x=>!Number.isInteger(x)||x<0||x>255))return false;const[a,b]=n;return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&(b===168||b===0||b===2)||a===100&&b>=64&&b<=127||a===198&&(b===18||b===19||b===51)||a===203&&b===0);}
export function siteURL(raw,base){const u=new URL(raw,base);if(u.protocol!=='https:'||u.port&&u.port!=='443'||u.username||u.password||!u.hostname.includes('.')||/^[\d.]+$/.test(u.hostname)||u.hostname.includes(':')||/\.(?:local|internal|localhost|test|invalid)$/.test(u.hostname))throw Error('Unsupported website');u.hash='';return u;}
// Resolve once, reject every private/reserved answer, and pin the selected IP in
// the HTTPS connection. TLS SNI and certificate validation retain the hostname.
export async function readPublicPage(raw,{resolve=lookup,request=https.request}={}){
 const first=siteURL(raw);let u=first;
 for(let redirects=0;redirects<3;redirects++){
  const addresses=await resolve(u.hostname,{family:4,all:true});if(!addresses.length||addresses.some(a=>!publicIPv4(a.address)))throw Error('Non-public website');
  const result=await (globalThis.Deno&&request===https.request?readPinnedDeno(u,addresses[0].address):new Promise((resolve,reject)=>{
   const target=new URL(u.href);target.hostname=addresses[0].address;
   const req=request(target,{method:'GET',servername:u.hostname,family:4,autoSelectFamily:false,headers:{'Host':u.hostname,'User-Agent':'TableRecSpecials/1.0 (+https://tablerec.co; support@tablerec.co)','Accept':'text/html,text/plain'}},res=>{
    if(res.statusCode>=300&&res.statusCode<400){res.resume();return resolve({redirect:res.headers.location});}
    if(res.statusCode===404){res.resume();return resolve({status:404,text:''});}
    if(res.statusCode!==200||! /(?:text\/html|text\/plain)/i.test(res.headers['content-type']||'')){res.resume();return reject(Error('Unreadable website'));}
    const parts=[];let bytes=0;res.on('data',b=>{bytes+=b.length;if(bytes>1000000){req.destroy(Error('Page too large'));return;}parts.push(b);});res.on('end',()=>resolve({status:200,text:Buffer.concat(parts).toString('utf8'),url:u.href}));res.on('error',reject);
   });req.setTimeout(6000,()=>req.destroy(Error('Website timeout')));const timer=setTimeout(()=>req.destroy(Error('Website timeout')),8000);req.on('close',()=>clearTimeout(timer));req.on('error',reject);req.end();
  }));
  if(!result.redirect)return result;
  const next=siteURL(result.redirect,u);if(next.hostname.replace(/^www\./,'')!==first.hostname.replace(/^www\./,''))throw Error('Cross-origin redirect requires review');u=next;
 }throw Error('Too many redirects');
}
export function robotAllows(text,path){const groups=[];let group={agents:[],rules:[]};for(const raw of text.split('\n')){const m=raw.split('#')[0].trim().match(/^([^:]+):\s*(.*)$/);if(!m)continue;const key=m[1].toLowerCase(),value=m[2].trim();if(key==='user-agent'){if(group.rules.length){groups.push(group);group={agents:[],rules:[]};}group.agents.push(value.toLowerCase());}else if(['allow','disallow'].includes(key)&&value)group.rules.push({allow:key==='allow',path:value});}groups.push(group);const exact=groups.filter(g=>g.agents.some(a=>a!=='*'&&a.includes('tablerec'))),selected=exact.length?exact:groups.filter(g=>g.agents.includes('*'));const rules=selected.flatMap(g=>g.rules).filter(r=>{const end=r.path.endsWith('$'),pattern=(end?r.path.slice(0,-1):r.path).split('*').map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*');return new RegExp('^'+pattern+(end?'$':'')).test(path);});return !rules.length||rules.sort((a,b)=>b.path.length-a.path.length||Number(b.allow)-Number(a.allow))[0].allow;}
export function plainHTML(html){return html.replace(/<(script|style|noscript|template)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&(?:nbsp|amp|ndash|mdash|#8211|#8212);/g,m=>({'&nbsp;':' ','&amp;':'&','&ndash;':'–','&mdash;':'—','&#8211;':'–','&#8212;':'—'}[m])).replace(/\s+/g,' ').trim();}
export function localEvidence(html,address){const normalize=s=>s.toLowerCase().replace(/\bhighway\b/g,'hwy').replace(/\bavenue\b/g,'ave').replace(/\bstreet\b/g,'st').replace(/\broad\b/g,'rd').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();const text=' '+normalize(plainHTML(html))+' ',parts=address.split(','),street=normalize(parts[0]||'').split(' ').filter(p=>p&&!['n','s','e','w','us','suite','unit'].includes(p)),city=normalize(parts[1]||'');return /^\d+[a-z]?$/.test(street[0]||'')&&street.length>=2&&street.every(p=>text.includes(' '+p+' '))&&city.length>=3&&text.includes(' '+city+' ');}
export function publishedExcerpt(html){const text=plainHTML(html),hits=[...text.matchAll(/\bhappy\s+hour\b/gi)];const excerpts=hits.map(hit=>text.slice(hit.index,hit.index+390).split(/Skip to Content|Open Menu|Close Menu/i)[0]).filter(fragment=>! /\b(private|corporate|book your|host your)\b/i.test(fragment.slice(0,100))||/\b(mon|tue|wed|thu|fri|sat|sun|daily|everyday)\w*\b/i.test(fragment));return excerpts.find(s=>/\d(?::\d\d)?\s*(?:a\.?m|p\.?m)/i.test(s)&&/(?:\$\s*\d|half.?price|\boff\b|discount)/i.test(s))||excerpts[0]||null;}
export async function inspectWebsite(place,{read=readPublicPage}={}){
 try{
  const declared=new URL(place.websiteUri);if(declared.protocol==='http:')declared.protocol='https:';const url=siteURL(declared.href),robots=await read(new URL('/robots.txt',url).href);
  if(!robotAllows(robots.text,url.pathname))return {status:'blocked',reason:'Website disallows automated checking'};
  const home=await read(url.href),pageURL=siteURL(home.url||url.href);let pages=[home];
  const links=[...home.text.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map(m=>({href:m[1],text:plainHTML(m[2])}));
  const relevant=links.filter(l=>/happy.?hour|specials|menu|drinks|cocktails/i.test(l.href+' '+l.text)).sort((a,b)=>Number(/happy.?hour|specials/i.test(b.href+' '+b.text))-Number(/happy.?hour|specials/i.test(a.href+' '+a.text)));const targets=new Set();for(const link of relevant){let next;try{next=siteURL(link.href,pageURL);}catch{continue;}if(next.origin!==pageURL.origin||/\.pdf$/i.test(next.pathname)||next.href===pageURL.href||!robotAllows(robots.text,next.pathname))continue;targets.add(next.href);if(targets.size>=3)break;}pages.push(...(await Promise.allSettled([...targets].map(h=>read(h)))).filter(r=>r.status==='fulfilled').map(r=>r.value));
  const local=pages.some(p=>localEvidence(p.text,place.formattedAddress));
  const reports=[];for(const p of pages){const excerpt=publishedExcerpt(p.text);if(excerpt){const useful=/\d(?::\d\d)?\s*(?:a\.?m|p\.?m)/i.test(excerpt)&&/(?:\$\s*\d|half.?price|\boff\b|discount)/i.test(excerpt);reports.push({status:!local?'location_unconfirmed':useful?'published':/^happy\s+hour[\s\S]{0,100}\d(?::\d\d)?\s*(?:a\.?m|p\.?m)/i.test(excerpt)&&/\b(mon|tue|wed|thu|fri|sat|sun|daily|everyday)\w*\b/i.test(excerpt.slice(0,120))?'hours_only':'mentioned',source_url:p.url||url.href,excerpt});}}
  if(reports.length)return reports.find(r=>r.status==='published')||reports.find(r=>r.status==='hours_only')||reports[0];
  return {status:'not_found',reason:'No Happy Hour text found in the pages checked'};
 }catch{return {status:'unreadable',reason:'Website could not be checked; it may use PDFs, images or blocked pages'};}
}
