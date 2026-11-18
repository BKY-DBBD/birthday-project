const canvas = document.getElementById("roseCanvas");
const ctx = canvas.getContext("2d");
const W = 800, H = 800;
const BG = "#09030a";
const GAP = 3;
const LIFT = 32;
const DURATION = 10;
const phrases = [
  "I LOVE YOU","I love you","Te amo","Ti amo","Je t'aime","Ich liebe dich",
  "Eu te amo","Seni seviyorum","Я тебя люблю","사랑해","愛してる","我爱你",
  "मैं तुमसे प्यार करती हूँ","मैं तुमसे प्यार करता हूँ","Σ' αγαπώ","Ik hou van jou",
  "Jag älskar dig","Kocham cię","ฉันรักคุณ","Anh yêu em","Aku cinta kamu","Mahal kita",
  "אני אוהבת אותך","أحبك","నేను నిన్ను ప్రేమిస్తున్నాను","நான் உன்னை காதலிக்கிறேன்",
  "আমি তোমাকে ভালোবাসি","Volim te","Te iubesc","Ljubim te","Nakupenda","Я тебе кохаю",
  "Miluji tě","Szeretlek","Rakastan sinua","Jeg elsker dig"
];
const accents = ["LOVE","TE AMO","AMOUR","TI AMO","I LOVE YOU","AMOR","愛してる","사랑해","我爱你","LOVE YOU","JE T'AIME","SZERETLEK","NAKUPENDA"];
const shortPhrases = ["Te amo","Ti amo","AMOR","LOVE","愛してる","사랑해","我爱你","Amour","I love you","Mahal kita","Te iubesc","Volim te","Szeretlek","Miluji tě","Nakupenda"];
const headWords = phrases.concat([
  "LOVE","LOVE","LOVE YOU","AMOR","AMOR","AMOUR","AMOUR","AMORE","LIEBE","TE AMO","TE AMO",
  "TI AMO","TI AMO","TE QUIERO","TE QUIERO","JE T'AIME","I LOVE YOU","I LOVE YOU","愛",
  "愛してる","愛してる","사랑","사랑해","사랑해","我爱你","Mahal kita","รักคุณ","ANH YÊU EM",
  "तुमसे प्यार है","నిన్ను ప్రేమిస్తున్నా","உன்னை காதலிக்கிறேன்","ভালোবাসি","أحبك","LOVE",
  "AMOR","AMOUR","Nakupenda","Szeretlek"
]);
const HEAD_SHAPES = [
  ellipsePoly(400,180,145,90), ellipsePoly(330,180,120,83), ellipsePoly(470,180,120,83),
  ellipsePoly(275,260,98,112), ellipsePoly(525,260,98,112),
  ellipsePoly(338,325,118,126), ellipsePoly(462,325,118,126),
  [[230,330],[290,365],[348,414],[400,532],[452,414],[510,365],[570,330],[522,452],[400,542],[278,452]]
];
const STEM = [[378,493],[422,493],[427,752],[408,772],[390,760],[374,600]];
const LEFT_LEAF = [[395,594],[359,554],[304,535],[244,541],[215,562],[253,609],[321,631],[374,617]];
const RIGHT_LEAF = [[406,619],[442,581],[491,561],[553,578],[578,600],[535,640],[476,660],[425,649]];

function ellipsePoly(cx,cy,rx,ry,n=160){
  return Array.from({length:n},(_,i)=>[cx+rx*Math.cos(2*Math.PI*i/n),cy+ry*Math.sin(2*Math.PI*i/n)]);
}
let seed=17;
function rand(){seed=(seed*9301+49297)%233280;return seed/233280;}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function polygonSpans(poly,y){
  const xs=[];
  for(let i=0;i<poly.length;i++){
    const [x1,y1]=poly[i],[x2,y2]=poly[(i+1)%poly.length];
    if((y1<=y&&y<y2)||(y2<=y&&y<y1)) if(y2!==y1) xs.push(x1+(y-y1)*(x2-x1)/(y2-y1));
  }
  xs.sort((a,b)=>a-b);const out=[];
  for(let i=0;i+1<xs.length;i+=2)out.push([xs[i],xs[i+1]]);
  return out;
}
function mergeSpans(spans){
  if(!spans.length)return [];
  spans.sort((a,b)=>a[0]-b[0]);const merged=[[...spans[0]]];
  for(const [lo,hi] of spans.slice(1)){
    const last=merged[merged.length-1];
    if(lo<=last[1]+1)last[1]=Math.max(last[1],hi);else merged.push([lo,hi]);
  }
  return merged;
}
function shapeSpans(polys,y){return mergeSpans(polys.flatMap(p=>polygonSpans(p,y)));}
function intersectSpans(a,b,min=15){
  const out=[];
  for(const aa of a)for(const bb of b){const lo=Math.max(aa[0],bb[0]),hi=Math.min(aa[1],bb[1]);if(hi-lo>=min)out.push([lo,hi]);}
  return mergeSpans(out);
}
function fontSizeFor(kind){
  if(kind==="head"){
    const sizes=[7,8,9,10,11,12,13,14],weights=[2,4,5,5,4,2,1,.5];
    let n=rand()*weights.reduce((a,b)=>a+b,0);
    for(let i=0;i<sizes.length;i++){n-=weights[i];if(n<=0)return sizes[i];}
  }
  return kind==="stem"?[6,7,8][Math.floor(rand()*3)]:[7,8,9,10][Math.floor(rand()*4)];
}
const phraseCycles={};
function phraseFor(kind,size){
  const pool=size>=14?accents:(kind==="head"?headWords:shortPhrases);
  const key=kind+":"+(size>=14?"accent":"normal");
  if(!phraseCycles[key]||!phraseCycles[key].length)phraseCycles[key]=shuffle(pool.slice());
  return phraseCycles[key].pop();
}
function measure(text,size){
  ctx.font=`bold ${size}px Georgia, "Times New Roman", serif`;
  return ctx.measureText(text).width;
}
function rgb(hex){return [0,2,4].map(i=>parseInt(hex.slice(i+1,i+3),16)/255);}
function hex(rgbv){return "#"+rgbv.map(v=>Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,"0")).join("");}
function mix(a,b,k){return a.map((v,i)=>v+(b[i]-v)*k);}
const BGC=rgb(BG);
function choice(a){return a[Math.floor(rand()*a.length)];}
function roseColor(x,y,size,edge){
  const dx=(x-400)/210,dy=(y-300)/220,rad=Math.sqrt(dx*dx+dy*dy);
  let pal=rad>.82?["#8f0b2b","#ae1238","#c41d48","#d52b53"]:
    rad>.48?["#b9143d","#d21e49","#e33b60","#f04e73"]:
    ["#c51b49","#e83c68","#f16b8b","#ff91b5"];
  if(edge)pal=pal.concat(["#f5a0b3","#ef6488"]);
  if(size>=14)pal=pal.concat(["#ff9ab1","#ffd0dc"]);
  return rgb(choice(pal));
}
function greenColor(size){
  let pal=["#3e8034","#559c3c","#72b84b","#91cf62","#b1e184"];
  if(size>=9)pal=pal.concat(["#a7d486","#c0e19a"]);
  return rgb(choice(pal));
}
function buildRegion(polygons,yStart,yEnd,rowH,kind){
  const placed=[];const half=rowH/2;
  for(let y=yStart+half;y<yEnd-half;y+=rowH){
    const top=shapeSpans(polygons,y-half+1),bottom=shapeSpans(polygons,y+half-1);
    const rows=intersectSpans(top,bottom,kind==="head"?19:16);
    for(let [lo,hi] of rows){
      const margin=kind==="head"?3:1;lo+=margin;hi-=margin;
      const available=hi-lo;if(available<18)continue;
      const line=[];let cur=lo+rand()*Math.min(3,Math.max(1,available*.02));
      while(cur<hi-15){
        const remaining=hi-cur,target=Math.min(74,Math.max(19,remaining*.22));
        const candidates=[];
        for(let k=0;k<(kind==="head"?45:55);k++){
          const size=fontSizeFor(kind),text=phraseFor(kind,size),width=measure(text,size);
          if(width<=remaining&&width>=Math.min(18,remaining*.20))
            candidates.push({score:Math.abs(width-target)+rand()*13,text,size,width});
        }
        if(!candidates.length)break;
        candidates.sort((a,b)=>a.score-b.score);
        const pick=candidates[Math.floor(rand()*Math.min(4,candidates.length))];
        line.push({x:cur+pick.width/2,y,text:pick.text,size:pick.size,width:pick.width,kind});
        cur+=pick.width+(kind==="head"?GAP:1);
      }
      if(!line.length)continue;
      const used=line.reduce((s,p)=>s+p.width,0)+Math.max(0,line.length-1)*(kind==="head"?GAP:1);
      const slack=Math.max(0,available-used),extra=slack/Math.max(1,line.length-1);
      line.forEach((p,i)=>{
        p.x+=extra*i;p.edge=(i===0||i===line.length-1);
        p.color=kind==="head"?roseColor(p.x,p.y,p.size,p.edge):greenColor(p.size);
        p.delay=rand()*.18;placed.push(p);
      });
    }
  }
  return placed;
}
const headRowH=15,leafRowH=12,stemRowH=11;
let placed=[];
placed.push(...buildRegion(HEAD_SHAPES,88,540,headRowH,"head"));
placed.push(...buildRegion([LEFT_LEAF],543,618,leafRowH,"leaf"));
placed.push(...buildRegion([RIGHT_LEAF],575,651,leafRowH,"leaf"));
placed.push(...buildRegion([STEM],492,773,stemRowH,"stem"));
const outer=placed.filter(p=>p.edge),inner=placed.filter(p=>!p.edge);
outer.sort((a,b)=>Math.atan2(a.y-300,a.x-400)-Math.atan2(b.y-300,b.x-400));
shuffle(inner);
placed=outer.concat(inner);

const start=performance.now();
function draw(now){
  const elapsed=(now-start)/1000;
  ctx.clearRect(0,0,W,H);
  for(let i=0;i<placed.length;i++){
    const p=placed[i];
    const u=Math.max(0,Math.min(1,(elapsed-(i/Math.max(1,placed.length))*DURATION-p.delay)/.65));
    if(u<=0)continue;
    const eased=1-Math.pow(1-u,3);
    const x=p.x+(rand()-.5)*0; 
    const y=p.y-LIFT*(1-eased);
    const col=mix(BGC,p.color,Math.pow(eased,1.35));
    ctx.globalAlpha=eased;
    ctx.font=`bold ${p.size}px Georgia, "Times New Roman", serif`;
    ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.shadowColor=hex(p.color);ctx.shadowBlur=u<1?3:1;
    ctx.fillStyle=hex(col);ctx.fillText(p.text,x,y);
  }
  ctx.globalAlpha=1;ctx.shadowBlur=0;
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

const wishButton = document.getElementById("wishButton");
const wishResult = document.getElementById("wishResult");
wishButton.addEventListener("click", () => {
  wishResult.textContent = "May every beautiful wish find its way to you. ♡";
  for (let i = 0; i < 18; i++) makeFloatingCat();
});

function makeFloatingCat() {
  const el = document.createElement("div");
  el.className = "floating-dancing-cat";
  el.innerHTML = ["😽", "😻", "😻", "🐾", "😽" ][Math.floor(Math.random() * 5)];
  
  const randomX = 10 + Math.random() * 80;
  const randomSize = 20 + Math.random() * 22;
  const duration = 2.5 + Math.random() * 1.5;
  
  el.style.cssText = `
    position: fixed;
    left: ${randomX}%;
    bottom: 20px;
    font-size: ${randomSize}px;
    pointer-events: none;
    z-index: 8;
    transition: transform ${duration}s ease-out, opacity ${duration}s;
    filter: drop-shadow(0 0 8px #ff8fbd88);
  `;
  
  document.body.appendChild(el);
  
  requestAnimationFrame(() => {
    const endX = (Math.random() - 0.5) * 150;
    const endY = 200 + Math.random() * 250;
    const rotation = (Math.random() - 0.5) * 60;
    el.style.transform = `translate(${endX}px, -${endY}px) rotate(${rotation}deg) scale(1.2)`;
    el.style.opacity = "0";
  });
  
  setTimeout(() => el.remove(), duration * 1000);
}

let audioContext=null,musicTimer=null,playing=false,noteIndex=0;
const notes=[261.63,329.63,392,329.63,293.66,349.23,440,349.23];
function playNote(){
  if(!playing||!audioContext)return;
  const osc=audioContext.createOscillator(),gain=audioContext.createGain();
  osc.type="sine";osc.frequency.value=notes[noteIndex++%notes.length];
  gain.gain.setValueAtTime(.0001,audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.04,audioContext.currentTime+.12);
  gain.gain.exponentialRampToValueAtTime(.0001,audioContext.currentTime+1.2);
  osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+1.25);
  musicTimer=setTimeout(playNote,650);
}
const musicButton=document.getElementById("musicButton"),musicLabel=document.getElementById("musicLabel");
musicButton.addEventListener("click",async()=>{
  if(!audioContext)audioContext=new(window.AudioContext||window.webkitAudioContext)();
  if(audioContext.state==="suspended")await audioContext.resume();
  playing=!playing;musicLabel.textContent=playing?"Pause music":"Play music";
  musicButton.querySelector(".music-symbol").textContent=playing?"Ⅱ":"♫";
  if(playing)playNote();else clearTimeout(musicTimer);
});
