'use strict';
/* ================= RHK ================= */
var rDraft=null;
function rhkStats(r){
  var rg=repRange(),per=db.logs.filter(function(l){var x=rhkOf(l);return x&&x.id===r.id&&l.tgl>=rg[0]&&l.tgl<=rg[1]});
  var o=per.reduce(function(a,l){return a+numOf(l.output)},0),m=per.reduce(function(a,l){return a+dur(l)},0);
  return {n:per.length,o:o,m:m};
}
function openRhk(){
  var list=db.rhk||[],un=db.logs.filter(function(l){return !rhkOf(l)}).length;
  openDlg('<div class="dh"><h2 id="dlgTitle">Rencana Hasil Kerja (RHK)</h2><button class="iconbtn" type="button" data-act="closeDlg" aria-label="Tutup">'+ic('x')+'</button></div>'
   +'<div class="db"><p class="muted" style="margin:0 0 10px;font-size:13.5px">Salin RHK dari SKP-mu di e-Kinerja. Setiap pekerjaan dan kegiatan bisa dikaitkan ke satu RHK, lalu laporan bulanan disusun per RHK.</p>'
   +'<div class="mini-list">'+(list.length?list.map(function(r,i){var st=rhkStats(r);return '<div class="mini"><span><b>RHK '+(i+1)+'</b> · '+esc(shortT(r.teks,110))+'<br><small class="muted">'+esc(r.jenis==='tambahan'?'Tambahan':'Utama')+(r.indikator?' · '+esc(shortT(r.indikator,70)):'')+'<br>Periode laporan terpilih: '+st.n+' kegiatan, '+fmtNum(st.o)+' '+esc(r.satuan||'')+(r.target?' (target '+esc(r.target)+' '+esc(r.satuan||'')+')':'')+', '+fmtDur(st.m)+'</small></span><button class="btn sm" type="button" data-edit-rhk="'+r.id+'">Ubah</button></div>'}).join(''):'<div class="muted" style="padding:6px 2px">Belum ada RHK.</div>')+'</div>'
   +(list.length&&un?'<p class="muted" style="font-size:13px;margin:10px 0 0">'+un+' kegiatan belum punya RHK. Kaitkan lewat pekerjaan atau form kegiatan.</p>':'')+'</div>'
   +'<div class="df"><span class="sp"></span><button class="btn" type="button" data-act="closeDlg">Tutup</button><button class="btn primary" type="button" data-act="newRhk">'+ic('plus')+'Tambah RHK</button></div>');
}
function openRhkForm(id){
  var r=id?rhkById(id):null;
  rDraft=r?JSON.parse(JSON.stringify(r)):{id:uid(),teks:'',jenis:'utama',indikator:'',target:'',satuan:'',atasan:''};
  openDlg('<div class="dh"><h2 id="dlgTitle">'+(r?'Ubah RHK':'RHK baru')+'</h2><button class="iconbtn" type="button" data-act="rhk" aria-label="Kembali">'+ic('x')+'</button></div>'
   +'<form id="rform" class="db" autocomplete="off"><div class="fgrid">'
   +'<div class="field full"><label for="r-teks">Rumusan RHK</label><textarea id="r-teks" required placeholder="Salin persis dari SKP, misalnya: Tersusunnya SOP administrasi pemerintahan perangkat daerah">'+esc(rDraft.teks)+'</textarea></div>'
   +'<div class="field"><label for="r-jenis">Jenis</label><select id="r-jenis"><option value="utama"'+(rDraft.jenis==='utama'?' selected':'')+'>RHK utama</option><option value="tambahan"'+(rDraft.jenis==='tambahan'?' selected':'')+'>RHK tambahan</option></select></div><div></div>'
   +'<div class="field full"><label for="r-ind">Indikator kinerja individu</label><textarea id="r-ind" placeholder="Contoh: Jumlah SOP yang tersusun dan ditetapkan">'+esc(rDraft.indikator)+'</textarea></div>'
   +'<div class="field"><label for="r-target">Target (tahunan)</label><input type="text" id="r-target" inputmode="decimal" value="'+esc(rDraft.target)+'" placeholder="12"></div>'
   +'<div class="field"><label for="r-sat">Satuan</label><input type="text" id="r-sat" value="'+esc(rDraft.satuan)+'" placeholder="dokumen"></div>'
   +'<div class="field full"><label for="r-atasan">RHK atasan yang diintervensi (opsional)</label><input type="text" id="r-atasan" value="'+esc(rDraft.atasan)+'"></div></div>'
   +'<div class="err" id="r-err"></div></form>'
   +'<div class="df">'+(r?'<button class="btn danger" type="button" data-act="delRhk">'+ic('trash')+'Hapus</button>':'')+'<span class="sp"></span><button class="btn" type="button" data-act="rhk">Batal</button><button class="btn primary" type="button" data-act="saveRhk">Simpan</button></div>');
}
var STOPW='yang dan untuk dengan dari pada atas oleh dalam terhadap kepada jumlah tersusunnya terlaksananya kegiatan perangkat daerah'.split(' ');
function stems(t){
  var m=String(t||'').toLowerCase().split(/[^a-z0-9]+/).filter(function(x){return x.length>3&&STOPW.indexOf(x)<0});
  return m.map(function(x){return x.replace(/^(meng|meny|men|mem|me|di|ter|pen|pem|per|pe|se)/,'').replace(/(kan|an|nya|i)$/,'')}).filter(function(x){return x.length>2});
}
function guessRhk(l){
  var w=workById(l.workId),words=stems(l.uraian+' '+(w?w.judul:'')),best=null,bs=0,tie=false;
  (db.rhk||[]).forEach(function(r){
    var rw=stems(r.teks+' '+(r.indikator||'')),sc=0;
    words.forEach(function(x,i){if(words.indexOf(x)===i&&rw.indexOf(x)>-1)sc++});
    if(sc>bs){bs=sc;best=r;tie=false}else if(sc===bs&&sc>0)tie=true;
  });
  return bs>0&&!tie?best:null;
}
function eKinerjaText(r){
  var out=[];
  r.groups.forEach(function(g){
    out.push((g.rhk?'RHK '+rhkNo(g.rhk)+': '+g.rhk.teks:'BELUM DIKLASIFIKASI'));
    g.logs.forEach(function(l){
      var urls=logFileIds(l).map(function(id){return fileUrl(fileById(id))}).filter(Boolean);if(isUrl(l.bukti))urls.push(l.bukti);
      out.push('- '+fmtDate(l.tgl)+' | '+l.uraian+' | '+((l.output?l.output+' '+(l.satuan||(g.rhk&&g.rhk.satuan)||''):'-').trim())+' | '+fmtDur(dur(l))+(urls.length?' | Bukti: '+urls.join(' ; '):''));
    });out.push('')});
  return out.join('\n').trim();
}

