(function(){
"use strict";
var $ = function(s,r){return (r||document).querySelector(s)};
var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var APP = window.HCCApp && window.HCCApp.isApp ? window.HCCApp : null;
function hap(k){ try{ if(APP) APP.haptic(k||"tick"); }catch(e){} }
function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]}); }
function get(k,d){ try{ var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } }
function put(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function fy(y){ return y < 0 ? (-y) + " BC" : y < 1000 ? "AD " + y : String(y); }
var EP = window.__EP__ || {}, X = window.__X__ || {}, X2 = window.__X2__ || {}, X3 = window.__X3__ || {}, SE = window.__SEASONS__ || [];

/* ---------- accent colours ---------- */
var ACC = [["orange","#b3361d","#ea7d5f"],["blue","#24448f","#9fb5ec"],["green","#2c6a59","#7dc0ac"],["gold","#835e10","#d8b068"],["rose","#a02f4e","#e79aae"],["purple","#6c2f72","#cfa3d4"]];
function setAccent(a){ if(!a || a === "orange") document.documentElement.removeAttribute("data-accent"); else document.documentElement.setAttribute("data-accent", a); put("hcc.accent", a || "orange"); }
setAccent(get("hcc.accent", "orange"));
function accentRow(){
  var p = $(".rset"); if(!p || $(".rs-acc", p)) return;
  var h = document.createElement("div"); h.className = "rs-acc";
  h.innerHTML = '<h4>Accent</h4><div class="acc-row">' + ACC.map(function(a){ return '<button type="button" data-acc="'+a[0]+'" aria-label="'+a[0]+'" style="--a1:'+a[1]+';--a2:'+a[2]+'"></button>'; }).join("") + '</div><button type="button" class="btn-sm rs-onb">Personalise again…</button>';
  var th = $(".rs-th", p); if(th) th.parentNode.insertBefore(h, th.nextSibling); else p.appendChild(h);
  function sync(){ var cur = get("hcc.accent", "orange"); $$("[data-acc]", h).forEach(function(b){ b.setAttribute("aria-pressed", String(b.dataset.acc === cur)); }); }
  h.addEventListener("click", function(e){ var b = e.target.closest("[data-acc]"); if(b){ setAccent(b.dataset.acc); sync(); hap(); } if(e.target.closest(".rs-onb")){ p.hidden = true; onboard(true); } });
  sync();
}
setTimeout(accentRow, 400); document.addEventListener("click", function(e){ if(e.target.closest("#rsBtn")) setTimeout(accentRow, 30); });

/* ---------- onboarding ---------- */
var TRADS = [["catholic","Catholic","Douay–Rheims and the World English Bible (Catholic canon); daily Mass readings","webc","cath"],["orthodox","Orthodox","The Septuagint canon in modern English; the Orthodox lectionary","webo","orth"],
  ["protestant","Protestant","The 66-book Bible in modern English; the Anglican daily office","web","bcp"],["anglican","Anglican","The King James Version with Apocrypha; the Book of Common Prayer readings","kjva","bcp"],["exploring","Just exploring","Start with the World English Bible; change any time","web","bcp"]];
function onboard(force){
  if(!force && (get("hcc.onb", 0) || /^#(bible~|ref-|[a-z]+-\d)/.test(location.hash))) return;
  if($(".onb")) return;
  var o = document.createElement("div"); o.className = "onb"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-labelledby", "onbH");
  var step = 0, trad = get("hcc.trad", ""), theme = document.documentElement.getAttribute("data-theme") || "dark";
  function draw(){
    var body = "";
    if(step === 0) body = '<div class="onb-mark" aria-hidden="true"><svg viewBox="0 0 108 108"><use href="#hcc-tile"/></svg></div><h2 id="onbH">Welcome</h2><p>Two thousand years of the Church told in fifteen seasons, with the whole Bible in nine editions, the Fathers, maps and daily readings.</p><p class="onb-sm">Three quick questions so the app fits you. You can change everything later under Aa.</p>';
    if(step === 1) body = '<h2 id="onbH">Your tradition</h2><p class="onb-sm">This sets your default Bible and daily readings. Every edition and lectionary stays available.</p><div class="onb-opts">' + TRADS.map(function(t){ return '<button type="button" data-trad="'+t[0]+'" aria-pressed="'+(trad === t[0])+'"><b>'+t[1]+'</b><span>'+t[2]+'</span></button>'; }).join("") + '</div>';
    if(step === 2) body = '<h2 id="onbH">Your look</h2><div class="onb-th">' + [["dark","Night","#15130f"],["light","Light","#f5f1e8"],["sepia","Sepia","#f3ead6"]].map(function(t){ return '<button type="button" data-oth="'+t[0]+'" aria-pressed="'+(theme === t[0])+'"><i style="background:'+t[2]+'"></i>'+t[1]+'</button>'; }).join("") + '</div><p class="onb-sm">Accent colour</p><div class="acc-row">' + ACC.map(function(a){ return '<button type="button" data-acc="'+a[0]+'" aria-label="'+a[0]+'" style="--a1:'+a[1]+';--a2:'+a[2]+'" aria-pressed="'+(get("hcc.accent","orange") === a[0])+'"></button>'; }).join("") + '</div>';
    if(step === 3) body = '<h2 id="onbH">Each day</h2>' + (APP ? '<p class="onb-sm">A gentle notification once a day. You can also add home-screen widgets.</p><label class="onb-sw"><span><b>Verse of the day</b><small>7:00, with the Greek or Hebrew</small></span><input type="checkbox" class="switch" id="onbV"></label><label class="onb-sw"><span><b>Quote from the Fathers</b><small>8:00</small></span><input type="checkbox" class="switch" id="onbQ"></label>'
      : '<p>Each morning the home page has a verse of the day, a quote from the Church Fathers, what happened on this day in church history, and today’s readings for your tradition.</p><p class="onb-sm">On a phone, add this page to your home screen to use it like an app, even offline.</p>');
    o.innerHTML = '<div class="onb-in"><div class="onb-dots" aria-hidden="true">'+[0,1,2,3].map(function(i){ return '<i class="'+(i === step ? "on" : "")+'"></i>'; }).join("")+'</div>' + body +
      '<div class="onb-nav">'+(step > 0 ? '<button type="button" class="btn-sm" data-ob="-1">Back</button>' : '<button type="button" class="btn-sm" data-ob="skip">Skip</button>')+'<button type="button" class="btn-sm pri" data-ob="1">'+(step === 3 ? "Start reading" : "Continue")+'</button></div></div>';
    var f = $(".onb-in button[aria-pressed=true], .onb-in .pri", o); if(f) f.focus();
  }
  function finish(){
    put("hcc.onb", 1);
    if(APP){ try{ var v = $("#onbV", o), q = $("#onbQ", o); if(v && v.checked && APP.setVerseDaily) APP.setVerseDaily(true, 7, 0); if(q && q.checked && APP.setDaily) APP.setDaily(true, 8, 0); }catch(e){} }
    o.classList.add("out"); setTimeout(function(){ o.remove(); }, 300); document.body.classList.remove("onb-open");
  }
  o.addEventListener("click", function(e){
    var b = e.target.closest("button"); if(!b) return; hap();
    if(b.dataset.trad){ trad = b.dataset.trad; put("hcc.trad", trad); var t = TRADS.filter(function(x){ return x[0] === trad; })[0];
      var bs = get("hcc.bible", {}); bs.ed = t[3]; bs.lt = t[4]; put("hcc.bible", bs); $$("[data-trad]", o).forEach(function(x){ x.setAttribute("aria-pressed", String(x === b)); }); return; }
    if(b.dataset.oth){ theme = b.dataset.oth; document.documentElement.setAttribute("data-theme", theme); put("theme", theme); $$("[data-oth]", o).forEach(function(x){ x.setAttribute("aria-pressed", String(x === b)); }); return; }
    if(b.dataset.acc){ setAccent(b.dataset.acc); $$("[data-acc]", o).forEach(function(x){ x.setAttribute("aria-pressed", String(x === b)); }); return; }
    if(b.dataset.ob === "skip") return finish();
    if(b.dataset.ob){ step += +b.dataset.ob; if(step > 3) return finish(); draw(); }
  });
  o.addEventListener("keydown", function(e){ if(e.key === "Escape") finish(); });
  document.body.appendChild(o); document.body.classList.add("onb-open"); draw();
}
setTimeout(onboard, 900);
window.HCCOnboard = onboard;

/* ---------- pinch to change text size ---------- */
var pz = null;
function dist(t){ return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY); }
document.addEventListener("touchstart", function(e){
  if(e.touches.length !== 2) return; var a = e.target.closest("main article.active"); if(!a || !(a.dataset.ep || a.id === "bible" || !a.classList.contains("wide"))) return;
  var rs = get("hcc.read", {size: 1}); pz = {d: dist(e.touches), s: rs.size || 1, rs: rs};
}, {passive: true});
document.addEventListener("touchmove", function(e){
  if(!pz || e.touches.length !== 2) return; e.preventDefault();
  var s = Math.max(0.85, Math.min(1.45, pz.s * dist(e.touches) / pz.d));
  document.documentElement.style.setProperty("--rs", s.toFixed(3)); pz.cur = s;
}, {passive: false});
document.addEventListener("touchend", function(){ if(!pz) return; if(pz.cur){ pz.rs.size = Math.round(pz.cur * 20) / 20; put("hcc.read", pz.rs); if(window.HCCReadRS) window.HCCReadRS.set(pz.rs.size); hap(); } pz = null; });

/* ---------- sources drawer (episodes) ---------- */
var sb = document.createElement("button"); sb.type = "button"; sb.className = "src-fab"; sb.hidden = true; sb.setAttribute("aria-haspopup", "dialog");
sb.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M8 7h8M8 10.5h6"/></svg><span>Sources</span>';
document.body.appendChild(sb);
var sd = document.createElement("div"); sd.className = "bpick srcd"; sd.hidden = true; sd.setAttribute("role", "dialog"); sd.setAttribute("aria-modal", "true"); sd.setAttribute("aria-labelledby", "srcH");
sd.innerHTML = '<div class="bpick-bg" data-sclose="1"></div><div class="bpick-in"><div class="bpick-grab" aria-hidden="true"></div><div class="bpick-head"><h3 id="srcH">Sources</h3><button type="button" class="vs-x" data-sclose="1" aria-label="Close">✕</button></div><div class="bpick-body" id="srcBody"></div></div>';
document.body.appendChild(sd);
function srcOpen(){
  var a = $("main article.active"); if(!a) return;
  var docs = {}, refs = {}, notes = [];
  $$("[data-doc]", a).forEach(function(b){ var id = b.dataset.doc; if(!docs[id]) docs[id] = (b.textContent || id).trim(); });
  $$(".sref", a).forEach(function(b){ var k = b.dataset.sref; if(!refs[k]) refs[k] = b.textContent.trim(); });
  $$(".notes li", a).forEach(function(li){ notes.push([li.id, li.textContent.replace(/↩/g, "").trim()]); });
  var cast = $$(".cast [data-person]", a).map(function(b){ var n = $("b", b); return n ? n.textContent.trim() : ""; }).filter(Boolean);
  var quotes = (X.quotes || []).filter(function(q){ return cast.some(function(n){ return q.a && (q.a.indexOf(n) === 0 || n.indexOf(q.a) === 0); }); }).slice(0, 6);
  var h = "";
  if(Object.keys(docs).length) h += '<p class="shelf-h">Documents in the library</p><div class="src-docs">' + Object.keys(docs).map(function(id){ return '<button type="button" class="btn-sm" data-doc="'+esc(id)+'">'+esc(docs[id])+'</button>'; }).join("") + '</div>';
  if(Object.keys(refs).length) h += '<p class="shelf-h">Scripture cited</p><div class="src-docs">' + Object.keys(refs).map(function(k){ return '<button type="button" class="sref chip" data-sref="'+esc(k)+'">'+esc(refs[k])+'</button>'; }).join("") + '</div>';
  if(quotes.length) h += '<p class="shelf-h">In their own words</p>' + quotes.map(function(q){ return '<blockquote class="src-q"><p>“'+esc(q.q)+'”</p><cite><b>'+esc(q.a)+'</b> · '+esc(q.w)+(q.c ? ", " + esc(q.c) : "")+'<small>'+esc(q.s)+'</small></cite></blockquote>'; }).join("");
  if(notes.length) h += '<p class="shelf-h">Notes and references ('+notes.length+')</p><ol class="src-notes">' + notes.map(function(n){ return '<li><button type="button" class="linkbtn" data-fn="'+esc(n[0])+'">'+esc(n[1].slice(0, 260))+(n[1].length > 260 ? "…" : "")+'</button></li>'; }).join("") + '</ol>';
  if(!h) h = '<p class="vs-none">No sources are listed for this page.</p>';
  h += '<p class="vs-cite">Full texts are given where the library holds them (creeds, confessions, conciliar definitions); other works are cited in the notes.</p>';
  $("#srcH", sd).textContent = "Sources · " + (a.dataset.ep || "") + " " + (a.dataset.title || "");
  $("#srcBody", sd).innerHTML = h; sd.hidden = false; document.body.classList.add("bpick-open"); hap();
}
function srcClose(){ sd.hidden = true; document.body.classList.remove("bpick-open"); }
sb.addEventListener("click", srcOpen);
sd.addEventListener("click", function(e){
  if(e.target.closest("[data-sclose]")){ srcClose(); return; }
  var f = e.target.closest("[data-fn]"); if(f){ srcClose(); var li = document.getElementById(f.dataset.fn); if(li){ var d = li.closest("details"); if(d) d.open = true; li.scrollIntoView({block: "center", behavior: "smooth"}); li.classList.remove("sx-flash"); void li.offsetWidth; li.classList.add("sx-flash"); } return; }
  if(e.target.closest("[data-doc], .sref")) setTimeout(srcClose, 10);
});
document.addEventListener("keydown", function(e){ if(e.key === "Escape" && !sd.hidden) srcClose(); });
window.HCCSourcesOpen = function(){ return !sd.hidden; }; window.HCCSourcesClose = srcClose;
function srcRoute(){ var a = $("main article.active"); sb.hidden = !(a && a.dataset.ep); }
addEventListener("hashchange", function(){ srcClose(); setTimeout(srcRoute, 60); }); setTimeout(srcRoute, 300);

/* ---------- timeline ---------- */
var tl = $("#ref-zoom");
if(tl){
  var Y0 = -1050, Y1 = 2030, scale = 0.45, built = false, items = [], lanesOn = get("hcc.tl", {ep: 1, co: 1, pe: 1, ev: 1});
  var LANES = [["ep", "Episodes"], ["co", "Councils"], ["pe", "People"], ["ev", "Events"]];
  function span(p){ var n = String(p || "").replace(/–/g, "-").match(/-?\d+/g); if(!n) return null; var a = +n[0], b = n.length > 1 ? +n[1] : a; if(/BC/.test(p) && a > 0){ a = -a; if(n.length > 1 && !/AD/.test(p)) b = -b; } if(b < a && String(b).length < String(a).length) b = +(String(a).slice(0, String(a).length - String(b).length) + b); return [a, Math.max(a, b)]; }
  function collect(){
    items = [];
    $$("main article[data-ep]").forEach(function(a){ var s = span(a.dataset.period); if(!s || !EP[a.id]) return; items.push({l: "ep", a: s[0], b: s[1], t: EP[a.id].t, g: EP[a.id].g, href: "#" + a.id}); });
    Object.keys(X3.councils || {}).forEach(function(id){ var c = X3.councils[id]; items.push({l: "co", a: c.s, b: c.e, t: c.n, g: c.pl, href: "#ref-councilmap", cg: id}); });
    Object.keys(X.people || {}).forEach(function(id){ var p = X.people[id]; if(p.b == null) return; items.push({l: "pe", a: p.b, b: p.dd != null ? p.dd : p.b + 40, t: p.name, g: p.d, person: id}); });
    (X2.otd || []).forEach(function(o){ if(o[2] == null) return; items.push({l: "ev", a: o[2], b: o[2], t: o[3], g: o[1] + " " + ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][o[0]-1], href: "#" + o[4]}); });
  }
  var track = $(".tl-track", tl), axis = $(".tl-axis", tl), wrap = $(".tl-wrap", tl), card = $(".tl-card", tl);
  function X_(y){ return (y - Y0) * scale; }
  function layout(){
    var W = (Y1 - Y0) * scale; track.style.width = W + "px"; axis.style.width = W + "px";
    var step = scale > 3 ? 10 : scale > 1.2 ? 25 : scale > 0.5 ? 50 : 100, ax = "";
    for(var y = Math.ceil(Y0 / step) * step; y <= Y1; y += step){ ax += '<span style="left:'+X_(y)+'px"'+(y % (step * 2) === 0 ? ' class="maj"' : "")+'>'+(y % (step * 2) === 0 ? fy(y) : "")+'</span>'; }
    axis.innerHTML = ax;
    var html = "", top = 34;
    var seasonsBand = SE.map(function(s){ var a = Infinity, b = -Infinity; s.e.forEach(function(e){ var el = document.getElementById(e), sp = el && span(el.dataset.period); if(sp){ a = Math.min(a, sp[0]); b = Math.max(b, sp[1]); } }); return [s, a, b]; }).filter(function(x){ return isFinite(x[1]); });
    var srow = [];
    html += '<div class="tl-lane-h" style="top:4px">Seasons</div>' + seasonsBand.map(function(x, i){ var l = X_(x[1]), w = Math.max(4, X_(x[2]) - l), r = 0; while(srow[r] != null && srow[r] > l) r++; srow[r] = l + Math.max(w, 90); return '<a class="tl-season s'+(i%2)+'" href="#'+x[0].id+'" style="left:'+l+'px;width:'+w+'px;top:'+(20 + r * 26)+'px" title="'+esc(x[0].l)+'"><span>'+esc(x[0].l)+'</span></a>'; }).join("");
    top = 24 + srow.length * 26;
    LANES.forEach(function(L){
      if(!lanesOn[L[0]]) return;
      var its = items.filter(function(i){ return i.l === L[0]; }).sort(function(a, b){ return a.a - b.a; }), rows = [];
      html += '<div class="tl-lane-h" style="top:'+(top + 4)+'px">'+L[1]+'</div>'; top += 22;
      its.forEach(function(it){
        var x = X_(it.a), w = Math.max(8, X_(it.b) - x), lw = Math.min(w, 2000) + 6 + Math.min(280, it.t.length * 7) + 16, r = 0;
        while(rows[r] != null && rows[r] > x - 4) r++; rows[r] = x + lw; if(r > 9) return;
        html += '<button type="button" class="tl-it l-'+it.l+'" data-ti="'+items.indexOf(it)+'" style="left:'+x+'px;top:'+(top + r * 26)+'px;--w:'+w+'px"><i></i><span>'+esc(it.t)+'</span></button>';
      });
      top += Math.min(10, rows.length) * 26 + 12;
    });
    track.innerHTML = html; track.style.height = top + "px";
    $(".tl-zoom output", tl).textContent = scale >= 1 ? Math.round(scale) + " px/yr" : Math.round(1 / scale) + " yr/px";
  }
  function zoomAt(f, cx){ var old = scale; scale = Math.max(0.12, Math.min(14, scale * f)); var px = (cx != null ? cx : wrap.clientWidth / 2), yAt = (wrap.scrollLeft + px) / old; layout(); wrap.scrollLeft = yAt * scale - px; }
  function goYear(y){ wrap.scrollLeft = X_(y) - wrap.clientWidth / 2; }
  function build(){ if(built) return; built = true; collect(); layout(); goYear(300); }
  tl.addEventListener("click", function(e){
    var t;
    if((t = e.target.closest("[data-tz]"))){ zoomAt(+t.dataset.tz); return; }
    if((t = e.target.closest("[data-tr]"))){ var r = t.dataset.tr.split(","); scale = Math.max(0.12, Math.min(14, wrap.clientWidth / (+r[1] - +r[0]))); layout(); wrap.scrollLeft = X_(+r[0]); return; }
    if((t = e.target.closest("[data-tl]"))){ lanesOn[t.dataset.tl] = !lanesOn[t.dataset.tl]; put("hcc.tl", lanesOn); t.setAttribute("aria-pressed", String(!!lanesOn[t.dataset.tl])); layout(); return; }
    if((t = e.target.closest("[data-ti]"))){ var it = items[+t.dataset.ti]; $$(".tl-it.on", tl).forEach(function(x){ x.classList.remove("on"); }); t.classList.add("on");
      card.innerHTML = '<p class="eyebrow">'+esc({ep: "Episode", co: "Council", pe: "Person", ev: "Event"}[it.l])+' · '+fy(it.a)+(it.b !== it.a ? "–" + fy(it.b).replace(/^AD /, "") : "")+'</p><h3>'+esc(it.t)+'</h3><p>'+esc(it.g || "")+'</p>'+
        (it.person ? '<button type="button" class="btn-sm" data-person="'+esc(it.person)+'">Life &amp; times</button>' : it.cg ? '<a class="btn-sm" href="#ref-councilmap" data-cgo2="'+esc(it.cg)+'">Open on the council map</a>' : it.href ? '<a class="btn-sm" href="'+esc(it.href)+'">Open</a>' : "");
      card.hidden = false; hap(); return; }
    if((t = e.target.closest("[data-cgo2]"))){ var id = t.dataset.cgo2; setTimeout(function(){ var g = $('[data-cgo="'+id+'"]'); if(g) g.click(); }, 450); }
  });
  wrap.addEventListener("wheel", function(e){ if(e.ctrlKey || e.metaKey){ e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - wrap.getBoundingClientRect().left); } else if(Math.abs(e.deltaY) > Math.abs(e.deltaX)){ e.preventDefault(); wrap.scrollLeft += e.deltaY; } }, {passive: false});
  var tp = null;
  wrap.addEventListener("touchstart", function(e){ if(e.touches.length === 2){ tp = {d: dist(e.touches), cx: (e.touches[0].clientX + e.touches[1].clientX) / 2 - wrap.getBoundingClientRect().left}; } }, {passive: true});
  wrap.addEventListener("touchmove", function(e){ if(tp && e.touches.length === 2){ e.preventDefault(); e.stopPropagation(); var d = dist(e.touches); if(Math.abs(d / tp.d - 1) > 0.06){ zoomAt(d / tp.d, tp.cx); tp.d = d; } } }, {passive: false});
  wrap.addEventListener("touchend", function(){ tp = null; });
  $$("[data-tl]", tl).forEach(function(b){ b.setAttribute("aria-pressed", String(!!lanesOn[b.dataset.tl])); });
  function tlRoute(){ if(location.hash === "#ref-zoom") setTimeout(build, 60); }
  addEventListener("hashchange", tlRoute); setTimeout(tlRoute, 200);
}
})();
