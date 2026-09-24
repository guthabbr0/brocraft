'use strict';
const M4={
 identity:()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),
 perspective(fov,aspect,near,far){const m=new Float32Array(16),f=1/Math.tan(fov/2);m[0]=f/aspect;m[5]=f;m[10]=(far+near)/(near-far);m[11]=-1;m[14]=2*far*near/(near-far);return m;},
 multiply(a,b){const m=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)m[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return m;},
 lookAt(eye,target){const z=norm(sub(eye,target)),x=norm(cross([0,1,0],z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);},
 model(x=0,y=0,z=0,yaw=0,sx=1,sy=sx,sz=sx){const c=Math.cos(yaw),s=Math.sin(yaw);return new Float32Array([c*sx,0,s*sx,0,0,sy,0,0,-s*sz,0,c*sz,0,x,y,z,1]);},
 billboard(center,size,right,up){return new Float32Array([right[0]*size,right[1]*size,right[2]*size,0,up[0]*size,up[1]*size,up[2]*size,0,0,0,1,0,center[0],center[1],center[2],1]);}
};
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}function sub(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]];}function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}function norm(a){const d=Math.hypot(...a)||1;return a.map(v=>v/d);}
function rgb(hex){return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];}
const FACES=[
 {n:[1,0,0],v:[[1,0,1],[1,0,0],[1,1,0],[1,1,1]],shade:.78},
 {n:[-1,0,0],v:[[0,0,0],[0,0,1],[0,1,1],[0,1,0]],shade:.69},
 {n:[0,1,0],v:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],shade:1},
 {n:[0,-1,0],v:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],shade:.49},
 {n:[0,0,1],v:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]],shade:.87},
 {n:[0,0,-1],v:[[1,0,0],[0,0,0],[0,1,0],[1,1,0]],shade:.76}
];
function blockTile(id,face,lit=false){if(id===1)return face===2?1:face===3?2:43;if(id===17)return face===2?40:face===3?2:46;if(id===5)return face===2||face===3?44:5;if(id===30)return face===2||face===3?45:30;if(id===20)return face===2?47:20;if(id===21)return face===5?(lit?81:48):21;if(id===22)return face===5?49:face===2?50:22;return id;}
const Assets=BC.Assets={tiles:[],icons:{},tileForItem:{},atlas:null};
function makeAssets(){
 const atlas=document.createElement('canvas');atlas.width=atlas.height=512;const ac=atlas.getContext('2d');ac.imageSmoothingEnabled=false;
 const colors={43:'#88623f',44:'#b39059',45:'#c8bd91',46:'#906e50',47:'#a57e47',48:'#7c827a',49:'#ac7d42',50:'#aa8245',60:'#ffe6aa',61:'#e5edcf',62:'#ffffff',63:'#ffffff',65:'#c5976e',66:'#557d66',67:'#a9a591',68:'#d9a397',69:'#e2e2ce',70:'#d9b267',71:'#76865b',72:'#537774',73:'#586472',74:'#d7d5b9',75:'#534f47',76:'#6e945b',77:'#182820',78:'#524b3b',79:'#14241c',80:'#eadbb7',81:'#777d76'};
 function tile(t){const c=document.createElement('canvas');c.width=c.height=16;Assets.tiles[t]=c;return c;}
 function fillNoise(ctx,t,color,amp=14,alpha=255){const base=rgb(color),img=ctx.createImageData(16,16);for(let y=0;y<16;y++)for(let x=0;x<16;x++){const i=(x+y*16)*4;const n=(hash3(x,y,t,5293)-.5)*amp+(hash3(x>>1,y>>1,t,1567)-.5)*amp;for(let k=0;k<3;k++)img.data[i+k]=clamp(base[k]+n,0,255);img.data[i+3]=alpha;}ctx.putImageData(img,0,0);}
 const rect=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
 for(let t=0;t<192;t++){
  const canvas=tile(t),c=canvas.getContext('2d');c.imageSmoothingEnabled=false;let color=BLOCKS[t]?.color||colors[t]||ITEMS[t]?.color||'#dedec7';fillNoise(c,t,color,t===63?0:16,t===9?162:t===18?172:t===19?55:255);
  if(t===0)c.clearRect(0,0,16,16);
  if([3,8,21,33,38,48,81].includes(t)){for(let yy=0;yy<16;yy+=4)for(let xx=-4;xx<16;xx+=6){const off=(yy/4%2)*3;rect(c,xx+off,yy,6,1,t===33?'#445155':'#65716a');rect(c,xx+off,yy,1,4,t===33?'#465156':'#6c7871');rect(c,xx+off+1,yy+1,4,1,t===33?'#606b6c':'#979e90');}if(t===3){c.globalAlpha=.62;fillNoise(c,333,'#90968f',14);c.globalAlpha=1;}if(t===38)for(let i=0;i<22;i++)rect(c,Math.floor(hash3(i,31,t)*16),Math.floor(hash3(i,41,t)*16),2,2,'#688345');}
  if(BLOCKS[t]?.ore){fillNoise(c,t,'#89908b',19);for(let i=0;i<8;i++){const x=1+Math.floor(hash3(i,84,t)*12),y=1+Math.floor(hash3(i,43,t)*12);rect(c,x-1,y,3,3,'#59655e');rect(c,x,y,2,2,BLOCKS[t].ore);rect(c,x,y,1,1,'#d7d2b580');}}
  if(t===1||t===17){for(let i=0;i<40;i++){const x=Math.floor(hash3(i,23,t)*16),y=Math.floor(hash3(i,25,t)*16);rect(c,x,y,2,1,t===1?'#88a955':'#dce7df');}}
  if(t===43||t===46){for(let x=0;x<16;x++){const h=3+Math.floor(hash3(x,18,t)*4);rect(c,x,0,1,h,t===43?'#719b43':'#d4e2d8');rect(c,x,0,1,1,t===43?'#8eaf55':'#ecf0df');if(t===43)rect(c,x,h,1,1,'#5c7637');}}
  if(t===5||t===30){for(let x=0;x<16;x++){if(t===5){if(x%3===0)rect(c,x,0,1,16,'#514735');if(x%4===1)rect(c,x,0,1,16,'#9d8052');}else if(x%4===0)rect(c,x,0,1,16,'#b8b9a0');}if(t===30)for(let i=0;i<12;i++)rect(c,Math.floor(hash3(i,24,t)*16),Math.floor(hash3(i,73,t)*16),2+Math.floor(hash3(i,39,t)*4),1,'#525b4d');}
  if(t===44||t===45){rect(c,0,0,16,2,t===44?'#736048':'#929b80');rect(c,0,14,16,2,t===44?'#736048':'#929b80');rect(c,0,0,2,16,t===44?'#736048':'#929b80');rect(c,14,0,2,16,t===44?'#736048':'#929b80');c.strokeStyle=t===44?'#907040':'#b0a779';c.lineWidth=1;for(let s=3;s<8;s+=2)c.strokeRect(s+.5,s+.5,15-2*s,15-2*s);}
  if([7,20,22,47,49,50].includes(t)){for(let y=0;y<16;y+=4){rect(c,0,y,16,1,'#866839');rect(c,0,y+1,16,1,'#cba366');rect(c,((y/4)%2)*8+3,y,1,4,'#91713f');}if(t===47){rect(c,0,0,16,2,'#614e33');rect(c,0,14,16,2,'#614e33');rect(c,0,0,2,16,'#614e33');rect(c,14,0,2,16,'#614e33');for(let i=5;i<14;i+=4){rect(c,i,2,1,12,'#614e33');rect(c,2,i,12,1,'#614e33');}}if(t===20){rect(c,2,4,2,10,'#735333');rect(c,12,4,2,10,'#735333');rect(c,2,4,12,2,'#c0a065');rect(c,6,8,4,1,'#514c37');rect(c,8,8,1,5,'#4c4937');}if([22,49,50].includes(t)){rect(c,0,0,16,2,'#614c32');rect(c,0,14,16,2,'#614c32');rect(c,0,0,2,16,'#614c32');rect(c,14,0,2,16,'#614c32');rect(c,1,5,14,1,'#674d30');if(t===49){rect(c,7,5,3,5,'#e0cf7d');rect(c,8,7,1,2,'#86713e');}}}
  if(t===48||t===81){rect(c,2,2,12,3,'#4a564f');rect(c,3,3,10,1,'#a1a991');rect(c,2,8,12,6,'#343e36');rect(c,3,9,10,4,'#212e26');if(t===81){for(let x=4;x<12;x++){const h=1+Math.floor(hash3(x,1,8)*4);rect(c,x,13-h,1,h,'#e5a953');rect(c,x,12,1,1,'#f6dc8f');}}}
  if(t===9){for(let i=0;i<12;i++)rect(c,Math.floor(hash3(i,73,t)*16),Math.floor(hash3(i,91,t)*16),2+Math.floor(hash3(i,9,t)*4),1,'#a7dce740');}
  if(t===34){fillNoise(c,t,'#dd7134',34);for(let i=0;i<15;i++)rect(c,Math.floor(hash3(i,73,t)*16),Math.floor(hash3(i,91,t)*16),3,2,'#f6bb58');}
  if(t===19){rect(c,0,0,16,1,'#d7efdc9c');rect(c,0,15,16,1,'#d7efdc9c');rect(c,0,0,1,16,'#d7efdc9c');rect(c,15,0,1,16,'#d7efdc9c');for(let i=0;i<5;i++)rect(c,4+i,8-i,1,1,'#d7eee885');}
  if(t===18){for(let i=0;i<12;i++)rect(c,2+i,i,2,1,'#daebeb80');}
  if(t===6||t===31){for(let y=0;y<16;y+=2)for(let x=0;x<16;x+=2){let r=hash3(x,y,t,674);if(r<.13)c.clearRect(x,y,1,2);else if(r<.4)rect(c,x,y,2,2,t===6?'#3d7234':'#5b833b');else if(r>.73)rect(c,x,y,2,1,t===6?'#79a451':'#93ae5e');}}
  if(t===24){for(let x=2;x<16;x+=4){rect(c,x,0,1,16,'#326638');rect(c,x+1,0,1,16,'#7aaa5b');}for(let i=0;i<12;i++)rect(c,Math.floor(hash3(i,38,t)*16),Math.floor(hash3(i,76,t)*16),1,1,'#d4d3a2');}
  if([25,26,27,28,39,42].includes(t)){
   c.clearRect(0,0,16,16);
   if(t===25||t===42){for(let i=0;i<7;i++){const bx=3+i*2,h=5+Math.floor(hash3(i,94,t)*8);for(let y=0;y<h;y++)rect(c,bx+Math.floor((y-h)*(.1*(i-3))),15-y,1+(y<h/2?1:0),1,['#577e38','#85a956','#6e9848'][i%3]);if(t===42)for(let y=2;y<h;y+=2)rect(c,bx-2,15-y,5,1,'#659045');}}
   if(t===26||t===39){rect(c,7,6,2,10,'#5d823d');rect(c,5,10,2,2,'#789c47');rect(c,9,12,2,2,'#789c47');rect(c,4,2,8,4,t===26?'#e8cc70':'#ca6550');rect(c,6,0,4,8,t===26?'#e9d785':'#d77863');rect(c,6,3,4,3,t===26?'#b49443':'#925240');rect(c,7,3,2,2,t===26?'#f2e7b6':'#d79e6b');}
   if(t===27){rect(c,7,8,3,7,'#cebea0');rect(c,3,5,11,4,'#a77457');rect(c,5,3,7,3,'#bd8f69');rect(c,5,5,2,1,'#e4d3a7');rect(c,10,6,2,2,'#e4d3a7');}
   if(t===28){rect(c,7,7,2,9,'#745d3d');for(let i=0;i<26;i++){let x=2+Math.floor(hash3(i,63,t)*12),y=3+Math.floor(hash3(i,82,t)*10);rect(c,x,y,3,3,i%2?'#70984e':'#4f7940');}for(let i=0;i<7;i++){let x=3+Math.floor(hash3(i,64,t)*10),y=5+Math.floor(hash3(i,85,t)*7);rect(c,x,y,2,2,'#be7063');rect(c,x,y,1,1,'#e8a393');}}
  }
  if(t===23){c.clearRect(0,0,16,16);rect(c,7,5,3,11,'#aa824a');rect(c,7,6,1,10,'#d9bb78');rect(c,6,2,5,5,'#d99b46');rect(c,7,0,3,6,'#f3d68c');rect(c,8,2,1,4,'#fff1be');}
  if(t===32){for(let y=0;y<16;y+=4){rect(c,0,y,16,1,'#cdb997');for(let x=(y%8===0?0:4);x<16;x+=8)rect(c,x,y,1,4,'#cdb997');}}
  if(t===36){rect(c,0,0,16,5,'#e5ddbe');rect(c,1,1,14,3,'#eee8ce');rect(c,0,5,16,1,'#9e644e');rect(c,0,15,16,1,'#88513e');}
  if(t===37){for(let y=3;y<16;y+=5)rect(c,0,y,16,1,'#aa9965');}
  if(t===60){fillNoise(c,t,'#ffe7aa',6);rect(c,0,0,16,1,'#e8c887');rect(c,0,15,16,1,'#e8c887');rect(c,0,0,1,16,'#e8c887');rect(c,15,0,1,16,'#e8c887');}
  if(t===61){fillNoise(c,t,'#e1e8d2',5);for(let i=0;i<7;i++)rect(c,2+Math.floor(hash3(i,2,6)*11),2+Math.floor(hash3(i,3,6)*11),3,2,'#bfccc0');}
  if(t===67){for(let i=0;i<6;i++)rect(c,Math.floor(hash3(i,83,t)*13),Math.floor(hash3(i,46,t)*13),4,5,'#60584a');}
  if(t===69){for(let y=0;y<16;y+=4)for(let x=0;x<16;x+=4)rect(c,x,y,3,1,'#c7cfb8');}
  if(t===71||t===76){for(let i=0;i<17;i++)rect(c,Math.floor(hash3(i,34,t)*15),Math.floor(hash3(i,84,t)*15),2,2,t===71?'#586c49':'#4d7446');}
  if(t===79){c.clearRect(0,0,16,16);c.fillStyle='#11231938';c.beginPath();c.ellipse(8,8,7,6,0,0,Math.PI*2);c.fill();}
  if(t>=100&&t<=118){
   c.clearRect(0,0,16,16);const co=ITEMS[t]?.color||'#ccc';
   if(t===100){for(let i=2;i<14;i++){rect(c,i,15-i,2,2,'#715539');rect(c,i,15-i,1,1,'#bc9a61');}}
   else if([103,105,107].includes(t)){rect(c,3,6,10,6,'#596357');rect(c,4,4,8,7,co);rect(c,3,7,10,4,co);rect(c,5,4,6,2,'#ffffff70');rect(c,4,10,8,1,'#00000030');}
   else if(t===109){for(let y=1;y<15;y++){let r=y<7?Math.floor(y*.58):Math.floor((15-y)*.56);rect(c,8-r,y,r*2+1,1,co);}rect(c,7,3,2,7,'#c6f0df');rect(c,10,6,1,5,'#459f99');}
   else if(t===111){rect(c,6,2,2,6,'#547c3e');rect(c,8,2,4,2,'#73a04d');rect(c,3,7,6,6,'#a75f57');rect(c,8,5,5,6,co);rect(c,4,7,2,2,'#e8a89b');rect(c,9,5,2,2,'#e8a89b');}
   else if(t===114){rect(c,7,1,2,4,'#745939');rect(c,9,2,3,2,'#7e9e4d');rect(c,4,5,9,8,co);rect(c,3,7,11,4,co);rect(c,5,6,2,3,'#e59474');rect(c,5,13,6,1,'#894a3e');}
   else if(t===115){for(let i=2;i<14;i++){rect(c,i,15-i,1,3,'#a7b5a0');if(i>4&&i<13)rect(c,i-1,13-i,4,3,co);}}
   else if(t===116){for(let i=3;i<13;i++)rect(c,i,15-i,2,2,co);rect(c,2,10,3,4,co);rect(c,11,2,3,4,co);}
   else{rect(c,5,3,7,10,co);rect(c,3,5,11,6,co);rect(c,4,5,3,2,'#ffffff33');rect(c,9,10,3,2,'#00000040');if(t===112||t===113){rect(c,3,9,3,3,'#dac6a4');rect(c,2,11,2,2,'#e4d4b3');}}
  }
  if(t>=160&&t<176){c.clearRect(0,0,16,16);const tier=Math.floor((t-160)/4),type=(t-160)%4,col=TIERS[tier][4];for(let i=2;i<12;i++){rect(c,i,15-i,2,2,'#71573b');rect(c,i,15-i,1,1,'#b3935a');}
   if(type===0){rect(c,5,2,9,3,'#405645');rect(c,6,1,7,2,col);rect(c,12,3,3,5,col);rect(c,4,3,3,2,col);rect(c,7,1,5,1,'#ffffff60');}
   if(type===1){rect(c,8,1,5,3,col);rect(c,6,3,7,5,col);rect(c,7,3,2,3,'#ffffff50');rect(c,11,6,2,2,'#00000025');}
   if(type===2){rect(c,9,1,5,5,col);rect(c,8,2,5,5,col);rect(c,9,2,2,3,'#ffffff55');}
   if(type===3){for(let i=6;i<15;i++){rect(c,i,15-i,2,3,col);rect(c,i,15-i,1,1,'#ffffff60');}rect(c,4,8,6,2,'#aa9b68');rect(c,7,8,3,4,'#aa9b68');}
  }
 }
 // An eight-pixel gutter around every 16px tile prevents atlas bleeding.
 for(let t=0;t<Assets.tiles.length;t++){const c=Assets.tiles[t];if(!c)continue;const x=(t%16)*32,y=Math.floor(t/16)*32;ac.drawImage(c,x+8,y+8);ac.drawImage(c,0,0,1,16,x,y+8,8,16);ac.drawImage(c,15,0,1,16,x+24,y+8,8,16);ac.drawImage(c,0,0,16,1,x+8,y,16,8);ac.drawImage(c,0,15,16,1,x+8,y+24,16,8);for(const [a,b] of [[0,0],[1,0],[0,1],[1,1]])ac.drawImage(c,a*15,b*15,1,1,x+a*24,y+b*24,8,8);}
 Assets.atlas=atlas;
 function drawFace(ctx,img,p){ctx.save();ctx.beginPath();ctx.moveTo(...p[0]);for(let i=1;i<4;i++)ctx.lineTo(...p[i]);ctx.closePath();ctx.clip();ctx.transform((p[1][0]-p[0][0])/16,(p[1][1]-p[0][1])/16,(p[3][0]-p[0][0])/16,(p[3][1]-p[0][1])/16,p[0][0],p[0][1]);ctx.drawImage(img,0,0);ctx.restore();}
 for(const def of Object.values(ITEMS)){
  const t=def.tool?160+Math.floor((def.id-200)/10)*4+(def.id-200)%10:def.id;Assets.tileForItem[def.id]=t;const c=document.createElement('canvas');c.width=c.height=32;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
  if(def.place&&BLOCKS[def.place]?.shape!=='plant'&&def.place!==23){const id=def.place;drawFace(ctx,Assets.tiles[blockTile(id,2)],[[16,1],[30,8],[16,15],[2,8]]);drawFace(ctx,Assets.tiles[blockTile(id,4)],[[2,8],[16,15],[16,30],[2,23]]);ctx.fillStyle='#16241628';ctx.beginPath();ctx.moveTo(2,8);ctx.lineTo(16,15);ctx.lineTo(16,30);ctx.lineTo(2,23);ctx.fill();drawFace(ctx,Assets.tiles[blockTile(id,5)],[[16,15],[30,8],[30,23],[16,30]]);ctx.fillStyle='#11221845';ctx.beginPath();ctx.moveTo(16,15);ctx.lineTo(30,8);ctx.lineTo(30,23);ctx.lineTo(16,30);ctx.fill();}
  else ctx.drawImage(Assets.tiles[t]||Assets.tiles[63],2,2,28,28);Assets.icons[def.id]=c.toDataURL('image/png');
 }
 const heart=document.createElement('canvas');heart.width=heart.height=12;const hc=heart.getContext('2d');hc.fillStyle='#8b443d';for(const [x,y,w,h] of [[1,2,4,6],[6,2,4,6],[2,3,7,6],[3,7,5,3],[5,9,1,2]])hc.fillRect(x,y,w,h);hc.fillStyle='#e99a7b';hc.fillRect(2,2,3,3);hc.fillRect(7,2,2,2);hc.fillStyle='#d97561';hc.fillRect(3,5,6,3);Assets.heart=heart.toDataURL();
 const food=document.createElement('canvas');food.width=food.height=12;const fc=food.getContext('2d');fc.fillStyle='#dcd4ad';fc.fillRect(1,8,4,2);fc.fillRect(1,7,2,4);fc.fillStyle='#a17944';fc.fillRect(4,3,6,6);fc.fillRect(6,2,4,6);fc.fillStyle='#d6b374';fc.fillRect(5,3,3,3);fc.fillStyle='#795d38';fc.fillRect(7,7,3,2);Assets.food=food.toDataURL();
 return Assets;
}
function uvRect(tile){const tx=(tile%16)*32+8,ty=Math.floor(tile/16)*32+8;return[(tx+.05)/512,(ty+.05)/512,(tx+15.95)/512,(ty+15.95)/512];}
class Geometry{
 constructor(){this.v=[];this.i=[];}
 vertex(p,uv,color,sky=1,torch=0){this.v.push(p[0],p[1],p[2],uv[0],uv[1],color[0],color[1],color[2],sky,torch);return this.v.length/10-1;}
 quad(points,tile=63,color=[1,1,1],sky=1,torch=0,ao=null,reverse=false){const u=uvRect(tile),uv=[[u[0],u[3]],[u[2],u[3]],[u[2],u[1]],[u[0],u[1]]],idx=this.v.length/10;for(let i=0;i<4;i++)this.vertex(points[i],uv[i],ao?color.map(c=>c*ao[i]):color,sky,torch);this.i.push(idx,idx+1,idx+2,idx,idx+2,idx+3);if(reverse)this.i.push(idx+2,idx+1,idx,idx+3,idx+2,idx);}
 cube(x,y,z,sx,sy,sz,tile=63,color=[1,1,1],sky=1,torch=0){for(let f=0;f<6;f++){const face=FACES[f];this.quad(face.v.map(v=>[x+v[0]*sx,y+v[1]*sy,z+v[2]*sz]),typeof tile==='function'?tile(f):tile,color.map(c=>c*face.shade),sky,torch);}}
 line(a,b,color=[.06,.12,.08]){const uv=uvRect(63),i=this.vertex(a,[uv[0],uv[1]],color);this.vertex(b,[uv[0],uv[1]],color);this.i.push(i,i+1);}
}
class Mesh{
 constructor(gl,geo,dynamic=false){this.gl=gl;this.vao=gl.createVertexArray();this.vbo=gl.createBuffer();this.ibo=gl.createBuffer();this.dynamic=dynamic;gl.bindVertexArray(this.vao);gl.bindBuffer(gl.ARRAY_BUFFER,this.vbo);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.ibo);for(const [loc,size,offset] of [[0,3,0],[1,2,12],[2,3,20],[3,2,32]]){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,40,offset);}this.update(geo);gl.bindVertexArray(null);}
 update(geo){const gl=this.gl;gl.bindVertexArray(this.vao);gl.bindBuffer(gl.ARRAY_BUFFER,this.vbo);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(geo.v),this.dynamic?gl.DYNAMIC_DRAW:gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.ibo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint32Array(geo.i),this.dynamic?gl.DYNAMIC_DRAW:gl.STATIC_DRAW);this.count=geo.i.length;this.vertices=geo.v.length/10;}
 dispose(){this.gl.deleteVertexArray(this.vao);this.gl.deleteBuffer(this.vbo);this.gl.deleteBuffer(this.ibo);}
}
class Renderer{
 constructor(canvas){this.canvas=canvas;this.gl=canvas.getContext('webgl2',{antialias:false,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:false});if(!this.gl)throw new Error('WebGL 2 is not available. Enable hardware acceleration or try a different desktop browser.');const gl=this.gl;
  const vs=`#version 300 es
  precision highp float;
  layout(location=0) in vec3 aPosition; layout(location=1) in vec2 aUV; layout(location=2) in vec3 aColor; layout(location=3) in vec2 aLight;
  uniform mat4 uVP; uniform mat4 uModel; uniform vec3 uEye;
  out vec2 vUV; out vec3 vColor; out vec2 vLight; out float vDistance;
  void main(){vec4 world=uModel*vec4(aPosition,1.0);vUV=aUV;vColor=aColor;vLight=aLight;vDistance=length(world.xyz-uEye);gl_Position=uVP*world;}`;
  const fs=`#version 300 es
  precision highp float;
  in vec2 vUV; in vec3 vColor; in vec2 vLight; in float vDistance;
  uniform sampler2D uAtlas; uniform float uDay; uniform float uFog; uniform vec3 uSky; uniform vec4 uTint; uniform float uUnlit; uniform float uNoFog;
  out vec4 fragColor;
  void main(){vec4 tex=texture(uAtlas,vUV);if(tex.a<0.07)discard;
   vec3 natural=vec3(0.94,1.0,1.035)*vLight.x*uDay;
   vec3 local=vec3(1.12,0.86,0.52)*vLight.y;
   vec3 light=max(vec3(0.028,0.034,0.039),max(natural,local));light=mix(light,vec3(1.0),uUnlit);
   vec3 color=tex.rgb*vColor*light*uTint.rgb;
   float fog=smoothstep(uFog*.46,uFog,vDistance)*(1.0-uNoFog);
   fragColor=vec4(mix(color,uSky,fog),tex.a*uTint.a);}`;
  const shader=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};const v=shader(gl.VERTEX_SHADER,vs),f=shader(gl.FRAGMENT_SHADER,fs);this.program=gl.createProgram();gl.attachShader(this.program,v);gl.attachShader(this.program,f);gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(this.program));gl.deleteShader(v);gl.deleteShader(f);gl.useProgram(this.program);this.u={};for(const n of ['VP','Model','Eye','Atlas','Day','Fog','Sky','Tint','Unlit','NoFog'])this.u[n]=gl.getUniformLocation(this.program,'u'+n);
  this.texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,Assets.atlas);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.generateMipmap(gl.TEXTURE_2D);gl.uniform1i(this.u.Atlas,0);gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.depthFunc(gl.LEQUAL);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);this.drawCalls=0;this.triangles=0;this.identity=M4.identity();this.planes=[];
 }
 mesh(geo,dynamic=false){return new Mesh(this.gl,geo,dynamic);}
 resize(scale=1){const dpr=Math.min(window.devicePixelRatio||1,1.5),w=Math.max(1,Math.round(innerWidth*scale*dpr)),h=Math.max(1,Math.round(innerHeight*scale*dpr));if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}this.gl.viewport(0,0,w,h);}
 begin(eye,dir,fov,sky,day,fog){const gl=this.gl;this.eye=eye;this.vp=M4.multiply(M4.perspective(fov*Math.PI/180,this.canvas.width/this.canvas.height,.045,900),M4.lookAt(eye,eye.map((v,i)=>v+dir[i])));gl.useProgram(this.program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.uniformMatrix4fv(this.u.VP,false,this.vp);gl.uniform3fv(this.u.Eye,eye);gl.uniform3fv(this.u.Sky,sky);gl.uniform1f(this.u.Day,day);gl.uniform1f(this.u.Fog,fog);gl.clearColor(...sky,1);gl.depthMask(true);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.disable(gl.BLEND);this.drawCalls=0;this.triangles=0;const m=this.vp;this.planes=[];for(let axis=0;axis<3;axis++)for(let s of [-1,1])this.planes.push([m[3]+s*m[axis],m[7]+s*m[4+axis],m[11]+s*m[8+axis],m[15]+s*m[12+axis]]);}
 visible(min,max){for(const p of this.planes)if(p[0]*(p[0]>0?max[0]:min[0])+p[1]*(p[1]>0?max[1]:min[1])+p[2]*(p[2]>0?max[2]:min[2])+p[3]<0)return false;return true;}
 draw(mesh,model=this.identity,{tint=[1,1,1,1],unlit=false,noFog=false,lines=false}={}){if(!mesh?.count)return;const gl=this.gl;gl.uniformMatrix4fv(this.u.Model,false,model);gl.uniform4fv(this.u.Tint,tint);gl.uniform1f(this.u.Unlit,unlit?1:0);gl.uniform1f(this.u.NoFog,noFog?1:0);gl.bindVertexArray(mesh.vao);gl.drawElements(lines?gl.LINES:gl.TRIANGLES,mesh.count,gl.UNSIGNED_INT,0);this.drawCalls++;this.triangles+=lines?0:mesh.count/3;}
 transparent(on){const gl=this.gl;if(on){gl.enable(gl.BLEND);gl.depthMask(false);}else{gl.disable(gl.BLEND);gl.depthMask(true);}}
 handView(fov=70){const gl=this.gl;gl.clear(gl.DEPTH_BUFFER_BIT);gl.uniformMatrix4fv(this.u.VP,false,M4.perspective(fov*Math.PI/180,this.canvas.width/this.canvas.height,.03,10));gl.uniform3fv(this.u.Eye,[0,0,0]);}
}
// A padded light volume supplies sky propagation, torch propagation, and corner AO.
function chunkLighting(world,c){const W=18,S=324,N=S*HEIGHT,vox=new Uint8Array(N),sky=new Uint8Array(N),torch=new Uint8Array(N),queue=new Uint32Array(N*4),sx=c.cx*16-1,sz=c.cz*16-1;
 for(let z=0;z<W;z++)for(let x=0;x<W;x++){const wx=sx+x,wz=sz+z,nc=world.getChunk(Math.floor(wx/16),Math.floor(wz/16)),base=x+z*W;if(nc){const nx=mod(wx,16),nz=mod(wz,16);for(let y=0;y<HEIGHT;y++)vox[base+y*S]=nc.data[chunkIndex(nx,y,nz)];}else{const col=world.column(wx,wz);for(let y=0;y<HEIGHT;y++)vox[base+y*S]=y<=col.h?3:y<=SEA?9:0;}
  let light=15;for(let y=HEIGHT-1;y>=0;y--){const i=base+y*S,id=vox[i];if(BLOCKS[id].opaque)light=0;else if(id===6||id===31||id===9)light=Math.max(0,light-1);sky[i]=light;if(id===23||id===34)torch[i]=15;}
 }
 for(const light of world.torches.values()){
  let x=clamp(Math.floor(light.x)-sx,0,17),z=clamp(Math.floor(light.z)-sz,0,17),y=clamp(Math.floor(light.y),1,HEIGHT-2);const d=Math.abs(Math.floor(light.x)-sx-x)+Math.abs(Math.floor(light.z)-sz-z);if(d<14){let i=x+z*W+y*S;if(!BLOCKS[vox[i]].opaque)torch[i]=Math.max(torch[i],15-d);}
 }
 function flood(field){let head=0,tail=0;for(let i=0;i<N;i++)if(field[i]>1&&!BLOCKS[vox[i]].opaque)queue[tail++]=i;while(head<tail&&tail<queue.length-6){const i=queue[head++],v=field[i]-1;if(v<1)continue;const x=i%W,z=Math.floor(i/W)%W,y=Math.floor(i/S);const visit=j=>{if(j<0||j>=N||BLOCKS[vox[j]].opaque)return;let nv=v-((vox[j]===6||vox[j]===31)?1:0);if(field[j]<nv){field[j]=nv;queue[tail++]=j;}};if(x>0)visit(i-1);if(x<17)visit(i+1);if(z>0)visit(i-W);if(z<17)visit(i+W);if(y>0)visit(i-S);if(y<HEIGHT-1)visit(i+S);}}
 flood(sky);flood(torch);return {vox,sky,torch,W,S,index:(x,y,z)=>(x+1)+(z+1)*W+y*S};
}
function meshChunk(world,c,renderer){const solid=new Geometry(),water=new Geometry(),L=chunkLighting(world,c),{vox,sky,torch,W,S,index}=L,sx=c.cx*16,sz=c.cz*16;
 const local=(x,y,z)=>x< -1||x>16||z< -1||z>16||y<0||y>=HEIGHT?0:vox[index(x,y,z)];const opaque=(x,y,z)=>BLOCKS[local(x,y,z)].opaque;
 for(let y=0;y<HEIGHT;y++)for(let z=0;z<16;z++)for(let x=0;x<16;x++){
  const id=c.data[chunkIndex(x,y,z)];if(!id)continue;const b=BLOCKS[id],li=index(x,y,z),s=sky[li]/15,t=torch[li]/15;
  if(b.shape==='plant'){
   const offset=(hash3(sx+x,y,sz+z,world.hash)-.5)*.2,h=id===42?.9:id===28?.8:id===25?.65:.65;
   solid.quad([[x+.07+offset,y,z+.07],[x+.93+offset,y,z+.93],[x+.93+offset,y+h,z+.93],[x+.07+offset,y+h,z+.07]],id,[.96,1,.93],s,t,null,true);
   solid.quad([[x+.07+offset,y,z+.93],[x+.93+offset,y,z+.07],[x+.93+offset,y+h,z+.07],[x+.07+offset,y+h,z+.93]],id,[.96,1,.93],s,t,null,true);continue;
  }
  if(b.shape==='torch'){solid.cube(x+.44,y,z+.44,.12,.65,.12,7,[.83,.71,.46],s,t);solid.cube(x+.41,y+.61,z+.41,.18,.2,.18,60,[1,1,1],1,1);continue;}
  if(b.shape==='bed'){solid.cube(x,y,z,1,.48,1,36,[1,1,1],Math.max(.3,s),t);continue;}
  const geo=b.transparent?water:solid;
  const lit=id===21&&(world.tiles.get(key3(sx+x,y,sz+z))?.fuel>0);
  for(let f=0;f<6;f++){
   const face=FACES[f],n=face.n,nx=x+n[0],ny=y+n[1],nz=z+n[2],nid=local(nx,ny,nz),nb=BLOCKS[nid];
   if(nb.opaque||(nid===id&&(b.transparent||b.leaf||b.liquid)))continue;
   if(b.liquid&&nb.solid&&!nb.transparent&&!nb.leaf)continue;
   const ni=ny>=0&&ny<HEIGHT?index(nx,ny,nz):-1,light=ni<0?1:sky[ni]/15,tl=ni<0?0:torch[ni]/15;let top=id===9&&local(x,y+1,z)!==9?.88:1;
   const points=face.v.map(v=>[x+v[0],y+v[1]*top,z+v[2]]);
   const axes=[0,1,2].filter(a=>n[a]===0),ao=[];
   for(const v of face.v){const a=axes[0],d=axes[1],p=[nx,ny,nz],q=[nx,ny,nz],r=[nx,ny,nz];p[a]+=v[a]?1:-1;q[d]+=v[d]?1:-1;r[a]+=v[a]?1:-1;r[d]+=v[d]?1:-1;const o1=opaque(...p)?1:0,o2=opaque(...q)?1:0,o3=opaque(...r)?1:0;ao.push(b.transparent?1:o1&&o2?.61:1-(o1+o2+o3)*.115);}
   const shade=face.shade;
   geo.quad(points,blockTile(id,f,lit),[shade,shade,shade],id===34?1:light,id===34?1:tl,ao);
  }
 }
 if(c.mesh)c.mesh.dispose();if(c.waterMesh)c.waterMesh.dispose();c.mesh=solid.i.length?renderer.mesh(solid):null;c.waterMesh=water.i.length?renderer.mesh(water):null;c.dirty=false;world.dirty.delete(c.key);c.light=L; // Sky and torch samples also inform creature spawning.
}
Object.assign(BC,{Renderer,Geometry,Mesh,M4,meshChunk,makeAssets,blockTile});
