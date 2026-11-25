/* Edition 23: Early Christian texts. A reader for complete public-domain texts of the early Fathers
   (site/bible/texts/, built by tools/fathers_texts.py), with chapter navigation, scripture links,
   the translators' notes, "Add to study" and "Copy citation". Route: #ref-fathers~<work>~<chapter>[~<section>]. */
(function(){
"use strict";
var $ = function(s, r){ return (r || document).querySelector(s); };
var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
function toast(m){ if(window.HCCToast) HCCToast(m); }
var A = document.getElementById("ref-fathers"); if(!A) return;
var AU = function(){ return window.HCCAuth || null; };

var MOUNT = $(".ft-mount", A);

/* ---------- data (loaded on demand) ---------- */
var CAT = null, WORK = {}, ORIG = {}, wait = {};
var LANG = {grc: "Greek", la: "Latin"};
function showOrig(){ try{ return localStorage.getItem("hcc.ft.orig") === "1"; }catch(e){ return false; } }
function setOrig(v){ try{ localStorage.setItem("hcc.ft.orig", v ? "1" : "0"); }catch(e){} }
window.__FTO = function(o){ ORIG[o.id] = o; (wait[o.id + ".orig"] || []).forEach(function(f){ f(o); }); delete wait[o.id + ".orig"]; };
function orig(id, cb){ if(ORIG[id]) return cb(ORIG[id]); script("bible/texts/" + id + ".orig.js", id + ".orig", cb); }
window.__FTI = function(c){ CAT = c; (wait.__i || []).forEach(function(f){ f(); }); delete wait.__i; };
window.__FT = function(w){ WORK[w.id] = w; (wait[w.id] || []).forEach(function(f){ f(w); }); delete wait[w.id]; };
function script(src, key, cb){
  (wait[key] = wait[key] || []).push(cb); if(wait[key].length > 1) return;
  var s = document.createElement("script"); s.src = src; s.async = true;
  s.onerror = function(){ var w = wait[key] || []; delete wait[key]; s.remove(); w.forEach(function(f){ f(null); }); };
  document.head.appendChild(s);
}
function catalog(cb){ if(CAT) return cb(); script("bible/texts/index.js", "__i", cb); }
function work(id, cb){ if(WORK[id]) return cb(WORK[id]); script("bible/texts/" + id + ".js", id, cb); }
function meta(id){ return (CAT || []).filter(function(w){ return w.id === id; })[0] || null; }

/* ---------- citations ---------- */
function chName(m, n){ return n === "0" ? (m.book ? "Preface" : "Greeting") : /^App/.test(n) ? n.replace("App.", "Appended document") : (m.book ? "Chapter " + n : "Chapter " + n); }
function cite(m, n, sec){
  if(n === "0") return m.cite + (m.book ? " " + m.book + " pref." : " greeting");
  if(/^App/.test(n)) return m.cite + ", " + n.replace("App.", "appendix");
  return m.cite + " " + (m.book ? m.book + "." + n + (sec ? "." + sec : "") : n);
}
function credit(m){ return "trans. " + m.tr + "; " + m.ed; }
function plain(h){ var d = document.createElement("div"); d.innerHTML = h; $$("sup, .ft-sec", d).forEach(function(s){ s.parentNode.removeChild(s); }); return d.textContent.replace(/\s+/g, " ").trim(); }

/* ---------- pages ---------- */
function hash(){ var h = location.hash.slice(1); try{ h = decodeURIComponent(h); }catch(e){} return h.split("~"); }
function route(){
  if(!A.classList.contains("active")) return;
  var p = hash();
  catalog(function(){
    if(!CAT){ MOUNT.innerHTML = '<p class="ft-err">The texts could not be loaded. If you are offline, open this page once with a connection, or use “Save everything for offline”.</p>'; return; }
    A.classList.remove("ft-par");
    if(p[1] && meta(p[1])) showWork(p[1], p[2], p[3]); else showCatalog();
  });
}
function showCatalog(){
  var by = [];
  CAT.forEach(function(w){ var g = by.filter(function(x){ return x.a === w.author; })[0]; if(!g){ g = {a: w.author, w: []}; by.push(g); } g.w.push(w); });
  MOUNT.innerHTML = '<p class="ft-how">Complete texts in public-domain translations: Lightfoot’s <i>Apostolic Fathers</i> (1891) and the <i>Ante-Nicene Fathers</i> (1885–). Each work names its translator and edition. Tap a scripture reference to open it in the Bible; select a passage and use <b>Add to study</b> to keep it with its citation.</p>' +
    by.map(function(g){
      return '<section class="ft-grp"><h3 class="ed21-h">'+esc(g.a)+'</h3><ul class="ed21-rows">' + g.w.map(function(w){
        var n = w.chapters.filter(function(c){ return c[0] !== "0" && !c[2]; }).length, min = Math.max(1, Math.round(w.words / 230));
        return '<li><a href="#ref-fathers~'+esc(w.id)+'"><b>'+esc(w.title)+'</b>'+(AU() && AU().work(w.id) ? AU().chip(AU().work(w.id)) : "")+'<span>'+esc(w.date)+' · '+n+' '+(w.id === "cyp-unity" ? "sections" : "chapters")+' · about '+min+' min · trans. '+esc(w.tr)+'</span></a></li>';
      }).join("") + '</ul></section>';
    }).join("");
}
function showWork(id, ch, sec){
  var m = meta(id);
  MOUNT.innerHTML = '<p class="st-load">Loading '+esc(m.title)+'…</p>';
  work(id, function(w){
    if(!w){ MOUNT.innerHTML = '<p class="ft-err">This text could not be loaded. If you are offline, open it once with a connection, or use “Save everything for offline”.</p>'; return; }
    var main = w.ch.filter(function(c){ return !c.app; }), app = w.ch.filter(function(c){ return c.app; });
    var html = '<a class="st-back" href="#ref-fathers">← All texts</a>' +
      '<header class="ft-head"><p class="eyebrow">'+esc(m.author)+'</p><h3 class="ft-title">'+esc(m.title)+'</h3>' +
      '<p class="ft-meta">'+esc(m.date)+'</p>' +
      '<p class="ft-src">Translated by '+esc(m.tr)+'. From '+esc(m.ed)+'. <a href="'+esc(m.src)+'" target="_blank" rel="noopener noreferrer">Source text at CCEL ↗</a></p>' +
      '<p class="ft-src">'+esc(m.brackets)+'</p>' +
      (m.orig ? '<p class="ft-otog"><button type="button" class="btn-sm" data-ft="orig" aria-pressed="'+showOrig()+'">'+(showOrig() ? "Hide the " : "Show the ")+esc(LANG[m.orig])+'</button><span class="ft-osrc"></span></p>' : "") + (AU() && AU().work(m.id) ? AU().box(AU().work(m.id), false) : "") + '</header>' +
      '<div class="ft-jump"><label for="ftJump">Go to</label><select id="ftJump">' + w.ch.map(function(c){ return '<option value="'+esc(c.n)+'">'+esc(chName(m, c.n) + (c.t && c.t !== chName(m, c.n) ? " · " + (c.t.length > 60 ? c.t.slice(0, 58) + "…" : c.t) : ""))+'</option>'; }).join("") + '</select></div>' +
      main.map(function(c){ return chapterHTML(m, c); }).join("") +
      (app.length ? '<h3 class="ft-apph">Appended documents</h3><p class="ft-src">Printed after the Apology in the edition used here. They are imperial letters, not Justin’s own words, and their authenticity is disputed.</p>' + app.map(function(c){ return chapterHTML(m, c); }).join("") : "") +
      '<p class="ft-end"><a href="#ref-fathers">← All texts</a></p>';
    MOUNT.innerHTML = html;
    if(m.orig && showOrig()) addOrig(m, function(){ if(ch) goTo(ch, sec); });
    if(ch) setTimeout(function(){ goTo(ch, sec); }, 30); else window.scrollTo(0, 0);
  });
}
function chapterHTML(m, c){
  return '<section class="ft-ch" id="ft-'+esc(c.n.replace(/\W/g, ""))+'" data-n="'+esc(c.n)+'">' +
    '<h4 class="ft-h"><span>'+esc(chName(m, c.n))+'</span>'+(c.t && c.t !== chName(m, c.n) ? ' <small>'+esc(c.t)+'</small>' : "")+'</h4>' +
    (AU() && AU().chapter(m.id, c.n) ? AU().box(AU().chapter(m.id, c.n), false) : "") +
    '<div class="ft-tr">' + c.p.map(function(p){ return '<p class="ft-p">'+p+'</p>'; }).join("") + '</div>' +
    (c.fn && c.fn.length ? '<details class="ft-notes"><summary>Notes ('+c.fn.length+')</summary><ol>' + c.fn.map(function(f, i){ return '<li id="ft-'+esc(c.n.replace(/\W/g, ""))+'-n'+(i + 1)+'">'+f+'</li>'; }).join("") + '</ol></details>' : "") +
    '<div class="ft-acts"><button type="button" class="btn-sm" data-ft="add">Add to study</button><button type="button" class="btn-sm" data-ft="cite">Copy citation</button><button type="button" class="btn-sm" data-ft="link">Copy link</button>'+(window.HCCCard ? '<button type="button" class="btn-sm" data-ft="card">Share card</button>' : "")+'</div></section>';
}
function goTo(n, sec){
  var el = document.getElementById("ft-" + String(n).replace(/\W/g, "")); if(!el) return;
  var t = el;
  if(sec){ var s = el.querySelector('.ft-sec[data-sec="'+sec+'"]'); if(s) t = s.closest("p") || s; }
  t.scrollIntoView({block: "start"}); window.scrollBy(0, -80);
  t.classList.add("ft-here"); setTimeout(function(){ t.classList.remove("ft-here"); }, 1600);
  var j = $("#ftJump", MOUNT); if(j) j.value = n;
}

/* ---------- original language beside the translation ---------- */
function addOrig(m, done){
  orig(m.id, function(o){
    if(!o){ toast("The " + LANG[m.orig] + " text could not be loaded"); return; }
    if(hash()[1] !== m.id) return;
    A.classList.add("ft-par");
    var src = $(".ft-osrc", MOUNT); if(src) src.textContent = LANG[o.lang] + ": " + o.ed + ". " + o.lic + ". " + o.note;
    $$(".ft-ch", MOUNT).forEach(function(el){
      var c = o.ch[el.dataset.n]; if(!c || $(".ft-o", el)) return;
      var tr = $(".ft-tr", el);
      tr.insertAdjacentHTML("afterend", '<div class="ft-o" lang="'+(o.lang === "grc" ? "grc" : "la")+'"><p class="ft-ol">'+esc(LANG[o.lang])+'</p>' +
        c.map(function(x){ return '<p>'+(x[0] && c.length > 1 ? '<sup>'+esc(x[0])+'</sup> ' : "")+esc(x[1])+'</p>'; }).join("") +
        (o.chnote && o.chnote[el.dataset.n] ? '<p class="ft-onote">'+esc(o.chnote[el.dataset.n])+'</p>' : "") + '</div>');
    });
    if(done) done();
  });
}
function hideOrig(){ A.classList.remove("ft-par"); $$(".ft-o", MOUNT).forEach(function(x){ x.parentNode.removeChild(x); }); var src = $(".ft-osrc", MOUNT); if(src) src.textContent = ""; }

/* ---------- actions ---------- */
function curWork(){ var p = hash(); return meta(p[1]); }
function selectionIn(chEl){
  var s = window.getSelection && window.getSelection(); if(!s || s.isCollapsed || !s.rangeCount) return "";
  var r = s.getRangeAt(0); if(!chEl.contains(r.commonAncestorContainer)) return "";
  var d = document.createElement("div"); d.appendChild(r.cloneContents()); $$("sup", d).forEach(function(x){ x.remove(); });
  return d.textContent.replace(/\s+/g, " ").trim();
}
function sectionOf(chEl){
  var s = window.getSelection && window.getSelection(); if(!s || !s.rangeCount) return "";
  var p = s.getRangeAt(0).startContainer; p = p.nodeType === 1 ? p : p.parentNode; p = p.closest && p.closest(".ft-p");
  var found = ""; $$(".ft-p", chEl).some(function(x){ var b = x.querySelector(".ft-sec"); if(b) found = b.dataset.sec; return x === p; });
  return found;
}
function copy(text, ok){ try{ navigator.clipboard.writeText(text).then(function(){ toast(ok); }, function(){ prompt("Copy:", text); }); }catch(e){ prompt("Copy:", text); } }
A.addEventListener("change", function(e){ if(e.target.id === "ftJump"){ var p = hash(); history.replaceState(null, "", "#ref-fathers~" + p[1] + "~" + e.target.value); goTo(e.target.value); } });
A.addEventListener("click", function(e){
  var r = e.target.closest("[data-sref]");
  if(r){ e.preventDefault(); var q = r.dataset.sref.split("~"); if(window.HCCBible && HCCBible.go) HCCBible.go(null, q[0], +q[1], +q[2]); return; }
  var f = e.target.closest("sup[data-fn]");
  if(f){ var chEl = f.closest(".ft-ch"), d = $(".ft-notes", chEl); if(d){ d.open = true; var li = document.getElementById(chEl.id + "-n" + f.dataset.fn); if(li){ li.scrollIntoView({block: "center"}); li.classList.add("ft-here"); setTimeout(function(){ li.classList.remove("ft-here"); }, 1600); } } return; }
  var b = e.target.closest("[data-ft]"); if(!b) return;
  if(b.dataset.ft === "orig"){ var mw = curWork(); if(!mw) return; var on = !showOrig(); setOrig(on); b.setAttribute("aria-pressed", String(on)); b.textContent = (on ? "Hide the " : "Show the ") + LANG[mw.orig]; if(on) addOrig(mw); else hideOrig(); return; }
  var chEl = b.closest(".ft-ch"), m = curWork(); if(!chEl || !m) return;
  var n = chEl.dataset.n, sel = selectionIn(chEl), sec = m.book ? sectionOf(chEl) : "", ref = cite(m, n, sec);
  if(b.dataset.ft === "cite"){ copy(ref + " (" + credit(m) + ")", "Citation copied"); return; }
  if(b.dataset.ft === "card"){
    var q = sel || plain($(".ft-p", chEl).innerHTML);
    window.HCCCard({q: q, by: m.author, sub: m.title.replace(/, Book [IVXLC]+$/, "") + " " + ref.replace(m.cite + " ", "") + (m.date ? " · " + m.date.replace(/ \(.*\)$/, "") : ""), src: "Trans. " + m.tr + ". " + m.ed});
    return;
  }
  if(b.dataset.ft === "link"){ copy(location.href.split("#")[0] + "#ref-fathers~" + m.id + "~" + n + (sec ? "~" + sec : ""), "Link copied"); return; }
  if(b.dataset.ft === "add"){
    var quote = sel || $$(".ft-p", chEl).map(function(p){ return plain(p.innerHTML); }).join(" ");
    if(!sel && quote.length > 1200) quote = quote.slice(0, 1200).replace(/\s\S*$/, "") + " …";
    if(!window.HCCStudies || !HCCStudies.open){ toast("Studies are not available"); return; }
    HCCStudies.open({type: "father", author: m.author, work: m.title.replace(/, Book [IVXLC]+$/, "") + " " + ref.replace(m.cite + " ", ""), date: m.date.replace(/ \(.*\)$/, ""), quote: quote, ft: m.id + "~" + n + (sec ? "~" + sec : ""), src: credit(m)});
  }
});
addEventListener("hashchange", function(){ setTimeout(route, 20); });
setTimeout(route, 40);
window.HCCTexts = {catalog: function(cb){ catalog(function(){ cb(CAT || []); }); }, cite: function(id, n, sec){ var m = meta(id); return m ? cite(m, n, sec) : ""; }};
})();
