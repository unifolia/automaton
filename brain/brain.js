"use strict";(()=>{var d=(e,n)=>()=>(e&&(n=e(e=0)),n);var z=(e,n)=>()=>(n||e((n={exports:{}}).exports,n),n.exports);var A=(e,n,r)=>new Promise((c,u)=>{var h=l=>{try{f(r.next(l))}catch(M){u(M)}},i=l=>{try{f(r.throw(l))}catch(M){u(M)}},f=l=>l.done?c(l.value):Promise.resolve(l.value).then(h,i);f((r=r.apply(e,n)).next())});var V,x,H=d(()=>{"use strict";V=e=>{let n=new ArrayBuffer(e.byteLength);return new Uint8Array(n).set(new Uint8Array(e)),n},x=V});var J,D,R=d(()=>{"use strict";J=(e,n)=>{let r=Math.sqrt(n),c=440,u=Math.pow(2,1/12),h=Math.floor((e-1)/r)+1;e=e-h*5-17;let i=Math.floor(e/7+2);return(e+7)%7===0?e=e+i*5:(e+6)%7===0?e=e+i*5+1:(e+5)%7===0||(e+4)%7===0?e=e+i*5+2:(e+3)%7===0?e=e+i*5+3:(e+2)%7===0?e=e+i*5+4:(e+1)%7===0&&(e=e+i*5+5),[+(c*Math.pow(u,e)).toFixed(4),+(c*Math.pow(u,e+3)).toFixed(4)]},D=J});var K,O,G=d(()=>{"use strict";K=(e,n,r)=>{let c=Math.sqrt(e),u=r+c-1,h=r+c,i=r+c+1,f=r-1,l=r+1,M=r-c-1,m=r-c,L=r-c+1;return[u,h,i,f,l,M,m,L].map(g=>n.includes(g)).filter(g=>g!==!1)},O=K});var Q=z(E=>{H();R();G();document.addEventListener("DOMContentLoaded",()=>A(E,null,function*(){let e=[...document.querySelectorAll(".pad")],n=[],r=document.querySelector(".grid"),c=e.length,u=document.querySelector(".playButton"),h=document.querySelector(".resetButton"),i=document.querySelector(".modeButton"),f="Mode: Classic",l=3,M=2500,m=!1,L,g=0,w=[],U=["sawtooth","sine","square","triangle"],F=yield(yield fetch(`${window.location.href.includes("file")?"https://cors-anywhere.herokuapp.com/":""}https://jameslewis.io/assets/Output%201-2.wav`)).arrayBuffer(),v,C,N=()=>{u.innerHTML=m?"Stop":"Play",r.className=m?"main grid playing":"main grid",i.className=m?"modeButton playing":"modeButton"},P=()=>{m=!1,clearInterval(L),N(),n.forEach(t=>t.classList.remove("active")),g=0,w=[],n=[]},_=()=>{if(++g,w.push(n),w.length>2){w.shift();let[t,o]=w.map(s=>s.map(y=>y.id).length>0?s.map(y=>y.id).reduce((y,b)=>y+b):"empty");t===o&&P()}},T=()=>A(E,null,function*(){v=new window.AudioContext;let t=v.createGain();t.gain.value=.0666,t.connect(v.destination);let o=v.createConvolver(),s=x(F.slice(0));o.buffer=yield v.decodeAudioData(s),o.connect(t),C=o}),B=t=>A(E,null,function*(){let o=v.createOscillator();o.type=U[Math.floor(Math.random()*4)],o.frequency.setValueAtTime(t,v.currentTime),o.connect(C),o.start(),yield new Promise(a=>setTimeout(a,M)).then(()=>{o.stop(),o.disconnect()})}),S=(t,o)=>{m||(n.includes(t)?(n=n.filter(s=>s!==t),t.classList.remove("active")):(n.push(t),t.classList.add("active"),B(o))),m&&B(o)};e.forEach((t,o)=>{let s=c-o,[a,y]=D(s,c);t.id=`${s}`,t.addEventListener("click",()=>{let b=Math.floor(g/4)%2===0?a:y;v===void 0?T().then(()=>S(t,b)):S(t,b)})});let $=(t,o,s,a)=>{!s&&a===l||s&&(a===l||a===l-1)?(n.includes(t)||n.push(t),s||t.classList.add("active"),t.click()):(n=n.filter(y=>y!==t),s&&t.classList.remove("active"))},j=(t,o,s)=>{Math.floor(Math.random()*10)===0?(n.includes(t)||n.push(t),s||t.classList.add("active"),t.click()):(n=n.filter(a=>a!==t),s&&t.classList.remove("active"))},q=()=>{let t=n.map(o=>+o.id);e.forEach((o,s)=>{let a=o.classList.contains("active"),y=O(c,t,+o.id).length;f==="Mode: Classic"&&$(o,s,a,y),f==="Mode: Random"&&j(o,s,a)}),_()},k=()=>{m===!0?(q(),L=setInterval(()=>q(),M)):clearInterval(L)};u==null||u.addEventListener("click",()=>{m=!m,N(),v===void 0?T().then(()=>k()):k()}),h==null||h.addEventListener("click",()=>{P()}),i==null||i.addEventListener("click",()=>{f==="Mode: Random"?f="Mode: Classic":f="Mode: Random",i.innerHTML=f})}))});Q();})();
