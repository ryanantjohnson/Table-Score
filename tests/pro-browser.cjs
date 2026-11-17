/* Visual and mobile layout checks use the actual app HTML/CSS with isolated backend fixtures. */
const fs=require('node:fs');const path=require('node:path');const http=require('node:http');const assert=require('node:assert/strict');const {chromium}=require('playwright');
const fixture=require('./pro-fixture.json');
const smoke=fs.readFileSync('tests/pro-native-smoke.cjs','utf8');
const start=smoke.indexOf('w.currentTableScoreCoords=');const end=smoke.indexOf('w.tableRecProPreviewEnabled=enabled;');
let mock=smoke.slice(start,end).replace('w.eval(source);','').replace("w.eval(fs.readFileSync('native/dining-sources.js','utf8'));",'');
let html=fs.readFileSync('index.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
const init=`const fixture=${JSON.stringify(fixture)};const recipe=fixture.recipes[0];const active=true,delay=0;const w=window;w.currentUser={id:'visual-test'};w.renderProfile=()=>{};const stack=[];${mock}w.tableRecProPreviewEnabled=true;document.body.classList.remove('booting');document.getElementById('trLaunch')?.remove();document.documentElement.dataset.theme='warm';document.getElementById('profileName').textContent='Ryan Johnson';document.getElementById('profileUsername').textContent='@ryanjohnson';document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id==='discover'));`;
html=html.replace('</body>','<script>'+init+'</script><script>'+fs.readFileSync('native/dining-sources.js','utf8')+'</script><script src="/pro-preview.js"></script></body>');
fs.mkdirSync('test-results/pro',{recursive:true});fs.writeFileSync('test-results/pro/preview.html',html.replace('<script src="/pro-preview.js"></script>','<script>'+fs.readFileSync('native/pro-preview.js','utf8')+'</script>'));
if(process.env.PRO_PREPARE_ONLY==='true')process.exit(0);
const server=http.createServer((req,res)=>{if(req.url==='/pro-preview.js'){res.setHeader('Content-Type','text/javascript');res.end(fs.readFileSync('native/pro-preview.js'));}else{res.setHeader('Content-Type','text/html');res.end(html);}});
(async()=>{await new Promise(r=>server.listen(4173,'0.0.0.0',r));const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,headless:true,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173');await page.waitForFunction(()=>!!window.TableRecProPreview);fs.mkdirSync('test-results/pro',{recursive:true});
 await page.screenshot({path:'test-results/pro/discover.png',fullPage:true});
 for(const view of ['happy','recipes','needs']){
  await page.evaluate(v=>window.TableRecProPreview.open(v),view);await page.waitForFunction(()=>!document.querySelector('#pro').textContent.includes('Getting your table ready'));
  if(view==='happy')await page.selectOption('#prDay','Mon');
  if(view==='needs'){await page.click('[data-pro-action="filter"][data-value="sources"]');await page.screenshot({path:'test-results/pro/dietary-guides.png',fullPage:true});await page.click('[data-pro-action="filter"][data-value="all"]');}
  await page.screenshot({path:'test-results/pro/'+view+'.png',fullPage:true});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow in '+view);
 }
 await page.click('[data-pro-action="go"][data-value="edit"]');await page.screenshot({path:'test-results/pro/preferences.png',fullPage:true});
 await page.evaluate(()=>window.TableRecProPreview.open('recipes'));await page.click('[data-pro-action="spin"]');await page.waitForSelector('#prRecipeReel[data-spinning="true"]');await page.screenshot({path:'test-results/pro/recipe-running.png',fullPage:true});await page.waitForSelector('[data-pro-action="saveRecipe"]');await page.screenshot({path:'test-results/pro/recipe.png',fullPage:true});
 for(const width of [320,430,768]){await page.setViewportSize({width,height:844});for(const view of ['happy','recipes','needs']){await page.evaluate(v=>window.TableRecProPreview.open(v),view);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overflow '+width+' '+view);}}
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{document.documentElement.dataset.theme='night';window.TableRecProPreview.open('recipes');});await page.screenshot({path:'test-results/pro/night.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS: browser screenshots, actual TableRec styling, feature screens, and 320/390/430/768px overflow checks.');await browser.close();server.close();
})().catch(e=>{console.error(e);server.close();process.exit(1);});
