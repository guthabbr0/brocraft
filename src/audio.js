'use strict';
/* BroCraft Epic Audio. Original score and synthesis; no network or sampled music.
 * Audio routing follows Web Audio: https://www.w3.org/TR/webaudio/
 */
const AUDIO_DEFAULTS=Object.freeze({volume:.82,musicVolume:.8,sfxVolume:.94,ambienceVolume:.55,bass:5,treble:3,intensity:.75,musicEnabled:true,muted:false,wildlifeVolume:.94,spatialAudio:true,caveReverb:.55,soundCaptions:false,detailFocus:true,audioVersion:3});
const AUDIO_PRESETS=Object.freeze({
 cinematic:{...AUDIO_DEFAULTS},
 boom:{...AUDIO_DEFAULTS,volume:.88,musicVolume:.9,sfxVolume:1,bass:8,treble:5,intensity:1},
 soft:{...AUDIO_DEFAULTS,volume:.48,musicVolume:.6,sfxVolume:.68,ambienceVolume:.4,bass:1,treble:1,intensity:.3}
});
const SCORE_SCENES=Object.freeze({
 menu:{label:'A world waiting',detail:'TITLE / SOARING HORIZONS',gains:[.82,.27,.36,.38]},
 explore:{label:'Beyond the horizon',detail:'EXPLORATION / OPEN SKIES',gains:[1,.64,.62,.64]},
 night:{label:'The long night',detail:'NIGHTFALL / RISING TENSION',gains:[.7,.64,.48,.75]},
 cave:{label:'Under the mountain',detail:'DEPTHS / DARK RESONANCE',gains:[.52,.32,.44,.6]},
 combat:{label:'Hold the line',detail:'DANGER / FULL ORCHESTRA',gains:[.85,1,1,1]},
 underwater:{label:'Beneath the surface',detail:'UNDERWATER / DISTANT ECHOES',gains:[.6,.25,.24,.38]}
});
function normalizeAudioOptions(options){
 const o={...options};
 for(const [key,fallback] of Object.entries(AUDIO_DEFAULTS)){
  if(typeof fallback==='number')o[key]=Number.isFinite(o[key])?clamp(o[key],key==='bass'||key==='treble'?-6:0,key==='bass'||key==='treble'?12:key==='audioVersion'?3:1):fallback;
  else o[key]=typeof o[key]==='boolean'?o[key]:fallback;
 }
 o.audioVersion=3;return o;
}
class Sound{
 constructor(game){
  this.game=game;this.ctx=null;this.nodes=null;this.voices=new Set();this.sources=[];
  this.buffers=null;this.loading=null;this.loadError='';this.timer=null;this.scene='menu';
  this.sceneOverride='auto';this.startedAt=0;this.threatUntil=0;this.targets=new WeakMap();
  this.stats={sfxCreated:0,sfxDropped:0,starts:0,decodes:0};this.enabledByGesture=false;
 }
 init(ctx){
  if(this.ctx)return;this.ctx=ctx;const c=ctx;
  const gain=()=>c.createGain(),filter=(type,freq)=>{const n=c.createBiquadFilter();n.type=type;n.frequency.value=freq;n.Q.value=.6;return n;};
  const n=this.nodes={sfx:gain(),ambience:gain(),music:gain(),duck:gain(),world:filter('lowpass',20000),score:filter('lowpass',20000),mix:gain(),highpass:filter('highpass',28),bass:filter('lowshelf',110),treble:filter('highshelf',4200),compressor:c.createDynamicsCompressor(),drive:gain(),ceiling:c.createWaveShaper(),sampleCeiling:c.createWaveShaper(),master:gain(),analyser:c.createAnalyser()};
  n.sfx.connect(n.world);n.ambience.connect(n.world);n.world.connect(n.mix);
  n.music.connect(n.duck);n.duck.connect(n.score);n.score.connect(n.mix);
  n.mix.connect(n.highpass);n.highpass.connect(n.bass);n.bass.connect(n.treble);
  n.treble.connect(n.compressor);n.compressor.connect(n.drive);n.drive.connect(n.ceiling);
  n.ceiling.connect(n.sampleCeiling);n.sampleCeiling.connect(n.master);n.master.connect(n.analyser);n.analyser.connect(c.destination);
  n.compressor.threshold.value=-15;n.compressor.knee.value=12;n.compressor.ratio.value=4;
  n.compressor.attack.value=.005;n.compressor.release.value=.19;n.drive.gain.value=1.38;
  // Smooth peak ceiling, after EQ and compression. This is not a hearing-safety guarantee.
  const curve=new Float32Array(8193);
  for(let i=0;i<curve.length;i++){const x=i/(curve.length-1)*2-1,a=Math.abs(x);curve[i]=a<=.68?x:Math.sign(x)*(.68+.25*Math.tanh((a-.68)/.25));}
  n.ceiling.curve=curve;n.ceiling.oversample='4x';
  // Oversampling reconstruction can overshoot the first shaper. This last,
  // non-oversampled stage bounds output samples without altering normal levels.
  const finalCurve=new Float32Array(16385);
  for(let i=0;i<finalCurve.length;i++){const x=i/(finalCurve.length-1)*2-1,a=Math.abs(x);finalCurve[i]=a<=.80?x:Math.sign(x)*(.80+.16*Math.tanh((a-.80)/.16));}
  n.sampleCeiling.curve=finalCurve;n.sampleCeiling.oversample='none';n.master.gain.value=0;
  n.analyser.fftSize=1024;n.analyser.smoothingTimeConstant=.77;
  this.spectrum=new Uint8Array(n.analyser.frequencyBinCount);
  this.waveform=new Float32Array(n.analyser.fftSize);
  this.noise=c.createBuffer(1,c.sampleRate*3,c.sampleRate);
  const d=this.noise.getChannelData(0);let seed=735192;
  for(let i=0;i<d.length;i++){seed=(Math.imul(seed,1664525)+1013904223)|0;d[i]=(seed>>>0)/2147483648-1;}
  this.applyOptions();
 }
 start(){
  this.enabledByGesture=true;
  try{
   if(!this.ctx){const Constructor=window.AudioContext||window.webkitAudioContext;if(!Constructor)throw new Error('Web Audio is unavailable in this browser.');this.init(new Constructor({latencyHint:'interactive'}));}
   if(this.ctx.state==='suspended'&&!document.hidden)this.ctx.resume().catch(e=>{this.loadError=e.message;});
   if(!this.timer)this.timer=setInterval(()=>this.tick(),120);
   this.ensureMusic();
  }catch(e){this.loadError=e.message||String(e);this.refreshUI();}
 }
 ramp(param,value,duration=.12){
  if(!this.ctx||this.targets.get(param)===value)return;this.targets.set(param,value);
  const t=this.ctx.currentTime;
  if(typeof param.cancelAndHoldAtTime==='function')param.cancelAndHoldAtTime(t);
  else{const v=param.value;param.cancelScheduledValues(t);param.setValueAtTime(v,t);}
  param.linearRampToValueAtTime(value,t+Math.max(.005,duration));
 }
 applyOptions(){
  if(!this.nodes)return;const o=this.game.options,n=this.nodes;
  this.ramp(n.master.gain,o.muted?0:o.volume,.045);
  this.ramp(n.sfx.gain,o.sfxVolume,.07);this.ramp(n.ambience.gain,o.ambienceVolume,.1);
  this.ramp(n.music.gain,o.musicEnabled?o.musicVolume:0,.15);
  this.ramp(n.bass.gain,o.bass,.1);this.ramp(n.treble.gain,o.treble,.1);
  if(this.enabledByGesture)this.ensureMusic();this.tick();
 }
 async ensureMusic(){
  const o=this.game.options;
  if(!this.ctx||!o.musicEnabled||o.musicVolume===0||o.volume===0||o.muted||this.sources.length||this.loading||this.loadError)return;
  this.loading=(async()=>{
   try{
    if(!this.buffers){
     if(typeof SOUNDTRACK_DATA==='undefined')throw new Error('The bundled score is missing. Rebuild the game with build.py.');
     const decoded=await Promise.all(Object.entries(SOUNDTRACK_DATA.stems).map(async([name,data])=>{
      const raw=atob(data),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
      const buffer=await this.ctx.decodeAudioData(bytes.buffer);this.stats.decodes++;
      return {name,buffer};
     }));
     this.buffers=decoded;
    }
    this.beginMusic();
   }catch(e){this.loadError='Soundtrack: '+(e.message||String(e));console.warn(this.loadError);}
   finally{this.loading=null;this.refreshUI();}
  })();
  return this.loading;
 }
 beginMusic(){
  if(this.sources.length||!this.buffers||!this.ctx||this.ctx.state==='closed')return;
  const t=this.ctx.currentTime+.08;this.startedAt=t;this.stats.starts++;
  const duration=Math.min(SOUNDTRACK_DATA.duration,...this.buffers.map(b=>b.buffer.duration));
  this.loopDuration=duration;
  for(const {name,buffer} of this.buffers){
   const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();
   source.buffer=buffer;source.loop=true;source.loopStart=0;source.loopEnd=duration;
   gain.gain.value=0;source.connect(gain);gain.connect(this.nodes.music);source.start(t,0);
   this.sources.push({name,source,gain});
  }
  this.scene='';this.tick();
 }
 sceneForGame(){
  if(this.sceneOverride!=='auto'&&SCORE_SCENES[this.sceneOverride])return this.sceneOverride;
  const g=this.game,p=g.player;
  if(!g.active||g.overlay&&g.overlay!=='inventory')return 'menu';
  if(p?.underwater)return 'underwater';
  const danger=g.mode==='survival'&&(p?.health<=6||this.ctx?.currentTime<this.threatUntil||(g.mobs||[]).some(m=>MOB_TYPES[m.type]?.hostile&&m.hp>0&&Math.hypot(m.x-p.x,m.y-p.y,m.z-p.z)<14));
  if(danger)return 'combat';
  if(g.lightAt&&p&&g.lightAt(p.x,p.y+1,p.z).sky<.2)return 'cave';
  return g.daylight<.3?'night':'explore';
 }
 mixFor(scene){
  const gains=SCORE_SCENES[scene].gains;
  const epic=this.game.options.intensity;
  // High intensity keeps the action stems forward even during exploration.
  return gains.map((v,i)=>i===0?v:clamp(v*(.4+epic*.8)+Math.max(0,epic-.75)*1.05,0,1.2));
 }
 tick(){
  if(!this.nodes||this.ctx.state==='closed')return;
  const scene=this.sceneForGame(),gains=this.mixFor(scene),changed=this.scene!==scene;
  this.scene=scene;
  this.sources.forEach((s,i)=>this.ramp(s.gain.gain,Math.round(gains[i]*1000)/1000,scene==='combat'?.7:2.2));
  this.ramp(this.nodes.score.frequency,scene==='underwater'?1700:scene==='cave'?6200:20000,1.2);
  this.ramp(this.nodes.world.frequency,this.game.active&&this.game.player?.underwater?1100:20000,.25);
  if(changed)this.lastSceneChange=this.ctx.currentTime;
  this.refreshUI();
 }
 duck(amount=.5,hold=.13){
  if(!this.nodes)return;const t=this.ctx.currentTime,p=this.nodes.duck.gain;
  if(p.cancelAndHoldAtTime)p.cancelAndHoldAtTime(t);else{p.cancelScheduledValues(t);p.setValueAtTime(p.value,t);}
  p.linearRampToValueAtTime(amount,t+.018);p.setValueAtTime(amount,t+hold);p.linearRampToValueAtTime(1,t+hold+.8);
 }
 canPlay(bus){return this.ctx&&this.ctx.state!=='closed'&&!this.game.options.muted&&this.game.options.volume>0&&(bus==='ambience'?this.game.options.ambienceVolume:this.game.options.sfxVolume)>0;}
 voice(source,nodes){
  this.voices.add(source);this.stats.sfxCreated++;
  source.onended=()=>{source.disconnect();for(const n of nodes)n.disconnect();this.voices.delete(source);};
 }
 tone(freq,duration=.1,vol=.1,type='sine',delay=0,end=null,bus='sfx'){
  if(!this.canPlay(bus)||this.voices.size>=80){if(this.voices.size>=80)this.stats.sfxDropped++;return;}
  const c=this.ctx,t=c.currentTime+Math.max(0,delay),o=c.createOscillator(),g=c.createGain();
  o.type=type;o.frequency.setValueAtTime(Math.max(15,freq),t);
  if(end)o.frequency.exponentialRampToValueAtTime(Math.max(15,end),t+duration);
  const level=Math.max(.0002,vol*3.2);g.gain.setValueAtTime(0,t);
  g.gain.linearRampToValueAtTime(level,t+Math.min(.008,duration*.2));
  g.gain.exponentialRampToValueAtTime(.0001,t+duration);g.gain.linearRampToValueAtTime(0,t+duration+.012);
  o.connect(g);g.connect(this.nodes[bus]);this.voice(o,[g]);o.start(t);o.stop(t+duration+.02);
 }
 hiss(duration=.12,vol=.1,freq=900,bus='sfx',delay=0,highpass=0){
  if(!this.canPlay(bus)||this.voices.size>=80)return;
  const c=this.ctx,t=c.currentTime+Math.max(0,delay),s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
  s.buffer=this.noise;s.loop=true;f.type=highpass?'bandpass':'lowpass';f.frequency.value=freq;f.Q.value=highpass?.65:.6;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol*3.2,t+.003);
  g.gain.exponentialRampToValueAtTime(.0001,t+duration);g.gain.linearRampToValueAtTime(0,t+duration+.01);
  s.connect(f);f.connect(g);g.connect(this.nodes[bus]);this.voice(s,[f,g]);s.start(t,Math.random()*2);s.stop(t+duration+.02);
 }
 play(type,id=2){
  const wood=[5,7,20,22,30].includes(id),stone=BLOCKS[id]?.tool==='pick';
  if(type==='step'){this.hiss(.10,.054,stone?1700:wood?720:2100);this.tone(wood?108:stone?125:83,.105,.045,'triangle',0,55);}
  if(type==='mine'){this.hiss(.09,.076,stone?3100:wood?900:1800);this.tone(wood?135:170,.09,.025,'triangle',0,70);if(stone)this.tone(780,.045,.018,'sine',0,380);}
  if(type==='break'){this.hiss(.28,.15,stone?3600:1800);this.tone(wood?160:120,.22,.075,'triangle',0,42);this.tone(62,.18,.038,'sine');}
  if(type==='place'){this.tone(155,.12,.082,'triangle',0,62);this.hiss(.09,.066,1600);}
  if(type==='pickup'){this.tone(740,.13,.044);this.tone(1110,.19,.039,'sine',.055);this.tone(1480,.13,.014,'sine',.12);}
  if(type==='ui')this.tone(560,.065,.026,'triangle',0,400);
  if(type==='craft'){[440,550,660,880].forEach((f,i)=>this.tone(f,.24,.039,'triangle',i*.06));}
  if(type==='hurt'){this.hiss(.23,.12,1000);this.tone(105,.28,.085,'triangle',0,45);this.threatUntil=(this.ctx?.currentTime||0)+5;this.duck(.53);}
  if(type==='splash'){this.hiss(.56,.14,2900);this.hiss(.3,.065,720,'sfx',.08);}
  if(type==='eat'){this.hiss(.13,.088,1550);this.hiss(.17,.065,1200,'sfx',.12);}
  if(type==='mob')this.tone(id===1?160:70,.37,.032,'triangle',0,id===1?230:40);
  if(type==='fuse'){this.hiss(.68,.095,4100);this.threatUntil=(this.ctx?.currentTime||0)+5;}
  if(type==='explode'||type==='boom'){
   this.hiss(1.1,.30,1200);this.hiss(.22,.14,4700);this.tone(105,.85,.23,'sine',0,31);
   this.tone(58,.7,.085,'triangle',.025,29);this.hiss(1.4,.18,290,'sfx',.04);
   if(type==='explode')this.threatUntil=(this.ctx?.currentTime||0)+5;this.duck(.44,.2);
  }
  if(type==='arrow')this.hiss(.17,.075,4100);
 }
 toggleMute(){this.game.options.muted=!this.game.options.muted;this.game.ui?.persistOptions();this.applyOptions();this.game.ui?.toast(this.game.options.muted?'Audio muted.':'Audio restored.',(this.game.controls?.label('mute')||'M')+' toggles all audio.');}
 toggleMusic(){this.game.options.musicEnabled=!this.game.options.musicEnabled;this.game.ui?.persistOptions();this.applyOptions();this.game.ui?.toast(this.game.options.musicEnabled?'Soundtrack on.':'Soundtrack off.',(this.game.controls?.label('music')||'N')+' toggles music; effects stay independent.');}
 setPreset(name){const p=AUDIO_PRESETS[name];if(!p)return;Object.assign(this.game.options,p);this.game.ui?.persistOptions();this.applyOptions();}
 retry(){this.loadError='';this.bankError='';this.start();}
 visibility(){if(!this.ctx)return;if(document.hidden)this.ctx.suspend().catch(()=>{});else if(this.enabledByGesture)this.ctx.resume().catch(()=>{});}
 refreshUI(){
  if(typeof document==='undefined')return;const byId=id=>document.getElementById(id),o=this.game.options;
  const active=this.ctx?.state==='running'&&!o.muted&&o.volume>0;
  const playing=active&&o.musicEnabled&&o.musicVolume>0&&this.sources.length>0;
  const status=this.loadError?'SCORE UNAVAILABLE':!this.ctx?'CLICK TO ENABLE SOUND':this.ctx.state==='suspended'?'AUDIO PAUSED':o.muted||o.volume===0?'MASTER MUTED':!o.musicEnabled||o.musicVolume===0?'MUSIC OFF':this.loading?'PREPARING THE ORCHESTRA':playing?'PLAYING / ORIGINAL SCORE':'READY';
  const scene=SCORE_SCENES[this.scene]||SCORE_SCENES.menu;
  for(const [id,value] of [['audio-status',status],['audio-scene',scene.detail],['score-hud-scene',playing?scene.label:status.toLowerCase()],['audio-position',playing?Math.floor(Math.max(0,this.ctx.currentTime-this.startedAt)%this.loopDuration)+' / '+Math.round(this.loopDuration)+' s':'0 / 128 s']]){
   const e=byId(id);if(e&&e.textContent!==value)e.textContent=value;
  }
  const mute=byId('audio-mute');if(mute){mute.textContent=(o.muted?'Unmute all sound':'Mute all sound')+' ['+(this.game.controls?.label('mute')||'M')+']';mute.setAttribute('aria-pressed',String(o.muted));}
  const toggle=byId('audio-music');if(toggle&&toggle.checked!==o.musicEnabled)toggle.checked=o.musicEnabled;
  const panel=byId('audio-page');if(panel&&!panel.classList.contains('hidden')&&this.nodes){
   this.nodes.analyser.getByteFrequencyData(this.spectrum);
   const bars=document.querySelectorAll('#audio-meter i');bars.forEach((b,i)=>{const ix=Math.min(this.spectrum.length-1,Math.floor(2**(i*.36)));b.style.height=(active?Math.max(3,this.spectrum[ix]/255*100):3)+'%';});
   const progress=byId('audio-progress');if(progress)progress.style.width=(playing?(Math.max(0,this.ctx.currentTime-this.startedAt)%this.loopDuration)/this.loopDuration*100:0)+'%';
   const voice=byId('audio-voices');if(voice)voice.textContent=this.sources.length+' synchronized stems';
  }
  byId('score-hud')?.classList.toggle('silent',!playing);
 }
 dispose(){clearInterval(this.timer);this.timer=null;for(const s of this.sources){try{s.source.stop();}catch{}s.source.disconnect();s.gain.disconnect();}this.sources=[];for(const s of this.voices){try{s.stop();}catch{}}if(this.ctx?.close)this.ctx.close().catch(()=>{});}
}
