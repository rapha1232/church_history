(function(){
"use strict";
/* More Bible study tools, built on the reader's internals (window.HCCBibleX, from bible.js):
   - a Greek and Hebrew lexicon you can search by meaning, transliteration, the word itself or Strong's number
   - the Church Fathers on a whole passage, in date order
   - parallel passages side by side (beyond the Gospel harmony), and "Parallel accounts" under a chapter
   - "In the history": the episodes that cite the chapter you are reading, and "Scripture in this episode"
   - highlights and notes with tags, a filter, Markdown export and a printable page
   - Bible references turned into links in content that appears after a page is first opened */
var X = window.HCCBibleX; if(!X) return;
var $ = function(s,r){return (r||document).querySelector(s)};
var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var esc = X.esc, st = X.st, view = X.view, XMODE = X.XMODE, ED = X.ED, NOTES = X.NOTES;
var APP = window.HCCApp && window.HCCApp.isApp ? window.HCCApp : null;
var PAR = window.__PARALLELS__ || [];
function loader(){ return '<div class="bib-load" aria-busy="true"><span></span><span></span><span></span></div>'; }
function top(){ window.scrollTo({top: X.art.getBoundingClientRect().top + scrollY - 70}); }
function edOf(b){ return ED[st.ed].idx[b] != null ? st.ed : X.edFor(b); }
function sname(b){ return X.shortName(edOf(b), b); }
function toast(m, o){ if(window.HCCToast) HCCToast(m, o); }
function download(name, mime, text){
  if(APP && APP.saveFile){ try{ APP.saveFile(name, mime, text); toast("Saved " + name); return; }catch(e){} }
  var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], {type: mime})); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function today(){ var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
/* "John 3", "Psalm 23:1-6", "Rom 8:28" -> {b, c, v, v2}; v = 0 for a whole chapter */
function passage(q){ var r = HCCBible.parse(q); if(r) return r; r = X.parseRef(String(q || "").replace(/[–—]/g, "-")); return r ? {b: r.b, c: r.c, v: r.v || 0, v2: r.v || 0} : null; }
function plabel(r){ return sname(r.b) + " " + r.c + (r.v ? ":" + r.v + (r.v2 && r.v2 !== r.v ? "–" + r.v2 : "") : ""); }

/* ============================================================ the Greek and Hebrew lexicon */
var LEXL = null;
function lexReady(cb){ var n = 0; ["g", "h"].forEach(function(k){ X.script("bible/lex/" + k + ".js", function(){ return !!X.LEX[k]; }, function(){ if(++n === 2) cb(); }); }); }
function plain(s){ return X.normT(s).replace(/[\u0591-\u05C7]/g, "").replace(/[^\p{L}\p{N}]+/gu, ""); }
function lexList(){
  if(LEXL) return LEXL; LEXL = [];
  ["g", "h"].forEach(function(k){ var L = X.LEX[k] || {}; Object.keys(L).forEach(function(id){ var e = L[id]; LEXL.push({id: id, k: k, e: e, pl: plain(e[0]), pt: plain(e[1]), pg: " " + X.normT(e[3]).replace(/[^\p{L}\p{N}]+/gu, " ") + " "}); }); });
  return LEXL;
}
function strongId(q){ var m = String(q || "").trim().match(/^([GgHh])\s?0*(\d{1,4})([A-Za-z])?$/); return m && +m[2] ? m[1].toUpperCase() + ("0000" + m[2]).slice(-4) + (m[3] || "").toUpperCase() : null; }
function lexFind(q){
  var sid = strongId(q), L = lexList();
  if(sid){ var base = sid.replace(/[A-Z]$/, ""); return L.filter(function(x){ return x.id === sid || x.id.replace(/[A-Z]$/, "") === base; }); }
  var p = plain(q), w = " " + X.normT(q).replace(/[^\p{L}\p{N}]+/gu, " ").trim() + " "; if(!p) return [];
  var out = [];
  L.forEach(function(x){
    var s = x.pl === p || x.pt === p ? 100 : (x.pl.indexOf(p) === 0 || x.pt.indexOf(p) === 0) && p.length > 2 ? 60 : x.pg.indexOf(w) >= 0 ? (x.pg === w ? 55 : 40) : 0;
    if(s) out.push([s, x]);
  });
  out.sort(function(a, b){ return b[0] - a[0] || a[1].pt.length - b[1].pt.length || (a[1].id < b[1].id ? -1 : 1); });
  return out.slice(0, 80).map(function(x){ return x[1]; });
}
XMODE.lexicon = function(){
  view.innerHTML = '<h3 class="bib-h">Greek and Hebrew lexicon</h3><p class="cmp-note">Look a word up by its meaning (<i>love</i>), its transliteration (<i>agapē</i>, <i>shalom</i>), the Greek or Hebrew itself, or a Strong’s number (<i>G26</i>, <i>H7965</i>). Open a word to see how it is translated and every place it is used.</p>'+
    '<form class="bs-form lx-form" role="search"><label class="vh" for="lxQ">Word to look up</label><input id="lxQ" type="search" value="'+esc(st.lq || "")+'" placeholder="love, agapē, ἀγάπη, H7965" autocomplete="off" enterkeyhint="search"><button type="submit" class="btn-sm">Look up</button></form><div id="lxOut" aria-live="polite"></div>';
  $("form", view).addEventListener("submit", function(ev){ ev.preventDefault(); st.lq = $("#lxQ", view).value.trim(); X.save(); runLex(); });
  if(st.lq) runLex();
};
function runLex(){
  var out = $("#lxOut", view), q = st.lq; if(!out || !q) return;
  out.innerHTML = '<p class="cmp-note">Loading the lexicon…</p>' + loader();
  lexReady(function(){
    if(st.lq !== q || !$("#lxOut", view)) return;
    var r = lexFind(q);
    out.innerHTML = r.length ? '<p class="bs-sum"><b>'+r.length+'</b> word'+(r.length > 1 ? "s" : "")+(r.length === 80 ? " (the closest 80)" : "")+'</p><ul class="lx-res">' + r.map(function(x){ var e = x.e;
        return '<li><button type="button" data-lxw="'+esc(x.id)+'"><span class="lx-w"><b lang="'+(x.k === "g" ? "grc" : "hbo")+'"'+(x.k === "h" ? ' dir="rtl"' : "")+'>'+esc(e[0])+'</b> <i>'+esc(e[1])+'</i></span><span class="lx-gl">'+esc(e[3])+'</span><small>'+(x.k === "g" ? "Greek" : "Hebrew")+' · '+esc(x.id.replace(/^([GH])0+/, "$1"))+'</small></button></li>'; }).join("") + '</ul><p class="vs-cite">Lexicon: STEPBible.org (Tyndale House, Cambridge), CC BY 4.0, from Abbott-Smith (Greek) and Brown–Driver–Briggs (Hebrew).</p>'
      : '<p class="vs-none">No word matches “'+esc(q)+'”. Try a simpler English meaning, or another spelling of the transliteration.</p>';
  });
}
view.addEventListener("click", function(e){ var t = e.target.closest("[data-lxw]"); if(t) X.openWord(t.dataset.lxw); });
HCCBible.lexicon = function(q){ st.lq = String(q || "").trim(); X.save(); X.tool("lexicon"); };
HCCBible.strong = strongId;
HCCBible.lexLookup = function(id, cb){ var k = id[0] === "G" ? "g" : "h"; X.script("bible/lex/" + k + ".js", function(){ return !!X.LEX[k]; }, function(){ cb(X.lexEntry(id)); }); };

/* ============================================================ the Fathers on a passage, in date order */
function fyear(e){
  var d = String(e[5] || ""), m = d.match(/(\d{1,2})(?:st|nd|rd|th)(?:[–-](\d{1,2})(?:st|nd|rd|th))?\s+century/);
  if(m) return (+m[1] - 1) * 100 + 50;
  var n = (d.match(/\d{2,4}/g) || []).map(Number); if(!n.length) return 9999;
  if(e[6] === "w" || n.length === 1) return n[0];
  return n[1] - 15;
}
function cent(y){ if(y >= 9999) return "Date uncertain"; var c = Math.floor(y / 100) + 1; return c + (c % 10 === 1 && c !== 11 ? "st" : c % 10 === 2 && c !== 12 ? "nd" : c % 10 === 3 && c !== 13 ? "rd" : "th") + " century"; }
XMODE.fathers = function(){
  var def = st.fq || (sname(st.b) + " " + X.engCh(st.ed, st.b, st.c));
  view.innerHTML = '<h3 class="bib-h">The Fathers on a passage</h3><p class="cmp-note">Every excerpt from the Church Fathers on a chapter or a passage, oldest first, so you can watch how its reading grew over the centuries.</p>'+
    '<form class="bs-form fp-form" role="search"><label class="vh" for="fpQ">Chapter or passage</label><input id="fpQ" type="search" value="'+esc(def)+'" placeholder="John 1, Romans 8:28-39" autocomplete="off" enterkeyhint="search"><button type="submit" class="btn-sm">Show</button></form><div id="fpOut" aria-live="polite"></div>';
  $("form", view).addEventListener("submit", function(ev){ ev.preventDefault(); st.fq = $("#fpQ", view).value.trim(); st.fa = ""; X.save(); runFathers(); });
  runFathers();
};
function runFathers(){
  var out = $("#fpOut", view), q = st.fq || $("#fpQ", view).value, r = passage(q);
  if(!r){ out.innerHTML = '<p class="vs-none">Type a chapter (“John 1”) or a passage (“Romans 8:28-39”).</p>'; return; }
  var ob = X.origBook(r.b) || r.b, g = X.grpOf(ob), v1 = r.v || 1, v2 = r.v ? (r.v2 || r.v) : 999;
  out.innerHTML = loader();
  X.script("bible/fath/" + g + ".js", function(){ return !!X.FATH[ob] || X.FATH["__" + g]; }, function(){
    X.FATH["__" + g] = 1;
    if(!$("#fpOut", view)) return;
    var list = (X.pick(X.FATH[ob], r.c) || []).filter(function(e){ return e[0] <= v2 && e[1] >= v1; }).map(function(e){ return {e: e, y: fyear(e)}; });
    list.sort(function(a, b){ return a.y - b.y || a.e[0] - b.e[0]; });
    if(!list.length){ out.innerHTML = '<p class="vs-none">No excerpts from the Fathers are gathered for '+esc(plabel(r))+'.</p>'; return; }
    var who = {}; list.forEach(function(x){ if(!who[x.e[2]]) who[x.e[2]] = {n: 0, y: x.y}; who[x.e[2]].n++; });
    var names = Object.keys(who).sort(function(a, b){ return who[a].y - who[b].y; });
    var f = st.fa && who[st.fa] ? st.fa : "", shown = f ? list.filter(function(x){ return x.e[2] === f; }) : list;
    var groups = [], by = {}; shown.forEach(function(x){ var c = cent(x.y); if(!by[c]){ by[c] = []; groups.push(c); } by[c].push(x); });
    out.innerHTML = '<p class="bs-sum"><b>'+list.length+'</b> excerpt'+(list.length > 1 ? "s" : "")+' from <b>'+names.length+'</b> writer'+(names.length > 1 ? "s" : "")+' on '+esc(plabel(r))+'</p>'+
      '<div class="fp-tools"><label for="fpWho">Writer</label><select id="fpWho"><option value="">Everyone</option>'+names.map(function(n){ return '<option value="'+esc(n)+'"'+(n === f ? " selected" : "")+'>'+esc(n)+' ('+who[n].n+')</option>'; }).join("")+'</select></div>'+
      (groups.length > 1 ? '<nav class="cm-chips fp-cents" aria-label="Centuries">'+groups.map(function(c, i){ return '<button type="button" class="chip" data-fpc="'+i+'">'+esc(c)+' · '+by[c].length+'</button>'; }).join("")+'</nav>' : "")+
      groups.map(function(c, i){ return '<section class="fp-sec" id="fpc'+i+'"><p class="shelf-h">'+esc(c)+'</p>'+by[c].map(function(x){ var e = x.e, long = e[4].length > 520;
        return '<div class="fa"><p class="fa-h"><b>'+esc(e[2])+'</b>'+(e[5] ? ' <span class="fa-d">'+(e[6] === "w" ? "" : "lived ")+esc(e[5])+'</span>' : "")+' <small>'+esc(String(e[3]).replace(/^Catena Aurea by Aquinas$/, "quoted in Aquinas, Catena Aurea (1262–64)"))+'</small></p>'+
          '<p class="fp-v"><button type="button" class="lc-ref" data-fpgo="'+r.b+'~'+r.c+'~'+e[0]+'">'+esc(sname(r.b))+' '+r.c+':'+e[0]+(e[1] !== e[0] ? "–" + e[1] : "")+'</button></p>'+
          '<div class="fa-t'+(long ? " clip" : "")+'">'+esc(e[4]).replace(/\n+/g, "</p><p>").replace(/^/, "<p>")+'</p></div>'+(long ? '<button type="button" class="fa-more">Read more</button>' : "")+'</div>'; }).join("")+'</section>'; }).join("")+
      '<p class="vs-cite">Excerpts from public-domain translations (Ante-Nicene and Nicene and Post-Nicene Fathers, Newman’s Catena Aurea, and others), via the HistoricalChristianFaith Commentaries Database. Dates are when the work was written, or the writer’s lifetime when the work is not precisely dated; the order is approximate.</p>';
  });
}
view.addEventListener("click", function(e){
  var t;
  if((t = e.target.closest(".fa-more"))){ var c = t.previousElementSibling; c.classList.toggle("clip"); t.textContent = c.classList.contains("clip") ? "Read more" : "Show less"; return; }
  if((t = e.target.closest("[data-fpc]"))){ var s = $("#fpc" + t.dataset.fpc, view); if(s) s.scrollIntoView({block: "start", behavior: "smooth"}); return; }
  if((t = e.target.closest("[data-fpgo]"))){ var p = t.dataset.fpgo.split("~"); X.goEng(p[0], +p[1], +p[2]); }
});
view.addEventListener("change", function(e){ if(e.target.id === "fpWho"){ st.fa = e.target.value; X.save(); runFathers(); } });
X.sheet.addEventListener("click", function(e){ var t = e.target.closest("[data-fall]"); if(!t) return; st.fq = t.dataset.fall; st.fa = ""; X.save(); X.closeSheet(); X.tool("fathers"); });

/* ============================================================ parallel passages */
var PL = []; PAR.forEach(function(s){ s.items.forEach(function(it){ PL.push({s: s.s, t: it.t, c: it.c, n: it.n || ""}); }); });
function refLabel(b, spec){ return sname(b) + " " + spec.replace(/-/g, "–"); }
XMODE.parallels = function(){
  if(st.pi != null && PL[st.pi]) return parDetail(st.pi);
  var secs = [], by = {};
  PL.forEach(function(p, i){ if(!by[p.s]){ by[p.s] = []; secs.push(p.s); } by[p.s].push([i, p]); });
  view.innerHTML = '<h3 class="bib-h">Parallel passages</h3><p class="cmp-note">Stories and texts the Bible tells more than once, side by side: the Law retold in Deuteronomy, Samuel and Kings retold in Chronicles, psalms that appear twice, the Old Testament quoted in the New. For the four Gospels, open the <button type="button" class="lc-ref" data-hgo="1">Gospel harmony</button>.</p>'+
    secs.map(function(s){ return '<section class="tp-sec"><p class="shelf-h">'+esc(s)+'</p><ul class="hg-list pl-list">'+by[s].map(function(x){ var p = x[1]; return '<li><button type="button" data-pi="'+x[0]+'"><b>'+esc(p.t)+'</b><small>'+p.c.map(function(c){ return esc(refLabel(c[0], c[1])); }).join(" · ")+'</small></button></li>'; }).join("")+'</ul></section>'; }).join("");
};
function parDetail(i){
  var p = PL[i];
  view.innerHTML = '<button type="button" class="btn-sm" data-pb="1">← All parallel passages</button><p class="eyebrow tp-c">'+esc(p.s)+'</p><h3 class="bib-h">'+esc(p.t)+'</h3>'+(p.n ? '<p class="cmp-note">'+esc(p.n)+'</p>' : "")+
    '<label class="vs-dtog"><input type="checkbox" id="plDiff"'+(st.pdiff === false ? "" : " checked")+'> Highlight wording found in only one passage</label>'+
    '<div class="hg-cols n'+Math.min(4, p.c.length)+'" id="plCols">'+p.c.map(function(c){ return '<section class="hg-col"><p class="hg-h"><b>'+esc(sname(c[0]))+'</b> <span>'+esc(c[1].replace(/-/g, "–"))+'</span></p><div class="hg-t">'+loader()+'</div></section>'; }).join("")+'</div>'+
    '<nav class="bib-pn">'+(i > 0 ? '<button type="button" data-pstep="-1"><small>Previous</small><b>'+esc(PL[i-1].t)+'</b></button>' : "<span></span>")+(i < PL.length - 1 ? '<button type="button" class="nx" data-pstep="1"><small>Next</small><b>'+esc(PL[i+1].t)+'</b></button>' : "<span></span>")+'</nav>';
  var texts = [], left = p.c.length;
  p.c.forEach(function(c, k){
    var b = c[0], ed = edOf(b);
    X.load(X.srcOf(ed, b), b, function(d){
      var vs = [];
      X.hRefs(c[1]).forEach(function(r){ for(var ch = r[0]; ch <= r[2]; ch++) (X.chapter(d, X.xchap(ed, b, ch)) || []).forEach(function(v){ if((ch > r[0] || v[0] >= r[1]) && (ch < r[2] || v[0] <= r[3])) vs.push([ch, v]); }); });
      texts[k] = vs; if(--left === 0 && st.pi === i) parRender(texts);
    });
  });
}
function parRender(texts){
  var box = $("#plCols", view); if(!box) return;
  var bags = texts.map(function(vs){ var s = {}; vs.forEach(function(x){ X.normT(x[1][1]).split(/[^\p{L}\p{N}]+/u).forEach(function(w){ if(w) s[w] = 1; }); }); return s; });
  var diff = st.pdiff !== false && texts.length > 1;
  $$(".hg-col", box).forEach(function(col, i){
    var others = bags.filter(function(_, k){ return k !== i; });
    $(".hg-t", col).innerHTML = texts[i].length ? texts[i].map(function(x){ var t = x[1][1];
      var h = diff ? esc(t.replace(/\[([^\]]{1,80})\]/g, "$1")).replace(/[\p{L}\p{N}’']+/gu, function(w){ var n = X.normT(w).replace(/[’']/g, ""); return n.length > 3 && !others.some(function(o){ return o[n]; }) ? '<mark class="hg-u">'+w+'</mark>' : w; }) : X.fmt(t);
      return '<p><sup>'+x[0]+':'+x[1][0]+'</sup> '+h+'</p>'; }).join("") : '<p class="vs-none">Text not available in this edition.</p>';
  });
}
view.addEventListener("click", function(e){
  var t;
  if((t = e.target.closest("[data-pi]"))){ st.pi = +t.dataset.pi; X.save(); X.tool("parallels"); return; }
  if((t = e.target.closest("[data-pb]"))){ st.pi = null; X.save(); XMODE.parallels(); return; }
  if((t = e.target.closest("[data-pstep]"))){ st.pi += +t.dataset.pstep; X.save(); XMODE.parallels(); top(); return; }
  if((t = e.target.closest("[data-hgo]"))){ st.hi = t.dataset.hgo === "1" ? null : +t.dataset.hgo; X.save(); X.tool("harmony"); return; }
});
view.addEventListener("change", function(e){ if(e.target.id === "plDiff"){ st.pdiff = e.target.checked; X.save(); XMODE.parallels(); } });

/* ============================================================ under a chapter: parallel accounts and "In the history" */
var HG = ["MAT", "MAR", "LUK", "JOH"];
function covers(b, spec, ch, B){ return b === B && X.hRefs(spec).some(function(r){ return ch >= r[0] && ch <= r[2]; }); }
function chapterExtras(){
  if(X.mode() !== "read" || !$(".bib-text, .bib-par", view) || $(".bx-more", view)) return;
  var b = X.origBook(st.b) || st.b, ch = X.engCh(st.ed, st.b, st.c), par = [];
  (X.BX2.harmony || []).forEach(function(ev, i){ var k = HG.indexOf(b); if(k >= 0 && ev[2 + k] && covers(b, ev[2 + k], ch, b)){ var others = HG.filter(function(g, j){ return j !== k && ev[2 + j]; }); if(others.length) par.push('<button type="button" class="bx-par" data-hgo="'+i+'"><b>'+esc(ev[1])+'</b><small>'+others.map(function(g){ return esc(sname(g) + " " + ev[2 + HG.indexOf(g)].replace(/-/g, "–")); }).join(" · ")+'</small></button>'); } });
  PL.forEach(function(p, i){ var others = p.c.filter(function(c){ return !covers(c[0], c[1], ch, b); }); if(others.length === p.c.length) return;
    par.push('<button type="button" class="bx-par" data-pi="'+i+'"><b>'+esc(p.t)+'</b><small>'+(others.length ? others : p.c).map(function(c){ return esc(refLabel(c[0], c[1])); }).join(" · ")+'</small></button>'); });
  var idx = X.refIndex(), pre = b + "." + ch + ".", eps = {}, order = [];
  Object.keys(idx).forEach(function(k){ if(k.indexOf(pre) !== 0) return; var v = +k.slice(pre.length); idx[k].forEach(function(id){ if(!eps[id]){ eps[id] = []; order.push(id); } if(eps[id].indexOf(v) < 0) eps[id].push(v); }); });
  var all = $$("main article").map(function(a){ return a.id; });
  order.sort(function(a, z){ return all.indexOf(a) - all.indexOf(z); });
  var hist = order.map(function(id){ var a = document.getElementById(id); if(!a) return ""; var vs = eps[id].sort(function(x, y){ return x - y; });
    return '<li><a href="#'+id+'"><b>'+esc(a.dataset.title || id)+'</b><span>'+esc((a.dataset.ep ? "Episode " + a.dataset.ep + " · " : "") + (vs.length > 1 ? "verses " : "verse ") + vs.join(", "))+'</span></a></li>'; }).filter(Boolean);
  if(!par.length && !hist.length) return;
  var el = document.createElement("section"); el.className = "bx-more";
  el.innerHTML = (par.length ? '<p class="shelf-h">Parallel accounts</p><p class="cmp-note">The same events or words elsewhere in the Bible. Open one to read them side by side.</p><div class="bx-pars">' + par.slice(0, 12).join("") + '</div>' : "") +
    (hist.length ? '<p class="shelf-h">In the history</p><p class="cmp-note">Episodes and reference pages that cite '+esc(sname(st.b))+' '+ch+'.</p><ul class="ed21-rows bx-hist">' + hist.slice(0, 8).join("") + '</ul>' + (hist.length > 8 ? '<details class="bx-mored"><summary>'+(hist.length - 8)+' more</summary><ul class="ed21-rows bx-hist">' + hist.slice(8).join("") + '</ul></details>' : "") : "");
  var conn = $("#bibConn", view); if(conn) conn.parentNode.insertBefore(el, conn.nextSibling); else view.appendChild(el);
}
if(typeof MutationObserver === "function") new MutationObserver(function(){ setTimeout(chapterExtras, 0); }).observe(view, {childList: true});

/* "Scripture in this episode": every passage an episode cites, in Bible order, at its end */
function scriptureList(a){
  if(!a || !a.dataset.ep || $(".bx-scrip", a)) return;
  var seen = {}, refs = [];
  $$(".sref", a).forEach(function(b){ var k = b.dataset.sref; if(!k || seen[k]) return; seen[k] = 1; var p = k.split("~"); refs.push({b: p[0], c: +p[1], v: +p[2], k: k}); });
  if(refs.length < 2) return;
  refs.sort(function(x, y){ var i = X.BOOKORDER.indexOf(x.b), j = X.BOOKORDER.indexOf(y.b); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j) || x.c - y.c || x.v - y.v; });
  var el = document.createElement("section"); el.className = "bx-scrip";
  el.innerHTML = '<p class="shelf-h">Scripture in this episode</p><p class="bx-sl">' + refs.map(function(r){ return '<button type="button" class="sref" data-sref="'+r.k+'">'+esc(sname(r.b) + " " + r.c + ":" + r.v)+'</button>'; }).join("") + '</p>';
  var up = $("aside.upnext", a); if(up) a.insertBefore(el, up); else a.appendChild(el);
}

/* links in content that appears after a page was first opened (and on pages opened before the links were made) */
var BAD = "a,button,script,style,textarea,input,select,option,.sref,svg,figcaption,h1,h2,.shelf-h,[contenteditable],.bib-text,.bib-par,.vsheet,.bx-scrip";
function linkIn(root){
  if(!root) return;
  var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode: function(n){ return !/\d:\d/.test(n.nodeValue) || (n.parentNode.closest && n.parentNode.closest(BAD)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }});
  var nodes = []; while(tw.nextNode()) nodes.push(tw.currentNode);
  nodes.forEach(function(n){
    var refs = X.findRefs(n.nodeValue); if(!refs.length) return;
    var frag = document.createDocumentFragment(), pos = 0, t = n.nodeValue;
    refs.forEach(function(r){ frag.appendChild(document.createTextNode(t.slice(pos, r.i))); var b = document.createElement("button"); b.type = "button"; b.className = "sref"; b.dataset.sref = r.b + "~" + r.c + "~" + r.v; b.textContent = r.s; b.title = "Open this passage"; frag.appendChild(b); pos = r.i + r.len; });
    frag.appendChild(document.createTextNode(t.slice(pos)));
    if(n.parentNode) n.parentNode.replaceChild(frag, n);
  });
}
HCCBible.link = linkIn;
var lt = 0, main = $("main");
function relink(){ var a = $("main article.active"); if(!a || a.id === "bible") return; linkIn(a); scriptureList(a); }
if(main && typeof MutationObserver === "function") new MutationObserver(function(ms){
  var any = ms.some(function(m){ return Array.prototype.some.call(m.addedNodes, function(n){ return (n.nodeType === 3 ? n.nodeValue : n.textContent || "").indexOf(":") >= 0; }); });
  if(any){ clearTimeout(lt); lt = setTimeout(relink, 450); }
}).observe(main, {childList: true, subtree: true});
addEventListener("hashchange", function(){ setTimeout(relink, 700); }); setTimeout(relink, 1200);

/* ============================================================ highlights and notes: tags, filter, export */
var HCN = {y: "Yellow", g: "Green", b: "Blue", p: "Pink"};
function noteList(){
  var f = st.nf || "all", tg = st.ntag || "", q = X.normT(st.nq || ""), keys = Object.keys(NOTES);
  if(st.nsort === "bible") keys.sort(function(a, b){ var p = a.split("."), r = b.split("."), i = X.BOOKORDER.indexOf(p[0]), j = X.BOOKORDER.indexOf(r[0]); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j) || p[1] - r[1] || p[2] - r[2]; });
  else keys.sort(function(a, b){ return (NOTES[b].t || 0) - (NOTES[a].t || 0); });
  return keys.filter(function(k){ var n = NOTES[k];
    if(!(f === "all" || (f === "h" && n.h) || (f === "n" && n.n) || (f === "k" && n.k) || (HCN[f.slice(1)] && f[0] === "c" && n.h === f.slice(1)))) return false;
    if(tg && (n.g || []).indexOf(tg) < 0) return false;
    if(q && X.normT([n.ref, n.txt, n.n, (n.g || []).join(" ")].join(" ")).indexOf(q) < 0) return false;
    return true; });
}
XMODE.notes = function(){
  var f = st.nf || "all", all = Object.keys(NOTES), tags = X.allTags(), list = noteList();
  if(st.ntag && tags.indexOf(st.ntag) < 0) st.ntag = "";
  view.innerHTML = '<h3 class="bib-h">Your highlights and notes</h3>'+
    '<div class="cm-chips" role="group" aria-label="Show">'+[["all","All"],["h","Highlights"],["n","Notes"],["k","Bookmarks"]].map(function(x){ return '<button type="button" class="chip" data-nf="'+x[0]+'" aria-pressed="'+(f === x[0])+'">'+x[1]+'</button>'; }).join("")+
      ["y","g","b","p"].map(function(c){ return '<button type="button" class="chip bn-cc" data-nf="c'+c+'" aria-pressed="'+(f === "c" + c)+'"><i class="hcb hc-'+c+'" aria-hidden="true"></i>'+HCN[c]+'</button>'; }).join("")+'</div>'+
    (tags.length ? '<div class="cm-chips bn-tags" role="group" aria-label="Tags">'+tags.map(function(g){ return '<button type="button" class="chip" data-ntag="'+esc(g)+'" aria-pressed="'+(st.ntag === g)+'">#'+esc(g)+'</button>'; }).join("")+'</div>' : "")+
    (all.length ? '<div class="bn-bar"><label class="vh" for="bnQ">Search your notes</label><input id="bnQ" type="search" placeholder="Search your notes" value="'+esc(st.nq || "")+'" autocomplete="off"><label class="vh" for="bnSort">Order</label><select id="bnSort"><option value="recent">Newest first</option><option value="bible"'+(st.nsort === "bible" ? " selected" : "")+'>Bible order</option></select></div>'+
      '<div class="bn-exp"><button type="button" class="btn-sm" data-nmd="1">Save as Markdown</button><button type="button" class="btn-sm" data-nprint="1">'+(APP ? "Save a printable page" : "Print or save as PDF")+'</button><button type="button" class="btn-sm" data-nexp="1">Copy as text</button></div>' : "")+
    '<div id="bnOut">'+noteItems(list, all.length)+'</div>';
};
function noteItems(list, total){
  if(!total) return '<p class="vs-none">Nothing here yet. Tap any verse and choose a colour, a bookmark, a note or a tag.</p>';
  if(!list.length) return '<p class="vs-none">No highlights or notes match. <button type="button" class="lc-ref" data-nclear="1">Show all</button></p>';
  return '<p class="bs-sum"><b>'+list.length+'</b> of '+total+'</p><ul class="bn-list">' + list.map(function(k){ var n = NOTES[k], p = k.split(".");
    return '<li class="'+(n.h ? "hc-"+n.h : "")+'"><button type="button" class="bn-go" data-eng="'+p[0]+'~'+p[1]+'~'+p[2]+'"><b>'+esc(n.ref || k)+'</b>'+(n.k ? ' <span aria-label="bookmarked">★</span>' : "")+'<small>'+esc(ED[n.ed] ? ED[n.ed].short : "")+' · '+new Date(n.t || 0).toLocaleDateString()+'</small></button><p>'+esc((n.txt || "").slice(0, 220))+'</p>'+(n.n ? '<p class="bn-n">'+esc(n.n)+'</p>' : "")+
      ((n.g || []).length ? '<p class="bn-g">'+n.g.map(function(g){ return '<button type="button" class="lc-ref" data-ntag="'+esc(g)+'">#'+esc(g)+'</button>'; }).join(" ")+'</p>' : "")+'</li>'; }).join("") + '</ul>';
}
function toMD(list){
  var out = ["# My Bible highlights and notes", "", "_" + list.length + " item" + (list.length === 1 ? "" : "s") + ", saved " + today() + " from History of the Christian Church_", ""];
  list.forEach(function(k){ var n = NOTES[k];
    out.push("## " + (n.ref || k) + (ED[n.ed] ? " (" + ED[n.ed].short + ")" : ""), "");
    if(n.txt) out.push("> " + n.txt, "");
    if(n.n) out.push(n.n, "");
    var meta = []; if(n.h) meta.push("Highlight: " + HCN[n.h].toLowerCase()); if(n.k) meta.push("Bookmarked"); if((n.g || []).length) meta.push("Tags: " + n.g.map(function(g){ return "#" + g.replace(/\s+/g, "-"); }).join(" "));
    if(meta.length) out.push("_" + meta.join(" · ") + "_", "");
  });
  return out.join("\n");
}
function toHTML(list){
  var col = {y: "#f6e7a6", g: "#cfe8c9", b: "#cfdcf3", p: "#f3d0dc"};
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>My Bible highlights and notes</title><style>body{font:16px/1.6 Georgia,"Times New Roman",serif;color:#1e1b16;background:#fff;max-width:42rem;margin:2rem auto;padding:0 1rem}h1{font-size:1.6rem;margin:0 0 .2rem}.m{color:#655d52;font:13px system-ui,sans-serif;margin:0 0 1.6rem}section{break-inside:avoid;border-top:1px solid #ddd;padding:.8rem 0}h2{font-size:1.05rem;margin:0 0 .3rem}blockquote{margin:0 0 .4rem;padding:.1rem .5rem;border-radius:3px}p{margin:.2rem 0}.t{font:13px system-ui,sans-serif;color:#655d52}</style></head><body><h1>My Bible highlights and notes</h1><p class="m">'+list.length+' item'+(list.length === 1 ? "" : "s")+' · '+today()+'</p>'+
    list.map(function(k){ var n = NOTES[k]; return '<section><h2>'+esc(n.ref || k)+(ED[n.ed] ? ' <small class="t">'+esc(ED[n.ed].short)+'</small>' : "")+(n.k ? " ★" : "")+'</h2>'+(n.txt ? '<blockquote style="background:'+(n.h ? col[n.h] : "#f4f1ea")+'">'+esc(n.txt)+'</blockquote>' : "")+(n.n ? '<p>'+esc(n.n).replace(/\n/g, "<br>")+'</p>' : "")+((n.g || []).length ? '<p class="t">'+n.g.map(function(g){ return "#" + esc(g); }).join(" ")+'</p>' : "")+'</section>'; }).join("")+'</body></html>';
}
function printHTML(html){
  if(APP){ download("bible-notes-" + today() + ".html", "text/html", html); toast("Open the saved page to print it or save it as PDF"); return; }
  var fr = document.createElement("iframe"); fr.setAttribute("aria-hidden", "true"); fr.style.cssText = "position:fixed;width:0;height:0;border:0;right:0;bottom:0";
  document.body.appendChild(fr); var d = fr.contentWindow.document; d.open(); d.write(html); d.close();
  setTimeout(function(){ try{ fr.contentWindow.focus(); fr.contentWindow.print(); }catch(e){} setTimeout(function(){ fr.remove(); }, 1500); }, 250);
}
view.addEventListener("click", function(e){
  var t; if(X.mode() !== "notes") return;
  if((t = e.target.closest("[data-ntag]"))){ st.ntag = st.ntag === t.dataset.ntag ? "" : t.dataset.ntag; X.save(); XMODE.notes(); return; }
  if((t = e.target.closest("[data-nclear]"))){ st.nf = "all"; st.ntag = ""; st.nq = ""; X.save(); XMODE.notes(); return; }
  if((t = e.target.closest("[data-nmd]"))){ var l = noteList(); download("bible-notes-" + today() + ".md", "text/markdown", toMD(l)); return; }
  if((t = e.target.closest("[data-nprint]"))){ printHTML(toHTML(noteList())); return; }
});
var nqT = 0;
view.addEventListener("input", function(e){ if(e.target.id !== "bnQ") return; clearTimeout(nqT); var v = e.target.value; nqT = setTimeout(function(){ st.nq = v; X.save(); var o = $("#bnOut", view); if(o) o.innerHTML = noteItems(noteList(), Object.keys(NOTES).length); }, 200); });
view.addEventListener("change", function(e){ if(e.target.id === "bnSort"){ st.nsort = e.target.value; X.save(); XMODE.notes(); } });

/* ---------- the new tools in the tools strip ---------- */
var tools = $("#bibTools");
if(tools){
  var after = $('[data-act="harmony"]', tools);
  [["parallels", "Parallel passages"], ["fathers", "Fathers on a passage"], ["lexicon", "Lexicon"]].reverse().forEach(function(x){
    if($('[data-act="'+x[0]+'"]', tools)) return;
    var b = document.createElement("button"); b.type = "button"; b.dataset.act = x[0]; b.setAttribute("aria-pressed", "false"); b.textContent = x[1];
    if(after && after.nextSibling) tools.insertBefore(b, after.nextSibling); else tools.appendChild(b);
  });
  X.toolsMark();
}
})();
