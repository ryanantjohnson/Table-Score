/* Evidence matching never treats an omitted field or unmarked allergen as a safety claim. */
(function(root){
'use strict';
const ALLERGIES=new Set(['Peanut','Milk','Wheat','Egg','Soy','Sesame','Tree nuts','Fish','Crustacean shellfish','Molluscs','Mustard','Celery','Lupin','Sulfites']);
function evaluate(dish,needs,{notes='',now=new Date(),country='US',locationId=null}={}){
 const today=now.toISOString().slice(0,10);
 const fresh=!!dish.checked_on&&!!dish.review_due&&dish.checked_on<=today&&today<=dish.review_due;
 const scoped=country===dish.country;
 const rows=[...new Set(needs)].map(need=>{
  const allergy=ALLERGIES.has(need),value=allergy?dish.allergens?.[need]:dish.diets?.[need];
  let status='unknown',reason='The source does not establish this requirement.';
  if(allergy&&value==='contains'){status='conflict';reason='Listed as containing this allergen in the published recipe.';}
  else if(!allergy&&value===false){status='conflict';reason='The published recipe does not meet this preference.';}
  else if(!fresh){reason='The evidence needs a current review.';}
  else if(!scoped){reason='The source does not cover this country.';}
  else if(allergy&&['not-listed','reported-absent'].includes(value)){
   status='confirm';reason=(value==='not-listed'?'Not marked in the published allergen chart.':'The brand reports this is not a standard ingredient.')+' Shared preparation, oils and substitutions still need restaurant confirmation.';
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
