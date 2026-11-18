/* Evidence matching never treats an omitted field or unmarked allergen as a safety claim. */
(function(root){
'use strict';
const ALLERGIES=new Set(['Peanut','Milk','Wheat','Egg','Soy','Sesame','Tree nuts','Fish','Crustacean shellfish','Molluscs','Mustard','Celery','Lupin','Sulfites']);
function evaluate(dish,needs,{notes='',now=new Date(),country='US',locationId=null,locationAddress=''}={}){
 const today=now.toISOString().slice(0,10);
 const fresh=!!dish.checked_on&&!!dish.review_due&&dish.checked_on<=today&&today<=dish.review_due;
 const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const placeId=String(locationId||'').replace(/^lookup:/,'');
 const locationScoped=(!dish.allowed_place_ids||dish.allowed_place_ids.includes(placeId))&&(!dish.allowed_address_prefixes||dish.allowed_address_prefixes.some(a=>(' '+norm(locationAddress)+' ').includes(' '+a+' ')));
 const scoped=country===dish.country&&locationScoped;
 const rows=[...new Set(needs)].map(need=>{
  const allergy=ALLERGIES.has(need),value=allergy?dish.allergens?.[need]:dish.diets?.[need];
  let status='unknown',reason='The source does not establish this requirement.';
  if(allergy&&value==='contains'){status='conflict';reason='Listed as containing this allergen in the published recipe.';}
  else if(!allergy&&value===false){status='conflict';reason='The published recipe does not meet this preference.';}
  else if(!fresh){reason='The evidence needs a current review.';}
  else if(!scoped){reason='The source does not cover this country or exact restaurant location.';}
  else if(allergy&&value==='derivative'){status='confirm';reason='An oil or ingredient made from this allergen is listed. Ask the restaurant about the ingredient, its processing and shared preparation.';}
  else if(allergy&&['not-listed','reported-absent'].includes(value)){
   status='confirm';reason=(value==='not-listed'?'Not identified in the published ingredient or allergen information.':'The brand reports this is not a standard ingredient.')+' Shared preparation, oils and substitutions still need restaurant confirmation.';
  }else if(['Halal','Kosher'].includes(need)){
   const cert=dish.certifications?.[need];
   if(cert&&locationId&&cert.location_id===locationId&&cert.source_url?.startsWith('https://')&&cert.issuer&&cert.valid_from<=today&&cert.valid_until>=today){status='supported';reason='Current certification evidence covers this location and dish. Verify with the restaurant.';}
   else reason='Current certification covering this exact location and dish is not documented.';
  }else if(['Vegan','Vegetarian','Pescatarian','No pork','No alcohol'].includes(need)&&value===true){status='supported';reason='The brand marks the standard ingredients as meeting this preference. Confirm the local recipe.';}
  return {need,status,reason};
 });
 if(notes.trim())rows.push({need:'Your additional notes',status:'unknown',reason:'Free-text restrictions require individual review and are not automatically matched.'});
 const conflicts=rows.filter(r=>r.status==='conflict').length;
 const unknown=rows.filter(r=>r.status==='unknown').length;
 const confirmation=rows.filter(r=>r.status==='confirm').length;
 const outcome=conflicts?'conflict':!rows.length?'unfiltered':unknown?'unknown':confirmation?'confirm':'supported';
 return {rows,outcome,fresh,scoped,conflicts,unknown,confirmation};
}
root.TableRecDiningEvidence=Object.freeze({evaluate});
if(typeof module==='object'&&module.exports)module.exports=root.TableRecDiningEvidence;
})(typeof window!=='undefined'?window:globalThis);
