const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM,VirtualConsole}=require('jsdom');
const errors=[];let callback,marks=[],fail=false;const invoked=[];
const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type!=='css parsing')errors.push(e.message)});
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://test.tablerec.co/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
 w.scrollTo=()=>{};w.alert=()=>{};w.confirm=()=>false;w.matchMedia=()=>({matches:false,addEventListener(){}});w.HTMLElement.prototype.scrollIntoView=()=>{};w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.CSS={escape:s=>s};w.fetch=async()=>({ok:false,json:async()=>({})});
 function q(){return new Proxy({}, {get(_,k){if(k==='then')return resolve=>resolve({data:[],error:null});return()=>k==='single'||k==='maybeSingle'?Promise.resolve({data:null,error:null}):q()}})}
 w.supabase={createClient:()=>({from:q,rpc:async(name,args)=>name==='get_account_contributor_status'?{data:marks,error:fail?{message:'offline'}:null}:{data:[],error:null},functions:{invoke:async(name)=>{invoked.push(name);return {data:{restaurants:[]}}}},auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:cb=>{callback=cb;return {data:{subscription:{unsubscribe(){}}}}},signOut:async()=>({error:null})}})};
 w.tableRecGeo={available:true,permission:async()=> 'denied',getCurrentPosition:(s,f)=>f({code:1}),watchPosition:()=>1,clearWatch(){}};
}});
const w=dom.window,$=id=>w.document.getElementById(id);
(async()=>{
 await new Promise(r=>setTimeout(r,100));
 await w.tableRecInvokeRestaurant('nearby-restaurants',{body:{mode:'search',q:'food'}});assert.equal(invoked.at(-1),'guest-restaurants');
 await w.tableRecInvokeRestaurant('where-to-eat',{body:{}});assert.equal(invoked.at(-1),'guest-where-to-eat');
 await assert.rejects(w.tableRecInvokeRestaurant('nearby-restaurants',{body:{mode:'create'}}),/Sign in/);
 // Browsing doesn't ask for an account; mutation entry points still do.
 w.openSettings();assert(!$('settingsModal').classList.contains('hidden'));assert(!$('guestSettingsCard').classList.contains('hidden'));assert($('accountModal').classList.contains('hidden'));
 for(const el of w.document.querySelectorAll('#settingsModal [data-account-only]'))assert(el.classList.contains('hidden'));
 w.setDisplayMode('dark');assert($('settingsModal').contains(w.document.querySelector('[data-display-mode="dark"]')));
 w.closeSettings();w.openRestaurantFinder();assert(!$('nearbyRestaurantModal').classList.contains('hidden'));assert($('accountModal').classList.contains('hidden'));w.closeNearbyRestaurantPicker();
 w.startRating();assert(!$('accountModal').classList.contains('hidden'));w.closeAccount();
 w.renderFollowingFeedGuest();assert($('followingFeed').textContent.includes('Explore Restaurants'));
 w.showScreen('discover');w.showScreen('profile');assert($('profileName').textContent.includes('Guest'));
 // Account switch refreshes settings visibility, and logging out clears progress.
 w.eval("currentUser={id:'user-a',email:'a@example.com'};profile={id:'user-a',display_name:'A'};trSyncAccountState();");
 await w.tableRecInvokeRestaurant('nearby-restaurants',{body:{mode:'search'}});assert.equal(invoked.at(-1),'nearby-restaurants');
 marks=[{user_id:'user-a',marks:['first_round'],qualifying_ratings:249,distinct_restaurants:50,earned:false}];
 w.openSettings();assert($('guestSettingsCard').classList.contains('hidden'));
 await w.loadAccountMarks(['user-a']);w.renderContributorProgress();assert($('chefsTableApplicationStatus').textContent.includes('249 / 250'));
 const row={id:'rating-a',user_id:'user-a',restaurant_id:'rest-a',overall_score:8,created_at:new Date().toISOString(),restaurants:{name:'Restaurant'},verified_visit:true};
 const holder=w.document.createElement('div');holder.innerHTML=w.feedRatingCard(row,{id:'user-a',display_name:'Diner',username:'diner'});w.document.body.append(holder);await w.applyAccountMarks(holder);
 assert.equal(holder.querySelectorAll('.mark-first_round').length,1);assert.equal(holder.querySelectorAll('.mark-chefs_table').length,0);assert(holder.textContent.includes('Verified Visit'));
 // The earned flag comes only from server response, not count or legacy profile marks.
 w.eval("accountMarkCache.clear();accountMarkLoadedAt.clear()");marks=[{user_id:'user-a',marks:['first_round','chefs_table'],qualifying_ratings:250,distinct_restaurants:50,earned:true}];await w.applyAccountMarks(holder);assert.equal(holder.querySelectorAll('.account-mark').length,2);
 holder.querySelector('.mark-chefs_table').click();assert(w.document.querySelector('.account-mark-pop').textContent.includes('250 qualifying Verified Visit'));w.document.querySelector('.account-mark-close').click();
 await w.applyAccountMarks(holder);assert.equal(holder.querySelectorAll('.account-mark').length,2,'idempotent decoration');
 w.eval("accountMarkCache.clear();accountMarkLoadedAt.clear()");marks=[{user_id:'user-a',marks:['chefs_table'],qualifying_ratings:999,distinct_restaurants:60,earned:false}];await w.applyAccountMarks(holder);assert.equal(holder.querySelectorAll('.mark-chefs_table').length,0,'legacy grants and client counts cannot grant it');
 // Pending backend/unavailable progress cannot impersonate zero or award a badge.
 w.eval("accountMarkCache.clear();accountMarkLoadedAt.clear();contributorProgressCache.clear()");fail=true;await w.loadAccountMarks(['user-a']);w.renderContributorProgress();assert($('contributorProfileProgress').textContent.includes('unavailable'));fail=false;
 w.eval("currentUser=null;trSyncAccountState();");w.openSettings();assert(!$('guestSettingsCard').classList.contains('hidden'));assert($('contributorProfileCard').classList.contains('hidden'));
 // Inspect layout timing: scroll must happen before any pool lookup or option cycle.
 let order=[];w.eval("loadWhereEatPool=async()=>{window.__order.push('load');return [{id:'r',name:'One'}]};sleepWhere=async()=>{window.__order.push('cycle')};renderWhereEatPick=()=>{};");w.__order=order;
 const scroller=w.document.querySelector('.where-eat-sheet .tr-modal-scroll');scroller.scrollTo=()=>order.push('scroll');w.openWhereToEat();await w.spinWhereToEat();
 assert(order.indexOf('scroll')<order.indexOf('load'));assert(order.filter(x=>x==='scroll').length>=2);assert(order.indexOf('scroll')<order.indexOf('cycle'));assert(!$('whereEatSpinBtn').disabled);
 // Dealer's Choice also scrolls before its cuisine cycle.
 order.length=0;await w.animateWhereCuisine('Mexican');assert.equal(order[0],'scroll');
 assert.deepEqual(errors,[]);dom.window.close();console.log('PASS: guest browsing/settings and guarded rating, account transitions, feed badge rendering/eligibility/fallback, and animation-before-selection scrolling');
})().catch(e=>{console.error(e);dom.window.close();process.exit(1)});
