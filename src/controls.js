'use strict';
/* Browser-safe gameplay bindings. Control/Alt/Meta are deliberately not bindable.
 * Optional W protection uses Keyboard Lock only in explicit fullscreen.
 * https://developer.chrome.com/docs/capabilities/web-apis/keyboard-lock
 */
const CONTROL_ACTIONS=Object.freeze({
 forward:{label:'Move forward',key:'KeyW'},back:{label:'Move backward',key:'KeyS'},
 left:{label:'Strafe left',key:'KeyA'},right:{label:'Strafe right',key:'KeyD'},
 jump:{label:'Jump / swim up / double-tap flight',key:'Space'},sprint:{label:'Sprint',key:'ShiftLeft'},
 crouch:{label:'Crouch / ledge safety / fly down',key:'KeyC'},inventory:{label:'Inventory & crafting',key:'KeyE'},
 drop:{label:'Drop one item',key:'KeyQ'},guide:{label:'Controls & field guide',key:'KeyG'},
 mute:{label:'Mute all audio',key:'KeyM'},music:{label:'Toggle soundtrack',key:'KeyN'},
 save:{label:'Save world',key:'F5'},debug:{label:'Diagnostics',key:'F3'}
});
const canonicalKey=code=>code==='ShiftRight'?'ShiftLeft':code;
const validBind=code=>typeof code==='string'&&/^(Key[A-Z]|Arrow(Up|Down|Left|Right)|Space|ShiftLeft|F[235])$/.test(canonicalKey(code));
const keyLabel=code=>({Space:'Space',ShiftLeft:'Shift',ShiftRight:'Shift',ArrowUp:'Up',ArrowDown:'Down',ArrowLeft:'Left',ArrowRight:'Right'}[code]||String(code).replace(/^Key/,''));
function normalizeControlOptions(options){
 const bindings={},used=new Set(),raw=options.bindings||{};
 for(const [action,def] of Object.entries(CONTROL_ACTIONS)){
  const desired=canonicalKey(raw[action]||def.key);
  if(validBind(desired)&&!used.has(desired)){bindings[action]=desired;used.add(desired);}
 }
 for(const [action,def] of Object.entries(CONTROL_ACTIONS))if(!bindings[action]){
  const key=[def.key,...Object.values(CONTROL_ACTIONS).map(d=>d.key),...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(k=>k.length===1?'Key'+k:k).find(k=>!used.has(k));
  bindings[action]=key;used.add(key);
 }
 return {...options,bindings,controlsVersion:1,closeGuard:typeof options.closeGuard==='boolean'?options.closeGuard:true,
  keyboardShield:typeof options.keyboardShield==='boolean'?options.keyboardShield:false};
}
class Controls{
 constructor(game){this.g=game;this.captureAction=null;this.shieldStatus='off';this.shieldEpoch=0;
  document.addEventListener('keydown',e=>this.capture(e),true);
  document.addEventListener('fullscreenchange',()=>this.syncShield());
  document.addEventListener('pointerlockchange',()=>this.syncShield());
 }
 key(action){return this.g.options.bindings[action]||CONTROL_ACTIONS[action]?.key;}
 label(action){return keyLabel(this.key(action));}
 matches(action,code){return this.key(action)===canonicalKey(code);}
 held(action){const key=this.key(action);return this.g.keys.has(key)||(key==='ShiftLeft'&&this.g.keys.has('ShiftRight'));}
 bind(action,code){
  code=canonicalKey(code);if(!CONTROL_ACTIONS[action]||!validBind(code))return false;
  const keys=this.g.options.bindings,old=keys[action],other=Object.keys(keys).find(k=>k!==action&&keys[k]===code);
  if(other)keys[other]=old;keys[action]=code;this.g.keys.clear();this.g.ui?.persistOptions();this.render();this.updateHints();return true;
 }
 capture(e){
  if(!this.captureAction)return;
  e.preventDefault();e.stopImmediatePropagation();
  if(e.repeat)return;
  if(e.code==='Escape'){this.captureAction=null;this.render();return;}
  if(e.ctrlKey||e.altKey||e.metaKey||!validBind(e.code)){this.message('That key is reserved for the browser. Choose a letter, arrow, Space, Shift, F2, F3 or F5.');return;}
  const action=this.captureAction;this.captureAction=null;this.bind(action,e.code);this.message(CONTROL_ACTIONS[action].label+' bound to '+keyLabel(e.code)+'. Settings saved.');
 }
 attachUI(){
  const button=document.getElementById('reset-bindings');if(button)button.onclick=()=>{this.g.options=normalizeControlOptions({...this.g.options,bindings:{}});this.captureAction=null;this.g.keys.clear();this.g.ui.persistOptions();this.render();this.updateHints();this.message('FPS defaults restored. Shift to sprint. C to crouch.');};
  const guard=document.getElementById('close-guard');if(guard)guard.onchange=()=>{this.g.options.closeGuard=guard.checked;this.g.ui.persistOptions();};
  const shield=document.getElementById('keyboard-shield');if(shield)shield.onclick=async()=>{
   this.g.options.keyboardShield=!this.g.options.keyboardShield;this.g.ui.persistOptions();
   if(this.g.options.keyboardShield){try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();}catch{this.shieldStatus='Fullscreen unavailable';}}
   this.syncShield();this.render();
  };
  this.render();this.updateHints();
 }
 message(text){const e=document.getElementById('binding-message');if(e)e.textContent=text;}
 render(){
  const root=document.getElementById('binding-fields');if(!root)return;root.replaceChildren();
  for(const [action,def] of Object.entries(CONTROL_ACTIONS)){
   const row=document.createElement('div');row.className='binding-row';const label=document.createElement('span');label.textContent=def.label;
   const button=document.createElement('button');button.className='key-bind'+(this.captureAction===action?' listening':'');button.dataset.bind=action;button.textContent=this.captureAction===action?'Press a key…':this.label(action);button.setAttribute('aria-label','Rebind '+def.label);
   button.onclick=()=>{this.captureAction=action;this.g.keys.clear();this.render();this.message('Press a new key. Escape cancels. A conflicting binding swaps places.');};row.append(label,button);root.append(row);
  }
  const guard=document.getElementById('close-guard');if(guard)guard.checked=this.g.options.closeGuard;
  const shield=document.getElementById('keyboard-shield');if(shield)shield.textContent=this.g.options.keyboardShield?'Fullscreen W protection: enabled':'Enable fullscreen W protection';
  const status=document.getElementById('shield-status');if(status)status.textContent=this.shieldStatus==='locked'?'W protection active. Escape still exits normally.':this.g.options.keyboardShield?'Protection activates during fullscreen gameplay where supported.':'No Control-based gameplay bindings. Your browser retains its shortcuts.';
  this.updateHints();
 }
 updateHints(){for(const el of document.querySelectorAll('[data-key-hint]'))el.textContent=this.label(el.dataset.keyHint);}
 async syncShield(){
  const epoch=++this.shieldEpoch,g=this.g;
  if(!g.options.keyboardShield||!document.fullscreenElement||!g.active||g.overlay||document.pointerLockElement!==g.canvas){try{navigator.keyboard?.unlock?.();}catch{}this.shieldStatus='off';return;}
  if(!navigator.keyboard?.lock){this.shieldStatus='not supported';return;}
  try{await navigator.keyboard.lock(['KeyW']);if(epoch!==this.shieldEpoch){navigator.keyboard.unlock();return;}this.shieldStatus='locked';}
  catch{this.shieldStatus='not permitted';}
 }
}
