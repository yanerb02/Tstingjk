'use strict';
/* ================= PEKERJAAN ================= */
function renderWorks(){
  var counts={aktif:0,baru:0,proses:0,menunggu:0,selesai:0,semua:db.works.length};
  db.works.forEach(function(w){counts[w.status]++;if(w.status!=='selesai')counts.aktif++});
  var fl=[['aktif','Aktif'],['baru','Baru'],['proses','Diproses'],['menunggu','Menunggu'],['selesai','Selesai'],['semua','Semua']];
  $('#view').innerHTML='<div class="page-head"><div><h1>Pekerjaan</h1><p>Satu kartu untuk satu pekerjaan, lengkap dengan asal perintah, tenggat, langkah, dan berkasnya.</p></div>'
    +'<div class="row"><button class="btn" type="button" data-act="rhk">'+ic('report')+'Kelola RHK</button><button class="btn primary" type="button" data-act="newWork">'+ic('plus')+'Pekerjaan baru</button></div></div>'
    +'<div class="toolbar"><div class="search">'+ic('search')+'<label class="sr" for="wq">Cari pekerjaan</label><input type="search" id="wq" placeholder="Cari judul, nomor surat, atau pemberi tugas" value="'+esc(ui.wq)+'"></div></div>'
    +'<div class="filters" role="group" aria-label="Filter status">'+fl.map(function(f){return '<button class="fchip" type="button" data-wf="'+f[0]+'" aria-pressed="'+(ui.wf===f[0])+'">'+f[1]+'<b>'+counts[f[0]]+'</b></button>'}).join('')+'</div>'
    +'<div id="wlist"></div>';
  paintWorkList();
}
function paintWorkList(){
  var q=ui.wq.trim().toLowerCase();
  var list=db.works.filter(function(w){
    if(ui.wf==='aktif'&&w.status==='selesai')return false;
    if(ui.wf!=='aktif'&&ui.wf!=='semua'&&w.status!==ui.wf)return false;
    if(q){var s=[w.judul,w.noSurat,w.asal,w.catatan,KAT[w.kat]&&KAT[w.kat].n].join(' ').toLowerCase();if(s.indexOf(q)<0)return false}
    return true}).sort(function(a,b){
      if((a.status==='selesai')!==(b.status==='selesai'))return a.status==='selesai'?1:-1;
      return (a.tenggat||'9999').localeCompare(b.tenggat||'9999')});
  var el=$('#wlist');if(!el)return;
  if(!list.length){el.innerHTML='<div class="empty"><b>'+(db.works.length?'Tidak ada pekerjaan yang cocok':'Belum ada pekerjaan')+'</b>'+(db.works.length?'Coba ubah kata kunci atau filter status.':'Tambahkan pekerjaan pertama dari tombol di kanan atas.')+'</div>';return}
  el.innerHTML='<div class="grid">'+list.map(function(w){
    var k=katOf(w),st=w.subtasks||[],dn=st.filter(function(x){return x.d}).length,fc=db.files.filter(function(f){return f.workId===w.id}).length;
    var pr=w.prio==='mendesak'?'<span class="prio">Mendesak</span>':w.prio==='penting'?'<span class="prio p">Penting</span>':'';
    return '<article class="card wcard'+(w.status==='selesai'?' done':'')+'"><div class="top2"><span class="chip" style="--dot:'+k.c+'"><i></i><span>'+esc(k.n)+'</span></span>'
      +'<button class="checkbtn'+(w.status==='selesai'?' on':'')+'" type="button" data-toggle-done="'+w.id+'" aria-label="'+(w.status==='selesai'?'Buka kembali pekerjaan':'Tandai selesai')+'">'+ic('check')+'</button></div>'
      +'<h3><button type="button" data-open-work="'+w.id+'">'+esc(w.judul)+'</button></h3>'
      +'<div class="sub">'+(w.asal?esc(w.asal):'Asal perintah belum diisi')+(w.noSurat?' · '+esc(w.noSurat):'')+'</div>'
      +(st.length?'<div><div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="'+st.length+'" aria-valuenow="'+dn+'"><i style="width:'+Math.round(dn/st.length*100)+'%"></i></div></div>':'')
      +'<div class="wfoot">'+dueBadge(w)+'<span class="pill '+w.status+'">'+STATUS[w.status]+'</span>'+pr+'<span class="sp"></span>'
      +(st.length?'<span class="mono">'+dn+'/'+st.length+'</span>':'')+(fc?'<span>'+ic('file').replace('class="ic"','class="ic" style="width:15px;height:15px;vertical-align:-3px"')+' '+fc+'</span>':'')+'</div></article>'}).join('')+'</div>';
}

var dlg;
function openDlg(html){dlg.innerHTML=html;if(!dlg.open)dlg.showModal()}
function closeDlg(){if(dlg.open)dlg.close()}

var wDraft=null;
function openWork(id,preset){
  var w=id?workById(id):null;
  wDraft=w?JSON.parse(JSON.stringify(w)):Object.assign({id:uid(),judul:'',kat:'dokumen',asal:'',noSurat:'',tglSurat:'',tenggat:'',status:'baru',prio:'biasa',catatan:'',subtasks:[],dibuat:today(),_new:1},preset||{});
  var files=db.files.filter(function(f){return f.workId===wDraft.id}),logs=db.logs.filter(function(l){return l.workId===wDraft.id});
  var tot=logs.reduce(function(a,l){return a+dur(l)},0);
  var opts=function(o,sel){return Object.keys(o).map(function(k){return '<option value="'+k+'"'+(k===sel?' selected':'')+'>'+esc(typeof o[k]==='string'?o[k]:o[k].n)+'</option>'}).join('')};
  openDlg('<div class="dh"><h2 id="dlgTitle">'+(w?'Detail pekerjaan':'Pekerjaan baru')+'</h2><button class="iconbtn" type="button" data-act="closeDlg" aria-label="Tutup">'+ic('x')+'</button></div>'
   +'<form id="wform" class="db" autocomplete="off"><div class="fgrid">'
   +'<div class="field full"><label for="w-judul">Judul pekerjaan</label><input type="text" id="w-judul" required value="'+esc(wDraft.judul)+'" placeholder="Contoh: Penyusunan SOP layanan administrasi"></div>'
   +'<div class="field"><label for="w-kat">Jenis</label><select id="w-kat">'+opts(KAT,wDraft.kat)+'</select></div>'
   +'<div class="field"><label for="w-prio">Prioritas</label><select id="w-prio">'+opts(PRIO,wDraft.prio)+'</select></div>'
   +'<div class="field"><label for="w-asal">Asal perintah</label><input type="text" id="w-asal" value="'+esc(wDraft.asal)+'" placeholder="Pimpinan atau instansi pengirim"></div>'
   +'<div class="field"><label for="w-status">Status</label><select id="w-status">'+opts(STATUS,wDraft.status)+'</select></div>'
   +'<div class="field"><label for="w-no">Nomor surat</label><input type="text" id="w-no" value="'+esc(wDraft.noSurat)+'"></div>'
   +'<div class="field"><label for="w-ts">Tanggal surat</label><input type="date" id="w-ts" value="'+esc(wDraft.tglSurat)+'"></div>'
   +'<div class="field"><label for="w-te">Tenggat</label><input type="date" id="w-te" value="'+esc(wDraft.tenggat)+'"></div>'
   +'<div class="field full"><label for="w-rhk">RHK (Rencana Hasil Kerja)</label><select id="w-rhk">'+rhkOpts(wDraft.rhkId,'Belum dikaitkan ke RHK')+'</select>'+((db.rhk||[]).length?'':'<small class="muted">Belum ada RHK. Tambahkan dulu lewat tombol Kelola RHK di halaman Pekerjaan.</small>')+'</div>'
   +'<div class="field full"><label for="w-cat">Catatan</label><textarea id="w-cat" placeholder="Apa yang perlu diingat soal pekerjaan ini?">'+esc(wDraft.catatan)+'</textarea></div></div>'
   +'<div class="field"><span class="lbl">Langkah pengerjaan</span><div class="mini-list" id="w-subs"></div>'
   +'<div class="sub-row" style="grid-template-columns:1fr auto;margin-top:6px"><input type="text" id="w-newsub" placeholder="Tambah langkah, lalu tekan Enter"><button class="btn sm" type="button" data-act="addSub">'+ic('plus')+'Tambah</button></div></div>'
   +'<div class="field"><span class="lbl">Berkas terkait ('+files.length+')</span><div class="mini-list">'+(files.length?files.map(function(f){return '<div class="mini"><span>'+esc(f.nama)+'<br><small class="muted">'+esc(f.jenis)+(f.nomor?' · '+esc(f.nomor):'')+'</small></span><button class="btn sm" type="button" data-edit-file="'+f.id+'" data-from-work="1">Ubah</button></div>'}).join(''):'<div class="muted" style="font-size:13px">Belum ada berkas. Catat surat atau bahan supaya mudah dicari.</div>')+'</div>'
   +'<div><button class="btn sm" type="button" data-act="fileForWork">'+ic('plus')+'Catat berkas untuk pekerjaan ini</button></div></div>'
   +(logs.length?'<div class="muted" style="font-size:13px">Sudah dikerjakan '+fmtDur(tot)+' dalam '+logs.length+' catatan kinerja.</div>':'')
   +'<div class="err" id="w-err"></div></form>'
   +'<div class="df">'+(w?'<button class="btn danger" type="button" data-act="delWork" id="btnDelW">'+ic('trash')+'Hapus</button>':'')+'<span class="sp"></span><button class="btn" type="button" data-act="closeDlg">Batal</button><button class="btn primary" type="button" data-act="saveWork">Simpan</button></div>');
  paintSubs();
}
function paintSubs(){
  var el=$('#w-subs');if(!el)return;
  el.innerHTML=wDraft.subtasks.length?wDraft.subtasks.map(function(s,i){return '<div class="sub-row"><input type="checkbox" data-sub-done="'+i+'"'+(s.d?' checked':'')+' aria-label="Selesai"><input type="text" data-sub-text="'+i+'" value="'+esc(s.t)+'" aria-label="Langkah '+(i+1)+'"><button class="iconbtn" type="button" data-sub-del="'+i+'" aria-label="Hapus langkah">'+ic('x')+'</button></div>'}).join(''):'<div class="muted" style="font-size:13px">Belum ada langkah. Pecah pekerjaan jadi langkah kecil supaya kemajuannya terlihat.</div>';
}
function readWorkForm(){
  var g=function(i){return $('#'+i).value};
  var w=wDraft;
  w.judul=g('w-judul').trim();w.kat=g('w-kat');w.prio=g('w-prio');w.asal=g('w-asal').trim();w.status=g('w-status');w.rhkId=g('w-rhk');
  w.noSurat=g('w-no').trim();w.tglSurat=g('w-ts');w.tenggat=g('w-te');w.catatan=g('w-cat').trim();
  var ns=$('#w-newsub');if(ns&&ns.value.trim()){w.subtasks.push({id:uid(),t:ns.value.trim(),d:0});ns.value=''}
  return w;
}
function commitWork(){
  var w=readWorkForm();
  if(!w.judul){$('#w-err').textContent='Judul pekerjaan belum diisi.';$('#w-judul').focus();return null}
  var wasDone=false,ex=workById(w.id);
  if(ex)wasDone=ex.status==='selesai';
  if(w.status==='selesai'&&!w.selesaiTgl)w.selesaiTgl=today();
  if(w.status!=='selesai')delete w.selesaiTgl;
  var clean=JSON.parse(JSON.stringify(w));delete clean._new;
  if(ex)db.works[db.works.indexOf(ex)]=clean;else db.works.push(clean);
  save();
  return {w:clean,justDone:!wasDone&&clean.status==='selesai'};
}


