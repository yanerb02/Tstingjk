'use strict';
/* ================= hero hidup: energi, gradasi, kopi/kue/nasi padang ================= */
var FUEL={
  kopi:{n:'Kopi',lv:1,add:.12,dur:90,say:'Kopi datang. Mata kembali melek, lanjut kerja.',svg:'<svg viewBox="0 0 64 64"><ellipse cx="32" cy="55" rx="23" ry="4.5" fill="#000" opacity=".2"/><path d="M12 27h34v12a15 15 0 0 1-15 15h-4A15 15 0 0 1 12 39z" fill="#FBF6EA"/><path d="M12 38h34" stroke="#D9822B" stroke-width="3.4"/><path d="M46 30h3a6.5 6.5 0 0 1 0 13h-4" fill="none" stroke="#FBF6EA" stroke-width="4" stroke-linecap="round"/><ellipse cx="29" cy="27" rx="17" ry="4.4" fill="#6B3F1D"/><ellipse cx="29" cy="27" rx="17" ry="4.4" fill="none" stroke="#EADFCB" stroke-width="2"/><g class="steam" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"><path d="M21 19c-3-3 3-5 0-9"/><path d="M30 19c-3-3 3-5 0-9"/><path d="M39 19c-3-3 3-5 0-9"/></g></svg>'},
  kue:{n:'Kue',lv:2,add:.2,dur:150,say:'Kue manis, semangat naik lagi.',svg:'<svg viewBox="0 0 64 64"><ellipse cx="32" cy="55" rx="26" ry="5" fill="#000" opacity=".2"/><path d="M7 52V31q0-4 4-4h42q4 0 4 4v21q0 3-3 3H10q-3 0-3-3z" fill="#F4C28A"/><rect x="7" y="38" width="50" height="6" fill="#FFF5E1"/><path d="M7 31q0-5 5-5h40q5 0 5 5v3q-4 5-8.3 0t-8.4 0-8.4 0-8.4 0-8.4 0q-4 3-4.5 0z" fill="#E8648C"/><circle cx="32" cy="21" r="5.4" fill="#D92F3F"/><path d="M32 16c0-4 3-6 6-6" stroke="#2E8B57" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="30.4" cy="19.6" r="1.4" fill="#fff" opacity=".7"/></svg>'},
  nasi:{n:'Nasi Padang',lv:3,add:.4,dur:240,say:'Nasi Padang! Tenaga penuh, siap lanjut sampai sore.',svg:'<svg viewBox="0 0 64 64"><ellipse cx="32" cy="54" rx="28" ry="5.5" fill="#000" opacity=".2"/><ellipse cx="32" cy="42" rx="28" ry="12" fill="#EDEDE8"/><ellipse cx="32" cy="41" rx="22" ry="9" fill="#fff" stroke="#DADAD3"/><path d="M15 41a13 13 0 0 1 26 0z" fill="#FFFDF0" stroke="#E6E2CF"/><path d="M22 36l2 2M28 33l2 2M33 37l2 2M19 40l2 1" stroke="#E0D9BC" stroke-width="1.4" stroke-linecap="round"/><rect x="36" y="31" width="12" height="9" rx="3.5" fill="#7A3B1D"/><rect x="42" y="37" width="10" height="7" rx="3" fill="#92502A"/><path d="M29 43c3-3.5 9-1.5 9 1.6s-6.5 3-9-1.6z" fill="#D9381E"/><path d="M12 38c6-9 15-7 15-7s-3 10-15 7z" fill="#2E9B57"/><path d="M14 36c4-3 8-4 11-4" stroke="#1F7A41" stroke-width="1.2" fill="none"/><path d="M45 27c0-4 3-3 3-7" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".55"/></svg>'}
};
function isDark(){var t=document.documentElement.getAttribute('data-theme');return t?t==='dark':!!(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)}
function fuelList(){
  var pf=db.prefs=db.prefs||{},now=Date.now(),t=today();
  pf.fuel=(pf.fuel||[]).filter(function(f){return f.d===t&&now-f.t<6*3600000});
  return pf.fuel;
}
function workFrac(){
  var d=new Date(),m=d.getHours()*60+d.getMinutes()+d.getSeconds()/60,st=450,len=((db.profile&&db.profile.targetJam)||7.5)*60+60;
  return Math.max(0,Math.min(1,(m-st)/len));
}
function energyNow(){
  var base=1-Math.pow(workFrac(),1.5),boost=0,now=Date.now();
  fuelList().forEach(function(f){var k=FUEL[f.k];if(!k)return;boost+=k.add*Math.max(0,1-(now-f.t)/(k.dur*60000))});
  return Math.max(0,Math.min(1,base+boost));
}
function moodStops(){
  return isDark()?[[1,[15,59,58],[110,225,205]],[.9,[15,59,58],[110,225,205]],[.58,[104,72,10],[255,200,80]],[.2,[112,30,30],[255,120,100]],[0,[112,30,30],[255,120,100]]]
                 :[[1,[10,90,85],[120,230,200]],[.9,[10,90,85],[120,230,200]],[.58,[172,112,6],[255,214,92]],[.2,[166,43,43],[255,130,110]],[0,[166,43,43],[255,130,110]]];
}
function toHsl(c){var r=c[0]/255,g=c[1]/255,b=c[2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,h=0,s=0,d=mx-mn;
  if(d){s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?((g-b)/d+(g<b?6:0)):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60}return [h,s,l]}
function fromHsl(a){var h=a[0]/360,s=a[1],l=a[2];
  var f=function(p,q,t){if(t<0)t+=1;if(t>1)t-=1;return t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*(2/3-t)*6:p};
  if(!s)return [Math.round(l*255),Math.round(l*255),Math.round(l*255)];
  var q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;return [f(p,q,h+1/3),f(p,q,h),f(p,q,h-1/3)].map(function(v){return Math.round(v*255)})}
function moodAt(x,idx){
  x=Math.max(0,Math.min(1,x));var st=moodStops();
  for(var i=0;i<st.length-1;i++){var a=st[i],b=st[i+1];
    if(x<=a[0]&&x>=b[0]){var u=(a[0]-x)/((a[0]-b[0])||1),A=toHsl(a[idx]),B=toHsl(b[idx]);
      var dh=B[0]-A[0];if(dh>180)dh-=360;if(dh<-180)dh+=360;
      var h=(A[0]+dh*u+360)%360,H=fromHsl([h,A[1]+(B[1]-A[1])*u,A[2]+(B[2]-A[2])*u]);
      return H.map(function(v,j){return Math.round((v+a[idx][j]+(b[idx][j]-a[idx][j])*u)/2)})}}
  return st[st.length-1][idx];
}
function rgb(c){return 'rgb('+c.join(',')+')'}
var eShown=null,eTween=0;
function paintMood(e){
  var h=$('.hero');if(!h)return;
  if(e==null)e=energyNow();
  var sp=.1+.18*(1-e),c1=moodAt(Math.min(1,e+sp),1),c2=moodAt(e,1),c3=moodAt(Math.max(0,e-sp),1),g=moodAt(e,2);
  h.classList.add('mood');
  h.style.setProperty('--m1',rgb(c1));h.style.setProperty('--m2',rgb(c2));h.style.setProperty('--m3',rgb(c3));
  h.style.setProperty('--glow','rgba('+g.join(',')+','+(isDark()?.2:.3)+')');
  var pct=Math.round(e*100),b=$('#energy .bar i'),n=$('#energy em');
  if(b)b.style.width=pct+'%';if(n)n.textContent=pct+'%';
  var en=$('#energy');if(en)en.setAttribute('aria-label','Energi '+pct+' persen');
  eShown=e;
}
function tweenMood(to){
  var from=eShown==null?to:eShown,t0=performance.now();cancelAnimationFrame(eTween);
  (function step(t){var u=Math.min(1,(t-t0)/900),k=1-Math.pow(1-u,3);paintMood(from+(to-from)*k);if(u<1)eTween=requestAnimationFrame(step)})(t0);
}
function toggleFuel(force){
  var f=$('#fuel');if(!f)return;
  var open=force==null?!f.classList.contains('open'):force;
  f.classList.toggle('open',open);clearTimeout(toggleFuel.t);
  if(open)toggleFuel.t=setTimeout(function(){f.classList.remove('open')},9000);
}
function fuelHtml(){
  var h='<div class="fuel" id="fuel" role="group" aria-label="Isi energi">';
  Object.keys(FUEL).forEach(function(k){var f=FUEL[k];
    h+='<button type="button" data-fuel="'+k+'" aria-label="'+f.n+', tambah energi '+Math.round(f.add*100)+' persen">'+f.svg+'<b>'+f.n+'</b><small>+'+Math.round(f.add*100)+'%</small><span class="lv">Lv'+f.lv+'</span></button>'});
  return h+'</div>';
}
function pickFuel(k,btn){
  var f=FUEL[k];if(!f)return;
  var before=energyNow();
  fuelList().push({k:k,t:Date.now(),d:today()});save();
  var after=energyNow();
  var hero=$('.hero'),fx=document.createElement('div');
  if(hero&&btn){var hr=hero.getBoundingClientRect(),br=btn.getBoundingClientRect();
    fx.className='eatfx';fx.innerHTML=f.svg;
    fx.style.left=(br.left-hr.left+br.width/2-30)+'px';fx.style.top=(br.top-hr.top)+'px';hero.appendChild(fx);
    if(fx.animate){var a=fx.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:'translate(0,-70px) scale(1.5) rotate(-8deg)',opacity:1,offset:.45},{transform:'translate(0,-110px) scale(.2)',opacity:0}],{duration:900,easing:'ease-out'});a.onfinish=function(){fx.remove()}}else fx.remove()}
  toggleFuel(false);
  if(hero){hero.classList.remove('boost');void hero.offsetWidth;hero.classList.add('boost');setTimeout(function(){hero.classList.remove('boost')},1000)}
  tweenMood(after);mascotAct('hop');MA.cut=true;maSet('jempol_ok',3850);MA.cut=false;
  say(before>=.995?'Makasiiiih yaaa, energiku sudah penuh!':'Makasiiiih yaaa');
  toast(f.n+' masuk. Energi '+Math.round(after*100)+'%',true);
}
setInterval(function(){if($('.hero')&&document.visibilityState!=='hidden')paintMood()},60000);

