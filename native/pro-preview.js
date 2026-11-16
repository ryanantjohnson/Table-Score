/* TableRec Pro native tester entry. No billing, cloud storage, or production entitlement. */
(function(root){
 'use strict';
 if(root.tableRecProPreviewEnabled!==true)return;
 let account=null,modal=null,frame=null,returnFocus=null;
 const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function user(){try{return typeof currentUser!=='undefined'?currentUser:null;}catch(_){return null;}}
 function context(){let name='Member';try{if(typeof profile!=='undefined')name=profile?.display_name||profile?.username||name;}catch(_){}
  return {type:'tablerec-pro-context',name:String(name).slice(0,80),dark:['night','electric'].includes(document.documentElement.dataset.theme)};
 }
 function sendContext(){frame?.contentWindow?.postMessage(context(),'*');}
 function clear(){
  modal?.remove();modal=null;frame=null;
  document.querySelectorAll('[data-tr-pro-entry]').forEach(n=>n.remove());
  if(document.body.dataset.trProLocked==='true'){
   document.body.style.overflow=document.body.dataset.trProPriorOverflow||'';
   delete document.body.dataset.trProLocked;delete document.body.dataset.trProPriorOverflow;
  }
 }
 function close(){
  if(!modal)return;
  modal.hidden=true;
  if(document.body.dataset.trProLocked==='true'){
   document.body.style.overflow=document.body.dataset.trProPriorOverflow||'';
   delete document.body.dataset.trProLocked;delete document.body.dataset.trProPriorOverflow;
  }
  if(returnFocus?.isConnected)returnFocus.focus();
 }
 function open(){
  const u=user();if(!u){clear();if(typeof root.openAccount==='function')root.openAccount();return;}
  if(account!==u.id){clear();account=u.id;}
  if(!modal){
   modal=document.createElement('section');modal.id='trProNative';
   modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','trProNativeTitle');
   modal.innerHTML='<header class="trpn-header"><button class="trpn-back" type="button" aria-label="Back to TableRec">‹ Back</button><div class="trpn-brand" id="trProNativeTitle" aria-label="TableRec Pro"><span>PRO</span></div><span class="trpn-access">Tester access</span></header>';
   frame=document.createElement('iframe');
   frame.title='TableRec Pro';frame.src=new URL('pro-preview.html',location.href).href;
   frame.setAttribute('sandbox','allow-scripts allow-modals allow-downloads');
   frame.setAttribute('referrerpolicy','no-referrer');
   frame.addEventListener('load',sendContext);
   modal.append(frame);document.body.append(modal);
   modal.querySelector('button').addEventListener('click',close);
  }
  returnFocus=document.activeElement;
  // Close Settings through the existing app controller before opening Pro.
  const settings=document.getElementById('settingsModal');
  if(settings&&!settings.classList.contains('hidden')&&typeof root.closeSettings==='function')root.closeSettings();
  document.body.dataset.trProPriorOverflow=document.body.style.overflow;
  document.body.dataset.trProLocked='true';document.body.style.overflow='hidden';
  modal.hidden=false;sendContext();modal.querySelector('button').focus();
 }
 function card(){
  const n=document.createElement('div');n.className='card trpn-entry';n.dataset.trProEntry='true';
  n.innerHTML='<button type="button" class="trpn-entry-button"><span class="trpn-entry-icon" aria-hidden="true">✳</span><span class="trpn-entry-copy"><strong>TableRec Pro</strong><span>Your dining needs. A little more inspiration.</span><small>Tester access · Example restaurant data</small></span><span aria-hidden="true">›</span></button>';
  n.querySelector('button').addEventListener('click',open);return n;
 }
 function sync(){
  const u=user(),next=u?.id||null;
  if(next!==account){clear();account=next;}
  if(!u)return;
  const p=document.getElementById('profile'),anchor=document.getElementById('profileBadgeFolderCard');
  if(p&&!p.querySelector('[data-tr-pro-entry]')){const c=card();if(anchor?.parentNode===p)p.insertBefore(c,anchor);else p.append(c);}
  const settings=document.querySelector('#settingsModal .tr-modal-scroll');
  if(settings&&!settings.querySelector('[data-tr-pro-entry]'))settings.prepend(card());
  if(modal&&!modal.hidden)sendContext();
 }
 const style=document.createElement('style');style.textContent=
 '#trProNative[hidden]{display:none!important}#trProNative{position:fixed;inset:0;z-index:5000;display:flex;flex-direction:column;background:var(--bg,#fff5df);color:var(--text,#1d1d1b);padding-top:env(safe-area-inset-top,0px);height:100dvh;overscroll-behavior:contain}'+
 '.trpn-header{display:flex;align-items:center;justify-content:space-between;gap:10px;flex:0 0 62px;padding:8px 16px;border-bottom:1px solid var(--line,#dfd0bb);background:var(--bg,#fff5df)}'+
 '.trpn-back{background:transparent!important;color:inherit!important;border:1px solid var(--line,#dfd0bb)!important;border-radius:100px!important;padding:8px 13px!important;font-size:13px!important;box-shadow:none!important}'+
 '.trpn-brand{position:relative;width:145px;height:42px;background-image:var(--tr-wordmark);background-position:left center;background-repeat:no-repeat;background-size:115px auto}.trpn-brand>span{position:absolute;right:0;bottom:12px;font-size:9px;font-weight:900;letter-spacing:1px}'+
 '.trpn-access{font-size:9px;color:var(--muted,#706457)}#trProNative>iframe{display:block;width:100%;flex:1;min-height:0;border:0;background:#fff5df}'+
 '.trpn-entry{border:2px solid #1d1d1b!important;border-radius:18px!important;background:#fff5df!important;color:#1d1d1b!important;box-shadow:3px 4px 0 #f36f21;padding:0!important;margin:20px 0!important}.trpn-entry-button{display:flex!important;align-items:center;gap:14px;width:100%;text-align:left;background:transparent!important;color:inherit!important;border:0!important;box-shadow:none!important;padding:20px!important;border-radius:16px!important}.trpn-entry-icon{font-size:37px;color:#c84d0f}.trpn-entry-copy{flex:1}.trpn-entry-copy strong{font-size:21px;font-weight:1000;display:block;letter-spacing:-.7px}.trpn-entry-copy span{display:block;font-size:12px;margin-top:3px}.trpn-entry-copy small{display:block;font-size:9px;margin-top:8px;color:#6b533f}.trpn-entry-button:focus-visible,.trpn-back:focus-visible{outline:3px solid #3159a7!important;outline-offset:4px}';
 document.head.append(style);
 const originalRender=root.renderProfile;
 if(typeof originalRender==='function')root.renderProfile=function(){const value=originalRender.apply(this,arguments);sync();return value;};
 const originalSignOut=root.signOut;
 if(typeof originalSignOut==='function')root.signOut=async function(){clear();account=null;return originalSignOut.apply(this,arguments);};
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&modal&&!modal.hidden){event.preventDefault();close();}});
 new MutationObserver(()=>{if(modal&&!modal.hidden)sendContext();}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 root.TableRecProPreview={open,close,sync};
 // Account transitions can occur outside renderProfile, including session expiry.
 setInterval(sync,1000);sync();
})(window);
