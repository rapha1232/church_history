
(function(){
"use strict";
/* Edition 21: navigation and Studies.
   1. Navigation: five real sections (Home, Series, Bible, Studies, Library) as a top menu on wide screens and the
      bottom bar on phones; Settings has its own gear button (no longer hidden behind the Aa reading panel); the
      contents sidebar only appears while reading the Series; Bookmark moves into the page.
   2. Series and Library: real pages instead of a drawer.
   3. Studies: folders on a question (e.g. the papacy) with a For and an Against column of evidence: Bible verses,
      Church Fathers, documents, episodes, notes and links. Saved on the device (and in the backup file),
      exportable as Markdown and shareable as a file. See DESIGN.md §4 and §5. */

var $ = function(s,r){ return (r||document).querySelector(s); };
var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function get(k,d){ try{ var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } }
function put(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
function t(s){ return window.HCCSettings && HCCSettings.t ? HCCSettings.t(s) : s; }
function toast(m, o){ if(window.HCCToast) HCCToast(m, o); }
var body = document.body, D = window.__DATA__ || {}, EP = window.__EP__ || {}, SE = window.__SEASONS__ || [], IMG = window.__IMG__ || {};
var APP = window.HCCApp && HCCApp.isApp ? HCCApp : null;
function art(id){ var a = document.getElementById(id); return a && a.tagName === "ARTICLE" ? a : null; }
function titleOf(id){ var a = art(id); return a ? a.dataset.title : id; }
function hashId(){ var h = location.hash.slice(1); try{ h = decodeURIComponent(h); }catch(e){} return h; }

var ICON = {
  reply: '<path d="M9 7L4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 6 6v1"/>',
  home: '<path d="M4 11l8-7 8 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
  series: '<rect x="3.5" y="5" width="17" height="12" rx="1.5"/><path d="M8 20h8"/><path d="M10.5 8.8v4.4l3.8-2.2z" fill="currentColor"/>',
  bible: '<path d="M5 4.5h11a2 2 0 0 1 2 2V20H7a2 2 0 0 1-2-2z"/><path d="M5 18a2 2 0 0 1 2-2h11"/><path d="M11.5 7.5v6M9.3 9.6h4.4"/>',
  studies: '<path d="M12 4v16"/><path d="M7 20h10"/><path d="M5 7h14"/><path d="M5 7l-2.5 6a2.6 2.6 0 0 0 5 0z"/><path d="M19 7l-2.5 6a2.6 2.6 0 0 0 5 0z"/>',
  library: '<path d="M4.5 4.5h3.5v15H4.5zM9.5 4.5H13v15H9.5z"/><path d="M14.6 5.4l3.3-.9 3.5 14.4-3.3.9z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  mark: '<path d="M7 4h10v16l-5-3.6L7 20z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>'
};
function svg(k, cls){ return '<svg class="'+(cls||"")+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ICON[k]+'</svg>'; }

/* ====================================================================== sections */
var ORDER = D.order || [];
var SERIES = {series: 1};
(function(){ var a = ORDER.indexOf("method"), b = ORDER.indexOf("ref-timeline"); if(a < 0) a = 0; if(b < 0) b = ORDER.length; ORDER.slice(a, b).forEach(function(id){ SERIES[id] = 1; }); })();
function activeId(){ var a = $("main > article.active"); return a ? a.id : "home"; }
function sectionOf(id){
  if(!id || id === "home") return "home";
  if(id === "bible" || id.indexOf("bible-") === 0) return "bible";
  if(id === "studies") return "studies";
  if(SERIES[id]) return "series";
  if(id === "ref-settings") return "settings";
  if(id === "library" || id.indexOf("ref-") === 0) return "library";
  return "";
}
var NAV = [["home","Home"],["series","Series"],["bible","Bible"],["studies","Studies"],["library","Library"]];

/* top menu (wide screens) and settings gear */
var top = $(".topbar"), brand = $(".topbar .brand");
var menu = document.createElement("nav"); menu.className = "ed21-nav"; menu.setAttribute("aria-label", "Main");
menu.innerHTML = NAV.map(function(n){ return '<a href="#'+n[0]+'" data-sec="'+n[0]+'">'+t(n[1])+'</a>'; }).join("");
if(brand) brand.insertAdjacentElement("afterend", menu);
var gear = document.createElement("a"); gear.className = "iconbtn ed21-gear"; gear.href = "#ref-settings"; gear.setAttribute("aria-label", "Settings"); gear.title = "Settings"; gear.innerHTML = svg("gear");
function placeGear(){ if(!top) return; var rs = $("#rsBtn"); if(rs){ if(rs.nextSibling !== gear) rs.insertAdjacentElement("afterend", gear); } else if(!gear.parentNode) top.appendChild(gear); }
placeGear(); setTimeout(placeGear, 400); setTimeout(placeGear, 1500);

/* bottom bar (phones, touch tablets): replace the old five tabs, keeping the element's place and style */
var oldTb = $(".tabbar.tb2"), tb = null;
function buildTabs(){
  oldTb = $(".tabbar.tb2:not(.ed21-tabs)"); if(!oldTb) return false;
  tb = oldTb.cloneNode(false); tb.classList.add("ed21-tabs");
  tb.innerHTML = NAV.map(function(n){ return '<button type="button" data-sec="'+n[0]+'" aria-current="false">'+svg(n[0])+'<span>'+t(n[1])+'</span></button>'; }).join("");
  oldTb.parentNode.replaceChild(tb, oldTb);
  tb.addEventListener("click", function(e){
    var b = e.target.closest("[data-sec]"); if(!b) return;
    var s = b.dataset.sec, now = sectionOf(activeId());
    if(window.HCCApp && HCCApp.haptic) try{ HCCApp.haptic("tick"); }catch(err){}
    if(s === "series" && now === "series" && activeId() !== "series"){ openContents(); return; }
    if(now === s && hashId().split("~")[0] === s){ scrollTo({top: 0, behavior: "smooth"}); return; }
    body.classList.remove("navopen");
    location.hash = s === "home" ? "home" : s;
  });
  return true;
}
if(!buildTabs()) setTimeout(buildTabs, 300);
function openContents(){
  var tab = $('.navtabs [aria-controls="pane-toc"]'); if(tab) tab.click();
  body.classList.add("navopen");
}

function syncNav(){
  var id = activeId(), sec = sectionOf(id);
  body.classList.toggle("ed21-series", sec === "series" && id !== "series");
  body.dataset.sec = sec || "other";
  $$("[data-sec]", menu).concat(tb ? $$("[data-sec]", tb) : []).forEach(function(a){
    var on = a.dataset.sec === sec;
    if(a.tagName === "A"){ if(on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); }
    else a.setAttribute("aria-current", on ? "true" : "false");
  });
  if(sec === "settings") gear.setAttribute("aria-current", "page"); else gear.removeAttribute("aria-current");
}

/* ====================================================================== bookmark and "add to study" in the page */
function marks(){ var m = get("marks", []); return Array.isArray(m) ? m : []; }
var NOMARK = {home:1, series:1, library:1, studies:1, bible:1, "ref-settings":1};
function pageTools(){
  var a = $("main > article.active"); if(!a || NOMARK[a.id]) return;
  var on = marks().indexOf(a.id) >= 0;
  var host = a.querySelector(":scope > .coldopen .co-act, :scope > .season .co-act");
  var mk = a.querySelector(".ed21-mark");
  if(!mk){
    mk = document.createElement("button"); mk.type = "button"; mk.className = "ed21-mark";
    if(host){ mk.classList.add("btn-ghost"); host.appendChild(mk);
      if(a.dataset.ep){ var as = document.createElement("button"); as.type = "button"; as.className = "btn-ghost ed21-addep"; as.innerHTML = svg("plus") + '<span>'+t("Add to study")+'</span>'; host.appendChild(as); }
    } else {
      var h = a.querySelector(":scope > h2"); if(!h) return;
      var row = document.createElement("div"); row.className = "ed21-ptools"; row.appendChild(mk);
      h.insertAdjacentElement("afterend", row); mk.classList.add("btn-sm");
    }
  }
  mk.setAttribute("aria-pressed", String(on));
  mk.innerHTML = svg("mark") + '<span>' + t(on ? "Bookmarked" : "Bookmark") + '</span>';
}
document.addEventListener("click", function(e){
  var mk = e.target.closest(".ed21-mark"); if(mk){ var mb = $("#markBtn"); if(mb) mb.click(); setTimeout(pageTools, 0); return; }
  var ae = e.target.closest(".ed21-addep"); if(ae){ var a = $("main > article.active"); if(a) openAdd({type: "ep", ep: a.id}); }
});

/* ====================================================================== Series page */
function seasonInfo(s){
  var a = art(s.id), kick = a ? $$(".co-kick span", a) : [], im = a ? a.querySelector("img") : null;
  var mins = (s.e || []).reduce(function(n, id){ return n + ((EP[id] || {}).m || 0); }, 0);
  return {dates: kick.length > 1 ? kick[kick.length - 1].textContent : "", img: im ? im.getAttribute("src") : "", mins: mins};
}
function renderSeries(){
  var el = art("series"); if(!el) return;
  var W = get("hcc.watch", {}) || {};
  var started = Object.keys(W).filter(function(id){ return EP[id] && W[id].p > 0.02 && W[id].p < 0.95; }).sort(function(x, y){ return (W[y].t || 0) - (W[x].t || 0); })[0];
  var html = '<p class="eyebrow">The Series</p><h2>Fifteen seasons</h2><p class="lede">The story of the Church from ancient Israel to today, in short episodes. Each season opens with an overview; each episode takes a few minutes.</p>' +
    '<div class="ed21-acts">' + (started ? '<a class="btn-sm pri" href="#'+started+'">Continue: '+esc(EP[started].t)+'</a>' : '<a class="btn-sm pri" href="#i-1">Start from the beginning</a>') +
    '<button type="button" class="btn-sm" data-ed21="toc">All chapters</button><a class="btn-sm" href="#method">Method and sources</a>' + ($("#allBtn") ? '<button type="button" class="btn-sm" data-ed21="all">Read everything on one page</button>' : "") + '</div>';
  html += '<ol class="ed21-seasons">' + SE.filter(function(s){ return /^vol-[ivx]+$/.test(s.id); }).map(function(s, i){
    var inf = seasonInfo(s), done = (s.e || []).filter(function(id){ return W[id] && W[id].p >= 0.95; }).length;
    return '<li><a href="#'+s.id+'"><span class="ed21-sim">' + (inf.img ? '<img src="'+esc(inf.img)+'" alt="" loading="lazy" decoding="async">' : "") + '<b>'+esc(roman(i + 1))+'</b></span>' +
      '<span class="ed21-stx"><small>'+esc(s.l)+(inf.dates ? ' · '+esc(inf.dates) : "")+'</small><strong>'+esc(s.t)+'</strong><em>'+(s.e || []).length+' episodes · '+inf.mins+' min'+(done ? ' · '+done+' finished' : "")+'</em>' +
      (done ? '<i class="ed21-prog"><i style="width:'+Math.round(100 * done / Math.max(1, (s.e || []).length))+'%"></i></i>' : "") + '</span></a></li>';
  }).join("") + '</ol>';
  var extra = SE.filter(function(s){ return !/^vol-[ivx]+$/.test(s.id); });
  if(!extra.length) extra = ["vol-p3", "vol-p4"].filter(art).map(function(id){ return {id: id, t: titleOf(id)}; });
  if(extra.length) html += '<h3 class="ed21-h">Study companions</h3><ul class="ed21-rows">' + extra.map(function(s){ return '<li><a href="#'+s.id+'"><b>'+esc(s.t || titleOf(s.id))+'</b><span>'+esc(lede(s.id))+'</span></a></li>'; }).join("") + '</ul>';
  el.innerHTML = html;
}
function roman(n){ var r = "", m = [[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]]; m.forEach(function(p){ while(n >= p[0]){ r += p[1]; n -= p[0]; } }); return r; }
function lede(id){ var a = art(id), p = a ? (a.querySelector(".lede") || a.querySelector(":scope > p:not(.eyebrow)")) : null, s = p ? p.textContent.trim() : ""; var m1 = s.match(/^.*?[.!?](?=\s|$)/); if(m1) s = m1[0]; return s.length > 120 ? s.slice(0, 117).replace(/\s\S*$/, "") + "…" : s; }

/* ====================================================================== Library page */
var LIB = [
  ["Time", ["ref-zoom", "ref-timeline", "ref-otd", "ref-tree"]],
  ["People and places", ["ref-people", "ref-atlas", "ref-councilmap", "ref-churches"]],
  ["Councils and doctrine", ["ref-doctrines", "ref-councils", "ref-debates", "ref-controversies", "ref-compare", "ref-myths", "ref-glossary"]],
  ["Texts and sources", ["ref-fathers", "ref-texts", "ref-docs", "ref-originals", "ref-bib", "ref-register", "ref-report"]],
  ["Pictures", ["ref-gallery", "ref-images"]],
  ["Bible companions", ["bible-dcnt", "bible-maps", "bible-canon", "bible-arcs"]]
];
function renderLibrary(){
  var el = art("library"); if(!el) return;
  var used = {}, m = marks().filter(art);
  var html = '<p class="eyebrow">Library</p><h2>Library</h2><p class="lede">Reference tools for the whole story: timelines, people, maps, councils, texts and pictures, and the things you have saved.</p>';
  html += '<section class="ed21-lsec"><h3 class="ed21-h">Yours</h3><ul class="ed21-rows">' +
    '<li><a href="#studies"><b>Studies</b><span>'+esc(studies().length + " " + (studies().length === 1 ? "study" : "studies"))+' · questions with the evidence for and against</span></a></li>' +
    (art("ref-notebook") ? '<li><a href="#ref-notebook"><b>'+esc(titleOf("ref-notebook"))+'</b><span>'+esc(lede("ref-notebook"))+'</span></a></li>' : "") +
    (art("ref-plans") ? '<li><a href="#ref-plans"><b>'+esc(titleOf("ref-plans"))+'</b><span>'+esc(lede("ref-plans"))+'</span></a></li>' : "") +
    '<li><a href="#ref-settings"><b>Settings</b><span>Language, backup, Bible editions, offline packs and updates</span></a></li></ul>' +
    '<h4 class="ed21-sh">Bookmarks</h4>' + (m.length ? '<ul class="ed21-rows ed21-marks">' + m.map(function(id){ var a = art(id); return '<li><a href="#'+id+'"><b>'+esc(a.dataset.title)+'</b>'+(a.dataset.ep ? '<span>'+esc(a.dataset.ep)+'</span>' : "")+'</a></li>'; }).join("") + '</ul>' : '<p class="ed21-empty">No bookmarks yet. Use <b>Bookmark</b> at the top of any episode or reference page to keep it here.</p>') + '</section>';
  LIB.forEach(function(g){
    var ids = g[1].filter(art); ids.forEach(function(id){ used[id] = 1; });
    if(ids.length) html += '<section class="ed21-lsec"><h3 class="ed21-h">'+esc(g[0])+'</h3><ul class="ed21-rows">' + ids.map(function(id){ return '<li><a href="#'+id+'"><b>'+esc(titleOf(id))+'</b><span>'+esc(lede(id))+'</span></a></li>'; }).join("") + '</ul></section>';
  });
  var more = ORDER.filter(function(id){ return (/^ref-|^bible-/).test(id) && !used[id] && id !== "ref-settings" && id !== "ref-notebook" && id !== "ref-plans" && art(id); });
  if(more.length) html += '<section class="ed21-lsec"><h3 class="ed21-h">More</h3><ul class="ed21-rows">' + more.map(function(id){ return '<li><a href="#'+id+'"><b>'+esc(titleOf(id))+'</b><span>'+esc(lede(id))+'</span></a></li>'; }).join("") + '</ul></section>';
  el.innerHTML = html;
}

/* ====================================================================== Studies: data */
var SK = "hcc.studies";
function studies(){ var s = get(SK, null); return s && Array.isArray(s.list) ? s.list : []; }
function saveStudies(list){ put(SK, {v: 1, list: list}); }
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function find(id){ return studies().filter(function(s){ return s.id === id; })[0] || null; }
function update(id, fn){ var list = studies(), s = list.filter(function(x){ return x.id === id; })[0]; if(!s) return null; fn(s); s.updated = Date.now(); saveStudies(list); return s; }
function newStudy(title){
  var s = {id: uid(), title: title || "Untitled study", overview: "", sides: [{label: "For", items: []}, {label: "Against", items: []}], created: Date.now(), updated: Date.now()};
  var list = studies(); list.unshift(s); saveStudies(list); return s;
}
function seed(){
  if(get("hcc.studies.seeded", false) || get(SK, null)) return;
  put("hcc.studies.seeded", true);
  function v(b, c, v1, v2, note){ return {id: uid(), type: "verse", b: b, c: c, v: v1, v2: v2 || v1, note: note || ""}; }
  function f(author, work, date, quote, note){ return {id: uid(), type: "father", author: author, work: work, date: date, quote: quote, note: note || ""}; }
  var pa = $$("details.doctext").filter(function(d){ return /Pastor aeternus/i.test(d.dataset.title || ""); })[0];
  var s = {id: uid(), title: "The papacy", created: Date.now(), updated: Date.now(),
    overview: "An example to show how a study works. It gathers evidence commonly cited on each side of the question of Roman primacy, without a verdict. Edit, add or delete anything, or start your own study.",
    sides: [
      {label: "For Roman primacy", items: [
        v("MAT", 16, 18, 19, "“On this rock”: read in Catholic tradition as Peter himself; others read the rock as Peter’s confession of faith or as Christ."),
        v("LUK", 22, 31, 32, "Christ prays that Peter’s faith will not fail and charges him to strengthen his brothers."),
        v("JOH", 21, 15, 17, "“Feed my sheep”: the threefold pastoral charge to Peter."),
        f("Ignatius of Antioch", "Letter to the Romans, greeting", "c. 110", "…which also presides in the place of the region of the Romans, worthy of God, worthy of honour … and which presides over love.", "Read by some as an early sign of Roman precedence; by others as a precedence of charity rather than of jurisdiction. Trans. ANF 1."),
        f("Irenaeus of Lyons", "Against Heresies 3.3.2", "c. 180", "For it is a matter of necessity that every Church should agree with this Church, on account of its pre-eminent authority.", "The Latin (convenire ad) can mean “agree with” or “resort to”; the original Greek is lost. Trans. ANF 1."),
        pa ? {id: uid(), type: "doc", doc: pa.dataset.docId, note: "The First Vatican Council (1870) defines the pope’s primacy of jurisdiction and infallibility."} : null,
        {id: uid(), type: "ep", ep: "vii-4", note: "Background: how Roman bishops from Damasus to Gregory argued for their primacy."}
      ].filter(Boolean)},
      {label: "Against Roman primacy", items: [
        v("GAL", 2, 11, 11, "Paul opposes Peter to his face at Antioch."),
        v("ACT", 15, 19, 20, "At the Jerusalem council it is James who gives the decisive judgement."),
        v("EPH", 2, 20, 20, "The Church is built on the foundation of the apostles and prophets, with Christ as cornerstone."),
        v("1PE", 5, 1, 1, "Peter calls himself a “fellow elder”."),
        {id: uid(), type: "note", title: "Council of Nicaea (325), canon 6", text: "Let the ancient customs in Egypt, Libya and Pentapolis prevail, that the Bishop of Alexandria have jurisdiction in all these, since the like is customary for the Bishop of Rome also.", note: "Rome’s authority is cited as a regional custom, the model for Alexandria’s. Catholic readers stress that Rome is the reference point."},
        f("Cyprian of Carthage", "Seventh Council of Carthage, opening address", "256", "For neither does any of us set himself up as a bishop of bishops, nor by tyrannical terror does any compel his colleague to the necessity of obedience.", "Spoken during the dispute with Pope Stephen over rebaptism. Trans. ANF 5."),
        f("Gregory the Great", "Letters, Book VII, 33 (to the Emperor Maurice)", "597", "Now I confidently say that whosoever calls himself, or desires to be called, Universal Priest, is in his elation the precursor of Antichrist.", "Aimed at the patriarch of Constantinople’s title “ecumenical patriarch”. Catholic readers note that Gregory still claimed Rome’s care for all the churches. Trans. NPNF 2.13."),
        {id: uid(), type: "ep", ep: "vii-6", note: "Background: how the Orthodox and others distinguish primacy from supremacy in today’s dialogue."}
      ]}
    ]};
  saveStudies([s]);
}

/* ====================================================================== Studies: Bible, documents, episodes */
var BIB = function(){ return window.HCCBible || {}; };
function vLabel(it){ var B = BIB(); var l = B.label ? B.label(it.b, it.c, it.v, it.v2) : (it.b + " " + it.c + ":" + it.v + (it.v2 && it.v2 !== it.v ? "–" + it.v2 : "")); return l; }
function docs(){ return $$("details.doctext").map(function(d){ return {id: d.dataset.docId, title: d.dataset.title, date: d.dataset.date, fam: d.dataset.fam, el: d.id}; }); }
function docBy(id){ return docs().filter(function(d){ return d.id === id; })[0] || null; }
var TYPES = {verse: "Scripture", father: "Church Father", doc: "Document", ep: "Episode", note: "Note", link: "Link"};

function itemHTML(it, si, ii, n, L){
  var head = "", main = "", go = "";
  if(it.type === "verse"){
    head = '<button type="button" class="st-ref" data-goverse="'+esc(it.b+"~"+it.c+"~"+it.v)+'">'+esc(vLabel(it))+'</button>' + (it.ed ? ' <small>'+esc(it.ed)+'</small>' : "");
    main = '<p class="st-q" data-vtext="'+esc(it.id)+'">'+(it.text ? esc(it.text) : '<span class="st-load">Loading the verse…</span>')+'</p>';
  } else if(it.type === "father"){
    head = '<b>'+esc(it.author || "Unknown")+'</b>' + (it.work ? ' <small>'+esc(it.work)+(it.date ? ' · '+esc(it.date) : "")+'</small>' : (it.date ? ' <small>'+esc(it.date)+'</small>' : ""));
    if(it.quote) main = '<blockquote class="st-q">'+esc(it.quote)+'</blockquote>';
    if(it.ft) main += '<p class="st-ctx"><a href="#ref-fathers~'+esc(it.ft)+'">Read in context</a>'+(it.src ? ' <small>'+esc(it.src)+'</small>' : "")+'</p>';
    var au = window.HCCAuth ? HCCAuth.match(it.author, it.work) : "";
    if(au) main += HCCAuth.box(au, false);
  } else if(it.type === "doc"){
    var d = docBy(it.doc);
    head = d ? '<a href="#'+esc(d.el)+'" data-opendoc="'+esc(d.el)+'">'+esc(d.title)+'</a> <small>'+esc(d.date || "")+'</small>' : '<b>'+esc(it.title || "Document")+'</b>';
    if(it.quote) main = '<blockquote class="st-q">'+esc(it.quote)+'</blockquote>';
  } else if(it.type === "ep"){
    var e = EP[it.ep];
    head = e ? '<a href="#'+esc(it.ep)+'">'+esc(e.t)+'</a> <small>'+esc(e.g || "")+'</small>' : '<b>'+esc(titleOf(it.ep))+'</b>';
    if(e && e.y && !it.note) main = '<p class="st-q st-syn">'+esc(e.y)+'</p>';
  } else if(it.type === "note"){
    head = '<b>'+esc(it.title || "Note")+'</b>';
    if(it.text) main = '<p class="st-q st-pre">'+esc(it.text)+'</p>';
  } else if(it.type === "link"){
    head = it.url ? '<a href="'+esc(it.url)+'" target="_blank" rel="noopener noreferrer">'+esc(it.title || it.url)+' ↗</a>' : '<b>'+esc(it.title || "Link")+'</b>';
    if(it.url) main = '<p class="st-url">'+esc(it.url.replace(/^https?:\/\//, "").slice(0, 70))+'</p>';
  }
  var re = L && it.answers && L.at[it.answers] ? '<p class="st-re">'+svg("reply")+'<span>Answers '+goBtn(L, it.answers)+'</span></p>' : "";
  var rby = L && L.by[it.id] ? '<p class="st-rby"><span>Answered by '+L.by[it.id].map(function(id){ return goBtn(L, id); }).join(", ")+'</span></p>' : "";
  return '<li class="st-it t-'+it.type+(L && L.by[it.id] ? " is-answered" : "")+'" data-si="'+si+'" data-ii="'+ii+'" data-id="'+esc(it.id || "")+'">'+re+'<p class="st-kind">'+esc(TYPES[it.type] || "")+'</p><div class="st-head">'+head+'</div>'+main+
    (it.note ? '<p class="st-note">'+esc(it.note)+'</p>' : "") + rby +
    '<div class="st-acts"><button type="button" data-st="edit">Edit</button><button type="button" data-st="answer">Answer this</button>'+((it.type === "verse" || (it.type === "father" && it.quote) || (it.type === "doc" && it.quote)) && window.HCCCard ? '<button type="button" data-st="card">Share card</button>' : "")+'<button type="button" data-st="move">Move to '+esc(shortSide(si === 0 ? 1 : 0))+'</button>' +
    (ii > 0 ? '<button type="button" data-st="up" aria-label="Move up">↑</button>' : "") + (ii < n - 1 ? '<button type="button" data-st="down" aria-label="Move down">↓</button>' : "") +
    '<button type="button" data-st="del" class="st-del">Delete</button></div></li>';
}
var CUR = null, VIEW = "cols";
/* linked answers: an item may record the id of the item it answers (it.answers) */
function itemLabel(it){
  if(!it) return "";
  if(it.type === "verse") return vLabel(it);
  if(it.type === "father") return (it.author || "Father") + (it.work ? ", " + it.work : "");
  if(it.type === "doc"){ var d = docBy(it.doc); return d ? d.title : it.title || "Document"; }
  if(it.type === "ep"){ var e = EP[it.ep]; return e ? e.t : titleOf(it.ep); }
  if(it.type === "note") return it.title || String(it.text || "Note").slice(0, 60);
  if(it.type === "link") return it.title || it.url || "Link";
  return "";
}
function links(s){
  var at = {}, by = {};
  s.sides.forEach(function(sd, si){ sd.items.forEach(function(it, ii){ at[it.id] = {si: si, ii: ii, it: it}; }); });
  s.sides.forEach(function(sd){ sd.items.forEach(function(it){ if(it.answers && at[it.answers] && it.answers !== it.id) (by[it.answers] = by[it.answers] || []).push(it.id); }); });
  return {at: at, by: by};
}
function goBtn(L, id){ var x = L.at[id]; return x ? '<button type="button" class="st-go" data-goit="'+esc(id)+'">'+esc(itemLabel(x.it))+'</button> <small>'+esc(shortSide(x.si))+'</small>' : ""; }
function shortSide(i){ var s = CUR && CUR.sides[i]; return s ? s.label : (i ? "Against" : "For"); }

/* ====================================================================== Studies: views */
var STV = art("studies"), showSide = 0;
function renderStudies(){
  if(!STV) return;
  var parts = hashId().split("~"), id = parts[1];
  if(id){ var s = find(id); if(s){ renderStudy(s); return; } }
  CUR = null;
  var list = studies();
  var html = '<p class="eyebrow">Your research</p><h2>Studies</h2><p class="lede">Gather the evidence on a question, for and against: Scripture, the Church Fathers, councils and documents, episodes and your own notes.</p>' +
    '<div class="ed21-acts"><button type="button" class="btn-sm pri" data-st="new">'+svg("plus")+'New study</button><button type="button" class="btn-sm" data-st="ready">Ready-made studies</button><label class="btn-sm">Import a study file<input type="file" accept="application/json,.json" hidden data-st="import"></label></div>';
  if(!list.length){
    html += '<div class="st-empty"><h3>Start with a question</h3><p>For example: “Was the papacy part of the early Church?” Add the verses, Fathers and documents you find on each side as you read. Every verse menu, Fathers excerpt, document and episode has <b>Add to study</b>.</p><button type="button" class="btn-sm pri" data-st="new">New study</button></div>';
  } else {
    html += '<ul class="st-list">' + list.map(function(s){
      var a = s.sides[0] || {items: []}, b = s.sides[1] || {items: []};
      return '<li><a href="#studies~'+esc(s.id)+'"><strong>'+esc(s.title)+'</strong>' + (s.overview ? '<span>'+esc(s.overview.length > 160 ? s.overview.slice(0, 157).replace(/\s\S*$/, "") + "…" : s.overview)+'</span>' : "") +
        '<em>'+esc(a.label)+' '+a.items.length+' · '+esc(b.label)+' '+b.items.length+' · '+esc(new Date(s.updated || s.created).toLocaleDateString())+'</em></a></li>';
    }).join("") + '</ul>';
  }
  STV.innerHTML = html;
}
function threadsHTML(s, L){
  var seen = {};
  function node(id, depth){
    var x = L.at[id]; if(!x || seen[id]) return ""; seen[id] = 1;
    var kids = (L.by[id] || []).map(function(k){ return node(k, depth + 1); }).join("");
    return '<li class="st-tn" data-depth="'+Math.min(depth, 4)+'"><p class="st-side-tag s'+x.si+'">'+esc(shortSide(x.si))+'</p><ol class="st-items">'+itemHTML(x.it, x.si, x.ii, s.sides[x.si].items.length, L)+'</ol>'+(kids ? '<ol class="st-thread">'+kids+'</ol>' : "")+'</li>';
  }
  var roots = [];
  s.sides.forEach(function(sd){ sd.items.forEach(function(it){ if(!it.answers || !L.at[it.answers] || it.answers === it.id) roots.push(it.id); }); });
  var html = roots.map(function(id){ return node(id, 0); }).join("");
  Object.keys(L.at).forEach(function(id){ if(!seen[id]) html += node(id, 0); }); /* items caught in a loop of answers */
  return '<p class="st-tnote">Each claim with the answers given to it, and the answers to those answers.</p><ol class="st-thread st-root">' + (html || '<li class="ed21-empty">Nothing here yet.</li>') + '</ol>';
}
function renderStudy(s){
  CUR = s;
  var L = links(s);
  var html = '<a class="st-back" href="#studies">← All studies</a>' +
    '<label class="st-lab vh" for="stTitle">Study title</label><input id="stTitle" class="st-title" value="'+esc(s.title)+'" data-stf="title" autocomplete="off">' +
    '<label class="st-lab" for="stOv">Overview and your conclusion</label><textarea id="stOv" class="st-ov" rows="3" data-stf="overview" placeholder="What is the question? What do you conclude so far?">'+esc(s.overview || "")+'</textarea>' +
    '<div class="ed21-acts st-tools"><button type="button" class="btn-sm" data-st="md">Export as Markdown</button><button type="button" class="btn-sm" data-st="share">Share as a file</button><button type="button" class="btn-sm st-del" data-st="delstudy">Delete study</button></div>' +
    '<div class="st-view" role="radiogroup" aria-label="View">' + [["cols","Both sides"],["open","Unanswered"],["threads","Threads"]].map(function(v){ return '<button type="button" role="radio" data-view="'+v[0]+'" aria-checked="'+(VIEW === v[0])+'">'+esc(t(v[1]))+'</button>'; }).join("") + '</div>' +
    (VIEW === "threads" ? threadsHTML(s, L) : '<div class="st-seg" role="tablist" aria-label="Positions">' + s.sides.map(function(sd, i){ return '<button type="button" role="tab" data-side="'+i+'" aria-selected="'+(i === showSide)+'">'+esc(sd.label)+' <small>'+sd.items.length+'</small></button>'; }).join("") + '</div>' +
    '<div class="st-cols" data-show="'+showSide+'">' + s.sides.map(function(sd, i){
      return '<section class="st-col" data-i="'+i+'"><header><label class="vh" for="stSide'+i+'">Position name</label><input id="stSide'+i+'" class="st-side" value="'+esc(sd.label)+'" data-stf="side" data-i="'+i+'"><span>'+sd.items.length+'</span></header>' +
        '<ol class="st-items">' + sd.items.map(function(it, ii){ return VIEW === "open" && L.by[it.id] ? "" : itemHTML(it, i, ii, sd.items.length, L); }).join("") + '</ol>' +
        (sd.items.length ? (VIEW === "open" && sd.items.every(function(it){ return L.by[it.id]; }) ? '<p class="ed21-empty">Everything here has an answer.</p>' : "") : '<p class="ed21-empty">Nothing here yet.</p>') +
        '<button type="button" class="btn-sm st-add" data-st="add" data-i="'+i+'">'+svg("plus")+'Add evidence</button></section>';
    }).join("") + '</div>');
  STV.innerHTML = html;
  grow($("#stOv", STV));
  fillVerses(s);
}
function fillVerses(s){
  var B = BIB(); if(!B.text) return;
  s.sides.forEach(function(sd){ sd.items.forEach(function(it){
    if(it.type !== "verse") return;
    B.text({b: it.b, c: it.c, v: it.v, v2: it.v2}, function(r){
      var el = STV.querySelector('[data-vtext="'+it.id+'"]');
      if(!r){ if(el) el.innerHTML = '<span class="st-load">This verse is not in the editions on this device.</span>'; return; }
      if(el) el.textContent = r.text;
      if(r.text !== it.text || r.ed !== it.ed){ update(s.id, function(x){ x.sides.forEach(function(q){ q.items.forEach(function(y){ if(y.id === it.id){ y.text = r.text; y.ed = r.ed; } }); }); }); var h = el && el.parentNode.querySelector(".st-head small"); if(h) h.textContent = r.ed; else if(el){ var hd = el.parentNode.querySelector(".st-head"); if(hd) hd.insertAdjacentHTML("beforeend", ' <small>'+esc(r.ed)+'</small>'); } }
    });
  }); });
}

function grow(ta){ if(!ta) return; ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight + 2, 420) + "px"; }
/* field edits */
var ft = 0;
if(STV) STV.addEventListener("input", function(e){
  var f = e.target.closest("[data-stf]"); if(!f || !CUR) return;
  if(f.tagName === "TEXTAREA") grow(f);
  clearTimeout(ft); var id = CUR.id, k = f.dataset.stf, val = f.value, i = +f.dataset.i;
  ft = setTimeout(function(){
    CUR = update(id, function(s){ if(k === "title") s.title = val.trim() || "Untitled study"; else if(k === "overview") s.overview = val; else if(k === "side" && s.sides[i]) s.sides[i].label = val.trim() || (i ? "Against" : "For"); }) || CUR;
    if(k === "side"){ var b = STV.querySelector('.st-seg [data-side="'+i+'"]'); if(b) b.firstChild.nodeValue = CUR.sides[i].label + " "; }
  }, 350);
});

/* actions */
if(STV) STV.addEventListener("click", function(e){
  var g = e.target.closest("[data-goverse]");
  if(g){ var p = g.dataset.goverse.split("~"), B = BIB(); if(B.go) B.go(null, p[0], +p[1], +p[2]); return; }
  var od = e.target.closest("[data-opendoc]"); if(od){ var dd = document.getElementById(od.dataset.opendoc); if(dd) dd.open = true; return; }
  var sd = e.target.closest("[data-side]"); if(sd && sd.closest(".st-seg")){ showSide = +sd.dataset.side; $$(".st-seg [data-side]", STV).forEach(function(b){ b.setAttribute("aria-selected", String(b === sd)); }); var c = $(".st-cols", STV); if(c) c.dataset.show = showSide; return; }
  var vw = e.target.closest("[data-view]"); if(vw && CUR){ VIEW = vw.dataset.view; renderStudy(CUR); return; }
  var gi = e.target.closest("[data-goit]");
  if(gi && CUR){
    var tid = gi.dataset.goit, Lk = links(CUR).at[tid];
    if(VIEW === "open" && links(CUR).by[tid]){ VIEW = "cols"; renderStudy(CUR); }
    if(Lk && VIEW === "cols" && showSide !== Lk.si && window.matchMedia("(max-width:899px)").matches){ showSide = Lk.si; renderStudy(CUR); }
    var el = STV.querySelector('.st-it[data-id="'+(window.CSS && CSS.escape ? CSS.escape(tid) : tid)+'"]');
    if(el){ el.scrollIntoView({block: "center", behavior: "smooth"}); el.classList.remove("st-flash"); void el.offsetWidth; el.classList.add("st-flash"); var f = el.querySelector("button,a"); if(f) f.focus({preventScroll: true}); }
    return;
  }
  var b = e.target.closest("[data-st]"); if(!b || b.tagName === "INPUT") return;
  var a = b.dataset.st;
  if(a === "ready"){ openReady(); return; }
  if(a === "new"){ var s = newStudy(""); location.hash = "studies~" + s.id; setTimeout(function(){ var ti = $("#stTitle"); if(ti){ ti.focus(); ti.select(); } }, 200); return; }
  if(!CUR) return;
  if(a === "add"){ openAdd({side: +b.dataset.i, study: CUR.id}); return; }
  if(a === "md"){ download(slug(CUR.title) + ".md", "text/markdown", toMD(CUR)); return; }
  if(a === "share"){ download(slug(CUR.title) + ".study.json", "application/json", JSON.stringify({app: "church-history", kind: "study", v: 1, study: CUR}, null, 1)); return; }
  if(a === "delstudy"){ confirmDelete(CUR); return; }
  var li = b.closest(".st-it"); if(!li) return;
  var si = +li.dataset.si, ii = +li.dataset.ii, id = CUR.id;
  if(a === "edit"){ openAdd({study: id, side: si, edit: ii}); return; }
  if(a === "card"){
    var ci = CUR.sides[si].items[ii];
    if(ci.type === "verse"){ var vt = (STV.querySelector('[data-vtext="'+ci.id+'"]') || {}).textContent || ci.text || ""; if(!vt || /Loading/.test(vt)) return; var M0 = window.__BIBMAN__ || {eds: []}, e0 = M0.eds.filter(function(x){ return x.short === ci.ed; })[0]; window.HCCCard({q: vt, by: vLabel(ci), sub: "", src: e0 ? e0.name + (e0.year ? ", " + e0.year : "") : (ci.ed || "")}); }
    else if(ci.type === "father") window.HCCCard({q: ci.quote, by: ci.author || "", sub: [ci.work, ci.date].filter(Boolean).join(" · "), src: ci.src ? ci.src.replace(/^trans\./, "Trans.") : ""});
    else if(ci.type === "doc"){ var dd = docBy(ci.doc); window.HCCCard({q: ci.quote, by: dd ? dd.title : (ci.title || ""), sub: dd && dd.date ? dd.date : "", src: ""}); }
    return;
  }
  if(a === "answer"){ var src = CUR.sides[si].items[ii]; if(!src.id){ CUR = update(id, function(s){ s.sides[si].items[ii].id = uid(); }); src = CUR.sides[si].items[ii]; } openAdd({study: id, side: si ? 0 : 1, answers: src.id, type: "note"}); return; }
  if(a === "del"){
    var gone = CUR.sides[si].items[ii];
    CUR = update(id, function(s){ s.sides[si].items.splice(ii, 1); }); renderStudy(CUR);
    toast("Evidence deleted", {action: "Undo", run: function(){ CUR = update(id, function(s){ s.sides[si].items.splice(ii, 0, gone); }); if(hashId() === "studies~" + id) renderStudy(CUR); }});
    return;
  }
  CUR = update(id, function(s){
    var L = s.sides[si].items, it = L[ii];
    if(a === "up" && ii > 0){ L.splice(ii, 1); L.splice(ii - 1, 0, it); }
    if(a === "down" && ii < L.length - 1){ L.splice(ii, 1); L.splice(ii + 1, 0, it); }
    if(a === "move"){ L.splice(ii, 1); s.sides[si ? 0 : 1].items.push(it); }
  });
  renderStudy(CUR);
});
if(STV) STV.addEventListener("change", function(e){
  var f = e.target.closest('input[type=file][data-st="import"]'); if(!f || !f.files || !f.files[0]) return;
  var r = new FileReader(); r.onload = function(){
    var o; try{ o = JSON.parse(String(r.result || "")); }catch(err){ o = null; }
    var s = o && o.kind === "study" && o.study && Array.isArray(o.study.sides) ? o.study : null;
    if(!s){ toast("That file is not a shared study. Choose a file made with “Share as a file”."); return; }
    addStudy(s, "Study imported");
  };
  r.readAsText(f.files[0]); f.value = "";
});

/* add a study from a file or the ready-made set: new ids, links between items kept */
function addStudy(s, msg){
  s = JSON.parse(JSON.stringify(s));
  s.id = uid(); s.created = s.updated = Date.now(); var remap = {};
  s.sides.forEach(function(sd){ sd.items = sd.items || []; sd.items.forEach(function(it){ var nid = uid() + Object.keys(remap).length.toString(36); if(it.id) remap[it.id] = nid; it.id = nid; }); });
  s.sides.forEach(function(sd){ sd.items.forEach(function(it){ if(it.answers) it.answers = remap[it.answers] || ""; if(!it.answers) delete it.answers; }); });
  var list = studies(); list.unshift(s); saveStudies(list); location.hash = "studies~" + s.id; toast(msg);
}
/* ready-made studies (site/bible/studies.js, built and checked by tools/studies.py) */
var READY = null, readyWait = [];
window.__STUDIES = function(x){ READY = x; readyWait.forEach(function(f){ f(); }); readyWait = []; };
function ready(cb){ if(READY) return cb(); readyWait.push(cb); if(readyWait.length > 1) return; var sc = document.createElement("script"); sc.src = "bible/studies.js"; sc.async = true; sc.onerror = function(){ var w = readyWait; readyWait = []; w.forEach(function(f){ f(); }); }; document.head.appendChild(sc); }
function openReady(){
  ready(function(){
    if(!READY){ toast("The ready-made studies could not be loaded"); return; }
    var have = studies().map(function(x){ return x.title; });
    var d = dialog('<div class="ed21-ph"><h3 id="ed21rT">Ready-made studies</h3><button type="button" class="ed21-x" data-dx="1" aria-label="Close">✕</button></div>' +
      '<div class="ed21-body"><p class="st-tnote">Each gathers the main texts cited on both sides, from the Bible, the early Christian texts and the confessions in this app. Every quotation is checked against its source. Adding one makes your own copy to edit.</p><ul class="ed21-rows st-ready">' +
      READY.map(function(r, i){ var n = r.study.sides.reduce(function(a, sd){ return a + sd.items.length; }, 0); return '<li><button type="button" data-ready="'+i+'"><b>'+esc(r.title)+'</b><span>'+esc(r.blurb)+' · '+n+' items'+(have.indexOf(r.title) >= 0 ? ' · you already have a copy' : "")+'</span></button></li>'; }).join("") +
      '</ul></div>', "ed21rT");
    d.on("[data-ready]", function(e){ var r = READY[+e.target.closest("[data-ready]").dataset.ready]; d.close(); addStudy(r.study, "Study added"); });
  });
}

/* delete a whole study: a named confirmation (DESIGN.md §4) */
function confirmDelete(s){
  var d = dialog('<h3 id="ed21dT">Delete “'+esc(s.title)+'”?</h3><p>This removes the study and its '+(s.sides[0].items.length + s.sides[1].items.length)+' pieces of evidence from this device. You can undo for a few seconds.</p>' +
    '<div class="ed21-dact"><button type="button" class="btn-sm" data-dx="1">Keep it</button><button type="button" class="btn-sm pri st-delpri" data-dok="1">Delete “'+esc(s.title.length > 28 ? s.title.slice(0, 26) + "…" : s.title)+'”</button></div>', "ed21dT");
  d.on("[data-dok]", function(){
    var list = studies(), i = list.map(function(x){ return x.id; }).indexOf(s.id); if(i < 0) return d.close();
    var gone = list.splice(i, 1)[0]; saveStudies(list); d.close(); location.hash = "studies";
    toast("Study deleted", {action: "Undo", run: function(){ var l = studies(); l.splice(i, 0, gone); saveStudies(l); location.hash = "studies~" + gone.id; }});
  });
}

/* export */
function slug(s){ return String(s || "study").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "study"; }
function download(name, mime, text){
  if(APP && APP.saveFile){ try{ APP.saveFile(name, mime, text); toast("Saved " + name); return; }catch(e){} }
  var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], {type: mime})); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function toMD(s){
  var out = ["# " + s.title, ""], L = links(s); if(s.overview) out.push(s.overview, "");
  s.sides.forEach(function(sd){
    out.push("## " + sd.label, "");
    if(!sd.items.length) out.push("_Nothing yet._", "");
    sd.items.forEach(function(it){
      var line = "";
      if(it.type === "verse") line = "**" + vLabel(it) + "**" + (it.ed ? " (" + it.ed + ")" : "") + (it.text ? "  \n> " + it.text : "");
      else if(it.type === "father") line = "**" + (it.author || "") + "**" + (it.work ? ", _" + it.work + "_" : "") + (it.date ? " (" + it.date + ")" : "") + (it.quote ? "  \n> " + it.quote : "");
      else if(it.type === "doc"){ var d = docBy(it.doc); line = "**" + (d ? d.title : it.title || "Document") + "**" + (d && d.date ? " (" + d.date + ")" : "") + (it.quote ? "  \n> " + it.quote : ""); }
      else if(it.type === "ep"){ var e = EP[it.ep]; line = "**Episode:** " + (e ? e.t + " (" + e.g + ")" : it.ep); }
      else if(it.type === "note") line = "**" + (it.title || "Note") + "**" + (it.text ? "  \n" + it.text : "");
      else if(it.type === "link") line = "[" + (it.title || it.url) + "](" + it.url + ")";
      var re = it.answers && L.at[it.answers] ? "  \n  ↳ _Answers: " + itemLabel(L.at[it.answers].it) + " (" + s.sides[L.at[it.answers].si].label + ")_" : "";
      out.push("- " + line.replace(/\n/g, "\n  ") + (it.note ? "  \n  _" + it.note + "_" : "") + re, "");
    });
  });
  out.push("---", "_From History of the Christian Church · " + new Date().toLocaleDateString() + "_");
  return out.join("\n");
}

/* ====================================================================== dialog (sheet on phones) */
function dialog(inner, labelId){
  var back = document.activeElement;
  var w = document.createElement("div"); w.className = "ed21-dlg"; w.innerHTML = '<div class="ed21-scrim" data-dx="1"></div><div class="ed21-panel" role="dialog" aria-modal="true" aria-labelledby="'+labelId+'">'+inner+'</div>';
  document.body.appendChild(w); body.classList.add("ed21-modal");
  var panel = $(".ed21-panel", w);
  function close(){ w.remove(); body.classList.remove("ed21-modal"); document.removeEventListener("keydown", key, true); if(back && back.focus) try{ back.focus(); }catch(e){} }
  function key(e){
    if(e.key === "Escape"){ e.stopPropagation(); close(); }
    if(e.key === "Tab"){ var f = $$('button,input,select,textarea,a[href]', panel).filter(function(x){ return !x.disabled && x.offsetParent !== null; }); if(!f.length) return; var i = f.indexOf(document.activeElement); if(e.shiftKey && i <= 0){ e.preventDefault(); f[f.length - 1].focus(); } else if(!e.shiftKey && i === f.length - 1){ e.preventDefault(); f[0].focus(); } }
  }
  document.addEventListener("keydown", key, true);
  w.addEventListener("click", function(e){ if(e.target.closest("[data-dx]")) close(); });
  setTimeout(function(){ var f = $("input:not([type=hidden]),select,textarea,button:not([data-dx])", panel); if(f) f.focus(); }, 30);
  return {el: panel, close: close, on: function(sel, fn){ panel.addEventListener("click", function(e){ if(e.target.closest(sel)) fn(e); }); }};
}

/* ====================================================================== add or edit evidence */
function openAdd(o){
  o = o || {};
  var list = studies();
  if(!list.length){ var s0 = newStudy("My first study"); list = [s0]; o.study = s0.id; }
  var sid = o.study || (CUR && find(CUR.id) ? CUR.id : list[0].id), s = find(sid) || list[0];
  var editing = o.edit != null ? s.sides[o.side].items[o.edit] : null;
  var it = editing ? JSON.parse(JSON.stringify(editing)) : {type: o.type || "verse"};
  if(!editing){ ["b","c","v","v2","ed","author","work","date","quote","doc","ep","title","text","url","answers","ft","src"].forEach(function(k){ if(o[k] != null) it[k] = o[k]; }); }
  function answerOpts(st){
    return '<option value="">'+esc(t("Nothing (a new point)"))+'</option>' + st.sides.map(function(sd){ return '<optgroup label="'+esc(sd.label)+'">' + sd.items.filter(function(x){ return x.id && x.id !== it.id; }).map(function(x){ var l = itemLabel(x); return '<option value="'+esc(x.id)+'"'+(x.id === it.answers ? " selected" : "")+'>'+esc(l.length > 70 ? l.slice(0, 68) + "…" : l)+'</option>'; }).join("") + '</optgroup>'; }).join("");
  }
  var side = o.side != null ? o.side : 0;
  var DOCS = docs(), fams = {};
  DOCS.forEach(function(d){ (fams[d.fam] = fams[d.fam] || []).push(d); });
  function sel(name, opts, val){ return '<select id="ed21f-'+name+'" data-f="'+name+'">' + opts + '</select>'; }
  function field(name, label, inner, hint){ return '<div class="ed21-fld"><label for="ed21f-'+name+'">'+esc(label)+'</label>'+inner+(hint ? '<small>'+esc(hint)+'</small>' : "")+'</div>'; }
  function inp(name, val, ph){ return '<input id="ed21f-'+name+'" data-f="'+name+'" value="'+esc(val || "")+'"'+(ph ? ' placeholder="'+esc(ph)+'"' : "")+' autocomplete="off">'; }
  function area(name, val, rows){ return '<textarea id="ed21f-'+name+'" data-f="'+name+'" rows="'+(rows || 3)+'">'+esc(val || "")+'</textarea>'; }
  function formFor(ty){
    var h = "";
    if(ty === "verse"){
      var ref = it.b ? vLabel(it) : "";
      h = field("ref", "Bible reference", inp("ref", ref, "Matthew 16:18-19"), "A book, chapter and verse or range, e.g. Jn 21:15-17") + '<div class="ed21-prev" aria-live="polite"></div>';
    } else if(ty === "father"){
      h = '<div class="ed21-find"><p>Find a Father’s comment on a verse</p><div class="ed21-row">'+inp("fref", "", "Matthew 16:18")+'<button type="button" class="btn-sm" data-ff="1">Find</button></div><div class="ed21-fl" aria-live="polite"></div></div>' +
        field("author", "Author", inp("author", it.author, "Irenaeus of Lyons")) + field("work", "Work and passage", inp("work", it.work, "Against Heresies 3.3.2")) + field("date", "Date", inp("date", it.date, "c. 180")) + field("quote", "Quotation", area("quote", it.quote, 4));
    } else if(ty === "doc"){
      h = field("doc", "Document", sel("doc", '<option value="">Choose a document…</option>' + Object.keys(fams).map(function(f){ return '<optgroup label="'+esc(f)+'">' + fams[f].map(function(d){ return '<option value="'+esc(d.id)+'"'+(d.id === it.doc ? " selected" : "")+'>'+esc(d.title)+(d.date ? " ("+esc(d.date)+")" : "")+'</option>'; }).join("") + '</optgroup>'; }).join(""))) +
        field("quote", "Excerpt (optional)", area("quote", it.quote, 4), "Paste the sentence that matters.");
    } else if(ty === "ep"){
      h = field("ep", "Episode", sel("ep", '<option value="">Choose an episode…</option>' + SE.map(function(se){ return '<optgroup label="'+esc((se.l ? se.l + ": " : "") + se.t)+'">' + (se.e || []).map(function(id){ var e = EP[id]; return e ? '<option value="'+id+'"'+(id === it.ep ? " selected" : "")+'>'+esc(e.g + " · " + e.t)+'</option>' : ""; }).join("") + '</optgroup>'; }).join("")));
    } else if(ty === "note"){
      h = field("title", "Title (optional)", inp("title", it.title)) + field("text", "Note", area("text", it.text, 5));
    } else if(ty === "link"){
      h = field("title", "Title", inp("title", it.title, "Article or book title")) + field("url", "Web address", inp("url", it.url, "https://"));
    }
    if(ty !== "note") h += field("note", "Your note (optional)", area("note", it.note, 2), "Why it matters, or how the other side reads it.");
    else h += '<input type="hidden" data-f="note" value="">';
    return h;
  }
  var studyOpts = list.map(function(x){ return '<option value="'+esc(x.id)+'"'+(x.id === s.id ? " selected" : "")+'>'+esc(x.title)+'</option>'; }).join("") + (editing ? "" : '<option value="__new">New study…</option>');
  var d = dialog(
    '<div class="ed21-ph"><h3 id="ed21aT">'+(editing ? "Edit evidence" : "Add to study")+'</h3><button type="button" class="ed21-x" data-dx="1" aria-label="Close">✕</button></div>' +
    '<div class="ed21-body">' +
    (editing ? "" : '<div class="ed21-row2">' + field("study", "Study", '<select id="ed21f-study" data-g="study">'+studyOpts+'</select>') + field("side", "Position", '<select id="ed21f-side" data-g="side">'+s.sides.map(function(x, i){ return '<option value="'+i+'"'+(i === side ? " selected" : "")+'>'+esc(x.label)+'</option>'; }).join("")+'</select>') + '</div>') +
    '<div class="ed21-types" role="radiogroup" aria-label="Kind of evidence">' + Object.keys(TYPES).map(function(k){ return '<button type="button" role="radio" data-ty="'+k+'" aria-checked="'+(k === it.type)+'"'+(editing && k !== it.type ? " disabled" : "")+'>'+esc(TYPES[k])+'</button>'; }).join("") + '</div>' +
    '<div class="ed21-form">' + formFor(it.type) + '</div>' +
    field("answers", "This answers (optional)", '<select id="ed21f-answers" data-g="answers">'+answerOpts(s)+'</select>', "Link it to the claim or point it responds to.") + '</div>' +
    '<div class="ed21-dact"><button type="button" class="btn-sm" data-dx="1">Cancel</button><button type="button" class="btn-sm pri" data-dok="1">'+(editing ? "Save changes" : "Add evidence")+'</button></div>', "ed21aT");
  var P = d.el, form = $(".ed21-form", P);
  function val(k){ var f = P.querySelector('[data-f="'+k+'"]'); return f ? f.value.trim() : ""; }
  function preview(){
    var pv = $(".ed21-prev", P); if(!pv) return; var B = BIB(), r = B.parse ? B.parse(val("ref")) : null;
    if(!val("ref")){ pv.innerHTML = ""; return; }
    if(!r){ pv.innerHTML = '<p class="ed21-err">That reference wasn’t recognised. Try the form “John 21:15-17”.</p>'; return; }
    pv.innerHTML = '<p class="st-load">Loading…</p>';
    B.text(r, function(x){ if(!x){ pv.innerHTML = '<p class="ed21-err">This book isn’t in the editions on this device.</p>'; return; } pv.innerHTML = '<p class="ed21-pl"><b>'+esc(x.label)+'</b> <small>'+esc(x.ed)+'</small></p><p class="ed21-pt">'+esc(x.text)+'</p>'; });
  }
  var pt = 0;
  P.addEventListener("input", function(e){ if(e.target.dataset.f === "ref"){ clearTimeout(pt); pt = setTimeout(preview, 300); } });
  if(it.type === "verse" && it.b) setTimeout(preview, 50);
  P.addEventListener("change", function(e){
    var g = e.target.dataset.g;
    if(g === "study"){
      if(e.target.value === "__new"){ var nm = prompt(t("Name of the new study"), ""); if(!nm){ e.target.value = s.id; return; } var ns = newStudy(nm); list = studies(); s = ns; e.target.insertAdjacentHTML("afterbegin", '<option value="'+esc(ns.id)+'">'+esc(ns.title)+'</option>'); e.target.value = ns.id; }
      else s = find(e.target.value) || s;
      var sideSel = $("#ed21f-side", P); if(sideSel) sideSel.innerHTML = s.sides.map(function(x, i){ return '<option value="'+i+'">'+esc(x.label)+'</option>'; }).join("");
      it.answers = ""; var ans = $("#ed21f-answers", P); if(ans) ans.innerHTML = answerOpts(s);
    }
  });
  P.addEventListener("click", function(e){
    var ty = e.target.closest("[data-ty]");
    if(ty && !ty.disabled){ it = collect(); it.type = ty.dataset.ty; $$("[data-ty]", P).forEach(function(b){ b.setAttribute("aria-checked", String(b === ty)); }); form.innerHTML = formFor(it.type); return; }
    if(e.target.closest("[data-ff]")){
      var fl = $(".ed21-fl", P), B = BIB(), r = B.parse ? B.parse(val("fref")) : null;
      if(!r){ fl.innerHTML = '<p class="ed21-err">Enter a verse, e.g. Matthew 16:18.</p>'; return; }
      fl.innerHTML = '<p class="st-load">Looking…</p>';
      B.fathers(r, function(L){
        if(!L || !L.length){ fl.innerHTML = '<p class="ed21-err">No commentary is gathered for that verse. Try a neighbouring verse.</p>'; return; }
        fl.innerHTML = L.slice(0, 8).map(function(x, i){ return '<button type="button" class="ed21-fo" data-fo="'+i+'"><b>'+esc(x.author)+'</b> <small>'+esc(x.work)+(x.date ? " · "+esc(x.date) : "")+'</small><span>'+esc(x.text.length > 180 ? x.text.slice(0, 177) + "…" : x.text)+'</span></button>'; }).join("");
        fl._list = L;
      });
      return;
    }
    var fo = e.target.closest("[data-fo]");
    if(fo){ var x = $(".ed21-fl", P)._list[+fo.dataset.fo]; [["author", x.author], ["work", x.work], ["date", x.date], ["quote", x.text]].forEach(function(p){ var f = P.querySelector('[data-f="'+p[0]+'"]'); if(f) f.value = p[1] || ""; }); var q = P.querySelector('[data-f="quote"]'); if(q) q.focus(); return; }
  });
  function collect(){
    var o2 = {id: it.id || uid(), type: it.type};
    if(it.type === "father"){ if(it.ft) o2.ft = it.ft; if(it.src) o2.src = it.src; }
    $$("[data-f]", form).forEach(function(f){ if(f.dataset.f !== "ref" && f.dataset.f !== "fref") o2[f.dataset.f] = f.value.trim(); });
    if(it.type === "verse"){ var r = BIB().parse ? BIB().parse(val("ref")) : null; if(r){ o2.b = r.b; o2.c = r.c; o2.v = r.v; o2.v2 = r.v2; } else if(it.b){ o2.b = it.b; o2.c = it.c; o2.v = it.v; o2.v2 = it.v2; } }
    return o2;
  }
  d.on("[data-dok]", function(){
    var x = collect(), err = "", av = ($("#ed21f-answers", P) || {value: ""}).value;
    if(av) x.answers = av; else delete x.answers;
    if(x.type === "verse" && !x.b) err = "Enter a Bible reference, e.g. John 21:15-17.";
    if(x.type === "father" && !x.author && !x.quote) err = "Add at least the author or the quotation.";
    if(x.type === "doc" && !x.doc) err = "Choose a document.";
    if(x.type === "ep" && !x.ep) err = "Choose an episode.";
    if(x.type === "note" && !x.text && !x.title) err = "Write the note first.";
    if(x.type === "link" && !/^https?:\/\/\S+\.\S+/.test(x.url || "")) err = "Enter a full web address starting with https://";
    var eb = $(".ed21-err.top", P); if(eb) eb.remove();
    if(err){ $(".ed21-dact", P).insertAdjacentHTML("beforebegin", '<p class="ed21-err top" role="alert">'+esc(err)+'</p>'); return; }
    var si = editing ? o.side : +($("#ed21f-side", P) || {value: side}).value;
    var target = editing ? sid : s.id;
    var done = update(target, function(st){ if(editing) st.sides[si].items[o.edit] = x; else st.sides[si].items.push(x); });
    d.close();
    if(hashId() === "studies~" + target){ showSide = si; renderStudy(done); }
    else toast(t("Added to") + " " + done.title, {action: "View", run: function(){ showSide = si; location.hash = "studies~" + target; }});
  });
}

/* ====================================================================== "Add to study" from the Bible, the Fathers and the texts */
function hook(){
  var act = $(".bib-act");
  if(act && !act._ed21){ act._ed21 = 1;
    new MutationObserver(function(){ var row = $(".ba-row", act); if(row && !$(".ed21-addv", row)){ var b = document.createElement("button"); b.type = "button"; b.className = "ed21-addv"; b.innerHTML = '＋<small>'+t("Add to study")+'</small>'; row.insertBefore(b, $(".ba-study", row)); } }).observe(act, {childList: true, subtree: true});
    act.addEventListener("click", function(e){ if(!e.target.closest(".ed21-addv")) return; var c = BIB().cur && BIB().cur(); if(!c) return; openAdd({type: "verse", b: c.b, c: c.c, v: c.v, v2: c.v}); });
  }
  var sh = $(".vsheet");
  if(sh && !sh._ed21){ sh._ed21 = 1;
    new MutationObserver(function(){
      $$(".fa", sh).forEach(function(fa){ if($(".ed21-addf", fa)) return; var b = document.createElement("button"); b.type = "button"; b.className = "ed21-addf"; b.textContent = t("Add to study"); fa.appendChild(b); });
      var acts = $(".vs-acts", sh); if(acts && !$(".ed21-addvs", acts)){ var b2 = document.createElement("button"); b2.type = "button"; b2.className = "btn-sm ed21-addvs"; b2.textContent = t("Add to study"); acts.insertBefore(b2, acts.firstChild); }
    }).observe(sh, {childList: true, subtree: true});
    sh.addEventListener("click", function(e){
      var c = BIB().cur && BIB().cur();
      if(e.target.closest(".ed21-addvs") && c){ openAdd({type: "verse", b: c.b, c: c.c, v: c.v, v2: c.v}); return; }
      var fb = e.target.closest(".ed21-addf"); if(!fb) return;
      var fa = fb.closest(".fa"), h = $(".fa-h", fa), au = h ? $("b", h) : null, dt = h ? $(".fa-d", h) : null, wk = h ? $("small", h) : null, tx = $(".fa-t", fa);
      var ref = c ? (BIB().label ? BIB().label(c.b, c.c, c.v, c.v) : "") : "";
      openAdd({type: "father", author: au ? au.textContent : "", date: dt ? dt.textContent.replace(/^lived\s+/, "") : "", work: (wk ? wk.textContent.replace(/\s*·\s*on vv\..*$/, "") : "") + (ref ? " (on " + ref + ")" : ""), quote: tx ? tx.innerText.trim() : ""});
    });
  }
}
document.addEventListener("toggle", function(e){
  var d = e.target; if(!d.classList || !d.classList.contains("doctext") || !d.open || $(".ed21-adddoc", d)) return;
  var b = document.createElement("button"); b.type = "button"; b.className = "btn-sm ed21-adddoc"; b.innerHTML = svg("plus") + t("Add to study");
  var intro = $(".docintro", d); if(intro) intro.insertAdjacentElement("afterbegin", b); else d.appendChild(b);
}, true);
document.addEventListener("click", function(e){ var b = e.target.closest(".ed21-adddoc"); if(!b) return; var d = b.closest("details.doctext"); if(d) openAdd({type: "doc", doc: d.dataset.docId}); });

/* ====================================================================== routing */
function onRoute(){
  var id = activeId();
  if(id === "series") renderSeries();
  else if(id === "library") renderLibrary();
  else if(id === "studies") renderStudies();
  syncNav(); pageTools(); hook();
}
window.addEventListener("hashchange", function(){ setTimeout(onRoute, 0); });
document.addEventListener("click", function(e){
  var b = e.target.closest('[data-ed21="toc"]'); if(b){ openContents(); return; }
  var a = e.target.closest('[data-ed21="all"]'); if(a){ var ab = $("#allBtn"); if(ab) ab.click(); }
});
seed();
setTimeout(onRoute, 0); setTimeout(hook, 800);
window.HCCStudies = {open: openAdd, list: studies};
})();
