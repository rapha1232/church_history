(function(){
"use strict";
var X = window.__X__||{}, X3 = window.__X3__||{}, EP = window.__EP__||{}, D = window.__DATA__||{};
var $ = function(s,r){return (r||document).querySelector(s)};
var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var q = $("#q"), res = $("#results"); if(!q || !res) return;
function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]}); }
function norm(s){ return String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[’']/g,""); }
window.__SX__ = true;
var GROUPS = [["ep","Episodes"],["season","Seasons"],["people","People"],["council","Councils"],["doc","Documents"],["quote","Quotes"],["gloss","Glossary"],["ref","Reference"]];
var IDX = null, VOCAB = null, JUMP = [], FILT = "";

/* ---------- index (built on first use) ---------- */
function build(){
  IDX = []; var vf = {};
  function add(g, title, txt, act, sub){ var n = norm(txt); IDX.push({g:g, t:title, nt:norm(title), n:n, raw:txt, act:act, sub:sub||""}); n.split(/[^a-z0-9]+/).forEach(function(w){ if(w.length >= 4) vf[w] = (vf[w]||0) + 1; }); }
  $$("main article").forEach(function(a){
    if(a.id === "ref-people"){
      $$(".person", a).forEach(function(p){ var h = $("h4", p); if(h) add("people", h.textContent, p.textContent.replace(/Life & times →/,""), {el:p, art:a.id}); });
      return;
    }
    if(a.id === "ref-texts"){
      $$("details.doctext", a).forEach(function(d){ var id = d.dataset.docId || d.id.replace(/^text-/,""), t = d.dataset.title;
        $$(".docintro p, .docbody p, .docbody li, .docbody h4", d).forEach(function(b, k){ var tx = b.textContent; if(tx.length > 20 || k === 0) add("doc", t, tx, {doc:id}); }); });
      return;
    }
    var g = a.dataset.ep ? "ep" : a.dataset.season ? "season" : "ref";
    var title = (a.dataset.ep ? a.dataset.ep + " · " : "") + (a.dataset.title||a.id);
    $$("h3, p, li, blockquote, td, .co-syn, .deeper p", a).forEach(function(b){
      if(b.closest(".notes, .upnext, .cast, .smap, .emap, .shelves, .bb-slides, nav, .sstrip, .pager, .cmtab, .db-it details")) return;
      if(b.tagName === "LI" && b.closest(".takeaways")) return;
      var tx = b.textContent.replace(/\s+/g," ").trim(); if(tx.length < 25 && b.tagName !== "H3") return;
      add(g, title, tx, {el:b, art:a.id});
    });
  });
  Object.keys(X3.councils||{}).forEach(function(id){ var c = X3.councils[id]; add("council", c.n + " (" + c.s + (c.e !== c.s ? "–" + c.e : "") + ")", c.n + " " + c.pl + " " + c.d + " " + c.by, {council:id}, c.pl); });
  (X.quotes||[]).forEach(function(qq, k){ add("quote", qq.a, qq.q + " " + qq.a + " " + qq.w, {quote:k}, qq.w); });
  Object.keys(D.glossary||{}).forEach(function(t){ var d = D.glossary[t]; add("gloss", t.charAt(0).toUpperCase() + t.slice(1), t + " " + String(d[0]).replace(/<[^>]+>/g,""), {gloss:t}); });
  VOCAB = Object.keys(vf).map(function(w){ return [w, vf[w]]; });
}

/* ---------- typo tolerance ---------- */
function lev(a, b, max){
  if(Math.abs(a.length - b.length) > max) return max + 1;
  var prev = [], i, j; for(j=0;j<=b.length;j++) prev[j] = j;
  for(i=1;i<=a.length;i++){ var cur = [i], best = i; for(j=1;j<=b.length;j++){ cur[j] = Math.min(prev[j]+1, cur[j-1]+1, prev[j-1] + (a[i-1]===b[j-1]?0:1)); if(cur[j] < best) best = cur[j]; } if(best > max) return max + 1; prev = cur; }
  return prev[b.length];
}
var memo = {};
function variants(t){
  if(memo[t]) return memo[t];
  var out = [t];
  if(t.length >= 4){
    var exact = VOCAB.some(function(v){ return v[0] === t; });
    if(!exact){
      var max = t.length >= 7 ? 2 : 1, c = [];
      VOCAB.forEach(function(v){ var w = v[0]; if(Math.abs(w.length - t.length) <= max){ var d = lev(t, w, max); if(d <= max) c.push([w, d, v[1]]); } });
      c.sort(function(a,b){ return a[1]-b[1] || b[2]-a[2]; }); c.slice(0,4).forEach(function(x){ out.push(x[0]); });
    }
  }
  return (memo[t] = out);
}

/* ---------- search ---------- */
function run(str){
  if(!IDX) build();
  var toks = norm(str).split(/[^a-z0-9]+/).filter(function(x){ return x.length > 1; }); if(!toks.length) return null;
  var vs = toks.map(variants), fixed = [];
  vs.forEach(function(v, i){ if(v.length > 1 && v[0] === toks[i]) fixed.push(v[1]); else fixed.push(toks[i]); });
  var hits = [];
  IDX.forEach(function(e){
    var s = 0, ok = true;
    for(var i=0;i<vs.length && ok;i++){
      var best = 0;
      vs[i].forEach(function(w, k){ var inT = e.nt.indexOf(w) >= 0, inB = e.n.indexOf(w) >= 0; if(inT || inB){ var sc = (inT?30:0) + (inB?6:0) + (new RegExp("\\b"+w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\b").test(e.n)?6:0) - k*3; if(sc > best) best = sc; } });
      if(!best) ok = false; else s += best;
    }
    if(ok){ if(e.n.indexOf(norm(str).trim()) >= 0) s += 25; hits.push({e:e, s:s, w:vs.map(function(v){ return v; })}); }
  });
  hits.sort(function(a,b){ return b.s - a.s; });
  return {hits:hits, did: fixed.join(" ") !== toks.join(" ") ? fixed.join(" ") : null, terms: [].concat.apply([], vs)};
}
function snippet(raw, terms){
  var n = norm(raw), pos = -1;
  terms.some(function(t){ pos = n.indexOf(t); return pos >= 0; });
  var s = pos < 0 ? raw.slice(0, 150) : (pos > 60 ? "…" : "") + raw.slice(Math.max(0, pos-60), pos+110) + (pos+110 < raw.length ? "…" : "");
  s = esc(s);
  terms.filter(function(t){ return t.length > 1; }).forEach(function(t){ s = s.replace(new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&") + ")", "ig"), "<mark>$1</mark>"); });
  return s;
}
function render(){
  var str = q.value.trim(); if(!str){ return; }
  var r = run(str) || {hits: [], did: null, terms: []};
  JUMP = [];
  var by = {}; r.hits.forEach(function(h){ (by[h.e.g] = by[h.e.g] || []).push(h); });
  var bref = bibleRef(str), html = bref ? '<div class="sx-g"><p class="sx-h">Bible</p><a href="#bible" data-sxbib="1"><span class="rt">Open '+esc(bref.label)+'</span><span class="rs" data-sxbt>'+(bref.v ? "Go to the verse in the Bible" : "Go to the chapter in the Bible")+'</span></a></div>' : "";
  html += r.did ? '<div class="sx-did">Showing results for <b>'+esc(r.did)+'</b></div>' : "";
  var any = false, counts = [];
  GROUPS.forEach(function(g){
    var list = by[g[0]]; if(!list) return; any = true;
    var seen = {}, shown = list.filter(function(h){ var key = h.e.t + "|" + (h.e.act.art || "") ; if(g[0] === "ep" || g[0] === "ref" || g[0] === "doc"){ if(seen[key] >= 2) return false; seen[key] = (seen[key]||0) + 1; } return true; }).slice(0, FILT === g[0] ? 40 : g[0] === "ep" ? 8 : 5);
    counts.push([g[0], g[1], list.length]);
    html += '<div class="sx-g" data-sxg="'+g[0]+'"><p class="sx-h">'+g[1]+' <span>'+list.length+'</span></p>' + shown.map(function(h){
      var k = JUMP.push(h.e) - 1, href = h.e.act.art ? "#" + h.e.act.art : "#";
      return '<a href="'+href+'" data-sx="'+k+'"><span class="rt">'+esc(h.e.t)+(h.e.sub?' <small>'+esc(h.e.sub)+'</small>':'')+'</span><span class="rs">'+snippet(h.e.raw, r.terms)+'</span></a>';
    }).join("") + '</div>';
  });
  /* prayers (the Prayers page draws them only when opened, so they are searched here) */
  var PR = window.HCCPrayers, toks = norm(str).split(/[^a-z0-9]+/).filter(function(x){ return x.length > 1; });
  if(PR && toks.length && !bref){
    var TH = {}; PR.themes.forEach(function(t){ TH[t[0]] = t[1]; });
    var ph = PR.list.map(function(p){ var hay = norm([p.t, p.src, p.x || "", p.th.map(function(t){ return TH[t]; }).join(" ")].join(" ")), tt = norm(p.t), sc = 0;
      for(var i = 0; i < toks.length; i++){ if(hay.indexOf(toks[i]) < 0) return null; sc += tt.indexOf(toks[i]) >= 0 ? 10 : 1; } return [sc, p]; }).filter(Boolean).sort(function(a, b){ return b[0] - a[0]; });
    if(ph.length){ any = true; counts.push(["prayers", "Prayers", ph.length]); html += '<div class="sx-g" data-sxg="prayers"><p class="sx-h">Prayers <span>'+ph.length+'</span></p>' + ph.slice(0, FILT === "prayers" ? 40 : 5).map(function(x){ var p = x[1]; return '<a href="#prayers" data-sxpr="'+esc(p.id)+'"><span class="rt">'+esc(p.t)+'</span><span class="rs">'+esc(p.src)+'</span></a>'; }).join("") + '</div>'; }
  }
  /* the Bible: its text, and the Greek and Hebrew lexicon */
  var B = window.HCCBible || {}, sid = !bref && B.strong ? B.strong(str) : null, script = /[\u0370-\u03ff\u1f00-\u1fff\u0590-\u05ff]/.test(str);
  var word = !bref && !sid && /^[\p{L}’'-]{3,30}$/u.test(str), bx = "";
  if(sid && B.word) bx += '<a href="#bible" data-sxlex="'+esc(sid)+'"><span class="rt">Look up '+esc(sid.replace(/^([GH])0+/, "$1"))+' in the lexicon</span><span class="rs" data-sxlt>'+(sid[0] === "G" ? "Greek" : "Hebrew")+' word: how it is translated and every place it is used</span></a>';
  if(word && B.lexicon) bx += '<a href="#bible" data-sxlx="1"><span class="rt">Find “'+esc(str)+'” in the Greek and Hebrew lexicon</span><span class="rs">Words that mean, or are spelled, '+esc(str)+'</span></a>';
  if(!bref && !sid && !script && str.length >= 3 && B.search) bx += '<a href="#bible" data-sxbs="1"><span class="rt">Search the Bible for “'+esc(str)+'”</span><span class="rs">Every verse with these words, in the edition you are reading</span></a>';
  if(bx){ counts.push(["bible", "Bible", 0]); bx = '<div class="sx-g" data-sxg="bible"><p class="sx-h">Bible</p>' + bx + '</div>'; if(sid || script) html = bx + html; else html += bx; any = true; }
  if(!any && !bref) html += '<div style="padding:12px;color:var(--muted)">No matches. Try fewer words, or another spelling.</div>';
  if(FILT && !counts.some(function(c){ return c[0] === FILT; })) FILT = "";
  if(counts.length > 1) html = '<div class="sx-f" role="group" aria-label="Show results from"><button type="button" class="chip" data-sxf="" aria-pressed="'+(!FILT)+'">All</button>' +
    counts.map(function(c){ return '<button type="button" class="chip" data-sxf="'+c[0]+'" aria-pressed="'+(FILT === c[0])+'">'+esc(c[1])+(c[2] ? ' <span>'+c[2]+'</span>' : "")+'</button>'; }).join("") + '</div>' + html;
  res.dataset.f = counts.length > 1 ? FILT : "";
  res.innerHTML = html; res.hidden = false; res.classList.add("sx");
  if(sid && B.lexLookup) B.lexLookup(sid, function(e){ var el = $("[data-sxlt]", res); if(e && el && B.strong(q.value.trim()) === sid) el.textContent = e[0] + " · " + e[1] + " · “" + e[3] + "”"; });
  if(bref && bref.v && HCCBible.text) HCCBible.text(bref, function(t){ var el = $("[data-sxbt]", res); if(t && el && bibleRef(q.value.trim()) && bibleRef(q.value.trim()).label === bref.label){ var tx = t.text.replace(/\[([^\]]{1,80})\]/g, "$1"); el.textContent = tx.length > 220 ? tx.slice(0, 220) + "…" : tx; } });
}
/* a Bible reference ("John 3:36") goes straight to the verse; render at once so Enter opens it */
function bibleRef(str){ try{ return window.HCCBible && HCCBible.ref ? HCCBible.ref(str) : null; }catch(e){ return null; } }
function bibleOpen(){ var r = bibleRef(q.value.trim()); if(!r || !HCCBible.go(null, r.b, r.c, r.v)) return false; res.hidden = true; q.blur(); return true; }
var tmr = null;
q.addEventListener("input", function(){ clearTimeout(tmr); if(bibleRef(q.value.trim())) render(); else tmr = setTimeout(render, 120); });
q.addEventListener("focus", function(){ if(!IDX) setTimeout(build, 30); });

/* ---------- open a result at its paragraph ---------- */
function flash(el){
  if(!el) return; var top = el.getBoundingClientRect().top + scrollY - 110;
  scrollTo({top: top, behavior: "smooth"}); el.classList.remove("sx-flash"); void el.offsetWidth; el.classList.add("sx-flash");
}
res.addEventListener("mousedown", function(e){ if(e.target.closest("[data-sxf]")) e.preventDefault(); });
res.addEventListener("click", function(e){
  var fb = e.target.closest("[data-sxf]"); if(fb){ e.preventDefault(); e.stopPropagation(); FILT = fb.dataset.sxf; render(); var on = $('[data-sxf="'+FILT+'"]', res); if(on) on.focus(); res.scrollTop = 0; return; }
  if(e.target.closest("[data-sxbib]")){ e.preventDefault(); bibleOpen(); return; }
  var pr = e.target.closest("[data-sxpr]"); if(pr){ e.preventDefault(); res.hidden = true; q.blur(); if(window.HCCPrayers) HCCPrayers.open(pr.dataset.sxpr); return; }
  var bb = e.target.closest("[data-sxlex],[data-sxlx],[data-sxbs]");
  if(bb){ e.preventDefault(); var v = q.value.trim(); res.hidden = true; q.blur();
    if(bb.dataset.sxlex) HCCBible.word(bb.dataset.sxlex); else if(bb.dataset.sxlx) HCCBible.lexicon(v); else HCCBible.search(v); return; }
  var a = e.target.closest("[data-sx]"); if(!a) return;
  var it = JUMP[+a.dataset.sx]; if(!it) return; var act = it.act;
  if(act.el){
    var target = act.el, d = target.closest("details"); if(d) d.open = true;
    setTimeout(function(){ flash(target); }, location.hash.slice(1) === act.art ? 30 : 420);
    return;
  }
  e.preventDefault(); res.hidden = true; q.blur();
  if(act.doc){ var b = $('[data-doc="'+act.doc+'"]'); if(b) b.click(); return; }
  if(act.council){ location.hash = "ref-councilmap"; setTimeout(function(){ var g = $('[data-cgo="'+act.council+'"]'); if(g) g.click(); var c = $("#cmCard"); if(c) c.scrollIntoView({block:"center"}); }, 400); return; }
  if(act.gloss){ location.hash = "ref-glossary"; setTimeout(function(){ var t = $$("#ref-glossary dt, #ref-glossary h4, #ref-glossary strong").filter(function(x){ return norm(x.textContent).indexOf(act.gloss) === 0; })[0]; if(t) flash(t.closest("div,dt,p,li")||t); }, 420); return; }
  if(act.quote != null){
    location.hash = "home";
    setTimeout(function(){ var box = $(".qotd"), qq = (X.quotes||[])[act.quote]; if(!box || !qq) return;
      $(".qbody", box).innerHTML = '<blockquote>'+esc(qq.q)+'</blockquote><p class="qa"><b>'+esc(qq.a)+'</b>'+(qq.d?' ('+esc(qq.d)+')':'')+' · <i>'+esc(qq.w)+'</i>'+(qq.c?', '+esc(qq.c):'')+'<br><small>'+esc(qq.s)+' (public domain)</small></p>';
      flash(box); }, 450);
  }
});
})();
