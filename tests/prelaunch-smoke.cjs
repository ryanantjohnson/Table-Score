const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {JSDOM,VirtualConsole}=require(process.env.TABLE_REC_JSDOM_MODULE||'jsdom');
const source=fs.readFileSync('index.html','utf8');
for(const [,script] of source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(script);
assert(!/[\u0080-\u009f\ufffd]/.test(source));
assert(!source.includes('tablerechelp@gmail.com'));
const errors=[];
const vc=new VirtualConsole();
vc.on('jsdomError',e=>{if(e.type!=='css parsing')errors.push(e.message);});
const dom=new JSDOM(source,{url:'https://test.tablerec.co/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
 w.scrollTo=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){},addListener(){}});w.alert=()=>{};w.confirm=()=>true;w.TextDecoder=TextDecoder;w.TextEncoder=TextEncoder;
 w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.CSS={escape:s=>s};w.fetch=async()=>({ok:false,json:async()=>({})});
 w.__calls=[];w.__throwAuth=false;w.__signup={data:{user:{id:'test-user'},session:null},error:null};w.__signin={data:{user:{id:'test-user',email:'tester@example.com'}},error:null};
 function query(table){return new Proxy({}, {get(target,key){if(key==='then')return resolve=>resolve({data:[],error:null,count:0});return (...args)=>{if(['insert','update','delete'].includes(key))w.__calls.push({table,action:key,args});if(key==='single'||key==='maybeSingle')return Promise.resolve({data:table==='ratings'?{id:'rating-test',overall_score:8.5,verified_visit:false}:null,error:null});return query(table);};}});}
 w.__db={from:query,rpc:async()=>({data:[],error:null}),functions:{invoke:async()=>({data:{restaurants:[]},error:null})},auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signUp:async options=>{w.__calls.push({action:'signup',options});if(w.__throwAuth)throw Error('offline');return w.__signup;},signInWithPassword:async()=>{if(w.__throwAuth)throw Error('offline');return w.__signin;},resend:async()=>({error:null}),signOut:async()=>({error:null})}};
 w.supabase={createClient:()=>w.__db};
 w.tableRecGeo={available:true,permission:async()=> 'unknown',getCurrentPosition:(success,error)=>error({code:1}),watchPosition:()=>1,clearWatch:()=>{}};
}});
const w=dom.window;
const originalBrowseCoords=w.getTableRecBrowseCoords;
(async()=>{
 await new Promise(resolve=>setTimeout(resolve,100));
 assert.deepEqual(errors,[],'DOM boots without uncaught errors');
 w.openAccount();w.setAccountMode('signup');
 for(const [id,value] of Object.entries({acctFirstName:'Test',acctLastName:'Diner',acctUsername:'test_diner',acctEmail:'tester@example.com',acctPassword:'TestPass1!'}))w.document.getElementById(id).value=value;
 w.document.getElementById('acctLegalAccepted').checked=true;
 await w.signUp();
 assert.equal(w.document.getElementById('accountModeTitle').textContent,'Check your email');
 assert.equal(w.document.getElementById('accountVerificationEmail').textContent,'tester@example.com');
 assert(w.document.getElementById('accountModal').classList.contains('verifying'));
 assert.equal(w.document.getElementById('acctPassword').value,'');
 assert(w.document.getElementById('resendConfirmationBtn').disabled);
 w.closeAccount();w.openAccount();assert(w.document.getElementById('accountModal').classList.contains('verifying'));
 w.returnToAccountSignIn();
 w.eval(`window.__actionDone=false;afterAuth=()=>{window.__actionDone=true};refreshUserData=async()=>{};loadFoodBadges=async()=>{};loadSecretRewards=async()=>{};loadProgressRewards=async()=>{};queueFirstSignInLocation=()=>{};`);
 w.document.getElementById('acctPassword').value='TestPass1!';await w.signIn();assert(w.__actionDone);assert.equal(w.pendingVerificationEmail(),'');
 w.eval('currentUser=null');w.openAccount();w.__throwAuth=true;w.document.getElementById('acctPassword').value='TestPass1!';await w.signIn();assert(!w.document.getElementById('accountPrimaryBtn').disabled);
 w.__throwAuth=false;w.__signin={data:null,error:{code:'email_not_confirmed'}};await w.signIn();assert(w.document.getElementById('accountModal').classList.contains('verifying'));
 const r={tablescore:8.3,avg_score_30d:8.4,ratings_30d:3,unique_raters_30d:3,unique_raters_7d:2,hot_eligible:true};
 assert(w.hotRankingEligible(r));for(const change of [{tablescore:6.32},{avg_score_30d:7.99},{unique_raters_7d:1},{tablescore:null},{hot_eligible:false}])assert(!w.hotRankingEligible({...r,...change}));
 assert.equal(w.tableRecDisplayText('â\x9c\x93'),'✓');assert.equal(w.tableRecDisplayText('ð\x9f\x8d\x94'),'🍔');assert.equal(w.tableRecDisplayText('café déjà vu'),'café déjà vu');assert.equal(w.esc('<script>'),'&lt;script&gt;');
 assert.equal(w.eval('STARTER_BADGES.map(b=>badgeMarkup(b.slug)).length'),19);
 for(const slug of w.secretBadgeSlugSet()){
   const markup=w.rewardVisualMarkup(slug);assert(markup.includes('<svg'));assert(!/[\u0080-\u009f\ufffd]/.test(markup));
 }
 assert(!w.topRankingEligible({rating_count:10,unique_rater_count:4,ranking_eligible:true}));
 assert(w.topRankingEligible({rating_count:10,unique_rater_count:5}));
 assert.equal(w.tableRecMilesBetween(null,null,30,-97),null);
 assert.equal(w.tableRecMilesBetween(0,0,0,0),0);
 let requests=0;w.tableRecGeo.getCurrentPosition=success=>{requests++;success({coords:{latitude:30.6,longitude:-97.7,accuracy:20}});};
 w.eval('updateAutomaticBrowseArea=async()=>{};');
 w.localStorage.setItem('ts_location_mode','current');w.localStorage.setItem('ts_location_enabled','1');w.localStorage.setItem('ts_lat','30');w.localStorage.setItem('ts_lon','-97');
 for(const state of ['prompt','denied','unknown']){w.tableRecGeo.permission=async()=>state;await w.resumeGrantedTableScoreLocation();assert.equal(requests,0);}
 w.tableRecGeo.permission=async()=> 'granted';await w.resumeGrantedTableScoreLocation();assert.equal(requests,0);
 w.localStorage.setItem('ts_location_mode','manual');await w.resumeGrantedTableScoreLocation();assert.equal(requests,0);
 // A fresh verification fix must not replace a deliberately selected browsing city.
 w.localStorage.setItem('ts_lat','40');w.localStorage.setItem('ts_lon','-100');
 w.tableRecGeo.watchPosition=success=>{setTimeout(()=>success({coords:{latitude:30,longitude:-97,accuracy:20}}),0);return 7;};
 const usable=w.tableRecUsableGpsCoords;
 assert(!usable({latitude:0,longitude:0}));assert(!usable({latitude:null,longitude:null}));
 assert(!usable({latitude:91,longitude:30}));assert(usable({latitude:0,longitude:30}));
 w.tableRecGeo.watchPosition=success=>{setTimeout(()=>{
   success({coords:{latitude:0,longitude:0,accuracy:5}});
   success({coords:{latitude:30,longitude:-97,accuracy:20}});
 },0);return 8;};
 const fresh=await w.getFreshTableScoreCoords();assert.equal(fresh.latitude,30);assert.equal(w.localStorage.getItem('ts_lat'),'40');
 // A photo failure after insert must never ask for a second rating submission.
 w.eval(`currentUser={id:'test-user'};selectedRestaurantId='restaurant-test';selectedRestaurantName='Test Restaurant';getScores=()=>[8,8,8,8,8,8,8];findOrCreateRestaurant=async()=>({id:'restaurant-test',name:'Test Restaurant'});getFreshTableScoreCoords=async()=>{throw Error('denied')};pendingRatingPhotos=[{}];uploadRatingPhotos=async()=>{throw Error('upload failure')};openRestaurantById=async()=>{};loadRestaurantStats=async()=>{};`);
 w.document.getElementById('rateRestaurant').value='Test Restaurant';const alerts=[];w.alert=message=>alerts.push(message);await w.submitRating();
 // Rejecting an unverified save keeps the draft and must not insert a rating.
 const priorCount=w.__calls.filter(c=>c.table==='ratings'&&c.action==='insert').length;
 w.confirm=()=>false;
 w.document.getElementById('rateRestaurant').value='Still Here Restaurant';
 await w.submitRating();
 assert.equal(w.__calls.filter(c=>c.table==='ratings'&&c.action==='insert').length,priorCount);
 assert.equal(w.document.getElementById('rateRestaurant').value,'Still Here Restaurant');
 assert(!w.document.getElementById('submitBtn').disabled);w.confirm=()=>true;
 const inserts=w.__calls.filter(c=>c.table==='ratings'&&c.action==='insert');assert.equal(inserts.length,1);assert.equal(inserts[0].args[0].visit_latitude,null);assert(alerts.some(a=>a.includes('Your rating was saved')));
 assert(!w.document.getElementById('submitBtn').disabled);
 // Follow approval by a signed-in user must mutate their request and avoid auth prompts.
 w.eval(`loadSocialCounts=async()=>{};loadPendingFollowRequests=async()=>{};loadNotifications=async()=>{};showFollowRequests=async()=>{};renderProfile=()=>{};`);
 w.__db.from=table=>{const proxy=new Proxy({}, {get(target,key){if(key==='then')return resolve=>resolve({data:[{follower_id:'follower',status:'accepted'}],error:null});return()=>proxy;}});return proxy;};
 await w.approveFollowRequest('follower',{fromNotifications:true});
 assert(!alerts.some(a=>/sign in again/i.test(a)));
 // Location regressions: a legacy enabled flag cannot suppress native permission,
 // and a manual GPS refresh must leave an active movement watch behind.
 w.eval(`currentUser={id:'location-upgrade-test'};tableRecLocationIntroducedUsers.clear();
 tableScoreLocation=null;tableScoreLocationWatchId=null;
 reverseGeocodeBrowseArea=async()=> 'Round Rock, TX';loadRestaurantStats=async()=>{};
 window.__watchStarts=0;window.__originalStartWatch=startTableScoreLocationWatch;
 startTableScoreLocationWatch=async()=>{window.__watchStarts++};`);
 w.localStorage.setItem('ts_location_enabled','1');w.localStorage.setItem('ts_location_mode','current');
 w.localStorage.setItem('tr_location_intro_v1_location-upgrade-test','1');
 w.tableRecGeo.permission=async()=> 'prompt';let firstFixes=0;
 w.eval('getTableRecBrowseCoords=async()=>{window.__firstFixRequested=true;return {latitude:30.5,longitude:-97.7}}');
 await w.introduceFirstSignInLocation();assert(w.__firstFixRequested);
 w.eval('getFreshTableScoreCoords=async()=>({latitude:30.6,longitude:-97.6,accuracy:12})');
 const beforeWatch=w.__watchStarts;assert(await w.refreshLiveBrowseLocation());
 assert(w.__watchStarts>beforeWatch);assert.equal(w.currentTableScoreCoords().latitude,30.6);
 // The ordinary Enable/Refresh control must switch out of deliberate city mode.
 w.localStorage.setItem('ts_location_mode','manual');
 w.tableRecGeo.getCurrentPosition=success=>success({coords:{latitude:30.7,longitude:-97.5,accuracy:10}});
 w.enableTableScoreLocation();assert.equal(w.localStorage.getItem('ts_location_mode'),'current');
 // A transient GPS error preserves the last fix and schedules a foreground retry.
 let retry;const realTimer=w.setTimeout;
 w.setTimeout=(callback,delay)=>{if(delay===15000){retry=callback;return 987;}return realTimer(callback,delay)};
 const savedCoords=w.currentTableScoreCoords();w.tableScoreLocationError({code:3});
 assert.deepEqual(w.currentTableScoreCoords(),savedCoords);assert.equal(typeof retry,'function');
 const starts=w.__watchStarts;retry();assert(w.__watchStarts>starts);
 w.setTimeout=realTimer;
 // Exercise the real watch startup after cold launch and app resume.
 w.eval('startTableScoreLocationWatch=window.__originalStartWatch;stopTableScoreLocationWatch();tableScoreLocation=null;');
 for(const key of ['ts_lat','ts_lon','ts_location_enabled'])w.localStorage.removeItem(key);
 w.localStorage.setItem('ts_location_mode','current');
 let watches=0,oneShots=0,cleared=0,positionCallback;
 w.tableRecGeo.permission=async()=> 'granted';
 w.tableRecGeo.getCurrentPosition=(success,failure)=>{oneShots++;failure({code:3})};
 w.tableRecGeo.watchPosition=success=>{watches++;positionCallback=success;return watches+100};
 w.tableRecGeo.clearWatch=()=>{cleared++};
 await Promise.all([w.resumeGrantedTableScoreLocation(),w.resumeGrantedTableScoreLocation()]);
 assert.equal(watches,1,'OS grant starts one watch even without saved flags');
 assert.equal(oneShots,0,'movement watch does not depend on a one-shot fix');
 positionCallback({coords:{latitude:30.6,longitude:-97.6,accuracy:12}});
 positionCallback({coords:{latitude:30.8,longitude:-97.4,accuracy:10}});
 assert.equal(w.currentTableScoreCoords().latitude,30.8,'movement updates the current position');
 Object.defineProperty(w.document,'hidden',{configurable:true,value:true});
 w.document.dispatchEvent(new w.Event('visibilitychange'));assert.equal(cleared,1);
 Object.defineProperty(w.document,'hidden',{configurable:true,value:false});
 w.document.dispatchEvent(new w.Event('visibilitychange'));
 await new Promise(resolve=>setTimeout(resolve,0));assert.equal(watches,2,'foreground resumes tracking');
 w.stopTableScoreLocationWatch();
 w.tableRecGeo.permission=async()=> 'denied';await w.resumeGrantedTableScoreLocation();
 assert.equal(watches,2,'denied permission does not restart or prompt');
 w.tableRecGeo.permission=async()=> 'prompt';await w.resumeGrantedTableScoreLocation();
 assert.equal(watches,2,'automatic resume does not request permission again');
 w.tableRecGeo.permission=async()=> 'granted';w.localStorage.setItem('ts_location_mode','manual');
 await w.resumeGrantedTableScoreLocation();assert.equal(watches,2,'manual browsing stays manual');
 w.localStorage.setItem('ts_location_mode','current');
 w.tableRecGeo.getCurrentPosition=success=>success({coords:{latitude:0,longitude:0,accuracy:5}});
 await assert.rejects(originalBrowseCoords(),/unusable location/);
 assert.deepEqual(errors,[]);
 dom.window.close();
 // Test native bridge without invoking browser geolocation.
 let called=[];let watchCallback;let resolveWatch;
 const native={navigator:{geolocation:{getCurrentPosition(){throw Error('WebView API must not run');}}},Capacitor:{isNativePlatform:()=>true,isPluginAvailable:()=>true,nativePromise:async(name,method,options)=>{called.push(method);return method==='checkPermissions'?{location:'granted'}:{coords:{latitude:1,longitude:2}};},nativeCallback:(name,method,options,cb)=>{watchCallback=cb;return 'native-watch-1';}}};
 vm.runInNewContext(fs.readFileSync('app-platform.js','utf8'),{window:native});
 assert.equal(await native.tableRecGeo.permission(),'granted');
 await new Promise(resolve=>native.tableRecGeo.getCurrentPosition(pos=>{assert.equal(pos.coords.latitude,1);resolve();},assert.fail,{}));
 const watch=native.tableRecGeo.watchPosition(()=>{},assert.fail,{});native.tableRecGeo.clearWatch(watch);await new Promise(r=>setTimeout(r,0));assert(called.includes('clearWatch'));
 console.log('PASS: 30+ assertions covering syntax, DOM boot, signup, verification persistence, cooldown, auth callback, auth failure, rankings, badges, encoding, permission states, manual location, rating/photo failure, follow approval, and native bridge');
})().catch(e=>{console.error(e);dom.window.close();process.exit(1);});
