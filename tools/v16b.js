/* ===================== Edition 15: Bible additions ===================== */
var BX2 = window.__BIBX2__ || {};
/* ---------- red letters ---------- */
var WJ = null; window.__WJ = function(d){ WJ = d; };
function vtext(b, v){
  var src = srcOf(st.ed, b), m = st.red && WJ && WJ[src] && WJ[src][b + st.c + ":" + v[0]];
  if(!m) return fmt(v[1]);
  var t = v[1], out = "", pos = 0;
  m.forEach(function(r){ out += fmt(t.slice(pos, r[0])) + '<span class="wj">' + fmt(t.slice(r[0], r[1])) + '</span>'; pos = r[1]; });
  return out + fmt(t.slice(pos));
}
function redToggle(on){
  st.red = on; save();
  if(on && !WJ) script("bible/wj.js", function(){ return !!WJ; }, function(){ render({keep: true}); });
  else render({keep: true});
}
if(st.red) script("bible/wj.js", function(){ return !!WJ; }, function(){ if(location.hash === "#bible" && mode === "read") render({keep: true}); });

/* ---------- topics ---------- */
var TOPICS = null; window.__TOPICS = function(d){ TOPICS = d; };
function refLabel(r){ var m = r.match(/^([1-3A-Z]{3})(\d+):(\d+)(?:-(\d+)(?::(\d+))?)?$/); return m ? shortName(edFor(m[1]), m[1]) + " " + m[2] + ":" + m[3] + (m[5] ? "–" + m[4] + ":" + m[5] : m[4] ? "–" + m[4] : "") : r; }
function refParts(r){ var m = r.match(/^([1-3A-Z]{3})(\d+):(\d+)(?:-(\d+)(?::(\d+))?)?$/); return m ? {b: m[1], c: +m[2], v: +m[3], v2: m[5] ? 999 : (m[4] ? +m[4] : +m[3])} : null; }
function verseList(refs, cb){
  var out = [], left = refs.length; if(!left) return cb("");
  refs.forEach(function(r, i){
    var p = refParts(r); if(!p){ out[i] = ""; if(--left === 0) cb(out.join("")); return; }
    var ed = ED[st.ed].idx[p.b] != null ? st.ed : edFor(p.b), ch = xchap(ed, p.b, p.c), src = srcOf(ed, p.b);
    load(src, p.b, function(d){
      var t = (chapter(d, ch)||[]).filter(function(x){ return x[0] >= p.v && x[0] <= p.v2; }).map(function(x){ return x[1]; }).join(" ");
      if(t.length > 300) t = t.slice(0, 290).replace(/\s\S*$/, "") + " …";
      out[i] = '<button type="button" class="tv" data-goeng="'+p.b+'~'+p.c+'~'+p.v+'"><b>'+esc(refLabel(r))+'</b><span>'+fmt(t)+'</span></button>';
      if(--left === 0) cb(out.join(""));
    });
  });
}
XMODE.topics = function(){
  view.innerHTML = '<h3 class="bib-h">Topics</h3><div class="bib-load"><span></span><span></span><span></span></div>';
  script("bible/topics.js", function(){ return !!TOPICS; }, function(ok){
    if(mode !== "topics") return;
    if(!ok){ view.innerHTML = '<p class="vs-none">The topics could not be loaded.</p>'; return; }
    if(st.tp){
      var found = null; TOPICS.forEach(function(c){ c[1].forEach(function(t){ if(t[0] === st.tp) found = [c[0], t]; }); });
      if(!found){ st.tp = ""; return XMODE.topics(); }
      view.innerHTML = '<button type="button" class="btn-sm" data-tpb="1">← All topics</button><p class="eyebrow tp-c">'+esc(found[0])+'</p><h3 class="bib-h">'+esc(found[1][0])+'</h3>'+
        '<p class="cmp-note">The passages readers most often connect with this topic, strongest first. <button type="button" class="linkbtn" data-tps="'+esc(found[1][0])+'">Search the series for “'+esc(found[1][0])+'” →</button></p><div class="tv-list" id="tvList"><div class="bib-load"><span></span><span></span><span></span></div></div><p class="vs-cite">Topics: OpenBible.info (CC BY), from readers’ votes.</p>';
      verseList(found[1][1], function(h){ var l = $("#tvList", view); if(l) l.innerHTML = h; });
      return;
    }
    view.innerHTML = '<h3 class="bib-h">Topics</h3><p class="cmp-note">'+TOPICS.reduce(function(n, c){ return n + c[1].length; }, 0)+' themes with the passages most often linked to them.</p><form class="bs-form" role="search" id="tpForm"><label class="vh" for="tpQ">Find a topic</label><input id="tpQ" type="search" placeholder="Find a topic…" autocomplete="off"></form>'+
      TOPICS.map(function(c){ return '<section class="tp-sec"><p class="shelf-h">'+esc(c[0])+'</p><div class="tp-chips">'+c[1].map(function(t){ return '<button type="button" class="chip" data-tp="'+esc(t[0])+'">'+esc(t[0])+'</button>'; }).join("")+'</div></section>'; }).join("");
    $("#tpQ", view).addEventListener("input", function(){ var q = normT(this.value); $$("[data-tp]", view).forEach(function(b){ b.hidden = q && normT(b.textContent).indexOf(q) < 0; }); $$(".tp-sec", view).forEach(function(s){ s.hidden = !$$("[data-tp]:not([hidden])", s).length; }); });
    $("#tpForm", view).addEventListener("submit", function(e){ e.preventDefault(); var b = $("[data-tp]:not([hidden])", view); if(b) b.click(); });
  });
};
view.addEventListener("click", function(e){
  var t;
  if((t = e.target.closest("[data-tp]"))){ st.tp = t.dataset.tp; save(); XMODE.topics(); window.scrollTo({top: art.getBoundingClientRect().top + scrollY - 70}); return; }
  if((t = e.target.closest("[data-tpb]"))){ st.tp = ""; save(); XMODE.topics(); return; }
  if((t = e.target.closest("[data-tps]"))){ var q = $("#q"); if(q){ q.value = t.dataset.tps; q.dispatchEvent(new Event("input")); document.body.classList.add("search-on"); q.focus(); } return; }
  if((t = e.target.closest(".tv[data-goeng]"))){ var p = t.dataset.goeng.split("~"); goEng(p[0], +p[1], +p[2]); return; }
});

/* ---------- people and places of the Bible ---------- */
var NAMES = null, NIDX = null; window.__NAMES = function(d){ NAMES = d; };
function namesIndex(){
  if(NIDX) return NIDX; NIDX = {};
  ["p", "l"].forEach(function(k){ Object.keys(NAMES[k]).forEach(function(id){ NAMES[k][id].r.forEach(function(r){ (NIDX[r] = NIDX[r] || []).push([k, id]); }); }); });
  return NIDX;
}
function nm(id){ var x = NAMES.p[id] || NAMES.l[id]; return x ? x.n : id.split("@")[0]; }
function geoXY(g){ var k = Math.cos(40 * Math.PI / 180), s = 1000 / (74 * k); return [(g[1] + 12) * k * s, (60.5 - g[0]) * s]; }
function nameLinks(ids){ return (ids||[]).map(function(id){ var known = NAMES.p[id] || NAMES.l[id]; return known ? '<button type="button" class="chip" data-nid="'+esc(id)+'">'+esc(nm(id))+'</button>' : '<span class="chip off">'+esc(nm(id))+'</span>'; }).join(""); }
function articleHTML(a){ return esc(a).replace(/\{\{([1-3A-Z]{3}\d+:\d+)\|([^}]*)\}\}/g, function(_, r, lab){ var p = refParts(r); return p ? '<button type="button" class="sref" data-sref="'+p.b+'~'+p.c+'~'+p.v+'">'+lab+'</button>' : lab; }); }
XMODE.names = function(){
  view.innerHTML = '<h3 class="bib-h">People and places</h3><div class="bib-load"><span></span><span></span><span></span></div>';
  script("bible/names.js", function(){ return !!NAMES; }, function(ok){
    if(mode !== "names") return;
    if(!ok){ view.innerHTML = '<p class="vs-none">The directory could not be loaded.</p>'; return; }
    if(st.nid && (NAMES.p[st.nid] || NAMES.l[st.nid])) return nameProfile(st.nid);
    var kind = st.nk || "p", q = st.nq || "";
    view.innerHTML = '<h3 class="bib-h">People and places of the Bible</h3><p class="cmp-note">'+Object.keys(NAMES.p).length+' people and '+Object.keys(NAMES.l).length+' places, each with family, story and every mention.</p>'+
      '<div class="cm-chips" role="group" aria-label="Show"><button type="button" class="chip" data-nk="p" aria-pressed="'+(kind==="p")+'">People</button><button type="button" class="chip" data-nk="l" aria-pressed="'+(kind==="l")+'">Places</button></div>'+
      '<form class="bs-form" role="search" id="nmForm"><label class="vh" for="nmQ">Find a name</label><input id="nmQ" type="search" placeholder="'+(kind === "p" ? "Abraham, Mary, Paul…" : "Bethlehem, Jericho, Corinth…")+'" value="'+esc(q)+'" autocomplete="off"></form><div id="nmList"></div>';
    var inp = $("#nmQ", view); inp.addEventListener("input", function(){ st.nq = this.value; listNames(); }); $("#nmForm", view).addEventListener("submit", function(e){ e.preventDefault(); var b = $("#nmList [data-nid]", view); if(b) b.click(); });
    listNames();
  });
};
function listNames(){
  var kind = st.nk || "p", q = normT(st.nq || ""), D = NAMES[kind], box = $("#nmList", view); if(!box) return;
  var ids = Object.keys(D).filter(function(id){ var x = D[id]; return !q || normT(x.n).indexOf(q) === 0 || (x.al||[]).some(function(a){ return normT(a).indexOf(q) === 0; }); });
  ids.sort(function(a, b){ var x = D[a], y = D[b]; return q ? (x.n.length - y.n.length) || (y.rc - x.rc) : (y.rc - x.rc); });
  var shown = ids.slice(0, q ? 60 : 48);
  box.innerHTML = (q ? "" : '<p class="shelf-h">Most mentioned</p>') + '<div class="nm-grid">' + shown.map(function(id){ var x = D[id];
    return '<button type="button" class="nm-card" data-nid="'+esc(id)+'"><b>'+esc(x.n)+'</b><span>'+esc(x.b || x.bb || x.d || x.area || "")+'</span><small>'+x.rc+' mention'+(x.rc === 1 ? "" : "s")+(x.al ? " · also " + esc(x.al.slice(0, 2).join(", ")) : "")+'</small></button>'; }).join("") + '</div>' + (ids.length > shown.length ? '<p class="cmp-note">'+(ids.length - shown.length)+' more: type to narrow the list.</p>' : "");
}
function nameProfile(id){
  var isP = !!NAMES.p[id], x = NAMES.p[id] || NAMES.l[id];
  var fam = isP ? [["Parents", x.fa], ["Siblings", x.sib], ["Spouses", x.sp], ["Children", x.ch]].filter(function(f){ return f[1] && f[1].length; }) : [];
  var map = "";
  if(!isP && x.g){ var xy = geoXY(x.g), w = 150, h = 110; map = '<figure class="nm-map"><svg viewBox="'+(xy[0]-w/2).toFixed(1)+' '+(xy[1]-h/2).toFixed(1)+' '+w+' '+h+'" role="img" aria-label="Location of '+esc(x.n)+'"><use href="#landR" class="land"/><circle cx="'+xy[0].toFixed(1)+'" cy="'+xy[1].toFixed(1)+'" r="2.6" class="nm-pin"/><circle cx="'+xy[0].toFixed(1)+'" cy="'+xy[1].toFixed(1)+'" r="7" class="nm-halo"/></svg><figcaption>'+x.g[0].toFixed(2)+'°N, '+x.g[1].toFixed(2)+'°E'+(x.area ? " · " + esc(x.area) : "")+'</figcaption></figure>'; }
  view.innerHTML = '<button type="button" class="btn-sm" data-nback="1">← '+(isP ? "People" : "Places")+'</button>'+
    '<header class="nm-h"><p class="eyebrow">'+esc(isP ? (x.tr || x.ty || "Person") : (x.area || "Place"))+'</p><h3>'+esc(x.n)+'</h3>'+(x.al ? '<p class="nm-al">Also: '+esc(x.al.join(", "))+'</p>' : "")+(x.b ? '<p class="nm-b">'+esc(x.b)+'</p>' : "")+'</header>'+ map +
    (fam.length ? '<div class="nm-fam">' + fam.map(function(f){ return '<div><p class="shelf-h">'+f[0]+'</p><div class="nm-chips">'+nameLinks(f[1])+'</div></div>'; }).join("") + '</div>' : "")+
    (x.a ? '<div class="nm-a"><p>'+articleHTML(x.a)+'</p></div>' : (x.s ? '<p class="nm-a">'+esc(x.s)+'</p>' : ""))+
    '<p class="shelf-h">Mentioned '+x.rc+' time'+(x.rc===1?"":"s")+(x.rc > x.r.length ? " · first "+x.r.length+" shown" : "")+'</p><div class="nm-refs">'+x.r.map(function(r){ var p = refParts(r); return p ? '<button type="button" class="chip" data-goeng="'+p.b+'~'+p.c+'~'+p.v+'">'+esc(refLabel(r))+'</button>' : ""; }).join("")+'</div>'+
    '<p class="vs-cite">Data: STEPBible.org TIPNR (Tyndale House, Cambridge), CC BY 4.0. Locations follow OpenBible.info and are often approximate or debated.</p>';
  window.scrollTo({top: art.getBoundingClientRect().top + scrollY - 70});
}
function openName(id){ st.nid = id; save(); if(mode !== "names"){ mode = "names"; if(location.hash !== "#bible") location.hash = "bible"; setTimeout(function(){ render(); toolsMark(); }, 60); } else nameProfile(id); }
view.addEventListener("click", function(e){
  var t;
  if((t = e.target.closest("[data-nk]"))){ st.nk = t.dataset.nk; st.nq = ""; save(); XMODE.names(); return; }
  if((t = e.target.closest("[data-nid]"))){ openName(t.dataset.nid); return; }
  if((t = e.target.closest("[data-nback]"))){ st.nid = ""; save(); XMODE.names(); return; }
  if((t = e.target.closest(".nm-refs [data-goeng]"))){ var p = t.dataset.goeng.split("~"); goEng(p[0], +p[1], +p[2]); return; }
});
/* names in the verse panel (Links tab) */
function namesFor(c, cb){
  var ob = origBook(c.b) || c.b, ch = engCh(c.ed, c.b, c.c);
  script("bible/names.js", function(){ return !!NAMES; }, function(ok){ if(!ok) return cb(""); var hits = namesIndex()[ob + ch + ":" + c.v] || []; if(!hits.length) return cb("");
    cb('<p class="vs-lang">People and places in this verse</p><div class="nm-chips vs-names">' + hits.slice(0, 16).map(function(h){ return '<button type="button" class="chip" data-vnid="'+esc(h[1])+'">'+(h[0] === "l" ? "📍 " : "")+esc(nm(h[1]))+'</button>'; }).join("") + '</div>'); });
}
sheet.addEventListener("click", function(e){ var t = e.target.closest("[data-vnid]"); if(!t) return; e.stopPropagation(); var id = t.dataset.vnid; closeSheet(); openName(id); }, true);

/* ---------- Gospel harmony ---------- */
var HG = ["MAT", "MAR", "LUK", "JOH"], HGN = ["Matthew", "Mark", "Luke", "John"];
function hRefs(s){ if(!s) return []; var c0 = 0; return s.split(/,\s*/).map(function(part){ var m = part.match(/^(?:(\d+):)?(\d+)(?:-(?:(\d+):)?(\d+))?$/); if(!m) return null; var c = m[1] ? +m[1] : c0; c0 = c; var v1 = +m[2], c2 = m[3] ? +m[3] : c, v2 = m[4] ? +m[4] : v1; return [c, v1, c2, v2]; }).filter(Boolean); }
XMODE.harmony = function(){
  var H = BX2.harmony || [];
  if(st.hi != null && H[st.hi]){
    var ev = H[st.hi], cols = [];
    HG.forEach(function(b, k){ if(ev[2 + k]) cols.push([b, ev[2 + k]]); });
    view.innerHTML = '<button type="button" class="btn-sm" data-hb="1">← All events</button><p class="eyebrow tp-c">'+esc(ev[0])+'</p><h3 class="bib-h">'+esc(ev[1])+'</h3>'+
      '<label class="vs-dtog"><input type="checkbox" id="hgDiff"'+(st.hdiff === false ? "" : " checked")+'> Highlight wording found in only one Gospel</label>'+
      '<div class="hg-cols n'+cols.length+'" id="hgCols">'+cols.map(function(c){ return '<section class="hg-col" data-hb2="'+c[0]+'"><p class="hg-h"><b>'+HGN[HG.indexOf(c[0])]+'</b> <span>'+esc(c[1].replace(/-/g, "–"))+'</span></p><div class="hg-t"><div class="bib-load"><span></span><span></span><span></span></div></div></section>'; }).join("")+'</div>'+
      '<nav class="bib-pn">'+(st.hi > 0 ? '<button type="button" data-hstep="-1"><small>Previous</small><b>'+esc(H[st.hi-1][1])+'</b></button>' : "<span></span>")+(st.hi < H.length-1 ? '<button type="button" class="nx" data-hstep="1"><small>Next</small><b>'+esc(H[st.hi+1][1])+'</b></button>' : "<span></span>")+'</nav>';
    var texts = [], left = cols.length;
    cols.forEach(function(c, i){
      var ed = ED[st.ed].idx[c[0]] != null ? st.ed : "web", src = srcOf(ed, c[0]);
      load(src, c[0], function(d){
        var vs = [];
        hRefs(c[1]).forEach(function(r){ for(var ch = r[0]; ch <= r[2]; ch++) (chapter(d, ch)||[]).forEach(function(v){ if((ch > r[0] || v[0] >= r[1]) && (ch < r[2] || v[0] <= r[3])) vs.push([ch, v]); }); });
        texts[i] = vs; if(--left === 0) hgRender(cols, texts, ed);
      });
    });
    return;
  }
  var secs = [], by = {};
  H.forEach(function(ev, i){ if(!by[ev[0]]){ by[ev[0]] = []; secs.push(ev[0]); } by[ev[0]].push([i, ev]); });
  view.innerHTML = '<h3 class="bib-h">Gospel harmony</h3><p class="cmp-note">'+H.length+' events in the life of Jesus, with the accounts of Matthew, Mark, Luke and John side by side.</p>'+
    secs.map(function(s){ return '<section class="tp-sec"><p class="shelf-h">'+esc(s)+'</p><ul class="hg-list">'+by[s].map(function(x){ var ev = x[1]; return '<li><button type="button" data-hi="'+x[0]+'"><b>'+esc(ev[1])+'</b><span>'+HG.map(function(b, k){ return '<i class="'+(ev[2+k] ? "on" : "")+'" title="'+HGN[k]+(ev[2+k] ? " "+ev[2+k] : ": not recorded")+'">'+HGN[k][0]+'</i>'; }).join("")+'</span></button></li>'; }).join("")+'</ul></section>'; }).join("");
};
function hgRender(cols, texts, ed){
  var box = $("#hgCols", view); if(!box) return;
  var bags = texts.map(function(vs){ var s = {}; vs.forEach(function(x){ normT(x[1][1]).split(/[^\p{L}\p{N}]+/u).forEach(function(w){ if(w) s[w] = 1; }); }); return s; });
  var diff = st.hdiff !== false && cols.length > 1;
  $$(".hg-col", box).forEach(function(col, i){
    var others = bags.filter(function(_, k){ return k !== i; });
    $(".hg-t", col).innerHTML = texts[i].length ? texts[i].map(function(x){ var t = x[1][1];
      var h = diff ? esc(t).replace(/[\p{L}\p{N}’']+/gu, function(w){ var n = normT(w).replace(/[’']/g, ""); return n.length > 3 && !others.some(function(o){ return o[n]; }) ? '<mark class="hg-u">'+w+'</mark>' : w; }) : fmt(t);
      return '<p><sup>'+x[0]+':'+x[1][0]+'</sup> '+h+'</p>'; }).join("") : '<p class="vs-none">Text not available in this edition.</p>';
  });
}
view.addEventListener("click", function(e){
  var t;
  if((t = e.target.closest("[data-hi]"))){ st.hi = +t.dataset.hi; save(); XMODE.harmony(); window.scrollTo({top: art.getBoundingClientRect().top + scrollY - 70}); return; }
  if((t = e.target.closest("[data-hb]"))){ st.hi = null; save(); XMODE.harmony(); return; }
  if((t = e.target.closest("[data-hstep]"))){ st.hi += +t.dataset.hstep; save(); XMODE.harmony(); window.scrollTo({top: art.getBoundingClientRect().top + scrollY - 70}); return; }
});
view.addEventListener("change", function(e){ if(e.target.id === "hgDiff"){ st.hdiff = e.target.checked; save(); XMODE.harmony(); } });

/* ---------- Psalter cycles ---------- */
function goGreekPs(c){ var ed = ED[st.ed].idx.PSA != null ? st.ed : "web", src = srcOf(ed, "PSA"); go(ed, "PSA", GREEKPS[src] ? c : greekToHeb(c), 1); }
function psRangeBtns(s){ return s.split(/,\s*/).map(function(part){ var m = part.match(/^(\d+)(?::(\d+))?/); return m ? '<button type="button" class="lc-ref" data-goeng2="PSA~'+m[1]+'~'+(m[2]||0)+'">'+esc(part.replace("-", "–"))+'</button>' : ""; }).join(" "); }
function rangePs(s){ var m = s.match(/^(\d+)(?::[\d-]+)?(?:-(\d+))?$/); if(!m) return s; if(/:/.test(s)) return s; var a = +m[1], z = +(m[2]||m[1]), out = []; for(var i=a;i<=z;i++) out.push(String(i)); return out.join(", "); }
XMODE.psalter = function(){
  var K = BX2.kath || [], B = BX2.bcp30 || [], d = new Date(), dom = Math.min(30, d.getDate());
  var start = new Date(2026, 0, 1), kd = ((Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 864e5) % 20) + 20) % 20;
  var tk = K[kd], tb = B[dom - 1];
  view.innerHTML = '<h3 class="bib-h">Praying the Psalms</h3><p class="cmp-note">Two ancient ways of praying the whole Psalter in order.</p>'+
    '<section class="ps-card"><p class="eyebrow">Book of Common Prayer · day '+dom+' of the month</p><h4>Morning and Evening Prayer</h4><p><span>Morning</span>'+psRangeBtns(rangePs(tb[0]))+'</p><p><span>Evening</span>'+psRangeBtns(rangePs(tb[1]))+'</p>'+
    '<p class="cmp-note">The 1662 Prayer Book divides the 150 psalms over thirty days; on the 31st, day 30 is repeated. Numbers are Hebrew (as in most English Bibles).</p></section>'+
    '<section class="ps-card"><p class="eyebrow">Orthodox Psalter · a 20-day cycle</p><h4>Kathisma '+(kd+1)+'</h4><p>'+(function(){ var out = []; for(var i=tk[0];i<=tk[1];i++) out.push('<button type="button" class="lc-ref" data-gps="'+i+'">'+i+'</button>'); return out.join(" "); })()+'</p>'+
    '<p class="cmp-note">The Orthodox Psalter is divided into twenty kathismata (“sessions”), numbered in the Greek way. In church the whole Psalter is read each week (twice in Lent); here, one kathisma a day takes you through it every twenty days.</p></section>'+
    '<details class="bib-about"><summary>All twenty kathismata</summary><ol class="ps-k">'+K.map(function(k, i){ return '<li'+(i === kd ? ' class="on"' : "")+'><b>Kathisma '+(i+1)+'</b> Psalms '+k[0]+(k[1] !== k[0] ? "–"+k[1] : "")+' <button type="button" class="linkbtn" data-gps="'+k[0]+'">Read →</button></li>'; }).join("")+'</ol></details>'+
    '<details class="bib-about"><summary>The thirty-day Prayer Book psalter</summary><ol class="ps-k">'+B.map(function(x, i){ return '<li'+(i === dom-1 ? ' class="on"' : "")+'><b>Day '+(i+1)+'</b> Morning '+esc(x[0])+' · Evening '+esc(x[1])+'</li>'; }).join("")+'</ol></details>';
};
view.addEventListener("click", function(e){ var t = e.target.closest("[data-gps]"); if(t) goGreekPs(+t.dataset.gps); });

/* ---------- daily readings: Catholic, Orthodox, Anglican ---------- */
var LECT2 = null; window.__LECT2 = function(d){ LECT2 = d; };
function gJDN(y, m, d){ var a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3; return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045; }
function jJDN(y, m, d){ var a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3; return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - 32083; }
function paschaJDN(y){ var a = y % 4, b = y % 7, c = y % 19, d = (19 * c + 15) % 30, e = (2 * a + 4 * b - d + 34) % 7, mo = Math.floor((d + e + 114) / 31), da = (d + e + 114) % 31 + 1; return jJDN(y, mo, da); }
function wd(p){ return (7 + p % 7) % 7; }
function around(p){ var w = wd(p); return [p - w - 1, p - 7 + ((7 - w) % 7), p + 7 - ((w + 1) % 7), p + 7 - w]; }
function OYear(year){
  var Y = {year: year, P: paschaJDN(year), PP: paschaJDN(year - 1), NP: paschaJDN(year + 1), floats: [], noDaily: {}, reserves: [], par: [499], nopar: [499]};
  function pd(m, d, y){ return gJDN(y || year, m, d) - Y.P; }
  Y.theophany = pd(1, 6, year + 1); Y.annun = pd(3, 25); Y.nativity = pd(12, 25);
  var p = pd(7, 16), w = wd(p); Y.f6 = w < 4 ? p - w : p + 7 - w;
  Y.elev = pd(9, 14); Y.nativTheo = pd(9, 8);
  p = pd(10, 11); w = wd(p); if(w > 0) p += 7 - w; Y.f7 = p;
  p = pd(10, 26); Y.demetrius = p - wd(p) - 1;
  p = pd(11, 1); Y.unmerc = p + 7 - wd(p);
  w = wd(Y.nativity); Y.forefathers = Y.nativity - 14 + ((7 - w) % 7);
  Y.jump = 168 - (Y.elev + 7 - wd(Y.elev));
  function fl(i, p){ Y.floats.push([i, p]); }
  fl(1001, Y.f6); fl(1002, Y.f7); fl(1003, Y.demetrius); fl(1004, Y.unmerc);
  var s = around(Y.elev);
  if(s[0] === Y.nativTheo) fl(1005, Y.elev - 1); else fl(1006, s[0]);
  fl(1007, s[1]); fl(1008, s[2]); fl(1009, s[3]); fl(1010, Y.forefathers);
  s = around(Y.nativity);
  if(Y.nativity - 1 === s[0]){ fl(1013, Y.nativity - 2); fl(1012, s[1]); fl(1015, Y.nativity - 1); }
  else if(Y.nativity - 1 === s[1]){ fl(1013, Y.nativity - 3); fl(1011, s[0]); fl(1016, Y.nativity - 1); }
  else { fl(1014, Y.nativity - 1); fl(1011, s[0]); fl(1012, s[1]); }
  var t = around(Y.theophany), satAfter = s[2], sunAfter = s[3];
  switch(wd(Y.nativity)){
    case 0: fl(1017, satAfter); fl(1020, Y.nativity + 1); fl(1024, t[1]); fl(1026, Y.theophany - 1); break;
    case 1: fl(1017, satAfter); fl(1021, sunAfter); fl(1023, Y.theophany - 5); fl(1026, Y.theophany - 1); break;
    case 2: fl(1019, satAfter); fl(1021, sunAfter); fl(1027, t[0]); fl(1023, Y.theophany - 5); fl(1025, Y.theophany - 2); break;
    case 3: fl(1019, satAfter); fl(1021, sunAfter); fl(1022, t[0]); fl(1028, t[1]); fl(1025, Y.theophany - 3); break;
    case 4: case 5: fl(1019, satAfter); fl(1021, sunAfter); fl(1022, t[0]); fl(1024, t[1]); fl(1026, Y.theophany - 1); break;
    case 6: fl(1018, Y.nativity + 6); fl(1021, sunAfter); fl(1022, t[0]); fl(1024, t[1]); fl(1026, Y.theophany - 1); break;
  }
  fl(1029, t[2]); fl(1030, t[3]);
  var mart = pd(1, 31); w = wd(mart); if(w !== 0) mart = mart - 7 + ((7 - w) % 7); fl(1031, mart);
  switch(wd(Y.annun)){ case 6: fl(1032, Y.annun - 1); fl(1033, Y.annun); break; case 0: fl(1034, Y.annun); break; case 1: fl(1035, Y.annun); break; default: fl(1036, Y.annun - 1); fl(1037, Y.annun); }
  [t[1], t[3], Y.theophany - 5, Y.theophany - 1, Y.theophany].forEach(function(x){ Y.noDaily[x] = 1; });
  if(t[2] === Y.theophany + 1) Y.noDaily[Y.theophany + 1] = 1;
  Y.noDaily[Y.forefathers] = 1;
  [s[1], Y.nativity - 1, Y.nativity, Y.nativity + 1, s[3]].forEach(function(x){ Y.noDaily[x] = 1; });
  if(wd(Y.annun) === 6) Y.noDaily[Y.annun] = 1;
  Y.extra = Math.floor((Y.NP - Y.P - 84 - t[3]) / 7);
  if(Y.extra > 0){ for(var i = Y.forefathers + Y.jump + 7; i <= 266; i += 7) Y.reserves.push(i); var rem = Y.extra - Y.reserves.length; if(rem > 0) for(i = 175 - rem * 7; i < 169; i += 7) Y.reserves.push(i); }
  [[2,24],[2,27],[3,9],[3,31],[4,7],[4,23],[4,25],[4,30]].forEach(function(md){ var p2 = pd(md[0], md[1]), w2 = wd(p2); if(p2 > -44 && p2 < -7 && w2 > 1){ Y.par.push(p2 - 1); Y.nopar.push(p2); } });
  Y.floatIdx = function(p){ for(var i=0;i<Y.floats.length;i++) if(Y.floats[i][1] === p) return Y.floats[i][0]; return 499; };
  return Y;
}
function orthodoxDay(date){
  var y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate(), jdn = gJDN(y, m, d), py = y, pdist = jdn - paschaJDN(y);
  if(pdist < -77){ py = y - 1; pdist = jdn - paschaJDN(py); }
  var Y = OYear(py), wk = wd(pdist), O = LECT2.orth, fi = Y.floatIdx(pdist);
  var titles = [], saints = [], feasts = [], lvl = -2, fast = 0;
  O.d.forEach(function(r){ if(r[0] === pdist || (fi !== 0 && fi !== 499 && r[0] === fi) || (r[1] === m && r[2] === d)){
    if(r[3]) titles.push(r[4] ? r[3] + ": " + r[4] : r[3]); if(r[7]) saints.push(r[7]); if(r[5]) feasts.push(r[5]); if(r[6] > lvl) lvl = r[6]; if(r[8] > fast) fast = r[8]; } });
  var noMem = (pdist === -36 || pdist === -29 || pdist === -22) && m === 3 && [9, 24, 25, 26].indexOf(d) >= 0;
  var jump = pdist > around(Y.elev)[3] ? Y.jump : 0, eP, gP;
  if(Y.noDaily[pdist]){ eP = gP = 499; }
  else {
    var limit = 272;
    eP = pdist === 252 ? Y.forefathers : pdist > limit ? jdn - Y.NP : pdist;
    if(wd(Y.theophany) < 2) limit = 279;
    var sa = around(Y.theophany)[3];
    if(pdist === 245 - Y.jump) gP = Y.forefathers + Y.jump;
    else if(pdist > sa && wk === 0 && Y.extra > 1){ var i = Math.floor((pdist - sa) / 7); gP = Y.reserves[i - 1]; }
    else if(pdist + jump > limit) gP = jdn - Y.NP;
    else gP = pdist + jump;
  }
  var hasMG = true, mg = 0;
  if(wk === 0){ if(pdist > -8 && pdist < 50){ hasMG = false; } else if(lvl < 7){ var pb = pdist < 0 ? jdn - Y.PP : pdist, x = (pb - 49) % 77; if(x === 0) x = 77; hasMG = false; mg = Math.floor(x / 7); } }
  var par = Y.par.indexOf(pdist) >= 0, nopar = Y.nopar.indexOf(pdist) >= 0, nd = new Date(y, m - 1, d + 1);
  var rows = O.r.filter(function(r){
    var src = r[3], dep = noMem && r[4] === "Departed";
    if(r[2] === gP && src === "Gospel" && !dep) return true;
    if(r[2] === eP && src === "Epistle" && !dep) return true;
    if(r[2] === pdist && src !== "Epistle" && src !== "Gospel") return true;
    if(fi !== 499 && r[2] === fi) return true;
    if(mg && r[2] === mg + 700) return true;
    if(par && r[0] === nd.getMonth() + 1 && r[1] === nd.getDate() && src === "Vespers") return true;
    if(r[0] === m && r[1] === d){ if(!hasMG && src === "Matins Gospel") return false; if(nopar && src === "Vespers") return false; if(m === 3 && d === 26 && [1, 2, 4].indexOf(wk) >= 0 && r[4] === "Theotokos") return false; return true; }
    return false;
  }).sort(function(a, b){ return a[6] - b[6]; });
  if(pdist > -42 && pdist < -7 && lvl < 7){ var k = rows.findIndex(function(r){ return r[3] === "Matins Gospel"; }); if(k > 0) rows.unshift(rows.splice(k, 1)[0]); }
  var tone = 0; if(!(pdist > -9 && pdist < 7)){ var pb2 = pdist < 0 ? jdn - Y.PP : pdist, x2 = pb2 % 56; if(x2 === 0) x2 = 56; tone = Math.floor(x2 / 7); }
  return {titles: titles, saints: saints, feasts: feasts, fast: fast, tone: tone, rows: rows};
}
var FASTS = ["No fast", "Fast", "Lenten fast", "Apostles’ fast", "Dormition fast", "Nativity fast", "Fast", "Fast-free"];
function lectRef(s){
  var t = String(s).replace(/(\d)\.(\d)/g, "$1:$2").replace(/^1 Kgs/, "1 Samuel").replace(/^2 Kgs/, "2 Samuel").replace(/^3 Kgs/, "1 Kings").replace(/^4 Kgs/, "2 Kings"), m = t.match(/^((?:[1-4]\s)?[A-Za-z]+\.?)\s*(\d+)(?::(\d+))?/), r = m ? parseRef(m[1] + " " + m[2] + (m[3] ? ":" + m[3] : "")) : null;
  return r ? '<button type="button" class="lc-ref" data-goeng2="'+r.b+'~'+r.c+'~'+(r.v||0)+'">'+esc(t)+'</button>' : '<span class="lc-ref">'+esc(t)+'</span>';
}
function orthHTML(o){
  var h = '<div class="lc-meta">'+(o.tone ? '<span>Tone '+o.tone+'</span>' : "")+'<span>'+esc(FASTS[o.fast] || "")+'</span></div>';
  if(o.feasts.length){ h += '<h4 class="lc-t">'+esc(o.feasts[0])+'</h4>'; if(o.feasts.length > 1) h += '<p class="lc-f">'+o.feasts.slice(1).map(esc).join(" · ")+'</p>'; if(o.titles.length) h += '<p class="lc-sub">'+esc(o.titles[0])+'</p>'; }
  else if(o.titles.length) h += '<h4 class="lc-t">'+esc(o.titles[0])+'</h4>';
  h += '<ul class="lc-l">' + (o.rows.length ? o.rows.map(function(r){ return '<li><span>'+esc(r[3] + (r[4] ? " · " + r[4] : ""))+'</span>'+(r[5] ? lectRef(r[5]) : "")+'</li>'; }).join("") : '<li>No readings for this day.</li>') + '</ul>';
  if(o.saints.length) h += '<p class="lc-o">Commemorations</p><p class="lc-s">'+o.saints.slice(0, 12).map(esc).join(" · ")+'</p>';
  return h;
}
function cathHTML(key){
  var c = LECT2.cath[key]; if(!c) return '<p class="vs-none">This date is outside the range of the Catholic readings data (August 2025 to December 2027). The USCCB publishes the readings for every day.</p>';
  var cel = c[1].split("|");
  var h = '<div class="lc-meta"><span>'+esc(c[0])+'</span>'+(cel[1] ? '<span>'+esc(cel[1].replace("_", " ").toLowerCase())+'</span>' : "")+'</div>'+(cel[0] ? '<h4 class="lc-t">'+esc(cel[0])+'</h4>' : "");
  h += '<ul class="lc-l">'+[["First reading", c[2]], ["Psalm", c[3]], ["Second reading", c[4]], ["Gospel", c[5]]].filter(function(x){ return x[1]; }).map(function(x){ return '<li><span>'+x[0]+'</span>'+lectRef(x[1])+'</li>'; }).join("")+'</ul>';
  return h;
}
var _today = XMODE.today;
XMODE.today = function(){
  var tr = st.lt || ({catholic: "cath", orthodox: "orth"}[get("hcc.trad", "")] || "bcp");
  if(tr === "bcp") { _today(); setTimeout(function(){ lectTabs("bcp"); }, 0); var w = setInterval(function(){ if($(".lc-card", view)){ clearInterval(w); lectTabs("bcp"); } }, 80); setTimeout(function(){ clearInterval(w); }, 4000); return; }
  view.innerHTML = '<h3 class="bib-h">Daily readings</h3><div class="bib-load"><span></span><span></span><span></span></div>';
  script("bible/lect2.js", function(){ return !!LECT2; }, function(ok){
    if(mode !== "today") return;
    if(!ok){ view.innerHTML = '<p class="vs-none">The readings could not be loaded.</p>'; return; }
    var d = st.ld ? new Date(st.ld + "T00:00:00") : new Date();
    view.innerHTML = '<h3 class="bib-h">Daily readings</h3><div class="lc-nav"><button type="button" class="btn-sm" data-ld="-1" aria-label="Previous day">←</button><label class="vh" for="lcDate">Date</label><input type="date" id="lcDate" value="'+ymd(d)+'"><button type="button" class="btn-sm" data-ld="1" aria-label="Next day">→</button><button type="button" class="btn-sm" data-ld="0">Today</button></div>'+
      (tr === "cath" ? '<p class="cmp-note">The readings at Mass in the Roman Catholic Church (Lectionary for Mass, United States).</p><section class="lc-card">'+cathHTML(ymd(d))+'</section><p class="vs-cite">References: catholic-readings-api (MIT), checked against the USCCB calendar. Readings open in the edition you are using; for the approved translation see bible.usccb.org.</p>'
                     : '<p class="cmp-note">The Orthodox lectionary as used by the Orthodox Church in America (new calendar), with the day’s feasts and saints.</p><section class="lc-card">'+orthHTML(orthodoxDay(d))+'</section><p class="vs-cite">Calendar data: orthocal (MIT), from the OCA’s published tables. Rules ported from the orthocal program; on rare days with special services some readings may be missing.</p>');
    lectTabs(tr);
  });
};
function lectTabs(tr){
  if(mode !== "today" || $(".lc-tabs", view)) return;
  var h = $(".bib-h", view); if(!h) return;
  h.insertAdjacentHTML("afterend", '<div class="cm-chips lc-tabs" role="group" aria-label="Tradition">'+[["cath","Catholic"],["orth","Orthodox"],["bcp","Anglican (BCP)"]].map(function(x){ return '<button type="button" class="chip" data-lt="'+x[0]+'" aria-pressed="'+(x[0] === tr)+'">'+x[1]+'</button>'; }).join("")+'</div>');
}
view.addEventListener("click", function(e){ var t = e.target.closest("[data-lt]"); if(!t) return; st.lt = t.dataset.lt; save(); XMODE.today(); });
window.HCCOrthodoxDay = function(y, m, d, cb){ script("bible/lect2.js", function(){ return !!LECT2; }, function(){ cb(orthodoxDay(new Date(y, m - 1, d))); }); };

/* ---------- long-press a verse ---------- */
var lpT = null, lpEl = null, lpX = 0, lpY = 0, lpDone = false;
view.addEventListener("touchstart", function(e){ var el = e.target.closest(".bv"); if(!el || e.touches.length !== 1) return; lpEl = el; lpDone = false; lpX = e.touches[0].clientX; lpY = e.touches[0].clientY; clearTimeout(lpT);
  lpT = setTimeout(function(){ lpDone = true; haptic("strong"); if(st.study) selectVerse(lpEl); else openSheet(lpEl); }, 480); }, {passive: true});
view.addEventListener("touchmove", function(e){ if(lpT && (Math.abs(e.touches[0].clientX - lpX) > 10 || Math.abs(e.touches[0].clientY - lpY) > 10)){ clearTimeout(lpT); lpT = null; } }, {passive: true});
view.addEventListener("touchend", function(e){ clearTimeout(lpT); lpT = null; if(lpDone){ e.preventDefault(); lpDone = false; } });
view.addEventListener("contextmenu", function(e){ if(e.target.closest(".bv") && "ontouchstart" in window) e.preventDefault(); });

/* ---------- tool buttons ---------- */
if(tools){
  tools.addEventListener("click", function(e){ var b = e.target.closest("[data-red]"); if(!b) return; e.stopPropagation(); redToggle(!st.red); b.setAttribute("aria-pressed", String(!!st.red)); }, true);
  var rb = $("[data-red]", tools); if(rb) rb.setAttribute("aria-pressed", String(!!st.red));
}
