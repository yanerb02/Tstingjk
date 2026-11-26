'use strict';
/* ================= BERKAS ================= */
function driveBanner(){return driveCfg()?'':'<div class="banner"><span>Hubungkan Google Drive supaya lampiran surat langsung tersimpan di Drive-mu dan laporan berisi tautan yang bisa diklik.</span><button class="btn sm primary" type="button" data-act="driveLogin">Login dengan Google</button></div>'}
function renderFiles(){
  $('#view').innerHTML='<div class="page-head"><div><h1>Berkas</h1><p>Catat di mana surat dan bahan disimpan, atau lampirkan filenya langsung. Cari dengan satu kata.</p></div><button class="btn primary" type="button" data-act="newFile">'+ic('plus')+'Catat berkas</button></div>'
   +driveBanner()+'<div class="toolbar"><div class="search">'+ic('search')+'<label class="sr" for="fq">Cari berkas</label><input type="search" id="fq" placeholder="Cari nama, nomor surat, lokasi, atau pekerjaan" value="'+esc(ui.fq)+'"></div>'
   +'<div class="seg" style="min-width:190px"><button type="button" data-fv="folder" aria-pressed="'+(ui.fv==='folder')+'">Folder</button><button type="button" data-fv="daftar" aria-pressed="'+(ui.fv==='daftar')+'">Daftar</button></div>'
   +'<label class="sr" for="fj">Jenis berkas</label><select id="fj" style="width:auto;min-width:160px"><option value="">Semua jenis</option>'+JENIS.map(function(j){return '<option'+(ui.fj===j?' selected':'')+'>'+j+'</option>'}).join('')+'</select></div><div id="flist"></div>';
  paintFileList();
}
function paintFileList(){
  var q=ui.fq.trim().toLowerCase(),el=$('#flist');if(!el)return;
  var list=db.files.filter(function(f){
    if(ui.fj&&f.jenis!==ui.fj)return false;
    if(q){var w=workById(f.workId);var s=[f.nama,f.nomor,f.lokasi,f.ket,f.jenis,w&&w.judul,f.lampiran&&f.lampiran.nama].join(' ').toLowerCase();if(s.indexOf(q)<0)return false}
    return true}).sort(function(a,b){return (b.tgl||'').localeCompare(a.tgl||'')});
  if(!list.length){el.innerHTML='<div class="empty"><b>'+(db.files.length?'Berkas tidak ditemukan':'Belum ada berkas dicatat')+'</b>'+(db.files.length?'Coba kata kunci lain.':'Catat surat masuk pertama dan kaitkan dengan pekerjaannya.')+'</div>';return}
  if(ui.fv==='folder'){el.innerHTML=fileTree(list,!!q);return}
  el.innerHTML='<div class="card">'+list.map(function(f){return fileRow(f,false)}).join('')+'</div>';
}
function fileRow(f,noChip){
  var w=workById(f.workId),k=katOf(w),u=fileUrl(f),cp=u||f.lokasi;
  return '<div class="frow"><div class="ficon">'+ic(f.drive?'link':f.lampiran?'file':u?'link':'folder')+'</div><div class="fmain"><div class="n">'+esc(f.nama)+'</div>'
     +'<div class="m">'+esc(f.jenis)+(f.nomor?' · '+esc(f.nomor):'')+(f.tgl?' · '+fmtDate(f.tgl):'')+'</div>'
     +(f.drive?'<div class="m">Tersimpan di Google Drive</div>':'')
     +(f.pendingDrive?'<div class="m"><span class="pill warn">Belum terunggah ke Drive</span></div>':'')
     +(f.lokasi&&!(f.drive&&f.lokasi===f.drive.url)?'<div class="m">'+esc(f.lokasi)+'</div>':'')
     +(f.lampiran?'<div class="m">Di perangkat ini: '+esc(f.lampiran.nama)+' ('+Math.max(1,Math.round(f.lampiran.size/1024))+' KB)</div>':'')
     +(w&&!noChip?'<div style="margin-top:4px"><button class="chip" type="button" style="--dot:'+k.c+';border:0;cursor:pointer" data-open-work="'+w.id+'"><i></i><span>'+esc(w.judul)+'</span></button></div>':'')+'</div>'
     +'<div class="fact">'+(u?'<a class="btn sm" href="'+esc(u)+'" target="_blank" rel="noopener">'+(f.drive?'Buka di Drive':'Buka tautan')+'</a>':'')
     +(f.lampiran?'<button class="btn sm" type="button" data-open-att="'+f.id+'">Buka file</button>':'')
     +(f.pendingDrive&&driveCfg()?'<button class="btn sm primary" type="button" data-drive-up="'+f.id+'">Unggah ke Drive</button>':'')
     +(cp?'<button class="iconbtn" style="width:34px;height:34px" type="button" data-copy="'+f.id+'" aria-label="Salin tautan atau lokasi">'+ic('copy')+'</button>':'')
     +'<button class="iconbtn" style="width:34px;height:34px" type="button" data-edit-file="'+f.id+'" aria-label="Ubah berkas">'+ic('edit')+'</button></div></div>';
}
function fileTree(list,forceOpen){
  var byId={};list.forEach(function(f){byId[f.id]=f});
  var used={},groups=[];
  var latest=function(arr){return arr.reduce(function(m,x){return (x||'')>m?x:m},'')};
  var logSubs=function(logs){
    var subs=[];logs.sort(function(a,b){return (b.tgl+b.mulai).localeCompare(a.tgl+a.mulai)}).forEach(function(l){
      var fs=logFileIds(l).map(function(id){return byId[id]}).filter(Boolean);
      if(fs.length){subs.push({key:'l:'+l.id,title:fmtDate(l.tgl)+' · '+shortT(l.uraian,80),sub:'Kegiatan',files:fs,date:l.tgl});fs.forEach(function(f){used[f.id]=1})}});
    return subs};
  db.works.forEach(function(w){
    var subs=logSubs(db.logs.filter(function(l){return l.workId===w.id}));
    var direct=list.filter(function(f){return f.workId===w.id&&!used[f.id]});
    if(direct.length)subs.unshift({key:'d:'+w.id,title:'Berkas pekerjaan (tanpa kegiatan)',sub:'',files:direct,date:latest(direct.map(function(f){return f.tgl}))});
    if(!subs.length)return;
    var n={};subs.forEach(function(x){x.files.forEach(function(f){n[f.id]=1})});
    groups.push({key:'w:'+w.id,title:w.judul,w:w,subs:subs,count:Object.keys(n).length,date:latest(subs.map(function(x){return x.date}))});
  });
  var nw=logSubs(db.logs.filter(function(l){return !workById(l.workId)}));
  var rest=list.filter(function(f){return !used[f.id]&&!workById(f.workId)});
  if(rest.length)nw.push({key:'d:none',title:'Berkas lepas (tanpa kegiatan)',sub:'',files:rest,date:latest(rest.map(function(f){return f.tgl}))});
  if(nw.length){var n2={};nw.forEach(function(x){x.files.forEach(function(f){n2[f.id]=1})});groups.push({key:'w:none',title:'Tanpa pekerjaan',w:null,subs:nw,count:Object.keys(n2).length,date:latest(nw.map(function(x){return x.date}))})}
  groups.sort(function(a,b){return (a.w?0:1)-(b.w?0:1)||(b.date||'').localeCompare(a.date||'')});
  var op=function(k){return forceOpen||ui.fopen[k]?' open':''};
  return '<div class="row" style="margin-bottom:10px;justify-content:flex-end"><button class="btn sm" type="button" data-fold="open">Buka semua</button><button class="btn sm" type="button" data-fold="close">Tutup semua</button></div>'
   +groups.map(function(g){
    var k=g.w?katOf(g.w):null;
    return '<details class="fold" data-fk="'+g.key+'"'+op(g.key)+'><summary>'+ic('folder')+'<span class="ft">'+esc(g.title)+(g.w?'<small>'+esc(STATUS[g.w.status]||'')+(k?' · '+esc(k.n):'')+'</small>':'')+'</span><span class="fcount">'+g.count+'</span></summary><div class="fbody">'
     +g.subs.map(function(x){return '<details class="fold sub" data-fk="'+g.key+'/'+x.key+'"'+op(g.key+'/'+x.key)+'><summary>'+ic(x.sub?'clock':'folder')+'<span class="ft">'+esc(x.title)+'</span><span class="fcount">'+x.files.length+'</span></summary><div class="card fbody">'+x.files.map(function(f){return fileRow(f,true)}).join('')+'</div></details>'}).join('')
     +(g.w?'<div class="row" style="padding:2px 4px 8px"><button class="btn sm" type="button" data-open-work="'+g.w.id+'">Buka pekerjaan</button></div>':'')
     +'</div></details>'}).join('');
}
var fDraft=null,fFile=null,fReturnWork=null;
function openFile(id,preset){
  var f=id?db.files.filter(function(x){return x.id===id})[0]:null;fFile=null;
  fDraft=f?JSON.parse(JSON.stringify(f)):Object.assign({id:uid(),workId:'',nama:'',jenis:'Surat masuk',nomor:'',tgl:today(),lokasi:'',ket:''},preset||{});
  openDlg('<div class="dh"><h2 id="dlgTitle">'+(f?'Ubah berkas':'Catat berkas')+'</h2><button class="iconbtn" type="button" data-act="closeFileDlg" aria-label="Tutup">'+ic('x')+'</button></div>'
   +'<form id="fform" class="db" autocomplete="off"><div class="fgrid">'
   +'<div class="field full"><label for="f-n">Nama berkas</label><input type="text" id="f-n" required value="'+esc(fDraft.nama)+'" placeholder="Contoh: Surat undangan rapat koordinasi"></div>'
   +'<div class="field"><label for="f-j">Jenis</label><select id="f-j">'+JENIS.map(function(j){return '<option'+(fDraft.jenis===j?' selected':'')+'>'+j+'</option>'}).join('')+'</select></div>'
   +'<div class="field"><label for="f-t">Tanggal</label><input type="date" id="f-t" value="'+esc(fDraft.tgl)+'"></div>'
   +'<div class="field"><label for="f-no">Nomor surat / dokumen</label><input type="text" id="f-no" value="'+esc(fDraft.nomor)+'"></div>'
   +'<div class="field"><label for="f-w">Pekerjaan terkait</label><select id="f-w"><option value="">Tidak terkait</option>'+db.works.map(function(w){return '<option value="'+w.id+'"'+(w.id===fDraft.workId?' selected':'')+'>'+esc(w.judul)+'</option>'}).join('')+'</select></div>'
   +'<div class="field full"><label for="f-l">Lokasi penyimpanan atau tautan</label><input type="text" id="f-l" value="'+esc(fDraft.lokasi)+'" placeholder="Tautan Drive, atau jalur folder: Laptop > Dokumen > SOP"></div>'
   +'<div class="field full"><label for="f-file">Lampirkan file (opsional)</label><input type="file" id="f-file">'
   +(fDraft.drive?'<small class="muted">Tersimpan di Google Drive. <a href="'+esc(fDraft.drive.url)+'" target="_blank" rel="noopener">Buka</a>. Pilih file baru untuk menggantinya.</small>':fDraft.lampiran?'<small class="muted">Terlampir di perangkat: '+esc(fDraft.lampiran.nama)+'. Pilih file baru untuk menggantinya.</small>':(driveCfg()?'<small class="muted">Diunggah langsung ke Google Drive Anda (maks. 5 MB), tautannya tercatat otomatis.</small>':'<small class="muted">Tersimpan di perangkat ini (maks. 5 MB). Hubungkan Google Drive di Profil untuk mengunggah ke Drive.</small>'))+'</div>'
   +'<div class="field full"><label for="f-k">Keterangan</label><input type="text" id="f-k" value="'+esc(fDraft.ket)+'"></div></div><div class="err" id="f-err"></div></form>'
   +'<div class="df">'+(f?'<button class="btn danger" type="button" data-act="delFile">'+ic('trash')+'Hapus</button>':'')+'<span class="sp"></span><button class="btn" type="button" data-act="closeFileDlg">Batal</button><button class="btn primary" type="button" data-act="saveFile">Simpan</button></div>');
}

