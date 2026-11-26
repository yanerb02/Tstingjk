'use strict';
/* ================= kerangka & navigasi ================= */
var LOGO='<img src="'+ICON192+'" alt="" width="34" height="34">';
function buildChrome(){
  $('#brandSide').innerHTML=LOGO+'<span>Jejak Kerja</span>';
  $('#brandTop').innerHTML=LOGO+'<span>Jejak Kerja</span>';
  var h=VIEWS.map(function(v){return '<a class="tab" href="#'+v+'" data-view="'+v+'">'+ic(NAV[v][0])+'<span>'+NAV[v][1]+'</span></a>'}).join('');
  $('#navSide').innerHTML=h;$('#navBar').innerHTML=h;
}
function paintChrome(){
  $$('.tab').forEach(function(a){if(a.dataset.view===ui.view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  var p=db.profile;
  $('#whoSide').innerHTML='<b>'+esc(p.nama||'Pegawai')+'</b>'+esc(p.unit||'Lengkapi profil untuk kop laporan');
}

function render(keepScroll){
  var map={beranda:renderHome,pekerjaan:renderWorks,kinerja:renderLogs,berkas:renderFiles,laporan:renderReport};
  paintChrome();
  document.title='Jejak Kerja';
  map[ui.view]();
  if(!keepScroll)window.scrollTo(0,0);
}
function route(){
  var h=(location.hash||'').replace('#','');
  ui.view=VIEWS.indexOf(h)>-1?h:'beranda';ui.intro=true;
  render();
}

/* ================= BERANDA ================= */
var QUOTES=['Satu catatan kecil hari ini menghemat satu jam mencari besok.','Surat yang langsung diberi tempat tidak akan hilang.',
  'Selesaikan yang mendesak dulu, rapikan yang penting sesudahnya.','Laporan bulanan paling ringan kalau dicicil tiap hari.','Berkas rapi, kepala tenang.',
  'Tulis hasilnya selagi masih segar di ingatan.'];
function greet(){var h=new Date().getHours();return h<11?'Selamat pagi':h<15?'Selamat siang':h<18?'Selamat sore':'Selamat malam'}
function streak(){
  var t=today(),n=0,d=t;
  if(logsOn(t).length)n=1;
  d=addDays(t,-1);
  for(var i=0;i<400;i++){
    if(isWeekend(d)){d=addDays(d,-1);continue}
    if(logsOn(d).length){n++;d=addDays(d,-1)}else break;
  }
  return n;
}
function shortT(x,n){x=String(x||'');return x.length>n?x.slice(0,n-1).trim()+'…':x}
function mascotPool(){
  var t=today(),aktif=db.works.filter(function(w){return w.status!=='selesai'}),p=[];
  var late=aktif.filter(function(w){return w.tenggat&&diffDays(w.tenggat,t)<0});
  var d0=aktif.filter(function(w){return w.tenggat&&diffDays(w.tenggat,t)===0});
  var soon=aktif.filter(function(w){var n=w.tenggat?diffDays(w.tenggat,t):99;return n>0&&n<=2}).sort(function(a,b){return a.tenggat.localeCompare(b.tenggat)});
  var logs=logsOn(t),mins=logs.reduce(function(a,l){return a+dur(l)},0);
  if(late.length)p.push('Ada '+late.length+' pekerjaan lewat tenggat. Mulai dari "'+shortT(late[0].judul,38)+'".');
  if(d0.length)p.push('Tenggat hari ini: '+shortT(d0[0].judul,44)+'.');
  if(soon.length)p.push(shortT(soon[0].judul,40)+' tenggatnya '+diffDays(soon[0].tenggat,t)+' hari lagi.');
  if(!logs.length&&new Date().getHours()>=9)p.push('Belum ada catatan kinerja hari ini. Catat satu kegiatan dulu, yuk.');
  if(mins>=(db.profile.targetJam||7.5)*60)p.push('Target jam hari ini terpenuhi. Rapi!');
  if(energyNow()<.4)p.unshift('Energi menipis. Ketuk kartu ini, lalu pilih kopi, kue, atau nasi Padang.');
  var q=Math.floor(new Date().getTime()/86400000);
  return p.concat(QUOTES.slice(q%QUOTES.length).concat(QUOTES.slice(0,q%QUOTES.length)),['Ketuk kartu ini kapan saja untuk ngopi atau makan, energi naik lagi.','Catat hasil kerja segera setelah selesai, jangan menunggu sore.','Jangan lupa isi output di catatan kinerja. Itu yang dibutuhkan laporan.']);
}
function say(txt){var b=$('#mbubble');if(!b)return;b.textContent=txt;b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')}
function renderHome(){
  document.documentElement.classList.remove('typing');
  var t=today(),logs=logsOn(t).sort(byTime),mins=logs.reduce(function(a,l){return a+dur(l)},0);
  var target=(db.profile.targetJam||7.5)*60,pct=Math.min(1,mins/target),C=2*Math.PI*48;
  var aktif=db.works.filter(function(w){return w.status!=='selesai'});
  var dekat=aktif.filter(function(w){return w.tenggat&&diffDays(w.tenggat,t)<=3});
  var bulan=t.slice(0,7);
  var selBulan=db.works.filter(function(w){return w.status==='selesai'&&(w.selesaiTgl||'').slice(0,7)===bulan}).length;
  var hasSample=db.works.some(function(w){return w.sample})||db.logs.some(function(l){return l.sample})||db.files.some(function(f){return f.sample});
  var line=mascotPool()[ui.mi%mascotPool().length],enter=ui.intro;ui.intro=false;
  var sn=db.profile.nama?', '+esc(db.profile.nama.split(' ')[0]):'';
  var h='';
  if(hasSample)h+='<div class="banner"><span>Yang tampil sekarang adalah data contoh, supaya kamu bisa mencoba semua fitur.</span><button class="btn sm" type="button" data-act="clearSample">Hapus data contoh</button></div>';
  h+='<section class="hero" aria-label="Ringkasan hari ini"><div class="secret-test"><button type="button" data-act="testAnim" data-anim="lelah" title="Tes animasi lelah">Lelah</button><button type="button" data-act="testAnim" data-anim="lapar" title="Tes animasi lapar">Lapar</button></div><div class="orb" aria-hidden="true"></div><div class="hero-text"><div class="eyebrow">'+esc(fmtLong(t))+'<div class="energy" id="energy" role="img"><span>Energi</span><span class="bar"><i style="width:0"></i></span><em>0%</em></div></div><h1>'+greet()+sn+'</h1><p class="bubble" id="mbubble" role="status">'+esc(line)+'</p></div>'
   +'<div class="ring"><svg viewBox="0 0 116 116" role="img" aria-label="Jam kinerja terisi hari ini"><circle cx="58" cy="58" r="48" fill="none" stroke="rgba(16,35,42,.1)" stroke-width="10"/>'
   +'<circle cx="58" cy="58" r="48" fill="none" stroke="var(--sun)" stroke-width="10" stroke-linecap="round" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+(C*(1-pct)).toFixed(1)+'" transform="rotate(-90 58 58)"/></svg>'
   +'<div><div class="num mono">'+fmtHours(mins)+' <span style="font-size:15px;font-weight:500">jam</span></div><div class="sub">dari target '+String(db.profile.targetJam||7.5).replace('.',',')+' jam hari ini</div></div></div>'
   +'<div class="stage"><div class="chips" aria-hidden="true"><span class="fl a">'+ic('calcheck')+'</span><span class="fl b">'+ic('target')+'</span><span class="fl c">'+ic('chart')+'</span></div>'
   +'<button class="mascot'+(maOn()?' anim':'')+(enter?' enter':'')+'" id="mascot" type="button"'+(maOn()?' style="aspect-ratio:'+maDim()+'"':'')+' data-act="mascot" aria-label="Maskot Jejak Kerja. Ketuk untuk menyapa"><img class="cur" src="'+maSrc()+'" data-s="'+(maOn()?MA.state:'')+'" alt="" draggable="false"></button></div>'+fuelHtml()+'</section>';
  var sk=streak();
  h+='<div class="tiles">'
   +'<button class="tile" type="button" data-go="pekerjaan"><span class="v">'+aktif.length+'</span><span class="l">Pekerjaan aktif</span></button>'
   +'<button class="tile'+(dekat.length?' hot':'')+'" type="button" data-go="pekerjaan"><span class="v">'+dekat.length+'</span><span class="l">Tenggat 3 hari ke depan</span></button>'
   +'<button class="tile" type="button" data-go="pekerjaan"><span class="v">'+selBulan+'</span><span class="l">Selesai bulan ini</span></button>'
   +'<button class="tile" type="button" data-go="kinerja"><span class="v">'+(sk?ic('flame'):'')+' '+sk+'</span><span class="l">Hari kerja berturut-turut tercatat</span></button></div>';

  var last=logs.length?logs[logs.length-1].selesai:'07:30';
  var now=new Date(),nowM=now.getHours()*60+now.getMinutes(),defEnd=Math.min(1439,Math.max(toMin(last)+30,Math.ceil(nowM/5)*5));
  if(defEnd<=toMin(last))defEnd=Math.min(1439,toMin(last)+60);
  h+='<div class="two"><section class="section"><h2>Jalur hari ini <button class="btn sm" type="button" data-go="kinerja">Buka kinerja harian</button></h2>'
   +'<form class="card quick" id="quick" autocomplete="off"><div class="field"><label class="sr" for="q-u">Kegiatan</label><input type="text" id="q-u" enterkeyhint="send" placeholder="Apa yang baru saja kamu kerjakan?" required></div>'
   +'<div class="qrow"><div class="field"><label class="sr" for="q-m">Mulai</label><input type="time" id="q-m" value="'+last+'" required></div>'
   +'<div class="field"><label class="sr" for="q-s">Selesai</label><input type="time" id="q-s" value="'+fromMin(defEnd)+'" required></div>'
   +'<button class="btn primary" type="submit">'+ic('plus')+'Catat</button></div></form>'
   +'<div class="card" style="padding:18px">'+trailHtml(logs)+'</div></section>';
  var att=aktif.slice().sort(function(a,b){return (a.tenggat||'9999').localeCompare(b.tenggat||'9999')}).filter(function(w){return w.prio==='mendesak'||(w.tenggat&&diffDays(w.tenggat,t)<=7)}).slice(0,5);
  h+='<section class="section"><h2>Perlu perhatian</h2><div class="alist">'+(att.length?att.map(function(w){
      var k=katOf(w);return '<button class="aitem" type="button" data-open-work="'+w.id+'"><span class="n">'+esc(w.judul)+'</span>'+dueBadge(w)+'<span class="s"><span class="chip" style="--dot:'+k.c+'"><i></i><span>'+esc(k.n)+'</span></span> '+(w.asal?'· '+esc(w.asal):'')+'</span></button>'}).join('')
    :'<div class="empty"><b>Tidak ada tenggat dekat</b>Pakai waktunya untuk merapikan berkas atau mulai pekerjaan berikutnya.</div>')+'</div>'
   +'<div class="row" style="margin-top:12px"><button class="btn sm" type="button" data-act="newWork">'+ic('plus')+'Pekerjaan baru</button><button class="btn sm" type="button" data-act="newFile">'+ic('plus')+'Catat berkas</button></div></section></div>';
  $('#view').innerHTML=h;
  paintMood();
}
function trailHtml(logs){
  var bands=[['Pagi',0,720],['Siang',720,900],['Sore',900,1440]],h='<ul class="trail">';
  var any=false;
  bands.forEach(function(b){
    var items=logs.filter(function(l){var m=toMin(l.mulai);return m>=b[1]&&m<b[2]});
    if(!items.length)return;any=true;
    h+='<li class="band" aria-hidden="true">'+b[0]+'</li>';
    items.forEach(function(l){var w=workById(l.workId),k=katOf(w);
      h+='<li class="node" style="--dot:'+(w?k.c:'var(--c-lain)')+'"><span class="dot"></span><div class="body"><button class="edit" type="button" data-edit-log="'+l.id+'" aria-label="Ubah catatan: '+esc(l.uraian)+'">'
       +'<span class="t">'+l.mulai+' – '+l.selesai+' · '+fmtDur(dur(l))+'</span><span class="u">'+esc(l.uraian)+'</span>'
       +'<span class="meta">'+(w?'<span class="chip" style="--dot:'+k.c+'"><i></i><span>'+esc(w.judul)+'</span></span>':'')+(l.output?'<span>Output: '+esc(l.output)+' '+esc(l.satuan||'')+'</span>':'')+'</span></button></div></li>'});
  });
  if(!any)return '<div class="empty"><b>Belum ada catatan hari ini</b>Isi kolom di atas setiap selesai satu kegiatan. Di akhir bulan, laporan kinerja tinggal diunduh.</div>';
  return h+'</ul>';
}
function dueBadge(w){
  if(w.status==='selesai')return '<span class="pill selesai">Selesai</span>';
  if(!w.tenggat)return '<span class="pill ok">Tanpa tenggat</span>';
  var n=diffDays(w.tenggat,today());
  if(n<0)return '<span class="pill bad">Terlambat '+(-n)+' hari</span>';
  if(n===0)return '<span class="pill warn">Hari ini</span>';
  if(n<=3)return '<span class="pill warn">'+n+' hari lagi</span>';
  return '<span class="pill ok">'+fmtShort(w.tenggat)+'</span>';
}

