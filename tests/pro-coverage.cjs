const assert=require('node:assert/strict');
const offers=require('../data/happy-hour-expansion.json');
const dishes=require('../data/dining-dishes.json').dishes;
const unique=rows=>assert.equal(new Set(rows.map(x=>x.id)).size,rows.length,'Duplicate catalog IDs');
unique(offers);unique(dishes);
assert(offers.length>=57,'Expanded collection must retain the 57 checked locations');
const locations=offers.map(o=>o.address.toLowerCase().replace(/[^a-z0-9]/g,''));
assert.equal(new Set(locations).size,offers.length,'Multiple specials must not inflate location counts');
const additions=offers.filter(o=>o.checked_on==='2026-11-18');
assert.equal(additions.length,30);
for(const kind of ['bar','bar_and_grill','brewery','brewpub','wine_bar','sports_bar','cocktail_bar'])assert(additions.some(o=>o.venue_type===kind),kind);
for(const o of additions){assert(o.coordinate_source.startsWith('https://'));assert(o.expires_on==='2026-12-02');if(o.coordinate_precision==='approximate'){assert(o.coordinate_source.startsWith('https://geocoding.geo.census.gov/'));assert(o.offer.includes('address-geocoded'));}}
assert(!offers.find(o=>o.id==='vacancy-brewing').schedule.some(s=>s.days.includes(2)),'Vacancy is closed Tuesday');
assert(!offers.find(o=>o.id==='brewtorium-highland').schedule.some(s=>s.days.includes(5)),'Disputed Friday start must stay out');
assert(!offers.find(o=>o.id==='drinkwell').schedule.some(s=>s.days.includes(6)),'Disputed Saturday schedule must stay out');
assert.equal(offers.filter(o=>o.id.startsWith('torchys-')).length,18);

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
