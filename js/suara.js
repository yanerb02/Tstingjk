'use strict';
/* ================= PERINTAH SUARA: cari berkas dengan bicara =================
   Memakai Web Speech API bawaan peramban (bahasa Indonesia). Suara diproses oleh layanan pengenal suara
   peramban (Chrome/Android: Google, Safari: Apple), jadi perlu internet. Tanpa dukungan, kolom ketik tetap bisa dipakai. */
var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
var VO={rec:null,on:false,text:'',alts:[],err:'',q:'',res:null,mode:'idle'};

/* kata perintah/pengisi yang dibuang dari ucapan sebelum mencari */
var V_STOP={tolong:1,coba:1,minta:1,carikan:1,cari:1,temukan:1,tampilkan:1,tunjukkan:1,buka:1,bukakan:1,lihat:1,munculkan:1,mana:1,dimana:1,
  berkas:1,file:1,dokumen:1,yang:1,tentang:1,soal:1,mengenai:1,dong:1,ya:1,yah:1,deh:1,nih:1,itu:1,saya:1,aku:1,dari:1,untuk:1,si:1,ada:1,apa:1,
  masbro:1,bro:1,tadi:1,kemarin:1,kok:1,sih:1,lah:1,aja:1,saja:1,pak:1,bu:1,tuh:1};
function vTokens(s){
  return String(s||'').toLowerCase().replace(/[^a-z0-9À-ɏ\s\/\-\.]/g,' ').replace(/[\.\-\/]+(?=\s|$)/g,' ').split(/\s+/)
    .filter(function(t){return t&&!V_STOP[t]});
}
function vLev(a,b){ /* jarak edit sederhana, cukup untuk kata pendek */
  if(Math.abs(a.length-b.length)>2)return 9;
  var p=[],i,j,c;for(j=0;j<=b.length;j++)p[j]=j;
  for(i=1;i<=a.length;i++){var prev=p[0];p[0]=i;for(j=1;j<=b.length;j++){c=p[j];p[j]=Math.min(p[j]+1,p[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=c}}
  return p[b.length];
}
/* bidang yang dicari beserta bobotnya */
function vFields(f){
  var w=workById(f.workId),kg=db.logs.filter(function(l){return logFileIds(l).indexOf(f.id)>=0});
  return [
    [f.nama,3],[f.nomor,3],[f.lampiran&&f.lampiran.nama,2],[f.jenis,1.5],[w&&w.judul,1.5],
    [f.ket,1],[f.lokasi,1],[fmtDate(f.tgl),1],[kg.map(function(l){return l.uraian}).join(' '),1]
  ].map(function(x){return [String(x[0]||'').toLowerCase(),x[1]]});
}
function vScoreFile(f,toks){
  if(!toks.length)return 0;
  var F=vFields(f),total=0,hit=0;
  toks.forEach(function(t){
    var best=0;
    F.forEach(function(fd){
      var txt=fd[0],wgt=fd[1];if(!txt)return;
      if(txt.indexOf(t)>=0){best=Math.max(best,wgt);return}
      if(t.length>=5){ /* salah dengar satu-dua huruf */
        txt.split(/[^a-z0-9À-ɏ]+/).forEach(function(wd){
          if(wd.length<4)return;
          if(wd.indexOf(t.slice(0,4))===0&&Math.abs(wd.length-t.length)<=3)best=Math.max(best,wgt*.55);
          else if(vLev(t,wd)<=1)best=Math.max(best,wgt*.7);
        });
      }
    });
    if(best>0)hit++;total+=best;
  });
  var cover=hit/toks.length;
  if(cover<.5)return 0; /* minimal separuh kata kunci harus ketemu */
  return total*cover;
}
/* cari dari beberapa kemungkinan hasil dengar; ambil skor terbaik tiap berkas */
function vSearch(alts){
  var sets=alts.map(vTokens).filter(function(t){return t.length}),best={};
  sets.forEach(function(toks){db.files.forEach(function(f){var s=vScoreFile(f,toks);if(s>(best[f.id]||0))best[f.id]=s})});
  var arr=db.files.filter(function(f){return best[f.id]>0}).map(function(f){return {f:f,s:best[f.id]}});
  arr.sort(function(a,b){return b.s-a.s||(b.f.tgl||'').localeCompare(a.f.tgl||'')});
  return {q:(sets[0]||[]).join(' '),list:arr.map(function(x){return x.f}),scores:arr.map(function(x){return x.s})};
}

/* ----- tampilan ----- */
function vMsg(){
  if(VO.err)return '<p class="vmsg bad">'+esc(VO.err)+'</p>';
  return '';
}
function vBody(){
  var h='';
  if(VO.mode==='listen'){
    h+='<div class="vlisten"><button class="vmic big on" type="button" data-act="voiceStop" aria-label="Berhenti mendengarkan">'+ic('mic')+'</button>'
      +'<div class="vbars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>'
      +'<div class="vsay" id="vsay">'+(VO.text?esc(VO.text):'Mendengarkan… sebutkan berkas yang dicari')+'</div>'
      +'<div class="muted" style="font-size:12.5px">Contoh: "cari surat undangan rapat", "buka berkas SOP", "nomor 145"</div></div>';
  }else if(VO.mode==='result'){
    var r=VO.res,list=r.list;
    h+='<div class="vheard">Kamu bilang: <b>“'+esc(VO.text||r.q)+'”</b></div>';
    if(!list.length){
      h+='<div class="empty" style="padding:18px 8px"><b>Tidak ada berkas yang cocok</b>Coba sebut nama, nomor surat, atau nama pekerjaannya.</div>';
    }else{
      h+='<div class="vlbl">Paling cocok</div><div class="card vtop">'+fileRow(list[0],false)+'</div>';
      if(list.length>1){
        h+='<div class="vlbl">Pilihan lain yang terkait</div><div class="card">'+list.slice(1,6).map(function(f){return fileRow(f,false)}).join('')+'</div>';
      }
      if(list.length>6)h+='<div class="muted" style="font-size:12.5px">Masih ada '+(list.length-6)+' berkas lain yang cocok. Lihat semuanya di menu Berkas.</div>';
    }
  }else{
    h+='<p class="muted" style="margin:0">'+(SR?'Ketuk mikrofon lalu bicara, atau ketik di bawah.':'Peramban ini belum mendukung pengenal suara. Ketik di bawah, atau pakai ikon mikrofon di keyboard HP/iPad untuk mendikte.')+'</p>';
  }
  return vMsg()+h;
}
function vPaint(){
  var b=$('#vbody');if(b)b.innerHTML=vBody();
}
function vOpen(){
  openDlg('<div class="dh"><h2 id="dlgTitle">Cari berkas dengan suara</h2><button class="iconbtn" type="button" data-act="closeDlg" aria-label="Tutup">'+ic('x')+'</button></div>'
   +'<div class="db"><div id="vbody"></div>'
   +'<form id="vform" class="vtype" autocomplete="off"><label class="sr" for="vq">Ketik pencarian</label><input type="search" id="vq" placeholder="Atau ketik / dikte di sini" value="">'
   +'<button class="btn primary" type="submit">Cari</button></form></div>'
   +'<div class="df">'+(SR?'<button class="btn" type="button" data-act="voice">'+ic('mic')+'Bicara lagi</button>':'')
   +'<button class="btn" type="button" data-act="voiceAll">Lihat di menu Berkas</button></div>');
  vPaint();
}
function vFinish(alts,spoken){
  VO.on=false;VO.text=spoken||alts[0]||'';VO.res=vSearch(alts.length?alts:[VO.text]);VO.q=VO.res.q;VO.mode='result';VO.err='';
  vPaint();
}
function vStop(abort){
  try{if(VO.rec){abort?VO.rec.abort():VO.rec.stop()}}catch(e){}
}
function vStart(){
  VO.err='';VO.text='';VO.alts=[];VO.res=null;VO.mode='idle';
  if(!dlg.open||!$('#vbody'))vOpen();
  if(!SR){VO.mode='idle';vPaint();var q=$('#vq');if(q)q.focus();return}
  var rec=new SR(),got=false;
  rec.lang='id-ID';rec.interimResults=true;rec.continuous=false;rec.maxAlternatives=3;
  VO.rec=rec;VO.on=true;VO.mode='listen';vPaint();
  rec.onresult=function(e){
    var txt='',alts=[],last=e.results[e.results.length-1];
    for(var i=0;i<e.results.length;i++)txt+=e.results[i][0].transcript+' ';
    VO.text=txt.trim();
    var s=$('#vsay');if(s)s.textContent=VO.text;
    if(last.isFinal){got=true;for(var k=0;k<last.length;k++)alts.push(last[k].transcript);vFinish(alts,VO.text)}
  };
  rec.onerror=function(e){
    var m={'not-allowed':'Izin mikrofon ditolak. Izinkan mikrofon untuk situs ini di pengaturan peramban, lalu coba lagi. Kalau aplikasi dibuka dari layar utama iPad/iPhone, buka lewat Safari biasa atau pakai ikon mikrofon di keyboard.',
      'service-not-allowed':'Pengenal suara tidak diizinkan di mode ini. Buka lewat peramban (Safari/Chrome) atau pakai ikon mikrofon di keyboard untuk mendikte.',
      'no-speech':'Tidak ada suara yang terdengar. Ketuk "Bicara lagi" dan coba lebih dekat ke mikrofon.',
      'audio-capture':'Mikrofon tidak terdeteksi.','network':'Pengenal suara butuh internet. Periksa koneksi lalu coba lagi.','aborted':''}[e.error];
    VO.err=m===undefined?('Pengenal suara gagal ('+e.error+').'):m;VO.on=false;if(e.error!=='aborted'){VO.mode='idle';vPaint()}
  };
  rec.onend=function(){
    VO.on=false;
    if(!got&&VO.mode==='listen'){ /* berhenti tanpa hasil akhir: pakai teks sementara kalau ada */
      if(VO.text)vFinish([VO.text],VO.text);else{VO.mode='idle';if(!VO.err)VO.err='Tidak ada suara yang terdengar. Coba lagi.';vPaint()}
    }
  };
  try{rec.start()}catch(e){VO.err='Tidak bisa memulai mikrofon.';VO.mode='idle';vPaint()}
}

/* ----- aksi & pengikat ----- */
acts.voice=function(){vStart()};
acts.voiceStop=function(){vStop(false)};
acts.voiceAll=function(){
  var q=VO.q||'';vStop(true);closeDlg();ui.fq=q;ui.fj='';
  if(ui.view==='berkas')renderFiles();else location.hash='#berkas';
};
document.addEventListener('submit',function(e){
  if(e.target.id!=='vform')return;e.preventDefault();
  var v=($('#vq').value||'').trim();if(!v)return;
  vStop(true);VO.mode='result';VO.err='';vFinish([v],v);
});
document.addEventListener('close',function(e){if(e.target&&e.target.id==='dlg')vStop(true)},true);

/* tombol mikrofon melayang di semua halaman */
(function(){
  var b=document.createElement('button');b.type='button';b.className='vfab';b.setAttribute('data-act','voice');
  b.setAttribute('aria-label','Cari berkas dengan suara');b.innerHTML=ic('mic');
  document.body.appendChild(b);
})();
