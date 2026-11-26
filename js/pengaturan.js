'use strict';
function sigMode(p){return p.sigMode||(p.ttdAtasan&&p.ttdOn!==false?'gambar':'kosong')}
function sigModeOf(p,who){return who==='p'?(p.sigModePeg||(p.ttdPeg?'gambar':'kosong')):sigMode(p)}
function sigPic(p,who){var k=TTK[who||'a'];return {src:p[k.img]||'',w:p[k.w]||3,h:p[k.h]||1}}
var qrCache={};
function qrPng(text){
  if(qrCache[text])return qrCache[text];
  var q=qrcode(0,'L');q.addData(text);q.make();var n=q.getModuleCount(),m=2,sc=Math.max(4,Math.ceil(400/(n+2*m))),c=document.createElement('canvas'),x;
  c.width=c.height=(n+2*m)*sc;x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.fillStyle='#000';
  for(var r=0;r<n;r++)for(var k=0;k<n;k++)if(q.isDark(r,k))x.fillRect((k+m)*sc,(r+m)*sc,sc,sc);
  return qrCache[text]=c.toDataURL('image/png');
}
function qrText(r,p,who){
  var L=who==='p'?['Pelapor: '+(p.nama||'-'),'NIP: '+(p.nip||'-'),'Jabatan: '+(p.jabatan||'-'),'Unit: '+(p.unit||'-')]:['Penanda tangan: '+(p.atasan||'-'),'NIP: '+(p.nipAtasan||'-'),'Jabatan: '+(p.jabatanAtasan||'-'),'Pegawai: '+(p.nama||'-')+(p.nip?' / '+p.nip:'')];
  return L.concat(['Laporan: '+(r.title||'')+' | '+(r.period||''),'Dibuat '+today()+' oleh Jejak Kerja. Bukan TTE bersertifikat.']).join('\n')}
function ttdImg(p,h,r,who){
  who=who||'a';var m=sigModeOf(p,who);
  if(m==='qr')return '<img class="ttd qr" alt="QR penanda" src="'+qrPng(qrText(r||{},p,who))+'" style="height:'+h+'px;width:'+h+'px"><small class="qrcap">QR penanda, bukan TTE bersertifikat</small>';
  var pic=sigPic(p,who);if(m!=='gambar'||!pic.src)return '';var w=Math.round(h*pic.w/pic.h);return '<img class="ttd" alt="" src="'+pic.src+'" style="height:'+h+'px;width:'+w+'px">'}
function ttdImg_old(p,h){var t=p.ttdAtasan;if(!t||p.ttdOn===false)return '';var w=Math.round(h*(p.ttdW||3)/(p.ttdH||1));return '<img class="ttd" alt="" src="'+t+'" style="height:'+h+'px;width:'+w+'px">'}
function loadTtd(file,who){
  if(!file)return;
  if(file.size>3*1024*1024){toast('Gambar terlalu besar (maks. 3 MB)');return}
  var fr=new FileReader();
  fr.onload=function(){var im=new Image();im.onload=function(){
    var k=Math.min(1,420/im.width,200/im.height),w=Math.max(1,Math.round(im.width*k)),h=Math.max(1,Math.round(im.height*k));
    var c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(im,0,0,w,h);
    TT[who].v=c.toDataURL('image/png');TT[who].wh=[w,h];paintTtd();
  };im.onerror=function(){toast('Gambar tidak bisa dibaca')};im.src=fr.result};
  fr.readAsDataURL(file);
}
function ttdBlock(who,p){
  var a=who==='a',id=a?'':'p',m=sigModeOf(p,who),o=function(v,t){return '<option value="'+v+'"'+(m===v?' selected':'')+'>'+t+'</option>'};
  return '<div class="field"><span class="lbl">'+(a?'Spesimen tanda tangan / TTE atasan':'Spesimen tanda tangan / TTE pegawai (kamu)')+'</span><div class="card" style="padding:14px;background:var(--surface2);display:grid;gap:10px">'
   +'<div class="row" style="align-items:center"><div class="ttdbox" id="'+TTK[who].prev+'"></div><div style="display:grid;gap:6px"><label class="btn sm" for="s-ttd'+id+'">'+ic('up')+'Unggah gambar</label><input type="file" id="s-ttd'+id+'" accept="image/*" class="sr"><button class="btn sm danger" type="button" data-act="ttdDel'+(a?'':'P')+'">'+ic('trash')+'Hapus</button></div></div>'
   +'<div class="field"><label for="s-sigmode'+id+'">Isi kolom tanda tangan '+(a?'atasan':'pegawai')+' di laporan</label><select id="s-sigmode'+id+'">'+o('kosong','Kosong (tanda tangan basah)')+o('gambar','Spesimen gambar')+o('qr','QR otomatis dari nama, NIP, dan jabatan')+'</select></div>'
   +'<small class="muted">'+(a?'QR otomatis hanyalah penanda data penandatangan (nama, NIP, jabatan, periode laporan). Ini bukan tanda tangan elektronik bersertifikat (TTE BSrE) dan tidak menggantikan persetujuan atasan. Spesimen gambar: PNG berlatar transparan, pakai hanya dengan izin atasan. Muncul di pratinjau dan Word, belum di Excel.':'Sama seperti atasan: QR hanya penanda data pelapor, bukan TTE bersertifikat. Spesimen gambar dipakai untuk tanda tangan milikmu sendiri.')+'</small></div></div>';
}
function openSettings(){
  TT.a.v=undefined;TT.p.v=undefined;setTimeout(paintTtd,0);
  var p=db.profile,d=p.drive||{},connected=!!d.connected;
  var f=function(id,l,v,ph,full){return '<div class="field'+(full?' full':'')+'"><label for="'+id+'">'+l+'</label><input type="text" id="'+id+'" value="'+esc(v||'')+'" placeholder="'+esc(ph||'')+'"></div>'};
  openDlg('<div class="dh"><h2 id="dlgTitle">Profil dan data</h2><button class="iconbtn" type="button" data-act="closeDlg" aria-label="Tutup">'+ic('x')+'</button></div>'
   +'<form id="sform" class="db" autocomplete="off"><p class="muted" style="margin:0;font-size:13.5px">Profil dipakai untuk kop dan tanda tangan di laporan.</p>'
   +'<div class="field"><span class="lbl">Karakter maskot</span><div class="avpick" id="avpick">'+AVATARS.map(function(a){return '<button type="button" data-act="pickAvatar" data-av="'+a[0]+'" aria-pressed="'+((p.avatar||'pria')===a[0])+'"><i class="th" style="background-image:url('+a[2]+')"></i>'+a[1]+'</button>'}).join('')+'</div></div>'
   +'<div class="fgrid">'
   +f('s-nama','Nama lengkap',p.nama,'',0)+f('s-nip','NIP',p.nip,'',0)+f('s-jab','Jabatan',p.jabatan,'Contoh: Analis Kebijakan Ahli Pertama',1)+f('s-unit','Unit kerja',p.unit,'',1)
   +f('s-atasan','Nama atasan langsung',p.atasan,'',0)+f('s-nipa','NIP atasan',p.nipAtasan,'',0)+f('s-jaba','Jabatan atasan',p.jabatanAtasan,'Contoh: Kepala Bagian Organisasi',0)+f('s-kota','Kota (untuk tanda tangan)',p.kota,'',0)
   +'<div class="field"><label for="s-target">Target jam kerja per hari</label><input type="number" id="s-target" step="0.5" min="1" max="12" value="'+(p.targetJam||7.5)+'"></div></div>'
   +ttdBlock('a',p)+ttdBlock('p',p)
   +'<div class="field"><span class="lbl">Google Drive (OAuth 2.0)</span>'
   +'<div class="card" style="padding:14px;background:var(--surface2);display:grid;gap:10px">'
   +(connected
     ?'<div class="row" style="justify-content:space-between"><div><b style="color:var(--good)">✓ Terhubung ke Google Drive</b><div class="muted" style="font-size:13px">'+esc(d.email||d.userName||'Akun Google aktif')+'</div></div>'
      +'<div class="row"><button class="btn sm" type="button" data-act="driveTest">Tes Folder</button><button class="btn sm danger" type="button" data-act="driveLogout">Putuskan</button></div></div>'
     :'<div class="row" style="justify-content:space-between"><div><b>Belum terhubung ke Google Drive</b><div class="muted" style="font-size:13px">Login dengan akun Google agar file surat langsung masuk ke Google Drive milikmu.</div></div>'
      +'<button class="btn primary" type="button" data-act="driveLogin">Login dengan Google</button></div>')
   +'<span class="drv-st" id="drv-st" role="status"></span>'
   +'<div class="fgrid">'
   +'<div class="field"><label for="s-dakses">Siapa yang bisa membuka tautan surat</label><select id="s-dakses"><option value="pribadi"'+(d.akses!=='tautan'?' selected':'')+'>Hanya saya (disarankan)</option><option value="tautan"'+(d.akses==='tautan'?' selected':'')+'>Siapa saja yang punya tautan</option></select></div>'
   +'</div>'
   +'<details style="font-size:12.5px;color:var(--muted)"><summary style="cursor:pointer">Pengaturan Admin (Google OAuth Client ID)</summary>'
   +'<div class="field" style="margin-top:8px"><label for="s-dclient">Client ID (.apps.googleusercontent.com)</label><input type="text" id="s-dclient" value="'+esc(d.clientId||'')+'" placeholder="Kosongkan jika sudah ditanam di DEFAULT_CLIENT_ID"></div></details>'
   +'</div></div>'
   +'<div class="field"><span class="lbl">Cadangan data</span><div class="row"><button class="btn sm" type="button" data-act="backup">'+ic('down')+'Unduh cadangan (.json)</button><label class="btn sm" for="restoreFile">'+ic('up')+'Pulihkan dari cadangan</label><input type="file" id="restoreFile" accept="application/json,.json" class="sr"></div>'
   +'<small class="muted">Data tersimpan di peramban perangkat ini. Unduh cadangan sebelum ganti perangkat atau menghapus data peramban.</small></div>'
   +'<div class="field"><span class="lbl">Hapus data</span><div class="row"><button class="btn sm danger" type="button" data-act="wipe" id="btnWipe">Hapus semua data</button></div></div></form>'
   +'<div class="df"><span class="sp"></span><button class="btn" type="button" data-act="closeDlg">Batal</button><button class="btn primary" type="button" data-act="saveSettings">Simpan</button></div>');
}

