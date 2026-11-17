const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const fixture=require('./pro-fixture.json');
const source=fs.readFileSync('native/pro-preview.js','utf8');
new(require('node:vm').Script)(source);
const recipe=fixture.recipes[0];
function setup({enabled=true,active=true,delay=0}={}){
 const dom=new JSDOM('<html><head></head><body><div class="app"><header class="topbar">TableRec</header><section id="profile" class="screen active"><div id="profileBadges"><span>Existing badge</span></div><div id="profileBadgeFolderCard"></div></section><section id="discover" class="screen"><div id="locationCard"></div><div id="discoverPeopleCard"></div></section><section id="saved" class="screen"><div id="savedList"></div></section></div><nav class="nav">Main navigation</nav><section id="whereToEatModal" class="hidden"><div class="tr-modal-scroll"><div>Free Run It</div></div></section><section id="settingsModal" class="hidden"><div class="tr-modal-scroll"></div></section></body></html>',{url:'https://app.test',runScripts:'outside-only'});
 const w=dom.window;w.scrollTo=()=>{};w.matchMedia=()=>({matches:true});w.currentUser={id:'a'};w.renderProfile=()=>{};const stack=[];
 w.__maps=[];w.loadGoogleMaps=async()=>{};w.google={maps:{Map:class{constructor(host,opts){this.center=opts.center;this.ready=Promise.resolve();w.__maps.push(this);}getCenter(){return {lat:()=>this.center.lat,lng:()=>this.center.lng};}async syncState(){}dispose(){this.disposed=true;}},Marker:class{setMap(){}addListener(){}}}};
 w.currentTableScoreCoords=()=>({latitude:30.53,longitude:-97.69});
 w.showScreen=id=>{const prev=w.document.querySelector('.screen.active')?.id;if(prev!==id)stack.push(prev);w.document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id===id));if(id==='profile')w.renderProfile();};
 w.tableRecBack=()=>{const prev=stack.pop()||'profile';w.document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id===prev));return true;};
 w.signOut=async()=>{w.currentUser=null;};w.closeSettings=()=>{};w.closeWhereToEat=()=>{};
 w.__books={};w.__prefs={};w.__writes=[];w.__error=false;w.__conflict=false;
 const result=async data=>{if(delay)await new Promise(r=>setTimeout(r,delay));return w.__error?{error:{code:'offline'}}:{data,error:null};};
 w.db={rpc:async(name,args)=>{
  const id=w.currentUser?.id;
  if(name==='has_tablerec_pro')return result(active);
  if(name==='pro_recipe_summary')return result(fixture.summary);
  if(name==='spin_pro_recipe_round'){w.__spin=args;return result({candidates:[recipe],count:1});}
  if(name==='save_pro_notebook'){
   w.__writes.push({id,args:JSON.parse(JSON.stringify(args))});
   if(w.__conflict)return {error:{code:'40001'}};
   const prev=w.__books[id];if((prev?.revision||0)!==args.p_revision)return {error:{code:'40001'}};
   const book={document:JSON.parse(JSON.stringify(args.p_document)),revision:args.p_revision+1};
   const r=await result(book.revision);if(!r.error)w.__books[id]=book;return r;
  }throw Error(name);
 },from(table){let action='select',value,owner;const q=new Proxy({}, {get(_,key){if(key==='then')return (resolve,reject)=>{let data;if(table==='pro_notebooks')data=w.__books[owner]||null;else if(table==='user_dining_preferences'){if(action==='upsert')w.__prefs[value.user_id]=value;if(action==='delete')delete w.__prefs[owner];data=w.__prefs[owner]||null;}else if(table==='restaurants')data=fixture.places;else if(table==='happy_hour_offers')data=fixture.offers;else throw Error(table);return result(data).then(resolve,reject);};return(...args)=>{if(key==='eq'&&args[0]==='user_id')owner=args[1];if(['upsert','delete'].includes(key)){action=key;value=args[0];}return q;};}});return q;}};
 w.eval(fs.readFileSync('native/dining-sources.js','utf8'));w.tableRecProPreviewEnabled=enabled;w.eval(source);return dom;
}
const flush=()=>new Promise(r=>setTimeout(r,15));
(async()=>{
 let d=setup({enabled:false});assert(!d.window.TableRecProPreview);d.window.close();
 d=setup();let w=d.window,doc=w.document;
 const click=(act,val)=>{const b=[...doc.querySelectorAll('#pro [data-pro-action]')].find(b=>b.dataset.proAction===act&&(val===undefined||b.dataset.value===val));assert(b,'Missing '+act+' '+val);b.click();};
 const open=async v=>{w.TableRecProPreview.open(v);await flush();};
 const change=(id,value)=>{const el=doc.getElementById(id);assert(el,id);el.value=value;el.dispatchEvent(new w.Event('change',{bubbles:true}));};
 assert(doc.querySelector('#discover [data-tr-pro-entry="happy"]'));
 assert(doc.querySelector('#profile [data-tr-pro-entry="needs"]'));
 assert(doc.querySelector('#whereToEatModal [data-tr-pro-entry="recipes"]'));
 assert(!doc.querySelector('[data-tr-pro-entry="journal"]'));assert(!doc.querySelector('[data-tr-pro-entry="trip"]'));
 assert(!doc.querySelector('#settingsModal [data-tr-pro-entry]'));
 await open('recipes');assert(doc.querySelector('#pro').textContent.includes('Everyday favorites'));click('collection','all');assert(doc.querySelector('#pro').textContent.includes('3,796'));click('collection','everyday');
 assert(!doc.querySelector('#pro iframe'));assert(doc.querySelector('.topbar'));assert(doc.querySelector('.nav'));
 change('prCategory',fixture.summary.categories[0]);change('prRecipeQuery','lemon');click('spin');await flush();
 assert.equal(w.__spin.p_collection,'everyday');assert.equal(w.__spin.p_query,'lemon');assert.equal(w.__spin.p_category,fixture.summary.categories[0]);
 assert(doc.querySelector('#pro').textContent.includes(recipe.name));assert(doc.querySelector('#pro a[href*="creativecommons"]'));
 click('saveRecipe');await flush();assert.equal(w.__books.a.document.savedRecipes[0].id,recipe.id);
 await open('needs');click('go','edit');
 for(const n of ['Peanut','Milk','Wheat'])[...doc.querySelectorAll('[data-need]')].find(x=>x.dataset.need===n).checked=true;
 click('saveNeeds');await flush();assert(!w.__prefs.a,'Consent required');
 doc.getElementById('prDietConsent').checked=true;click('saveNeeds');await flush();assert.equal(w.__prefs.a.needs.length,3);
 click('filter','sources');assert(w.document.querySelector('#pro').textContent.includes('Chick-fil-A'));assert(w.document.querySelector('#pro').textContent.includes('refined peanut oil'));click('filter','documented');assert.equal(doc.querySelectorAll('.pr-restaurant').length,0);
 click('filter','all');click('venue',fixture.places[0].id);assert(doc.querySelector('#pro').textContent.includes('No reviewed evidence'));
 assert(doc.querySelector('#pro').textContent.includes('arachis/peanut'));
 await open('happy');assert(doc.getElementById('prHappyMap'));const map=w.__maps.at(-1);assert(map);map.center={lat:0,lng:0};click('mapArea');await flush();assert.equal(doc.querySelectorAll('.pr-deal').length,0);click('resetMap');await flush();assert(map.disposed);change('prDay','Mon');change('prBudget','0');assert(doc.querySelectorAll('.pr-deal').length>0);
 assert(doc.querySelector('.pr-deal a').href.startsWith('https://'));
 change('prBudget','5');assert(!doc.querySelector('#pro').textContent.includes('Half-price starters'));
 change('prBudget','0');click('deal',fixture.offers[0].id);await flush();assert(w.__books.a.document.savedDeals.includes(fixture.offers[0].id));
 // Legacy private content is retained without offering retired features.
 w.__books.a.document.journal=[{notes:'Legacy private note'}];await w.TableRecProPreview.reload();
 click('deal',fixture.offers[0].id);await flush();assert.equal(w.__books.a.document.journal[0].notes,'Legacy private note');
 w.__conflict=true;click('deal',fixture.offers[0].id);await flush();assert(doc.querySelector('.pr-feedback').textContent.includes('another device'));w.__conflict=false;
 await open('home');assert(!doc.querySelector('#pro').textContent.includes('Trip Planner'));assert(!doc.querySelector('#pro').textContent.includes('Dining Journal'));
 await open('trip');assert(doc.querySelector('#pro').textContent.includes('More ways to find your favorite'));
 assert.equal(doc.getElementById('profileBadges').textContent,'Existing badge');
 w.currentUser={id:'b'};w.TableRecProPreview.sync();await open('recipes');assert(!doc.querySelector('#pro').textContent.includes('Legacy private note'));
 await w.signOut();assert(!doc.getElementById('pro'));assert(doc.querySelector('#discover [data-tr-pro-entry]'));d.window.close();
 d=setup({active:false});w=d.window;w.TableRecProPreview.open('recipes');await flush();assert(w.document.querySelector('#pro').textContent.includes('purchases are not open'));assert(!w.document.querySelector('#pro [data-pro-action="spin"]'));d.window.close();
 d=setup({delay:30});w=d.window;w.TableRecProPreview.open('recipes');w.currentUser={id:'new-account'};w.TableRecProPreview.sync();await new Promise(r=>setTimeout(r,80));assert(!w.document.getElementById('pro').textContent.includes('Private note'));d.window.close();
 console.log('PASS: Pro placement, server access, real recipe collection, attributed recipes, consent/private preferences, honest unknowns, source-linked specials, persistent saves, conflicts, and account isolation.');
})().catch(e=>{console.error(e);process.exit(1);});
