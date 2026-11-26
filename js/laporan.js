'use strict';
/* ================= LAPORAN ================= */
function repRange(){
  var p=ui.rep.per,t=today(),d=fromIso(t);
  if(p==='hari')return [t,t];
  if(p==='minggu'){var o=(d.getDay()+6)%7;return [addDays(t,-o),addDays(t,6-o)]}
  if(p==='bulan')return [iso(new Date(d.getFullYear(),d.getMonth(),1)),iso(new Date(d.getFullYear(),d.getMonth()+1,0))];
  if(p==='lalu')return [iso(new Date(d.getFullYear(),d.getMonth()-1,1)),iso(new Date(d.getFullYear(),d.getMonth(),0))];
  var a=ui.rep.from,b=ui.rep.to;return a<=b?[a,b]:[b,a];
}
function repLabel(r){return r[0]===r[1]?fmtLong(r[0]):fmtDate(r[0])+' s.d. '+fmtDate(r[1])}
function buildReport(){
  var r=repRange(),p=db.profile,out={meta:[['Nama',p.nama||'-'],['NIP',p.nip||'-'],['Jabatan',p.jabatan||'-'],['Unit kerja',p.unit||'-']],range:r,period:repLabel(r)};
  if(ui.rep.jenis==='rhk'){
    var all=db.logs.filter(function(l){return l.tgl>=r[0]&&l.tgl<=r[1]}).sort(byTime),groups=[],n=0,tot=0;
    (db.rhk||[]).forEach(function(x){groups.push({rhk:x,logs:all.filter(function(l){var y=rhkOf(l);return y&&y.id===x.id})})});
    var un=all.filter(function(l){return !rhkOf(l)});groups.push({rhk:null,logs:un});
    groups=groups.filter(function(g){return g.logs.length||g.rhk});
    var sel=ui.rep.rhkSel;if(sel)groups=groups.filter(function(g){return sel==='none'?!g.rhk:(g.rhk&&g.rhk.id===sel)});
    out.sections=groups.map(function(g,gi){
      var nm=g.rhk?('RHK '+rhkNo(g.rhk)+(g.rhk.jenis==='tambahan'?' (tambahan)':'')+': '+g.rhk.teks):'Belum diklasifikasi ke RHK';
      var o=0,m=0,k=0,rows=[],sat=(g.rhk&&g.rhk.satuan)||'';
      g.logs.forEach(function(l){k++;o+=numOf(l.output);m+=dur(l);
        var items=[];logFileIds(l).forEach(function(id){items.push(fileItem(fileById(id)))});if(l.bukti)items.push({n:l.bukti,u:isUrl(l.bukti)?l.bukti:''});
        rows.push([k,fmtDate(l.tgl),l.uraian,l.output?(l.output+' '+(l.satuan||sat||'')).trim():'',fmtDur(dur(l)),items.length?{items:items}:''])});
      if(!rows.length)rows.push(['','','Belum ada kegiatan pada periode ini','','','']);
      else rows.push(['','','Jumlah ('+k+' kegiatan)',fmtNum(o)+(sat?' '+sat:''),fmtDur(m),'']);
      var sm='Total '+k+' kegiatan, '+fmtDur(m)+'.'+(g.rhk&&g.rhk.target?' Realisasi output '+fmtNum(o)+' '+sat+' dari target tahunan '+g.rhk.target+' '+sat+'.':'');
      return {name:nm,ind:g.rhk&&g.rhk.indikator?'Indikator: '+g.rhk.indikator:'',sheet:g.rhk?('RHK '+rhkNo(g.rhk)):'Belum diklasifikasi',head:['No','Tanggal','Uraian kegiatan','Output','Durasi','Bukti dukung (tautan)'],widths:[5,16,56,16,10,48],rows:rows,summary:sm}});
    out.groups=groups;out.title='Laporan Bulanan Kinerja per RHK';out.sheet='Per RHK';
    out.head=['No','RHK dan indikator','Tanggal','Uraian kegiatan','Output','Durasi','Bukti dukung (tautan)'];out.widths=[5,46,14,52,16,10,46];
    out.rows=[];var sum=[];
    groups.forEach(function(g){
      var name=g.rhk?('RHK '+rhkNo(g.rhk)+(g.rhk.jenis==='tambahan'?' (tambahan)':'')+': '+g.rhk.teks+(g.rhk.indikator?'\nIndikator: '+g.rhk.indikator:'')):'Belum diklasifikasi ke RHK';
      var o=0,m=0,first=true;
      if(!g.logs.length){out.rows.push(['',name,'','Belum ada kegiatan pada periode ini','','','']);return}
      g.logs.forEach(function(l){n++;o+=numOf(l.output);m+=dur(l);tot+=dur(l);
        var items=[];logFileIds(l).forEach(function(id){items.push(fileItem(fileById(id)))});if(l.bukti)items.push({n:l.bukti,u:isUrl(l.bukti)?l.bukti:''});
        out.rows.push([n,first?name:'',fmtDate(l.tgl),l.uraian,l.output?(l.output+' '+(l.satuan||(g.rhk&&g.rhk.satuan)||'')).trim():'',fmtDur(dur(l)),items.length?{items:items}:'']);first=false});
      var sat=(g.rhk&&g.rhk.satuan)||'';
      out.rows.push(['','','','Jumlah'+(g.rhk?' RHK '+rhkNo(g.rhk):' belum diklasifikasi')+' ('+g.logs.length+' kegiatan)',fmtNum(o)+(sat?' '+sat:'')+(g.rhk&&g.rhk.target?' dari target tahunan '+g.rhk.target:''),fmtDur(m),'']);
      sum.push((g.rhk?'RHK '+rhkNo(g.rhk):'Belum diklasifikasi')+': '+g.logs.length+' kegiatan, '+fmtDur(m));
    });
    out.summary='Total '+all.length+' kegiatan, '+fmtDur(tot)+'. '+(sum.join('; '))+(un.length?'. Perhatian: '+un.length+' kegiatan belum dikaitkan ke RHK.':'.')+((db.rhk||[]).length?'':' Belum ada RHK yang diisi.');
  }else if(ui.rep.jenis==='kinerja'){
    var logs=db.logs.filter(function(l){return l.tgl>=r[0]&&l.tgl<=r[1]}).sort(byTime),last='',n=0,tot=0,days={},nl=0;
    out.title='Laporan Kinerja Harian';out.sheet='Kinerja Harian';
    out.head=['No','Hari / Tanggal','Waktu','Uraian kegiatan','Output','Keterangan','RHK','Bukti dukung'];out.widths=[5,24,14,50,14,30,44,44];
    out.rows=logs.map(function(l){n++;tot+=dur(l);days[l.tgl]=1;var w=workById(l.workId),items=[],hasUrl=false;
      logFileIds(l).forEach(function(id){var fl=fileById(id);items.push(fileItem(fl));if(fileUrl(fl))hasUrl=true});if(hasUrl)nl++;
      if(l.bukti)items.push({n:l.bukti,u:isUrl(l.bukti)?l.bukti:''});
      var row=[n,l.tgl!==last?fmtLong(l.tgl):'',l.mulai+' - '+l.selesai,l.uraian,l.output?(l.output+' '+(l.satuan||'')).trim():'',w?w.judul:'',rhkOf(l)?'RHK '+rhkNo(rhkOf(l))+': '+rhkOf(l).teks:'-',items.length?{items:items}:''];last=l.tgl;return row});
    out.summary='Total '+logs.length+' kegiatan pada '+Object.keys(days).length+' hari, '+fmtDur(tot)+'. '+nl+' kegiatan memiliki tautan bukti dukung.';
  }else{
    out.title='Rekap Pekerjaan';out.sheet='Rekap Pekerjaan';
    out.head=['No','Pekerjaan','Jenis','Asal perintah / No. surat','Tenggat','Status','Langkah','Berkas (tautan)'];out.widths=[5,46,22,34,14,18,10,52];
    var ws=db.works.filter(function(w){return (w.dibuat||'0000')<=r[1]&&(w.status!=='selesai'||(w.selesaiTgl||r[0])>=r[0])}).sort(function(a,b){return (a.tenggat||'9999').localeCompare(b.tenggat||'9999')});
    var k=0,sel=0;
    out.rows=ws.map(function(w){k++;if(w.status==='selesai')sel++;var st=w.subtasks||[],fl=db.files.filter(function(f){return f.workId===w.id});
      return [k,w.judul,KAT[w.kat]?KAT[w.kat].n:'',[w.asal,w.noSurat].filter(Boolean).join(' / '),w.tenggat?fmtDate(w.tenggat):'-',STATUS[w.status],st.length?st.filter(function(x){return x.d}).length+'/'+st.length:'-',fl.length?{items:fl.map(fileItem)}:'']});
    out.summary='Total '+ws.length+' pekerjaan: '+sel+' selesai, '+(ws.length-sel)+' masih berjalan.';
  }
  return out;
}
function renderReport(){
  var R=ui.rep,per=[['hari','Hari ini'],['minggu','Minggu ini'],['bulan','Bulan ini'],['lalu','Bulan lalu'],['kustom','Pilih sendiri']];
  $('#view').innerHTML='<div class="page-head"><div><h1>Laporan</h1><p>Pilih jenis dan periode, periksa pratinjaunya, lalu unduh sebagai Excel atau Word.</p></div></div>'
   +'<div class="rlayout"><div class="card panel"><div class="field"><span class="lbl">Jenis laporan</span><div class="seg"><button type="button" data-rj="kinerja" aria-pressed="'+(R.jenis==='kinerja')+'">Kinerja harian</button><button type="button" data-rj="pekerjaan" aria-pressed="'+(R.jenis==='pekerjaan')+'">Rekap pekerjaan</button><button type="button" data-rj="rhk" aria-pressed="'+(R.jenis==='rhk')+'">Per RHK (e-Kinerja)</button></div></div>'
   +'<div class="field"><label for="rper">Periode</label><select id="rper">'+per.map(function(p){return '<option value="'+p[0]+'"'+(R.per===p[0]?' selected':'')+'>'+p[1]+'</option>'}).join('')+'</select></div>'
   +(R.jenis==='rhk'?'<div class="field"><span class="lbl">Tampilan RHK</span><div class="seg"><button type="button" data-rm="pisah" aria-pressed="'+(R.rhkMode==='pisah')+'">Terpisah per RHK</button><button type="button" data-rm="gabung" aria-pressed="'+(R.rhkMode==='gabung')+'">Gabungan</button></div></div><div class="field"><label for="rsel">Tampilkan</label><select id="rsel"><option value="">Semua RHK</option>'+(db.rhk||[]).map(function(x){return '<option value="'+x.id+'"'+(R.rhkSel===x.id?' selected':'')+'>'+esc(rhkLabel(x))+'</option>'}).join('')+'<option value="none"'+(R.rhkSel==='none'?' selected':'')+'>Belum diklasifikasi</option></select></div>':'')
   +(R.per==='kustom'?'<div class="fgrid"><div class="field"><label for="rfrom">Dari</label><input type="date" id="rfrom" value="'+R.from+'"></div><div class="field"><label for="rto">Sampai</label><input type="date" id="rto" value="'+R.to+'"></div></div>':'')
   +'<button class="btn primary" type="button" data-act="exportXlsx">'+ic('down')+'Unduh Excel (.xlsx)</button><button class="btn" type="button" data-act="exportDoc">'+ic('down')+'Unduh Word (.doc)</button>'
   +(R.jenis==='rhk'?'<button class="btn" type="button" data-act="copyEk">'+ic('copy')+'Salin teks untuk e-Kinerja</button><button class="btn" type="button" data-act="reportToFile">'+ic('folder')+'Simpan laporan sebagai berkas</button>':'')
   +((R.jenis==='rhk'&&(db.rhk||[]).length&&db.logs.some(function(l){var g=repRange();return l.tgl>=g[0]&&l.tgl<=g[1]&&!rhkOf(l)}))?'<button class="btn" type="button" data-act="autoRhk">'+ic('target')+'Kaitkan otomatis yang belum punya RHK</button>':'')
   +'<button class="btn sm" type="button" data-act="rhk">'+ic('report')+'Kelola RHK</button>'
   +'<p class="muted" style="margin:0;font-size:12.5px">Nama, NIP, jabatan, dan nama atasan diambil dari Profil. <button class="btn sm" type="button" data-act="settings" style="margin-left:2px">Ubah profil</button></p></div>'
   +'<div id="paper"></div></div>';
  paintPaper();
}
function paintPaper(){
  var R0=buildReport(),p=db.profile,el=$('#paper');if(!el)return;
  var parts=reportParts(R0);
  el.innerHTML=parts.map(function(r){
    var th=r.head.map(function(h){return '<th>'+esc(h)+'</th>'}).join('');
    var tr=r.rows.length?r.rows.map(function(row){return '<tr>'+row.map(function(c){return '<td>'+cellHtml(c,true)+'</td>'}).join('')+'</tr>'}).join(''):'<tr><td colspan="'+r.head.length+'" style="text-align:center;padding:18px;color:#555">Belum ada data pada periode ini.</td></tr>';
    var spH=(sigModeOf(p,'a')==='qr'||sigModeOf(p,'p')==='qr')?110:54;
    return '<div class="paper" style="margin-bottom:16px"><h2>'+esc(r.title)+'</h2><div class="per">Periode: '+esc(r.period)+'</div>'
     +(r.sub?'<div class="per" style="margin-top:6px"><b>'+esc(r.sub)+'</b>'+(r.subInd?'<br>'+esc(r.subInd):'')+'</div>':'')
     +'<dl>'+r.meta.map(function(m){return '<dt>'+m[0]+'</dt><dd>: '+esc(m[1])+'</dd>'}).join('')+'</dl>'
     +'<table><thead><tr>'+th+'</tr></thead><tbody>'+tr+'</tbody></table><p class="sum">'+esc(r.summary)+'</p>'
     +'<div class="sign"><div><span>Mengetahui,</span><span>'+esc(p.jabatanAtasan||'Atasan Langsung')+'</span><span class="sp" style="min-height:'+spH+'px">'+ttdImg(p,sigModeOf(p,'a')==='qr'?84:54,r,'a')+'</span><b>'+esc(p.atasan||'(................................)')+'</b><span>NIP. '+esc(p.nipAtasan||'................................')+'</span></div>'
     +'<div class="r"><span>'+esc(p.kota||'................')+', '+esc(fmtDate(today()))+'</span><span>Pegawai yang melaporkan,</span><span class="sp" style="min-height:'+spH+'px">'+ttdImg(p,sigModeOf(p,'p')==='qr'?84:54,r,'p')+'</span><b>'+esc(p.nama||'(................................)')+'</b><span>NIP. '+esc(p.nip||'................................')+'</span></div></div><div class="tmk">'+esc(TM)+'</div></div>';
  }).join('')||'<div class="paper"><p class="sum">Belum ada data.</p></div>';
}
function reportParts(r){
  if(r.sections&&ui.rep.rhkMode==='pisah'&&r.sections.length)return r.sections.map(function(c){return Object.assign({},r,{sub:c.name,subInd:c.ind,sheet:c.sheet,head:c.head,rows:c.rows,summary:c.summary,widths:c.widths})});
  return [r];
}
function fileBase(r){return (r.title.replace(/\s+/g,'-'))+'_'+r.range[0]+'_'+r.range[1]}
function partAoa(r,p){
  var aoa=[[r.title.toUpperCase()],['Periode: '+r.period]];
  if(r.sub){aoa.push([r.sub]);if(r.subInd)aoa.push([r.subInd])}
  aoa.push([]);
  r.meta.forEach(function(m){aoa.push([m[0],': '+m[1]])});aoa.push([]);
  var headRow=aoa.length,links=[];aoa.push(r.head);
  r.rows.forEach(function(row,ri){aoa.push(row.map(function(c,ci){
    if(c&&c.items){var first=c.items.filter(function(i){return i.u})[0];if(first)links.push([headRow+1+ri,ci,first.u]);return c.items.map(function(i){return i.u?i.n+' - '+i.u:i.n}).join('\n')}
    return c}))});
  aoa.push([]);aoa.push([r.summary]);aoa.push([]);
  var L=r.head.length-1;var pad=function(a,b){var x=['',a];while(x.length<L)x.push('');x.push(b);return x};
  aoa.push(pad('Mengetahui,',(p.kota||'')+', '+fmtDate(today())));
  aoa.push(pad(p.jabatanAtasan||'Atasan Langsung','Pegawai yang melaporkan,'));aoa.push([]);aoa.push([]);aoa.push([]);
  aoa.push(pad(p.atasan||'',p.nama||''));aoa.push(pad(p.nipAtasan?'NIP. '+p.nipAtasan:'',p.nip?'NIP. '+p.nip:''));aoa.push([]);aoa.push([TM]);
  return {aoa:aoa,links:links};
}
function exportXlsx(save){
  if(typeof save!=='function')save=null;
  var R0=buildReport(),parts=reportParts(R0),p=db.profile,r=R0;
  var fallback=function(){
    var h='<html><head><meta charset="utf-8"></head><body>'+parts.map(function(r){return '<table border="1"><tr><td colspan="'+r.head.length+'"><b>'+esc(r.title.toUpperCase())+'</b></td></tr><tr><td colspan="'+r.head.length+'">Periode: '+esc(r.period)+'</td></tr>'
      +(r.sub?'<tr><td colspan="'+r.head.length+'"><b>'+esc(r.sub)+'</b></td></tr>':'')
      +r.meta.map(function(m){return '<tr><td>'+esc(m[0])+'</td><td colspan="'+(r.head.length-1)+'">'+esc(m[1])+'</td></tr>'}).join('')
      +'<tr>'+r.head.map(function(x){return '<th>'+esc(x)+'</th>'}).join('')+'</tr>'
      +r.rows.map(function(row){return '<tr>'+row.map(function(c){return '<td>'+cellHtml(c)+'</td>'}).join('')+'</tr>'}).join('')
      +'<tr><td colspan="'+r.head.length+'">'+esc(r.summary)+'</td></tr><tr><td colspan="'+r.head.length+'"><i>'+esc(TM)+'</i></td></tr></table><br>'}).join('')+'</body></html>';
    if(save){save(new File(['﻿'+h],fileBase(R0)+'.xls',{type:'application/vnd.ms-excel'}));return}
    download(new Blob(['﻿'+h],{type:'application/vnd.ms-excel'}),fileBase(R0)+'.xls');toast('Excel diunduh (format .xls)');
  };
  var go=function(){
    try{
      var wb=XLSX.utils.book_new(),used={};
      parts.forEach(function(r,i){
        var x=partAoa(r,p),ws=XLSX.utils.aoa_to_sheet(x.aoa);ws['!cols']=r.widths.map(function(w){return {wch:w}});
        ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:r.head.length-1}},{s:{r:1,c:0},e:{r:1,c:r.head.length-1}}];
        x.links.forEach(function(L){var a=XLSX.utils.encode_cell({r:L[0],c:L[1]});if(ws[a])ws[a].l={Target:L[2]}});
        var nm=String(r.sheet||'Laporan').replace(/[\\\/\?\*\[\]:]/g,' ').slice(0,28),k=nm,n=2;while(used[k.toLowerCase()]){k=nm.slice(0,26)+' '+n++}used[k.toLowerCase()]=1;
        XLSX.utils.book_append_sheet(wb,ws,k);
      });
      if(save){var arr=XLSX.write(wb,{bookType:'xlsx',type:'array'});save(new File([arr],fileBase(R0)+'.xlsx',{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));return}
      XLSX.writeFile(wb,fileBase(R0)+'.xlsx');toast('Excel diunduh')}
    catch(e){fallback()}
  };
  if(window.XLSX)return go();
  var sc=document.createElement('script');sc.src='vendor/xlsx.full.min.js';sc.onload=go;
  sc.onerror=function(){var s2=document.createElement('script');s2.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';s2.onload=go;s2.onerror=fallback;document.head.appendChild(s2)};
  document.head.appendChild(sc);
}
function exportDoc(){
  var R0=buildReport(),parts=reportParts(R0),p=db.profile,sm=sigMode(p),smp=sigModeOf(p,'p'),ttdW=sm==='gambar'&&!!p.ttdAtasan,anyQr=sm==='qr'||smp==='qr';
  var wcell=function(r,who){var m=sigModeOf(p,who),pic=sigPic(p,who),x;
    if(m==='qr')x='<img src="'+qrPng(qrText(r,p,who))+'" width="84" height="84"><br><span style="font-size:7pt;color:#555">QR penanda, bukan TTE bersertifikat</span><br>';
    else if(m==='gambar'&&pic.src)x='<img src="'+pic.src+'" width="'+Math.round(60*pic.w/pic.h)+'" height="60">'+(anyQr?'<br><br><br>':'')+'<br>';
    else x='<br><br><br><br>'+(anyQr?'<br><br><br><br>':'');
    return x};
  var body=parts.map(function(r,i){
    var th=r.head.map(function(h){return '<th>'+esc(h)+'</th>'}).join('');
    var tr=r.rows.map(function(row){return '<tr>'+row.map(function(c){return '<td>'+cellHtml(c)+'</td>'}).join('')+'</tr>'}).join('')||'<tr><td colspan="'+r.head.length+'" align="center">Belum ada data pada periode ini.</td></tr>';
    return (i?'<br clear="all" style="page-break-before:always">':'')
     +'<h2>'+esc(r.title.toUpperCase())+'</h2><p class="c">Periode: '+esc(r.period)+'</p>'
     +(r.sub?'<p class="c"><b>'+esc(r.sub)+'</b>'+(r.subInd?'<br>'+esc(r.subInd):'')+'</p>':'')
     +'<table class="m">'+r.meta.map(function(m){return '<tr><td>'+m[0]+'</td><td>: '+esc(m[1])+'</td></tr>'}).join('')+'</table><p></p>'
     +'<table class="d"><thead><tr>'+th+'</tr></thead><tbody>'+tr+'</tbody></table><p>'+esc(r.summary)+'</p><p></p>'
     +'<table width="100%" style="border:0"><tr><td width="50%" valign="top">Mengetahui,<br>'+esc(p.jabatanAtasan||'Atasan Langsung')+'<br>'+wcell(r,'a')+'<b>'+esc(p.atasan||'(................................)')+'</b><br>NIP. '+esc(p.nipAtasan||'................................')+'</td>'
     +'<td width="50%" valign="top">'+esc(p.kota||'................')+', '+esc(fmtDate(today()))+'<br>Pegawai yang melaporkan,<br>'+wcell(r,'p')+'<b>'+esc(p.nama||'(................................)')+'</b><br>NIP. '+esc(p.nip||'................................')+'</td></tr></table>'
     +'<p style="text-align:right;font-size:9pt;color:#777"><i>'+esc(TM)+'</i></p>';
  }).join('');
  var html='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>'+esc(R0.title)+'</title>'
   +'<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->'
   +'<style>@page Section1{size:841.9pt 595.3pt;mso-page-orientation:landscape;margin:56pt 56pt 56pt 56pt}div.Section1{page:Section1}'
   +'body{font-family:"Times New Roman",serif;font-size:11pt}a{color:#0B57D0}h2{text-align:center;font-size:14pt;margin:0}p.c{text-align:center;margin:2pt 0 10pt}'
   +'table.d{border-collapse:collapse;width:100%}table.d td,table.d th{border:1px solid #000;padding:4pt;vertical-align:top;font-size:10pt}table.d th{background:#E7E6E6}table.m td{border:0;padding:1pt 8pt 1pt 0;font-size:11pt}</style></head><body><div class="Section1">'+body+'</div></body></html>';
  download(new Blob(['﻿'+html],{type:'application/msword'}),fileBase(R0)+'.doc');toast((sm!=='kosong'||smp!=='kosong')?'Word diunduh (dengan penanda tanda tangan)':'Word diunduh');
}

/* ================= PENGATURAN ================= */
function readDriveForm(){
  var g=function(i){var e=$('#'+i);return e?e.value.trim():''};
  var prev=(db.profile&&db.profile.drive)||{};
  return Object.assign({},prev,{
    akses:$('#s-dakses')?(g('s-dakses')==='tautan'?'tautan':'pribadi'):(prev.akses==='tautan'?'tautan':'pribadi'),
    clientId:g('s-dclient')||prev.clientId||''
  });
}
var TT={a:{v:undefined,wh:null},p:{v:undefined,wh:null}};
var TTK={a:{img:'ttdAtasan',w:'ttdW',h:'ttdH',mode:'sigMode',prev:'ttd-prev'},p:{img:'ttdPeg',w:'ttdPegW',h:'ttdPegH',mode:'sigModePeg',prev:'ttdp-prev'}};
function ttdNow(who){return TT[who].v===undefined?(db.profile[TTK[who].img]||''):TT[who].v}
function paintTtd(){['a','p'].forEach(function(who){var b=$('#'+TTK[who].prev);if(!b)return;var t=ttdNow(who);b.innerHTML=t?'<img alt="Spesimen tanda tangan" src="'+t+'">':'<span class="muted" style="font-size:12px;text-align:center">Belum ada spesimen</span>'})}
