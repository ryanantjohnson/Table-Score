/* TableRec Pro: integrated app screens. Tester flag does not grant a paid entitlement. */
(function(root){
'use strict';
if(root.tableRecProPreviewEnabled!==true)return;
var DAY=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
var CATALOG=[
 {title:'Food allergies',items:['Peanut','Milk','Wheat','Egg','Soy','Sesame','Tree nuts','Fish','Crustacean shellfish','Molluscs','Mustard','Celery','Lupin','Sulfites']},
 {title:'Medical dietary needs',items:['Celiac / gluten','Lactose intolerance','Alpha-gal (manual review)','Low-FODMAP (manual review)','Diabetes / carbohydrate targets (manual review)','Kidney / potassium / phosphorus limits (manual review)','Low sodium (manual review)','Other medical dietary needs (manual review)']},
 {title:'Religious requirements',items:['Halal','Kosher','No pork','No alcohol']},
 {title:'Personal preferences',items:['Vegan','Vegetarian','Pescatarian']}
];
var VENUES=[],DEALS=[],RECIPES=[];
const SOURCES=Array.isArray(root.TableRecDiningSources)?root.TableRecDiningSources:[];
const DISHES=Array.isArray(root.TableRecDiningDishes)?root.TableRecDiningDishes:[];
const evidence=root.TableRecDiningEvidence;
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const officialFor=v=>SOURCES.find(s=>(!s.city||norm(v.area).includes(s.city))&&(s.id==='cava'?norm(v.name)==='cava':s.id==='chipotle'?['chipotle','chipotle mexican grill'].includes(norm(v.name)):s.aliases.some(a=>(' '+norm(v.name)+' ').includes(' '+a+' '))));
function sourceCard(s){const selected=activeNeeds();const stale=new Date().toISOString().slice(0,10)>s.review_due;return '<div class="card pr-source-card"><div class="pr-eyebrow">PUBLISHED DIETARY GUIDANCE'+(stale?' · REVIEW OVERDUE':'')+'</div><h2>'+esc(s.name)+'</h2><p>'+esc(s.summary)+'</p>'+s.claims.filter(c=>!selected.length||c.needs.some(n=>selected.includes(n))).map(c=>'<div class="pr-evidence"><strong>'+esc(c.needs.join(' · '))+'</strong><p>'+esc(c.note)+'</p>'+badge(stale?'Review overdue':c.status)+'</div>').join('')+'<p class="pr-note">'+esc(s.scope)+' · Checked '+esc(s.checked_on)+'</p><a class="linkbtn" href="'+safeUrl(s.source_url)+'" target="_blank" rel="noopener noreferrer">Official source ↗</a>'+s.additional_sources.map((u,i)=>' · <a href="'+safeUrl(u)+'" target="_blank" rel="noopener noreferrer">Related source '+(i+1)+'</a>').join('')+'</div>';}
function evaluate(v,needs){
 const rows=needs.map(need=>{const e=v.data?.[need]||{status:'unknown',note:'No reviewed evidence for this requirement.',source:'No source supplied',checked:null,scope:'Not documented'};
 const date=Date.parse(e.checked||'');const stale=!Number.isFinite(date)||Date.now()-date>30*86400000;
 return {need,e,stale,manual:need.includes('(manual review)')};});
 const conflicts=rows.filter(r=>['conflict','conflicting'].includes(r.e.status)).length;
 const gaps=rows.filter(r=>r.e.status!=='documented'||r.stale||r.manual).length;
 return {rows,conflicts,gaps,complete:needs.length>0&&gaps===0};
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=(name)=>{const paths={needs:'M12 21s-8-5-8-12a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 7-8 12-8 12Z',happy:'M5 3h14l-7 9-7-9Zm7 9v9m-4 0h8',recipes:'M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1',trip:'M4 4h6v6H4V4Zm10 10h6v6h-6v-6ZM7 10v7h7',journal:'M5 3h14v18H5V3Zm4 5h6m-6 4h6m-6 4h4',arrow:'m9 5 7 7-7 7',back:'m15 5-7 7 7 7',plus:'M12 5v14M5 12h14',check:'m5 12 4 4L19 6'};return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.needs).split(/(?=M)/).map(d=>'<path d="'+d+'"/>').join('')+'</svg>';};
const initial=()=>({needs:[],dietNotes:'',group:[],groupOn:false,filter:'all',query:'',diningResults:null,diningSearching:false,diningMessage:'',diningRequest:0,day:DAY[(new Date().getDay()+6)%7],budget:0,savedDeals:[],recipe:null,category:'All',recipeCollection:'everyday',recipeQuery:'',recipeHistory:[],recipeSummary:{count:0,categories:[]},radius:25,happyCenter:null,openNow:false,savedRecipes:[],trip:{name:'My food trip',days:2,budget:150,stops:[]},journal:[]});
let clearing=false,signingOut=false,epoch=0,loadPromise=null,loaded=false,access=false,revision=0,saveBusy=false,savePending=false,saveConflict=false,loading=false,errorText='',feature='home';
const client=()=>{try{return typeof db!=='undefined'?db:null;}catch{return null;}};
let happyMap=null,happyMarkers=[],happyMapVersion=0;
let recipeRunning=false;
let state=initial(),account=null,screen=null,view='home',detail=null,recipeTimer=null;
const titles={home:'TableRec Pro',needs:'Dining Needs',edit:'Your dining needs',venue:'Restaurant details',happy:'Happy Hours',recipes:'Recipe Wheel',recipe:'Your recipe',about:'About your access'};
const venue=id=>[...VENUES,...(state.diningResults||[])].find(v=>v.id===id);
const dishesFor=v=>{const brand=({'chipotle':'chipotle','chipotle mexican grill':'chipotle','cava':'cava'})[norm(v.name)];return DISHES.filter(d=>d.brand===brand);};
const venueCountry=v=>/^(US|USA|United States)$/i.test(String(v.country_code||v.country||''))||/\b(?:USA|United States)\s*$/i.test(v.address||'')||/\b(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)[,\s]+\d{5}(?:-\d{4})?\b/.test(v.address||'')?'US':'unknown';
const dishEvaluation=(d,v)=>evidence?.evaluate(d,activeNeeds(),{notes:state.dietNotes,country:v?venueCountry(v):'US',locationId:v?.id||null})||{rows:[],outcome:'unknown'};
const dishLabels={supported:'Published ingredients fit',confirm:'Ask before ordering',conflict:'Conflicts with your needs',unknown:'More information needed',unfiltered:'Choose your dining needs'};
function dishCard(d,v){const e=dishEvaluation(d,v);return '<article class="card pr-dish"><div class="pr-eyebrow">'+esc(d.brand.toUpperCase()+' · '+d.kind)+'</div><h2>'+esc(d.name)+'</h2>'+badge(dishLabels[e.outcome],e.outcome==='conflict'?'pr-concern':'')+(d.components?'<p>'+esc(d.components.join(' · '))+'</p>':'')+'<p>'+esc(d.order_notes)+'</p>'+note('Allergen evidence applies to the whole listed order. The exact sauce or ingredient responsible may not be identified in the source.')+'<details><summary>Why this result?</summary>'+e.rows.map(r=>'<div class="pr-evidence"><strong>'+esc(r.need)+'</strong>'+badge({supported:'Published preference',confirm:'Confirm preparation',conflict:'Reported conflict',unknown:'Unknown'}[r.status])+'<p>'+esc(r.reason)+'</p></div>').join('')+(!e.rows.length?note('Select your needs to compare this dish.'): '')+'</details>'+note(d.scope+' · Checked '+d.checked_on)+'<a class="linkbtn" href="'+safeUrl(d.source_url)+(d.source_page?'#page='+d.source_page:'')+'" target="_blank" rel="noopener noreferrer">Dish evidence ↗</a></article>';}
function user(){try{return typeof currentUser!=='undefined'?currentUser:null;}catch(_){return null;}}
function activeNeeds(){return [...new Set([...state.needs,...(state.groupOn?state.group:[])])];}
function button(label,act,value='',cls='secondary'){return '<button type="button" class="'+cls+'" data-pro-action="'+act+'" data-value="'+esc(value)+'">'+label+'</button>';}
function row(title,sub,act,value='',ico='arrow'){return '<button type="button" class="pr-row" data-pro-action="'+act+'" data-value="'+esc(value)+'"><span class="pr-row-text"><strong>'+esc(title)+'</strong>'+(sub?'<small>'+esc(sub)+'</small>':'')+'</span>'+icon(ico)+'</button>';}
function badge(text,type=''){return '<span class="pr-badge '+type+'">'+esc(text)+'</span>';}
function note(text){return '<p class="pr-note">'+esc(text)+'</p>';}
function heading(text,sub){return '<div class="pr-heading"><h2>'+esc(text)+'</h2>'+(sub?'<p>'+esc(sub)+'</p>':'')+'</div>';}
function field(label,id,html){return '<div class="field"><label for="'+id+'">'+esc(label)+'</label>'+html+'</div>';}
function select(id,items,value){return '<select id="'+id+'">'+items.map(x=>'<option value="'+esc(x)+'"'+(String(x)===String(value)?' selected':'')+'>'+esc(x)+'</option>').join('')+'</select>';}
const supportedViews=new Set(['home','needs','edit','venue','happy','recipes','recipe','about']);
function go(next,id){if(!user())return;if(!supportedViews.has(next))next='home';feature=next;view=next;detail=id||null;render();root.scrollTo(0,0);screen.querySelector('h1')?.focus();}
function open(next='home'){
 if(!supportedViews.has(next))next='home';
 sync();if(!user()||!screen){root.openAccount?.();return;}
 feature=next;view=next;detail=null;
 const settings=document.getElementById('settingsModal');if(settings&&!settings.classList.contains('hidden'))root.closeSettings?.();
 if(typeof root.closeWhereToEat==='function')root.closeWhereToEat();
 root.showScreen('pro');render();void loadAccount();
}
function back(){const parent={edit:'needs',venue:'needs',recipe:'recipes'}[view];if(parent)return go(parent);if(view!=='home'&&view!==feature)return go('home');if(!root.tableRecBack?.())root.showScreen('profile');}
function clear(){
 clearing=true;epoch++;disposeHappyMap();recipeRunning=false;clearTimeout(recipeTimer);recipeTimer=null;state=initial();loaded=false;loadPromise=null;loading=false;access=false;revision=0;saveBusy=false;saveConflict=false;errorText='';VENUES=[];DEALS=[];RECIPES=[];
 const wasActive=screen?.classList.contains('active');screen?.remove();screen=null;if(wasActive)root.showScreen('profile');
 document.querySelectorAll('[data-tr-pro-entry]').forEach(n=>n.remove());clearing=false;
}
function render(){
 if(!screen)return;disposeHappyMap();
 const body=loading?'<div class="pr-empty"><h2>Getting your table ready…</h2><p>Loading your private account.</p></div>':errorText?'<div class="pr-empty"><h2>We couldn’t load this right now.</h2><p>'+esc(errorText)+'</p>'+button('Try again','retry','','primary')+'</div>':(!access&&!['home','about','edit','needs'].includes(view))?lockedView():{home:homeView,needs:needsView,edit:editView,venue:venueView,happy:happyView,recipes:recipesView,recipe:recipeView,about:aboutView}[view]();
 screen.innerHTML='<div class="backline pr-backline">'+button(icon('back'),'back','','backbtn')+'<span class="muted">'+(view==='home'?'Profile':'TableRec Pro')+'</span></div><div class="pr-title"><h1 class="page-title" tabindex="-1">'+titles[view]+'</h1>'+(view==='home'?badge('PRO','pr-orange'):'')+'</div>'+body+'<div class="pr-feedback" role="status" aria-live="polite"></div>';
 if(view==='happy'&&access&&!loading&&!errorText)void mountHappyMap();
}
function homeView(){
 return '<div class="pr-membership"><div class="pr-member-top">'+badge(access?'PRO ACCESS ACTIVE':'TABLEREC PRO','pr-orange')+button('Membership details','go','about','linkbtn')+'</div><h2>More ways to find your favorite.</h2><p>Your dining needs live in Profile. Find Happy Hours in Discover and the Recipe Wheel in Run It.</p></div><div class="pr-group">'+
 row('Dining Needs','Private preferences and restaurant evidence','go','needs')+row('Happy Hours','Nearby specials with sources and schedules','go','happy')+row('Cook at home','Thousands of recipes in the Recipe Wheel','go','recipes')+'</div>'+note('Run It stays free and unlimited. No payments are collected in this build.');
}
function needsView(){
 const n=activeNeeds(),q=norm(state.query);let places=(state.diningResults===null?VENUES:state.diningResults).filter(v=>state.diningResults!==null||!q||norm([v.name,v.cuisine,v.area].join(' ')).includes(q));
 const dishes=DISHES.filter(d=>!q||norm(d.brand+' '+d.name+' '+(d.components||[]).join(' ')).includes(q));
 const ordered=dishes.map(d=>({d,e:dishEvaluation(d)})).sort((a,b)=>['supported','confirm','unfiltered','unknown','conflict'].indexOf(a.e.outcome)-['supported','confirm','unfiltered','unknown','conflict'].indexOf(b.e.outcome));
 return '<div class="pr-group">'+row(n.length?n.length+' dining needs selected':'Make this your table',n.length?n.join(' · '):'Allergies, medical needs, religious requirements, and preferences','go','edit')+'</div>'+(!access?lockedView():
 '<div class="search"><input id="prSearch" maxlength="150" aria-label="Search restaurants or dishes" placeholder="Restaurant, dish, city or address" value="'+esc(state.query)+'"></div>'+button(state.diningSearching?'Searching…':'Search restaurants anywhere','searchDining','','primary')+note(state.diningMessage||'Search uses restaurant names and location only. Your private restrictions are not sent to Google.')+
 '<div class="pr-segments">'+button('Restaurants','filter','all',state.filter==='all'?'chip active':'chip')+button('Official guides','filter','sources',state.filter==='sources'?'chip active':'chip')+button('Dish suggestions','filter','documented',state.filter==='documented'?'chip active':'chip')+'</div>'+note('Suggestions, not guarantees. Always verify ingredients, substitutions and preparation with the restaurant. A blank allergen chart entry does not mean allergen-free. Halal and kosher need explicit certification evidence.')+
 (state.filter==='sources'?SOURCES.filter(s=>!q||norm(s.name).includes(q)).map(sourceCard).join(''):state.filter==='documented'?note(DISHES.length+' initial US dish records. Local availability is unconfirmed; coverage is still growing.')+ordered.map(x=>dishCard(x.d)).join(''):'<div class="pr-results">'+places.map(v=>{const count=dishesFor(v).length;return '<button class="pr-restaurant" data-pro-action="venue" data-value="'+esc(v.id)+'"><span class="pr-restaurant-top"><strong>'+esc(v.name)+'</strong>'+icon('arrow')+'</span><span class="pr-meta">'+esc(v.cuisine+' · '+v.area)+'</span><span class="pr-result-bottom">'+badge(count?count+' published dish records':officialFor(v)?'Official brand guide':'Information needed')+'</span></button>';}).join('')+'</div>')+
 ((state.filter==='all'&&!places.length)||(state.filter==='documented'&&!ordered.length)?'<div class="pr-empty">'+icon('needs')+'<h2>No reviewed match here yet.</h2><p>Try a restaurant name or city. Missing evidence stays unknown.</p></div>':''));
}
async function searchDining(){
 if(!access||state.diningSearching)return;const query=state.query.trim();if(query.length<2){toast('Enter a restaurant name, city, or address.');return;}
 const e=epoch,id=user()?.id,request=++state.diningRequest;state.diningSearching=true;state.diningMessage='Searching restaurant locations…';render();
 try{
  if(typeof root.tableRecInvokeRestaurant!=='function')throw Error('Restaurant search is unavailable. Try again shortly.');
  const body={mode:'search',query};const coords=browseCoords();if(coords){body.latitude=coords.latitude;body.longitude=coords.longitude;}
  const {data,error}=await root.tableRecInvokeRestaurant('nearby-restaurants',{body});
  if(epoch!==e||user()?.id!==id||request!==state.diningRequest)return;
  if(error||data?.error)throw Error('Could not search restaurants. Please try again.');
  state.diningResults=(Array.isArray(data?.restaurants)?data.restaurants:[]).map((v,i)=>({id:'lookup:'+String(v.place_id||v.id||i),name:String(v.name||'Restaurant'),area:String(v.address||v.city||''),cuisine:String(v.cuisine||'Restaurant'),address:String(v.address||''),country_code:String(v.country_code||v.country||''),data:{},lookup:true}));
  state.filter='all';state.diningMessage=state.diningResults.length+' locations found. Published brand evidence does not verify local kitchen practices.';
 }catch(err){if(epoch===e&&user()?.id===id&&request===state.diningRequest){state.diningResults=[];state.diningMessage=err.message;}}
 finally{if(epoch===e&&user()?.id===id&&request===state.diningRequest){state.diningSearching=false;if(view==='needs')render();}}
}
function editView(){
 return heading('What matters at your table?','Select every need that applies. Your choices are private and never appear on your public profile.')+
 CATALOG.map(g=>'<h3 class="pr-label">'+esc(g.title)+'</h3><div class="pr-group">'+g.items.map(n=>'<label class="pr-choice"><span>'+esc(n.replace(' (manual review)',''))+(n.includes('manual review')?'<small>Personal targets and individual review required</small>':'')+'</span><input type="checkbox" data-need="'+esc(n)+'"'+(state.needs.includes(n)?' checked':'')+'></label>').join('')+'</div>').join('')+
 field('Other needs or specific ingredients','prDietNotes','<textarea id="prDietNotes" maxlength="1000" rows="3" placeholder="Specific tree nuts, oils, derivatives, certification needs, or personal targets…">'+esc(state.dietNotes)+'</textarea>')+
 note('Free-text needs are a reminder for you and are not automatically matched. No catalog covers every condition. Wheat allergy and celiac disease are evaluated separately. Halal and kosher require scope-specific evidence.')+
 '<label class="pr-consent"><input id="prDietConsent" type="checkbox"'+(state.needs.length||state.dietNotes?' checked':'')+'>I agree to store these dietary choices privately in my TableRec account. I can clear them at any time.</label>'+button('Save dining needs','saveNeeds','','primary')+button('Clear dining needs','clearNeeds','','linkbtn');
}
function venueView(){
 const v=venue(detail);if(!v)return needsView();const dishes=dishesFor(v),e=evaluate(v,activeNeeds());
 return heading(v.name,v.cuisine+' · '+v.area)+note('Suggestions only. Verify every restriction with this restaurant before ordering. Brand evidence is not confirmation of this location’s ingredients or kitchen.')+
 (dishes.length?'<h3 class="pr-label">Published dishes & order ideas</h3>'+dishes.map(d=>dishCard(d,v)).join(''):badge('NO REVIEWED DISH DATA')+'<div class="card"><h2 class="pr-dish-title">Before you order</h2>'+note('No reviewed dish-level information is available here yet.')+e.rows.map(r=>'<div class="pr-evidence"><strong>'+esc(r.need)+'</strong>'+badge('Unknown')+'<p>'+esc(r.e.note)+'</p></div>').join('')+'</div>')+
 (officialFor(v)?sourceCard(officialFor(v)):'')+'<h3 class="pr-label">Questions for the restaurant</h3><div class="pr-group">'+['Ask about every ingredient, seasoning, sauce, and subingredient.','Ask which oils and derivatives are used, including arachis/peanut and gingelly/sesame oil.','Ask about shared fryers, grills, utensils, and preparation surfaces.','For halal or kosher, ask what the certificate covers and when it expires.'].map(t=>'<div class="pr-detail">'+esc(t)+'</div>').join('')+'</div>'+(!v.lookup?button('View restaurant','openRestaurant',v.id,'primary'):'');
}
function filteredHappyDeals(){
 const coords=state.happyCenter||browseCoords();const now=new Date();const dayNum=DAY.indexOf(state.day)+1;
 let deals=DEALS.filter(d=>d.active&&d.checked_on<=now.toISOString().slice(0,10)&&d.expires_on>=now.toISOString().slice(0,10)&&(state.openNow?offerOpen(d,now):d.schedule?.some(s=>s.days.includes(dayNum))));
 deals=deals.map(d=>({...d,distance:coords?miles(coords.latitude,coords.longitude,d.latitude,d.longitude):null})).filter(d=>(d.distance===null||d.distance<=state.radius)&&(state.budget===0||(d.min_price!==null&&Number(d.min_price)<=state.budget))&&(!state.openNow||offerOpen(d,now))).sort((a,b)=>(a.distance??Infinity)-(b.distance??Infinity));
 return deals;
}
function happyView(){
 const coords=state.happyCenter||browseCoords();const dayNum=DAY.indexOf(state.day)+1;const deals=filteredHappyDeals();
 return '<div class="pr-inline-fields">'+field('Day','prDay',select('prDay',DAY,state.day))+field('Within','prRadius',select('prRadius',[5,10,25,50,100],state.radius))+'</div><div class="pr-inline-fields" style="margin-top:12px">'+field('Starting price up to','prBudget',select('prBudget',[0,5,10,15,20,30],state.budget))+field('Show','prOpen',select('prOpen',['Scheduled','Active now'],state.openNow?'Active now':'Scheduled'))+'</div>'+note('0 = any price · Listings without a published starting price are excluded when a price limit is selected. '+(coords?'Sorted by distance from your selected area.':'Choose your area in TableRec to filter by distance.'))+
 '<div id="prHappyMap" class="pr-happy-map" role="region" aria-label="Happy Hour map"><p class="muted">Loading map…</p></div><div class="pr-map-actions">'+button('Search this area','mapArea','','primary')+button('Use TableRec area','resetMap','','secondary')+'</div><p id="prMapStatus" role="status" class="pr-note">Move the map, then search that area. Pins show the listings below.</p><div class="pr-coverage">'+badge('CENTRAL TEXAS')+'<span>'+DEALS.length+' source-linked locations · coverage is growing</span></div>'+
 deals.map(d=>'<article id="prDeal-'+esc(d.id)+'" class="card pr-deal"><div class="pr-eyebrow">'+esc(d.schedule.filter(s=>s.days.includes(state.openNow?localOfferTime(d,new Date()).day:dayNum)).map(s=>clock(s.start)+'–'+clock(s.end)).join(' · '))+(d.distance===null?'':' · '+d.distance.toFixed(1)+' MI')+'</div><h2>'+esc(d.name)+'</h2><p>'+esc(d.offer)+'</p><p class="pr-note">'+esc(d.address)+'</p><div class="pr-deal-bottom">'+button(state.savedDeals.includes(d.id)?'Saved':'Save special','deal',d.id,'chip'+(state.savedDeals.includes(d.id)?' active':''))+'<a class="linkbtn" href="'+safeUrl(d.source_url)+'" target="_blank" rel="noopener noreferrer">Restaurant source ↗</a></div><div class="pr-source">Checked '+esc(d.checked_on)+' · '+button('Directions','directions',d.id,'linkbtn')+'</div></article>').join('')+
 (!deals.length?'<div class="pr-empty">'+icon('happy')+'<h2>No confirmed specials here yet.</h2><p>Try another day, a wider radius, or any price. We only show listings with a source and a current review date.</p></div>':'')+note('Restaurant schedules and prices can change. Confirm before traveling. Specials are not matched to dietary needs.');
}
function disposeHappyMap(){happyMapVersion++;for(const marker of happyMarkers)marker.setMap?.(null);happyMarkers=[];happyMap?.dispose?.();happyMap=null;}
async function mountHappyMap(){
 const host=document.getElementById('prHappyMap'),version=happyMapVersion;if(!host)return;
 try{
  if(typeof root.loadGoogleMaps!=='function')throw Error('Map unavailable');
  await root.loadGoogleMaps();if(version!==happyMapVersion||!host.isConnected)return;
  const center=state.happyCenter||browseCoords()||{latitude:30.508,longitude:-97.75};
  happyMap=new root.google.maps.Map(host,{center:{lat:+center.latitude,lng:+center.longitude},zoom:11,mapTypeControl:false,streetViewControl:false,fullscreenControl:false,clickableIcons:false,gestureHandling:'greedy'});
  await happyMap.ready;if(version!==happyMapVersion)return;
  for(const deal of filteredHappyDeals()){
   const marker=new root.google.maps.Marker({map:happyMap,position:{lat:+deal.latitude,lng:+deal.longitude},title:deal.name});happyMarkers.push(marker);
   marker.addListener('click',()=>document.getElementById('prDeal-'+deal.id)?.scrollIntoView({behavior:'smooth',block:'center'}));
  }
 }catch{if(host.isConnected&&version===happyMapVersion)host.innerHTML='<div class="pr-empty"><h3>Map unavailable right now</h3><p>Your specials and directions are still available below.</p></div>';}
}
async function searchHappyArea(){
 const map=happyMap,id=user()?.id,e=epoch,version=happyMapVersion;if(!map)return toast('The map is unavailable. Use your TableRec area or the list below.');
 const button=screen.querySelector('[data-pro-action="mapArea"]');if(button)button.disabled=true;
 try{await map.syncState?.();if(e!==epoch||version!==happyMapVersion||id!==user()?.id)return;const c=map.getCenter(),latitude=c.lat(),longitude=c.lng();if(!Number.isFinite(latitude)||!Number.isFinite(longitude))throw Error('Invalid map area');state.happyCenter={latitude,longitude};render();toast('Showing sourced specials within '+state.radius+' miles of this map area.');}
 catch{toast('Couldn’t read the map area. Please try again.');}
 finally{if(button?.isConnected)button.disabled=false;}
}
function recipesView(){
 const cats=['All',...state.recipeSummary.categories];
 return '<div class="pr-recipe-intro"><span class="pr-eyebrow">COOK AT HOME</span><h2>Staying in? Run it.</h2><p>Comfort food, weeknight favorites, or something new. Let TableRec pick what’s for dinner.</p></div><div class="pr-collection" role="group" aria-label="Recipe collection">'+button('Everyday favorites','collection','everyday',state.recipeCollection==='everyday'?'chip active':'chip')+button('Explore everything','collection','all',state.recipeCollection==='all'?'chip active':'chip')+'</div>'+note(state.recipeCollection==='everyday'?'Start with familiar favorites: tacos, burgers, pasta, chicken dinners, and more.':Number(state.recipeSummary.count).toLocaleString()+' recipes across the full collection. Try a new direction.')+field('What sounds good?','prCategory',select('prCategory',cats,state.category))+field('Ingredient or dish (optional)','prRecipeQuery','<input id="prRecipeQuery" maxlength="100" placeholder="Chicken, rice, pasta…" value="'+esc(state.recipeQuery)+'">')+
 '<div class="where-stage pr-recipe-stage" id="prRecipeReel"><div class="where-stage-label">TONIGHT’S HOME PICK</div><div class="where-stage-name" id="prRollingName">What’s cooking?</div><div class="where-stage-sub" id="prRollingCategory">Your next favorite is a spin away.</div><div class="pr-reel-neighbors" id="prRollingNext" aria-hidden="true">Pick your mood. We’ll pick the recipe.</div></div><div class="pr-spin-footer">'+button('RUN IT · COOK AT HOME','spin','','primary')+'</div>'+note('Recipes are not allergy- or medical-diet screened. Check all ingredients and preparation steps yourself.')+
 (state.savedRecipes.length?'<h3 class="pr-label">Your recipe collection</h3><div class="pr-group">'+state.savedRecipes.map(r=>row(r.name,r.category,'recipe',r.id)).join('')+'</div>':'');
}
function recipeView(){
 const r=state.recipe?.id===detail?state.recipe:state.savedRecipes.find(x=>x.id===detail);if(!r)return recipesView();
 return '<div class="pr-eyebrow">'+esc(r.category)+' · '+esc(r.time_text||'See recipe for timing')+'</div>'+heading(r.name,r.servings_text?'Serves '+r.servings_text:'Review quantities before cooking')+note('Check suitability for your own needs before cooking.')+'<h3 class="pr-label">Ingredients</h3><div class="pr-group">'+(r.ingredients||[]).map(x=>'<div class="pr-detail">'+esc(x)+'</div>').join('')+'</div><h3 class="pr-label">Method</h3><div class="pr-group">'+(r.steps||[]).map((x,i)=>'<div class="pr-method"><b>'+(i+1)+'</b><p>'+esc(x)+'</p></div>').join('')+'</div>'+(r.notes?.length?note(r.notes.join(' ')):'')+button('RUN IT AGAIN','again','','primary')+button(state.savedRecipes.some(x=>x.id===r.id)?'Saved to your recipes':'Save recipe','saveRecipe',r.id,'primary')+'<p class="pr-note">'+esc(r.attribution||'Wikibooks Cookbook contributors')+' · <a href="'+safeUrl(r.source_url)+'" target="_blank" rel="noopener noreferrer">Original recipe</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a></p>';
}
function aboutView(){return heading(access?'Your Pro access is active':'A little more TableRec.','No payment is collected in this build.')+'<div class="pr-group"><div class="pr-detail"><strong>Built around your dining life</strong><p>Happy Hours in Discover. Dining Needs in Profile. Cook at home in Run It.</p></div><div class="pr-detail"><strong>Real coverage, clear limits</strong><p>Recipes use the attributed Wikibooks Cookbook collection. Happy Hours uses a growing collection of source-linked Central Texas locations. An initial official-brand dietary guide library is available; reviewed local dish suitability is not yet established.</p></div><div class="pr-detail"><strong>Your private account</strong><p>Preferences, saved recipes, and saved specials use private account storage. No purchase flow is active. Run It stays free and unlimited.</p></div></div>';}
function lockedView(){return '<div class="pr-empty">'+icon('needs')+'<h2>A little more with Pro.</h2><p>Discover specials and find your next home-cooked favorite. Membership purchases are not open yet. You have not been charged.</p>'+button('Membership details','go','about','primary')+'</div>';}
function safeUrl(url){try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)?esc(u.href):'#';}catch{return '#';}}
function browseCoords(){try{return typeof currentTableScoreCoords==='function'?currentTableScoreCoords():null;}catch{return null;}}
function miles(a,b,c,d){const rad=x=>x*Math.PI/180;const h=Math.sin(rad(c-a)/2)**2+Math.cos(rad(a))*Math.cos(rad(c))*Math.sin(rad(d-b)/2)**2;return 3958.8*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));}
function clock(n){const h=Math.floor(n/60)%24,m=n%60;return (h%12||12)+(m?':'+String(m).padStart(2,'0'):'')+(h>=12?' PM':' AM');}
function localOfferTime(d,now){const parts=new Intl.DateTimeFormat('en-US',{timeZone:d.timezone,weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);const get=k=>parts.find(p=>p.type===k)?.value;const day=DAY.indexOf(get('weekday'))+1;const minute=Number(get('hour'))*60+Number(get('minute'));return {day,minute};}
function offerOpen(d,now){try{const {day,minute}=localOfferTime(d,now);return d.schedule.some(s=>s.days.includes(day)&&minute>=s.start&&minute<s.end);}catch{return false;}}
function savedDocument(){return {version:1,savedDeals:state.savedDeals,savedRecipes:state.savedRecipes,trip:state.trip,journal:state.journal};}
async function saveNotebook(){
 if(saveConflict){toast('Your notebook changed on another device. Reload before saving.');return;}
 if(saveBusy){savePending=true;return;}
 const id=user()?.id,e=epoch;if(!id||!access)return;saveBusy=true;toast('Saving privately…');
 try{do{savePending=false;const doc=savedDocument();const r=await client().rpc('save_pro_notebook',{p_document:doc,p_revision:revision});if(epoch!==e||user()?.id!==id)return;
 if(r.error){if(r.error.code==='40001')saveConflict=true;throw Error(r.error.code==='40001'?'Your notebook changed on another device. Reload before saving.':'Save failed. Keep this screen open and tap Retry save.');}revision=r.data;}while(savePending);toast('Saved to your account');}
 catch(err){if(epoch===e){toast(err.message);screen?.querySelector('.pr-feedback')?.insertAdjacentHTML('beforeend',button(saveConflict?'Reload account':'Retry save',saveConflict?'reload':'retrySave','','linkbtn'));}}
 finally{if(epoch===e)saveBusy=false;}
}

async function loadAccount(force=false){
 if(loadPromise)return loadPromise;if(loaded&&!force){render();return;}
 const id=user()?.id,e=epoch;if(!id)return;loading=true;errorText='';render();
 loadPromise=(async()=>{try{
 const c=client();if(!c)throw Error('Please sign in again.');
 const [status,prefs]=await Promise.all([c.rpc('has_tablerec_pro'),c.from('user_dining_preferences').select('needs,notes').eq('user_id',id).maybeSingle()]);
 if(epoch!==e||user()?.id!==id)return;if(status.error||prefs.error)throw Error('Check your connection and try again.');
 access=status.data===true;state.needs=prefs.data?.needs||[];state.dietNotes=prefs.data?.notes||'';
 if(access){const results=await Promise.all([
 c.from('pro_notebooks').select('document,revision').eq('user_id',id).maybeSingle(),c.rpc('pro_recipe_summary'),
 c.from('happy_hour_offers').select('*').eq('active',true).gte('expires_on',new Date().toISOString().slice(0,10)),
 c.from('restaurants').select('id,name,cuisine,city,address').order('name').limit(500)]);
 if(epoch!==e||user()?.id!==id)return;if(results.some(r=>r.error))throw Error('Some account data could not load. Try again.');
 const [book,summary,deals,places]=results;const doc=book.data?.document||{};revision=book.data?.revision||0;saveConflict=false;
 state.savedDeals=Array.isArray(doc.savedDeals)?doc.savedDeals:[];state.savedRecipes=Array.isArray(doc.savedRecipes)?doc.savedRecipes:[];state.trip=doc.trip||state.trip;state.journal=Array.isArray(doc.journal)?doc.journal:[];
 state.recipeSummary=summary.data||{count:0,categories:[]};DEALS=deals.data||[];VENUES=(places.data||[]).map(v=>({...v,area:v.city||v.address||'Location not listed',cuisine:v.cuisine||'Restaurant',price:0,data:{}}));
 }loaded=true;updateEntries();
 }catch(err){if(epoch===e)errorText=err.message;}finally{if(epoch===e){loading=false;loadPromise=null;render();}}})();return loadPromise;
}
async function spinLive(){
 const e=epoch,id=user()?.id;if(recipeRunning||!access||!id)return;recipeRunning=true;
 const b=screen.querySelector('[data-pro-action="spin"]');if(b){b.disabled=true;b.textContent='RUNNING…';}
 const stage=screen.querySelector('#prRecipeReel');stage?.classList.add('running');stage?.setAttribute('data-spinning','true');stage?.setAttribute('aria-busy','true');stage?.scrollIntoView?.({behavior:root.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
 try{
  const r=await client().rpc('spin_pro_recipe_round',{p_collection:state.recipeCollection,p_category:state.category==='All'?null:state.category,p_query:state.recipeQuery,p_exclude:state.recipeHistory.slice(-50)});
  if(epoch!==e||user()?.id!==id)return;if(r.error)throw Error('Recipe search is unavailable. Try again.');
  const candidates=r.data?.candidates||[];if(!candidates.length){render();toast('No recipes match these choices. Try another category or Explore everything.');return;}
  const pick=candidates[0],reduced=root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  for(let i=0;i<(reduced?1:19);i++){
   if(epoch!==e||user()?.id!==id||view!=='recipes')return;
   const option=i===(reduced?0:18)?pick:candidates[(i+1)%candidates.length];
   const name=screen.querySelector('#prRollingName'),category=screen.querySelector('#prRollingCategory'),next=screen.querySelector('#prRollingNext');
   if(name)name.textContent=option.name;if(category)category.textContent=option.category;if(next)next.textContent=i===18?'Dinner is decided.':candidates[(i+2)%candidates.length].name;
   if(!reduced)await new Promise(resolve=>setTimeout(resolve,55+i*9));
  }
  if(epoch!==e||user()?.id!==id||view!=='recipes')return;
  state.recipe=pick;state.recipeHistory.push(pick.id);go('recipe',pick.id);
 }catch(err){if(epoch===e){render();toast(err.message);}}
 finally{if(epoch===e){recipeRunning=false;const button=screen?.querySelector('[data-pro-action="spin"]');if(button){button.disabled=false;button.textContent='RUN IT · COOK AT HOME';}screen?.querySelector('#prRecipeReel')?.classList.remove('running');screen?.querySelector('#prRecipeReel')?.removeAttribute('data-spinning');screen?.querySelector('#prRecipeReel')?.removeAttribute('aria-busy');}}
}

async function savePreferences(clear=false){const e=epoch,id=user()?.id;if(!id)return;if(!clear&&!screen.querySelector('#prDietConsent')?.checked){toast('Please agree to private storage before saving.');return;}
 const needs=clear?[]:[...screen.querySelectorAll('[data-need]:checked')].map(x=>x.dataset.need);const notes=clear?'':screen.querySelector('#prDietNotes').value.trim();
 const b=screen.querySelector('[data-pro-action="saveNeeds"]');if(b)b.disabled=true;
 try{const r=clear?await client().from('user_dining_preferences').delete().eq('user_id',id):await client().from('user_dining_preferences').upsert({user_id:id,needs,notes,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(epoch!==e||user()?.id!==id)return;if(r.error)throw Error('Your dining needs could not be saved. Try again.');state.needs=needs;state.dietNotes=notes;go('needs');updateEntries();toast(clear?'Dining needs cleared':'Dining needs saved privately');}catch(err){if(epoch===e){toast(err.message);if(b)b.disabled=false;}}
}
function toast(s){const el=screen?.querySelector('.pr-feedback');if(el)el.textContent=s;}
function action(act,val){
 if(act==='retrySave')return void saveNotebook();if(act==='reload')return void loadAccount(true);if(act==='back')return back();if(act==='go')return go(val);if(act==='retry')return void loadAccount(true);if(act==='venue')return go('venue',val);if(act==='recipe')return go('recipe',val);
 if(act==='searchDining')return void searchDining();
 if(act==='mapArea')return void searchHappyArea();if(act==='resetMap'){state.happyCenter=null;render();return;}
 if(act==='saveNeeds')return void savePreferences();if(act==='clearNeeds')return void savePreferences(true);
 if(act==='filter'){state.filter=val;render();return;}
 if(!access)return;
 if(act==='collection'){if(recipeRunning)return;state.recipeCollection=val==='all'?'all':'everyday';state.category='All';render();return;}
 if(act==='again'){go('recipes');return void spinLive();}
 if(act==='spin')return void spinLive();
 if(act==='openRestaurant'){if(typeof root.openRestaurantById==='function')root.openRestaurantById(val);return;}
 if(act==='directions'){const d=DEALS.find(d=>d.id===val);if(d)root.open('https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(d.address),'_blank','noopener,noreferrer');return;}
 if(act==='deal'){state.savedDeals=state.savedDeals.includes(val)?state.savedDeals.filter(x=>x!==val):[...state.savedDeals,val];}
 if(act==='saveRecipe'){const r=state.recipe?.id===val?state.recipe:state.savedRecipes.find(r=>r.id===val);if(r&&!state.savedRecipes.some(x=>x.id===val))state.savedRecipes.push(r);}
 render();void saveNotebook();
}
function bind(){
 screen.addEventListener('keydown',e=>{if(e.target.id==='prSearch'&&e.key==='Enter'){e.preventDefault();void searchDining();}});
 screen.addEventListener('click',e=>{const b=e.target.closest('[data-pro-action]');if(b&&screen.contains(b))action(b.dataset.proAction,b.dataset.value);});
 screen.addEventListener('input',e=>{if(e.target.id==='prSearch'){state.query=e.target.value;state.diningResults=null;state.diningMessage='';state.diningSearching=false;state.diningRequest++;const start=e.target.selectionStart;render();const q=screen.querySelector('#prSearch');q.focus();q.setSelectionRange(start,start);}});
 screen.addEventListener('change',e=>{
  const t=e.target;
  if(t.id==='prGroupOn'){state.groupOn=t.checked;render();}
  if(recipeRunning)return;
  if(t.id==='prCategory'){state.category=t.value;return;}
  if(t.id==='prRecipeQuery'){state.recipeQuery=t.value;return;}
  if(t.id==='prRadius'){state.radius=+t.value;render();return;}
  if(t.id==='prOpen'){state.openNow=t.value==='Active now';render();return;}
  if(t.id==='prDay'){state.day=t.value;render();}
  if(t.id==='prBudget'){state.budget=+t.value;render();}
 });
}
function entry(title,sub,next,ico){const n=document.createElement('div');n.className='card pr-profile-entry';n.dataset.trProEntry=next;n.innerHTML='<button type="button"><span class="pr-feature-icon">'+icon(ico||next)+'</span><span class="pr-row-text"><span class="pr-feature-kicker">A LITTLE MORE WITH PRO</span><strong>'+esc(title)+'</strong><small>'+esc(sub)+'</small><span class="pr-feature-cta">'+(next==='happy'?'Find your next happy hour':next==='recipes'?'Let’s pick dinner':'Make it personal')+' ↗</span></span>'+icon('arrow')+'</button>';n.querySelector('button').addEventListener('click',()=>open(next));return n;}
function updateEntries(){document.querySelectorAll('[data-tr-pro-entry]').forEach(n=>{const k=n.dataset.trProEntry;const b=n.querySelector('.pr-badge');if(b)b.textContent=loaded?(access?'PRO':'PRO · LOCKED'):'PRO';const kkr=n.querySelector('.pr-feature-kicker');if(kkr)kkr.textContent=loaded&&!access?'UNLOCK WITH TABLEREC PRO':'A LITTLE MORE WITH PRO';if(k==='needs'&&loaded){const small=n.querySelector('small');if(small)small.textContent=state.needs.length?state.needs.length+' private dining needs saved':'Allergies, medical needs, and dietary preferences';}});}
function mountEntries(){
 const add=(parent,title,sub,next,ico,anchor)=>{if(!parent||parent.querySelector('[data-tr-pro-entry="'+next+'"]'))return;const n=entry(title,sub,next,ico);if(anchor?.parentNode===parent)parent.insertBefore(n,anchor);else parent.append(n);};
 const p=document.getElementById('profile');add(p,'Your Dining Needs','Allergies, medical needs, and dietary preferences','needs','needs',document.getElementById('profileBadgeFolderCard'));
 const discover=document.getElementById('discover');add(discover,'Happy Hours','Good food. Better timing. Find nearby deals worth heading out for.','happy','happy',document.getElementById('locationCard'));
 const run=document.querySelector('#whereToEatModal .tr-modal-scroll');add(run,'Cook at home','Tacos tonight? Pasta? Let thousands of recipes surprise you.','recipes','recipes',run?.firstElementChild);
 updateEntries();
}
function sync(){
 if(clearing||signingOut)return;const u=user(),next=u?.id||null;if(next!==account){account=next;clear();}
 mountEntries();if(!u)return;
 if(!screen){screen=document.createElement('section');screen.id='pro';screen.className='screen pr-screen';(document.querySelector('.app')||document.body).append(screen);bind();}
}
const dishStyle=document.createElement('style');dishStyle.textContent='.pr-dish h2{font-size:22px;line-height:1.2;margin:0 0 12px}.pr-dish p{font-size:13px;line-height:1.6;color:var(--muted)}.pr-dish details{margin-top:14px}.pr-dish summary{font-size:13px;font-weight:800;cursor:pointer;padding:10px 0}.pr-dish .pr-evidence strong{display:block;margin-bottom:6px}.pr-dish a{overflow-wrap:anywhere}';document.head.append(dishStyle);
const style=document.createElement('style');style.textContent="\n.pr-screen{padding-bottom:14px}.pr-screen *{min-width:0}.pr-screen h1,.pr-screen h2,.pr-screen h3{color:var(--ink)}.pr-screen .page-title{margin:0;font-size:28px;letter-spacing:-.8px}.pr-title{display:flex;align-items:center;gap:10px;margin:4px 0 18px}.pr-backline{font-size:12px;padding:12px 0 8px}.pr-backline button{padding:6px 8px 6px 0}.pr-screen svg,.pr-profile-entry svg{width:22px;height:22px;flex:none;vertical-align:middle}.pr-backline svg{width:24px;height:24px}.pr-screen .card{background:var(--card);box-shadow:none}.pr-heading{margin:12px 0 20px}.pr-heading h2{font-size:24px;line-height:1.15;letter-spacing:-.5px;margin:0 0 8px}.pr-heading p,.pr-membership p{font-size:14px;line-height:1.5;color:var(--muted);margin:0}.pr-membership{background:var(--heroSoft);border:1px solid var(--line);border-radius:20px;padding:20px;margin:12px 0 22px}.pr-membership h2{font-size:25px;line-height:1.12;letter-spacing:-.7px;margin:20px 0 10px;max-width:280px}.pr-member-top{display:flex;justify-content:space-between;align-items:center;gap:8px}.pr-badge{display:inline-block;font-size:10px;font-weight:850;padding:5px 8px;border-radius:7px;background:var(--card2);color:var(--muted);line-height:1.3}.pr-orange{background:var(--gold);color:var(--accentText)}.pr-concern{background:var(--card2);color:var(--red);border:1px solid var(--red)}.pr-group{border:1px solid var(--line);border-radius:17px;overflow:hidden;background:var(--card);margin:12px 0 18px}.pr-group>.field{margin:14px}.pr-feature,.pr-row{display:flex;align-items:center;gap:13px;width:100%;padding:18px 15px;border:0;border-bottom:1px solid var(--line);background:transparent;color:var(--ink);text-align:left}.pr-feature:last-child,.pr-row:last-child{border-bottom:0}.pr-feature>svg,.pr-row>svg{width:16px;color:var(--muted)}.pr-feature-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:13px;background:var(--card2);color:var(--gold);flex:none}.pr-row-text{flex:1;display:block}.pr-row-text strong{display:block;font-size:16px;font-weight:850}.pr-row-text small{display:block;color:var(--muted);font-size:12px;line-height:1.45;margin-top:5px}.pr-note{font-size:12px;line-height:1.55;color:var(--muted);margin:14px 2px}.pr-foot{font-size:12px;text-align:center;color:var(--muted);margin:26px 0}.pr-profile-entry{padding:0!important;background:var(--card)!important}.pr-profile-entry>button{display:flex;align-items:center;gap:12px;width:100%;padding:16px;background:transparent;border:0;color:var(--ink);text-align:left}.pr-profile-entry .pr-badge{font-size:8px;margin-left:5px;vertical-align:middle}.pr-profile-entry>button>svg{width:16px;color:var(--muted)}.pr-label{font-size:13px;font-weight:850;margin:25px 2px 10px;color:var(--muted)!important}.pr-choice,.pr-toggle{display:flex;gap:16px;align-items:center;justify-content:space-between;padding:15px;border-bottom:1px solid var(--line);font-size:14px;line-height:1.4}.pr-choice:last-child{border-bottom:0}.pr-choice small,.pr-toggle small{display:block;font-size:11px;color:var(--muted);margin-top:3px}.pr-choice input,.pr-toggle input{width:22px;height:22px;accent-color:var(--gold);flex:none}.pr-screen input,.pr-screen select,.pr-screen textarea{color:var(--ink);background:var(--inputBg);border:1px solid var(--line);border-radius:12px;padding:12px;width:100%;font-size:16px;min-height:46px}.pr-screen input[type=checkbox]{width:22px;min-height:22px}.pr-segments{display:flex;gap:8px;margin:14px 0;overflow-x:auto;padding-bottom:3px}.pr-screen button{touch-action:manipulation}.pr-screen .primary{color:var(--accentText);min-height:48px}.pr-screen .primary svg{width:18px;margin-right:5px}.pr-screen .chip.active{color:var(--accentText)}.pr-restaurant{display:block;width:100%;text-align:left;border:1px solid var(--line);border-radius:18px;padding:17px;margin:10px 0;background:var(--card);color:var(--ink)}.pr-restaurant-top{display:flex;justify-content:space-between;align-items:center;gap:8px}.pr-restaurant-top strong{font-size:18px;letter-spacing:-.3px}.pr-restaurant-top svg{width:16px;color:var(--muted)}.pr-meta{display:block;color:var(--muted);font-size:12px;margin-top:6px}.pr-dish{display:block;font-size:14px;margin:17px 0 14px}.pr-result-bottom{display:flex;justify-content:space-between;align-items:center;gap:10px}.pr-result-bottom small{font-size:9px;color:var(--muted)}.pr-dish-title{font-size:21px;line-height:1.2;margin:2px 0 12px}.pr-evidence{padding:16px 0;border-top:1px solid var(--line)}.pr-evidence>div{display:flex;justify-content:space-between;gap:10px;align-items:center}.pr-evidence strong{font-size:14px}.pr-evidence p,.pr-detail p{font-size:13px;line-height:1.6;margin:8px 0;color:var(--muted)}.pr-evidence small{display:block;font-size:10px;line-height:1.6;color:var(--muted)}.pr-detail{padding:16px;border-bottom:1px solid var(--line);font-size:14px;line-height:1.5}.pr-detail:last-child{border-bottom:0}.pr-inline-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pr-inline-fields .field{margin:0}.pr-group>.pr-inline-fields{padding:0 14px 14px}.pr-eyebrow{font-size:10px;font-weight:850;letter-spacing:.7px;color:var(--gold);margin-bottom:12px}.pr-deal h2{font-size:22px;margin:0 0 5px}.pr-deal p{color:var(--muted);font-size:14px}.pr-deal-bottom{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:24px}.pr-deal-bottom strong{font-size:24px}.pr-deal-bottom small{display:block;font-weight:400;font-size:12px;color:var(--muted);margin-top:4px}.pr-wheel-card{text-align:center;border:1px solid var(--line);background:var(--card);border-radius:20px;padding:25px 20px;margin-top:18px}.pr-wheel{width:132px;height:132px;background:var(--heroSoft);border:1px solid var(--line);border-radius:50%;margin:2px auto 24px;display:grid;place-items:center;color:var(--gold)}.pr-wheel svg{width:78px;height:78px}.pr-wheel-card h2{font-size:24px;letter-spacing:-.6px;margin:0}.pr-wheel-card p{font-size:13px;color:var(--muted);margin:10px 0 24px}.pr-spinning{animation:pr-spin .65s ease-in-out}.pr-method{display:flex;gap:14px;padding:16px;border-bottom:1px solid var(--line)}.pr-method:last-child{border:0}.pr-method b{background:var(--card2);color:var(--gold);width:28px;height:28px;border-radius:50%;display:grid;place-items:center;flex:none;font-size:12px}.pr-method p{font-size:14px;line-height:1.6;margin:2px 0}.pr-budget{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--line);border-radius:17px;background:var(--card2);padding:18px;gap:10px}.pr-budget small{display:block;font-size:9px;letter-spacing:.5px;color:var(--muted)}.pr-budget strong{display:block;font-size:30px;letter-spacing:-1px;margin-top:7px}.pr-stop{padding:16px;border-bottom:1px solid var(--line)}.pr-stop>.pr-inline-fields{margin-top:14px}.pr-stop>.linkbtn{padding:12px 0 0}.pr-add-stop{display:block;padding:16px;color:var(--gold);font-size:13px;font-weight:800}.pr-add-stop select{margin-top:8px;font-weight:400}.pr-journal-intro p{font-size:14px;line-height:1.5}.pr-empty{text-align:center;padding:40px 18px;color:var(--muted)}.pr-empty>svg{width:42px;height:42px;color:var(--gold)}.pr-empty h2{font-size:21px;color:var(--ink);letter-spacing:-.4px}.pr-empty p{font-size:14px;line-height:1.6}.pr-preserve{white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;line-height:1.6}.pr-feedback:not(:empty){margin:14px 0;padding:12px 14px;background:var(--card2);border-radius:12px;font-size:13px;color:var(--ink)}.pr-screen button:focus-visible,.pr-profile-entry button:focus-visible{outline:2px solid var(--gold);outline-offset:2px}.pr-screen h1:focus{outline:none}@keyframes pr-spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.pr-spinning{animation:none}}@media(min-width:600px){.pr-membership{padding:25px}.pr-feature{padding:20px}.pr-results{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pr-restaurant{margin:0}}";document.head.append(style);
const extra=document.createElement('style');extra.textContent=`
.pr-profile-entry{border-radius:18px!important;margin:14px 0!important}.pr-feature-icon{background:var(--heroSoft)!important}.pr-recipe-intro{padding:8px 2px 14px}.pr-recipe-intro h2{font-size:30px;letter-spacing:-1px;line-height:1.1;margin:8px 0 12px}.pr-recipe-intro p{color:var(--muted);font-size:14px;line-height:1.6}.pr-coverage{display:flex;align-items:center;gap:8px;margin:20px 0 14px;flex-wrap:wrap}.pr-coverage>span:last-child{color:var(--muted);font-size:11px}.pr-source-card>p{font-size:13px;line-height:1.6;color:var(--muted)}.pr-source-card h2{font-size:22px;margin:0 0 12px}.pr-source-card>a{font-size:12px}.pr-source{font-size:11px;color:var(--muted);display:flex;align-items:center;justify-content:space-between;margin-top:14px;border-top:1px solid var(--line);padding-top:10px}.pr-consent{display:flex;gap:10px;font-size:12px;line-height:1.6;margin:18px 0}.pr-consent input{width:22px!important;flex:none}.pr-screen .pr-wheel{background:conic-gradient(from 15deg,var(--gold) 0 60deg,var(--card2) 60deg 120deg,var(--gold) 120deg 180deg,var(--card2) 180deg 240deg,var(--gold) 240deg 300deg,var(--card2) 300deg);width:160px;height:160px;box-shadow:inset 0 0 0 7px var(--card),0 0 0 1px var(--line);color:var(--ink)}.pr-wheel svg{background:var(--card);border-radius:50%;padding:15px;width:85px!important;height:85px!important}.pr-screen .pr-wheel-card{background:var(--heroSoft)}.pr-profile-entry>button{min-height:85px}.pr-profile-entry>button:hover{background:var(--heroSoft)}.pr-screen .pr-deal{padding:20px}.pr-screen .pr-deal h2{font-size:24px;line-height:1.15}.pr-screen .pr-deal>p{line-height:1.6}.pr-screen .pr-deal-bottom a{font-size:12px;text-align:right}.pr-screen .pr-deal button{min-height:40px}.pr-screen .pr-empty{padding:40px 16px}.pr-screen .pr-result-bottom{margin-top:15px}.pr-screen .linkbtn{min-height:40px}.pr-screen .pr-backline{position:sticky;top:0;z-index:5;background:var(--bg)}
`;document.head.append(extra);
const polish=document.createElement('style');polish.textContent=`
.pr-profile-entry{position:relative;overflow:hidden;border:1.5px solid var(--gold)!important;box-shadow:0 5px 0 var(--line)!important;background:linear-gradient(120deg,var(--heroSoft),var(--card))!important}.pr-profile-entry:before{content:'';position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--gold)}.pr-profile-entry>button{padding:22px 18px!important;gap:16px!important}.pr-profile-entry .pr-feature-icon{width:56px;height:56px;border-radius:18px;border:1px solid var(--line);transform:rotate(-7deg)}.pr-profile-entry .pr-feature-icon svg{width:30px;height:30px;transform:rotate(7deg)}.pr-feature-kicker{display:block;font-size:9px;font-weight:950;letter-spacing:.12em;color:var(--gold);margin-bottom:7px}.pr-profile-entry .pr-row-text strong{font-size:23px;line-height:1.1;letter-spacing:-.6px}.pr-feature-cta{display:block;color:var(--gold);font-size:12px;font-weight:900;margin-top:12px}.pr-happy-map{height:270px;overflow:hidden;border-radius:18px;border:1px solid var(--line);margin-top:20px;background:var(--card2)}.pr-happy-map>.muted{padding:18px}.pr-map-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.pr-map-actions button{min-height:44px}.pr-collection{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 12px}.pr-collection button{min-height:42px}.pr-recipe-stage{margin:22px 0 0;text-align:center;min-height:205px;padding:26px 20px!important;border:2px solid var(--gold)!important;border-radius:22px!important;background:var(--heroSoft)!important;box-shadow:0 6px 0 var(--line)!important}.pr-recipe-stage .where-stage-name{font-size:30px;line-height:1.15;min-height:72px;display:grid;place-items:center;overflow-wrap:anywhere}.pr-reel-neighbors{border-top:1px solid var(--line);padding-top:14px;margin-top:18px;font-size:12px;color:var(--muted);min-height:30px}.pr-spin-footer{padding:20px 0 5px}.pr-spin-footer button{width:100%;min-height:54px;font-weight:950;letter-spacing:.06em;font-size:15px}.pr-recipe-intro h2{font-size:34px}.pr-screen>.primary+.primary{margin-top:10px}@media(prefers-reduced-motion:reduce){.pr-recipe-stage.running .where-stage-name{animation:none}}
`;document.head.append(polish);
const origRender=root.renderProfile;if(typeof origRender==='function')root.renderProfile=function(){const r=origRender.apply(this,arguments);sync();return r;};
const origSignOut=root.signOut;if(typeof origSignOut==='function')root.signOut=async function(){signingOut=true;clear();account=null;try{return await origSignOut.apply(this,arguments);}finally{signingOut=false;sync();}};
const origBack=root.tableRecBack;if(typeof origBack==='function')root.tableRecBack=function(){const parent=({edit:'needs',venue:'needs',recipe:'recipes'})[view];if(screen?.classList.contains('active')&&parent){go(parent);return true;}return origBack.apply(this,arguments);};
root.TableRecProPreview={open,close:back,sync,reload:()=>loadAccount(true)};
setInterval(sync,1000);sync();
})(window);