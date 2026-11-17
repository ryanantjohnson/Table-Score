/* TableRec Pro: integrated app screens. Tester flag does not grant a paid entitlement. */
(function(root){
'use strict';
if(root.tableRecProPreviewEnabled!==true)return;
var DAY=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
var CATALOG=[
 {title:'Food allergies',items:['Peanut','Milk','Wheat','Egg','Soy','Sesame','Tree nuts','Fish','Crustacean shellfish','Molluscs','Mustard','Celery','Lupin']},
 {title:'Medical dietary needs',items:['Celiac / gluten','Lactose intolerance','Alpha-gal (manual review)','Low-FODMAP (manual review)','Nutrient limits (manual review)']},
 {title:'Religious requirements',items:['Halal','Kosher']},
 {title:'Personal preferences',items:['Vegan','Vegetarian','Pescatarian','No pork','No alcohol']}
];
function evidence(status,note,more){return Object.assign({status:status,note:note,source:'Fictional restaurant response',checked:'2026-11-10',scope:'Named sample dish only'},more||{});}
var VENUES=[
 {id:'juniper',name:'Juniper Table',area:'East Austin',cuisine:'Seasonal',price:24,art:'leaf',dish:'Roasted vegetable rice bowl',ingredients:'Rice, roasted squash, greens, lemon, olive oil. Fictional ingredient record.',oil:'Olive oil; processing not recorded.',prep:'Separate utensils reported. Shared kitchen. No inspection performed.',data:{
 'Peanut':evidence('documented','Sample response reports no peanut ingredients in this bowl.'),
 'Milk':evidence('documented','Sample response reports no milk ingredients in this bowl.'),
 'Wheat':evidence('unknown','Supplier details for seasoning are missing.'),
 'Celiac / gluten':evidence('unknown','Seasoning and preparation information incomplete.'),
 'Vegan':evidence('documented','Sample ingredient record is plant-based.'),
 'Vegetarian':evidence('documented','Sample ingredient record is plant-based.'),
 'Halal':evidence('unknown','No certification or preparation evidence supplied.')
 }},
 {id:'ember',name:'Ember & Grain',area:'North Austin',cuisine:'Grill',price:28,art:'sun',dish:'Crispy cauliflower plate',ingredients:'Cauliflower, wheat flour, peanut oil, seasoning. Fictional ingredient record.',oil:'Arachis (peanut) oil. Refining / processing unknown.',prep:'Shared fryer reported; other fryer ingredients unconfirmed.',data:{
 'Peanut':evidence('conflict','Peanut-derived oil reported; processing unknown. Shared fryer.'),
 'Wheat':evidence('conflict','Wheat flour reported in the coating.'),
 'Milk':evidence('unknown','Seasoning subingredients not provided.'),
 'Celiac / gluten':evidence('conflict','Wheat coating reported.'),
 'Vegetarian':evidence('unknown','Seasoning ingredients and fryer use not fully documented.')
 }},
 {id:'cedar',name:'Cedar Kitchen',area:'Central Austin',cuisine:'Mediterranean',price:22,art:'bowl',dish:'Lemon chicken & rice',ingredients:'Chicken, rice, olive oil, lemon, salt. Fictional complete ingredient statement.',oil:'Olive oil; no peanut-derived oil reported for the named dish.',prep:'Dedicated utensils and cleaned preparation surface reported. Shared kitchen. Confirm before ordering.',data:{
 'Peanut':evidence('documented','No peanut ingredients reported; named dish and oil described.'),
 'Milk':evidence('documented','No milk ingredients reported in the named dish.'),
 'Wheat':evidence('documented','No wheat ingredients reported in the named dish.'),
 'Celiac / gluten':evidence('unknown','Gluten handling has not been documented.'),
 'Sesame':evidence('unknown','Sesame handling and cross-contact information missing.'),
 'Halal':evidence('documented','Fictional supplier certificate covers chicken only; the restaurant is not certified.',{scope:'Chicken supplier only'}),
 'No pork':evidence('documented','Named dish has no pork ingredients reported.'),
 'Vegetarian':evidence('conflict','Chicken is a listed ingredient.'),
 'Vegan':evidence('conflict','Chicken is a listed ingredient.')
 }},
 {id:'marlow',name:'Marlow Social',area:'South Austin',cuisine:'Small plates',price:19,art:'glass',dish:'Sesame noodle bowl',ingredients:'Noodles, tahini dressing, vegetables. Fictional incomplete ingredient record.',oil:'Gingelly (sesame) oil reported in the dressing.',prep:'Shared equipment. No separate preparation procedure supplied.',data:{
 'Sesame':evidence('conflict','Tahini and gingelly oil are reported.'),
 'Wheat':evidence('unknown','Noodle ingredients not supplied.'),
 'Peanut':evidence('documented','Old menu reports no peanut ingredients.',{checked:'2026-08-01'}),
 'Milk':evidence('conflicting','Old guide says no milk; a newer sample response lists whey.'),
 'Vegan':evidence('conflicting','Plant-based claim conflicts with a sample whey listing.')
 }}
];
function evaluate(venue,needs){
 var rows=needs.map(function(n){
  var e=venue.data[n]||evidence('unknown','No reviewed sample evidence for this requirement.');
  var age=(Date.now()-Date.parse(e.checked+'T00:00:00Z'))/86400000;
  return {need:n,e:e,stale:age>30,manual:n.indexOf('(manual review)')>=0};
 });
 var conflicts=rows.filter(function(r){return r.e.status==='conflict'||r.e.status==='conflicting';}).length;
 var gaps=rows.filter(function(r){return r.e.status!=='documented'||r.stale||r.manual;}).length;
 return {rows:rows,conflicts:conflicts,gaps:gaps,complete:needs.length>0&&gaps===0};
}
function eligibleDeals(deals,day,budget){return deals.filter(function(d){return d.days.indexOf(day)>=0&&d.cost<=budget;});}
var DEALS=[
 {id:'d1',venue:'juniper',title:'Early bites',offer:'Two sample small plates',cost:12,days:['Mon','Tue','Wed','Thu','Fri'],time:'4–6 PM'},
 {id:'d2',venue:'marlow',title:'The after-work table',offer:'Sample appetizer special',cost:8,days:['Mon','Tue','Wed','Thu','Fri'],time:'3–6 PM'},
 {id:'d3',venue:'cedar',title:'Weekend mezze',offer:'Sample mezze trio',cost:14,days:['Sat','Sun'],time:'2–5 PM'},
 {id:'d4',venue:'ember',title:'Golden-hour snacks',offer:'Sample snack plate',cost:10,days:['Tue','Wed','Thu','Fri','Sat'],time:'4–7 PM'}
];
var RECIPES=[
 {id:'r1',name:'Lemon herb rice bowl',category:'Quick',mins:25,servings:2,ingredients:['1 cup dry rice','1 zucchini','1 bell pepper','2 tbsp olive oil','1 lemon','Herbs and seasoning to taste'],steps:['Cook rice according to its package directions.','Chop vegetables and sauté in olive oil until tender.','Combine with rice, lemon and herbs. Review every ingredient and preparation method for your needs.']},
 {id:'r2',name:'Creamy tomato pasta',category:'Comfort',mins:30,servings:2,ingredients:['200 g pasta','1 cup crushed tomatoes','1/4 cup cream','1 tbsp olive oil','Basil'],steps:['Cook pasta according to package directions.','Warm tomatoes and oil, then stir in cream.','Combine and serve with basil. This sample includes milk and may include wheat.']},
 {id:'r3',name:'Roasted vegetable tray',category:'Quick',mins:35,servings:3,ingredients:['2 potatoes','2 carrots','1 bell pepper','2 tbsp olive oil','Seasoning to taste'],steps:['Heat oven to 425°F.','Cut vegetables into similar pieces and toss with oil and seasoning.','Roast until tender, turning during cooking. Check packaged seasonings and preparation requirements.']},
 {id:'r4',name:'Sesame cucumber noodles',category:'Comfort',mins:20,servings:2,ingredients:['200 g noodles','1 cucumber','1 tbsp sesame oil','2 tbsp tahini','Lemon juice'],steps:['Cook noodles according to the package.','Mix tahini, sesame oil and lemon, adding water to loosen.','Toss with noodles and sliced cucumber. This sample includes sesame; noodle ingredients vary.']}
];

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=(name)=>{const paths={needs:'M12 21s-8-5-8-12a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 7-8 12-8 12Z',happy:'M5 3h14l-7 9-7-9Zm7 9v9m-4 0h8',recipes:'M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1',trip:'M4 4h6v6H4V4Zm10 10h6v6h-6v-6ZM7 10v7h7',journal:'M5 3h14v18H5V3Zm4 5h6m-6 4h6m-6 4h4',arrow:'m9 5 7 7-7 7',back:'m15 5-7 7 7 7',plus:'M12 5v14M5 12h14',check:'m5 12 4 4L19 6'};return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.needs).split(/(?=M)/).map(d=>'<path d="'+d+'"/>').join('')+'</svg>';};
const initial=()=>({needs:[],group:[],groupOn:false,filter:'all',query:'',day:DAY[(new Date().getDay()+6)%7],budget:20,savedDeals:[],recipe:null,category:'All',savedRecipes:[],trip:{name:'My food trip',days:2,budget:150,stops:[]},journal:[]});
let state=initial(),account=null,screen=null,view='home',detail=null,recipeTimer=null;
const titles={home:'TableRec Pro',needs:'Dining Needs',edit:'Your dining needs',venue:'Restaurant details',happy:'Happy Hours',recipes:'Recipe Wheel',recipe:'Your recipe',trip:'Trip Planner',journal:'Dining Journal',write:'Add a visit',about:'About your access'};
const venue=id=>VENUES.find(v=>v.id===id);
function user(){try{return typeof currentUser!=='undefined'?currentUser:null;}catch(_){return null;}}
function activeNeeds(){return [...new Set([...state.needs,...(state.groupOn?state.group:[])])];}
function button(label,act,value='',cls='secondary'){return '<button type="button" class="'+cls+'" data-pro-action="'+act+'" data-value="'+esc(value)+'">'+label+'</button>';}
function row(title,sub,act,value='',ico='arrow'){return '<button type="button" class="pr-row" data-pro-action="'+act+'" data-value="'+esc(value)+'"><span class="pr-row-text"><strong>'+esc(title)+'</strong>'+(sub?'<small>'+esc(sub)+'</small>':'')+'</span>'+icon(ico)+'</button>';}
function badge(text,type=''){return '<span class="pr-badge '+type+'">'+esc(text)+'</span>';}
function note(text){return '<p class="pr-note">'+esc(text)+'</p>';}
function heading(text,sub){return '<div class="pr-heading"><h2>'+esc(text)+'</h2>'+(sub?'<p>'+esc(sub)+'</p>':'')+'</div>';}
function field(label,id,html){return '<div class="field"><label for="'+id+'">'+esc(label)+'</label>'+html+'</div>';}
function select(id,items,value){return '<select id="'+id+'">'+items.map(x=>'<option value="'+esc(x)+'"'+(String(x)===String(value)?' selected':'')+'>'+esc(x)+'</option>').join('')+'</select>';}
function go(next,id){if(!user())return;view=next;detail=id||null;render();root.scrollTo(0,0);screen.querySelector('h1')?.focus();}
function open(){sync();if(!user()||!screen)return;view='home';render();const settings=document.getElementById('settingsModal');if(settings&&!settings.classList.contains('hidden'))root.closeSettings?.();root.showScreen('pro');}
function back(){const parent={edit:'needs',venue:'needs',recipe:'recipes',write:'journal'}[view];if(parent)return go(parent);if(view!=='home')return go('home');if(!root.tableRecBack?.())root.showScreen('profile');}
function clear(){clearTimeout(recipeTimer);recipeTimer=null;state=initial();const wasActive=screen?.classList.contains('active');screen?.remove();screen=null;if(wasActive)root.showScreen('profile');document.querySelectorAll('[data-tr-pro-entry]').forEach(n=>n.remove());}
function render(){
 if(!screen)return;
 const body={home:homeView,needs:needsView,edit:editView,venue:venueView,happy:happyView,recipes:recipesView,recipe:recipeView,trip:tripView,journal:journalView,write:writeView,about:aboutView}[view]();
 screen.innerHTML='<div class="backline pr-backline">'+button(icon('back'),'back','','backbtn')+'<span class="muted">'+(view==='home'?'Profile':'TableRec Pro')+'</span></div><div class="pr-title"><h1 class="page-title" tabindex="-1">'+titles[view]+'</h1>'+(view==='home'?badge('PRO','pr-orange'):'')+'</div>'+body+'<div class="pr-feedback" role="status" aria-live="polite"></div>';
}
function homeView(){
 return '<div class="pr-membership"><div class="pr-member-top">'+badge('YOUR MEMBERSHIP','pr-orange')+button('Access details','go','about','linkbtn')+'</div><h2>A little more at your table.</h2><p>Make room for your needs, your plans, and your next favorite.</p></div>'+
 '<div class="pr-group">'+[
 ['Dining Needs','Find the details that matter to your table','needs'],
 ['Happy Hours','Find a little more for a little less','happy'],
 ['Recipe Wheel','Let dinner come to you','recipes'],
 ['Trip Planner','A good trip starts with a good meal','trip'],
 ['Dining Journal','Keep the details worth remembering','journal']
 ].map(([t,s,k])=>'<button class="pr-feature" data-pro-action="go" data-value="'+k+'"><span class="pr-feature-icon">'+icon(k)+'</span><span class="pr-row-text"><strong>'+t+'</strong><small>'+s+'</small></span>'+icon('arrow')+'</button>').join('')+'</div>'+
 note('Your tester access is active. Restaurant information is illustrative, and changes stay in this app session.')+
 '<div class="pr-foot">Run It stays free and unlimited for everyone.</div>';
}
function needsView(){
 const n=activeNeeds();
 let places=VENUES.filter(v=>!state.query||[v.name,v.cuisine,v.area].join(' ').toLowerCase().includes(state.query.toLowerCase()));
 if(state.filter==='documented')places=places.filter(v=>evaluate(v,n).complete);
 return '<div class="pr-group">'+row(n.length?n.length+' dining needs selected':'Make this your table',n.length?n.join(' · '):'Add allergies, medical needs, and dietary preferences','go','edit')+'</div>'+
 (state.group.length?'<label class="pr-toggle"><span>Include another diner’s needs<small>Every selected requirement is considered together</small></span><input id="prGroupOn" type="checkbox"'+(state.groupOn?' checked':'')+'></label>':'')+
 '<div class="search"><input id="prSearch" aria-label="Search collection" placeholder="Search restaurants or cuisines" value="'+esc(state.query)+'"></div>'+
 '<div class="pr-segments">'+button('All places','filter','all',state.filter==='all'?'chip active':'chip')+button('Documented details','filter','documented',state.filter==='documented'?'chip active':'chip')+'</div>'+
 note('Illustrative collection · No result guarantees suitability. Confirm ingredients, oils, preparation, and cross-contact directly with the restaurant.')+
 '<div class="pr-results">'+places.map(v=>{const e=evaluate(v,n);return '<button class="pr-restaurant" data-pro-action="venue" data-value="'+v.id+'"><span class="pr-restaurant-top"><strong>'+esc(v.name)+'</strong>'+icon('arrow')+'</span><span class="pr-meta">'+esc(v.cuisine+' · '+v.area+' · ~$'+v.price)+'</span><span class="pr-dish">'+esc(v.dish)+'</span><span class="pr-result-bottom">'+badge(!n.length?'Select your needs':e.conflicts?'Reported concern':e.complete?'Details documented':'Information needed',e.conflicts?'pr-concern':'')+'<small>Illustrative restaurant</small></span></button>';}).join('')+
 (!places.length?'<div class="pr-empty"><h2>No places with these details yet.</h2><p>Try all places to see which information is missing.</p>'+button('Show all places','filter','all','primary')+'</div>':'')+'</div>';
}
function editView(){
 return heading('What matters at your table?','Choose as many as you need. These selections stay private in this app session.')+
 CATALOG.map((g,i)=>'<h3 class="pr-label">'+esc(g.title)+'</h3><div class="pr-group">'+g.items.map((n,j)=>'<label class="pr-choice"><span>'+esc(n.replace(' (manual review)',''))+(n.includes('manual review')?'<small>Individual review required</small>':'')+'</span><input type="checkbox" data-need="'+esc(n)+'"'+(state.needs.includes(n)?' checked':'')+'></label>').join('')+'</div>').join('')+
 field('Another diner’s needs (optional)','prOther',select('prOther',['None',...CATALOG.flatMap(g=>g.items)],state.group[0]||'None'))+
 note('This is a starting catalog, not coverage for every condition or ingredient. Oils, derivatives, shared equipment, and certification scope need separate evidence.')+
 button('Save dining needs','saveNeeds','','primary');
}
function venueView(){
 const v=venue(detail);if(!v)return needsView();const e=evaluate(v,activeNeeds());
 return heading(v.name,v.cuisine+' · '+v.area)+badge('ILLUSTRATIVE RESTAURANT')+
 '<div class="card"><h2 class="pr-dish-title">'+esc(v.dish)+'</h2><p class="pr-note">Evidence applies to this dish or the stated certificate scope, not the whole restaurant.</p>'+
 (e.rows.length?e.rows.map(r=>'<div class="pr-evidence"><div><strong>'+esc(r.need)+'</strong>'+badge(r.stale?'Outdated information':r.manual?'Individual review':r.e.status==='documented'?'Documented':r.e.status==='unknown'?'Unknown':'Reported concern',r.e.status.includes('conflict')?'pr-concern':'')+'</div><p>'+esc(r.e.note)+'</p><small>'+esc(r.e.source+' · '+r.e.checked+' · '+r.e.scope)+'</small></div>').join(''):note('Choose dining needs to view the relevant evidence.'))+'</div>'+
 '<h3 class="pr-label">Ingredients & preparation</h3><div class="pr-group">'+[['Ingredients',v.ingredients],['Oils & derivatives',v.oil],['Cross-contact & equipment',v.prep]].map(([t,s])=>'<div class="pr-detail"><strong>'+t+'</strong><p>'+esc(s)+'</p></div>').join('')+'</div>'+
 note('Menus and kitchen practices change. Contact the restaurant before ordering. Missing information never means an ingredient or risk is absent.')+button('Add to trip','addStop',v.id,'primary');
}
function happyView(){
 const deals=eligibleDeals(DEALS,state.day,state.budget);
 return '<div class="pr-inline-fields">'+field('Day','prDay',select('prDay',DAY,state.day))+field('Up to','prBudget',select('prBudget',[10,15,20,30,50],state.budget))+'</div>'+note('Illustrative specials · Confirm hours and prices. Offers are not filtered for dietary needs.')+
 deals.map(d=>{const v=venue(d.venue);return '<article class="card pr-deal"><div class="pr-eyebrow">'+esc(d.time)+' · '+esc(state.day)+'</div><h2>'+esc(v.name)+'</h2><p>'+esc(d.title)+'</p><div class="pr-deal-bottom"><strong>$'+d.cost+' <small>'+esc(d.offer)+'</small></strong>'+button(state.savedDeals.includes(d.id)?'Saved':'Save','deal',d.id,'chip'+(state.savedDeals.includes(d.id)?' active':''))+'</div></article>';}).join('')+
 (!deals.length?'<div class="pr-empty"><h2>No specials in this collection.</h2><p>Try a different day or budget.</p></div>':'')+
 (state.savedDeals.length?'<h3 class="pr-label">Saved specials</h3><div class="pr-group">'+state.savedDeals.map(id=>{const d=DEALS.find(x=>x.id===id);return row(venue(d.venue).name,d.title+' · '+d.time,'deal',id,'check');}).join('')+'</div>':'');
}
function recipesView(){
 return heading('What sounds good tonight?','A little inspiration for your own kitchen.')+
 '<div class="pr-segments">'+['All','Quick','Comfort'].map(c=>button(c,'category',c,'chip'+(state.category===c?' active':''))).join('')+'</div>'+
 '<div class="pr-wheel-card"><div class="pr-wheel" aria-hidden="true">'+icon('recipes')+'</div><h2>Give dinner a spin.</h2><p>Pick a mood. We’ll pick a recipe.</p>'+button('Spin the Recipe Wheel','spin','','primary')+'</div>'+
 note('Recipes are not matched to your dietary profile. Check every ingredient and preparation method.')+
 (state.savedRecipes.length?'<h3 class="pr-label">Your recipe collection</h3><div class="pr-group">'+state.savedRecipes.map(id=>{const r=RECIPES.find(x=>x.id===id);return row(r.name,r.mins+' min · '+r.servings+' servings','recipe',id);}).join('')+'</div>':'');
}
function recipeView(){
 const r=RECIPES.find(x=>x.id===detail)||state.recipe;if(!r)return recipesView();
 return '<div class="pr-eyebrow">'+esc(r.category)+' · '+r.mins+' MIN · '+r.servings+' SERVINGS</div>'+heading(r.name,'Check suitability for your needs before cooking.')+
 '<h3 class="pr-label">Ingredients</h3><div class="pr-group">'+r.ingredients.map(x=>'<div class="pr-detail">'+esc(x)+'</div>').join('')+'</div>'+
 '<h3 class="pr-label">Method</h3><div class="pr-group">'+r.steps.map((x,i)=>'<div class="pr-method"><b>'+(i+1)+'</b><p>'+esc(x)+'</p></div>').join('')+'</div>'+button(state.savedRecipes.includes(r.id)?'Saved to your recipes':'Save recipe','saveRecipe',r.id,'primary');
}
function tripView(){
 const total=state.trip.stops.reduce((a,s)=>a+s.cost,0);
 return '<div class="pr-group">'+field('Trip name','prTripName','<input id="prTripName" maxlength="60" value="'+esc(state.trip.name)+'">')+'<div class="pr-inline-fields">'+field('Days','prDays',select('prDays',[1,2,3,4,5],state.trip.days))+field('Food budget ($)','prTripBudget','<input id="prTripBudget" type="number" min="0" max="100000" value="'+state.trip.budget+'">')+'</div></div>'+
 '<div class="pr-budget"><div><small>PLANNED FOOD SPEND</small><strong>$'+total.toFixed(0)+'</strong></div><div><small>'+(total>state.trip.budget?'OVER BUDGET':'REMAINING')+'</small><strong>$'+Math.abs(state.trip.budget-total).toFixed(0)+'</strong></div></div>'+
 note('Illustrative restaurant estimates exclude tax, tip, and travel. Adding a stop does not make a reservation.')+
 Array.from({length:state.trip.days},(_,i)=>'<h3 class="pr-label">Day '+(i+1)+'</h3><div class="pr-group">'+state.trip.stops.filter(s=>s.day===i+1).sort((a,b)=>a.time.localeCompare(b.time)).map(s=>'<div class="pr-stop"><strong>'+esc(venue(s.venue).name)+'</strong><div class="pr-inline-fields">'+field('Time','time'+s.id,'<input id="time'+s.id+'" type="time" data-stop="'+s.id+'" data-field="time" value="'+s.time+'">')+field('Estimate ($)','cost'+s.id,'<input id="cost'+s.id+'" type="number" min="0" max="100000" data-stop="'+s.id+'" data-field="cost" value="'+s.cost+'">')+'</div>'+button('Remove stop','removeStop',s.id,'linkbtn')+'</div>').join('')+'<label class="pr-add-stop">Add a restaurant<select aria-label="Add restaurant to day '+(i+1)+'" data-add-day="'+(i+1)+'"><option value="">Choose a place</option>'+VENUES.map(v=>'<option value="'+v.id+'">'+esc(v.name)+'</option>').join('')+'</select></label></div>').join('');
}
function journalView(){
 return '<div class="pr-journal-intro"><p class="muted">The meals, the company, the little details.</p>'+button(icon('plus')+' Add a visit','go','write','primary')+'</div>'+
 note('Private to this app session. Entries are not posted to your feed and disappear when the app reloads. Avoid sensitive health details.')+
 (state.journal.length?state.journal.map(j=>'<article class="card"><div class="pr-eyebrow">'+esc(j.date)+'</div><h2>'+esc(j.place)+'</h2><p><strong>'+esc(j.dish)+'</strong></p><p class="pr-preserve">'+esc(j.notes)+'</p>'+button('Delete entry','deleteJournal',j.id,'linkbtn')+'</article>').join(''):'<div class="pr-empty">'+icon('journal')+'<h2>A table worth remembering.</h2><p>Save your first visit to start your own dining journal.</p></div>');
}
function writeView(){
 return '<form id="prJournalForm">'+field('Restaurant','prPlace','<input id="prPlace" maxlength="100" required placeholder="Where did you eat?">')+field('Date','prDate','<input id="prDate" type="date" required value="'+new Date().toLocaleDateString('en-CA')+'">')+field('What did you order?','prDish','<input id="prDish" maxlength="120" required placeholder="The dish worth remembering">')+field('Your notes','prNotes','<textarea id="prNotes" rows="5" maxlength="1500" placeholder="Who you went with, what you loved, what to try next…"></textarea>')+note('Session-only private entry. Nothing is posted publicly.')+'<button class="primary" type="submit">Save visit</button></form>';
}
function aboutView(){return heading('Your Pro access is active','Personal tester access. No purchase or subscription has been activated.')+'<div class="pr-group"><div class="pr-detail"><strong>Restaurant information</strong><p>Restaurants, specials, and dietary evidence are illustrative. This collection cannot guide a real dining safety decision.</p></div><div class="pr-detail"><strong>Your changes</strong><p>Selections, saved recipes, trips, and journal entries stay in memory for this app session. Account storage is not connected.</p></div><div class="pr-detail"><strong>What comes next</strong><p>Live data, reviewed dietary rules, private account storage, and subscription integration are required before public release. Reservations are not included.</p></div></div>';}
function toast(s){const el=screen?.querySelector('.pr-feedback');if(el)el.textContent=s;}
function addStop(id,day=1){const v=venue(id);if(!v)return;state.trip.stops.push({id:Date.now()+Math.floor(Math.random()*100000),venue:id,day,time:'18:00',cost:v.price});}
function action(act,val){
 if(act==='back')return back();if(act==='go')return go(val);if(act==='venue')return go('venue',val);if(act==='recipe')return go('recipe',val);
 if(act==='filter'){state.filter=val;render();}
 if(act==='saveNeeds'){state.needs=[...screen.querySelectorAll('[data-need]:checked')].map(x=>x.dataset.need);const other=screen.querySelector('#prOther').value;state.group=other==='None'?[]:[other];state.groupOn=!!state.group.length;go('needs');toast('Dining needs updated');}
 if(act==='addStop'){addStop(val);toast('Added to day 1 of your trip');}
 if(act==='deal'){state.savedDeals=state.savedDeals.includes(val)?state.savedDeals.filter(x=>x!==val):[...state.savedDeals,val];render();}
 if(act==='category'){state.category=val;render();}
 if(act==='spin'){clearTimeout(recipeTimer);const b=screen.querySelector('[data-pro-action="spin"]');if(b){b.disabled=true;b.textContent='Choosing your recipe…';}screen.querySelector('.pr-wheel')?.classList.add('pr-spinning');recipeTimer=setTimeout(()=>{const options=RECIPES.filter(r=>state.category==='All'||r.category===state.category);state.recipe=options[Math.floor(Math.random()*options.length)];if(view==='recipes'&&user())go('recipe',state.recipe.id);},650);}
 if(act==='saveRecipe'){if(!state.savedRecipes.includes(val))state.savedRecipes.push(val);render();toast('Recipe saved');}
 if(act==='removeStop'){state.trip.stops=state.trip.stops.filter(s=>String(s.id)!==val);render();}
 if(act==='deleteJournal'){state.journal=state.journal.filter(j=>String(j.id)!==val);render();}
}
function bind(){
 screen.addEventListener('click',e=>{const b=e.target.closest('[data-pro-action]');if(b&&screen.contains(b))action(b.dataset.proAction,b.dataset.value);});
 screen.addEventListener('input',e=>{if(e.target.id==='prSearch'){state.query=e.target.value;const start=e.target.selectionStart;render();const q=screen.querySelector('#prSearch');q.focus();q.setSelectionRange(start,start);}});
 screen.addEventListener('change',e=>{
  const t=e.target;
  if(t.id==='prGroupOn'){state.groupOn=t.checked;render();}
  if(t.id==='prDay'){state.day=t.value;render();}
  if(t.id==='prBudget'){state.budget=+t.value;render();}
  if(t.id==='prTripName')state.trip.name=t.value;
  if(t.id==='prDays'){state.trip.days=+t.value;state.trip.stops.forEach(s=>s.day=Math.min(s.day,state.trip.days));render();}
  if(t.id==='prTripBudget'){state.trip.budget=Math.max(0,Math.min(100000,+t.value||0));render();}
  if(t.dataset.addDay&&t.value){addStop(t.value,+t.dataset.addDay);render();}
  if(t.dataset.stop){const s=state.trip.stops.find(x=>String(x.id)===t.dataset.stop);if(s){s[t.dataset.field]=t.dataset.field==='cost'?Math.max(0,Math.min(100000,+t.value||0)):t.value;render();}}
 });
 screen.addEventListener('submit',e=>{if(e.target.id!=='prJournalForm')return;e.preventDefault();const get=id=>screen.querySelector('#'+id).value.trim();if(!get('prPlace')||!get('prDish'))return;state.journal.unshift({id:Date.now(),place:get('prPlace'),dish:get('prDish'),notes:get('prNotes'),date:get('prDate')});go('journal');toast('Visit saved for this session');});
}
function entry(){const n=document.createElement('div');n.className='card pr-profile-entry';n.dataset.trProEntry='true';n.innerHTML='<button type="button"><span class="pr-feature-icon">'+icon('needs')+'</span><span class="pr-row-text"><strong>TableRec Pro '+badge('PRO','pr-orange')+'</strong><small>Dining needs, inspiration, and your own plans</small></span>'+icon('arrow')+'</button>';n.querySelector('button').addEventListener('click',open);return n;}
function sync(){
 const u=user(),next=u?.id||null;if(next!==account){account=next;clear();}if(!u)return;
 if(!screen){screen=document.createElement('section');screen.id='pro';screen.className='screen pr-screen';(document.querySelector('.app')||document.body).append(screen);bind();}
 const p=document.getElementById('profile'),anchor=document.getElementById('profileBadgeFolderCard');if(p&&!p.querySelector('[data-tr-pro-entry]')){const c=entry();if(anchor?.parentNode===p)p.insertBefore(c,anchor);else p.append(c);}
 const settings=document.querySelector('#settingsModal .tr-modal-scroll');if(settings&&!settings.querySelector('[data-tr-pro-entry]'))settings.prepend(entry());
}
const style=document.createElement('style');style.textContent="\n.pr-screen{padding-bottom:14px}.pr-screen *{min-width:0}.pr-screen h1,.pr-screen h2,.pr-screen h3{color:var(--ink)}.pr-screen .page-title{margin:0;font-size:28px;letter-spacing:-.8px}.pr-title{display:flex;align-items:center;gap:10px;margin:4px 0 18px}.pr-backline{font-size:12px;padding:12px 0 8px}.pr-backline button{padding:6px 8px 6px 0}.pr-screen svg,.pr-profile-entry svg{width:22px;height:22px;flex:none;vertical-align:middle}.pr-backline svg{width:24px;height:24px}.pr-screen .card{background:var(--card);box-shadow:none}.pr-heading{margin:12px 0 20px}.pr-heading h2{font-size:24px;line-height:1.15;letter-spacing:-.5px;margin:0 0 8px}.pr-heading p,.pr-membership p{font-size:14px;line-height:1.5;color:var(--muted);margin:0}.pr-membership{background:var(--heroSoft);border:1px solid var(--line);border-radius:20px;padding:20px;margin:12px 0 22px}.pr-membership h2{font-size:25px;line-height:1.12;letter-spacing:-.7px;margin:20px 0 10px;max-width:280px}.pr-member-top{display:flex;justify-content:space-between;align-items:center;gap:8px}.pr-badge{display:inline-block;font-size:10px;font-weight:850;padding:5px 8px;border-radius:7px;background:var(--card2);color:var(--muted);line-height:1.3}.pr-orange{background:var(--gold);color:var(--accentText)}.pr-concern{background:var(--card2);color:var(--red);border:1px solid var(--red)}.pr-group{border:1px solid var(--line);border-radius:17px;overflow:hidden;background:var(--card);margin:12px 0 18px}.pr-group>.field{margin:14px}.pr-feature,.pr-row{display:flex;align-items:center;gap:13px;width:100%;padding:18px 15px;border:0;border-bottom:1px solid var(--line);background:transparent;color:var(--ink);text-align:left}.pr-feature:last-child,.pr-row:last-child{border-bottom:0}.pr-feature>svg,.pr-row>svg{width:16px;color:var(--muted)}.pr-feature-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:13px;background:var(--card2);color:var(--gold);flex:none}.pr-row-text{flex:1;display:block}.pr-row-text strong{display:block;font-size:16px;font-weight:850}.pr-row-text small{display:block;color:var(--muted);font-size:12px;line-height:1.45;margin-top:5px}.pr-note{font-size:12px;line-height:1.55;color:var(--muted);margin:14px 2px}.pr-foot{font-size:12px;text-align:center;color:var(--muted);margin:26px 0}.pr-profile-entry{padding:0!important;background:var(--card)!important}.pr-profile-entry>button{display:flex;align-items:center;gap:12px;width:100%;padding:16px;background:transparent;border:0;color:var(--ink);text-align:left}.pr-profile-entry .pr-badge{font-size:8px;margin-left:5px;vertical-align:middle}.pr-profile-entry>button>svg{width:16px;color:var(--muted)}.pr-label{font-size:13px;font-weight:850;margin:25px 2px 10px;color:var(--muted)!important}.pr-choice,.pr-toggle{display:flex;gap:16px;align-items:center;justify-content:space-between;padding:15px;border-bottom:1px solid var(--line);font-size:14px;line-height:1.4}.pr-choice:last-child{border-bottom:0}.pr-choice small,.pr-toggle small{display:block;font-size:11px;color:var(--muted);margin-top:3px}.pr-choice input,.pr-toggle input{width:22px;height:22px;accent-color:var(--gold);flex:none}.pr-screen input,.pr-screen select,.pr-screen textarea{color:var(--ink);background:var(--inputBg);border:1px solid var(--line);border-radius:12px;padding:12px;width:100%;font-size:16px;min-height:46px}.pr-screen input[type=checkbox]{width:22px;min-height:22px}.pr-segments{display:flex;gap:8px;margin:14px 0;overflow-x:auto;padding-bottom:3px}.pr-screen button{touch-action:manipulation}.pr-screen .primary{color:var(--accentText);min-height:48px}.pr-screen .primary svg{width:18px;margin-right:5px}.pr-screen .chip.active{color:var(--accentText)}.pr-restaurant{display:block;width:100%;text-align:left;border:1px solid var(--line);border-radius:18px;padding:17px;margin:10px 0;background:var(--card);color:var(--ink)}.pr-restaurant-top{display:flex;justify-content:space-between;align-items:center;gap:8px}.pr-restaurant-top strong{font-size:18px;letter-spacing:-.3px}.pr-restaurant-top svg{width:16px;color:var(--muted)}.pr-meta{display:block;color:var(--muted);font-size:12px;margin-top:6px}.pr-dish{display:block;font-size:14px;margin:17px 0 14px}.pr-result-bottom{display:flex;justify-content:space-between;align-items:center;gap:10px}.pr-result-bottom small{font-size:9px;color:var(--muted)}.pr-dish-title{font-size:21px;line-height:1.2;margin:2px 0 12px}.pr-evidence{padding:16px 0;border-top:1px solid var(--line)}.pr-evidence>div{display:flex;justify-content:space-between;gap:10px;align-items:center}.pr-evidence strong{font-size:14px}.pr-evidence p,.pr-detail p{font-size:13px;line-height:1.6;margin:8px 0;color:var(--muted)}.pr-evidence small{display:block;font-size:10px;line-height:1.6;color:var(--muted)}.pr-detail{padding:16px;border-bottom:1px solid var(--line);font-size:14px;line-height:1.5}.pr-detail:last-child{border-bottom:0}.pr-inline-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pr-inline-fields .field{margin:0}.pr-group>.pr-inline-fields{padding:0 14px 14px}.pr-eyebrow{font-size:10px;font-weight:850;letter-spacing:.7px;color:var(--gold);margin-bottom:12px}.pr-deal h2{font-size:22px;margin:0 0 5px}.pr-deal p{color:var(--muted);font-size:14px}.pr-deal-bottom{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:24px}.pr-deal-bottom strong{font-size:24px}.pr-deal-bottom small{display:block;font-weight:400;font-size:12px;color:var(--muted);margin-top:4px}.pr-wheel-card{text-align:center;border:1px solid var(--line);background:var(--card);border-radius:20px;padding:25px 20px;margin-top:18px}.pr-wheel{width:132px;height:132px;background:var(--heroSoft);border:1px solid var(--line);border-radius:50%;margin:2px auto 24px;display:grid;place-items:center;color:var(--gold)}.pr-wheel svg{width:78px;height:78px}.pr-wheel-card h2{font-size:24px;letter-spacing:-.6px;margin:0}.pr-wheel-card p{font-size:13px;color:var(--muted);margin:10px 0 24px}.pr-spinning{animation:pr-spin .65s ease-in-out}.pr-method{display:flex;gap:14px;padding:16px;border-bottom:1px solid var(--line)}.pr-method:last-child{border:0}.pr-method b{background:var(--card2);color:var(--gold);width:28px;height:28px;border-radius:50%;display:grid;place-items:center;flex:none;font-size:12px}.pr-method p{font-size:14px;line-height:1.6;margin:2px 0}.pr-budget{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--line);border-radius:17px;background:var(--card2);padding:18px;gap:10px}.pr-budget small{display:block;font-size:9px;letter-spacing:.5px;color:var(--muted)}.pr-budget strong{display:block;font-size:30px;letter-spacing:-1px;margin-top:7px}.pr-stop{padding:16px;border-bottom:1px solid var(--line)}.pr-stop>.pr-inline-fields{margin-top:14px}.pr-stop>.linkbtn{padding:12px 0 0}.pr-add-stop{display:block;padding:16px;color:var(--gold);font-size:13px;font-weight:800}.pr-add-stop select{margin-top:8px;font-weight:400}.pr-journal-intro p{font-size:14px;line-height:1.5}.pr-empty{text-align:center;padding:40px 18px;color:var(--muted)}.pr-empty>svg{width:42px;height:42px;color:var(--gold)}.pr-empty h2{font-size:21px;color:var(--ink);letter-spacing:-.4px}.pr-empty p{font-size:14px;line-height:1.6}.pr-preserve{white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;line-height:1.6}.pr-feedback:not(:empty){margin:14px 0;padding:12px 14px;background:var(--card2);border-radius:12px;font-size:13px;color:var(--ink)}.pr-screen button:focus-visible,.pr-profile-entry button:focus-visible{outline:2px solid var(--gold);outline-offset:2px}.pr-screen h1:focus{outline:none}@keyframes pr-spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.pr-spinning{animation:none}}@media(min-width:600px){.pr-membership{padding:25px}.pr-feature{padding:20px}.pr-results{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pr-restaurant{margin:0}}";document.head.append(style);
const origRender=root.renderProfile;if(typeof origRender==='function')root.renderProfile=function(){const r=origRender.apply(this,arguments);sync();return r;};
const origSignOut=root.signOut;if(typeof origSignOut==='function')root.signOut=async function(){clear();account=null;return origSignOut.apply(this,arguments);};
const origBack=root.tableRecBack;if(typeof origBack==='function')root.tableRecBack=function(){if(screen?.classList.contains('active')&&view!=='home'){go(({edit:'needs',venue:'needs',recipe:'recipes',write:'journal'})[view]||'home');return true;}return origBack.apply(this,arguments);};
root.TableRecProPreview={open,close:back,sync};
setInterval(sync,1000);sync();
})(window);