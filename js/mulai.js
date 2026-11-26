'use strict';
/* ================= mulai ================= */
db=load();
if(!db){db=seed();save()}
setAvatar(db.profile&&db.profile.avatar);
db.prefs=db.prefs||{theme:''};db.profile=db.profile||{};db.rhk=db.rhk||[];
buildChrome();wire();applyTheme();route();

if(ui.view==='beranda'&&!MA.waved){MA.waved=true;maWave();}
/* ===== PWA: pasang service worker (hanya lewat http/https, bukan saat file dibuka langsung) ===== */
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){
  window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})});
  navigator.serviceWorker.addEventListener('message',function(e){
    if(e.data&&e.data.type==='update')toast('Versi baru sudah diunduh. Tutup lalu buka lagi aplikasinya untuk memakainya.');
  });
  /* minta peramban tidak menghapus data catatan saat ruang penyimpanan HP menipis */
  if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(function(){});
}
