(function(){
"use strict";
/* Edition 19: Bible editions the reader added from a file. Their list lives in localStorage (hcc.useds) and their text in
   IndexedDB; this runs before the Bible script so the editions appear in its manifest, and the loader asks HCCUserEd for the text. */
var U = [];
try{ U = JSON.parse(localStorage.getItem("hcc.useds") || "[]") || []; }catch(e){ U = []; }
var M = window.__BIBMAN__;
if(M && M.eds) U.forEach(function(e){ if(e && e.id && e.books && !M.eds.some(function(x){ return x.id === e.id; })) M.eds.push(e); });
var mem = {};
function db(){ return new Promise(function(ok, no){
  var r = indexedDB.open("hcc-editions", 1);
  r.onupgradeneeded = function(){ r.result.createObjectStore("eds"); };
  r.onsuccess = function(){ ok(r.result); }; r.onerror = function(){ no(r.error); };
}); }
function rec(id){
  if(mem[id]) return mem[id];
  mem[id] = db().then(function(d){ return new Promise(function(ok){
    var q = d.transaction("eds").objectStore("eds").get(id); q.onsuccess = function(){ ok(q.result || null); }; q.onerror = function(){ ok(null); };
  }); }).catch(function(){ return null; });
  return mem[id];
}
window.HCCUserEd = {
  list: function(){ return U.slice(); },
  owns: function(src){ return U.some(function(e){ return e.id === src; }); },
  load: function(src, b, cb){ rec(src).then(function(r){ cb(r && r.books && r.books[b] || null); }); },
  save: function(meta, books){
    return db().then(function(d){ return new Promise(function(ok, no){
      var t = d.transaction("eds", "readwrite"); t.objectStore("eds").put({id: meta.id, books: books}, meta.id);
      t.oncomplete = ok; t.onerror = function(){ no(t.error); };
    }); }).then(function(){
      U = U.filter(function(e){ return e.id !== meta.id; }).concat([meta]);
      localStorage.setItem("hcc.useds", JSON.stringify(U));
    });
  },
  remove: function(id){
    return db().then(function(d){ return new Promise(function(ok){
      var t = d.transaction("eds", "readwrite"); t.objectStore("eds").delete(id); t.oncomplete = ok; t.onerror = ok;
    }); }).then(function(){
      U = U.filter(function(e){ return e.id !== id; }); localStorage.setItem("hcc.useds", JSON.stringify(U));
      try{ var st = JSON.parse(localStorage.getItem("hcc.bible") || "{}"); if(st.ed === id || st.cmp === id){ st.ed = st.ed === id ? "kjv" : st.ed; if(st.cmp === id) st.cmp = ""; localStorage.setItem("hcc.bible", JSON.stringify(st)); } }catch(e){}
    });
  }
};
})();
