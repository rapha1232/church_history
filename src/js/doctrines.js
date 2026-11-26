
/* Edition 28: How doctrines developed. For a few disputed doctrines, the dated witnesses (Scripture, Fathers,
   councils and confessions) placed against one stated proposition, each with its exact words and a link to the
   text in the app. Data: site/bible/doctrines.js, built and checked by tools/doctrines.py. */
(function(){
"use strict";
var $ = function(s, r){ return (r || document).querySelector(s); };
var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
var A = document.getElementById("ref-doctrines"); if(!A) return;
var M = $(".dt-mount", A), B = function(){ return window.HCCBible || {}; };
var DATA = null, wait = [], cur = "";
window.__DOCTR = function(d){ DATA = d; wait.forEach(function(f){ f(); }); wait = []; };
function data(cb){ if(DATA) return cb(); wait.push(cb); if(wait.length > 1) return; var s = document.createElement("script"); s.src = "bible/doctrines.js"; s.async = true; s.onerror = function(){ var w = wait; wait = []; w.forEach(function(f){ f(); }); }; document.head.appendChild(s); }
var ST = {affirms: "Affirms", denies: "Denies", qualified: "Affirms in a limited sense", debated: "Read both ways"};
function hashId(){ var h = location.hash.slice(1); try{ h = decodeURIComponent(h); }catch(e){} return h.split("~"); }

function render(){
  if(!A.classList.contains("active")) return;
  data(function(){
    if(!DATA){ M.innerHTML = '<p class="ft-err">The timeline could not be loaded.</p>'; return; }
    var want = hashId()[1], d = DATA.filter(function(x){ return x.id === want; })[0] || DATA.filter(function(x){ return x.id === cur; })[0] || DATA[0];
    cur = d.id;
    var html = '<div class="st-view dt-tabs" role="radiogroup" aria-label="Doctrine">' + DATA.map(function(x){ return '<button type="button" role="radio" data-dt="'+esc(x.id)+'" aria-checked="'+(x.id === d.id)+'">'+esc(x.title)+'</button>'; }).join("") + '</div>' +
      '<div class="dt-stmt"><p class="dc-side">The statement each witness is placed against</p><p>'+esc(d.statement)+'</p></div>' +
      '<p class="dt-legend">' + Object.keys(ST).map(function(k){ return '<span class="dt-st dt-'+k+'">'+esc(ST[k])+'</span>'; }).join(" ") + '</p>' +
      '<ol class="dt-line">' + d.items.map(function(it, i){
        var src = it.type === "father" ? it.cite : "";
        var head = it.type === "bible" ? '<b class="dt-who" data-lab="'+esc(it.ref.join("~"))+'">'+esc(it.ref[0] + " " + it.ref[1] + ":" + it.ref[2] + (it.ref[3] !== it.ref[2] ? "–" + it.ref[3] : ""))+'</b>' : '<b class="dt-who">'+esc(it.who)+'</b>' + (src && src !== it.who ? ' <small>'+esc(src)+'</small>' : "");
        return '<li class="dt-it" data-i="'+i+'"><p class="dt-date">'+esc(it.date)+'</p><div class="dt-body"><p class="dt-h">'+head+' <span class="dt-st dt-'+it.stance+'">'+esc(ST[it.stance])+'</span></p>' +
          (it.type === "bible" ? '<p class="dt-q" data-bt="'+esc(it.ref.join("~"))+'"><span class="st-load">Loading…</span></p>' : '<blockquote class="dt-q">“'+esc(it.q)+'”</blockquote>') +
          (it.note ? '<p class="dt-note">'+esc(it.note)+'</p>' : "") +
          '<p class="dt-acts"><button type="button" class="btn-sm" data-dto="'+i+'">Read in context</button><button type="button" class="btn-sm" data-dts="'+i+'">Add to study</button></p></div></li>';
      }).join("") + '</ol>' +
      '<p class="ft-src">Every quotation is checked word for word against the text in this app when the timeline is built (tools/doctrines.py). “Read both ways” marks witnesses whose meaning is disputed; they are not counted for either side.</p>';
    M.innerHTML = html;
    $$("[data-lab]", M).forEach(function(el){ var r = el.dataset.lab.split("~"); if(B().label) el.textContent = B().label(r[0], +r[1], +r[2], +r[3]); });
    $$("[data-bt]", M).forEach(function(el){ var r = el.dataset.bt.split("~"); if(!B().text) return; B().text({b: r[0], c: +r[1], v: +r[2], v2: +r[3]}, function(x){ el.innerHTML = x ? esc(x.text) + ' <small>' + esc(x.ed) + '</small>' : ""; }); });
  });
}
function item(i){ var d = DATA.filter(function(x){ return x.id === cur; })[0]; return d ? d.items[+i] : null; }
function openDoc(id){ var d = document.querySelector('details.doctext[data-doc-id="'+id+'"]'); if(!d) return; var art = d.closest("article"); if(art) location.hash = art.id; setTimeout(function(){ d.open = true; d.scrollIntoView({block: "start"}); }, 400); }
A.addEventListener("click", function(e){
  var t = e.target.closest("[data-dt]"); if(t){ cur = t.dataset.dt; history.replaceState(null, "", "#ref-doctrines~" + cur); render(); return; }
  var o = e.target.closest("[data-dto]"); if(o){ var it = item(o.dataset.dto); if(!it) return;
    if(it.type === "bible"){ if(B().go) B().go(null, it.ref[0], it.ref[1], it.ref[2]); }
    else if(it.type === "father") location.hash = "ref-fathers~" + it.work + "~" + it.n;
    else openDoc(it.doc);
    return; }
  var s = e.target.closest("[data-dts]"); if(s){ var x = item(s.dataset.dts); if(!x || !window.HCCStudies) return;
    if(x.type === "bible") HCCStudies.open({type: "verse", b: x.ref[0], c: x.ref[1], v: x.ref[2], v2: x.ref[3]});
    else if(x.type === "father") HCCStudies.open({type: "father", author: x.who, work: x.cite, date: x.date, quote: x.q, ft: x.work + "~" + x.n});
    else HCCStudies.open({type: "doc", doc: x.doc, quote: x.q});
  }
});
addEventListener("hashchange", function(){ setTimeout(render, 30); });
setTimeout(render, 60);
})();
