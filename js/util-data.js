'use strict';
/* ================= util ================= */
var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var uid=function(){return Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4)};
var pad=function(n){return String(n).padStart(2,'0')};
var iso=function(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
var fromIso=function(s){var p=s.split('-').map(Number);return new Date(p[0],p[1]-1,p[2])};
var addDays=function(s,n){var d=fromIso(s);d.setDate(d.getDate()+n);return iso(d)};
var today=function(){return iso(new Date())};
var DAYS=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
var MONTHS=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
var fmtLong=function(s){var d=fromIso(s);return DAYS[d.getDay()]+', '+d.getDate()+' '+MONTHS[d.getMonth()]+' '+d.getFullYear()};
var fmtDate=function(s){if(!s)return '';var d=fromIso(s);return d.getDate()+' '+MONTHS[d.getMonth()]+' '+d.getFullYear()};
var fmtShort=function(s){if(!s)return '';var d=fromIso(s);return d.getDate()+' '+MONTHS[d.getMonth()].slice(0,3)};
var toMin=function(t){var p=t.split(':').map(Number);return p[0]*60+p[1]};
var fromMin=function(m){m=Math.max(0,Math.min(1439,m));return pad(Math.floor(m/60))+':'+pad(m%60)};
var dur=function(l){return Math.max(0,toMin(l.selesai)-toMin(l.mulai))};
var fmtDur=function(min){var h=Math.floor(min/60),m=min%60;return h?(m?h+' j '+m+' m':h+' j'):m+' m'};
var fmtHours=function(min){return (Math.round(min/6)/10).toString().replace('.',',')};
var diffDays=function(a,b){return Math.round((fromIso(a)-fromIso(b))/86400000)};
var isWeekend=function(s){var g=fromIso(s).getDay();return g===0||g===6};
var ic=function(n,cls){return '<svg class="ic'+(cls?' '+cls:'')+'" aria-hidden="true"><use href="#i-'+n+'"/></svg>'};

/* ================= data ================= */
var KAT={surat:{n:'Tindak lanjut surat',c:'var(--c-surat)'},dokumen:{n:'Penyusunan dokumen',c:'var(--c-dokumen)'},rapat:{n:'Rapat & koordinasi',c:'var(--c-rapat)'},
  monev:{n:'Monev & pelaporan',c:'var(--c-monev)'},dinas:{n:'Perjalanan dinas',c:'var(--c-dinas)'},lain:{n:'Lainnya',c:'var(--c-lain)'}};
var STATUS={baru:'Baru',proses:'Diproses',menunggu:'Menunggu pihak lain',selesai:'Selesai'};
var PRIO={biasa:'Biasa',penting:'Penting',mendesak:'Mendesak'};
var JENIS=['Surat masuk','Surat keluar','Bahan / referensi','Draft dokumen','Dokumen final','Dokumentasi','Lainnya'];
var KEY='jejak-kerja:v1';
var db=null, mem=null;

function load(){try{var r=localStorage.getItem(KEY);if(r){var d=JSON.parse(r);if(d&&d.v===1)return d}}catch(e){}return mem}
function save(){mem=db;try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){}}

function seed(){
  var t=today(), P=function(n){return addDays(t,n)};
  var w1=uid(),w2=uid(),w3=uid(),w4=uid(),w5=uid(),w6=uid();
  var d={v:1,
    profile:{nama:'Ryan',nip:'',jabatan:'',unit:'Bagian Organisasi Sekretariat Daerah Kabupaten Indragiri Hulu',atasan:'',nipAtasan:'',jabatanAtasan:'',kota:'Rengat',targetJam:7.5},
    prefs:{theme:''},
    works:[
      {id:w1,sample:1,judul:'Penyusunan SOP Administrasi Pemerintahan perangkat daerah',kat:'dokumen',asal:'Asisten Administrasi Umum',noSurat:'060/ORG/145/2026',tglSurat:P(-9),tenggat:P(6),status:'proses',prio:'penting',dibuat:P(-8),
        catatan:'Draft dari 12 perangkat daerah sudah masuk. Tinggal pembahasan dan finalisasi.',
        subtasks:[{id:uid(),t:'Kumpulkan draft dari perangkat daerah',d:1},{id:uid(),t:'Periksa kesesuaian format',d:1},{id:uid(),t:'Rapat pembahasan bersama',d:0},{id:uid(),t:'Finalisasi dan usulan penetapan',d:0}]},
      {id:w2,sample:1,judul:'Tindak lanjut surat evaluasi Reformasi Birokrasi',kat:'surat',asal:'Kementerian PAN-RB',noSurat:'B/1432/RB.01/2026',tglSurat:P(-3),tenggat:P(2),status:'baru',prio:'mendesak',dibuat:P(-2),
        catatan:'Perlu jawaban tertulis dan data dukung dari tiga bagian.',subtasks:[{id:uid(),t:'Disposisi ke tim',d:1},{id:uid(),t:'Susun konsep surat balasan',d:0},{id:uid(),t:'Minta paraf dan tanda tangan',d:0}]},
      {id:w3,sample:1,judul:'Sosialisasi SOP kepada perangkat daerah',kat:'rapat',asal:'Kepala Bagian Organisasi',noSurat:'',tglSurat:'',tenggat:P(10),status:'proses',prio:'biasa',dibuat:P(-5),
        catatan:'Jadwal tiga gelombang. Bahan paparan sedang dirapikan.',subtasks:[{id:uid(),t:'Susun bahan paparan',d:1},{id:uid(),t:'Kirim undangan',d:0},{id:uid(),t:'Daftar hadir dan notulen',d:0}]},
      {id:w4,sample:1,judul:'Laporan kinerja triwulan IV Bagian Organisasi',kat:'monev',asal:'Sekretaris Daerah',noSurat:'',tglSurat:'',tenggat:P(15),status:'menunggu',prio:'biasa',dibuat:P(-12),
        catatan:'Menunggu rekap capaian dari subbagian.',subtasks:[]},
      {id:w5,sample:1,judul:'Rapat koordinasi Transformasi Budaya Kerja',kat:'rapat',asal:'Sekretaris Daerah',noSurat:'005/ORG/118/2026',tglSurat:P(-14),tenggat:P(-1),status:'selesai',prio:'penting',dibuat:P(-13),selesaiTgl:P(-1),
        catatan:'Notulen sudah dibagikan.',subtasks:[]},
      {id:w6,sample:1,judul:'Konsultasi kebijakan ke Biro Organisasi Provinsi',kat:'dinas',asal:'Kepala Bagian Organisasi',noSurat:'090/ORG/203/2026',tglSurat:P(-1),tenggat:P(20),status:'baru',prio:'biasa',dibuat:P(-1),
        catatan:'',subtasks:[{id:uid(),t:'Siapkan daftar pertanyaan',d:0},{id:uid(),t:'Surat tugas dan SPPD',d:0}]}
    ],
    files:[
      {id:uid(),sample:1,workId:w2,nama:'Surat evaluasi RB dari Kementerian',jenis:'Surat masuk',nomor:'B/1432/RB.01/2026',tgl:P(-3),lokasi:'Drive > Organisasi > RB 2026 > Surat Masuk',ket:'Sudah didisposisi'},
      {id:uid(),sample:1,workId:w1,nama:'Draft SOP AP gabungan v3',jenis:'Draft dokumen',nomor:'',tgl:P(-1),lokasi:'Laptop > Dokumen > SOP > Draft_SOP_AP_v3.docx',ket:'Revisi setelah masukan Asisten'},
      {id:uid(),sample:1,workId:w1,nama:'Surat permintaan draft SOP ke perangkat daerah',jenis:'Surat keluar',nomor:'060/ORG/145/2026',tgl:P(-9),lokasi:'Drive > Organisasi > SOP 2026 > Surat Keluar',ket:''},
      {id:uid(),sample:1,workId:w3,nama:'Bahan paparan sosialisasi SOP',jenis:'Bahan / referensi',nomor:'',tgl:P(-2),lokasi:'Drive > Organisasi > Sosialisasi > Paparan.pptx',ket:''},
      {id:uid(),sample:1,workId:w5,nama:'Notulen rapat Transformasi Budaya Kerja',jenis:'Dokumen final',nomor:'',tgl:P(-1),lokasi:'Drive > Organisasi > Budaya Kerja > Notulen',ket:''}
    ],
    logs:[]};
  var seq=[['07:30','08:00','Apel pagi dan arahan pimpinan','','',''],
           ['08:00','09:30','Menyusun dan merevisi draft SOP perangkat daerah',w1,'1','dokumen'],
           ['09:30','10:15','Memeriksa dan mendisposisi surat masuk','','6','surat'],
           ['10:15','11:45','Rapat internal pembahasan sosialisasi SOP',w3,'1','kegiatan'],
           ['13:00','14:30','Menyusun konsep surat balasan evaluasi RB',w2,'1','konsep surat'],
           ['14:30','16:00','Merapikan bahan paparan sosialisasi',w3,'1','bahan']];
  var n=0;
  for(var back=0;back<=5&&n<5;back++){
    var day=P(-back); if(isWeekend(day))continue; n++;
    var upTo=back===0?3:seq.length;
    for(var i=0;i<upTo;i++){var s=seq[i];
      d.logs.push({id:uid(),sample:1,tgl:day,mulai:s[0],selesai:s[1],uraian:s[2],workId:s[3],output:s[4],satuan:s[5],bukti:''})}
  }
  return d;
}

/* ================= state ================= */
var VIEWS=['beranda','pekerjaan','kinerja','berkas','laporan'];
var NAV={beranda:['home','Beranda'],pekerjaan:['work','Pekerjaan'],kinerja:['clock','Kinerja'],berkas:['folder','Berkas'],laporan:['report','Laporan']};
var ui={mi:0,intro:true,view:'beranda',wq:'',wf:'aktif',date:today(),fq:'',fj:'',fv:'folder',fopen:{},rep:{jenis:'kinerja',per:'bulan',from:today(),to:today(),rhkMode:'pisah',rhkSel:''}};
var workById=function(id){return db.works.filter(function(w){return w.id===id})[0]};
var logsOn=function(d){return db.logs.filter(function(l){return l.tgl===d})};
var byTime=function(a,b){return (a.tgl+a.mulai).localeCompare(b.tgl+b.mulai)};
var katOf=function(w){return w&&KAT[w.kat]?KAT[w.kat]:KAT.lain};

/* ================= toast & confetti ================= */
var toastT;
function toast(msg,hop){var h=$('#toastHost');h.innerHTML='<div class="toast'+(hop?' hopx':'')+'" role="status"><i class="av" aria-hidden="true"></i><span>'+esc(msg)+'</span></div>';clearTimeout(toastT);toastT=setTimeout(function(){h.innerHTML=''},2600)}
function confetti(big){
  mascotAct('cheer');
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var host=$('#confetti'),tmp=null;
  if(dlg&&dlg.open){tmp=document.createElement('div');tmp.className='confetti';dlg.appendChild(tmp);host=tmp;setTimeout(function(){tmp.remove()},3600)}
  if(!host)return;
  var cols=['#F0AE2B','#0A9A84','#2F6FDE','#D64F7A','#8A5CD6','#FF7A45','#FFFFFF'];
  var shots=big===false?[[.5,.6,26]]:[[.12,1.02,34],[.88,1.02,34],[.5,.58,40]];
  shots.forEach(function(sh,si){
    for(var i=0;i<sh[2];i++){
      var p=document.createElement('i'),c=cols[(i+si)%cols.length],w=6+Math.random()*7,h=w*(.9+Math.random()*1.4);
      p.style.cssText='background:'+c+';width:'+w+'px;height:'+h+'px;left:'+(sh[0]*100)+'%;top:'+(sh[1]*100)+'%;border-radius:'+(Math.random()<.35?'50%':'2px');
      host.appendChild(p);
      var dir=sh[0]<.3?1:sh[0]>.7?-1:0,sp=140+Math.random()*(si===2?300:360);
      var dx=(dir?dir*(.2+Math.random()*.9)*sp*1.1:(Math.random()-.5)*sp*2),dy=-(sp*(.8+Math.random()*.9));
      if(p.animate){var a=p.animate([{transform:'translate(0,0) rotate(0)',opacity:1},{transform:'translate('+dx+'px,'+dy+'px) rotate('+(Math.random()*540)+'deg)',opacity:1,offset:.5},{transform:'translate('+(dx*1.25)+'px,'+(dy+Math.max(560,window.innerHeight*.9))+'px) rotate('+(360+Math.random()*720)+'deg)',opacity:.9}],{duration:1500+Math.random()*900,delay:si*140+Math.random()*120,easing:'cubic-bezier(.2,.6,.4,1)',fill:'both'});
        a.onfinish=(function(el){return function(){el.remove()}})(p)}else p.remove();
    }
  });
}
function cekTarget(){
  var t=today(),mins=logsOn(t).reduce(function(a,l){return a+dur(l)},0),target=(db.profile.targetJam||7.5)*60;
  db.prefs=db.prefs||{};
  if(mins>=target&&db.prefs.rayaTgl!==t){db.prefs.rayaTgl=t;save();confetti(true);toast('Target jam hari ini terpenuhi. Mantap!')}
}

