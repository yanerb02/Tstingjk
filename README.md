# Jejak Kerja

Aplikasi PWA untuk mencatat pekerjaan, kegiatan/kinerja harian, berkas, dan RHK, lengkap dengan laporan Excel/Word.

## Struktur

```
index.html              kerangka halaman
manifest.webmanifest    pengaturan PWA (nama, ikon, warna)
sw.js                   service worker (offline). Naikkan VERSI di dalamnya tiap ada perubahan
fonts/                  fonts.css + file font (folder milikmu yang sudah ada, jangan dihapus)
css/app.css             semua gaya
icons/                  icon-192.png, icon-512.png
assets/maskot/<karakter>/   statis.webp + klip animasi .webp (pria, wanita, hijab)
js/
  config.js             daftar karakter, daftar klip animasi, jalur gambar  <- paling sering diubah
  util-data.js          fungsi bantu, data, state
  hero.js               energi, kopi/kue/nasi padang
  penyimpanan-drive.js  IndexedDB lampiran + Google Drive
  beranda.js  maskot.js  pekerjaan.js  rhk.js  kinerja.js  berkas.js  laporan.js  pengaturan.js
  aksi.js               penanganan klik/aksi
  suara.js              perintah suara: cari berkas dengan bicara (Web Speech API)
  mulai.js              start aplikasi + service worker
  vendor/qrcode.js      pustaka QR (MIT)
```

Urutan `<script>` di `index.html` penting, jangan diubah.

## Menambah animasi untuk karakter wanita / hijab

1. Siapkan klip WebP animasi transparan, kanvas 220x360, dengan nama persis:
   `wave, santai, menunggu, ketuk_kaki, mencatat_prep, mencatat, mencatat_selesai, lelah, lapar, jempol_ok`
   (minimal `santai`; keadaan yang tidak ada otomatis memakai pengganti, misalnya `lapar` memakai `lelah`).
2. Taruh di `assets/maskot/wanita/` atau `assets/maskot/hijab/`.
3. Di `js/config.js`, isi daftarnya, contoh:
   `wanita:['wave','santai','menunggu','ketuk_kaki','mencatat_prep','mencatat','mencatat_selesai','lelah','lapar','jempol_ok'],`
4. Kalau ukuran kanvas klip berbeda, ubah `MA_DIM`.
5. Naikkan `VERSI` di `sw.js`, lalu push.

Selama daftar sebuah karakter kosong, karakter itu tampil dengan gambar diam (`statis.webp`).

## Push ke GitHub

Pertama kali (repo baru):

```
cd jejak-kerja            # folder hasil ekstrak
git init
git add .
git commit -m "Pecah jadi beberapa file, animasi maskot per karakter"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

Kalau repo sudah ada: salin semua isi folder ini ke folder repo (timpa), pertahankan folder `fonts/`, lalu:

```
git add -A
git commit -m "Pecah jadi beberapa file, animasi maskot per karakter"
git push
```

Lewat web (tanpa git): di halaman repo pilih Add file, Upload files, seret semua folder dan file, lalu Commit changes.
Vercel akan membangun ulang otomatis setelah push. Setelah itu tutup dan buka lagi aplikasi di HP supaya versi baru dipakai.
