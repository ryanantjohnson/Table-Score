// Build an idempotent, date-scoped catalog publication. No credentials or network access.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const date=process.argv[2];
assert(/^\d{4}-\d{2}-\d{2}$/.test(date||''),'Usage: node native/build-happy-hour-sql.mjs YYYY-MM-DD');
const catalog=JSON.parse(fs.readFileSync(new URL('../data/happy-hour-expansion.json',import.meta.url),'utf8'));
const rows=catalog.filter(o=>o.checked_on===date);assert(rows.length,'No checked records for that date');
assert.equal(new Set(catalog.map(o=>o.id)).size,catalog.length,'Duplicate IDs');
const columns=['id','name','address','latitude','longitude','timezone','schedule','offer','min_price','source_url','checked_on','expires_on','active'];
const payload=rows.map(o=>{
 assert(o.name&&o.address&&o.offer&&o.source_url?.startsWith('https://'));
 assert(Number.isFinite(o.latitude)&&Number.isFinite(o.longitude)&&Math.abs(o.latitude)<=90&&Math.abs(o.longitude)<=180);
 assert(o.checked_on<=o.expires_on&&o.active===true);
 assert(o.schedule.length&&o.schedule.every(s=>s.days.length&&s.days.every(d=>Number.isInteger(d)&&d>=1&&d<=7)&&s.start>=0&&s.start<s.end&&s.end<=1440));
 return Object.fromEntries(columns.map(k=>[k,o[k]??null]));
});
const literal=JSON.stringify(payload).replaceAll("'","''");
const types='id text,name text,address text,latitude double precision,longitude double precision,timezone text,schedule jsonb,offer text,min_price numeric,source_url text,checked_on date,expires_on date,active boolean';
console.log(`begin;
insert into public.happy_hour_offers (${columns.join(',')})
select ${columns.join(',')} from jsonb_to_recordset('${literal}'::jsonb) as incoming(${types})
on conflict (id) do update set ${columns.filter(k=>k!=='id').map(k=>`${k}=excluded.${k}`).join(',')};
select count(*) as published_batch from public.happy_hour_offers where checked_on='${date}' and active and expires_on>=current_date;
commit;`);
