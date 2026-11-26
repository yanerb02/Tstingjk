'use strict';
/* ================= aksi ================= */
function applyTheme(){var t=db.prefs&&db.prefs.theme;if(t)document.documentElement.setAttribute('data-theme',t);else document.documentElement.removeAttribute('data-theme');if(typeof paintMood==='function'&&db)paintMood()}
function wipeSamples(){
  db.works=db.works.filter(function(x){return !x.sample});db.logs=db.logs.filter(function(x){return !x.sample});db.files=db.files.filter(function(x){return !x.sample});
}
var acts={
  mascot:function(){var p=mascotPool();ui.mi=(ui.mi+1)%p.length;say(p[ui.mi]);mascotAct('hop')},
  testAnim:function(b){var k=b.dataset.anim;if(!k)return;MA.cut=true;maSet(k,k==='lapar'?4300:4100);MA.cut=false},
  pickAvatar:function(b){
    var k=b.dataset.av;db.profile.avatar=k;save();setAvatar(k);maReset();if(maOn())MA.waved=false;
    $$('#avpick button').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});
    render(true);toast('Karakter maskot diganti',true);
  },
  closeDlg:function(){closeDlg()},
  backSettings:function(){openSettings()},
  driveLogin:function(){
    if($('#sform'))db.profile.drive=readDriveForm();
    var st=$('#drv-st');
    if(st){st.className='drv-st';st.textContent='Membuka jendela login Google…'}
    ensureGoogleToken(true).then(function(tk){
      return gdriveRootFolder_(tk,db.profile.drive);
    }).then(function(fld){
      save();
      if(dlg.open&&$('#sform'))openSettings();
      else render(true);
      toast('Berhasil terhubung ke Google Drive ('+fld.name+')');
    }).catch(function(e){
      if(st){st.className='drv-st bad';st.textContent=errMsg(e)}
      else toast(errMsg(e));
    });
  },
  driveLogout:function(){
    var d=db.profile&&db.profile.drive;
    if(d&&d.token&&window.google&&google.accounts&&google.accounts.oauth2){
      try{google.accounts.oauth2.revoke(d.token,function(){})}catch(e){}
    }
    db.profile.drive={connected:false,akses:(d&&d.akses)||'pribadi',clientId:(d&&d.clientId)||''};
    save();
    if(dlg.open&&$('#sform'))openSettings();
    render(true);
    toast('Koneksi Google Drive diputuskan');
  },
  driveTest:function(){
    db.profile.drive=readDriveForm();
    var st=$('#drv-st');st.className='drv-st';st.textContent='Memeriksa folder di Google Drive…';
    ensureGoogleToken(false).then(function(tk){
      return gdriveRootFolder_(tk,db.profile.drive);
    }).then(function(fld){
      st.textContent='Terhubung! Folder aktif: '+fld.name;
      st.className='drv-st ok';
    }).catch(function(e){
      st.textContent=errMsg(e);
      st.className='drv-st bad';
    });
  },
  closeFileDlg:function(){closeDlg();if(fReturnWork){var id=fReturnWork;fReturnWork=null;openWork(id)}},
  theme:function(){var cur=document.documentElement.getAttribute('data-theme')||(matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');db.prefs.theme=cur==='dark'?'light':'dark';save();applyTheme()},
  settings:function(){openSettings()},
  clearSample:function(){wipeSamples();save();render(true);toast('Data contoh dihapus. Selamat mulai dari nol.')},
  newWork:function(){openWork(null)},
  rhk:function(){openRhk()},
  newRhk:function(){openRhkForm(null)},
  saveRhk:function(){
    var g=function(i){return $('#'+i).value.trim()},d=rDraft;
    d.teks=g('r-teks');d.jenis=$('#r-jenis').value;d.indikator=g('r-ind');d.target=g('r-target');d.satuan=g('r-sat');d.atasan=g('r-atasan');
    if(!d.teks){$('#r-err').textContent='Rumusan RHK belum diisi.';$('#r-teks').focus();return}
    var ex=rhkById(d.id);if(ex)db.rhk[db.rhk.indexOf(ex)]=d;else db.rhk.push(d);
    save();render(true);openRhk();toast('RHK disimpan');
  },
  delRhk:function(b){
    if(!b.dataset.sure){b.dataset.sure=1;b.innerHTML=ic('trash')+'Yakin hapus?';return}
    var id=rDraft.id;db.rhk=db.rhk.filter(function(x){return x.id!==id});
    db.works.forEach(function(w){if(w.rhkId===id)w.rhkId=''});db.logs.forEach(function(l){if(l.rhkId===id)l.rhkId=''});
    save();render(true);openRhk();toast('RHK dihapus. Kaitan di pekerjaan dan kegiatan dilepas.');
  },
  autoRhk:function(b){
    var rg=repRange(),cand=db.logs.filter(function(l){return l.tgl>=rg[0]&&l.tgl<=rg[1]&&!rhkOf(l)}),hit=cand.map(function(l){return [l,guessRhk(l)]}).filter(function(x){return x[1]});
    if(!hit.length){toast('Tidak ada kegiatan yang cocok otomatis. Kaitkan manual lewat form kegiatan.');return}
    if(!b.dataset.sure){b.dataset.sure=1;b.textContent='Yakin? '+hit.length+' dari '+cand.length+' kegiatan akan dikaitkan. Ketuk lagi';return}
    hit.forEach(function(x){x[0].rhkId=x[1].id});save();renderReport();toast(hit.length+' kegiatan dikaitkan ke RHK. Periksa hasilnya di pratinjau.');
  },
  copyEk:function(){
    var r=buildReport(),t=eKinerjaText(r);
    if(!t){toast('Belum ada kegiatan pada periode ini');return}
    var ok=function(){toast('Teks e-Kinerja tersalin')},no=function(){var ta=document.createElement('textarea');ta.value=t;ta.style.cssText='position:fixed;opacity:0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy')?ok():toast('Salin manual dari Unduh Word')}catch(e){toast('Salin manual dari Unduh Word')}ta.remove()};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(ok,no);else no();
  },
  reportToFile:function(){
    var r=buildReport();
    if(!r.rows.length){toast('Belum ada kegiatan pada periode ini');return}
    toast('Menyiapkan berkas laporan…');
    exportXlsx(function(file){
      var f={id:uid(),workId:'',nama:fileBase(r),jenis:'Dokumen final',nomor:'',tgl:today(),lokasi:'',ket:'Laporan bulanan per RHK, '+r.period};
      storeFile(f,file).then(function(x){
        if(x.where==='toobig'){toast('File terlalu besar (maks. 5 MB)');return}
        db.files.push(f);save();toast(storeMsg(x));
      });
    });
  },
  newFile:function(){fReturnWork=null;openFile(null)},
  newLog:function(){openLog(null)},
  addSub:function(){var i=$('#w-newsub');if(i.value.trim()){readWorkForm();paintSubs();i.focus()}},
  saveWork:function(){var r=commitWork();if(!r)return;closeDlg();render(true);toast('Pekerjaan disimpan');if(r.justDone)confetti()},
  delWork:function(b){
    if(!b.dataset.sure){b.dataset.sure=1;b.innerHTML=ic('trash')+'Yakin hapus?';return}
    var id=wDraft.id;db.files.filter(function(f){return f.workId===id}).forEach(function(f){f.workId=''});db.logs.forEach(function(l){if(l.workId===id)l.workId=''});
    db.works=db.works.filter(function(w){return w.id!==id});save();closeDlg();render(true);toast('Pekerjaan dihapus. Berkas dan catatannya tetap ada.');
  },
  fileForWork:function(){var r=commitWork();if(!r)return;fReturnWork=r.w.id;render(true);openFile(null,{workId:r.w.id})},
  saveLog:function(){logWithUpload(function(l,r){ui.date=l.tgl;closeDlg();render(true);toast(r?storeMsg(r):'Kegiatan dicatat')})},
  saveLogMore:function(){logWithUpload(function(l,r){ui.date=l.tgl;var end=l.selesai,d=l.tgl;render(true);openLog(null,{tgl:d,mulai:end,selesai:fromMin(toMin(end)+60)});toast(r?storeMsg(r):'Tersimpan. Lanjut catat kegiatan berikutnya.')})},
  delLog:function(){db.logs=db.logs.filter(function(l){return l.id!==lDraft.id});save();closeDlg();render(true);toast('Catatan dihapus')},
  saveFile:function(){
    var g=function(i){return $('#'+i).value},f=fDraft,er=$('#f-err');
    var inp=$('#f-file');fFile=inp&&inp.files&&inp.files[0]||null;
    f.nama=g('f-n').trim();f.jenis=g('f-j');f.tgl=g('f-t');f.nomor=g('f-no').trim();f.workId=g('f-w');f.lokasi=g('f-l').trim();f.ket=g('f-k').trim();
    if(!f.nama&&fFile)f.nama=fFile.name.replace(/\.[^.]+$/,'');
    if(!f.nama){er.textContent='Nama berkas belum diisi.';return}
    var fin=function(r){
      var ex=fileById(f.id);
      if(ex)db.files[db.files.indexOf(ex)]=f;else db.files.push(f);
      save();closeDlg();var back=fReturnWork;fReturnWork=null;render(true);toast(storeMsg(r));if(back)openWork(back);
    };
    if(!fFile){fin({where:'none'});return}
    busyDlg(true,driveCfg()?'Mengunggah ke Google Drive…':'Menyimpan file…');
    storeFile(f,fFile).then(function(r){
      busyDlg(false);
      if(r.where==='toobig'){er.textContent='File terlalu besar (maks. 5 MB). Simpan di Drive lalu catat tautannya.';return}
      fin(r);
    });
  },
  delFile:function(b){
    if(!b.dataset.sure){b.dataset.sure=1;b.innerHTML=ic('trash')+'Yakin hapus?';return}
    var id=fDraft.id;db.files=db.files.filter(function(x){return x.id!==id});idbDel(id);save();closeDlg();var back=fReturnWork;fReturnWork=null;render(true);toast('Berkas dihapus');if(back)openWork(back);
  },
  exportXlsx:exportXlsx,exportDoc:exportDoc,
  ttdDel:function(){TT.a.v='';paintTtd()},
  ttdDelP:function(){TT.p.v='';paintTtd()},
  saveSettings:function(){
    var g=function(i){return $('#'+i).value.trim()},p=db.profile;
    p.nama=g('s-nama');p.nip=g('s-nip');p.jabatan=g('s-jab');p.unit=g('s-unit');p.atasan=g('s-atasan');p.nipAtasan=g('s-nipa');p.jabatanAtasan=g('s-jaba');p.kota=g('s-kota');
    var t=parseFloat($('#s-target').value.replace(',','.'));p.targetJam=t>0&&t<=12?t:7.5;
    ['a','p'].forEach(function(who){var k=TTK[who],t=TT[who];
      if(t.v!==undefined){if(t.v){p[k.img]=t.v;p[k.w]=t.wh?t.wh[0]:3;p[k.h]=t.wh?t.wh[1]:1}else{delete p[k.img];delete p[k.w];delete p[k.h]}t.v=undefined}
      var el=$(who==='a'?'#s-sigmode':'#s-sigmodep');p[k.mode]=el?el.value:sigModeOf(p,who)});
    p.ttdOn=p.sigMode==='gambar';
    p.drive=readDriveForm();save();closeDlg();render(true);toast('Profil disimpan');
  },
  backup:function(){var cp=JSON.parse(JSON.stringify(db));if(cp.profile&&cp.profile.drive)delete cp.profile.drive.token;download(new Blob([JSON.stringify(cp,null,1)],{type:'application/json'}),'jejak-kerja-cadangan-'+today()+'.json');toast('Cadangan diunduh')},
  wipe:function(b){
    if(!b.dataset.sure){b.dataset.sure=1;b.textContent='Klik lagi untuk menghapus semuanya';return}
    db.files.forEach(function(f){if(f.lampiran)idbDel(f.id)});db.works=[];db.logs=[];db.files=[];save();closeDlg();render(true);toast('Semua data dihapus');
  }
};

function openAtt(id){
  var f=db.files.filter(function(x){return x.id===id})[0];if(!f)return;
  idbGet(id).then(function(blob){
    if(!blob){toast('File lampiran tidak ditemukan di peramban ini');return}
    var u=URL.createObjectURL(blob),w=null;try{w=window.open(u,'_blank')}catch(e){}
    if(!w)download(blob,f.lampiran?f.lampiran.nama:f.nama);
    setTimeout(function(){URL.revokeObjectURL(u)},60000);
  }).catch(function(){toast('File lampiran tidak dapat dibuka')});
}

function wire(){
  dlg=$('#dlg');
  document.addEventListener('click',function(e){
    var t=e.target,b;
    if((b=t.closest('[data-fv]'))){ui.fv=b.dataset.fv;renderFiles();return}
    if((b=t.closest('[data-fold]'))){var op=b.dataset.fold==='open';$$('#flist details').forEach(function(d){d.open=op;if(d.dataset.fk)ui.fopen[d.dataset.fk]=op});return}
    if((b=t.closest('[data-edit-rhk]'))){openRhkForm(b.dataset.editRhk);return}
    if((b=t.closest('[data-rmbf]'))){e.preventDefault();if(lDraft){lDraft.fileIds=(lDraft.fileIds||[]).filter(function(x){return x!==b.dataset.rmbf});paintBukti()}return}
    if((b=t.closest('[data-fuel]'))){e.preventDefault();pickFuel(b.dataset.fuel,b);return}
    if((b=t.closest('[data-act]'))){var a=acts[b.dataset.act];if(a){e.preventDefault();a(b,e);if(t.closest('.hero'))toggleFuel(true)}return}
    if(t.closest('.hero')&&!t.closest('#fuel')){toggleFuel();return}
    if((b=t.closest('[data-go]'))){location.hash='#'+b.dataset.go;return}
    if((b=t.closest('[data-open-work]'))){if(dlg.open)closeDlg();openWork(b.dataset.openWork);return}
    if((b=t.closest('[data-toggle-done]'))){
      var w=workById(b.dataset.toggleDone);if(!w)return;
      if(w.status==='selesai'){w.status='proses';delete w.selesaiTgl}else{w.status='selesai';w.selesaiTgl=today();confetti();toast('Satu pekerjaan selesai. Mantap.')}
      save();render(true);return}
    if((b=t.closest('[data-wf]'))){ui.wf=b.dataset.wf;renderWorks();return}
    if((b=t.closest('[data-edit-log]'))){openLog(b.dataset.editLog);return}
    if((b=t.closest('[data-date]'))){ui.date=b.dataset.date;renderLogs();return}
    if((b=t.closest('[data-shift]'))){ui.date=addDays(ui.date,+b.dataset.shift);renderLogs();return}
    if((b=t.closest('[data-tpl]'))){var tp=TPL[+b.dataset.tpl],pre={uraian:tp[0]};if(tp[1]){pre.mulai=tp[1];pre.selesai=tp[2]}openLog(null,pre);return}
    if((b=t.closest('[data-edit-file]'))){fReturnWork=b.dataset.fromWork?wDraft.id:null;if(b.dataset.fromWork){var rr=commitWork();if(!rr)return;fReturnWork=rr.w.id;render(true)}openFile(b.dataset.editFile);return}
    if((b=t.closest('[data-open-att]'))){openAtt(b.dataset.openAtt);return}
    if((b=t.closest('[data-copy]'))){var f=fileById(b.dataset.copy);
      if(f){var cp=fileUrl(f)||f.lokasi,ok=function(){toast('Tersalin')},no=function(){toast('Salin manual: '+cp)};
        try{navigator.clipboard.writeText(cp).then(ok,no)}catch(x){no()}}return}
    if((b=t.closest('[data-drive-up]'))){uploadPending(b.dataset.driveUp,b);return}
    if((b=t.closest('[data-rm]'))){ui.rep.rhkMode=b.dataset.rm;renderReport();return}
    if((b=t.closest('[data-rj]'))){ui.rep.jenis=b.dataset.rj;renderReport();return}
    if((b=t.closest('[data-sub-del]'))){readWorkForm();wDraft.subtasks.splice(+b.dataset.subDel,1);paintSubs();return}
    if(t===dlg){closeDlg()}
  });
  document.addEventListener('focusin',function(e){if(e.target.id==='q-u'){document.documentElement.classList.add('typing');maStartWriting();mirrorQ();keepHero()}});
  document.addEventListener('focusout',function(e){
    if(e.target.id!=='q-u')return;
    var empty=!e.target.value.trim();
    setTimeout(function(){
      if(maTyping())return;
      document.documentElement.classList.remove('typing');
      if(!MA.hold){
        if(empty){var pl=mascotPool();say(pl[ui.mi%pl.length])}
        if(MA.state==='mencatat'||MA.state==='mencatat_prep'){MA.cut=true;maSet('mencatat_selesai',1500);MA.cut=false}
        else maRest();
      }
    },150);
  });
  document.addEventListener('input',function(e){
    var t=e.target;
    if(t.id==='q-u'){maStartWriting();mirrorQ();keepHero()}
    else if(t.id==='wq'){ui.wq=t.value;paintWorkList()}
    else if(t.id==='fq'){ui.fq=t.value;paintFileList()}
    else if(t.dataset&&t.dataset.subText!=null){wDraft.subtasks[+t.dataset.subText].t=t.value}
  });
  document.addEventListener('toggle',function(e){var d=e.target;if(d&&d.dataset&&d.dataset.fk&&!ui.fq)ui.fopen[d.dataset.fk]=d.open},true);
  document.addEventListener('change',function(e){
    var t=e.target;
    if(t.id==='fj'){ui.fj=t.value;paintFileList()}
    else if(t.id==='l-w'){paintRhkAuto()}
    else if(t.id==='l-bf'){if(t.value&&lDraft&&(lDraft.fileIds||[]).length<MAX_BUKTI&&lDraft.fileIds.indexOf(t.value)<0){lDraft.fileIds.push(t.value);paintBukti()}}
    else if(t.id==='l-file'){var room=MAX_BUKTI-(lDraft.fileIds||[]).length,er=$('#l-err');if(t.files&&t.files.length>room){er.textContent='Kamu memilih '+t.files.length+' file, sisa slot hanya '+Math.max(room,0)+'. Pilih ulang.';t.value=''}else if(er)er.textContent=''}
    else if(t.id==='datepick'){if(t.value){ui.date=t.value;renderLogs()}}
    else if(t.id==='s-ttd'){loadTtd(t.files&&t.files[0],'a');t.value=''}
    else if(t.id==='s-ttdp'){loadTtd(t.files&&t.files[0],'p');t.value=''}
    else if(t.id==='rsel'){ui.rep.rhkSel=t.value;renderReport()}
    else if(t.id==='rper'){ui.rep.per=t.value;renderReport()}
    else if(t.id==='rfrom'){ui.rep.from=t.value||today();paintPaper()}
    else if(t.id==='rto'){ui.rep.to=t.value||today();paintPaper()}
    else if(t.dataset&&t.dataset.subDone!=null){wDraft.subtasks[+t.dataset.subDone].d=t.checked?1:0;if(t.checked){var sts=wDraft.subtasks;confetti(sts.every(function(x){return x.d})&&sts.length>1)}}
    else if(t.id==='restoreFile'&&t.files&&t.files[0]){
      var fr=new FileReader();fr.onload=function(){try{var d=JSON.parse(fr.result);if(!d||d.v!==1||!d.works||!d.logs)throw 0;var keep=db.profile&&db.profile.drive;db=d;db.profile=db.profile||{};if(keep)db.profile.drive=keep;db.prefs=db.prefs||{theme:''};db.files=db.files||[];db.rhk=db.rhk||[];save();applyTheme();setAvatar(db.profile.avatar);closeDlg();render(true);toast('Data dipulihkan dari cadangan')}catch(x){toast('Berkas cadangan tidak valid')}};fr.readAsText(t.files[0]);
    }
  });
  document.addEventListener('submit',function(e){
    e.preventDefault();
    if(e.target.id==='quick'){
      var u=$('#q-u').value.trim(),m=$('#q-m').value,s=$('#q-s').value;
      if(!u)return;if(toMin(s)<=toMin(m)){toast('Jam selesai harus setelah jam mulai');return}
      db.logs.push({id:uid(),tgl:today(),mulai:m,selesai:s,uraian:u,workId:'',output:'',satuan:'',bukti:''});save();mascotAct('cheer');render(true);toast('Tercatat di jalur hari ini');say('Tercatat. Terus semangat!');setTimeout(cekTarget,400);
    }
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Enter'&&e.target.id==='q-u'){e.preventDefault();var f=$('#quick');if(f){if(f.requestSubmit)f.requestSubmit();else f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}))}}
    else if(e.key==='Enter'&&e.target.id==='w-newsub'){e.preventDefault();acts.addSub()}
  });
  window.addEventListener('hashchange',route);
}

