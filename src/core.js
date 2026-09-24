'use strict';
/* BroCraft's original engine. All runtime assets are generated locally. */
const BC = globalThis.BC = {};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
const mod=(n,m)=>(n%m+m)%m;
const key3=(x,y,z)=>`${x},${y},${z}`;
const key2=(x,z)=>`${x},${z}`;
function seedHash(s){let h=2166136261;for(let i=0;i<String(s).length;i++){h^=String(s).charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function hash3(x,y,z,seed=0){let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(z|0,2147483647)^seed;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;}
class Noise{
 constructor(seed){this.seed=seed|0;}
 n2(x,z){const ix=Math.floor(x),iz=Math.floor(z),u=smooth(x-ix),v=smooth(z-iz),s=this.seed;return lerp(lerp(hash3(ix,0,iz,s),hash3(ix+1,0,iz,s),u),lerp(hash3(ix,0,iz+1,s),hash3(ix+1,0,iz+1,s),u),v);}
 n3(x,y,z){const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),u=smooth(x-ix),v=smooth(y-iy),w=smooth(z-iz),s=this.seed;return lerp(lerp(lerp(hash3(ix,iy,iz,s),hash3(ix+1,iy,iz,s),u),lerp(hash3(ix,iy+1,iz,s),hash3(ix+1,iy+1,iz,s),u),v),lerp(lerp(hash3(ix,iy,iz+1,s),hash3(ix+1,iy,iz+1,s),u),lerp(hash3(ix,iy+1,iz+1,s),hash3(ix+1,iy+1,iz+1,s),u),v),w);}
 fbm(x,z){return this.n2(x,z)*.57+this.n2(x*2.03+43,z*2.03-27)*.28+this.n2(x*4.07-12,z*4.07+56)*.15;}
}
const BLOCKS=BC.BLOCKS=[];
function block(id,name,color,opts={}){BLOCKS[id]={id,name,color,solid:true,opaque:true,hardness:1,tool:null,minTier:0,drop:id,stack:64,...opts};return BLOCKS[id];}
block(0,'Air','#ffffff',{solid:false,opaque:false,hardness:0,drop:0,replaceable:true});
block(1,'Grass block','#709b42',{hardness:.65,tool:'shovel',drop:2});
block(2,'Dirt','#8c623f',{hardness:.6,tool:'shovel'});
block(3,'Stone','#8d9290',{hardness:3,tool:'pick',minTier:1,drop:8});
block(4,'Sand','#d9cb8d',{hardness:.5,tool:'shovel'});
block(5,'Oak log','#796047',{hardness:2.2,tool:'axe'});
block(6,'Oak leaves','#4c873f',{hardness:.25,opaque:false,drop:0,leaf:true});
block(7,'Oak planks','#b59257',{hardness:1.7,tool:'axe'});
block(8,'Cobblestone','#828a84',{hardness:3.2,tool:'pick',minTier:1});
block(9,'Water','#448cad',{solid:false,opaque:false,transparent:true,hardness:Infinity,drop:0,replaceable:true,liquid:true});
block(10,'Bedrock','#3b4347',{hardness:Infinity,drop:0});
block(11,'Coal ore','#898c88',{hardness:3.4,tool:'pick',minTier:1,drop:101,ore:'#333c3d'});
block(12,'Iron ore','#99928a',{hardness:3.8,tool:'pick',minTier:2,drop:102,ore:'#cda882'});
block(13,'Copper ore','#8a9186',{hardness:3.7,tool:'pick',minTier:2,drop:104,ore:'#b9744d'});
block(14,'Gold ore','#888e8a',{hardness:4,tool:'pick',minTier:3,drop:106,ore:'#e7bf51'});
block(15,'Emberstone ore','#777e7c',{hardness:4.1,tool:'pick',minTier:3,drop:108,ore:'#d5644c'});
block(16,'Aether ore','#747f82',{hardness:4.6,tool:'pick',minTier:3,drop:109,ore:'#62d6d2'});
block(17,'Snowy grass','#d5e5e1',{hardness:.7,tool:'shovel',drop:2});
block(18,'Ice','#91c1cf',{hardness:.8,opaque:false,transparent:true,slippery:true});
block(19,'Glass','#c6e8dd',{hardness:.4,opaque:false,transparent:true,drop:0});
block(20,'Workbench','#ae8651',{hardness:2.4,tool:'axe',station:'craft'});
block(21,'Furnace','#777d77',{hardness:4,tool:'pick',minTier:1,station:'furnace'});
block(22,'Chest','#af8146',{hardness:2,tool:'axe',station:'chest'});
block(23,'Torch','#eabd60',{hardness:.05,solid:false,opaque:false,shape:'torch',light:1});
block(24,'Cactus','#4c9147',{hardness:.5,hazard:true});
block(25,'Meadow grass','#7ca244',{hardness:.03,solid:false,opaque:false,replaceable:true,shape:'plant',drop:0});
block(26,'Sun daisy','#e8cf71',{hardness:.03,solid:false,opaque:false,replaceable:true,shape:'plant'});
block(27,'Forest mushroom','#b69072',{hardness:.03,solid:false,opaque:false,replaceable:true,shape:'plant',food:1});
block(28,'Berry shrub','#548441',{hardness:.1,solid:false,opaque:false,shape:'plant',drop:111});
block(29,'Gravel','#9a9487',{hardness:.75,tool:'shovel'});
block(30,'Birch log','#d4d4b5',{hardness:2.2,tool:'axe'});
block(31,'Birch leaves','#779547',{hardness:.25,opaque:false,drop:0,leaf:true});
block(32,'Clay bricks','#aa735a',{hardness:2.2,tool:'pick',minTier:1});
block(33,'Deepstone','#545f63',{hardness:4.2,tool:'pick',minTier:1,drop:8});
block(34,'Lava','#ed873d',{solid:false,opaque:false,hardness:Infinity,drop:0,replaceable:true,liquid:true,hazard:true,light:1});
block(35,'Cloud wool','#e1e1c7',{hardness:.7});
block(36,'Bedroll','#bb6750',{hardness:.7,tool:'axe',station:'bed',shape:'bed',opaque:false});
block(37,'Sandstone','#c7b67e',{hardness:1.8,tool:'pick',minTier:1});
block(38,'Mossy stone','#7c8968',{hardness:3,tool:'pick',minTier:1});
block(39,'Wild poppy','#cc6954',{hardness:.03,solid:false,opaque:false,replaceable:true,shape:'plant'});
block(40,'Snow block','#dbe7e0',{hardness:.45,tool:'shovel'});
block(41,'Clay','#9baca4',{hardness:.6,tool:'shovel'});
block(42,'Woodland fern','#66944b',{hardness:.03,solid:false,opaque:false,replaceable:true,shape:'plant',drop:0});
const ITEMS=BC.ITEMS={};
for(const b of BLOCKS)if(b&&b.id)ITEMS[b.id]={...b,place:b.id};
function item(id,name,color,extra={}){ITEMS[id]={id,name,color,stack:64,...extra};}
item(100,'Stick','#9e7b4f');item(101,'Coal','#3a4244',{fuel:80});item(102,'Raw iron','#b79a7b');item(103,'Iron ingot','#d1d7d1');item(104,'Raw copper','#b87b51');item(105,'Copper ingot','#c48a64');item(106,'Raw gold','#d4ae52');item(107,'Gold ingot','#edce75');item(108,'Ember dust','#d16e52');item(109,'Aether crystal','#79d9d3');item(110,'Charcoal','#49504b',{fuel:80});item(111,'Wild berries','#c37269',{food:3});item(112,'Raw meat','#c18673',{food:3});item(113,'Roasted meat','#a87a4a',{food:8});item(114,'Orchard apple','#c85f4d',{food:4});item(115,'Feather','#e0e4d6');item(116,'Bone','#d2d5ba');item(117,'Hide','#a1845a');item(118,'Roasted mushroom','#ad8655',{food:4});
ITEMS[5].fuel=15;ITEMS[30].fuel=15;ITEMS[7].fuel=15;ITEMS[100].fuel=5;ITEMS[22].fuel=15;ITEMS[20].fuel=15;
const TIERS=[['Wood',7,2.2,60,'#aa8b53'],['Stone',8,4.2,132,'#999f95'],['Iron',103,6.5,251,'#d4d7cb'],['Aether',109,9.2,1562,'#71d5ca']];
for(let t=0;t<4;t++)for(let c=0;c<4;c++){let type=['pick','axe','shovel','sword'][c],name=['pickaxe','axe','shovel','sword'][c];item(200+t*10+c,TIERS[t][0]+' '+name,TIERS[t][4],{stack:1,tool:type,tier:t+1,speed:TIERS[t][2],maxDurability:TIERS[t][3],damage:(type==='sword'?4:2)+t*1.6});}
function stack(id,n=1,dur){if(!ITEMS[id]||n<=0)return null;return {id,n:Math.min(n,ITEMS[id].stack),...(ITEMS[id].maxDurability?{dur:dur??ITEMS[id].maxDurability}:{})};}
function cloneStack(s){return s?{...s}:null;}
function sameStack(a,b){return a&&b&&a.id===b.id&&!ITEMS[a.id].maxDurability;}
function addStack(arr,incoming){if(!incoming)return 0;let left=incoming.n;const def=ITEMS[incoming.id];if(!def)return left;if(def.stack>1)for(let i=0;i<arr.length&&left;i++)if(sameStack(arr[i],incoming)){let count=Math.min(left,def.stack-arr[i].n);arr[i].n+=count;left-=count;}for(let i=0;i<arr.length&&left;i++)if(!arr[i]){let count=Math.min(left,def.stack);arr[i]={...incoming,n:count};left-=count;}return left;}
function countItem(arr,id){let n=0;for(const s of arr)if(s?.id===id)n+=s.n;return n;}
function removeItems(arr,id,n){if(countItem(arr,id)<n)return false;for(let i=0;i<arr.length&&n;i++)if(arr[i]?.id===id){let take=Math.min(n,arr[i].n);arr[i].n-=take;n-=take;if(!arr[i].n)arr[i]=null;}return true;}
const RECIPES=BC.RECIPES=[];
function recipe(name,pattern,map,out,n=1,group='Basics'){const p=pattern.map(row=>[...row].map(c=>map[c]||0));RECIPES.push({key:'r'+RECIPES.length,name,pattern:p,out,n,group});}
recipe('Oak planks',['L'],{L:5},7,4);recipe('Birch planks',['L'],{L:30},7,4);recipe('Sticks',['P','P'],{P:7},100,4);recipe('Workbench',['PP','PP'],{P:7},20);recipe('Torches',['C','S'],{C:101,S:100},23,4);recipe('Charcoal torches',['C','S'],{C:110,S:100},23,4);
recipe('Sandstone',['SS','SS'],{S:4},37,1,'Building');recipe('Clay bricks',['CC','CC'],{C:41},32,4,'Building');recipe('Furnace',['CCC','C C','CCC'],{C:8},21,1,'Workshop');recipe('Chest',['PPP','P P','PPP'],{P:7},22,1,'Workshop');recipe('Bedroll',['WWW','PPP'],{W:35,P:7},36,1,'Workshop');
for(let t=0;t<4;t++){const mat=TIERS[t][1],map={M:mat,S:100};recipe(TIERS[t][0]+' pickaxe',['MMM',' S ',' S '],map,200+t*10,1,'Tools');recipe(TIERS[t][0]+' axe',['MM','MS',' S'],map,201+t*10,1,'Tools');recipe(TIERS[t][0]+' shovel',['M','S','S'],map,202+t*10,1,'Tools');recipe(TIERS[t][0]+' sword',['M','M','S'],map,203+t*10,1,'Tools');}
function matchRecipe(grid,size){let minX=size,minY=size,maxX=-1,maxY=-1;for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(grid[y*size+x]){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}if(maxX<0)return null;const w=maxX-minX+1,h=maxY-minY+1;for(const r of RECIPES){if(r.pattern.length!==h||r.pattern[0].length!==w)continue;for(let mirror=0;mirror<2;mirror++){let ok=true;for(let y=0;y<h&&ok;y++)for(let x=0;x<w;x++)if((grid[(minY+y)*size+minX+x]?.id||0)!==r.pattern[y][mirror?w-1-x:x]){ok=false;break;}if(ok)return r;}}return null;}
function recipeCost(r){const cost={};for(const row of r.pattern)for(const id of row)if(id)cost[id]=(cost[id]||0)+1;return cost;}
const SMELTS=BC.SMELTS={102:103,104:105,106:107,4:19,5:110,30:110,112:113,27:118,8:3};
function tickFurnace(t,dt){const s=t.slots;let result=SMELTS[s[0]?.id],can=!!result&&(!s[2]||(s[2].id===result&&s[2].n<64));if(t.recipeId!==result){t.progress=0;t.recipeId=result||0;}if(t.fuel<=0&&can&&s[1]&&ITEMS[s[1].id]?.fuel){t.fuel=ITEMS[s[1].id].fuel;t.fuelMax=t.fuel;if(--s[1].n===0)s[1]=null;}if(t.fuel>0){const burn=Math.min(dt,t.fuel);t.fuel=Math.max(0,t.fuel-dt);if(can){t.progress+=burn;if(t.progress>=8){if(s[2])s[2].n++;else s[2]=stack(result);if(--s[0].n===0)s[0]=null;t.progress-=8;}}else t.progress=0;}else if(!can)t.progress=0;}
const CHUNK=16,HEIGHT=96,SEA=30;
const chunkIndex=(x,y,z)=>x+z*16+y*256;
class VoxelWorld{
 constructor(seed='WILDER-826'){
  this.seed=String(seed);this.hash=seedHash(this.seed);this.noise=new Noise(this.hash);this.caveNoise=new Noise(this.hash^0x78f87);this.chunks=new Map();this.edits=new Map();this.editChunks=new Map();this.tiles=new Map();this.torches=new Map();this.dirty=new Set();this.onDispose=null;this.generated=0;
 }
 column(x,z){const n=this.noise;const continental=n.fbm(x/185+20,z/185-31);const hill=n.fbm(x/43-93,z/43+62);const ridge=1-Math.abs(n.n2(x/103+21,z/103-77)*2-1);const mountain=Math.max(0,n.n2(x/245-36,z/245+53)-.55)*2.3;let h=25+(continental-.35)*38+(hill-.5)*10+Math.pow(ridge,3)*mountain*54;const river=Math.abs(n.n2(x/112+610,z/112+91)-.5);let riverFactor=Math.max(0,1-river/.035);if(continental>.38&&mountain<.46)h=lerp(h,SEA-3,riverFactor*.9);const humidity=n.n2(x/140-223,z/140+145);const temp=n.n2(x/225+513,z/225-291);h=clamp(Math.floor(h),7,82);let biome=h<SEA-3?'Ocean':h<=SEA+1?'Shore':temp<.26||h>65?'Snowfields':temp>.59&&humidity<.43?'Desert':mountain>.36?'Highlands':humidity>.48?'Woodland':'Meadow';return {h,biome,humidity,temp,river:riverFactor};
 }
 baseBlock(x,y,z,col){if(y<0)return 10;if(y>=HEIGHT)return 0;const h=col.h,n=this.noise;if(y===0||y<3&&hash3(x,y,z,this.hash)>.35)return 10;
  if(y>h){if(y<=SEA)return col.biome==='Snowfields'&&y===SEA?18:9;return 0;}
  const desert=col.biome==='Desert',beach=col.biome==='Shore';
  const cave=y>3&&y<h-3&&(this.caveNoise.n3(x/20,y/13,z/20)>.705||(Math.abs(this.caveNoise.n3(x/32+90,y/18-15,z/32-72)-.5)<.032&&this.caveNoise.n3(x/58-18,y/22+39,z/58)>.45));
  const ravine=y>7&&y<h&&col.biome==='Highlands'&&Math.abs(n.n2(x/75+327,z/75-661)-.5)<.012&&n.n2(x/32+44,z/32-94)>.58;
  if(cave||ravine)return y<6?34:0;
  if(y===h){if(h<SEA-1)return hash3(x,1,z,this.hash)>.8?29:4;if(desert||beach)return 4;if(col.biome==='Snowfields')return 17;if(col.biome==='Highlands'&&h>55)return 3;return 1;}
  if(y>h-4){if(desert||beach)return 4;if(h<SEA-1)return 4;return 2;}
  if(desert&&y>h-8)return 37;
  const vein=hash3(Math.floor(x/3),Math.floor(y/3),Math.floor(z/3),this.hash^91429),r=hash3(x,y,z,this.hash^3181);
  if(r<.54){if(y<16&&vein>.982)return 16;if(y<23&&vein>.953&&vein<.977)return 15;if(y<27&&vein>.926&&vein<.95)return 14;if(y<43&&vein>.852&&vein<.906)return 12;if(y>17&&y<48&&vein>.768&&vein<.83)return 13;if(y<h-4&&vein>.654&&vein<.736)return 11;}
  if(y<h-5&&y>SEA-6&&n.n3(x/9,y/8,z/9)>.72)return 41;
  return y<15?33:3;
 }
 getChunk(cx,cz){return this.chunks.get(key2(cx,cz));}
 get(x,y,z){x=Math.floor(x);y=Math.floor(y);z=Math.floor(z);if(y<0)return 10;if(y>=HEIGHT)return 0;const c=this.getChunk(Math.floor(x/16),Math.floor(z/16));if(c)return c.data[chunkIndex(mod(x,16),y,mod(z,16))];const edited=this.edits.get(key3(x,y,z));if(edited!==undefined)return edited;const col=this.column(x,z);return y<=col.h? (y===0?10:3):(y<=SEA?9:0);}
 solid(x,y,z){return !!BLOCKS[this.get(x,y,z)]?.solid;}
 opaque(x,y,z){return !!BLOCKS[this.get(x,y,z)]?.opaque;}
 loaded(x,z){return this.chunks.has(key2(Math.floor(x/16),Math.floor(z/16)));}
 generate(cx,cz){const key=key2(cx,cz);if(this.chunks.has(key))return this.chunks.get(key);const data=new Uint8Array(16*16*HEIGHT),columns=[],tops=new Int16Array(256);const c={cx,cz,key,data,columns,tops,mesh:null,waterMesh:null,dirty:true};const sx=cx*16,sz=cz*16;
  for(let z=0;z<16;z++)for(let x=0;x<16;x++){const col=this.column(sx+x,sz+z);columns[x+z*16]=col;for(let y=0;y<=Math.max(col.h,SEA);y++)data[chunkIndex(x,y,z)]=this.baseBlock(sx+x,y,sz+z,col);}
  const put=(x,y,z,id,onlyAir=false)=>{x-=sx;z-=sz;if(x<0||x>=16||z<0||z>=16||y<1||y>=HEIGHT)return;const i=chunkIndex(x,y,z);if(!onlyAir||data[i]===0)data[i]=id;};
  for(let gz=Math.floor((sz-4)/7);gz<=Math.floor((sz+19)/7);gz++)for(let gx=Math.floor((sx-4)/7);gx<=Math.floor((sx+19)/7);gx++){
   const x=gx*7+Math.floor(hash3(gx,73,gz,this.hash)*5)+1,z=gz*7+Math.floor(hash3(gx,27,gz,this.hash)*5)+1,col=this.column(x,z),r=hash3(gx,561,gz,this.hash),chance=col.biome==='Woodland'?.71:col.biome==='Meadow'?.14:col.biome==='Snowfields'?.32:col.biome==='Highlands'?.15:0;
   if(r>chance||col.h<SEA+2||col.h>71)continue;const h=4+Math.floor(hash3(gx,89,gz,this.hash)*3),birch=hash3(gx,14,gz,this.hash)>.72,trunk=birch?30:5,leaf=birch?31:6;
   if(col.biome==='Snowfields'){
    for(let yy=2;yy<=h+1;yy++){const rad=Math.max(0,Math.ceil((h+1-yy)/2));for(let dz=-rad;dz<=rad;dz++)for(let dx=-rad;dx<=rad;dx++)if(Math.abs(dx)+Math.abs(dz)<=rad+1)put(x+dx,col.h+yy,z+dz,leaf,true);}
   }else for(let dy=-2;dy<=1;dy++){const rad=dy===1?1:2;for(let dz=-rad;dz<=rad;dz++)for(let dx=-rad;dx<=rad;dx++){if(Math.abs(dx)===rad&&Math.abs(dz)===rad&&(dy===1||hash3(x+dx,dy,z+dz,this.hash)>.5))continue;put(x+dx,col.h+h+dy,z+dz,leaf,true);}}
   for(let yy=1;yy<=h;yy++)put(x,col.h+yy,z,trunk);
  }
  for(let z=0;z<16;z++)for(let x=0;x<16;x++){const wx=sx+x,wz=sz+z,col=columns[x+z*16],y=col.h+1,r=hash3(wx,93,wz,this.hash);if(col.h<=SEA+1||data[chunkIndex(x,y,z)])continue;
   if(col.biome==='Desert'){if(r<.013)for(let yy=0;yy<2+Math.floor(hash3(wx,122,wz,this.hash)*2);yy++)put(wx,y+yy,wz,24);}
   else if(col.biome!=='Snowfields'&&col.biome!=='Highlands'){
    if(r<.018)put(wx,y,wz,28);else if(r<.024)put(wx,y,wz,27);else if(r<.048)put(wx,y,wz,hash3(wx,82,wz,this.hash)>.5?26:39);else if(r<.23)put(wx,y,wz,col.biome==='Woodland'&&r<.11?42:25);
   }
   if(col.h>15&&hash3(wx,211,wz,this.hash)<.013)for(let yy=7;yy<col.h-7;yy++)if(data[chunkIndex(x,yy,z)]===0&&BLOCKS[data[chunkIndex(x,yy-1,z)]]?.solid){put(wx,yy,wz,27);break;}
  }
  // Rare, deterministic ruins and cabins, composed across chunk boundaries.
  for(let gz=Math.floor((sz-10)/88);gz<=Math.floor((sz+25)/88);gz++)for(let gx=Math.floor((sx-10)/88);gx<=Math.floor((sx+25)/88);gx++){
   const r=hash3(gx,911,gz,this.hash);if(r>.58)continue;const x=gx*88+15+Math.floor(hash3(gx,912,gz,this.hash)*46),z=gz*88+15+Math.floor(hash3(gx,913,gz,this.hash)*46),col=this.column(x,z),y=col.h+1;
   if(col.h<=SEA+2||col.h>61||Math.abs(this.column(x+6,z+6).h-col.h)>3)continue;
   const cabin=r<.18;
   for(let dz=-3;dz<=3;dz++)for(let dx=-3;dx<=3;dx++){
    for(let yy=this.column(x+dx,z+dz).h+1;yy<y;yy++)put(x+dx,yy,z+dz,38);
    put(x+dx,y-1,z+dz,cabin?7:38);
    for(let dy=0;dy<5;dy++)put(x+dx,y+dy,z+dz,0);
    if(Math.abs(dx)===3||Math.abs(dz)===3){const wall=cabin?3:1+Math.floor(hash3(x+dx,922,z+dz,this.hash)*3);for(let dy=0;dy<wall;dy++){if(dx===0&&dz===-3&&dy<2)continue;put(x+dx,y+dy,z+dz,cabin?(Math.abs(dx)===3&&Math.abs(dz)===3?5:7):38);}if(cabin&&Math.abs(dx)===3&&dz===0)put(x+dx,y+1,z+dz,19);}
    if(cabin)put(x+dx,y+3,z+dz,7);
   }
   put(x+2,y,z+2,22);put(x-2,y,z+2,23);if(cabin)put(x-2,y,z+1,20);
  }
  const edits=this.editChunks.get(key);if(edits)for(const [k,id] of edits){const [x,y,z]=k.split(',').map(Number);data[chunkIndex(mod(x,16),y,mod(z,16))]=id;}
  this.chunks.set(key,c);this.generated++;
  for(let z=0;z<16;z++)for(let x=0;x<16;x++){this.updateTop(c,x,z);for(let y=0;y<HEIGHT;y++){const id=data[chunkIndex(x,y,z)],wx=sx+x,wz=sz+z;if(id===23)this.torches.set(key3(wx,y,wz),{x:wx+.5,y:y+.7,z:wz+.5});if(id===22&&!this.tiles.has(key3(wx,y,wz))){const s=new Array(27).fill(null);if(!this.edits.has(key3(wx,y,wz))){s[0]=stack(114,3);s[1]=stack(101,4);s[2]=stack(103,2);if(hash3(wx,y,wz,this.hash)>.6)s[3]=stack(109);}this.tiles.set(key3(wx,y,wz),{kind:'chest',slots:s});}}}
  this.markDirty(cx,cz);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]])this.markDirty(cx+dx,cz+dz);return c;
 }
 updateTop(c,x,z){let y=HEIGHT-1;for(;y>=0;y--)if(BLOCKS[c.data[chunkIndex(x,y,z)]]?.opaque)break;c.tops[x+z*16]=y;}
 top(x,z){const c=this.getChunk(Math.floor(x/16),Math.floor(z/16));return c?c.tops[mod(x,16)+mod(z,16)*16]:this.column(x,z).h;}
 ground(x,z){if(!this.loaded(x,z))return this.column(x,z).h+1;for(let y=HEIGHT-2;y>0;y--){const id=this.get(x,y,z);if(BLOCKS[id]?.solid&&id!==6&&id!==31&&id!==5&&id!==30&&id!==24)return y+1;}return 2;}
 markDirty(cx,cz){const c=this.getChunk(cx,cz);if(c){c.dirty=true;this.dirty.add(c.key);}}
 set(x,y,z,id){x=Math.floor(x);y=Math.floor(y);z=Math.floor(z);if(y<1||y>=HEIGHT||!BLOCKS[id])return false;const cx=Math.floor(x/16),cz=Math.floor(z/16),c=this.generate(cx,cz),old=this.get(x,y,z);if(old===10||old===id)return false;const k=key3(x,y,z);c.data[chunkIndex(mod(x,16),y,mod(z,16))]=id;this.edits.set(k,id);if(!this.editChunks.has(c.key))this.editChunks.set(c.key,new Map());this.editChunks.get(c.key).set(k,id);this.updateTop(c,mod(x,16),mod(z,16));this.markDirty(cx,cz);
  if(mod(x,16)===0)this.markDirty(cx-1,cz);if(mod(x,16)===15)this.markDirty(cx+1,cz);if(mod(z,16)===0)this.markDirty(cx,cz-1);if(mod(z,16)===15)this.markDirty(cx,cz+1);
  if(old===23||id===23){this.torches.delete(k);if(id===23)this.torches.set(k,{x:x+.5,y:y+.7,z:z+.5});for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)this.markDirty(cx+dx,cz+dz);}
  if(BLOCKS[old]?.station&&id!==old)this.tiles.delete(k);if(id===22&&!this.tiles.has(k))this.tiles.set(k,{kind:'chest',slots:new Array(27).fill(null)});if(id===21&&!this.tiles.has(k))this.tiles.set(k,{kind:'furnace',slots:[null,null,null],fuel:0,fuelMax:0,progress:0,recipeId:0});return true;
 }
 loadEdits(edits){for(const [x,y,z,id] of edits||[]){if(!Number.isInteger(x)||!Number.isInteger(y)||!Number.isInteger(z)||y<1||y>=HEIGHT||!BLOCKS[id])continue;const k=key3(x,y,z),ck=key2(Math.floor(x/16),Math.floor(z/16));this.edits.set(k,id);if(!this.editChunks.has(ck))this.editChunks.set(ck,new Map());this.editChunks.get(ck).set(k,id);}}
 serializedEdits(){return [...this.edits].map(([k,id])=>[...k.split(',').map(Number),id]);}
 unload(cx,cz,range){for(const [key,c] of this.chunks)if(Math.max(Math.abs(c.cx-cx),Math.abs(c.cz-cz))>range){if(this.onDispose)this.onDispose(c);this.chunks.delete(key);this.dirty.delete(key);}}
 dispose(){for(const c of this.chunks.values())if(this.onDispose)this.onDispose(c);this.chunks.clear();this.dirty.clear();}
 findSpawn(){let best=null,bestScore=-Infinity;for(const radius of [64,192,512,1200]){const step=radius<=64?5:radius<=192?12:28;for(let z=-radius;z<=radius;z+=step)for(let x=-radius;x<=radius;x+=step){const c=this.column(x,z);if(c.h<SEA+3||c.h>55||c.biome==='Desert'||c.biome==='Snowfields')continue;const slope=Math.abs(this.column(x+3,z).h-c.h)+Math.abs(this.column(x,z+3).h-c.h);const score=(c.biome==='Woodland'?10:5)-slope*3-Math.hypot(x,z)*.02;if(score>bestScore){bestScore=score;best={x:x+.5,y:c.h+1.01,z:z+.5};}}if(best)return best;}for(let z=-1500;z<1500;z+=25)for(let x=-1500;x<1500;x+=25){const c=this.column(x,z);if(c.h>SEA+1&&c.h<70)return {x:x+.5,y:c.h+1.01,z:z+.5};}return {x:.5,y:SEA+2,z:.5};}
}
function voxelRay(world,origin,dir,reach=5){let x=Math.floor(origin[0]),y=Math.floor(origin[1]),z=Math.floor(origin[2]);const step=dir.map(v=>v>0?1:-1),delta=dir.map(v=>Math.abs(v)>1e-10?Math.abs(1/v):Infinity),pos=[x,y,z];const tMax=dir.map((v,i)=>Math.abs(v)<1e-10?Infinity:((v>0?pos[i]+1:pos[i])-origin[i])/v);let dist=0,normal=[0,0,0];for(let it=0;it<80&&dist<=reach;it++){const id=world.get(x,y,z);if(id&&id!==9&&id!==34)return {x,y,z,id,normal:[...normal],distance:dist};const a=tMax[0]<tMax[1]?(tMax[0]<tMax[2]?0:2):(tMax[1]<tMax[2]?1:2);dist=tMax[a];tMax[a]+=delta[a];normal=[0,0,0];normal[a]=-step[a];if(a===0)x+=step[a];else if(a===1)y+=step[a];else z+=step[a];}return null;}
function rayAABB(o,d,min,max,reach){let tmin=0,tmax=reach;for(let i=0;i<3;i++){if(Math.abs(d[i])<1e-9){if(o[i]<min[i]||o[i]>max[i])return null;continue;}let a=(min[i]-o[i])/d[i],b=(max[i]-o[i])/d[i];if(a>b)[a,b]=[b,a];tmin=Math.max(tmin,a);tmax=Math.min(tmax,b);if(tmin>tmax)return null;}return tmin;}
Object.assign(BC,{VoxelWorld,Noise,hash3,seedHash,stack,cloneStack,addStack,countItem,removeItems,matchRecipe,recipeCost,tickFurnace,voxelRay,rayAABB,CHUNK,HEIGHT,SEA});
