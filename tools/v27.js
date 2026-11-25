/* Edition 27: The deuterocanon in the New Testament. A page of parallels between New Testament passages and the
   deuterocanonical books, each with the evidence computed from the Greek texts (site/bible/dcnt.js, built by
   tools/dc_allusions.py), and a marker on those verses in the Bible linking to the other passage. */
(function(){
"use strict";
var $ = function(s, r){ return (r || document).querySelector(s); };
var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
var A = document.getElementById("bible-dcnt");
var B = function(){ return window.HCCBible || {}; };
var D = null, waiters = [];
window.__DCNT = function(d){ D = d; waiters.forEach(function(f){ f(); }); waiters = []; };
function data(cb){
  if(D) return cb(); waiters.push(cb); if(waiters.length > 1) return;
  var s = document.createElement("script"); s.src = "bible/dcnt.js"; s.async = true; s.onerror = function(){ var w = waiters; waiters = []; w.forEach(function(f){ f(); }); }; document.head.appendChild(s);
}
var KIND = {strong: ["Strong verbal parallel", "A rare word, or a combination of words, found together only in these passages"],
  history: ["Historical reference", "The New Testament refers to something the deuterocanonical book records"],
  event: ["Reference to the events", "The New Testament alludes to events told in the deuterocanonical book"],
  partial: ["Shared language, also found elsewhere", "The same combination of words also occurs in other books"],
  weak: ["Weak parallel", "Common words; possibly a shared idiom rather than a borrowing"]};
var ORDER = ["strong", "history", "event", "partial", "weak"];
var NAMES = {WIS: "Wisdom", SIR: "Sirach", TOB: "Tobit", "1MA": "1 Maccabees", "2MA": "2 Maccabees", JDT: "Judith", BAR: "Baruch", DNG: "Daniel (Greek)", "1ES": "1 Esdras"};
function label(b, c, v, v2){
  if(b === "EZR" && c > 10) return "Nehemiah " + (c - 10) + ":" + v + " (2 Esdras " + c + ":" + v + ")";
  var l = B().label ? B().label(b, c, v, v2) : b + " " + c + ":" + v + (v2 && v2 !== v ? "–" + v2 : "");
  return NAMES[b] && l.indexOf(NAMES[b]) < 0 ? NAMES[b] + " " + c + ":" + v + (v2 && v2 !== v ? "–" + v2 : "") : l;
}
function refStr(r){ var p = r.split(" "), cv = p[1].split(":"); return label(p[0], +cv[0], +cv[1]); }
function go(x){ return '<button type="button" class="dc-go" data-go="'+esc(x[0]+"~"+x[1]+"~"+x[2])+'">'+esc(label(x[0], x[1], x[2], x[3]))+'</button>'; }

/* ---------- the page ---------- */
function render(){
  if(!A || !A.classList.contains("active")) return;
  var m = $(".dc-mount", A); if(!m) return;
  data(function(){
    if(!D){ m.innerHTML = '<p class="ft-err">The parallels could not be loaded.</p>'; return; }
    var html = '<div class="dc-legend">' + ORDER.map(function(k){ return '<p><span class="dc-k dc-'+k+'">'+esc(KIND[k][0])+'</span> '+esc(KIND[k][1])+'</p>'; }).join("") + '</div>';
    ORDER.forEach(function(k){
      var ps = D.pairs.filter(function(p){ return p.kind === k; }); if(!ps.length) return;
      html += '<h3 class="ed21-h">'+esc(KIND[k][0])+'</h3>';
      ps.forEach(function(p){
        var e = p.ev, other = e.found.filter(function(r){ var b = r.split(" ")[0]; return b !== p.nt[0] && b !== p.dc[0]; });
        html += '<div class="dc-pair dc-'+k+'" id="dc-'+esc(p.id)+'"><h4>'+esc(p.title)+'</h4>' +
          '<div class="dc-cols"><section><p class="dc-side">New Testament</p><p class="dc-ref">'+go(p.nt)+'</p><p class="dc-en" data-en="'+esc(p.nt.join("~"))+'"><span class="st-load">Loading…</span></p></section>' +
          '<section><p class="dc-side">Deuterocanon</p><p class="dc-ref">'+go(p.dc)+(p.dc2 ? ' and '+go(p.dc2) : "")+'</p><p class="dc-en" data-en="'+esc(p.dc.join("~"))+'"><span class="st-load">Loading…</span></p></section></div>' +
          '<div class="dc-ev"><p><b>Evidence.</b> '+esc(e.gloss)+'. '+
            (e.type === "rare" ? 'In the whole Greek Bible this word occurs only in ' + esc(e.found.map(refStr).join(", ")) + '.' :
             e.type === "combo" ? (other.length ? 'Together, these words also occur near ' + esc(other.map(refStr).join(", ")) + '.' : 'In the whole Greek Bible these words occur together only in these two passages.') :
             e.type === "history" ? 'The word occurs in ' + esc(e.found.map(refStr).join(", ")) + '.' :
             'In the Greek Bible this form occurs only in ' + esc(e.found.map(refStr).join(", ")) + '.') + '</p>' +
            (e.text ? '<p>'+esc(e.text)+'</p>' : "") + (e.note ? '<p>'+esc(e.note)+'</p>' : "") + '</div>' +
          '<details class="dc-gk"><summary>Greek of both passages</summary><div class="dc-cols"><section lang="grc">' + p.grk.nt.map(function(v){ return '<p><sup>'+v[0]+'</sup> '+esc(v[1])+'</p>'; }).join("") + '</section><section lang="grc">' + p.grk.dc.map(function(v){ return '<p><sup>'+v[0]+'</sup> '+esc(v[1])+'</p>'; }).join("") + '</section></div></details></div>';
      });
    });
    html += '<p class="ft-src dc-meta">'+esc(D.meta.method)+' '+esc(D.meta.sources)+' Built by tools/dc_allusions.py, which recomputes this evidence from the texts.</p>';
    m.innerHTML = html;
    $$("[data-en]", m).forEach(function(el){
      var r = el.dataset.en.split("~");
      if(!B().text){ el.textContent = ""; return; }
      B().text({b: r[0], c: +r[1], v: +r[2], v2: +r[3]}, function(x){ el.innerHTML = x ? esc(x.text) + ' <small>' + esc(x.ed) + '</small>' : '<span class="st-load">Not in the editions on this device.</span>'; });
    });
  });
}
if(A){
  A.addEventListener("click", function(e){ var g = e.target.closest("[data-go]"); if(!g) return; var p = g.dataset.go.split("~"); if(B().go) B().go(null, p[0], +p[1], +p[2]); });
  addEventListener("hashchange", function(){ setTimeout(render, 30); });
  setTimeout(render, 60);
}

/* ---------- markers in the Bible ---------- */
var view = document.getElementById("bibView"), last = "", timer = 0;
function marks(){
  if(!view || !B().state) return;
  var s = B().state(); if(!view.querySelector(".bv[data-v]")) return;
  var key = s.ed + "~" + s.b + "~" + s.c; if(key === last && view.querySelector(".dcm")) return; last = key;
  data(function(){
    if(!D) return;
    D.pairs.forEach(function(p){
      [[p.nt, p.dc], [p.dc, p.nt]].concat(p.dc2 ? [[p.dc2, p.nt]] : []).forEach(function(x){
        var here = x[0], there = x[1]; if(here[0] !== s.b || here[1] !== s.c) return;
        var el = view.querySelector('.bv[data-v="'+here[2]+'"]'); if(!el || el.querySelector('.dcm[data-p="'+p.id+'"]')) return;
        var b = document.createElement("button"); b.type = "button"; b.className = "dcm dc-" + p.kind; b.dataset.p = p.id;
        b.textContent = "↔ " + label(there[0], there[1], there[2], there[3]);
        b.title = KIND[p.kind][0] + ": " + p.title; b.setAttribute("aria-label", "Parallel: " + label(there[0], there[1], there[2], there[3]) + ". " + KIND[p.kind][0]);
        el.appendChild(b);
      });
    });
  });
}
if(view){
  new MutationObserver(function(){ clearTimeout(timer); timer = setTimeout(marks, 140); }).observe(view, {childList: true, subtree: true});
  view.addEventListener("click", function(e){ var b = e.target.closest(".dcm"); if(!b) return; e.stopPropagation(); e.preventDefault(); location.hash = "bible-dcnt"; setTimeout(function(){ var t = document.getElementById("dc-" + b.dataset.p); if(t){ t.scrollIntoView({block: "start"}); window.scrollBy(0, -80); } }, 600); }, true);
}
})();
