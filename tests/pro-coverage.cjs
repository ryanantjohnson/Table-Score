const assert=require('node:assert/strict');
const offers=require('../data/happy-hour-expansion.json');
const dishes=require('../data/dining-dishes.json').dishes;
const unique=rows=>assert.equal(new Set(rows.map(x=>x.id)).size,rows.length,'Duplicate catalog IDs');
unique(offers);unique(dishes);
for(const o of offers){
 assert(o.source_url.startsWith('https://'));assert(o.checked_on<=o.expires_on);
 assert(o.latitude>29&&o.latitude<32&&o.longitude<-96&&o.longitude>-99,'Central Texas coordinate check');
 assert(o.offer.trim().length>20&&o.address.trim().length>10);
 assert(o.schedule.length>0);
 for(const s of o.schedule){assert(s.start>=0&&s.start<s.end&&s.end<=1440);assert(s.days.every(d=>d>=1&&d<=7));}
}
assert(offers.some(o=>o.id==='maudies-hacienda'&&o.latitude<30.2),'Deep South Austin coverage');
assert(offers.some(o=>o.id==='jak-oak-hill'),'Oak Hill coverage');
assert(!offers.some(o=>o.id==='carve-central'),'Temporarily closed location must not be offered');
for(const d of dishes){
 assert(d.source_url.startsWith('https://'));assert(d.checked_on<=d.review_due);
 assert(d.country==='US'&&d.order_notes.length>0);
 assert(Object.values(d.allergens).every(x=>['contains','not-listed','reported-absent','derivative'].includes(x)));
 if(['bouldin','carve-barton'].includes(d.brand))assert(d.allowed_place_ids?.length||d.allowed_address_prefixes?.length,'Local evidence must be location-scoped');
}
assert.equal(new Set(dishes.map(d=>d.brand)).size,6);
console.log('PASS: sourced catalog validation, southern coverage, scoped local evidence and closed-location exclusion.');
