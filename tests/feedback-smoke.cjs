const {JSDOM}=require('jsdom');const fs=require('node:fs');const assert=require('node:assert/strict');
const d=new JSDOM('<button id="settings">Settings</button>',{url:'https://tablerec.co',runScripts:'dangerously'});const w=d.window;
w.currentUser={id:'tester'};w.closeSettings=()=>{};let calls=0,resolve;
w.db={functions:{invoke:()=>{calls++;return new Promise(r=>resolve=r)}}};
w.eval(fs.readFileSync('app-feedback.js','utf8'));
(async()=>{
 w.TableRecFeedback.open();let box=w.document.querySelector('textarea'),send=w.document.getElementById('feedbackSend');
 send.click();assert.equal(calls,0);
 box.value='An idea for TableRec';box.dispatchEvent(new w.Event('input'));send.click();send.click();assert.equal(calls,1);assert(send.disabled);
 resolve({error:Error('offline')});await new Promise(r=>setTimeout(r,0));assert.equal(box.value,'An idea for TableRec');assert(!send.disabled);
 w.document.getElementById('feedbackClose').click();w.TableRecFeedback.open();box=w.document.querySelector('textarea');assert.equal(box.value,'An idea for TableRec');
 send=w.document.getElementById('feedbackSend');send.click();resolve({data:{sent:true}});await new Promise(r=>setTimeout(r,0));assert.equal(box.value,'');assert.equal(send.textContent,'Sent');
 w.document.getElementById('feedbackClose').click();w.currentUser={id:'another'};w.TableRecFeedback.open();assert.equal(w.document.querySelector('textarea').value,'');
 w.document.getElementById('feedbackClose').click();w.currentUser=null;let auth=false;w.openAccount=()=>auth=true;w.TableRecFeedback.open();assert(auth);assert(!w.document.getElementById('feedbackModal'));
 d.window.close();console.log('PASS: feedback validation, duplicate clicks, failed-send draft recovery, delivery confirmation, account isolation, and sign-in gate');
})().catch(e=>{console.error(e);d.window.close();process.exit(1)});
