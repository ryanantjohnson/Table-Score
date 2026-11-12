/* Feedback is sent through an authenticated server function, never mailto. */
(() => {
  let dialog, busy=false, attempt=null;
  const drafts=new Map();
  const owner=()=>typeof currentUser!=='undefined'?currentUser?.id:null;
  function open(){
    const user=owner();
    if(!user){openAccount(open);return;}
    if(dialog)return;
    closeSettings();
    const prior=document.activeElement;
    dialog=document.createElement('div');dialog.className='modal';dialog.id='feedbackModal';
    dialog.innerHTML=`<section class="sheet" role="dialog" aria-modal="true" aria-labelledby="feedbackTitle" style="max-height:85dvh;overflow:auto"><div class="section-head"><h2 id="feedbackTitle">A little feedback</h2><button class="secondary" id="feedbackClose">Close</button></div><p>Your ideas help TableRec grow. Reports go to support@tablerec.co.</p><label for="feedbackKind">What would you like to share?</label><select id="feedbackKind"><option value="suggestion">Suggestion</option><option value="problem">Report a problem</option><option value="love">Something I love</option></select><label for="feedbackMessage" style="display:block;margin-top:16px">What’s on your mind?</label><textarea id="feedbackMessage" rows="6" maxlength="4000" placeholder="Tell us your idea, or what happened…" style="width:100%;min-height:150px;resize:vertical"></textarea><p class="muted">Your account and app version are included to help us follow up. Please don’t include passwords or payment information.</p><p id="feedbackStatus" role="status" aria-live="polite"></p><button class="primary" id="feedbackSend">Send to TableRec</button></section>`;
    document.body.append(dialog);
    const kind=dialog.querySelector('select'),message=dialog.querySelector('textarea'),status=dialog.querySelector('[role=status]'),button=dialog.querySelector('#feedbackSend');
    const saved=drafts.get(user);if(saved){kind.value=saved.kind;message.value=saved.message;attempt=saved.attempt;}else attempt=null;
    const save=()=>{if(button.textContent==='Sent'){button.textContent='Send to TableRec';button.disabled=false;status.textContent='';}attempt=null;drafts.set(user,{kind:kind.value,message:message.value,attempt});};
    message.oninput=save;kind.onchange=save;
    const close=()=>{if(busy)return;drafts.set(user,{kind:kind.value,message:message.value,attempt});dialog.remove();dialog=null;document.removeEventListener('keydown',keys);if(prior?.isConnected)prior.focus();};
    function keys(e){if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const controls=[...dialog.querySelectorAll('button,select,textarea')].filter(x=>!x.disabled);if(e.shiftKey&&document.activeElement===controls[0]){e.preventDefault();controls.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===controls.at(-1)){e.preventDefault();controls[0].focus();}}}
    document.addEventListener('keydown',keys);dialog.querySelector('#feedbackClose').onclick=close;
    button.onclick=async()=>{
      if(busy)return;if(owner()!==user){status.textContent='Please reopen feedback after signing in.';return;}
      if(message.value.trim().length<5){status.textContent='Please add a little more detail (at least 5 characters).';message.focus();return;}
      attempt ||= crypto.randomUUID();drafts.set(user,{kind:kind.value,message:message.value,attempt});
      busy=true;button.disabled=true;message.disabled=true;kind.disabled=true;dialog.querySelector('#feedbackClose').disabled=true;status.textContent='Sending…';
      let deadline;
      try{
        const build=window.tableRecBuild||{};
        const result=await Promise.race([db.functions.invoke('send-feedback',{body:{request_id:attempt,kind:kind.value,message:message.value.trim(),version:String(build.version||'web'),build:String(build.number||'web'),platform:String(build.platform||'web')}}),new Promise((_,reject)=>{deadline=setTimeout(()=>reject(Error('timeout')),45000);})]);
        if(result.error||result.data?.sent!==true)throw Error('unconfirmed');
        drafts.delete(user);attempt=null;message.value='';status.textContent='Thanks! Your feedback helps make TableRec better.';button.textContent='Sent';
      }catch(_){status.textContent='We couldn’t confirm delivery. Your message is still here. Try again, or contact support@tablerec.co.';button.disabled=false;}
      finally{clearTimeout(deadline);busy=false;message.disabled=false;kind.disabled=false;dialog.querySelector('#feedbackClose').disabled=false;}
    };
    message.focus();
  }
  window.TableRecFeedback={open};
})();
