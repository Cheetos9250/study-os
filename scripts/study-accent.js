/* Study OS accent colour: follows the owner's Today cover image.
   Reads studyos.home.v1 (cover) read-only. Writes only a per-session cache
   (sessionStorage 'studyos.accent.cache'), never localStorage, so nothing new is backed up.
   Sets --ah / --as (hue, saturation) on <html>; study-world.css builds every accent shade from them. */
(function(){
 'use strict';
 if(typeof document==='undefined')return;
 var CACHE='studyos.accent.cache',root=document.documentElement;
 function rgb(h,s,l){s/=100;l/=100;var k=function(n){return (n+h/30)%12;},a=s*Math.min(l,1-l),f=function(n){return l-a*Math.max(-1,Math.min(k(n)-3,9-k(n),1));};return [f(0),f(8),f(4)];}
 function lum(c){c=c.map(function(v){return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2];}
 /* Lightness that keeps white text on the accent at 4.5:1 (light theme) and near-black text at 6:1 (dark theme). */
 function shades(h,s){var l=50;while(l>18&&(1.05)/(lum(rgb(h,s,l))+0.05)<4.6)l--;var d=55;while(d<88&&(lum(rgb(h,s,d))+0.05)/(0.0065+0.05)<6.5)d++;return {l:l,d:d};}
 var PROPS=['--ah','--as','--al','--ad'];
 function apply(h,s){if(h==null){PROPS.forEach(function(p){root.style.removeProperty(p);});return;}var t=shades(h,s);root.style.setProperty('--ah',String(Math.round(h)));root.style.setProperty('--as',Math.round(s)+'%');root.style.setProperty('--al',t.l+'%');root.style.setProperty('--ad',t.d+'%');}
 function cover(){try{var v=JSON.parse(localStorage.getItem('studyos.home.v1')||'{}');return v&&typeof v.cover==='string'?v.cover:'';}catch(e){return '';}}
 function key(src){var n=src.length,h=0;for(var i=0;i<n;i+=Math.max(1,Math.floor(n/512)))h=(h*31+src.charCodeAt(i))|0;return n+':'+h;}
 function readCache(){try{return JSON.parse(sessionStorage.getItem(CACHE)||'null');}catch(e){return null;}}
 function writeCache(v){try{sessionStorage.setItem(CACHE,JSON.stringify(v));}catch(e){}}
 /* Most common saturated hue, weighted by saturation; greys, near-black and near-white are skipped. */
 function pick(data){
  var bins=new Array(36).fill(0),sat=new Array(36).fill(0),total=0;
  for(var i=0;i<data.length;i+=4){
   if(data[i+3]<128)continue;
   var r=data[i]/255,g=data[i+1]/255,b=data[i+2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;
   if(d<0.12||l<0.12||l>0.92)continue;
   var s=d/(1-Math.abs(2*l-1)),h;
   if(mx===r)h=((g-b)/d)%6;else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;
   h=(h*60+360)%360;var k=Math.floor(h/10)%36,w=s*s;bins[k]+=w;sat[k]+=s*w;total+=w;
  }
  if(total<1)return null;
  var best=0;for(var j=1;j<36;j++)if(bins[j]+0.6*(bins[(j+35)%36]+bins[(j+1)%36])>bins[best]+0.6*(bins[(best+35)%36]+bins[(best+1)%36]))best=j;
  return {h:best*10+5,s:Math.min(88,Math.max(48,sat[best]/bins[best]*100))};
 }
 function refresh(){
  var src=cover();
  if(!src){apply(null);writeCache({k:'',h:null});return;}
  var k=key(src),c=readCache();
  if(c&&c.k===k){apply(c.h,c.s);return;}
  var img=new Image();
  if(/^https:/.test(src))img.crossOrigin='anonymous';
  img.onload=function(){
   try{var w=48,hh=Math.max(1,Math.round(48*img.height/img.width)),cv=document.createElement('canvas');cv.width=w;cv.height=hh;
    var ctx=cv.getContext('2d');ctx.drawImage(img,0,0,w,hh);var p=pick(ctx.getImageData(0,0,w,hh).data);
    if(p){apply(p.h,p.s);writeCache({k:k,h:p.h,s:p.s});}else{apply(null);writeCache({k:k,h:null});}
   }catch(e){apply(null);} /* a linked image without CORS cannot be read: keep the default accent */
  };
  img.onerror=function(){apply(null);};
  img.src=src;
 }
 var c0=readCache();if(c0&&c0.h!=null)apply(c0.h,c0.s);
 window.StudyAccent={refresh:refresh,pick:pick,shades:shades};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh);else refresh();
})();
