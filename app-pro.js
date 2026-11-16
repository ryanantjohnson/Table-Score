/* Inactive in launch builds. Server status, never local storage, authorizes Pro. */
(() => {
  const config=window.TableRecProConfig;
  let dialog=null, busy=false, status=null, packages=[], selected=null, generation=0;
  const owner=()=>typeof currentUser!=='undefined'?currentUser?.id:null;
  const client=()=>typeof db!=='undefined'?db:null;
  const ready=()=>Object.values(config.features).every(x=>x===true);
  function message(copy){const el=dialog?.querySelector('#proStatus');if(el)el.textContent=copy;}
  function controls(){
    if(!dialog)return;
    dialog.querySelector('#proSubscribe').disabled=busy||!owner()||status?.active===true||!config.purchasesEnabled||!ready()||!status?.purchases_enabled||!selected;
    dialog.querySelector('#proRestore').disabled=busy||!owner()||!window.TableRecBilling;
    dialog.querySelector('#proClose').disabled=busy;
  }
  async function refresh(){
    const id=owner(),epoch=++generation;status=null;packages=[];selected=null;controls();
    if(!id){message('Sign in to manage Pro. Core restaurant discovery and Run It stay free.');return;}
    message('Checking your account…');
    try{
      const result=await client().functions.invoke('pro-status',{body:{}});
      if(epoch!==generation||owner()!==id)return;
      if(result.error||result.data?.user_id!==id)throw Error('status');
      status=result.data;
      if(status.active)message(status.source==='first_round'?'Your First Round badge includes complimentary Pro. No subscription or payment card needed.':'Your Pro membership is active.');
      else message('Pro is coming soon. You will not be charged from this preview.');
      if(config.purchasesEnabled&&ready()&&status.purchases_enabled&&!status.active&&window.TableRecBilling){
        const offers=await window.TableRecBilling.offerings(id);
        if(epoch!==generation||owner()!==id)return;
        packages=(offers.all?.[config.offering]?.availablePackages||[]).filter(p=>['MONTHLY','ANNUAL'].includes(p.packageType));
        renderPlans();
        if(!packages.length)message('Plans are unavailable right now. Please try again later.');
      }
    }catch(_){if(epoch===generation)message('Pro is coming soon. Account status is temporarily unavailable; no purchase has been started.');}
    finally{if(epoch===generation)controls();}
  }
  function renderPlans(){
    const area=dialog?.querySelector('#proPlans');if(!area)return;area.replaceChildren();
    for(const p of packages){
      const button=document.createElement('button');button.className='secondary';button.type='button';button.setAttribute('aria-pressed','false');
      button.textContent=(p.packageType==='ANNUAL'?'Annual':'Monthly')+' · '+p.product.priceString;
      button.onclick=()=>{if(busy)return;selected=p;for(const b of area.children)b.setAttribute('aria-pressed',String(b===button));dialog.querySelector('#proTerms').textContent=p.product.priceString+(p.packageType==='ANNUAL'?' billed each year.':' billed each month.')+' Payment is charged to your Apple or Google account. Subscription renews automatically unless canceled in store settings. No free trial. Canceling stops future renewals; access continues through the paid period unless refunded or revoked.';controls();};area.append(button);
    }
  }
  async function transact(kind){
    if(busy||!owner()||!window.TableRecBilling)return;
    const id=owner();
    if(kind==='purchase'&&(!selected||!config.purchasesEnabled||!ready()||!status?.purchases_enabled||status?.active))return;
    busy=true;controls();message(kind==='restore'?'Restoring purchases…':'Opening your app store…');
    try{
      if(kind==='restore')await window.TableRecBilling.restore(id);else await window.TableRecBilling.purchase(id,selected);
      if(owner()!==id){message('Account changed. Reopen Pro to check your membership.');return;}
      await refresh();
      if(!status?.active)message('The store action finished, but Pro is not confirmed yet. Refresh status shortly. Do not buy again.');
    }catch(error){message(error?.userCancelled?'Purchase canceled. No new membership was activated.':'We couldn’t confirm the store action. Use Restore purchases or check your store subscriptions before trying another purchase.');}
    finally{busy=false;controls();}
  }
  function close(){if(busy||!dialog)return;generation++;dialog.remove();dialog=null;document.removeEventListener('keydown',keys);if(typeof unlockBackgroundScroll==='function')unlockBackgroundScroll();prior?.focus();}
  let prior;
  function keys(event){
    if(event.key==='Escape'){event.preventDefault();close();}
    if(event.key==='Tab'&&dialog){const items=[...dialog.querySelectorAll('button:not(:disabled),a[href]')];if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items.at(-1)?.focus();}else if(!event.shiftKey&&document.activeElement===items.at(-1)){event.preventDefault();items[0]?.focus();}}
  }
  function open(){
    if(dialog)return;prior=document.activeElement;if(typeof closeSettings==='function')closeSettings();
    dialog=document.createElement('div');dialog.className='modal';dialog.id='proModal';
    dialog.innerHTML=`<section class="sheet" role="dialog" aria-modal="true" aria-labelledby="proTitle" style="max-height:88dvh;overflow:auto"><div class="section-head"><h2 id="proTitle">A little more TableRec.</h2><button id="proClose" class="secondary">Close</button></div><p class="pill">TableRec Pro · Coming soon</p><p>More ways to find your next favorite.</p><div class="card"><h3>Recipe Wheel</h3><p>Find your next home-cooked favorite from a broad recipe collection.</p><h3>Happy Hour Locator</h3><p>Explore nearby specials, times, and deals.</p><h3>Reservations</h3><p>Choose a restaurant, pick a time, and reserve your table.</p><p class="muted">These features are in development. Availability will be confirmed before paid signup opens.</p></div><p>Restaurant discovery, rating, and the core Run It experience stay free.</p><div id="proPlans" style="display:grid;gap:10px"><p>Monthly and annual plans will appear when store setup is complete.</p></div><p id="proTerms" class="muted">No payment is collected from this preview.</p><p id="proStatus" role="status" aria-live="polite"></p><button id="proSubscribe" class="primary" disabled>Continue with Pro</button><button id="proRestore" class="secondary">Restore purchases</button><button id="proRefresh" class="secondary">Refresh status</button><button id="proManage" class="secondary">Manage store subscription</button><p><a href="legal.html">Privacy & terms</a> · <a href="mailto:support@tablerec.co">Get help</a></p></section>`;
    document.body.append(dialog);if(typeof lockBackgroundScroll==='function')lockBackgroundScroll();document.addEventListener('keydown',keys);
    dialog.querySelector('#proClose').onclick=close;
    dialog.querySelector('#proSubscribe').onclick=()=>transact('purchase');dialog.querySelector('#proRestore').onclick=()=>transact('restore');
    dialog.querySelector('#proRefresh').onclick=()=>{if(!busy)void refresh();};
    dialog.querySelector('#proManage').onclick=()=>{const platform=window.Capacitor?.getPlatform?.();if(platform==='ios')window.open('https://apps.apple.com/account/subscriptions','_blank','noopener');else if(platform==='android')window.open('https://play.google.com/store/account/subscriptions','_blank','noopener');else message('Manage an existing subscription through the Apple App Store or Google Play account used to purchase it.');};
    dialog.querySelector('#proClose').focus();void refresh();
  }
  async function access(){
    const id=owner();if(!id)return false;
    try{const result=await client().functions.invoke('pro-status',{body:{}});return owner()===id&&!result.error&&result.data?.user_id===id&&result.data?.active===true;}catch{return false;}
  }
  window.TableRecPro={open,refresh,hasAccess:access};
  document.addEventListener('DOMContentLoaded',()=>{
    const entry=document.getElementById('proEntry');if(entry)entry.hidden=!config.showEntry;
    client()?.auth.onAuthStateChange(()=>{generation++;status=null;packages=[];selected=null;void window.TableRecBilling?.reset();if(dialog){message('Account changed. Refresh status to continue.');controls();}});
  });
})();
