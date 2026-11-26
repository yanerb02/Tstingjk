'use strict';
/* ===== animasi maskot: pilih WebP animasi sesuai keadaan ===== */
var MA={state:'santai',hold:false,t:0,urls:null,idleIdx:0,ct:0,sk:null,pend:null,seq:0,cut:false,waved:false};
var MA_IDLE=[['santai',7200],['menunggu',3900],['santai',3600],['ketuk_kaki',3900]];
var MA_LOW=[['lelah',4100],['santai',3600],['lapar',4300],['santai',3600]];
function maChar(){var k=(db.profile&&db.profile.avatar)||'pria';return MA_CLIPS[k]?k:'pria'}
function maOn(){return (MA_CLIPS[maChar()]||[]).indexOf('santai')>=0}
function maDim(){return MA_DIM[maChar()]||'220/360'}
/* ganti karakter: kosongkan cache dan mulai lagi dari keadaan santai */
function maReset(){
  clearTimeout(MA.t);clearTimeout(MA.ct);
  MA.urls=null;MA.state='santai';MA.hold=false;MA.sk=null;MA.pend=null;MA.seq++;MA.idleIdx=0;MA.cut=false;
}
function maUrls(){
  if(MA.urls)return MA.urls;MA.urls={};
  var ch=maChar(),have=MA_CLIPS[ch]||[],states=['wave','santai','menunggu','ketuk_kaki','mencatat_prep','mencatat','mencatat_selesai','lelah','lapar','jempol_ok'];
  states.forEach(function(k){
    var use=have.indexOf(k)>=0?k:((MA_FALLBACK[k]||[]).filter(function(x){return have.indexOf(x)>=0})[0]);
    if(use)MA.urls[k]=absUrl(MASKOT_DIR+ch+'/'+use+'.webp');
  });
  /* muat semua klip di latar supaya pergantian halus; setelah pernah dimuat, service worker menyimpannya untuk dipakai offline */
  Object.keys(MA.urls).forEach(function(k){var im=new Image();im.src=MA.urls[k]});
  return MA.urls;
}
/* keadaan dasar: mencatat saat kolom catatan sedang diisi, bergantian lelah / lapar kalau energi menipis, selain itu santai / pegang kacamata / ketuk kaki */
function maTyping(){var a=document.activeElement;return !!a&&a.id==='q-u'}
function maBase(){
  if(maTyping())return 'mencatat';
  if(energyNow()<.4)return MA_LOW[MA.idleIdx%MA_LOW.length][0];
  return MA_IDLE[MA.idleIdx%MA_IDLE.length][0];
}
function maSched(k){
  if(k!=='santai'&&k!=='menunggu'&&k!=='ketuk_kaki'&&k!=='lelah'&&k!=='lapar'){clearTimeout(MA.ct);MA.sk=null;return}
  if(MA.sk===k)return;
  clearTimeout(MA.ct);MA.sk=k;
  var list=energyNow()<.4?MA_LOW:MA_IDLE;
  var dur=(list[MA.idleIdx%list.length]||['santai',3600])[1];
  MA.ct=setTimeout(function(){MA.sk=null;MA.idleIdx=(MA.idleIdx+1)%list.length;if(!MA.hold){MA.cut=true;maRest();MA.cut=false}},dur);
}
function maWave(){
  if(!maOn()||maTyping())return;
  MA.cut=true;maSet('wave',3250);MA.cut=false;
}
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'&&ui.view==='beranda')maWave()});
/* isi kolom catatan ikut tampil di gelembung maskot, dan hero tetap terlihat saat keyboard HP muncul */
function mirrorQ(){
  var i=$('#q-u'),b=$('#mbubble');if(!i||!b)return;
  var v=i.value.trim();
  b.textContent=v?'Mencatat: '+(v.length>90?'…'+v.slice(-89):v):'Ketik kegiatanmu di sini, tekan Enter untuk mencatat.';
}
function heroNow(){
  var h=document.querySelector('.hero');if(!h||!maTyping())return;
  var r=h.getBoundingClientRect(),vh=window.visualViewport?window.visualViewport.height:window.innerHeight;
  if(r.top<0||r.bottom>vh)h.scrollIntoView({block:'start',behavior:'auto'});
}
function keepHero(){
  if(!window.matchMedia||!matchMedia('(max-width:699px)').matches)return;
  heroNow();[0,150,350,700,1100].forEach(function(d){setTimeout(heroNow,d)});
  if(window.requestAnimationFrame)requestAnimationFrame(heroNow);
}
if(window.visualViewport)visualViewport.addEventListener('resize',function(){if(maTyping())keepHero()});
function maSrc(){if(!maOn())return MASCOT;if(!MA.hold)MA.state=maBase();maSched(MA.hold?'x':MA.state);return maUrls()[MA.state]}
/* ms diisi = tampilkan keadaan itu sementara, lalu balik ke keadaan dasar */
/* ganti animasi dengan crossfade: gambar baru dimuat dulu, lalu memudar masuk sementara yang lama memudar keluar */
function maSwap(m,k){
  var cur=m.querySelector('img.cur')||m.querySelector('img');
  if(cur&&cur.getAttribute('data-s')===k&&!MA.pend)return;
  if(MA.pend===k)return;
  MA.pend=k;var seq=++MA.seq;var cutNow=!!MA.cut;
  var n=new Image();n.className='cur';n.alt='';n.draggable=false;n.setAttribute('data-s',k);
  var show=function(){
    if(seq!==MA.seq||!m.isConnected)return;
    MA.pend=null;m.classList.remove('enter');
    var old=m.querySelector('img.cur');
    if(cutNow){n.style.transition='none';n.style.opacity='1';m.appendChild(n);if(old&&old.parentNode)old.parentNode.removeChild(old);return}
    n.style.opacity='0';m.appendChild(n);
    if(old)old.classList.remove('cur');
    var go=function(){n.style.opacity='1';if(old)old.style.opacity='0'};
    if(window.requestAnimationFrame)requestAnimationFrame(function(){requestAnimationFrame(go)});else go();
    if(old)setTimeout(function(){if(old.parentNode)old.parentNode.removeChild(old)},260);
  };
  n.src=maUrls()[k];
  if(n.decode)n.decode().then(show,show);else n.onload=show;
}
function maSet(k,ms){
  MA.state=k;MA.hold=!!ms;clearTimeout(MA.t);
  if(ms)MA.t=setTimeout(maRest,ms);
  maSched(ms?'x':k);
  var m=$('#mascot');if(!m||!maOn())return;
  maSwap(m,k);
}
function maStartWriting(){
  if(!maOn())return;
  if(MA.state==='mencatat'||MA.state==='mencatat_prep')return;
  MA.cut=true;maSet('mencatat_prep',1500);MA.cut=false;
}
function maRest(){
  var seamless=(MA.state!=='mencatat');
  MA.hold=false;
  if(maOn()){if(seamless)MA.cut=true;maSet(maBase());MA.cut=false}
}
setInterval(function(){if(!MA.hold&&!MA.sk)maRest()},60000);
function mascotAct(k){
  var m=$('#mascot');if(!m)return;
  if(k==='cheer'){
    if(MA.state==='mencatat'||MA.state==='mencatat_prep'){
      MA.cut=true;maSet('mencatat_selesai',1500);MA.cut=false;
      clearTimeout(MA.t);
      MA.t=setTimeout(function(){MA.cut=true;maSet('jempol_ok',3850);MA.cut=false},1500);
    }else{MA.cut=true;maSet('jempol_ok',3850);MA.cut=false}
  }
  m.classList.remove('enter','hop','cheer');void m.offsetWidth;m.classList.add(k);setTimeout(function(){m.classList.remove(k)},1200);
}
