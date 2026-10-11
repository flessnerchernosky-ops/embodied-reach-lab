/* Educational RGB perception -> planar servo model. MIT licensed. */
(function(root){
'use strict';
const W=96,H=80,DT=.01,DURATION=12,COLORS={red:[230,65,80],blue:[65,130,240],green:[60,205,125]};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function pixel(p){return {x:(p.x+1.8)/3.6*W-.5,y:(1.65-p.y)/2.1*H-.5};}
function world(p){return {x:(p.x+.5)/W*3.6-1.8,y:1.65-(p.y+.5)/H*2.1};}
function objects(t,scene){return [{color:'red',x:1.05+(scene==='moving'?.25*Math.sin(1.1*t):0),y:.8+(scene==='moving'?.18*Math.sin(.8*t):0),radius:.15},{color:'blue',x:-.8,y:.9,radius:.15},{color:'green',x:.35,y:1.2,radius:.15}];}
function render(t,scene){
 const data=new Uint8ClampedArray(W*H*4);for(let i=0;i<W*H;i++)data.set([23,32,48,255],i*4);
 const items=objects(t,scene);if(scene==='distractor')items.push({color:'red',x:-1.25,y:.4,radius:.08});
 for(const o of items){const p=pixel(o),rx=o.radius/3.6*W,ry=o.radius/2.1*H;
  for(let y=Math.max(0,Math.floor(p.y-ry));y<=Math.min(H-1,Math.ceil(p.y+ry));y++)for(let x=Math.max(0,Math.floor(p.x-rx));x<=Math.min(W-1,Math.ceil(p.x+rx));x++)if(((x-p.x)/rx)**2+((y-p.y)/ry)**2<=1)data.set([...COLORS[o.color],255],4*(y*W+x));
 }
 if(scene==='occlusion'&&t>=3&&t<7){const p=pixel(items[0]);for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(Math.abs(x-p.x)<9&&Math.abs(y-p.y)<10)data.set([100,110,124,255],4*(y*W+x));}
 if(scene==='missing'){const c=COLORS.red;for(let i=0;i<W*H;i++)if(data[i*4]===c[0])data.set([23,32,48,255],i*4);}
 return {width:W,height:H,data,captured:t};
}
// Only the public RGB frame and requested color enter perception. No world objects.
function detect(frame,color,method='component'){
 if(!COLORS[color]||!['centroid','component'].includes(method))throw new Error('Unknown detector/color');
 const {width,height,data}=frame;if(data.length!==width*height*4)throw new Error('Invalid RGB frame');
 const c=COLORS[color],mask=new Uint8Array(width*height);let total=0,sx=0,sy=0;
 for(let i=0;i<mask.length;i++)if(c.every((v,k)=>Math.abs(data[4*i+k]-v)<35)){mask[i]=1;total++;sx+=i%width;sy+=Math.floor(i/width);}
 if(method==='centroid')return total>=4?{x:sx/total,y:sy/total,area:total}:null;
 let best=null;for(let start=0;start<mask.length;start++){if(!mask[start])continue;let queue=[start],n=0,xsum=0,ysum=0;mask[start]=0;
  for(let head=0;head<queue.length;head++){const i=queue[head],x=i%width,y=Math.floor(i/width);n++;xsum+=x;ysum+=y;
   for(const j of [x>0?i-1:-1,x<width-1?i+1:-1,y>0?i-width:-1,y<height-1?i+width:-1])if(j>=0&&mask[j]){mask[j]=0;queue.push(j);}
  }if(n>=4&&(!best||n>best.area))best={x:xsum/n,y:ysum/n,area:n};
 }return best;
}
function fk(q){return {x:Math.cos(q[0])+.8*Math.cos(q[0]+q[1]),y:Math.sin(q[0])+.8*Math.sin(q[0]+q[1])};}
function ik(p){const r=clamp(Math.hypot(p.x,p.y),.200001,1.799999),q2=Math.acos(clamp((r*r-1-.64)/1.6,-1,1));return [Math.atan2(p.y,p.x)-Math.atan2(.8*Math.sin(q2),1+.8*Math.cos(q2)),q2];}
function servo(q,v,observation,dt){const ref=observation?ik(world(observation)):null;
 return q.map((a,i)=>{const u=clamp((ref?8*(ref[i]-a):0)-4*v[i],-6,6),nv=clamp(v[i]+(u-.3*v[i])*dt,-2,2);let nq=a+nv*dt,nvv=nv;const bounds=i===0?[-Math.PI,Math.PI]:[0,Math.PI];if(nq<bounds[0]||nq>bounds[1]){nq=clamp(nq,...bounds);nvv=0;}return {q:nq,v:nvv,u};});
}
class Experiment{
 constructor(input={},dt=DT){this.settings={scene:'distractor',color:'red',delay:0,...input};if(!['static','distractor','moving','occlusion','missing'].includes(this.settings.scene)||!COLORS[this.settings.color]||!Number.isFinite(this.settings.delay)||this.settings.delay<0||this.settings.delay>1)throw new Error('Invalid settings');
 if(!Number.isFinite(dt)||dt<=0||Math.abs(.1/dt-Math.round(.1/dt))>1e-8)throw new Error('dt must divide camera period');this.dt=dt;this.count=0;this.pending=[];this.frame=null;this.displayFrame=render(0,this.settings.scene);this.agents=['centroid','component'].map(kind=>({kind,q:[-.55,1.8],v:[0,0],observation:null,sum:0,late:0,lateN:0,near:0,seen:0,trace:[]}));this.rows=[];}
 get time(){return this.count*this.dt;}get done(){return this.count>=Math.round(DURATION/this.dt);}
 step(){if(this.done)return false;
  if(this.count%Math.round(.1/this.dt)===0){this.displayFrame=render(this.time,this.settings.scene);this.pending.push({arrival:this.time+this.settings.delay,frame:this.displayFrame});}
  while(this.pending.length&&this.pending[0].arrival<=this.time+1e-9){this.frame=this.pending.shift().frame;for(const a of this.agents)a.observation=detect(this.frame,this.settings.color,a.kind);}
  const t=this.time+this.dt,target=objects(t,this.settings.scene).find(o=>o.color===this.settings.color);
  for(const a of this.agents){const next=servo(a.q,a.v,a.observation,this.dt);a.q=next.map(s=>s.q);a.v=next.map(s=>s.v);const p=fk(a.q),error=Math.hypot(p.x-target.x,p.y-target.y),seen=Number(a.observation!==null);a.sum+=error*error;if(t>8+1e-9){a.late+=error*error;a.lateN++;}a.near+=Number(error<=.06)*this.dt;a.seen+=seen;a.trace.push(p);if(a.trace.length>150)a.trace.shift();this.rows.push({time:t,kind:a.kind,target_x:target.x,target_y:target.y,x:p.x,y:p.y,q1:a.q[0],q2:a.q[1],v1:a.v[0],v2:a.v[1],u1:next[0].u,u2:next[1].u,error,seen,observation_age:this.frame?t-this.frame.captured:-1});}
  this.count++;return true;}
 metrics(){return this.agents.map(a=>({kind:a.kind,rmse:this.count?Math.sqrt(a.sum/this.count):null,late_rmse:a.lateN?Math.sqrt(a.late/a.lateN):null,near_seconds:a.near,seen_fraction:this.count?a.seen/this.count:0}));}
 finish(){while(this.step());return this.metrics();}
}
function csv(run){const keys=Object.keys(run.rows[0]||{});return '# embodied-reach-v1 '+JSON.stringify({settings:run.settings,dt:run.dt,complete:run.done})+'\n'+keys.join(',')+'\n'+run.rows.map(r=>keys.map(k=>r[k]).join(',')).join('\n')+'\n';}
const api={W,H,DT,DURATION,COLORS,pixel,world,objects,render,detect,fk,ik,servo,Experiment,csv};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Lab=api;
})(typeof window==='undefined'?globalThis:window);
