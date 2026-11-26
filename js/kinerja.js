'use strict';
/* ================= KINERJA ================= */
var TPL=[['Apel pagi','07:30','08:00'],['Memeriksa surat masuk','',''],['Membuat konsep surat dinas','',''],['Menelaah dan menyusun dokumen','',''],['Rapat atau koordinasi','',''],['Menyusun laporan','','']];
function renderLogs(){
  var d=ui.date,logs=logsOn(d).sort(byTime),mins=logs.reduce(function(a,l){return a+dur(l)},0),target=(db.profile.targetJam||7.5)*60;
  var dow=(fromIso(d).getDay()+6)%7,mon=addDays(d,-dow),wk='';
  for(var i=0;i<7;i++){var s=addDays(mon,i),m=logsOn(s).reduce(function(a,l){return a+dur(l)},0),r=Math.min(1,m/target);
    wk+='<button class="wd'+(i>4?' we':'')+'" type="button" data-date="'+s+'"'+(s===d?' aria-current="date"':'')+' aria-label="'+esc(fmtLong(s))+', '+fmtDur(m)+'"><span>'+DAYS[fromIso(s).getDay()].slice(0,3)+'</span><b>'+fromIso(s).getDate()+'</b><span class="meter"><i style="height:'+Math.round(r*100)+'%"></i></span></button>'}
  var sisa=Math.max(0,target-mins);
  $('#view').innerHTML='<div class="page-head"><div><h1>Kinerja harian</h1><p>Catat kegiatan pagi sampai sore. Laporan bulanan disusun dari catatan ini.</p></div><button class="btn primary" type="button" data-act="newLog">'+ic('plus')+'Catat kegiatan</button></div>'
   +'<div class="datebar"><button class="iconbtn" type="button" data-shift="-1" aria-label="Hari sebelumnya">'+ic('l')+'</button><button class="iconbtn" type="button" data-shift="1" aria-label="Hari berikutnya">'+ic('r')+'</button>'
   +'<div class="grow"><b style="font-family:var(--f-display);font-size:18px">'+esc(fmtLong(d))+'</b></div><label class="sr" for="datepick">Pilih tanggal</label><input type="date" id="datepick" value="'+d+'" style="width:auto"><button class="btn sm" type="button" data-date="'+today()+'">Hari ini</button></div>'
   +'<div class="week" role="group" aria-label="Minggu ini">'+wk+'</div>'
   +'<div class="card">'+(logs.length?logs.map(function(l){var w=workById(l.workId),k=katOf(w);
      return '<button class="lrow" type="button" data-edit-log="'+l.id+'"><span class="tm">'+l.mulai+'<small>'+l.selesai+'</small></span><span class="tx">'+esc(l.uraian)+'</span>'
       +'<span class="mt"><span>'+fmtDur(dur(l))+'</span>'+(w?'<span class="chip" style="--dot:'+k.c+'"><i></i><span>'+esc(w.judul)+'</span></span>':'')+(l.output?'<span>Output: '+esc(l.output)+' '+esc(l.satuan||'')+'</span>':'')+(rhkOf(l)?'<span>RHK '+rhkNo(rhkOf(l))+'</span>':'')+(logFileIds(l).length?'<span>Berkas: '+logFileIds(l).map(function(id){return esc(fileById(id).nama)}).join(', ')+'</span>':'')+(l.bukti?'<span>Bukti: '+esc(l.bukti)+'</span>':'')+'</span></button>'}).join('')
     :'<div class="empty" style="margin:14px"><b>Belum ada kegiatan di tanggal ini</b>Pakai tombol Catat kegiatan atau pilih templat di bawah.</div>')+'</div>'
   +'<div class="totals"><span>Total tercatat <b>'+fmtDur(mins)+'</b></span><span>Target <b>'+String(db.profile.targetJam||7.5).replace('.',',')+' j</b></span><span>'+(sisa?'Kurang <b>'+fmtDur(sisa)+'</b>':'Target hari ini terpenuhi')+'</span></div>'
   +'<div class="section"><h2 style="font-size:15px">Templat cepat</h2><div class="tpl">'+TPL.map(function(t,i){return '<button class="fchip" type="button" data-tpl="'+i+'">'+esc(t[0])+'</button>'}).join('')+'</div></div>';
}
var lDraft=null;
function openLog(id,preset){
  var l=id?db.logs.filter(function(x){return x.id===id})[0]:null;
  var todayLogs=logsOn(ui.date).sort(byTime),last=todayLogs.length?todayLogs[todayLogs.length-1].selesai:'07:30';
  lDraft=l?JSON.parse(JSON.stringify(l)):Object.assign({id:uid(),tgl:ui.date,mulai:last,selesai:fromMin(Math.min(1439,toMin(last)+60)),uraian:'',workId:'',output:'',satuan:'',bukti:'',fileId:'',fileIds:[]},preset||{});
  lDraft.fileIds=logFileIds(lDraft).slice();
  var aktif=db.works.filter(function(w){return w.status!=='selesai'||w.id===lDraft.workId});
  openDlg('<div class="dh"><h2 id="dlgTitle">'+(l?'Ubah kegiatan':'Catat kegiatan')+'</h2><button class="iconbtn" type="button" data-act="closeDlg" aria-label="Tutup">'+ic('x')+'</button></div>'
   +'<form id="lform" class="db" autocomplete="off"><div class="fgrid">'
   +'<div class="field"><label for="l-tgl">Tanggal</label><input type="date" id="l-tgl" required value="'+lDraft.tgl+'"></div><div></div>'
   +'<div class="field"><label for="l-m">Mulai</label><input type="time" id="l-m" required value="'+lDraft.mulai+'"></div>'
   +'<div class="field"><label for="l-s">Selesai</label><input type="time" id="l-s" required value="'+lDraft.selesai+'"></div>'
   +'<div class="field full"><label for="l-u">Uraian kegiatan</label><textarea id="l-u" required placeholder="Tulis kegiatan sebagai kalimat kerja, misalnya: Menyusun konsep surat balasan evaluasi RB">'+esc(lDraft.uraian)+'</textarea></div>'
   +'<div class="field full"><label for="l-w">Pekerjaan terkait</label><select id="l-w"><option value="">Tidak terkait pekerjaan tertentu</option>'+aktif.map(function(w){return '<option value="'+w.id+'"'+(w.id===lDraft.workId?' selected':'')+'>'+esc(w.judul)+'</option>'}).join('')+'</select></div>'
   +'<div class="field full"><label for="l-rhk">RHK</label><select id="l-rhk">'+rhkOpts(lDraft.rhkId,'')+'</select></div>'
   +'<div class="field"><label for="l-o">Output (jumlah)</label><input type="text" id="l-o" inputmode="decimal" value="'+esc(lDraft.output)+'" placeholder="1"></div>'
   +'<div class="field"><label for="l-sat">Satuan</label><input type="text" id="l-sat" list="satuan" value="'+esc(lDraft.satuan)+'" placeholder="dokumen"><datalist id="satuan"><option value="dokumen"><option value="surat"><option value="kegiatan"><option value="laporan"><option value="berkas"><option value="bahan"><option value="orang"></datalist></div>'
   +'<div class="field full"><label for="l-bf">Berkas bukti dukung <small class="muted">(maksimal '+MAX_BUKTI+')</small></label><div class="bfc" id="l-chips"></div><select id="l-bf"></select></div>'
   +'<div class="field full"><label for="l-file">Atau unggah file bukti baru</label><input type="file" id="l-file" multiple><small class="muted" id="l-fhint"></small><small class="muted">'+(driveCfg()?'Diunggah ke Google Drive, tautannya otomatis masuk ke laporan.':'Tersimpan di perangkat ini. Hubungkan Google Drive di Profil agar laporan berisi tautan.')+'</small></div>'
   +'<div class="field full"><label for="l-b">Keterangan bukti (opsional)</label><input type="text" id="l-b" value="'+esc(lDraft.bukti)+'" placeholder="Nomor surat, tautan foto, atau catatan"></div></div>'
   +'<div class="err" id="l-err"></div></form>'
   +'<div class="df">'+(l?'<button class="btn danger" type="button" data-act="delLog">'+ic('trash')+'Hapus</button>':'')+'<span class="sp"></span><button class="btn" type="button" data-act="closeDlg">Batal</button>'
   +(l?'':'<button class="btn" type="button" data-act="saveLogMore">Simpan dan tambah lagi</button>')+'<button class="btn primary" type="button" data-act="saveLog">Simpan</button></div>');
  paintBukti();paintRhkAuto();
}
function paintRhkAuto(){
  var sel=$('#l-rhk');if(!sel)return;
  var w=workById($('#l-w')&&$('#l-w').value),r=w&&rhkById(w.rhkId),o=sel.options[0];
  o.textContent=r?'Otomatis dari pekerjaan: '+rhkLabel(r):(w&&(db.rhk||[]).length?'Pekerjaan ini belum punya RHK. Pilih manual:':((db.rhk||[]).length?'Pilih RHK (opsional)':'Belum ada RHK (tambah lewat Kelola RHK)'));
}
function paintBukti(){
  var ids=lDraft.fileIds||[],room=MAX_BUKTI-ids.length,box=$('#l-chips'),sel=$('#l-bf'),inp=$('#l-file'),hint=$('#l-fhint');
  if(!box||!sel)return;
  box.innerHTML=ids.map(function(id){var f=fileById(id);return f?'<span class="chip bf"><span>'+esc(f.nama)+'</span><button type="button" data-rmbf="'+id+'" aria-label="Lepas '+esc(f.nama)+'">&times;</button></span>':''}).join('');
  sel.innerHTML='<option value="">'+(room>0?'Tambah dari berkas tersimpan…':'Sudah '+MAX_BUKTI+' bukti')+'</option>'+db.files.filter(function(f){return ids.indexOf(f.id)<0}).sort(function(a,b){return (b.tgl||'').localeCompare(a.tgl||'')}).map(function(f){return '<option value="'+f.id+'">'+esc(f.nama)+' ('+esc(f.jenis)+')</option>'}).join('');
  sel.disabled=room<=0;if(inp){inp.disabled=room<=0;}
  if(hint)hint.textContent=room>0?'Bisa pilih beberapa file sekaligus. Sisa slot: '+room+' dari '+MAX_BUKTI+'.':'Slot bukti penuh. Lepas salah satu untuk menambah.';
}
function readLog(){
  var g=function(i){return $('#'+i).value};
  var l=lDraft;l.tgl=g('l-tgl');l.mulai=g('l-m');l.selesai=g('l-s');l.uraian=g('l-u').trim();l.workId=g('l-w');l.output=g('l-o').trim();l.satuan=g('l-sat').trim();l.bukti=g('l-b').trim();l.rhkId=g('l-rhk');l.fileIds=(lDraft.fileIds||[]).slice(0,MAX_BUKTI);l.fileId=l.fileIds[0]||'';
  var er=$('#l-err');
  if(!l.tgl||!l.mulai||!l.selesai){er.textContent='Tanggal dan jam wajib diisi.';return null}
  if(toMin(l.selesai)<=toMin(l.mulai)){er.textContent='Jam selesai harus setelah jam mulai.';return null}
  if(!l.uraian){er.textContent='Uraian kegiatan belum diisi.';$('#l-u').focus();return null}
  return l;
}
function persistLog(l){
  var ex=db.logs.filter(function(x){return x.id===l.id})[0];
  if(ex)db.logs[db.logs.indexOf(ex)]=l;else db.logs.push(l);
  save();
  setTimeout(cekTarget,400);
}
function logWithUpload(cb){
  var l=readLog();if(!l)return;
  var inp=$('#l-file'),fls=inp&&inp.files?Array.prototype.slice.call(inp.files):[];
  if(!fls.length){persistLog(l);cb(l,null);return}
  var room=MAX_BUKTI-l.fileIds.length;
  if(fls.length>room){$('#l-err').textContent='Maksimal '+MAX_BUKTI+' bukti per kegiatan. Sisa slot: '+Math.max(room,0)+', kamu memilih '+fls.length+' file.';return}
  for(var i=0;i<fls.length;i++)if(fls[i].size>MAX_UPLOAD){$('#l-err').textContent='File "'+fls[i].name+'" terlalu besar (maks. 5 MB).';return}
  busyDlg(true,driveCfg()?'Mengunggah ke Google Drive…':'Menyimpan file…');
  var made=[],res=[];
  fls.reduce(function(p,fl,i){return p.then(function(){
    var f={id:uid(),workId:l.workId,nama:fl.name.replace(/\.[^.]+$/,''),jenis:'Dokumen final',nomor:'',tgl:l.tgl,lokasi:'',ket:'Bukti kegiatan '+fmtDate(l.tgl)};
    return storeFile(f,fl).then(function(r){res.push(r);if(r.where!=='toobig')made.push(f)})
  })},Promise.resolve()).then(function(){
    busyDlg(false);
    made.forEach(function(f){db.files.push(f);l.fileIds.push(f.id)});
    l.fileId=l.fileIds[0]||'';persistLog(l);
    var bad=res.filter(function(r){return r.where==='pending'||r.where==='fail'})[0];
    cb(l,bad||res[res.length-1]);
  });
}

