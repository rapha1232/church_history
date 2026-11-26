(function(){
"use strict";
/* The Prayers page (#prayers): public-domain prayers from many traditions, sorted by theme (morning, night,
   meals, the sick, anxiety, asking, praise…). A prayer for the hour, search, filters by theme and tradition,
   saved prayers, a quiet full-screen view, share cards, and a personal prayer list (requests and answers).
   Prayers from the Bible are stored as references and shown in the reader's default edition.
   Saved under hcc.prayers.* so they are in the backup file. */
var P = window.__PRAYERS__; if(!P) return;
var $ = function(s,r){return (r||document).querySelector(s)};
var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var APP = window.HCCApp && window.HCCApp.isApp ? window.HCCApp : null;
function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]}); }
function get(k,d){ try{ var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } }
function put(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function hap(){ try{ if(APP) APP.haptic("tick"); }catch(e){} }
function toast(m, o){ if(window.HCCToast) HCCToast(m, o); }
function norm(s){ return String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[’']/g,""); }
var TH = {}, TR = {}, BY = {};
P.themes.forEach(function(t){ TH[t[0]] = t; });
P.trads.forEach(function(t){ TR[t[0]] = t; });
P.list.forEach(function(p){ BY[p.id] = p; });
var S = get("hcc.prayers", {}) || {};          /* filters: th, tr, q, tab */
var FAV = get("hcc.prayers.fav", []) || [];
var MINE = get("hcc.prayers.list", []) || [];   /* {id, text, for, t, ans, at} */
function saveS(){ put("hcc.prayers", S); }
var art = document.getElementById("prayers"), mount = $("#prMount");
if(!art || !mount) return;

/* ---------- the hour ---------- */
function hourTheme(d){ var h = (d || new Date()).getHours(); return h < 5 ? "night" : h < 11 ? "morning" : h < 14 ? "midday" : h < 18 ? "evening" : h < 21 ? "evening" : "night"; }
var HOURNAME = {morning: "this morning", midday: "midday", evening: "this evening", night: "tonight"};
function dayNo(){ var d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); }
function forHour(){ var th = hourTheme(), L = P.list.filter(function(p){ return p.th.indexOf(th) >= 0 && p.x && p.x.length < 900; }); return L.length ? L[dayNo() % L.length] : P.list[0]; }

/* ---------- text ---------- */
function body(x){
  return String(x).split(/\n\n+/).map(function(par){
    return '<p>' + par.split("\n").map(function(l){
      /* "[…]" marks an optional passage, which may run over several lines; "N." is where a name is said */
      var h = esc(l).replace(/\bN\.(?=[\s,.;:]|$)/g, '<i class="pr-n" title="Say the name">N.</i>').replace(/^\[(.*)$/, '<span class="pr-opt">[$1').replace(/^(.*)\]$/, '$1]</span>');
      if(/^V\.\s/.test(l)) h = '<span class="pr-vr" aria-label="Versicle">℣</span> ' + h.slice(3);
      else if(/^R\.\s/.test(l)) h = '<span class="pr-vr" aria-label="Response">℟</span> <b>' + h.slice(3) + '</b>';
      return h;
    }).join("<br>") + '</p>';
  }).join("");
}
var BTXT = {};
function bibleText(p, cb){
  if(BTXT[p.id]) return cb(BTXT[p.id]);
  var B = window.HCCBible; if(!B || !B.parse || !B.text){ cb(null); return; }
  var r = B.parse(p.r); if(!r){ cb(null); return; }
  B.text(r, function(t){ if(t) BTXT[p.id] = t; cb(t); });
}
function plainText(p){ return p.x ? p.x.replace(/^V\.\s|^R\.\s/gm, "").replace(/[\[\]]/g, "") : (BTXT[p.id] ? BTXT[p.id].text.replace(/\[([^\]]{1,80})\]/g, "$1") : ""); }
function firstLines(p){ if(!p.x) return p.src; var l = p.x.replace(/^V\.\s|^R\.\s/gm, "").split("\n").filter(Boolean); var s = l.slice(0, 2).join(" ").replace(/[\[\]]/g, ""); return s.length > 140 ? s.slice(0, 137).replace(/\s\S*$/, "") + "…" : s + (l.length > 2 ? " …" : ""); }

/* ---------- the page ---------- */
function counts(){ var c = {}; P.list.forEach(function(p){ p.th.forEach(function(t){ c[t] = (c[t] || 0) + 1; }); }); return c; }
function filtered(){
  var q = norm(S.q || "").trim();
  return P.list.filter(function(p){
    if(S.tab === "saved" && FAV.indexOf(p.id) < 0) return false;
    if(S.th && p.th.indexOf(S.th) < 0) return false;
    if(S.tr && p.tr !== S.tr) return false;
    if(q && norm([p.t, p.src, p.x || "", p.n || "", (BTXT[p.id] || {}).text || "", p.th.map(function(t){ return TH[t][1]; }).join(" "), TR[p.tr][1]].join(" ")).indexOf(q) < 0) return false;
    return true;
  });
}
function card(p, open){
  var fav = FAV.indexOf(p.id) >= 0;
  return '<details class="pr-card" data-pid="'+p.id+'"'+(open ? " open" : "")+'><summary><span class="pr-tr">'+esc(TR[p.tr][1])+'</span><b class="pr-t">'+esc(p.t)+'</b>'+(fav ? '<span class="pr-star" aria-label="Saved">★</span>' : "")+'<span class="pr-first">'+esc(firstLines(p))+'</span></summary>'+
    '<div class="pr-body"><div class="pr-text" lang="en">'+(p.x ? (body(p.x)) : '<div class="bib-load"><span></span><span></span><span></span></div>')+'</div>'+
    '<p class="pr-src">'+esc(p.src)+'</p>'+(p.n ? '<p class="pr-note">'+esc(p.n)+'</p>' : "")+
    '<p class="pr-themes">'+p.th.map(function(t){ return '<button type="button" class="lc-ref" data-prth="'+t+'">'+esc(TH[t][1])+'</button>'; }).join("")+'</p>'+
    '<div class="pr-acts"><button type="button" class="btn-sm" data-pra="fav" aria-pressed="'+fav+'">'+(fav ? "★ Saved" : "☆ Save")+'</button><button type="button" class="btn-sm" data-pra="slow">Pray slowly</button><button type="button" class="btn-sm" data-pra="copy">Copy</button>'+(window.HCCShareCard ? '<button type="button" class="btn-sm" data-pra="card">Share card</button>' : "")+(p.r ? '<button type="button" class="btn-sm" data-pra="ctx">Read in context</button>' : "")+'</div></div></details>';
}
function fillBible(scope){
  $$("details.pr-card[open]", scope || art).forEach(function(d){
    var p = BY[d.dataset.pid]; if(!p || !p.r) return; var box = $(".pr-text", d); if(box.dataset.done) return;
    bibleText(p, function(t){ box.dataset.done = "1"; box.innerHTML = t ? '<p>'+esc(t.text.replace(/\[([^\]]{1,80})\]/g, "$1"))+'</p><p class="pr-ed">'+esc(t.label)+' · '+esc(t.ed)+'</p>' : '<p class="vs-none">This passage could not be loaded.</p>'; });
  });
}
function render(){
  var c = counts(), list = filtered(), now = forHour(), ht = hourTheme(), act = S.th || S.tr || S.q || S.tab === "saved";
  var open = MINE.filter(function(m){ return !m.ans; }), done = MINE.filter(function(m){ return m.ans; });
  mount.innerHTML =
    '<section class="pr-now"><p class="shelf-h">A prayer for '+esc(HOURNAME[ht])+'</p>' + card(now, true).replace('class="pr-card"', 'class="pr-card pr-feat"') + '<button type="button" class="btn-sm" data-prth="'+ht+'">More prayers for '+esc(TH[ht][1].toLowerCase())+'</button></section>'+
    '<section class="pr-find" aria-label="Find a prayer"><div class="pr-bar"><label for="prQ">Search prayers</label><input id="prQ" type="search" value="'+esc(S.q || "")+'" placeholder="peace, healing, Psalm 23, Luther…" autocomplete="off" enterkeyhint="search"></div>'+
      '<div class="pr-tabs" role="group" aria-label="Show"><button type="button" class="chip" data-prtab="all" aria-pressed="'+(S.tab !== "saved")+'">All prayers</button><button type="button" class="chip" data-prtab="saved" aria-pressed="'+(S.tab === "saved")+'">Saved · '+FAV.length+'</button></div>'+
      '<p class="shelf-h">Themes</p><div class="pr-themegrid">'+P.themes.map(function(t){ return '<button type="button" class="pr-th" data-prth="'+t[0]+'" aria-pressed="'+(S.th === t[0])+'"><b>'+esc(t[1])+'</b><small>'+esc(t[2])+'</small><span>'+(c[t[0]] || 0)+'</span></button>'; }).join("")+'</div>'+
      '<p class="shelf-h">Traditions</p><div class="cm-chips pr-trads" role="group" aria-label="Tradition"><button type="button" class="chip" data-prtr="" aria-pressed="'+(!S.tr)+'">All</button>'+P.trads.map(function(t){ return '<button type="button" class="chip" data-prtr="'+t[0]+'" aria-pressed="'+(S.tr === t[0])+'" title="'+esc(t[2])+'">'+esc(t[1])+'</button>'; }).join("")+'</div></section>'+
    '<section class="pr-results" id="prResults" aria-live="polite">'+results(list, act)+'</section>'+
    '<section class="pr-mine" id="prMine"><h3>My prayer list</h3><p class="pr-help">People and things you are praying for. Mark a prayer answered to keep a record of it. Your list stays on this device and is included in the backup.</p>'+
      '<form class="pr-add"><label for="prAdd">Pray for</label><textarea id="prAdd" rows="2" maxlength="600" placeholder="A name, a need, a hope…"></textarea><button type="submit" class="btn-sm pri">Add to my list</button></form>'+
      '<div class="pr-tabs" role="group" aria-label="My prayers"><button type="button" class="chip" data-prm="open" aria-pressed="'+(S.mt !== "ans")+'">Praying for · '+open.length+'</button><button type="button" class="chip" data-prm="ans" aria-pressed="'+(S.mt === "ans")+'">Answered · '+done.length+'</button></div>'+
      '<ul class="pr-ml">'+mine(S.mt === "ans" ? done : open)+'</ul></section>';
  fillBible();
}
function results(list, act){
  var head = [];
  if(S.tab === "saved") head.push("Saved");
  if(S.th) head.push(TH[S.th][1]);
  if(S.tr) head.push(TR[S.tr][1]);
  if(S.q) head.push("“" + S.q + "”");
  var h = '<div class="pr-rh"><h3>'+esc(head.length ? head.join(" · ") : "All prayers")+' <span>'+list.length+'</span></h3>'+(act ? '<button type="button" class="btn-sm" data-prclear="1">Show all</button>' : "")+'</div>';
  if(!list.length) return h + '<p class="vs-none">'+(S.tab === "saved" && !FAV.length ? "No saved prayers yet. Open a prayer and choose Save to keep it here." : "No prayers match. Try another word, or clear the filters.")+'</p>';
  if(!act){ /* everything: grouped by theme, first in each */
    return h + P.themes.map(function(t){ var L = list.filter(function(p){ return p.th[0] === t[0]; }); if(!L.length) return ""; return '<div class="pr-grp"><p class="shelf-h">'+esc(t[1])+'</p>'+L.map(function(p){ return card(p); }).join("")+'</div>'; }).join("");
  }
  return h + list.map(function(p){ return card(p); }).join("");
}
function mine(L){
  if(!L.length) return '<li class="pr-me">'+(S.mt === "ans" ? "Nothing marked answered yet." : "Your list is empty.")+'</li>';
  return L.slice().sort(function(a, b){ return (b.at || b.t) - (a.at || a.t); }).map(function(m){
    return '<li data-mid="'+m.id+'"><p>'+esc(m.text).replace(/\n/g, "<br>")+'</p><small>Added '+new Date(m.t).toLocaleDateString()+(m.ans ? ' · answered '+new Date(m.at).toLocaleDateString() : "")+(m.n ? ' · prayed '+m.n+' time'+(m.n > 1 ? "s" : "") : "")+'</small>'+
      '<div class="pr-macts">'+(m.ans ? '<button type="button" class="btn-sm" data-pmx="reopen">Pray again</button>' : '<button type="button" class="btn-sm" data-pmx="prayed">Prayed today</button><button type="button" class="btn-sm" data-pmx="ans">Answered</button>')+'<button type="button" class="btn-sm" data-pmx="del">Delete</button></div></li>';
  }).join("");
}
function refresh(){ var r = $("#prResults", mount); if(r){ r.innerHTML = results(filtered(), S.th || S.tr || S.q || S.tab === "saved"); fillBible(r); } $$(".pr-th", mount).forEach(function(b){ b.setAttribute("aria-pressed", String(S.th === b.dataset.prth)); }); $$("[data-prtr]", mount).forEach(function(b){ b.setAttribute("aria-pressed", String((S.tr || "") === b.dataset.prtr)); }); $$("[data-prtab]", mount).forEach(function(b){ b.setAttribute("aria-pressed", String((S.tab === "saved") === (b.dataset.prtab === "saved"))); }); }
function toResults(){ var r = $("#prResults", mount); if(r) r.scrollIntoView({block: "start", behavior: "smooth"}); }

/* ---------- a quiet, full-screen view ---------- */
var slow = null, slowList = [], slowI = 0;
function openSlow(p){
  slowList = filtered(); slowI = Math.max(0, slowList.indexOf(p)); if(slowList.indexOf(p) < 0){ slowList = [p]; slowI = 0; }
  if(!slow){
    slow = document.createElement("div"); slow.className = "pr-slow"; slow.setAttribute("role", "dialog"); slow.setAttribute("aria-modal", "true"); slow.setAttribute("aria-labelledby", "prSlowH");
    document.body.appendChild(slow);
    slow.addEventListener("click", function(e){ var b = e.target.closest("[data-ps]"); if(!b) return; var a = b.dataset.ps; if(a === "x") closeSlow(); else { slowI = (slowI + (+a) + slowList.length) % slowList.length; drawSlow(); } });
    document.addEventListener("keydown", function(e){ if(!slow || slow.hidden) return; if(e.key === "Escape") closeSlow(); if(e.key === "ArrowRight" && slowList.length > 1){ slowI = (slowI + 1) % slowList.length; drawSlow(); } if(e.key === "ArrowLeft" && slowList.length > 1){ slowI = (slowI - 1 + slowList.length) % slowList.length; drawSlow(); } });
  }
  slow.hidden = false; document.body.classList.add("pr-slow-on"); drawSlow();
}
function drawSlow(){
  var p = slowList[slowI], many = slowList.length > 1;
  slow.innerHTML = '<div class="pr-sin"><p class="eyebrow">'+esc(TR[p.tr][1])+'</p><h2 id="prSlowH">'+esc(p.t)+'</h2><div class="pr-stext">'+(p.x ? (body(p.x)) : '<div class="bib-load"><span></span><span></span><span></span></div>')+'</div><p class="pr-src">'+esc(p.src)+'</p></div>'+
    '<div class="pr-snav">'+(many ? '<button type="button" class="btn-sm" data-ps="-1" aria-label="Previous prayer">←</button>' : "")+'<button type="button" class="btn-sm" data-ps="x">Close</button>'+(many ? '<button type="button" class="btn-sm" data-ps="1" aria-label="Next prayer">→</button>' : "")+'</div>';
  if(p.r) bibleText(p, function(t){ var b = $(".pr-stext", slow); if(b && slowList[slowI] === p) b.innerHTML = t ? '<p>'+esc(t.text.replace(/\[([^\]]{1,80})\]/g, "$1"))+'</p><p class="pr-ed">'+esc(t.label)+' · '+esc(t.ed)+'</p>' : ""; });
  var c = $('[data-ps="x"]', slow); if(c) c.focus();
}
function closeSlow(){ if(!slow) return; slow.hidden = true; document.body.classList.remove("pr-slow-on"); }

/* ---------- events ---------- */
mount.addEventListener("click", function(e){
  var t;
  if((t = e.target.closest("[data-prth]"))){ S.th = S.th === t.dataset.prth && t.classList.contains("pr-th") ? "" : t.dataset.prth; S.tab = "all"; saveS(); refresh(); hap(); if(!t.classList.contains("pr-th") || S.th) toResults(); return; }
  if((t = e.target.closest("[data-prtr]"))){ S.tr = t.dataset.prtr; saveS(); refresh(); hap(); return; }
  if((t = e.target.closest("[data-prtab]"))){ S.tab = t.dataset.prtab; saveS(); refresh(); hap(); return; }
  if((t = e.target.closest("[data-prclear]"))){ S.th = ""; S.tr = ""; S.q = ""; S.tab = "all"; saveS(); var q = $("#prQ", mount); if(q) q.value = ""; refresh(); return; }
  if((t = e.target.closest("[data-prm]"))){ S.mt = t.dataset.prm; saveS(); render(); var m = $("#prMine", mount); if(m) m.scrollIntoView({block: "start"}); return; }
  if((t = e.target.closest("[data-pra]"))){
    var d = t.closest("[data-pid]"), p = BY[d.dataset.pid], a = t.dataset.pra; if(!p) return;
    if(a === "fav"){ var i = FAV.indexOf(p.id); if(i >= 0) FAV.splice(i, 1); else FAV.unshift(p.id); put("hcc.prayers.fav", FAV); hap();
      var on = FAV.indexOf(p.id) >= 0; $$('[data-pid="'+p.id+'"] [data-pra="fav"]', mount).forEach(function(b){ b.setAttribute("aria-pressed", String(on)); b.textContent = on ? "★ Saved" : "☆ Save"; });
      $$('[data-prtab="saved"]', mount).forEach(function(b){ b.textContent = "Saved · " + FAV.length; });
      toast(on ? "Prayer saved" : "Removed from saved", on ? {action: "View", run: function(){ S.tab = "saved"; S.th = ""; S.tr = ""; S.q = ""; saveS(); refresh(); toResults(); }} : null); return; }
    if(a === "slow"){ openSlow(p); return; }
    if(a === "copy"){ var txt = p.t + "\n\n" + plainText(p) + "\n\n— " + p.src; try{ navigator.clipboard.writeText(txt); t.textContent = "Copied"; setTimeout(function(){ t.textContent = "Copy"; }, 1200); }catch(err){} return; }
    if(a === "card"){ window.HCCShareCard(plainText(p), p.t, "", p.src); return; }
    if(a === "ctx"){ var B = window.HCCBible, r = B && B.parse(p.r); if(r) B.go(null, r.b, r.c, r.v); return; }
  }
  if((t = e.target.closest("[data-pmx]"))){
    var li = t.closest("[data-mid]"), id = li && li.dataset.mid, m = MINE.filter(function(x){ return x.id === id; })[0], a2 = t.dataset.pmx; if(!m) return;
    if(a2 === "prayed"){ m.n = (m.n || 0) + 1; m.lp = Date.now(); toast("Prayed · " + m.n + " time" + (m.n > 1 ? "s" : "")); }
    if(a2 === "ans"){ m.ans = true; m.at = Date.now(); toast("Marked answered. Thanks be to God.", {action: "Undo", run: function(){ m.ans = false; m.at = 0; put("hcc.prayers.list", MINE); render(); }}); }
    if(a2 === "reopen"){ m.ans = false; m.at = 0; }
    if(a2 === "del"){ var k = MINE.indexOf(m); MINE.splice(k, 1); toast("Removed from your list", {action: "Undo", run: function(){ MINE.splice(k, 0, m); put("hcc.prayers.list", MINE); render(); }}); }
    put("hcc.prayers.list", MINE); hap(); render(); var mm = $("#prMine", mount); if(mm && a2 !== "prayed") mm.scrollIntoView({block: "nearest"}); return;
  }
});
mount.addEventListener("toggle", function(e){ var d = e.target; if(d.classList && d.classList.contains("pr-card") && d.open) fillBible(d.parentNode); }, true);
var qT = 0;
mount.addEventListener("input", function(e){ if(e.target.id !== "prQ") return; clearTimeout(qT); var v = e.target.value; qT = setTimeout(function(){ if(!S.q && v.trim()){ S.th = ""; S.tab = "all"; } S.q = v.trim(); saveS(); refresh(); }, 180); });
mount.addEventListener("submit", function(e){
  if(!e.target.classList.contains("pr-add")) return; e.preventDefault();
  var ta = $("#prAdd", mount), v = ta.value.trim(); if(!v){ ta.focus(); return; }
  MINE.push({id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text: v, t: Date.now(), ans: false, n: 0}); put("hcc.prayers.list", MINE);
  S.mt = "open"; saveS(); hap(); render(); toast("Added to your prayer list"); var f = $("#prAdd", mount); if(f) f.focus();
});

/* ---------- open a prayer from elsewhere (home card, search) ---------- */
window.HCCPrayers = {
  open: function(id){ var p = BY[id]; if(!p) return; S.th = ""; S.tr = ""; S.tab = "all"; S.q = ""; saveS(); location.hash = "prayers";
    setTimeout(function(){ render(); var d = $('#prResults [data-pid="'+id+'"]', mount); if(d){ d.open = true; fillBible(d.parentNode); d.scrollIntoView({block: "center"}); } }, 250); },
  theme: function(th){ S.th = th; S.tr = ""; S.tab = "all"; S.q = ""; saveS(); location.hash = "prayers"; setTimeout(function(){ render(); toResults(); }, 250); },
  list: P.list, themes: P.themes, trads: P.trads, now: forHour
};
var drawn = false;
function route(){ if(location.hash === "#prayers"){ if(!drawn){ drawn = true; render(); } } else closeSlow(); }
addEventListener("hashchange", function(){ setTimeout(route, 30); }); setTimeout(route, 60);
setInterval(function(){ if(location.hash === "#prayers" && drawn){ var f = $(".pr-feat", mount); if(f && f.dataset.pid !== forHour().id && !$("#prQ:focus", mount)) render(); } }, 10 * 60 * 1000);

/* ---------- home: a prayer for the hour ---------- */
function mountHome(){
  var sh = $(".shelves"); if(!sh || $(".pr-home", sh)) return;
  var p = forHour(), ht = hourTheme(), box = document.createElement("section"); box.className = "pr-home"; box.setAttribute("aria-label", "A prayer for this hour");
  box.innerHTML = '<p class="shelf-h">A prayer for '+esc(HOURNAME[ht])+'</p><h3>'+esc(p.t)+'</h3><div class="pr-text">'+(body(p.x))+'</div><p class="pr-src">'+esc(p.src)+'</p><div class="qbtns"><a class="btn-sm" href="#prayers">All prayers</a><button type="button" class="btn-sm" data-phm="'+ht+'">More for '+esc(TH[ht][1].toLowerCase())+'</button></div>';
  var v = $(".votd", sh); sh.insertBefore(box, v ? v.nextSibling : sh.firstChild);
  box.addEventListener("click", function(e){ var b = e.target.closest("[data-phm]"); if(b) HCCPrayers.theme(b.dataset.phm); });
}
mountHome(); setTimeout(mountHome, 600);
addEventListener("hashchange", function(){ setTimeout(mountHome, 80); });
})();
