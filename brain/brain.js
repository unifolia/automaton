"use strict";(()=>{var w=(e,t)=>()=>(e&&(t=e(e=0)),t);var z=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);var L=(e,t,r)=>new Promise((n,l)=>{var u=s=>{try{g(r.next(s))}catch(a){l(a)}},i=s=>{try{g(r.throw(s))}catch(a){l(a)}},g=s=>s.done?n(s.value):Promise.resolve(s.value).then(u,i);g((r=r.apply(e,t)).next())});var V,P,S=w(()=>{"use strict";V=(e,t)=>{let r=Math.sqrt(t),n=440,l=Math.pow(2,1/12),u=Math.floor((e-1)/r)+1;e=e-u*5-17;let i=Math.floor(e/7+2);return(e+7)%7===0?e=e+i*5:(e+6)%7===0?e=e+i*5+1:(e+5)%7===0||(e+4)%7===0?e=e+i*5+2:(e+3)%7===0?e=e+i*5+3:(e+2)%7===0?e=e+i*5+4:(e+1)%7===0&&(e=e+i*5+5),[+(n*Math.pow(l,e)).toFixed(4),+(n*Math.pow(l,e+3)).toFixed(4)]},P=V});var J,T,q=w(()=>{"use strict";J=(e,t,r)=>{let n=Math.sqrt(e),l=r+n-1,u=r+n,i=r+n+1,g=r-1,s=r+1,a=r-n-1,b=r-n,m=r-n+1;return[l,u,i,g,s,a,b,m].map(v=>t.includes(v)).filter(v=>v!==!1)},T=J});var d,k,H=w(()=>{"use strict";d=class{constructor(t){this.types=["sawtooth","sine","square","triangle"],this.audioContext=new window.AudioContext,this.oscillatorEngine=this.audioContext.createOscillator(),this.oscillatorEngine.type=this.types[Math.floor(Math.random()*4)],this.oscillatorEngine.frequency.setValueAtTime(t,this.audioContext.currentTime),this.gainNode=this.audioContext.createGain(),this.gainNode.gain.value=.1,this.gainNode.connect(this.audioContext.destination)}},k=d});var K,D,O=w(()=>{"use strict";K=e=>{let t=new ArrayBuffer(e.byteLength);return new Uint8Array(t).set(new Uint8Array(e)),t},D=K});var Q,C,R=w(()=>{"use strict";H();O();Q=(e,t,r)=>L(void 0,null,function*(){let n=new k(e),u=yield(()=>L(void 0,null,function*(){let s=n.audioContext.createConvolver(),a=D(t.slice(0));return s.buffer=yield n.audioContext.decodeAudioData(a),s}))();u.connect(n.gainNode),n.oscillatorEngine.connect(u),n.oscillatorEngine.start(),yield new Promise(s=>setTimeout(s,r*.85)).then(()=>{n.oscillatorEngine.stop(),n.oscillatorEngine.disconnect()}),yield new Promise(s=>setTimeout(s,r*1.45)).then(()=>{n.audioContext.close()})}),C=Q});var W=z(G=>{S();q();R();document.addEventListener("DOMContentLoaded",()=>L(G,null,function*(){let e=[...document.querySelectorAll(".pad")],t=[],r=document.querySelector(".grid"),n=e.length,l=document.querySelector(".playButton"),u=document.querySelector(".resetButton"),i=document.querySelector(".modeButton"),g=3,s=2500,a="Mode: Classic",b,m=!1,v=0,M=[],F=window.location.href.includes("file")?"https://cors-anywhere.herokuapp.com/":"",x=yield(yield fetch(`${F}https://jameslewis.io/assets/Output%201-2.wav`)).arrayBuffer(),N=()=>{l.innerHTML=m?"Stop":"Play",r.className=m?"main grid playing":"main grid",i.className=m?"modeButton playing":"modeButton"},A=()=>{m=!1,clearInterval(b),N(),t.forEach(o=>{o.classList.remove("active")}),v=0,M=[],t=[]},U=()=>{if(++v,M.push(t),M.length>2){M.shift();let[o,f]=M.map(c=>c.map(y=>y.id).length>0?c.map(y=>y.id).reduce((y,E)=>y+E):"empty");o===f&&A()}},_=(o,f,c,h)=>{!c&&h===g||c&&(h===g||h===g-1)?(t.includes(o)||t.push(o),c||o.classList.add("active"),o.click()):(t=t.filter(y=>y!==o),c&&o.classList.remove("active"))},$=(o,f,c)=>{Math.floor(Math.random()*10)===0?(t.includes(o)||t.push(o),c||o.classList.add("active"),o.click()):(t=t.filter(h=>h!==o),c&&o.classList.remove("active"))};e.forEach((o,f)=>{let c=n-f,[h,y]=P(c,n);o.id=`${c}`,o.addEventListener("click",()=>{let E=Math.floor(v/4)%2===0?h:y;m||(t.includes(o)?(t=t.filter(j=>j!==o),o.classList.remove("active")):(t.push(o),o.classList.add("active"),C(E,x,s))),m&&C(E,x,s)})});let B=()=>{let o=t.map(f=>+f.id);e.forEach((f,c)=>{let h=f.classList.contains("active"),y=T(n,o,+f.id).length;a==="Mode: Classic"&&_(f,c,h,y),a==="Mode: Random"&&$(f,c,h)}),U()};l==null||l.addEventListener("click",()=>{m=!m,N(),m===!0?(B(),b=setInterval(()=>B(),s)):clearInterval(b)}),u==null||u.addEventListener("click",()=>{A()}),i==null||i.addEventListener("click",()=>{a==="Mode: Random"?a="Mode: Classic":a="Mode: Random",i.innerHTML=a})}))});W();})();
