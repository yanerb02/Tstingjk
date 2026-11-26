/* Service worker Jejak Kerja: aplikasi bisa dibuka offline.
   Naikkan angka VERSI setiap kali kamu mengubah file apa pun, supaya HP mengunduh versi baru. */
var VERSI='jejak-v2';
var INTI=['./','index.html','manifest.webmanifest','css/app.css','fonts/fonts.css',
  'icons/icon-192.png','icons/icon-512.png',
  'js/vendor/qrcode.js','js/config.js','js/util-data.js','js/hero.js','js/penyimpanan-drive.js','js/maskot.js','js/beranda.js',
  'js/pekerjaan.js','js/rhk.js','js/kinerja.js','js/berkas.js','js/laporan.js','js/pengaturan.js','js/aksi.js','js/suara.js','js/mulai.js',
  'assets/maskot/pria/statis.webp','assets/maskot/wanita/statis.webp','assets/maskot/hijab/statis.webp'];

self.addEventListener('install',function(e){
  e.waitUntil(caches.open(VERSI).then(function(c){
    /* satu file gagal tidak menggagalkan semuanya */
    return Promise.all(INTI.map(function(u){return c.add(u).catch(function(){})}));
  }).then(function(){return self.skipWaiting()}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){
    var lama=ks.filter(function(k){return k!==VERSI});
    return Promise.all(lama.map(function(k){return caches.delete(k)})).then(function(){
      if(lama.length)return self.clients.matchAll().then(function(cs){cs.forEach(function(c){c.postMessage({type:'update'})})});
    });
  }).then(function(){return self.clients.claim()}));
});
/* file milik aplikasi: ambil dari cache dulu, kalau belum ada ambil dari jaringan lalu simpan (klip animasi tersimpan saat pertama dipakai) */
self.addEventListener('fetch',function(e){
  var r=e.request;
  if(r.method!=='GET')return;
  var u=new URL(r.url);
  if(u.origin!==location.origin)return;
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(function(hit){
    if(hit)return hit;
    return fetch(r).then(function(res){
      if(res&&res.ok){var cp=res.clone();caches.open(VERSI).then(function(c){c.put(r,cp)})}
      return res;
    }).catch(function(){return caches.match('index.html')});
  }));
});
