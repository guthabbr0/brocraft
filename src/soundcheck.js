'use strict';
/* A real Creative world built from ordinary editable blocks, not a simulated UI. */
Game.prototype.buildSoundcheck=function(){
 const x=Math.floor(this.player.x),z=Math.floor(this.player.z),y=clamp(Math.floor(this.player.y)-1,SEA+3,HEIGHT-12),w=this.world;
 for(let zz=-19;zz<=10;zz++)for(let xx=-17;xx<=17;xx++){
  w.set(x+xx,y-1,z+zz,2);w.set(x+xx,y,z+zz,Math.abs(xx)===17||zz===-19||zz===10?38:1);
  for(let yy=1;yy<=8;yy++)w.set(x+xx,y+yy,z+zz,0);
 }
 const pads=[3,5,2,1,4,29,19,40,18,6,35,12,16,9];
 for(let i=0;i<pads.length;i++){
  const xx=-14+i*2;for(let dz=1;dz<=4;dz++)for(let dx=0;dx<2;dx++)w.set(x+xx+dx,y,z+dz,pads[i]);
  if(pads[i]!==9){w.set(x+xx,y+1,z-2,pads[i]);w.set(x+xx,y+2,z-2,pads[i]);}
 }
 // Four walk-in animal stalls. Solid half-height scenery is not faked; these walls
 // are full ordinary planks with a two-block opening facing the listening path.
 for(let i=0;i<4;i++){
  const xx=x-14+i*7;
  for(let dx=0;dx<=5;dx++)for(let dz=-6;dz<=0;dz++){
   w.set(xx+dx,y,z-9+dz,1);
   if(dx===0||dx===5||dz===-6||dz===0&&dx!==2&&dx!==3){w.set(xx+dx,y+1,z-9+dz,7);w.set(xx+dx,y+2,z-9+dz,19);}
  }
  w.set(xx,y+3,z-9,23);w.set(xx+5,y+3,z-9,23);
  this.spawnMob(['sheep','ox','snout','peep'][i],xx+2.5,y+1.02,z-12.5,{voiceTimer:.5+i*.65});
 }
 // A small stone listening chamber with a real roof and doorway.
 for(let dx=-16;dx<=-10;dx++)for(let dz=-6;dz<=-3;dz++)for(let dy=1;dy<=4;dy++)
  if(dy===4||dx===-16||dx===-10||dz===-6)w.set(x+dx,y+dy,z+dz,33);
 w.set(x-15,y+1,z-5,23);w.set(x-13,y,z-5,9);
 w.set(x+10,y+1,z-5,20);w.set(x+12,y+1,z-5,21);w.set(x+14,y+1,z-5,22);
 w.tiles.set(key3(x+12,y+1,z-5),{kind:'furnace',slots:[stack(4,32),stack(101,8),null],fuel:80,fuelMax:80,progress:0,recipeId:19});
 w.tiles.set(key3(x+14,y+1,z-5),{kind:'chest',slots:new Array(27).fill(null)});
 this.inventory.fill(null);[200,210,220,230,221,222,223,23,7].forEach((id,i)=>this.inventory[i]=stack(id,ITEMS[id].stack));
 for(let i=0;i<pads.length;i++)if(ITEMS[pads[i]])this.inventory[i+9]=stack(pads[i],64);
 this.player=this.newPlayer({x:x+.5,y:y+1.02,z:z+7.5});this.player.yaw=0;this.player.pitch=-.10;
 this.spawn={x:this.player.x,y:this.player.y,z:this.player.z};this.mobs=this.mobs.filter(m=>!MOB_TYPES[m.type].hostile);
 this.showJourney=false;this.time=160;this.previewCenter={...this.player};this.inventoryChanged();this.updateStream(true);
};
