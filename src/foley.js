'use strict';
/* Living World soundbank: original source-filter animal synthesis and modal foley.
 * Audio is embedded; no asset requests, proprietary samples or audio services.
 */
const MATERIAL_NAMES=Object.freeze(['stone','wood','dirt','grass','sand','gravel','glass','snow','ice','leaves','wool','metal','crystal','water']);
function soundMaterial(id){
 if([5,7,20,22,23,30].includes(id))return 'wood';
 if([6,24,25,26,27,28,31,39,42].includes(id))return 'leaves';
 if(id===1)return 'grass';if([2,41].includes(id))return 'dirt';if([4,37].includes(id))return 'sand';
 if(id===29)return 'gravel';if(id===19)return 'glass';if([17,40].includes(id))return 'snow';if(id===18)return 'ice';
 if([35,36].includes(id))return 'wool';if([12,13,14,21].includes(id))return 'metal';if([15,16].includes(id))return 'crystal';
 if(id===9)return 'water';return 'stone';
}
const FOLEY_CAPTIONS=Object.freeze({sheep:'Sheep bleats',ox:'Ox moos',snout:'Pig grunts',peep:'Chicken clucks',husk:'Husk growls',bone:'Bones rattle',crawler:'Crawler chitters',fuse:'Fuse stalker hisses'});
const priorSound={init:Sound.prototype.init,start:Sound.prototype.start,applyOptions:Sound.prototype.applyOptions,tick:Sound.prototype.tick,play:Sound.prototype.play,dispose:Sound.prototype.dispose};
Sound.prototype.init=function(ctx){
 priorSound.init.call(this,ctx);const c=ctx,n=this.nodes;
 this.spatialVoices=new Map();this.roundRobin=new Map();this.soundHistory=[];this.lastFoley=new Map();this.worldLoops=new Map();this.bank=null;this.bankLoading=null;this.bankError='';this.nextNature=0;this.lastWorldScan=0;this.lastEnvironment=null;this.demoJobs=[];
 n.creatures=c.createGain();n.creatures.connect(n.sfx);
 n.reverbSend=c.createGain();n.reverb=c.createConvolver();n.reverbTone=c.createBiquadFilter();n.reverbTone.type='lowpass';n.reverbTone.frequency.value=4200;
 // A shared stereo room, never a convolver per animal or impact.
 const impulse=c.createBuffer(2,Math.floor(c.sampleRate*1.65),c.sampleRate);let seed=83142;
 for(let ch=0;ch<2;ch++){const a=impulse.getChannelData(ch);let lp=0;for(let i=0;i<a.length;i++){seed=(Math.imul(seed,1664525)+1013904223)|0;lp=lp*.7+((seed>>>0)/2147483648-1)*.3;const t=i/c.sampleRate;a[i]=t<.024?0:lp*Math.exp(-t*4.2)*.28;}for(const [at,amp] of [[.029,.30],[.047,.21],[.079,.14],[.117,.10]])a[Math.floor((at+ch*.004)*c.sampleRate)]+=amp;}
 n.reverb.buffer=impulse;n.reverb.normalize=false;n.sfx.connect(n.reverbSend);n.reverbSend.connect(n.reverb);n.reverb.connect(n.reverbTone);n.reverbTone.connect(n.world);
 n.creatures.gain.value=this.game.options.wildlifeVolume??.94;n.reverbSend.gain.value=0;
 this.applyOptions();
};
Sound.prototype.start=function(){priorSound.start.call(this);this.ensureBank();};
Sound.prototype.ensureBank=function(){
 if(!this.ctx||this.bank||this.bankLoading||this.bankError||typeof FOLEY_DATA==='undefined')return this.bankLoading;
 this.bankLoading=(async()=>{try{const raw=atob(FOLEY_DATA.audio),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));this.bank=await this.ctx.decodeAudioData(bytes.buffer);this.stats.bankDecodes=(this.stats.bankDecodes||0)+1;}
 catch(e){this.bankError=String(e.message||e);}
 finally{this.bankLoading=null;this.refreshFoleyUI();}})();return this.bankLoading;
};
Sound.prototype.applyOptions=function(){priorSound.applyOptions.call(this);if(this.nodes?.creatures)this.ramp(this.nodes.creatures.gain,this.game.options.wildlifeVolume??.94,.12);};
Sound.prototype.chooseClip=function(prefix){
 const count=prefix.startsWith('voice/')?(prefix.endsWith('/idle')?4:2):prefix.startsWith('tool/')||prefix.startsWith('event/')?3:4;
 this.roundRobin ||= new Map();const last=this.roundRobin.get(prefix)??Math.floor(Math.random()*count);const next=(last+1+Math.floor(Math.random()*(count-1)))%count;this.roundRobin.set(prefix,next);return prefix+'/'+next;
};
Sound.prototype.positionMix=function(pos,occluded=false){
 const g=this.game,p=g.player;if(!pos||!p||g.options.spatialAudio===false)return {pan:0,gain:1,cutoff:19500,distance:0,blocked:false};
 const x=pos.x-p.x,y=(pos.y??p.y)-(p.y+1),z=pos.z-p.z,distance=Math.hypot(x,y,z),horizontal=Math.hypot(x,z);
 const pan=horizontal>.01?clamp((x*Math.cos(p.yaw||0)+z*Math.sin(p.yaw||0))/horizontal,-1,1)*.93:0;
 let blocks=occluded?3:0;
 // Read-only bounded acoustic ray; never generates terrain or traverses whole chunks.
 if(!occluded&&distance>2&&g.active&&g.world?.get){
  const steps=Math.min(18,Math.ceil(distance));let last='';
  for(let i=1;i<steps;i++){const f=i/steps,xx=Math.floor(p.x+x*f),yy=Math.floor(p.y+1+y*f),zz=Math.floor(p.z+z*f),key=key3(xx,yy,zz);if(key===last)continue;last=key;const id=g.world.get(xx,yy,zz);if(BLOCKS[id]?.opaque&&BLOCKS[id]?.solid&&++blocks>=3)break;}
 }
 const behind=(x*Math.sin(p.yaw||0)-z*Math.cos(p.yaw||0))<0;
 return {pan,gain:Math.min(1,1/(1+Math.max(0,distance-2.5)*.12))*Math.max(0,1-distance/55)*(blocks?.53:1),cutoff:blocks?1700:behind?9000:Math.max(2800,19500-distance*190),distance,blocked:blocks>0};
};
Sound.prototype.sample=function(key,options={}){
 const bus=options.bus||'sfx';if(!this.bank||!FOLEY_DATA.clips[key]||!this.canPlay(bus==='creatures'?'sfx':bus)||bus==='creatures'&&(this.game.options.wildlifeVolume??1)===0)return false;
 if(this.voices.size>=72){this.stats.sfxDropped++;return false;}
 const pos=options.follow||options.pos,spatial=this.positionMix(pos,options.occluded),priority=options.priority||false;
 if(spatial.distance>52||(!priority&&bus==='creatures'&&[...this.spatialVoices.values()].filter(v=>v.bus==='creatures').length>=4))return false;
 const c=this.ctx,t=c.currentTime+Math.max(0,options.delay||0),clip=FOLEY_DATA.clips[key],source=c.createBufferSource(),volume=c.createGain(),filter=c.createBiquadFilter(),pan=c.createStereoPanner();
 const rate=options.rate||(.975+Math.random()*.05),level=options.level??.7;source.buffer=this.bank;source.playbackRate.value=rate;
 volume.gain.value=level*spatial.gain;filter.type='lowpass';filter.frequency.value=spatial.cutoff;filter.Q.value=.5;pan.pan.value=spatial.pan;
 source.connect(volume);volume.connect(filter);filter.connect(pan);pan.connect(this.nodes[bus]||this.nodes.sfx);
 this.voice(source,[volume,filter,pan]);const cleanup=source.onended;
 source.onended=()=>{cleanup();this.spatialVoices.delete(source);};
 this.spatialVoices.set(source,{volume,filter,pan,pos,occluded:options.occluded,level,bus,key});
 source.start(t,clip.offset,clip.duration);source.stop(t+clip.duration/rate+.006);
 this.soundHistory.push({key,time:c.currentTime,pan:spatial.pan,gain:level*spatial.gain});if(this.soundHistory.length>80)this.soundHistory.shift();
 if(options.caption)this.caption(options.caption,pos);
 return true;
};
Sound.prototype.caption=function(text,pos){
 if(!this.game.options.soundCaptions)return;
 const root=document.getElementById('sound-captions');if(!root)return;const now=this.ctx?.currentTime||0,key='caption:'+text;if(now-(this.lastFoley.get(key)??-10)<.4)return;this.lastFoley.set(key,now);
 const s=this.positionMix(pos),direction=pos?(s.pan<-.25?'left':s.pan>.25?'right':'ahead'):'nearby';
 const el=document.createElement('div');el.className='sound-caption';el.textContent=text+' · '+direction;root.append(el);while(root.children.length>3)root.firstChild.remove();setTimeout(()=>el.remove(),2500);
};
Sound.prototype.material=function(action,id,options={}){
 const material=typeof id==='string'?id:soundMaterial(id),prefix=action+'/'+material;
 return this.sample(this.chooseClip(prefix),{level:action==='step'?.52:action==='mine'?.65:action==='break'?.93:.72,...options});
};
Sound.prototype.tool=function(id,options={}){const def=ITEMS[id]?.maxDurability?ITEMS[id]:null,tool=def?.tool||'hand',tier=def?.tier||1;return this.sample(this.chooseClip('tool/'+tool+'/'+tier),{level:.33,...options});};
Sound.prototype.animal=function(m,state='idle',options={}){
 if(!m||!FOLEY_CAPTIONS[m.type])return false;
 if(!this.bank){priorSound.play.call(this,'mob',MOB_TYPES[m.type]?.hostile?0:1);return false;}
 const key=this.chooseClip('voice/'+m.type+'/'+state),ok=this.sample(key,{bus:'creatures',follow:m,level:state==='idle'?.93:1.04,priority:state!=='idle',caption:FOLEY_CAPTIONS[m.type]+(state==='hurt'?' sharply':state==='death'?' fades':''),...options});
 if(ok&&this.game.options.detailFocus&&this.positionMix(m).distance<12)this.duck(.74,.22);
 return ok;
};
Sound.prototype.event=function(name,options={}){return this.sample(this.chooseClip('event/'+name),options);};
Sound.prototype.play=function(type,id=2,options={}){
 if(this.bank&&['step','mine','break','place'].includes(type)){
  if(!this.canPlay('sfx'))return;
  this.material(type,id,options);
  if(type==='mine')this.tool(options.toolId??this.game.held?.()?.id,{pos:options.pos,level:.34});
  if(type==='break'){this.caption(soundMaterial(id)+' breaks',options.pos);if(this.game.options.detailFocus)this.duck(.83,.06);}
  return;
 }
 if(type==='mob'&&this.bank){const m=id&&typeof id==='object'?id:{type:id===1?'sheep':'husk',x:this.game.player.x,y:this.game.player.y,z:this.game.player.z-2};this.animal(m);return;}
 if(type==='tool-break'&&this.bank){this.event('tool-break',{caption:'Tool breaks',level:.85});return;}
 priorSound.play.call(this,type,id);
 if(type==='fuse')this.caption('Fuse ignites',options.pos);
 if(type==='explode')this.caption('Explosion',options.pos);
};
Sound.prototype.updateSpatial=function(){if(!this.spatialVoices)return;for(const v of this.spatialVoices.values())if(v.pos){const s=this.positionMix(v.pos,v.occluded);this.ramp(v.volume.gain,v.level*s.gain,.07);this.ramp(v.pan.pan,s.pan,.07);this.ramp(v.filter.frequency,s.cutoff,.09);}};
Sound.prototype.loopTexture=function(name,level){
 if(!this.bank)return;let loop=this.worldLoops.get(name);
 if(!loop){const clip=FOLEY_DATA.clips['loop/'+name];if(!clip)return;const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=this.bank;source.loop=true;source.loopStart=clip.offset;source.loopEnd=clip.offset+clip.duration;gain.gain.value=0;source.connect(gain);gain.connect(this.nodes.ambience);source.start(0,clip.offset);loop={source,gain};this.worldLoops.set(name,loop);}
 this.ramp(loop.gain.gain,level,1.2);
};
Sound.prototype.environmentTick=function(){
 if(!this.bank||!this.worldLoops)return;const g=this.game,p=g.player,active=g.active&&!g.overlay&&p?.health>0&&!document.hidden,now=this.ctx.currentTime;
 if(!active||!this.canPlay('ambience')){for(const loop of this.worldLoops.values())this.ramp(loop.gain.gain,0,.18);return;}
 const cave=this.scene==='cave',night=g.daylight<.3,under=p.underwater;
 if(now-this.lastWorldScan>1.6){
  this.lastWorldScan=now;let water=0,fire=null;
  if(g.world?.get){for(let z=-5;z<=5;z+=2)for(let x=-5;x<=5;x+=2)for(let y=-1;y<=1;y++){const id=g.world.get(p.x+x,p.y+y,p.z+z);if(id===9)water++;if(id===23||id===34)fire={x:p.x+x,y:p.y+y,z:p.z+z};}
   for(const [key,tile] of g.world.tiles||[])if(tile.kind==='furnace'&&tile.fuel>0){const [x,y,z]=key.split(',').map(Number);if(Math.hypot(x-p.x,y-p.y,z-p.z)<9){fire={x:x+.5,y:y+.5,z:z+.5};break;}}
  }
  this.nearWater=Math.min(1,water/12);this.nearFire=fire;
  if(fire)this.event('fire',{bus:'ambience',pos:fire,level:.30,caption:'Fire crackles'});
 }
 const levels={wind:cave||under?0:.075,night:night&&!cave&&!under?.055:0,cave:cave?.08:0,water:under?.23:(this.nearWater||0)*.15};
 for(const [name,level] of Object.entries(levels))if(level>0||this.worldLoops.has(name))this.loopTexture(name,level);
 if(now>this.nextNature){this.nextNature=now+3+Math.random()*4;
  const angle=Math.random()*Math.PI*2,range=4+Math.random()*8,pos={x:p.x+Math.sin(angle)*range,y:p.y+(cave?2:4),z:p.z+Math.cos(angle)*range};
  const name=under?'bubble':cave?'drip':night?'cricket':'bird';
  this.event(name,{bus:'ambience',pos,level:under?.26:cave?.30:.18,caption:under?'Bubbles':cave?'Water drips':night?'Crickets':'Birdsong'});
 }
};
Sound.prototype.tick=function(){
 priorSound.tick.call(this);if(!this.nodes?.reverbSend)return;
 this.ramp(this.nodes.music.gain,this.foleySolo?0:(this.game.options.musicEnabled?this.game.options.musicVolume:0),.16);this.updateSpatial();this.environmentTick();
 const wet=this.scene==='cave'?(this.game.options.caveReverb??.55)*.8:this.scene==='underwater'?.09:.015;
 this.ramp(this.nodes.reverbSend.gain,wet,.7);this.refreshFoleyUI();
};
Sound.prototype.refreshFoleyUI=function(){
 const el=document.getElementById('foley-status');if(el)el.textContent=this.bank?'385 original clips · '+this.voices.size+' active voices · '+(this.game.options.spatialAudio?'directional stereo':'centred mix'):this.bankError?'Foley bank unavailable; procedural fallback active.':this.bankLoading?'Preparing the living world…':'Click any sound to wake the world.';
};
Sound.prototype.audition=function(kind,value,options={}){
 this.start();const play=()=>{if(!this.bank)return;const p=this.game.player||{x:0,y:0,z:0,yaw:0},side=options.side||'centre',sideAngle=side==='left'?-Math.PI/2:side==='right'?Math.PI/2:0,yaw=(p.yaw||0)+sideAngle;
  const pos={x:p.x+Math.sin(yaw)*3,y:p.y+1,z:p.z-Math.cos(yaw)*3},opts={pos,occluded:side==='wall',...options};
  if(kind==='animal')this.animal({...pos,type:value},options.state||'idle',{...opts,follow:null});
  if(kind==='material'){this.material(options.action||'break',value,opts);if(options.action==='mine')this.tool(Number.isFinite(Number(options.tool))?Number(options.tool):220,opts);}
  if(kind==='event')this.event(value,opts);
 };
 if(this.bank)play();else this.ensureBank()?.then(play);
};
Sound.prototype.dispose=function(){
 for(const job of this.demoJobs||[])clearTimeout(job);
 for(const loop of this.worldLoops?.values()||[]){try{loop.source.stop();}catch{}loop.source.disconnect();loop.gain.disconnect();}
 this.worldLoops?.clear();priorSound.dispose.call(this);
};
