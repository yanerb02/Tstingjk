'use strict';
/* ================= IndexedDB untuk lampiran lokal ================= */
var idbP=null;
function idb(){
  if(idbP)return idbP;
  idbP=new Promise(function(res,rej){
    try{var r=indexedDB.open('jejak-kerja-berkas',1);
      r.onupgradeneeded=function(){r.result.createObjectStore('f')};
      r.onsuccess=function(){res(r.result)};r.onerror=function(){rej(r.error)}}catch(e){rej(e)}
  });return idbP;
}
function idbDo(mode,fn){return idb().then(function(d){return new Promise(function(res,rej){var t=d.transaction('f',mode),s=t.objectStore('f'),q=fn(s);t.oncomplete=function(){res(q&&q.result)};t.onerror=function(){rej(t.error)}})})}
var idbPut=function(id,blob){return idbDo('readwrite',function(s){return s.put(blob,id)})};
var idbGet=function(id){return idbDo('readonly',function(s){return s.get(id)})};
var idbDel=function(id){return idbDo('readwrite',function(s){return s.delete(id)}).catch(function(){})};

function download(blob,name){
  var u=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},4000);
}

/* ================= Google Drive (OAuth 2.0 + Drive API v3) ================= */
// MASBRO: Ganti nilai DEFAULT_CLIENT_ID ini dengan Client ID dari Google Cloud Console
var DEFAULT_CLIENT_ID = '1005323249725-c6kjp7t9vhsg4le8cl2c4c5l82cg15o2.apps.googleusercontent.com';
var DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file email profile';
var FOLDER_UTAMA = 'Jejak Kerja';
var TM = 'R.P.H - Indragiri Hulu';
var MAX_UPLOAD = 5*1024*1024; // upload multipart cocok sampai sekitar 5 MB

var rhkById=function(id){return (db.rhk||[]).filter(function(r){return r.id===id})[0]};
var rhkNo=function(r){return (db.rhk||[]).indexOf(r)+1};
function rhkOf(l){return rhkById(l.rhkId||((workById(l.workId)||{}).rhkId))}
function rhkLabel(r){return 'RHK '+rhkNo(r)+' · '+shortT(r.teks,64)}
function rhkOpts(sel,first){return '<option value="">'+first+'</option>'+(db.rhk||[]).map(function(r){return '<option value="'+r.id+'"'+(r.id===sel?' selected':'')+'>'+esc(rhkLabel(r))+'</option>'}).join('')}
var numOf=function(x){var n=parseFloat(String(x==null?'':x).replace(',','.'));return isNaN(n)?0:n};
var fmtNum=function(n){return (Math.round(n*100)/100).toString().replace('.',',')};
var fileById=function(id){return db.files.filter(function(f){return f.id===id})[0]};
var isUrl=function(x){return /^https?:\/\//i.test(x||'')};
var fileUrl=function(f){return f&&f.drive&&f.drive.url?f.drive.url:(f&&isUrl(f.lokasi)?f.lokasi:'')};

function getClientId(){
  var c=db.profile&&db.profile.drive&&db.profile.drive.clientId;
  return (c&&c.trim())||DEFAULT_CLIENT_ID;
}
function driveCfg(){
  var c=db.profile&&db.profile.drive;
  return c&&c.connected?c:null;
}
function folderIdFrom(s){
  s=(s||'').trim();if(!s)return '';
  var m=s.match(/folders\/([A-Za-z0-9_-]+)/)||s.match(/[?&]id=([A-Za-z0-9_-]+)/);
  if(m)return m[1];
  return /^[A-Za-z0-9_-]{15,}$/.test(s)?s:'';
}
function bersihNama_(s){
  var t=String(s||'').replace(/[\\\/:*?"<>|]+/g,' ').replace(/\s+/g,' ').trim().slice(0,90);
  return t||'berkas';
}
function errMsg(e){
  var m=(e&&e.message)||String(e);
  if(/^Failed to fetch$|^NetworkError|^Load failed$/i.test(m))
    return 'Gagal menghubungi Google Drive ('+m+'). Periksa koneksi internet Anda.';
  return m;
}
/* fetch ke Google dengan pesan galat yang jelas: langkah mana yang gagal + alasan dari Google */
function gfetch(step,url,opt){
  return fetch(url,opt).catch(function(e){
    throw new Error('['+step+'] tidak tersambung: '+((e&&e.message)||e)+(navigator.onLine===false?' (perangkat offline)':''));
  }).then(function(r){
    if(r.ok)return r;
    return r.text().then(function(t){
      var m='';try{var j=JSON.parse(t);m=(j.error&&(j.error.message||j.error.status))||''}catch(_){}
      throw new Error('['+step+'] ditolak Google ('+r.status+')'+(m?': '+String(m).slice(0,140):''));
    });
  });
}

function ensureGoogleToken(interactive){
  return new Promise(function(res,rej){
    var d=(db.profile&&db.profile.drive)||{};
    if(d.token&&d.exp&&Date.now()<d.exp-60000)return res(d.token);
    if(!window.google||!google.accounts||!google.accounts.oauth2){
      return rej(new Error('Layanan login Google belum siap. Periksa internet Anda lalu coba lagi.'));
    }
    var cid=getClientId();
    if(!cid||cid.indexOf('MASUKKAN_CLIENT_ID')===0){
      return rej(new Error('Google Client ID belum diisi. Buka Profil > Pengaturan Admin (Client ID).'));
    }
    var client=google.accounts.oauth2.initTokenClient({
      client_id:cid,
      scope:DRIVE_SCOPE,
      hint:d.email||'',
      callback:function(resp){
        if(resp.error)return rej(new Error('Login Google gagal atau dibatalkan ('+resp.error+')'));
        db.profile.drive=Object.assign({},db.profile.drive||{akses:'pribadi'},{
          connected:true,
          token:resp.access_token,
          exp:Date.now()+((resp.expires_in||3599)*1000)
        });
        fetch('https://www.googleapis.com/oauth2/v3/userinfo',{
          headers:{Authorization:'Bearer '+resp.access_token}
        }).then(function(r){return r.ok?r.json():{}}).then(function(u){
          if(u.email)db.profile.drive.email=u.email;
          if(u.name)db.profile.drive.userName=u.name;
          save();res(resp.access_token);
        }).catch(function(){save();res(resp.access_token)});
      },
      error_callback:function(err){
        rej(new Error('Sesi Google habis dan jendela login tidak bisa dibuka ('+(err&&err.type||'popup')+'). Buka Profil, tekan Hubungkan ulang, lalu coba lagi.'));
      }
    });
    client.requestAccessToken({prompt:interactive?'select_account':''});
  });
}

function gdriveSubFolder_(token,nama,parentId){
  var clean=bersihNama_(nama);
  var q="mimeType='application/vnd.google-apps.folder' and trashed=false and name='"+clean.replace(/\\/g,'\\\\').replace(/'/g,"\\'")+"'";
  if(parentId)q+=" and '"+parentId+"' in parents";
  var url='https://www.googleapis.com/drive/v3/files?q='+encodeURIComponent(q)+'&fields=files(id,name,webViewLink)&spaces=drive';
  return gfetch('cari folder',url,{headers:{Authorization:'Bearer '+token}})
    .then(function(r){return r.json()})
    .then(function(j){
      if(j.files&&j.files.length)return j.files[0];
      var meta={name:clean,mimeType:'application/vnd.google-apps.folder'};
      if(parentId)meta.parents=[parentId];
      return gfetch('buat folder','https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink',{
        method:'POST',
        headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
        body:JSON.stringify(meta)
      }).then(function(r2){return r2.json()});
    });
}

function gdriveRootFolder_(token,cfg){
  return gdriveSubFolder_(token,FOLDER_UTAMA,'');
}

function driveUpload(f,blob){
  var cfg=driveCfg();
  if(!cfg)return Promise.reject(new Error('Akun Google Drive belum dihubungkan.'));
  if(blob.size>MAX_UPLOAD)return Promise.reject(new Error('File lebih dari 5 MB. Kecilkan dulu atau unggah langsung lewat Drive.'));
  var w=workById(f.workId),sub=[(f.tgl||today()).slice(0,7)];
  if(w)sub.push(w.judul);
  var tokenAktif='';
  return ensureGoogleToken(false)
    .then(function(tk){
      tokenAktif=tk;
      return gdriveRootFolder_(tk,cfg);
    })
    .then(function(rootFolder){
      return sub.reduce(function(p,namaSub){
        return p.then(function(parent){return gdriveSubFolder_(tokenAktif,namaSub,parent.id)});
      },Promise.resolve(rootFolder));
    })
    .then(function(targetFolder){
      var boundary='-------JejakKerjaBoundary'+Date.now();
      var meta={name:bersihNama_(blob.name||f.nama),parents:[targetFolder.id]};
      var bodyBlob=new Blob([
        '--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+
        JSON.stringify(meta)+'\r\n--'+boundary+'\r\nContent-Type: '+(blob.type||'application/octet-stream')+'\r\n\r\n',
        blob,
        '\r\n--'+boundary+'--'
      ],{type:'multipart/related; boundary='+boundary});

      return gfetch('unggah file','https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',{
        method:'POST',
        headers:{Authorization:'Bearer '+tokenAktif,'Content-Type':'multipart/related; boundary='+boundary},
        body:bodyBlob
      });
    })
    .then(function(r){return r.json()})
    .then(function(fileRes){
      if(cfg.akses==='tautan'){
        return fetch('https://www.googleapis.com/drive/v3/files/'+fileRes.id+'/permissions',{
          method:'POST',
          headers:{Authorization:'Bearer '+tokenAktif,'Content-Type':'application/json'},
          body:JSON.stringify({role:'reader',type:'anyone'})
        }).then(function(){return {ok:true,id:fileRes.id,url:fileRes.webViewLink,nama:fileRes.name}})
          .catch(function(){return {ok:true,id:fileRes.id,url:fileRes.webViewLink,nama:fileRes.name}});
      }
      return {ok:true,id:fileRes.id,url:fileRes.webViewLink,nama:fileRes.name};
    });
}

function storeFile(f,blob){
  var cfg=driveCfg(),limit=MAX_UPLOAD;
  if(blob.size>limit)return Promise.resolve({where:'toobig'});
  var local=function(pending,err){
    return idbPut(f.id,blob).then(function(){
      f.lampiran={nama:blob.name||f.nama,size:blob.size,tipe:blob.type};
      if(pending)f.pendingDrive=1;else delete f.pendingDrive;
      delete f.drive;
      return {where:pending?'pending':'local',err:err};
    }).catch(function(){return {where:'fail',err:err}});
  };
  if(!cfg)return local(false);
  return driveUpload(f,blob).then(function(res){
    f.drive={id:res.id,url:res.url,nama:res.nama};delete f.lampiran;delete f.pendingDrive;idbDel(f.id);return {where:'drive'};
  }).catch(function(err){return local(true,err)});
}
function uploadPending(id,btn){
  var f=fileById(id);if(!f||!driveCfg())return;
  if(btn){btn.disabled=true;btn.textContent='Mengunggah…'}
  /* token diminta dulu, langsung dari klik tombol, supaya jendela login Google tidak diblokir peramban */
  ensureGoogleToken(false).then(function(){return idbGet(id)}).then(function(blob){
    if(!blob)throw new Error('File di perangkat tidak ditemukan');
    if(!blob.name)blob=new File([blob],f.lampiran&&f.lampiran.nama||f.nama,{type:blob.type});
    return driveUpload(f,blob);
  }).then(function(res){
    f.drive={id:res.id,url:res.url,nama:res.nama};delete f.pendingDrive;delete f.lampiran;idbDel(id);save();paintFileList();toast('Terunggah ke Google Drive');
  }).catch(function(e){toast(errMsg(e));if(btn){btn.disabled=false;btn.textContent='Unggah ke Drive'}});
}
function busyDlg(on,msg){
  $$('#dlg .df button').forEach(function(b){b.disabled=on});
  var e=$('#dlg .err');if(e){e.style.color=on?'var(--muted)':'';if(on)e.textContent=msg||''}
}
function storeMsg(r){
  if(r.where==='drive')return 'Tersimpan di Google Drive. Tautannya sudah tercatat.';
  if(r.where==='pending')return 'Belum bisa ke Drive ('+errMsg(r.err)+') File disimpan di perangkat dan bisa diunggah belakangan.';
  if(r.where==='fail')return 'Berkas dicatat, tetapi file gagal dilampirkan di peramban ini';
  return 'Berkas dicatat';
}
var cellTxt=function(c){return c&&c.items?c.items.map(function(i){return i.n}).join('\n'):String(c==null?'':c)};
var cellHtml=function(c,blank){return c&&c.items?c.items.map(function(i){return i.u?'<a href="'+esc(i.u)+'"'+(blank?' target="_blank" rel="noopener"':'')+'>'+esc(i.n)+'</a>':esc(i.n)}).join('<br>'):esc(c)};
var fileItem=function(f){return {n:f.nama,u:fileUrl(f)}};
var MAX_BUKTI=5;
function logFileIds(l){return (l.fileIds&&l.fileIds.length?l.fileIds:(l.fileId?[l.fileId]:[])).filter(function(id){return fileById(id)})}

