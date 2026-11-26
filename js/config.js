/* ================= KONFIGURASI MASKOT & IKON =================
   Semua gambar sekarang berupa FILE biasa (bukan teks base64), jadi mudah diganti lewat GitHub.
   Struktur:  assets/maskot/<karakter>/statis.webp   -> gambar diam (wajib, juga dipakai sebagai avatar bulat)
              assets/maskot/<karakter>/<keadaan>.webp -> klip animasi (opsional, WebP animasi transparan)
   Karakter  : pria, wanita, hijab
   Keadaan   : wave, santai, menunggu, ketuk_kaki, mencatat_prep, mencatat, mencatat_selesai, lelah, lapar, jempol_ok
   Cara menambah animasi karakter baru: taruh file .webp-nya di foldernya, lalu tulis nama keadaannya di MA_CLIPS di bawah.
   Karakter yang daftar klipnya kosong, atau tidak punya klip 'santai', otomatis memakai gambar diam. */
'use strict';
var ICON192='icons/icon-192.png';
var ICON512='icons/icon-512.png';
var MASKOT_DIR='assets/maskot/';
var AV_PREFIX=MASKOT_DIR;
function absUrl(p){try{return new URL(p,document.baseURI).href}catch(e){return p}}
var AVATARS=[['pria','Laki-laki',absUrl(MASKOT_DIR+'pria/statis.webp')],['wanita','Perempuan',absUrl(MASKOT_DIR+'wanita/statis.webp')],['hijab','Perempuan berhijab',absUrl(MASKOT_DIR+'hijab/statis.webp')]];
var MASCOT=AVATARS[0][2];
/* daftar klip animasi yang tersedia per karakter */
var MA_CLIPS={
  pria:['wave','santai','menunggu','ketuk_kaki','mencatat_prep','mencatat','mencatat_selesai','lelah','lapar','jempol_ok'],
  wanita:[],
  hijab:[]
};
/* rasio lebar/tinggi kanvas klip tiap karakter (lebar/tinggi); ganti kalau klipmu berukuran lain */
var MA_DIM={pria:'220/360',wanita:'220/360',hijab:'220/360'};
/* kalau sebuah keadaan tidak punya klip, pakai pengganti ini (urut) */
var MA_FALLBACK={wave:['santai'],menunggu:['santai'],ketuk_kaki:['santai','menunggu'],mencatat_prep:['mencatat','santai'],mencatat:['santai'],mencatat_selesai:['jempol_ok','santai'],lelah:['santai'],lapar:['lelah','santai'],jempol_ok:['santai']};
function setAvatar(k){
  var a=AVATARS.filter(function(x){return x[0]===k})[0]||AVATARS[0];MASCOT=a[2];
  try{document.documentElement.style.setProperty('--mascot','url("'+MASCOT+'")')}catch(e){}
}
setAvatar('pria');
