(function(){
"use strict";
var M = window.__BIBMAN__, VOTD = window.__VOTD__ || [];
var $ = function(s,r){return (r||document).querySelector(s)};
var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var APP = window.HCCApp && window.HCCApp.isApp ? window.HCCApp : null;
function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]}); }
function get(k,d){ try{ var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } }
function put(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function haptic(k){ try{ if(APP) APP.haptic(k||"tick"); }catch(e){} }
var art = $("#bible"); if(!M || !art) return;
var ED = {}; M.eds.forEach(function(e){ ED[e.id] = e; e.idx = {}; e.books.forEach(function(b, i){ e.idx[b[0]] = i; }); });
var POETRY = {PSA:1, PRO:1, JOB:1, SOL:1, LAM:1, ECC:1, PSX:1, PRM:1};
var GREEKPS = {dra:1, lxx:1, lxxg:1, vul:1};
var SEC = {ot:"Old Testament", dc:"Deuterocanonical books", app:"Appendix", nt:"New Testament"};
var SECDC = {kjva:"Apocrypha", dra:"Deuterocanonical books", webc:"Deuterocanonical books", lxx:"Anagignoskomena (“readable” books)", webo:"Anagignoskomena (“readable” books)"};
var st = get("hcc.bible", {ed:get("hcc.bible.def", "") || "kjv", b:"JOH", c:1, cmp:"", v:0});
if(!ED[st.ed]) st.ed = "kjv";
var readSet = get("hcc.bible.read", {});

/* ---------- loading ---------- */
var CACHE = {}, WAIT = {}, LOADING = {};
window.__BIB = function(src, b, data){ var k = src+"/"+b; CACHE[k] = data; (WAIT[k]||[]).forEach(function(f){ f(data); }); delete WAIT[k]; };
function load(src, b, cb){
  var k = src+"/"+b; if(CACHE[k]) return cb(CACHE[k]);
  if(WAIT[k]){ WAIT[k].push(cb); return; } WAIT[k] = [cb];
  if(window.HCCUserEd && HCCUserEd.owns(src)){ HCCUserEd.load(src, b, function(d){ if(d) CACHE[k] = d; var w = WAIT[k] || []; delete WAIT[k]; w.forEach(function(f){ f(d); }); }); return; }
  function sg(bk){ var g = (M.grp||{})[bk] || "dc"; return M.sgrp ? M.sgrp[g] : g; }
  var file = "bible/"+src+"/"+sg(b)+".js";
  if(LOADING[file] === 2){ var w0 = WAIT[k]; delete WAIT[k]; w0.forEach(function(f){ f(null); }); return; }
  if(LOADING[file]) return; LOADING[file] = 1;
  var s = document.createElement("script"); s.src = file; s.async = true;
  s.onload = function(){ LOADING[file] = 2; Object.keys(WAIT).forEach(function(kk){ if(kk.indexOf(src+"/") === 0 && !CACHE[kk] && sg(kk.slice(src.length+1)) === sg(b)){ var w = WAIT[kk]; delete WAIT[kk]; w.forEach(function(f){ f(null); }); } }); };
  s.onerror = function(){ delete LOADING[file]; s.remove(); Object.keys(WAIT).forEach(function(kk){ if(kk.indexOf(src+"/") === 0){ var w = WAIT[kk]; delete WAIT[kk]; w.forEach(function(f){ f(null); }); } }); };
  document.head.appendChild(s);
}
function chapter(data, c){ if(!data) return null; for(var i=0;i<data.length;i++) if(data[i][0] === c) return data[i][1]; return null; }

/* ---------- psalm numbering ---------- */
function hebToGreek(c){ if(c<=8||c>=148) return c; if(c===9||c===10) return 9; if(c<=113) return c-1; if(c===114||c===115) return 113; if(c===116) return 114; if(c<=146) return c-1; return 146; }
function greekToHeb(c){ if(c<=8||c>=148) return c; if(c===9) return 9; if(c<=112) return c+1; if(c===113) return 114; if(c===114||c===115) return 116; if(c<=145) return c+1; return 147; }
function mapCh(fromEd, toEd, b, c){
  if(b !== "PSA") return c;
  var g1 = !!GREEKPS[ED[fromEd].books[ED[fromEd].idx[b]][1]], g2 = !!GREEKPS[ED[toEd].books[ED[toEd].idx[b]][1]];
  if(g1 === g2) return c; return g1 ? greekToHeb(c) : hebToGreek(c);
}
function equiv(ed, b){ if(ED[ed].idx[b] != null) return b; var alt = {EST:"ESG", ESG:"EST", DAN:"DNG", DNG:"DAN"}[b]; return alt && ED[ed].idx[alt] != null ? alt : null; }

/* ---------- text ---------- */
function fmt(t){ return esc(t).replace(/\[([^\]]{1,80})\]/g, "<i>$1</i>"); }
function verses(list, b, hl){
  if(!list) return '<p class="bb-miss">This chapter could not be loaded.</p>';
  var poetry = POETRY[b], out = "", open = false;
  list.forEach(function(v, i){
    var span = '<span class="bv'+(hl && v[0] === hl ? " hl" : "")+noteCls(b, v[0])+'" data-v="'+v[0]+'"><sup>'+v[0]+'</sup>'+vtext(b, v)+'</span> ';
    if(poetry){ out += '<p class="bpo">'+span+'</p>'; return; }
    if(!open || v[2]){ if(open) out += "</p>"; out += "<p>"; open = true; }
    out += span;
  });
  return out + (open ? "</p>" : "");
}
function ltag(ed){ var e = ED[ed]; return e && e.rtl ? ' dir="rtl" lang="'+(e.lang||"ar")+'"' : ""; }
function bname(ed, b){ var i = ED[ed].idx[b]; return i == null ? b : ED[ed].books[i][2]; }
function shortName(ed, b){ return bname(ed, b).replace(/\s*\(.*\)$/, ""); }

/* ---------- views ---------- */
var view = $("#bibView"), bar = $("#bibBar");
function edPicker(){
  var groups = {}; M.eds.forEach(function(e){ (groups[e.trad] = groups[e.trad] || []).push(e); });
  return '<div class="bib-eds">' + Object.keys(groups).map(function(g){
    return '<div class="bib-edg"><p class="shelf-h">'+esc(g)+'</p>' + groups[g].map(function(e){
      return '<button type="button" class="bib-ed'+(e.id === st.ed ? " on" : "")+'" data-ed="'+e.id+'"><b>'+esc(e.short)+'</b><span>'+esc(e.name)+'</span><small>'+e.books.length+' books · '+esc(e.year)+'</small></button>';
    }).join("") + '</div>';
  }).join("") + '</div>';
}
function grid(){
  var e = ED[st.ed], secs = {};
  var sep = e.id === "kjva";
  e.books.forEach(function(b){ var k = b[4] === "dc" && !sep ? "ot" : b[4]; (secs[k] = secs[k] || []).push(b); });
  var html = '<div class="bib-intro"><h3>'+esc(e.name)+'</h3><p class="cmp-note">'+esc(e.note)+(!sep && e.books.some(function(b){ return b[4] === "dc"; }) ? ' Books with a dashed border are those not in the Protestant canon.' : "")+'</p></div>';
  ["ot","dc","app","nt"].forEach(function(s){
    if(!secs[s]) return;
    html += '<section class="bib-sec"><p class="shelf-h">'+esc(s === "dc" ? (SECDC[e.id] || SEC.dc) : SEC[s])+' <span>'+secs[s].length+'</span></p><div class="bib-books">' + secs[s].map(function(b){
      var n = 0; for(var c=1;c<=b[3];c++) if(readSet[e.id+"."+b[0]+"."+c]) n++;
      var nm = b[2].match(/^(.*?)\s*\((.*)\)$/);
      return '<button type="button" class="bib-bk'+(b[4] === "dc" || b[4] === "app" ? " dc" : "")+(b[0] === st.b ? " on" : "")+'" data-b="'+b[0]+'" style="--p:'+(n/b[3]*100).toFixed(1)+'%"'+(b[4] === "dc" ? ' title="Deuterocanonical"' : "")+'><span>'+(nm ? esc(nm[1])+'<em>'+esc(nm[2])+'</em>' : esc(b[2]))+'</span><small>'+b[3]+' ch.</small></button>';
    }).join("") + '</div></section>';
  });
  return html;
}
var pickFrom = "";
function chapGrid(b){
  var e = ED[st.ed], bk = e.books[e.idx[b]], html = '<div class="bib-chs">';
  for(var c=1;c<=bk[3];c++) html += '<button type="button" data-c="'+c+'" class="'+(readSet[e.id+"."+b+"."+c] ? "rd" : "")+(c === st.c && b === pickFrom ? " on" : "")+'">'+c+'</button>';
  return html + '</div>';
}
var mode = "read";
function setBar(){
  var e = ED[st.ed], chev = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  bar.innerHTML = '<button type="button" class="bib-chip bk" data-act="books" aria-expanded="'+(mode==="books"||mode==="chapters")+'">'+esc(shortName(st.ed, st.b))+' '+st.c+' '+chev+'</button>'+
    '<button type="button" class="bib-chip ed" data-act="eds" aria-expanded="'+(mode==="eds")+'">'+esc(e.short)+' '+chev+'</button>'+
    '<span class="bib-sp"></span>'+
    '<div class="bib-seg" role="group" aria-label="Reading mode"><button type="button" data-study="0" aria-pressed="'+(!st.study)+'">Read</button><button type="button" data-study="1" aria-pressed="'+(!!st.study)+'">Study</button></div>'+
    '<button type="button" class="bib-more" data-more="1" aria-expanded="'+(!!st.tools)+'" aria-label="Tools"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="5" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="19" cy="12" r="1.8" fill="currentColor"/></svg></button>';
  var cs = $("#bibCmp"); if(cs){ cs.innerHTML = '<option value="">Compare with…</option>'+M.eds.filter(function(x){ return x.id !== st.ed; }).map(function(x){ return '<option value="'+x.id+'"'+(st.cmp === x.id ? " selected" : "")+'>'+esc(x.short)+' · '+esc(x.trad)+'</option>'; }).join(""); }
  art.classList.toggle("study", !!st.study); art.classList.toggle("tools-open", !!st.tools);
  art.dataset.mode = mode;
}
/* ---------- picker sheet (editions, books, chapters) ---------- */
var PICK = {eds: "Choose an edition", books: "Choose a book", chapters: ""};
var pkr = document.createElement("div"); pkr.className = "bpick"; pkr.hidden = true; pkr.setAttribute("role", "dialog"); pkr.setAttribute("aria-modal", "true"); pkr.setAttribute("aria-labelledby", "bpickH");
pkr.innerHTML = '<div class="bpick-bg" data-pclose="1"></div><div class="bpick-in"><div class="bpick-grab" aria-hidden="true"></div><div class="bpick-head"><button type="button" class="bpick-back" data-pback="1" aria-label="Back to books" hidden>←</button><h3 id="bpickH"></h3><button type="button" class="vs-x" data-pclose="1" aria-label="Close">✕</button></div>'+
  '<form class="bib-go" role="search" id="bibGo"><label class="vh" for="bibRef">Go to a passage</label><input id="bibRef" type="search" placeholder="Go to… John 3:16, Psalm 23" autocomplete="off" enterkeyhint="go"></form><div class="bpick-body" id="bpickBody"></div></div>';
document.body.appendChild(pkr);
function pickShow(html){
  $("#bpickH", pkr).textContent = mode === "chapters" ? bname(st.ed, st.b) : PICK[mode];
  $("[data-pback]", pkr).hidden = mode !== "chapters"; $("#bibGo", pkr).hidden = mode === "eds";
  $("#bpickBody", pkr).innerHTML = html; $("#bpickBody", pkr).scrollTop = 0;
  if(pkr.hidden){ pkr.hidden = false; document.body.classList.add("bpick-open"); }
  var on = $(".bib-bk.on, .bib-chs .on, .bib-ed.on", pkr); if(on) setTimeout(function(){ on.scrollIntoView({block: "center"}); }, 30);
}
function pickHide(){ if(pkr.hidden) return; pkr.hidden = true; document.body.classList.remove("bpick-open"); }
var pickPrev = "read";
function pickClose(){ if(PICK[mode] != null) mode = pickPrev || "read"; pickHide(); setBar(); }
window.HCCBiblePickOpen = function(){ return !pkr.hidden; }; window.HCCBiblePickClose = pickClose;
window.HCCVerseBarOpen = function(){ return !act.hidden; }; window.HCCVerseBarClose = function(){ hideAct(); };
function save(){ put("hcc.bible", st); }
function render(opts){
  opts = opts || {};
  setBar();
  if(mode === "eds"){ pickShow(edPicker()); return; }
  if(mode === "books"){ pickShow(grid()); return; }
  if(mode === "chapters"){ pickShow(chapGrid(st.b) + introCard(st.b, false)); return; }
  pickHide(); hideAct();
  if(XMODE[mode]){ toolsMark(); return XMODE[mode](); }
  var e = ED[st.ed]; if(e.idx[st.b] == null){ st.b = e.books[0][0]; st.c = 1; }
  var bk = e.books[e.idx[st.b]]; if(st.c > bk[3]) st.c = bk[3]; if(st.c < 1) st.c = 1;
  save();
  var myB = st.b, myC = st.c, myEd = st.ed, cmp = st.cmp && ED[st.cmp] ? st.cmp : "", hl = opts.v || 0;
  view.innerHTML = '<div class="bib-load" aria-busy="true"><span></span><span></span><span></span></div>';
  load(bk[1], st.b, function(data){
    if(myB !== st.b || myC !== st.c || myEd !== st.ed) return;
    var list = chapter(data, st.c);
    var one = bk[3] === 1;
    var head = '<header class="bib-ch"><p class="bib-ch-b">'+esc(shortName(st.ed, st.b))+'</p><h3'+(one ? ' class="one"' : "")+'><span class="vh">'+esc(bname(st.ed, st.b))+' </span><span>'+(one ? esc(shortName(st.ed, st.b)) : st.c)+'</span></h3><p class="bib-ch-e">'+esc(e.name)+'</p></header>' + (st.c === 1 && !cmp ? introCard(st.b, true) : "");
    var ei = e.idx[st.b], pv = st.c > 1 ? [st.b, st.c-1] : ei > 0 ? [e.books[ei-1][0], e.books[ei-1][3]] : null, nx = st.c < bk[3] ? [st.b, st.c+1] : ei < e.books.length-1 ? [e.books[ei+1][0], 1] : null;
    function lab(x){ return esc(shortName(st.ed, x[0])) + " " + x[1]; }
    var nav = '<nav class="bib-pn" aria-label="Chapters">'+(pv ? '<button type="button" data-step="-1"><small>Previous</small><b>'+lab(pv)+'</b></button>' : '<span></span>')+(nx ? '<button type="button" class="nx" data-step="1"><small>Next</small><b>'+lab(nx)+'</b></button>' : '<span></span>')+'</nav>';
    fabs(pv, nx);
    function done(right){
      view.innerHTML = head + (cmp ? right : '<div class="bib-text'+(POETRY[st.b] ? " poetry" : "")+'"'+ltag(st.ed)+'>'+verses(list, st.b, hl)+'</div>') + nav + '<section class="bib-conn" id="bibConn" aria-label="Connected chapters"></section>' +
        ext() + '<p class="bib-src">'+esc(M.src[bk[1]] || "")+'</p>';
      if(!opts.keep) window.scrollTo({top: art.getBoundingClientRect().top + scrollY - 70, behavior: "instant" in window ? "instant" : "auto"});
      if(hl){ var el = $('.bv[data-v="'+hl+'"]', view); if(el) setTimeout(function(){ el.scrollIntoView({block:"center"}); }, 60); }
      progress(); conn(); if(studyDock()) setTimeout(function(){ studyAuto(hl); }, 40); else if(sheet.classList.contains("docked")) closeSheet();
    }
    if(!cmp) return done();
    var b2 = equiv(cmp, st.b);
    if(!b2){ return done('<p class="bib-note">'+esc(bname(st.ed, st.b))+' is not part of the '+esc(ED[cmp].name)+'.</p><div class="bib-text"'+ltag(st.ed)+'>'+verses(list, st.b, hl)+'</div>'); }
    var bk2 = ED[cmp].books[ED[cmp].idx[b2]], c2 = mapCh(st.ed, cmp, st.b, st.c);
    load(bk2[1], b2, function(d2){
      if(myB !== st.b || myC !== st.c || myEd !== st.ed) return;
      var l2 = chapter(d2, c2) || [], by = {}, keys = [];
      (list||[]).forEach(function(v){ if(!by[v[0]]) { by[v[0]] = [null,null]; keys.push(v[0]); } by[v[0]][0] = v; });
      l2.forEach(function(v){ if(!by[v[0]]) { by[v[0]] = [null,null]; keys.push(v[0]); } by[v[0]][1] = v; });
      keys.sort(function(a,b){ return a-b; });
      var note = (st.b === "PSA" && c2 !== st.c) ? '<p class="bib-note">Psalm '+st.c+' in the '+esc(ED[st.ed].short)+' numbering is Psalm '+c2+' in the '+esc(ED[cmp].short)+'. Verse numbers can differ by one where the title is counted as a verse.</p>' :
                 (b2 !== st.b ? '<p class="bib-note">Shown from '+esc(bname(cmp, b2))+' in the '+esc(ED[cmp].short)+'; chapter and verse numbers of the Greek additions differ between editions.</p>' : "");
      done(note + '<div class="bib-par"><div class="bib-ph"><b>'+esc(ED[st.ed].short)+'</b><b>'+esc(ED[cmp].short)+(c2 !== st.c ? " · Ps "+c2 : "")+'</b></div>' + keys.map(function(k){
        var a = by[k][0], z = by[k][1];
        return '<div class="bib-row"><p'+ltag(st.ed)+'>'+(a ? '<span class="bv'+(hl===k?" hl":"")+'" data-v="'+k+'"><sup>'+k+'</sup>'+fmt(a[1])+'</span>' : '<span class="bib-gap">—</span>')+'</p><p'+ltag(cmp)+'>'+(z ? '<span class="bv2"><sup>'+k+'</sup>'+fmt(z[1])+'</span>' : '<span class="bib-gap">—</span>')+'</p></div>';
      }).join("") + '</div>');
    });
  });
}
/* ---------- copyrighted editions: open the publisher's own text ---------- */
var USC = {SOL:"songofsongs", PSX:null, PRM:null, "1ES":null, "4ES":null, "3MA":null, "4MA":null, EPJ:"baruch", PRA:"daniel", SUS:"daniel", BEL:"daniel", ESG:"esther", DNG:"daniel", JOH:"john", MAR:"mark", PHI:"philippians", PHM:"philemon", JAM:"james", JUD:"jude", "1JO":"1john", "2JO":"2john", "3JO":"3john", JOE:"joel", EZE:"ezekiel", JDG:"judges"};
function hebCh(){ var src = ED[st.ed].books[ED[st.ed].idx[st.b]][1]; return st.b === "PSA" && GREEKPS[src] ? greekToHeb(st.c) : st.c; }
function ext(){
  var b = st.b, base = shortName(st.ed, b), c = hebCh();
  var slug = b in USC ? USC[b] : (base.toLowerCase().replace(/[^a-z0-9]/g, ""));
  if(b === "SOL") base = "Song of Songs";
  if(b === "PSA") base = "Psalm";
  var gwName = {PSX:"Psalm 151", PRA:"Song of Three Youths", ESG:"Greek Esther", DNG:"Daniel"}[b] || base;
  var links = [];
  if(slug) links.push('<a class="bib-ext" href="https://bible.usccb.org/bible/'+slug+'/'+c+'" target="_blank" rel="noopener">NABRE <small>at USCCB</small></a>');
  links.push('<a class="bib-ext" href="https://www.biblegateway.com/passage/?search='+encodeURIComponent(gwName+" "+c)+'&amp;version=RSVCE" target="_blank" rel="noopener">RSV-CE <small>at BibleGateway</small></a>');
  return '<div class="bib-exts"><p>Read '+esc(base)+' '+c+' in a copyrighted Catholic translation'+(c !== st.c ? ' (Hebrew numbering, Psalm '+c+')' : '')+':</p>'+links.join("")+'</div>';
}
function markRead(){
  var k = st.ed+"."+st.b+"."+st.c; if(readSet[k]) return; readSet[k] = 1; put("hcc.bible.read", readSet);
}
function progress(){
  var label = shortName(st.ed, st.b)+" "+st.c;
  put("hcc.bible.last", {l:label, ed:ED[st.ed].short, t:Date.now()});
  try{ if(APP && APP.setProgress) APP.setProgress(label, "The Bible · "+ED[st.ed].short, "bible"); }catch(e){}
}
function step(d){
  var e = ED[st.ed], i = e.idx[st.b], bk = e.books[i];
  if(d > 0) markRead();
  var c = st.c + d;
  if(c < 1){ if(i === 0) return; bk = e.books[i-1]; st.b = bk[0]; st.c = bk[3]; }
  else if(c > bk[3]){ if(i === e.books.length-1) return; st.b = e.books[i+1][0]; st.c = 1; }
  else st.c = c;
  haptic("tick"); render();
}

/* ---------- reference parser ---------- */
var ALIAS = null;
function aliases(){
  if(ALIAS) return ALIAS; ALIAS = [];
  var seen = {};
  M.eds.forEach(function(e){ e.books.forEach(function(b){
    var names = [b[2]].concat((b[2].match(/\(([^)]+)\)/)||[]).slice(1)).map(function(n){ return n.replace(/\s*\(.*\)$/,""); });
    names.push(b[0]);
    names.forEach(function(n){ var k = n.toLowerCase().replace(/[^a-z0-9]/g,""); if(k && !seen[k+b[0]]){ seen[k+b[0]] = 1; ALIAS.push([k, b[0]]); } });
  }); });
  [["song",'SOL'],["songofsolomon","SOL"],["canticles","SOL"],["ps","PSA"],["psalm","PSA"],["jn","JOH"],["mt","MAT"],["mk","MAR"],["lk","LUK"],["rev","REV"],["gen","GEN"],["ex","EXO"],["is","ISA"],["ecclesiasticus","SIR"],["sirach","SIR"],["apocalypse","REV"],["phil","PHI"],["phlm","PHM"],["jas","JAM"]].forEach(function(x){ ALIAS.push(x); });
  return ALIAS;
}
function parseRef(s){
  var m = String(s).trim().match(/^((?:[1-4]\s*)?[A-Za-z][A-Za-z .]*?)\s*(\d+)?(?:\s*[:.,]\s*(\d+))?\s*$/); if(!m) return null;
  var key = m[1].toLowerCase().replace(/[^a-z0-9]/g,""), best = null;
  aliases().forEach(function(a){
    if(a[0] === key) best = best && best[1] === 0 ? best : [a[1], 0];
    else if(!best && a[0].indexOf(key) === 0 && key.length >= 2) best = [a[1], 1];
  });
  if(!best) return null;
  return {b: best[0], c: +(m[2]||1), v: +(m[3]||0)};
}

/* ---------- open (also used by the verse of the day and widgets) ---------- */
function go(ed, b, c, v){
  if(ed && ED[ed]) st.ed = ed;
  else if(!ed && defEd() && ED[defEd()].idx[b] != null) st.ed = defEd();
  var b2 = equiv(st.ed, b);
  if(!b2){ var alt = M.eds.filter(function(e){ return e.idx[b] != null; })[0]; if(alt){ st.ed = alt.id; b2 = b; } else return false; }
  st.b = b2; st.c = c || 1; mode = "read";
  if(location.hash !== "#bible") { pendingV = v || 0; location.hash = "bible"; } else render({v: v||0});
  return true;
}
var pendingV = 0;
window.HCCBible = {go: go,
  /* Edition 21: for Studies */
  parse: function(q){ var x = String(q || "").replace(/[\u2013\u2014]/g, "-").match(/^(.*?\d+(?:\s*[:.,]\s*\d+)?)\s*(?:-\s*(\d+))?\s*$/), r = x ? parseRef(x[1]) : null; if(!r || !r.v) return null; var v2 = x[2] ? Math.max(+x[2], r.v) : r.v; return {b: r.b, c: r.c, v: r.v, v2: v2}; },
  /* a reference typed in the main search bar ("John 3:36", "1 Cor 13", "Ps 23:1-4"): needs a chapter; null if the book or chapter does not exist */
  ref: function(q){ var x = String(q || "").replace(/[\u2013\u2014]/g, "-").match(/^(.*?\d+(?:\s*[:.,]\s*\d+)?)\s*(?:-\s*(\d+))?\s*$/), r = x && /[a-z].*\d/i.test(x[1]) ? parseRef(x[1]) : null; if(!r) return null;
    var ed = qEd(r.b), bk = ED[ed].books[ED[ed].idx[r.b]]; if(!bk || r.c < 1 || r.c > bk[3]) return null;
    var v2 = x[2] && r.v ? Math.max(+x[2], r.v) : r.v; return {b: r.b, c: r.c, v: r.v, v2: v2, label: shortName(ed, r.b) + " " + r.c + (r.v ? ":" + r.v + (v2 !== r.v ? "\u2013" + v2 : "") : "")}; },
  label: function(b, c, v, v2){ try{ return shortName(qEd(b), b) + " " + c + ":" + v + (v2 && v2 !== v ? "\u2013" + v2 : ""); }catch(e){ return b + " " + c + ":" + v; } },
  text: function(r, cb){ try{ var ed = qEd(r.b), ch = xchap(ed, r.b, r.c), src = srcOf(ed, r.b); if(!src) return cb(null);
    load(src, r.b, function(d){ var t = (chapter(d, ch) || []).filter(function(x){ return x[0] >= r.v && x[0] <= (r.v2 || r.v); }).map(function(x){ return x[1]; }).join(" ").replace(/\s+/g, " ").trim();
      cb(t ? {text: t, ed: ED[ed].short, label: shortName(ed, r.b) + " " + r.c + ":" + r.v + (r.v2 && r.v2 !== r.v ? "\u2013" + r.v2 : "")} : null); }); }catch(e){ cb(null); } },
  fathers: function(r, cb){ try{ var ob = origBook(r.b) || r.b, ch = engCh(edFor(r.b), r.b, r.c), g = grpOf(ob);
    script("bible/fath/"+g+".js", function(){ return !!FATH[ob] || FATH["__"+g]; }, function(){ FATH["__"+g] = 1; var L = [];
      (pick(FATH[ob], ch) || []).forEach(function(e){ if(r.v >= e[0] && r.v <= e[1]) L.push({author: e[2], work: String(e[3]).replace(/^Catena Aurea by Aquinas$/, "quoted in Aquinas, Catena Aurea"), text: e[4], date: e[5] || ""}); });
      cb(L); }); }catch(e){ cb([]); } },
  /* Edition 26: how many excerpts in the Fathers' commentary cover each verse of a chapter */
  fcount: function(ed, b, c, cb){ try{ var ob = origBook(b) || b, ch = engCh(ed, b, c), g = grpOf(ob);
    script("bible/fath/"+g+".js", function(){ return !!FATH[ob] || FATH["__"+g]; }, function(){ FATH["__"+g] = 1; var n = {}, who = {};
      (pick(FATH[ob], ch) || []).forEach(function(e){ for(var v = e[0]; v <= e[1] && v - e[0] < 200; v++){ n[v] = (n[v] || 0) + 1; (who[v] = who[v] || {})[e[2]] = 1; } });
      var out = {}; Object.keys(n).forEach(function(v){ out[v] = [n[v], Object.keys(who[v]).length]; }); cb(out); }); }catch(e){ cb({}); } },
  state: function(){ return {ed: st.ed, b: st.b, c: st.c, mode: mode}; },
  openTab: function(v, t){ try{ openVerseTab(v, t); }catch(e){} },
  cur: function(){ return cur; }
};

/* ---------- events ---------- */
bar.addEventListener("click", function(e){
  var b = e.target.closest("[data-act]"); if(!b) return;
  var a = b.dataset.act; haptic("tick");
  if(PICK[mode] != null && (a === mode || (a === "books" && mode === "chapters"))){ pickClose(); return; }
  if(a === "books"){ pickFrom = st.b; pickSt = {b: st.b, c: st.c}; }
  if(PICK[mode] == null) pickPrev = mode;
  mode = a; render();
});
var pickSt = null;
bar.addEventListener("click", function(e){
  var t;
  if((t = e.target.closest("[data-study]"))){ var on = t.dataset.study === "1"; if(!!st.study === on) return; st.study = on; save(); setBar(); haptic("tick"); hideAct(); if(!on) closeSheet(); else studyAuto(); return; }
  if((t = e.target.closest("[data-more]"))){ st.tools = !st.tools; save(); setBar(); return; }
});
function goSubmit(e){
  e.preventDefault(); var inp = $("#bibRef"), r = parseRef(inp.value);
  if(!r){ inp.setCustomValidity("Try a reference like “John 3:16” or “Psalm 23”."); inp.reportValidity(); setTimeout(function(){ inp.setCustomValidity(""); }, 2500); return; }
  inp.blur(); inp.value = ""; mode = "read"; pickHide(); go(st.ed, r.b, r.c, r.v);
}
pkr.addEventListener("submit", goSubmit);
pkr.addEventListener("click", function(e){
  if(e.target.closest("[data-pclose]")){ if(pickSt && mode === "chapters"){ st.b = pickSt.b; st.c = pickSt.c; } pickClose(); return; }
  if(e.target.closest("[data-pback]")){ mode = "books"; render(); return; }
  pickClick(e);
});
document.addEventListener("keydown", function(e){ if(e.key === "Escape" && !pkr.hidden){ if(pickSt && mode === "chapters"){ st.b = pickSt.b; st.c = pickSt.c; } pickClose(); } });
art.addEventListener("change", function(e){ if(e.target.id === "bibCmp"){ st.cmp = e.target.value; save(); mode = "read"; render({keep:true}); } });
function pickClick(e){
  var t;
  if((t = e.target.closest("[data-ed]"))){ st.ed = t.dataset.ed; if(st.cmp === st.ed) st.cmp = ""; var b2 = equiv(st.ed, st.b); if(b2) st.b = b2; mode = b2 ? "read" : "books"; haptic("tick"); render(); return true; }
  if((t = e.target.closest("[data-b]"))){ st.b = t.dataset.b; st.c = 1; var bk = ED[st.ed].books[ED[st.ed].idx[st.b]]; mode = bk[3] > 1 ? "chapters" : "read"; haptic("tick"); render(); return true; }
  if((t = e.target.closest("[data-c]"))){ st.c = +t.dataset.c; mode = "read"; pickSt = null; haptic("tick"); render(); return true; }
  return false;
}
view.addEventListener("click", function(e){
  var t;
  if((t = e.target.closest("[data-step]"))){ step(+t.dataset.step); return; }
  if((t = e.target.closest("[data-act]"))){ mode = t.dataset.act; if(mode === "books"){ pickFrom = st.b; pickSt = {b: st.b, c: st.c}; } render(); return; }
  if((t = e.target.closest(".bv"))){ if(st.study || !$("#bible.active")) openSheet(t); else selectVerse(t); }
});
/* floating chapter arrows */
var fab = document.createElement("div"); fab.className = "bib-fabs"; fab.hidden = true;
fab.innerHTML = '<button type="button" data-fstep="-1" aria-label="Previous chapter"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button type="button" data-fstep="1" aria-label="Next chapter"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
document.body.appendChild(fab);
function fabs(pv, nx){ fab.hidden = false; fab.firstChild.disabled = !pv; fab.lastChild.disabled = !nx; }
fab.addEventListener("click", function(e){ var b = e.target.closest("[data-fstep]"); if(b && !b.disabled) step(+b.dataset.fstep); });
/* calm reader: tap a verse for a small action bar */
var act = document.createElement("div"); act.className = "bib-act"; act.hidden = true; act.setAttribute("role", "toolbar"); act.setAttribute("aria-label", "Verse actions");
document.body.appendChild(act);
function hideAct(){ if(act.hidden) return; act.hidden = true; $$(".bv.sel", view).forEach(function(x){ x.classList.remove("sel"); }); }
function selectVerse(el){
  var was = el.classList.contains("sel"); hideAct(); if(was) return;
  el.classList.add("sel");
  openAt(st.ed, st.b, st.c, +el.dataset.v, el.textContent.replace(/^\d+/, "").trim(), true);
  var n = (typeof NOTES !== "undefined" && NOTES[curKey()]) || {};
  act.innerHTML = '<div class="ba-top"><b>'+esc(shortName(st.ed, st.b))+' '+st.c+':'+el.dataset.v+'</b><button type="button" class="ba-x" data-a="x" aria-label="Close">✕</button></div>'+
    '<div class="ba-row"><span class="ba-hcs">'+["y","g","b","p"].map(function(c){ return '<button type="button" class="hcb hc-'+c+'" data-a="hc" data-hc="'+c+'" aria-label="Highlight" aria-pressed="'+(n.h === c)+'"></button>'; }).join("")+(n.h ? '<button type="button" class="hcb hcx" data-a="hc" data-hc="" aria-label="Remove highlight">✕</button>' : "")+'</span>'+
    '<button type="button" data-a="bm" aria-pressed="'+(!!n.k)+'">'+(n.k ? "★" : "☆")+'<small>Save</small></button><button type="button" data-a="note">✎<small>Note</small></button><button type="button" data-a="copy">⧉<small>Copy</small></button>'+(window.HCCShareCard ? '<button type="button" data-a="card">↗<small>Share</small></button>' : "")+
    '<button type="button" class="ba-study" data-a="study">Study<small>Greek · Links · Fathers</small></button></div>';
  act.hidden = false; haptic("tick");
}
act.addEventListener("click", function(e){
  var b = e.target.closest("[data-a]"); if(!b || !cur) return; var a = b.dataset.a, el = $('.bv[data-v="'+cur.v+'"]', view);
  var ref = shortName(cur.ed, cur.b)+" "+cur.c+":"+cur.v+" ("+ED[cur.ed].short+")";
  if(a === "x"){ hideAct(); return; }
  if(a === "hc"){ setNote({h: b.dataset.hc}); haptic("tick"); hideAct(); return; }
  if(a === "bm"){ setNote({k: !(NOTES[curKey()]||{}).k}); haptic("tick"); hideAct(); return; }
  if(a === "copy"){ try{ navigator.clipboard.writeText("“"+cur.txt+"” — "+ref); }catch(err){} b.lastChild.textContent = "Copied"; setTimeout(hideAct, 700); return; }
  if(a === "card"){ hideAct(); window.HCCShareCard(cur.txt, ref, ""); return; }
  if(a === "study" || a === "note"){ act.hidden = true; if(el) el.classList.add("sel"); openAt(cur.ed, cur.b, cur.c, cur.v, cur.txt); if(a === "note"){ var w = $(".vs-nt", sheet); if(w){ w.hidden = false; mk.classList.add("tg-on"); var ta = $("#vsNote", sheet); if(ta) ta.focus(); } } }
});
/* study mode on wide screens keeps the panel docked beside the text */
function studyDock(){ return !!st.study && (matchMedia("(min-width: 1100px)").matches || matchMedia("(pointer: coarse) and (orientation: landscape) and (min-width: 900px)").matches) && location.hash === "#bible"; }
function studyAuto(v){
  if(!studyDock() || mode !== "read") return;
  var el = (v && $('.bv[data-v="'+v+'"]', view)) || $(".bv.sel", view) || $(".bv", view); if(el) openSheet(el);
}
var menu = null;
function verseMenu(el){
  $$(".bv.sel", view).forEach(function(x){ x.classList.remove("sel"); });
  if(menu && menu.dataset.v === el.dataset.v && !menu.hidden){ menu.hidden = true; return; }
  el.classList.add("sel");
  if(!menu){ menu = document.createElement("div"); menu.className = "bib-menu"; menu.setAttribute("role","toolbar"); menu.setAttribute("aria-label","Verse actions"); document.body.appendChild(menu);
    menu.addEventListener("click", function(e){
      var b = e.target.closest("button"); if(!b) return; var v = +menu.dataset.v, sel = $('.bv[data-v="'+v+'"]', view), txt = sel ? sel.textContent.replace(/^\d+/,"").trim() : "";
      var ref = shortName(st.ed, st.b)+" "+st.c+":"+v+" ("+ED[st.ed].short+")";
      if(b.dataset.m === "copy"){ try{ navigator.clipboard.writeText("“"+txt+"” — "+ref); b.textContent = "Copied"; setTimeout(function(){ menu.hidden = true; b.textContent = "Copy"; }, 900); }catch(err){} }
      if(b.dataset.m === "cmp"){ menu.hidden = true; var nx = M.eds.filter(function(x){ return x.id !== st.ed && equiv(x.id, st.b); }); var i = Math.max(0, nx.map(function(x){ return x.id; }).indexOf(st.cmp)); st.cmp = (nx[st.cmp ? (i+1) % nx.length : 0]||{}).id || ""; save(); render({keep:true, v:v}); }
      if(b.dataset.m === "card" && window.HCCShareCard){ menu.hidden = true; window.HCCShareCard(txt, ref, ""); }
      if(b.dataset.m === "x"){ menu.hidden = true; if(sel) sel.classList.remove("sel"); }
    });
  }
  menu.dataset.v = el.dataset.v;
  menu.innerHTML = '<b>'+esc(shortName(st.ed, st.b))+' '+st.c+':'+el.dataset.v+'</b><button type="button" data-m="copy">Copy</button><button type="button" data-m="cmp">'+(st.cmp ? "Next edition" : "Compare")+'</button>'+(window.HCCShareCard ? '<button type="button" data-m="card">Share card</button>' : "")+'<button type="button" data-m="x" aria-label="Close">✕</button>';
  menu.hidden = false;
}
document.addEventListener("keydown", function(e){
  if(location.hash !== "#bible" || e.target.closest("input,select,textarea") || mode !== "read" || !sheet.hidden) return;
  if(e.key === "ArrowRight") step(1); if(e.key === "ArrowLeft") step(-1);
});
var sx = null, sy = 0;
view.addEventListener("touchstart", function(e){ if(e.touches.length !== 1 || mode !== "read" || st.cmp){ sx = null; return; } sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, {passive:true});
view.addEventListener("touchend", function(e){ if(sx == null) return; var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null; if(Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy)*1.8) step(dx < 0 ? 1 : -1); }, {passive:true});
/* mark a chapter read once the reader reaches its end */
var io = "IntersectionObserver" in window ? new IntersectionObserver(function(es){ es.forEach(function(x){ if(x.isIntersecting && mode === "read" && location.hash === "#bible") markRead(); }); }, {threshold:1}) : null;
new MutationObserver(function(){ var pn = $(".bib-pn", view); if(io && pn){ io.disconnect(); io.observe(pn); } if(menu) menu.hidden = true; }).observe(view, {childList:true});

/* ---------- original languages, lexicon, cross references ---------- */
var ORIG = {}, LEX = {}, XREF = {}, OWAIT = {};
window.__ORIG = function(b, d){ ORIG[b] = d; };
window.__LEX = function(k, d){ LEX[k] = d; };
window.__XREF = function(b, d){ XREF[b] = d; };
function grpOf(b){ return (M.grp||{})[b] || "dc"; }
function script(file, ready, cb){
  if(ready()) return cb(true);
  if(OWAIT[file]){ OWAIT[file].push(cb); return; } OWAIT[file] = [cb];
  var s = document.createElement("script"); s.src = file; s.async = true;
  function fin(ok){ var w = OWAIT[file]; delete OWAIT[file]; if(!ok) s.remove(); (w||[]).forEach(function(f){ f(ok && ready()); }); }
  s.onload = function(){ fin(true); }; s.onerror = function(){ fin(false); };
  document.head.appendChild(s);
}
function origBook(b){ return {ESG:null, DNG:"DAN"}[b] !== undefined ? {ESG:null, DNG:"DAN"}[b] : b; }
var HASORIG = {}; "GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SOL ISA JER LAM EZE DAN HOS JOE AMO OBA JON MIC NAH HAB ZEP HAG ZEC MAL MAT MAR LUK JOH ACT ROM 1CO 2CO GAL EPH PHI COL 1TH 2TH 1TI 2TI TIT PHM HEB JAM 1PE 2PE 1JO 2JO 3JO JUD REV".split(" ").forEach(function(b){ HASORIG[b] = 1; });
var NTB = {}; "MAT MAR LUK JOH ACT ROM 1CO 2CO GAL EPH PHI COL 1TH 2TH 1TI 2TI TIT PHM HEB JAM 1PE 2PE 1JO 2JO 3JO JUD REV".split(" ").forEach(function(b){ NTB[b] = 1; });
function engCh(ed, b, c){ var src = ED[ed].books[ED[ed].idx[b]][1]; return b === "PSA" && GREEKPS[src] ? greekToHeb(c) : c; }
function pick(arr, k){ if(!arr) return null; for(var i=0;i<arr.length;i++) if(arr[i][0] === k) return arr[i][1]; return null; }

/* morphology */
var GPOS = {N:"noun", V:"verb", A:"adjective", T:"article", P:"personal pronoun", R:"relative pronoun", C:"reciprocal pronoun", D:"demonstrative pronoun", K:"correlative pronoun", I:"interrogative pronoun", X:"indefinite pronoun", Q:"correlative pronoun", F:"reflexive pronoun", S:"possessive pronoun", ADV:"adverb", CONJ:"conjunction", PREP:"preposition", PRT:"particle", INJ:"interjection", COND:"conditional", HEB:"Hebrew word", ARAM:"Aramaic word"};
var GCASE = {N:"nominative", G:"genitive", D:"dative", A:"accusative", V:"vocative"}, GNUM = {S:"singular", P:"plural"}, GGEN = {M:"masculine", F:"feminine", N:"neuter"};
var GTENSE = {P:"present", I:"imperfect", F:"future", A:"aorist", R:"perfect", L:"pluperfect"}, GVOICE = {A:"active", M:"middle", P:"passive", E:"middle or passive", D:"middle (deponent)", O:"passive (deponent)", N:"middle or passive (deponent)"};
var GMOOD = {I:"indicative", S:"subjunctive", O:"optative", M:"imperative", N:"infinitive", P:"participle", R:"imperative participle"};
function cng(s){ var m = s.match(/^([NGDAV])([SP])([MFN])?/); return m ? [GCASE[m[1]], GNUM[m[2]], GGEN[m[3]]].filter(Boolean).join(" ") : ""; }
function gmorph(code){
  var p = code.split("-"), pos = p[0], out = [GPOS[pos] || pos];
  if(pos === "V"){
    var t = (p[1]||"").replace(/^2/, ""), m = t.match(/^([PIFARL])([AMPEDON])([ISOMNPR])/);
    if(m) out.push((/^2/.test(p[1]) ? "second " : "") + GTENSE[m[1]], GVOICE[m[2]], GMOOD[m[3]]);
    if(p[2]){ var pn = p[2].match(/^([123])([SP])$/); out.push(pn ? ["first","second","third"][+pn[1]-1]+" person "+GNUM[pn[2]] : cng(p[2])); }
  } else if(p[1]){
    var q = p[1].match(/^([123])(.*)$/); if(q){ out.push(["first","second","third"][+q[1]-1]+" person"); out.push(cng(q[2])); } else out.push(cng(p[1]));
    if(p[2] === "C") out.push("comparative"); if(p[2] === "S") out.push("superlative"); if(p[2] === "P") out.push("proper name");
  }
  return out.filter(Boolean).join(", ");
}
var HPOS = {N:"noun", V:"verb", A:"adjective", P:"pronoun", R:"preposition", C:"conjunction", D:"adverb", T:"particle", S:"suffix"};
var HSTEM = {q:"Qal", N:"Niphal", p:"Piel", P:"Pual", h:"Hiphil", H:"Hophal", t:"Hithpael", o:"Polel", O:"Polal", r:"Hithpolel", m:"Poel", M:"Poal", k:"Palel", K:"Pulal", Q:"Qal passive", l:"Pilpel", L:"Polpal", f:"Hithpalpel", D:"Nithpael", j:"Pealal", i:"Pilel", u:"Hothpaal", c:"Tiphil", v:"Hishtaphel", w:"Nithpalel", y:"Nithpoel", z:"Hithpoel"};
var HCONJ = {p:"perfect (qatal)", q:"sequential perfect (weqatal)", i:"imperfect (yiqtol)", w:"sequential imperfect (wayyiqtol)", h:"cohortative", j:"jussive", v:"imperative", r:"participle (active)", s:"participle (passive)", a:"infinitive absolute", c:"infinitive construct"};
var HG = {m:"masculine", f:"feminine", b:"both genders", c:"common"}, HN = {s:"singular", p:"plural", d:"dual"}, HST = {a:"absolute", c:"construct", d:"determined"};
var HT = {a:"affirmation", d:"definite article", e:"exhortation", i:"interrogative", j:"interjection", m:"demonstrative", n:"negative", o:"direct-object marker", r:"relative"};
var HNT = {c:"common", g:"gentilic", p:"proper name"};
function hmorph(code){
  var lang = code[0] === "A" ? "Aramaic " : "", s = code.slice(1), p = s[0], out = [lang + (HPOS[p] || p)];
  if(p === "V"){ out.push(HSTEM[s[1]] || "", HCONJ[s[2]] || ""); var r = s.slice(3); if(/^[123]/.test(r)){ out.push(["first","second","third"][+r[0]-1]+" person"); r = r.slice(1); } out.push(HG[r[0]]||"", HN[r[1]]||"", HST[r[2]]||""); }
  else if(p === "N"){ out.push(HNT[s[1]]||"", HG[s[2]]||"", HN[s[3]]||"", HST[s[4]]||""); }
  else if(p === "A"){ out.push(HG[s[2]]||"", HN[s[3]]||"", HST[s[4]]||""); }
  else if(p === "T"){ out.push(HT[s[1]]||""); }
  else if(p === "P" || p === "S"){ var x = s.slice(2); if(/^[123]/.test(x)){ out.push(["first","second","third"][+x[0]-1]+" person"); x = x.slice(1); } out.push(HG[x[0]]||"", HN[x[1]]||""); }
  return out.filter(Boolean).join(", ");
}
function lexEntry(id){
  var L = LEX[id[0] === "G" ? "g" : "h"]; if(!L || !id) return null;
  var base = id.replace(/[A-Z]$/, "");
  return L[id] || L[base] || L[base+"A"] || L[base+"G"] || L[base+"H"] || null;
}

/* the sheet */
var sheet = document.createElement("div"); sheet.className = "vsheet"; sheet.hidden = true;
sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "false"); sheet.setAttribute("aria-labelledby", "vsH");
sheet.innerHTML = '<div class="vs-head"><div><p class="eyebrow" id="vsEd"></p><h3 id="vsH"></h3></div><div class="vs-acts"><button type="button" class="btn-sm" data-vs="copy">Copy</button><button type="button" class="btn-sm" data-vs="card">Share card</button><button type="button" class="vs-x" data-vs="x" aria-label="Close">✕</button></div></div>'+
  '<div class="vs-tabs" role="tablist"><button type="button" role="tab" data-tab="orig" aria-selected="true">Original</button><button type="button" role="tab" data-tab="eds" aria-selected="false">Editions</button><button type="button" role="tab" data-tab="links" aria-selected="false">Links</button><button type="button" role="tab" data-tab="comm" aria-selected="false">Commentary</button></div>'+
  '<div class="vs-body" id="vsBody"></div>';
document.body.appendChild(sheet);
var cur = null, tab = "orig";
function openSheet(el){
  $$(".bv.sel", view).forEach(function(x){ x.classList.remove("sel"); }); el.classList.add("sel");
  openAt(st.ed, st.b, st.c, +el.dataset.v, el.textContent.replace(/^\d+/, "").trim());
}
function openAt(ed, b, c, v, txt, quiet){
  cur = {ed: ed, b: b, c: c, v: v, txt: txt || ""};
  $("#vsEd", sheet).textContent = ED[ed].name;
  $("#vsH", sheet).textContent = shortName(ed, b) + " " + c + ":" + v;
  markUI();
  if(quiet) return;
  sheet.classList.toggle("in-bible", location.hash === "#bible");
  act.hidden = true; sheet.classList.toggle("docked", studyDock()); document.body.classList.toggle("vs-docked", studyDock());
  sheet.hidden = false; document.body.classList.add("vs-open"); haptic("tick");
  var n = sheet.querySelector('[data-tab="links"]'); n.textContent = "Links";
  xrefsFor(cur, function(list){ if(list && list.length) n.textContent = "Links · " + list.length; });
  showTab(tab);
}
function closeSheet(){ sheet.hidden = true; document.body.classList.remove("vs-open"); document.body.classList.remove("vs-docked"); $$(".bv.sel", view).forEach(function(x){ x.classList.remove("sel"); }); }
window.HCCBibleSheetOpen = function(){ return !sheet.hidden; };
window.HCCBibleSheetClose = closeSheet;
function showTab(t){
  tab = t; $$(".vs-tabs [role=tab]", sheet).forEach(function(b){ b.setAttribute("aria-selected", b.dataset.tab === t ? "true" : "false"); });
  var body = $("#vsBody", sheet), me = cur; body.innerHTML = '<div class="bib-load"><span></span><span></span><span></span></div>'; body.scrollTop = 0;
  if(t === "orig") origView2(me, function(h){ if(me === cur && tab === "orig") body.innerHTML = h; });
  if(t === "eds") edsView(me, function(h){ if(me === cur && tab === "eds"){ body.innerHTML = h; diffMark(body, me); } });
  if(t === "comm") commView(me, function(h){ if(me === cur && tab === "comm") body.innerHTML = h; });
  if(t === "links") linksView(me, function(h){ namesFor(me, function(n){ if(me === cur && tab === "links") body.innerHTML = n + h; }); });
}
function origView(c, cb){
  var ob = origBook(c.b);
  if(!ob || !HASORIG[ob]) return cb('<p class="vs-none">'+esc(bname(c.ed, c.b))+' is not part of the Hebrew Bible. The word-by-word data here covers the Hebrew Old Testament and the Greek New Testament; the Greek Septuagint is not yet included.</p>');
  var ch = engCh(c.ed, c.b, c.c), nt = !!NTB[ob];
  script("bible/orig/"+grpOf(ob)+".js", function(){ return !!ORIG[ob]; }, function(ok){
    if(!ok) return cb('<p class="vs-none">The original-language text could not be loaded.</p>');
    var ws = pick(pick(ORIG[ob], ch), c.v);
    if(!ws) return cb('<p class="vs-none">No original-language words are matched to this verse number'+(c.b === "DNG" || c.b === "ESG" ? " (the Greek additions have no Hebrew original)" : "")+'.</p>');
    var note = (ch !== c.c ? '<p class="vs-note">Psalm '+c.c+' here is Psalm '+ch+' in the Hebrew and English numbering.</p>' : "");
    cb(note + '<p class="vs-lang">'+(nt ? "Greek New Testament (NA28 text)" : "Hebrew Bible (Leningrad Codex)")+' · tap a word for the lexicon</p><div class="vs-words'+(nt ? "" : " rtl")+'"'+(nt ? ' lang="grc"' : ' lang="hbo" dir="rtl"')+'>' + ws.map(function(w, i){
      return '<button type="button" class="vw" data-w="'+i+'" data-s="'+esc(w[3])+'" data-m="'+esc(w[4])+'"><b>'+esc(w[0].replace(/[.,;·:]+$/,""))+'</b><i>'+esc(w[1])+'</i><span>'+esc(w[2])+'</span></button>';
    }).join("") + '</div><div class="vs-lex" id="vsLex" aria-live="polite"></div><p class="vs-cite">Word data and lexicon: STEPBible.org (Tyndale House, Cambridge), CC BY 4.0, from the Greek of Abbott-Smith and the Hebrew of Brown–Driver–Briggs.</p>');
  });
}
function lexView(btn){
  $$(".vw.on", sheet).forEach(function(x){ x.classList.remove("on"); }); btn.classList.add("on");
  var id = btn.dataset.s, k = id[0] === "G" ? "g" : "h", box = $("#vsLex", sheet), word = $("b", btn).textContent;
  box.innerHTML = '<div class="bib-load"><span></span><span></span><span></span></div>';
  script("bible/lex/"+k+".js", function(){ return !!LEX[k]; }, function(ok){
    var e = ok ? lexEntry(id) : null, mo = btn.dataset.m ? (k === "g" ? gmorph(btn.dataset.m) : hmorph(btn.dataset.m)) : "";
    if(!e){ box.innerHTML = '<p class="vs-none">No lexicon entry for '+esc(id||"this word")+'.</p>'; return; }
    box.innerHTML = '<div class="lx"><p class="lx-h"><b lang="'+(k === "g" ? "grc" : "hbo")+'">'+esc(e[0])+'</b> <i>'+esc(e[1])+'</i> <small>'+esc(id)+'</small></p>'+
      '<p class="lx-g">“'+esc(e[3])+'”</p>'+
      (mo ? '<p class="lx-m"><span>Here</span> '+esc(word)+' · '+esc(mo)+'</p>' : "")+
      '<div class="lx-d">'+String(e[4]).replace(/\n/g, "<br>")+'</div><button type="button" class="btn-sm lx-ws" data-ws="'+esc(id)+'">Word study: every occurrence →</button></div>';
    box.scrollIntoView({block: "nearest", behavior: "smooth"});
  });
}
function edsView(c, cb){
  var rows = M.eds.filter(function(e){ return equiv(e.id, c.b); }), out = [], left = rows.length;
  if(!left) return cb("");
  rows.forEach(function(e, i){
    var b2 = equiv(e.id, c.b), bk = e.books[e.idx[b2]], c2 = mapCh(c.ed, e.id, c.b, c.c);
    load(bk[1], b2, function(d){
      var vv = pick(chapter(d, c2) || [], c.v);
      var t = vv ? vv : null; t = (chapter(d, c2)||[]).filter(function(x){ return x[0] === c.v; })[0];
      out[i] = '<div class="vs-ed'+(e.id === c.ed ? " me" : "")+'" data-ed="'+e.id+'"><p><b>'+esc(e.short)+'</b> '+esc(e.trad)+(c2 !== c.c ? ' · Psalm '+c2 : "")+'</p><blockquote'+ltag(e.id)+'>'+(t ? fmt(t[1]) : '<span class="bib-gap">Not numbered the same way in this edition.</span>')+'</blockquote></div>';
      if(--left === 0) cb(out.join("") + ext2(c));
    });
  });
}
function ext2(c){ return '<p class="vs-cite">For the RSV-CE and NABRE (copyrighted), use the links under the chapter.</p>'; }
function parseX(s){ var m = s.match(/^([1-3A-Z]{3})(\d+):(\d+)(?:-(\d+)(?::(\d+))?)?~(\d+)$/); return m ? {b:m[1], c:+m[2], v:+m[3], v2: m[5] ? null : (m[4] ? +m[4] : null), c2: m[5] ? +m[4] : null, ve: m[5] ? +m[5] : null, n:+m[6]} : null; }
function xrefsFor(c, cb){
  var ob = origBook(c.b) || c.b; if(!HASORIG[ob]) return cb([]);
  var ch = engCh(c.ed, c.b, c.c);
  script("bible/xref/"+grpOf(ob)+".js", function(){ return !!XREF[ob]; }, function(ok){
    if(!ok) return cb([]); var s = pick(pick(XREF[ob], ch), c.v); cb(s ? s.split("|").map(parseX).filter(Boolean) : []);
  });
}
function xlabel(x){ return shortName(edFor(x.b), x.b) + " " + x.c + ":" + x.v + (x.v2 ? "–" + x.v2 : "") + (x.c2 ? "–" + x.c2 + ":" + x.ve : ""); }
/* Edition 22: the default edition for quotes and references (Settings > Default Bible) */
function defEd(){ var d = get("hcc.bible.def", ""); return d && ED[d] ? d : ""; }
function qEd(b){ var d = defEd(); if(d && ED[d].idx[b] != null) return d; return ED[st.ed].idx[b] != null ? st.ed : edFor(b); }
function edFor(b){ if(ED[st.ed].idx[b] != null) return st.ed; var d = defEd(); if(d && ED[d].idx[b] != null) return d; return ED.web.idx[b] != null ? "web" : M.eds.filter(function(e){ return e.idx[b] != null; })[0].id; }
function xchap(ed, b, c){ var src = ED[ed].books[ED[ed].idx[b]][1]; return b === "PSA" && GREEKPS[src] ? hebToGreek(c) : c; }
function linksView(c, cb){
  xrefsFor(c, function(list){
    if(!list.length) return cb('<p class="vs-none">No cross-references for this verse.</p>');
    var max = list[0].n, out = [], left = list.length;
    list.forEach(function(x, i){
      var ed = edFor(x.b), bk = ED[ed].books[ED[ed].idx[x.b]], ch = xchap(ed, x.b, x.c);
      load(bk[1], x.b, function(d){
        var vs = (chapter(d, ch)||[]).filter(function(v){ return v[0] >= x.v && v[0] <= (x.v2 || x.v); }).map(function(v){ return v[1]; }).join(" ");
        if(vs.length > 260) vs = vs.slice(0, 250).replace(/\s\S*$/, "") + " …";
        out[i] = '<button type="button" class="vs-x1" data-go="'+ed+'~'+x.b+'~'+ch+'~'+x.v+'"><span class="vs-xr"><b>'+esc(xlabel(x))+'</b><i class="vs-bar" style="--w:'+Math.max(12, Math.round(x.n/max*100))+'%" title="'+x.n+' votes"></i></span><span class="vs-xt">'+fmt(vs)+'</span></button>';
        if(--left === 0) cb('<p class="vs-lang">Passages readers link to this verse, strongest first</p>' + out.join("") + '<p class="vs-cite">Cross-references: OpenBible.info (CC BY), drawn from the Treasury of Scripture Knowledge and readers’ votes.</p>');
      });
    });
  });
}
sheet.addEventListener("click", function(e){
  var b = e.target.closest("button"); if(!b) return;
  if(b.dataset.tab){ showTab(b.dataset.tab); return; }
  if(b.classList.contains("vw")){ lexView(b); return; }
  if(b.dataset.go){ var p = b.dataset.go.split("~"); closeSheet(); go(p[0], p[1], +p[2], +p[3]); return; }
  var a = b.dataset.vs; if(!a || !cur) return;
  var ref = shortName(cur.ed, cur.b)+" "+cur.c+":"+cur.v+" ("+ED[cur.ed].short+")";
  if(a === "x") closeSheet();
  if(a === "copy"){ try{ navigator.clipboard.writeText("“"+cur.txt+"” — "+ref); b.textContent = "Copied"; setTimeout(function(){ b.textContent = "Copy"; }, 1200); }catch(err){} }
  if(a === "card" && window.HCCShareCard) window.HCCShareCard(cur.txt, ref, "");
});
document.addEventListener("keydown", function(e){ if(e.key === "Escape" && !sheet.hidden) closeSheet(); });

/* chapter connections */
function conn(){
  var box = $("#bibConn", view); if(!box) return;
  var c = {ed: st.ed, b: st.b, c: st.c}, ob = origBook(c.b) || c.b; if(!HASORIG[ob]) return;
  var ch = engCh(c.ed, c.b, c.c);
  script("bible/xref/"+grpOf(ob)+".js", function(){ return !!XREF[ob]; }, function(ok){
    if(!ok || st.b !== c.b || st.c !== c.c) return;
    var vs = pick(XREF[ob], ch) || [], agg = {};
    vs.forEach(function(pv){ pv[1].split("|").map(parseX).forEach(function(x){ if(!x || (x.b === ob && x.c === ch)) return; var k = x.b+" "+x.c; var a = agg[k] = agg[k] || {b:x.b, c:x.c, n:0, pairs:[]}; a.n += x.n; a.pairs.push([pv[0], x]); }); });
    var top = Object.keys(agg).map(function(k){ return agg[k]; }).sort(function(a,b){ return b.n - a.n; }).slice(0, 10);
    if(!top.length) return;
    var max = top[0].n;
    box.innerHTML = '<p class="shelf-h">This chapter in conversation</p><p class="cmp-note">The chapters most often linked to '+esc(shortName(st.ed, st.b))+' '+st.c+'. Open one to see the verse-to-verse links.</p><div class="bc-list">' + top.map(function(a, i){
      var ed = edFor(a.b);
      return '<details class="bc"><summary><span class="bc-n">'+esc(shortName(ed, a.b))+' '+a.c+'</span><i class="vs-bar" style="--w:'+Math.max(10, Math.round(a.n/max*100))+'%"></i><small>'+a.pairs.length+' link'+(a.pairs.length>1?"s":"")+'</small></summary><ul>' +
        a.pairs.sort(function(p,q){ return p[0]-q[0]; }).map(function(p){ var x = p[1]; return '<li><button type="button" class="bc-v" data-hv="'+p[0]+'">v. '+p[0]+'</button> → <button type="button" class="bc-go" data-go="'+ed+'~'+x.b+'~'+xchap(ed, x.b, x.c)+'~'+x.v+'">'+esc(xlabel(x))+'</button></li>'; }).join("") + '</ul></details>';
    }).join("") + '</div>';
  });
}
view.addEventListener("click", function(e){
  var g = e.target.closest(".bc-go"); if(g){ var p = g.dataset.go.split("~"); go(p[0], p[1], +p[2], +p[3]); return; }
  var h = e.target.closest(".bc-v"); if(h){ var el = $('.bv[data-v="'+h.dataset.hv+'"]', view); if(el){ el.scrollIntoView({block:"center", behavior:"smooth"}); el.classList.remove("hl"); void el.offsetWidth; el.classList.add("hl"); } }
});

/* ===================== Bible study tools (Edition 13) ===================== */
var BX = window.__BIBX__ || {};
var XMODE = {};
var LANGEN = {lxxg:1, grk:1, vul:1};
function isEnglish(src){ return !LANGEN[src]; }
function srcOf(ed, b){ var e = ED[ed]; return e && e.idx[b] != null ? e.books[e.idx[b]][1] : null; }
function normT(s){ return String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[ς]/g, "σ").replace(/[’'`]/g, "").replace(/æ/g, "ae").replace(/œ/g, "oe"); }
function ymd(d){ return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2); }
function dayDiff(a, b){ return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 864e5); }
function goEng(b, c, v){ var ed = ED[st.ed].idx[b] != null ? st.ed : edFor(b); go(ed, b, xchap(ed, b, c), v || 0); }

/* ---------- tools strip ---------- */
var tools = $("#bibTools");
function toolsMark(){ if(!tools) return; if(XMODE[mode]){ fab.hidden = true; hideAct(); } $$("[data-act]", tools).forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.act === mode ? "true" : "false"); }); }
if(tools) tools.addEventListener("click", function(e){
  var b = e.target.closest("[data-act]"); if(!b) return;
  mode = mode === b.dataset.act ? "read" : b.dataset.act; haptic("tick"); render(); toolsMark();
  window.scrollTo({top: art.getBoundingClientRect().top + scrollY - 70});
});
addEventListener("hashchange", function(){ setTimeout(toolsMark, 60); });

/* ---------- book introductions ---------- */
function introCard(b, collapsed){
  var x = (BX.intro || {})[b] || (BX.intro || {})[{ESG:"EST", DNG:"DAN"}[b]]; if(!x) return "";
  var body = '<dl class="bi-dl"><dt>Tradition</dt><dd>'+esc(x[0])+'</dd><dt>Scholarship</dt><dd>'+esc(x[1])+'</dd><dt>Date</dt><dd>'+esc(x[2])+'</dd></dl><p class="bi-sum">'+esc(x[3])+'</p>';
  var canon = M.eds.filter(function(e){ return equiv(e.id, b); }).map(function(e){ return e.short; });
  body += '<p class="bi-can"><span>In</span> '+canon.map(esc).join(" · ")+'</p>';
  return collapsed ? '<details class="bintro"><summary>About '+esc(shortName(st.ed, b))+'</summary>'+body+'</details>' : '<section class="bintro open">'+body+'</section>';
}

/* ---------- highlights, notes and bookmarks ---------- */
var NOTES = get("hcc.bnotes", {});
function nkey(ed, b, c, v){ return b + "." + engCh(ed, b, c) + "." + v; }
function noteCls(b, v){ var n = NOTES[nkey(st.ed, b, st.c, v)]; if(!n) return ""; return (n.h ? " hc-" + n.h : "") + (n.n ? " has-note" : "") + (n.k ? " has-bm" : ""); }
function saveNotes(){ put("hcc.bnotes", NOTES); countSaved(); }
var mk = document.createElement("div"); mk.className = "vs-mark";
mk.innerHTML = '<div class="vs-hcs" role="group" aria-label="Highlight colour">'+[["y","Yellow"],["g","Green"],["b","Blue"],["p","Pink"]].map(function(c){ return '<button type="button" class="hcb hc-'+c[0]+'" data-hc="'+c[0]+'" aria-label="Highlight '+c[1]+'" aria-pressed="false"></button>'; }).join("")+
  '<button type="button" class="hcb hcx" data-hc="" aria-label="Remove highlight">✕</button></div><button type="button" class="btn-sm" data-bm="1" aria-pressed="false">☆ Bookmark</button><button type="button" class="btn-sm" data-nt="1">✎ Note</button>'+
  '<div class="vs-nt" hidden><label class="vh" for="vsNote">Your note on this verse</label><textarea id="vsNote" rows="3" placeholder="Write a note…"></textarea></div>'+
  '<div class="vs-tags"><span class="vs-tgl" id="vsTags"></span><label class="vh" for="vsTag">Add a tag</label><input id="vsTag" list="vsTagList" placeholder="Add a tag (promise, prayer…)" maxlength="30" enterkeyhint="done" autocomplete="off"><datalist id="vsTagList"></datalist></div>';
sheet.insertBefore(mk, $(".vs-tabs", sheet));
function curKey(){ return cur ? nkey(cur.ed, cur.b, cur.c, cur.v) : null; }
function markUI(){
  var n = NOTES[curKey()] || {};
  $$(".hcb", mk).forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.hc && b.dataset.hc === n.h ? "true" : "false"); });
  var bm = $("[data-bm]", mk); bm.setAttribute("aria-pressed", n.k ? "true" : "false"); bm.textContent = n.k ? "★ Bookmarked" : "☆ Bookmark";
  $("#vsNote", mk).value = n.n || ""; $(".vs-nt", mk).hidden = !n.n;
  $("#vsTags", mk).innerHTML = (n.g || []).map(function(g){ return '<button type="button" class="vs-tgc" data-tgx="'+esc(g)+'" aria-label="Remove tag '+esc(g)+'">#'+esc(g)+' <span aria-hidden="true">✕</span></button>'; }).join("");
  mk.classList.toggle("tg-on", !!(n.g && n.g.length) || !!n.n);
  $("#vsTagList", mk).innerHTML = allTags().map(function(g){ return '<option value="'+esc(g)+'">'; }).join("");
}
function allTags(){ var o = {}; Object.keys(NOTES).forEach(function(k){ (NOTES[k].g || []).forEach(function(g){ o[g] = (o[g] || 0) + 1; }); }); return Object.keys(o).sort(function(a, b){ return o[b] - o[a] || a.localeCompare(b); }); }
function addTag(v){ v = String(v || "").replace(/^#+/, "").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 30); if(!v) return; var g = ((NOTES[curKey()] || {}).g || []).slice(); if(g.indexOf(v) < 0) g.push(v); setNote({g: g}); }
function setNote(patch){
  var k = curKey(); if(!k) return; var n = NOTES[k] || {};
  Object.keys(patch).forEach(function(x){ n[x] = patch[x]; });
  n.t = Date.now(); n.ed = cur.ed; n.txt = cur.txt; n.ref = shortName(cur.ed, cur.b) + " " + cur.c + ":" + cur.v;
  if(n.g && !n.g.length) delete n.g;
  if(!n.h && !n.n && !n.k && !n.g) delete NOTES[k]; else NOTES[k] = n;
  saveNotes(); markUI();
  var el = $('.bv[data-v="'+cur.v+'"]', view);
  if(el && st.b === cur.b && st.c === cur.c){ el.className = el.className.replace(/\s*(hc-\w|has-note|has-bm)/g, ""); el.className += noteCls(cur.b, cur.v); }
}
mk.addEventListener("click", function(e){
  var b = e.target.closest("button"); if(!b) return;
  if(b.dataset.hc != null){ setNote({h: b.dataset.hc}); haptic("tick"); }
  if(b.dataset.bm){ setNote({k: !(NOTES[curKey()]||{}).k}); haptic("tick"); }
  if(b.dataset.nt){ var w = $(".vs-nt", mk); w.hidden = !w.hidden; mk.classList.toggle("tg-on", !w.hidden || !!((NOTES[curKey()] || {}).g || []).length); if(!w.hidden) $("#vsNote", mk).focus(); }
  if(b.dataset.tgx){ setNote({g: ((NOTES[curKey()] || {}).g || []).filter(function(g){ return g !== b.dataset.tgx; })}); haptic("tick"); }
});
mk.addEventListener("keydown", function(e){ if(e.target.id === "vsTag" && (e.key === "Enter" || e.key === ",")){ e.preventDefault(); addTag(e.target.value); e.target.value = ""; haptic("tick"); } });
mk.addEventListener("change", function(e){ if(e.target.id === "vsTag" && e.target.value.trim()){ addTag(e.target.value); e.target.value = ""; } });
var ntT = null;
mk.addEventListener("input", function(e){ if(e.target.id !== "vsNote") return; clearTimeout(ntT); var v = e.target.value; ntT = setTimeout(function(){ setNote({n: v.trim()}); }, 400); });
function countSaved(){
  var n = Object.keys(NOTES).length, a = $("#bibSavedLink");
  var pane = $("#pane-marks");
  if(pane && !a){ a = document.createElement("a"); a.id = "bibSavedLink"; a.className = "bib-saved"; a.href = "#bible"; pane.insertBefore(a, pane.firstChild);
    a.addEventListener("click", function(){ document.body.classList.remove("navopen"); mode = "notes"; setTimeout(function(){ render(); toolsMark(); }, 50); }); }
  if(a) a.textContent = "Bible highlights and notes · " + n;
}
countSaved();
XMODE.notes = function(){
  var f = st.nf || "all", keys = Object.keys(NOTES).sort(function(a,b){ return (NOTES[b].t||0) - (NOTES[a].t||0); });
  var list = keys.filter(function(k){ var n = NOTES[k]; return f === "all" || (f === "h" && n.h) || (f === "n" && n.n) || (f === "k" && n.k); });
  view.innerHTML = '<h3 class="bib-h">Your highlights and notes</h3><div class="cm-chips" role="group" aria-label="Show">'+[["all","All"],["h","Highlights"],["n","Notes"],["k","Bookmarks"]].map(function(x){ return '<button type="button" class="chip" data-nf="'+x[0]+'" aria-pressed="'+(f===x[0])+'">'+x[1]+'</button>'; }).join("")+
    (keys.length ? '<button type="button" class="chip" data-nexp="1">Copy as text</button>' : "")+'</div>'+
    (list.length ? '<ul class="bn-list">' + list.map(function(k){ var n = NOTES[k], p = k.split(".");
      return '<li class="'+(n.h ? "hc-"+n.h : "")+'"><button type="button" class="bn-go" data-eng="'+p[0]+'~'+p[1]+'~'+p[2]+'"><b>'+esc(n.ref || k)+'</b>'+(n.k ? ' <span aria-label="bookmarked">★</span>' : "")+'<small>'+esc(ED[n.ed] ? ED[n.ed].short : "")+' · '+new Date(n.t||0).toLocaleDateString()+'</small></button><p>'+esc((n.txt||"").slice(0, 220))+'</p>'+(n.n ? '<p class="bn-n">'+esc(n.n)+'</p>' : "")+'</li>'; }).join("") + '</ul>'
      : '<p class="vs-none">Nothing here yet. Tap any verse and choose a colour, a bookmark or a note.</p>');
};
view.addEventListener("click", function(e){
  var t;
  if((t = e.target.closest("[data-nf]"))){ st.nf = t.dataset.nf; render(); return; }
  if((t = e.target.closest("[data-nexp]"))){ var txt = Object.keys(NOTES).map(function(k){ var n = NOTES[k]; return n.ref + (n.h ? " [" + n.h + "]" : "") + (n.k ? " ★" : "") + "\n“" + (n.txt||"") + "”" + (n.n ? "\nNote: " + n.n : ""); }).join("\n\n");
    try{ navigator.clipboard.writeText(txt); t.textContent = "Copied"; setTimeout(function(){ t.textContent = "Copy as text"; }, 1500); }catch(err){} return; }
  if((t = e.target.closest("[data-eng]"))){ var p = t.dataset.eng.split("~"); goEng(p[0], +p[1], +p[2]); return; }
});

/* ---------- full-Bible search ---------- */
XMODE.search = function(){
  var e = ED[st.ed];
  view.innerHTML = '<h3 class="bib-h">Search the '+esc(e.name)+'</h3><form class="bs-form" role="search"><label class="vh" for="bsQ">Words or phrase</label><input id="bsQ" type="search" placeholder="Words, or a “phrase in quotes”" value="'+esc(st.sq||"")+'" autocomplete="off" enterkeyhint="search">'+
    '<label class="vh" for="bsScope">Where</label><select id="bsScope"><option value="all">Whole Bible</option><option value="ot">Old Testament</option><option value="dc">Deuterocanon</option><option value="nt">New Testament</option><option value="b">'+esc(shortName(st.ed, st.b))+' only</option></select><button type="submit" class="btn-sm">Search</button></form><div id="bsOut" aria-live="polite"></div>';
  $("#bsScope", view).value = st.ss || "all";
  $("form", view).addEventListener("submit", function(ev){ ev.preventDefault(); st.sq = $("#bsQ", view).value.trim(); st.ss = $("#bsScope", view).value; save(); runSearch(); });
  if(st.sq) runSearch();
};
function loadEdition(ed, books, prog, done){
  var left = books.length, data = {};
  if(!left) return done(data);
  books.forEach(function(bk){ load(bk[1], bk[0], function(d){ data[bk[0]] = d; left--; prog(books.length - left, books.length); if(!left) done(data); }); });
}
function runSearch(){
  var out = $("#bsOut", view), q = st.sq, e = ED[st.ed], scope = st.ss || "all"; if(!q){ out.innerHTML = ""; return; }
  var phrase = /^".*"$|^“.*”$/.test(q), nq = normT(q.replace(/^["“]|["”]$/g, "")), words = nq.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if(!words.length) return;
  var books = e.books.filter(function(b){ return scope === "all" || (scope === "b" ? b[0] === st.b : scope === "ot" ? b[4] === "ot" : scope === "nt" ? b[4] === "nt" : (b[4] === "dc" || b[4] === "app")); });
  out.innerHTML = '<p class="cmp-note">Loading the text… <span id="bsP">0</span>/'+books.length+' books</p>';
  var my = q + scope + st.ed;
  loadEdition(st.ed, books, function(n){ var p = $("#bsP", out); if(p) p.textContent = n; }, function(data){
    if(my !== st.sq + (st.ss||"all") + st.ed) return;
    var hits = [], per = {}, total = 0;
    var res = words.map(function(w){ return new RegExp("(^|[^\\p{L}])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u"); });
    books.forEach(function(bk){
      (data[bk[0]] || []).forEach(function(ch){ ch[1].forEach(function(v){
        var n = normT(v[1]), ok = phrase ? n.indexOf(nq) >= 0 : res.every(function(r){ return r.test(n); });
        if(ok){ total++; per[bk[0]] = (per[bk[0]] || 0) + 1; if(hits.length < 400) hits.push([bk[0], ch[0], v[0], v[1]]); }
      }); });
    });
    if(!total){ out.innerHTML = '<p class="vs-none">No verses match. Try fewer words, or check the spelling'+(isEnglish(srcOf(st.ed, st.b)) ? "" : " (this edition is not in English)")+'.</p>'; return; }
    var max = Math.max.apply(null, Object.keys(per).map(function(k){ return per[k]; }));
    var dist = '<div class="bs-dist">' + books.filter(function(bk){ return per[bk[0]]; }).map(function(bk){ return '<button type="button" class="bs-bk" data-bsb="'+bk[0]+'" title="'+esc(bk[2])+': '+per[bk[0]]+'"><i style="--h:'+Math.max(6, per[bk[0]]/max*100)+'%"></i><span>'+esc(bk[2].replace(/\s*\(.*\)$/,"").replace(/^(\d) /,"$1"))+'</span><b>'+per[bk[0]]+'</b></button>'; }).join("") + '</div>';
    function hl(t){ var s = esc(t); words.forEach(function(w){ if(w.length < 2) return; var re = new RegExp("(" + w.split("").map(function(ch){ return ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[\\u0300-\\u036f]*"; }).join("") + ")", "giu"); s = s.normalize("NFD").replace(re, "<mark>$1</mark>").normalize("NFC"); }); return s; }
    out.innerHTML = '<p class="bs-sum"><b>'+total+'</b> verse'+(total>1?"s":"")+' in <b>'+Object.keys(per).length+'</b> book'+(Object.keys(per).length>1?"s":"")+(total > 400 ? " · first 400 shown" : "")+'</p>' + dist +
      '<ol class="bs-res">' + hits.map(function(h){ return '<li data-bsb="'+h[0]+'"><button type="button" data-gov="'+h[0]+'~'+h[1]+'~'+h[2]+'"><b>'+esc(shortName(st.ed, h[0]))+' '+h[1]+':'+h[2]+'</b><span>'+hl(h[3])+'</span></button></li>'; }).join("") + '</ol>';
  });
}
view.addEventListener("click", function(e){
  var t;
  if((t = e.target.closest("[data-gov]"))){ var p = t.dataset.gov.split("~"); go(st.ed, p[0], +p[1], +p[2]); return; }
  if((t = e.target.closest(".bs-bk"))){ var li = $('.bs-res li[data-bsb="'+t.dataset.bsb+'"]', view); if(li) li.scrollIntoView({block:"center", behavior:"smooth"}); else { st.ss = "b"; st.b = t.dataset.bsb; save(); XMODE.search(); } }
});

/* ---------- word study ---------- */
var CONC = {};
window.__CONC = function(k, d){ CONC[k] = d; };
var BOOKORDER = "GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SOL ISA JER LAM EZE DAN HOS JOE AMO OBA JON MIC NAH HAB ZEP HAG ZEC MAL MAT MAR LUK JOH ACT ROM 1CO 2CO GAL EPH PHI COL 1TH 2TH 1TI 2TI TIT PHM HEB JAM 1PE 2PE 1JO 2JO 3JO JUD REV".split(" ");
function wordStudy(id){
  var k = id[0] === "G" ? "g" : "h", body = $("#vsBody", sheet), me = cur;
  body.innerHTML = '<div class="bib-load"><span></span><span></span><span></span></div>';
  script("bible/conc/"+k+".js", function(){ return !!CONC[k]; }, function(ok){
    script("bible/lex/"+k+".js", function(){ return !!LEX[k]; }, function(){
      if(me !== cur) return;
      var C = CONC[k], base = id.replace(/[A-Z]$/, ""), e = ok && (C[id] || C[base] || C[base+"A"] || C[base+"G"]), L = lexEntry(id);
      if(!e){ body.innerHTML = '<p class="vs-none">No occurrences found.</p>'; return; }
      var refs = e[1].split("|").map(function(r){ var m = r.match(/^([1-3A-Z]{3})(\d+):(\d+)\.(\d+)$/); return m ? [m[1], +m[2], +m[3], +m[4]] : null; }).filter(Boolean);
      var gl = e[0].map(function(g, i){ return [g, refs.filter(function(r){ return r[3] === i; }).length]; }).sort(function(a,b){ return b[1]-a[1]; });
      var byB = {}; refs.forEach(function(r){ byB[r[0]] = (byB[r[0]]||0) + 1; });
      var mx = Math.max.apply(null, Object.keys(byB).map(function(x){ return byB[x]; }));
      body.innerHTML = '<button type="button" class="btn-sm" data-back="orig">← Back to the verse</button>'+
        '<div class="ws-h"><b lang="'+(k==="g"?"grc":"hbo")+'">'+esc(L ? L[0] : id)+'</b> <i>'+esc(L ? L[1] : "")+'</i> <small>'+esc(id)+'</small><p>“'+esc(L ? L[3] : "")+'” · <b>'+refs.length+'</b> occurrence'+(refs.length>1?"s":"")+' in <b>'+Object.keys(byB).length+'</b> book'+(Object.keys(byB).length>1?"s":"")+'</p></div>'+
        '<p class="vs-lang">How it is translated (STEPBible glosses)</p><div class="ws-gl">'+gl.slice(0, 14).map(function(g){ return '<span><b>'+esc(g[0])+'</b> '+g[1]+'</span>'; }).join("")+'</div>'+
        '<p class="vs-lang">Where it appears</p><div class="ws-dist">'+BOOKORDER.filter(function(b){ return byB[b]; }).map(function(b){ return '<span title="'+esc(shortName(edFor(b), b))+': '+byB[b]+'"><i style="--h:'+Math.max(8, byB[b]/mx*100)+'%"></i><small>'+esc(b)+'</small></span>'; }).join("")+'</div>'+
        '<p class="vs-lang">Every occurrence'+(refs.length > 300 ? " (first 300)" : "")+'</p><ul class="ws-refs">'+refs.slice(0, 300).map(function(r){ return '<li><button type="button" data-goeng="'+r[0]+'~'+r[1]+'~'+r[2]+'">'+esc(shortName(edFor(r[0]), r[0]))+' '+r[1]+':'+r[2]+'</button> <span>'+esc(e[0][r[3]])+'</span></li>'; }).join("")+'</ul>';
      body.scrollTop = 0;
    });
  });
}
/* open the word study for a Strong's number from anywhere: the sheet opens on its first occurrence */
function openWord(id){
  var k = id[0] === "G" ? "g" : "h";
  script("bible/conc/"+k+".js", function(){ return !!CONC[k]; }, function(ok){
    var C = CONC[k], base = id.replace(/[A-Z]$/, ""), e = ok && (C[id] || C[base] || C[base+"A"] || C[base+"G"]);
    var m = e && String(e[1]).split("|")[0].match(/^([1-3A-Z]{3})(\d+):(\d+)/);
    var b = m ? m[1] : (k === "g" ? "JOH" : "GEN"), ed = edFor(b), c = m ? xchap(ed, b, +m[2]) : 1, v = m ? +m[3] : 1;
    load(srcOf(ed, b), b, function(d){ var vv = (chapter(d, c)||[]).filter(function(x){ return x[0] === v; })[0]; tab = "word"; openAt(ed, b, c, v, vv ? vv[1] : ""); tab = "orig"; wordStudy(id); });
  });
}
sheet.addEventListener("click", function(e){
  var t;
  if((t = e.target.closest("[data-ws]"))){ e.stopPropagation(); wordStudy(t.dataset.ws); return; }
  if((t = e.target.closest("[data-back]"))){ showTab(t.dataset.back); return; }
  if((t = e.target.closest("[data-goeng]"))){ var p = t.dataset.goeng.split("~"); closeSheet(); goEng(p[0], +p[1], +p[2]); return; }
  if((t = e.target.closest("[data-gref]"))){ var q = t.dataset.gref.split("~"); location.hash = q[0]; closeSheet(); return; }
}, true);

/* ---------- Septuagint Greek words in the Original tab ---------- */
var GFORM = null; window.__GFORM = function(d){ GFORM = d; };
function lxxSection(c, cb){
  var b = c.b, ed = ED.lxxg, b2 = ed && equiv("lxxg", b); if(!b2 || NTB[b]) return cb("");
  var ch = c.c, src = srcOf(c.ed, c.b); if(b === "PSA" && !GREEKPS[src]) ch = hebToGreek(c.c);
  load("lxxg", b2, function(d){
    var v = (chapter(d, ch)||[]).filter(function(x){ return x[0] === c.v; })[0]; if(!v) return cb("");
    script("bible/lex/gform.js", function(){ return !!GFORM; }, function(){
      var words = v[1].split(/\s+/);
      cb('<p class="vs-lang">Septuagint (Greek Old Testament) · tap a word; matched by form where possible</p><div class="vs-words" lang="grc">' + words.map(function(w){
        var n = normT(w).replace(/[^\u03b1-\u03c9]/g, ""), id = GFORM && GFORM[n] || "";
        return '<button type="button" class="vw lxw'+(id ? "" : " nolex")+'" data-s="'+esc(id)+'" data-m=""><b>'+esc(w.replace(/[.,;·:]+$/,""))+'</b>'+(id ? "" : '<i>not matched</i>')+'</button>';
      }).join("") + '</div><div class="vs-lex" id="vsLex2" aria-live="polite"></div>');
    });
  });
}
function origView2(c, cb){
  var ob = origBook(c.b), hasO = ob && HASORIG[ob];
  function withLxx(h){ lxxSection(c, function(x){ cb(h + (x ? '<hr class="vs-hr">' + x + '<p class="vs-cite">Greek text: Brenton’s Septuagint (public domain). Lexicon links use word forms from the Greek New Testament, so some Septuagint words are not matched.</p>' : "")); }); }
  if(!hasO) return lxxSection(c, function(x){ cb(x ? x + '<p class="vs-cite">There is no Hebrew original in this data for '+esc(bname(c.ed, c.b))+'. Greek text: Brenton’s Septuagint (public domain).</p>' : '<p class="vs-none">No original-language text is available for this verse.</p>'); });
  origView(c, withLxx);
}
var _lexView = lexView;
lexView = function(btn){
  if(btn.classList.contains("lxw")){
    if(!btn.dataset.s){ var box2 = $("#vsLex2", sheet); if(box2) box2.innerHTML = '<p class="vs-none">This form is not in the index. The lexicon covers New Testament vocabulary and dictionary forms.</p>'; return; }
    var a = $("#vsLex", sheet); if(a) a.id = "vsLexA"; var b = $("#vsLex2", sheet); if(b) b.id = "vsLex";
    _lexView(btn);
    if(b) b.id = "vsLex2"; if(a) a.id = "vsLex";
    return;
  }
  _lexView(btn);
};

/* ---------- differences between editions ---------- */
function words(s){ return String(s).replace(/<[^>]+>/g, "").split(/\s+/).filter(Boolean); }
function lcsMark(a, b){
  var n = a.length, m = b.length; if(n * m > 40000) return null;
  var A = a.map(normT), B = b.map(function(x){ return normT(x).replace(/[^\p{L}\p{N}]/gu, ""); }), An = A.map(function(x){ return x.replace(/[^\p{L}\p{N}]/gu, ""); });
  var T = []; for(var i=0;i<=n;i++){ T.push(new Array(m+1).fill(0)); }
  for(i=n-1;i>=0;i--) for(var j=m-1;j>=0;j--) T[i][j] = An[i] === B[j] ? T[i+1][j+1] + 1 : Math.max(T[i+1][j], T[i][j+1]);
  var keep = new Array(m).fill(false); i = 0; j = 0;
  while(i<n && j<m){ if(An[i] === B[j]){ keep[j] = true; i++; j++; } else if(T[i+1][j] >= T[i][j+1]) i++; else j++; }
  return keep;
}
function diffMark(body, c){
  var me = $('.vs-ed[data-ed="'+c.ed+'"] blockquote', body); if(!me) return;
  var base = words(me.textContent); if(!isEnglish(srcOf(c.ed, c.b))) return;
  var tg = document.createElement("label"); tg.className = "vs-dtog"; tg.innerHTML = '<input type="checkbox" checked> Highlight wording that differs from the '+esc(ED[c.ed].short);
  body.insertBefore(tg, body.firstChild);
  $$(".vs-ed", body).forEach(function(d){
    if(d.dataset.ed === c.ed) return; var src = srcOf(d.dataset.ed, equiv(d.dataset.ed, c.b)); if(!isEnglish(src)) return;
    var q = $("blockquote", d), w = words(q.textContent), keep = lcsMark(base, w); if(!keep) return;
    q.innerHTML = w.map(function(x, i){ return keep[i] ? esc(x) : '<mark class="df">'+esc(x)+'</mark>'; }).join(" ");
  });
  $("input", tg).addEventListener("change", function(){ body.classList.toggle("nodiff", !this.checked); });
}

/* ---------- commentary: traditions, Fathers, the series ---------- */
var FATH = {}; window.__FATH = function(b, d){ FATH[b] = d; };
function tradFor(b, ch, v){ return (BX.trad || []).filter(function(t){ return t[0] === b && t[1] === ch && v >= t[2] && v <= t[3]; }); }
var REFIDX = null;
function refIndex(){
  if(REFIDX) return REFIDX; REFIDX = {};
  $$("main article").forEach(function(a){
    if(a.id === "bible" || !a.dataset.title) return;
    findRefs(a.textContent).forEach(function(r){ for(var v=r.v; v<=(r.v2||r.v); v++){ var k = r.b+"."+r.c+"."+v; (REFIDX[k] = REFIDX[k] || []); if(REFIDX[k].indexOf(a.id) < 0) REFIDX[k].push(a.id); } });
  });
  return REFIDX;
}
function commView(c, cb){
  var ob = origBook(c.b) || c.b, ch = engCh(c.ed, c.b, c.c), html = "";
  tradFor(ob, ch, c.v).forEach(function(t){
    html += '<section class="tr-card"><p class="vs-lang">How the churches read '+esc(shortName(edFor(t[0]), t[0]))+' '+t[1]+':'+t[2]+(t[3]!==t[2]?"–"+t[3]:"")+' · '+esc(t[4])+'</p>'+
      t[5].map(function(r){ return '<div class="tr-r tr-'+r[0].toLowerCase()+'"><b>'+esc(r[0])+'</b><p>'+esc(r[1])+'</p></div>'; }).join("")+(t[6] ? '<p class="tr-note">'+esc(t[6])+'</p>' : "")+'</section>';
  });
  var eps = (refIndex()[ob+"."+ch+"."+c.v] || []).map(function(id){ var a = document.getElementById(id); return a ? '<button type="button" class="tr-ep" data-gref="'+id+'">'+esc((a.dataset.ep ? a.dataset.ep + " · " : "") + a.dataset.title)+' →</button>' : ""; }).join("");
  if(eps) html += '<p class="vs-lang">In the series</p><div class="tr-eps">'+eps+'</div>';
  var g = grpOf(ob);
  script("bible/fath/"+g+".js", function(){ return !!FATH[ob] || FATH["__"+g]; }, function(){
    FATH["__"+g] = 1;
    var list = []; (pick(FATH[ob], ch) || []).forEach(function(e){ if(c.v >= e[0] && c.v <= e[1]) list.push(e); });
    list.sort(function(a,b){ return (b[0]===c.v) - (a[0]===c.v) || (a[1]-a[0]) - (b[1]-b[0]); });
    if(list.length) html += '<p class="vs-lang">The Fathers on this verse</p>' + list.slice(0, 8).map(function(e){
      var long = e[4].length > 420;
      return '<div class="fa"><p class="fa-h"><b>'+esc(e[2])+'</b>'+(e[5] ? ' <span class="fa-d" title="'+(e[6] === "w" ? "When this work was written" : "The author’s lifetime (this work is not precisely dated)")+'">'+(e[6] === "w" ? "" : "lived ")+esc(e[5])+'</span>' : "")+' <small>'+esc(e[3].replace(/^Catena Aurea by Aquinas$/, "quoted in Aquinas, Catena Aurea (1262–64)"))+(e[1] !== e[0] ? ' · on vv. '+e[0]+'–'+e[1] : "")+'</small></p><div class="fa-t'+(long ? " clip" : "")+'">'+esc(e[4]).replace(/\n+/g, "</p><p>").replace(/^/, "<p>")+'</p></div>'+(long ? '<button type="button" class="fa-more">Read more</button>' : "")+'</div>';
    }).join("") + '<p class="vs-cite">Excerpts from public-domain translations (Ante-Nicene and Nicene and Post-Nicene Fathers, Newman’s Catena Aurea, and others), via the HistoricalChristianFaith Commentaries Database.</p>';
    var fall = '<p class="fa-allp"><button type="button" class="btn-sm" data-fall="'+esc(shortName(edFor(ob), ob)+" "+ch)+'">All the Fathers on '+esc(shortName(edFor(ob), ob)+" "+ch)+', in date order</button></p>';
    cb(html ? html + fall : '<p class="vs-none">No commentary is gathered for this verse yet. Try a neighbouring verse, or the Connections tab.</p>' + fall);
  });
}
sheet.addEventListener("click", function(e){ var m = e.target.closest(".fa-more"); if(!m) return; var t = m.previousElementSibling; t.classList.toggle("clip"); m.textContent = t.classList.contains("clip") ? "Read more" : "Show less"; });

/* ---------- scripture references in the episodes ---------- */
var BKRX = null, BKMAP = {};
function bookRx(){
  if(BKRX) return BKRX;
  var names = {};
  M.eds.forEach(function(e){ e.books.forEach(function(b){ var n = b[2].replace(/\s*\(.*\)$/, ""); if(/^(Esther|Daniel) \(/.test(b[2]) || /additions/i.test(b[2])) return; if(!names[n]) names[n] = b[0]; }); });
  names["Psalm"] = "PSA"; names["Song of Solomon"] = "SOL"; names["Ecclesiasticus"] = "SIR"; names["Apocalypse"] = "REV";
  var ab = {"Gen":"GEN","Exod":"EXO","Ex":"EXO","Lev":"LEV","Num":"NUM","Deut":"DEU","Josh":"JOS","Judg":"JDG","1 Sam":"1SA","2 Sam":"2SA","1 Kgs":"1KI","2 Kgs":"2KI","1 Chron":"1CH","2 Chron":"2CH","Neh":"NEH","Ps":"PSA","Pss":"PSA","Prov":"PRO","Eccl":"ECC","Isa":"ISA","Jer":"JER","Lam":"LAM","Ezek":"EZE","Dan":"DAN","Hos":"HOS","Mic":"MIC","Zech":"ZEC","Mal":"MAL","Matt":"MAT","Mt":"MAT","Mk":"MAR","Lk":"LUK","Jn":"JOH","Rom":"ROM","1 Cor":"1CO","2 Cor":"2CO","Gal":"GAL","Eph":"EPH","Phil":"PHI","Col":"COL","1 Thess":"1TH","2 Thess":"2TH","1 Tim":"1TI","2 Tim":"2TI","Tit":"TIT","Heb":"HEB","Jas":"JAM","1 Pet":"1PE","2 Pet":"2PE","1 Jn":"1JO","Rev":"REV","Sir":"SIR","Wis":"WIS","Tob":"TOB","1 Macc":"1MA","2 Macc":"2MA","Esth":"EST","Obad":"OBA","Hab":"HAB","Zeph":"ZEP","Hag":"HAG","Phlm":"PHM","Philem":"PHM","2 Jn":"2JO","3 Jn":"3JO","1 Thes":"1TH","2 Thes":"2TH","1 Kings":"1KI","2 Kings":"2KI","1 Chr":"1CH","2 Chr":"2CH","Song":"SOL","Bar":"BAR","Jdt":"JDT","Apoc":"REV"};
  Object.keys(ab).forEach(function(k){ names[k] = ab[k]; });
  var keys = Object.keys(names).sort(function(a,b){ return b.length - a.length; });
  keys.forEach(function(k){ BKMAP[k.toLowerCase()] = names[k]; });
  BKRX = new RegExp("\\b(" + keys.map(function(k){ return k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s"); }).join("|") + ")\\.?\\s(\\d{1,3}):(\\d{1,3})(?:\\s?[–-]\\s?(\\d{1,3})(?!:))?", "g");
  return BKRX;
}
function findRefs(text){
  var rx = bookRx(), out = [], m; rx.lastIndex = 0;
  while((m = rx.exec(text))){ var b = BKMAP[m[1].replace(/\s+/g, " ").toLowerCase()]; if(b) out.push({b:b, c:+m[2], v:+m[3], v2: m[4] ? +m[4] : 0, i:m.index, len:m[0].length, s:m[0]}); }
  return out;
}
function linkRefs(a){
  if(!a || a.dataset.srefs || a.id === "bible") return; a.dataset.srefs = "1";
  var tw = document.createTreeWalker(a, NodeFilter.SHOW_TEXT, {acceptNode: function(n){ return n.parentNode.closest("a,button,script,style,textarea,.sref,svg,figcaption,h1,h2,.shelf-h") ? NodeFilter.FILTER_REJECT : /\d:\d/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; }});
  var nodes = []; while(tw.nextNode()) nodes.push(tw.currentNode);
  nodes.forEach(function(n){
    var refs = findRefs(n.nodeValue); if(!refs.length) return;
    var frag = document.createDocumentFragment(), pos = 0, t = n.nodeValue;
    refs.forEach(function(r){
      frag.appendChild(document.createTextNode(t.slice(pos, r.i)));
      var b = document.createElement("button"); b.type = "button"; b.className = "sref"; b.dataset.sref = r.b + "~" + r.c + "~" + r.v; b.textContent = r.s; b.title = "Open this passage";
      frag.appendChild(b); pos = r.i + r.len;
    });
    frag.appendChild(document.createTextNode(t.slice(pos)));
    n.parentNode.replaceChild(frag, n);
  });
}
document.addEventListener("click", function(e){
  var b = e.target.closest(".sref"); if(!b) return; e.preventDefault();
  var p = b.dataset.sref.split("~"), bk = p[0], ed = ED[st.ed].idx[bk] != null ? st.ed : edFor(bk), c = xchap(ed, bk, +p[1]), v = +p[2];
  load(srcOf(ed, bk), bk, function(d){ var vv = (chapter(d, c)||[]).filter(function(x){ return x[0] === v; })[0]; openAt(ed, bk, c, v, vv ? vv[1] : ""); });
});
function linkActive(){ var a = $("main article.active"); if(a) setTimeout(function(){ linkRefs(a); }, 120); }
addEventListener("hashchange", linkActive); setTimeout(linkActive, 300);
/* "Read in context" from the sheet when opened outside the Bible page */
sheet.querySelector(".vs-acts").insertAdjacentHTML("afterbegin", '<button type="button" class="btn-sm" data-ctx="1">Read in context</button>');
sheet.addEventListener("click", function(e){ if(!e.target.closest("[data-ctx]") || !cur) return; var c = cur; closeSheet(); go(c.ed, c.b, c.c, c.v); });

/* ---------- reading plans ---------- */
var CHRONO = "GEN JOB EXO LEV NUM DEU JOS JDG RUT 1SA 2SA PSA 1KI PRO ECC SOL 2KI ISA HOS JOE AMO OBA JON MIC NAH HAB ZEP JER LAM EZE DAN 1CH 2CH EZR HAG ZEC EST NEH MAL MAT MAR LUK JOH ACT JAM GAL 1TH 2TH 1CO 2CO ROM EPH PHI COL PHM 1TI TIT 2TI 1PE 2PE HEB JUD 1JO 2JO 3JO REV".split(" ");
var PLANS = [
  {id:"year", t:"The whole Bible in a year", d:"Genesis to Revelation, about three or four chapters a day.", days:365, books:BOOKORDER},
  {id:"chrono", t:"Chronological, in a year", d:"The books in approximate historical order: Job after Genesis, the prophets beside the kings who heard them, Paul’s letters in the order he wrote them.", days:365, books:CHRONO},
  {id:"nt90", t:"New Testament in 90 days", d:"About three chapters a day.", days:90, books:BOOKORDER.slice(39)},
  {id:"gospels", t:"The four Gospels in 30 days", d:"Matthew, Mark, Luke and John, about three chapters a day.", days:30, books:["MAT","MAR","LUK","JOH"]},
  {id:"psalms", t:"Psalms in a month", d:"Five psalms a day, as in many monastic and Anglican traditions.", days:30, books:["PSA"]},
  {id:"wisdom", t:"Wisdom books in 40 days", d:"Job, Psalms, Proverbs, Ecclesiastes and the Song of Songs.", days:40, books:["JOB","PSA","PRO","ECC","SOL"]}
];
function planChs(p){ var out = []; p.books.forEach(function(b){ var n = (ED.kjv.books[ED.kjv.idx[b]]||[])[3] || 0; for(var c=1;c<=n;c++) out.push([b, c]); }); return out; }
function planDay(p, i){ var a = planChs(p), T = a.length, s = Math.floor(i*T/p.days), e = Math.floor((i+1)*T/p.days); return a.slice(s, e); }
function rangeLabel(chs){
  var out = [], i = 0;
  while(i < chs.length){ var b = chs[i][0], s = chs[i][1], e = s; while(i+1 < chs.length && chs[i+1][0] === b && chs[i+1][1] === e+1){ i++; e++; } out.push(shortName(edFor(b), b) + " " + s + (e !== s ? "–" + e : "")); i++; }
  return out.join("; ");
}
var BP = get("hcc.bplan", null);
function bpToday(){ if(!BP) return 0; var p = PLANS.filter(function(x){ return x.id === BP.id; })[0]; return Math.min(p.days - 1, Math.max(0, dayDiff(new Date(BP.start + "T00:00:00"), new Date()))); }
function pushPlanNote(){
  try{ if(!APP || !APP.setBiblePlan) return; if(!BP){ APP.setBiblePlan(""); return; }
    var p = PLANS.filter(function(x){ return x.id === BP.id; })[0], i = bpToday(); APP.setBiblePlan(p.t + " · day " + (i+1) + ": " + rangeLabel(planDay(p, i))); }catch(e){}
}
pushPlanNote();
XMODE.plans = function(){
  var h = '<h3 class="bib-h">Bible reading plans</h3>';
  if(BP){
    var p = PLANS.filter(function(x){ return x.id === BP.id; })[0], i = bpToday(), done = BP.done || {}, nd = Object.keys(done).length, behind = 0;
    for(var k=0;k<i;k++) if(!done[k]) behind++;
    var today = planDay(p, i);
    h += '<section class="bp-cur"><p class="eyebrow">'+esc(p.t)+'</p><h4>Day '+(i+1)+' of '+p.days+'</h4><div class="bp-bar"><i style="width:'+(nd/p.days*100).toFixed(1)+'%"></i></div><p class="cmp-note">'+nd+' of '+p.days+' days done'+(behind ? ' · '+behind+' earlier day'+(behind>1?"s":"")+' still open' : "")+'</p>'+
      '<p class="bp-today">Today: <b>'+esc(rangeLabel(today))+'</b></p><div class="bp-chs">'+today.map(function(x){ return '<button type="button" class="btn-sm" data-pgo="'+x[0]+'~'+x[1]+'">'+esc(shortName(edFor(x[0]), x[0]))+' '+x[1]+'</button>'; }).join("")+'</div>'+
      '<label class="bp-done"><input type="checkbox" data-pday="'+i+'"'+(done[i] ? " checked" : "")+'> Mark today’s reading as done</label>'+
      '<details class="bp-all"><summary>All days</summary><ol>'+Array.apply(null, {length:p.days}).map(function(_, d){ return '<li class="'+(done[d] ? "dn" : "")+(d === i ? " td" : "")+'"><label><input type="checkbox" data-pday="'+d+'"'+(done[d] ? " checked" : "")+'> Day '+(d+1)+'</label> <span>'+esc(rangeLabel(planDay(p, d)))+'</span></li>'; }).join("")+'</ol></details>'+
      '<button type="button" class="chip" data-pstop="1">Stop this plan</button></section>';
  }
  h += '<div class="bp-grid">' + PLANS.map(function(p){ var n = planChs(p).length; return '<div class="bp-card'+(BP && BP.id === p.id ? " on" : "")+'"><h4>'+esc(p.t)+'</h4><p>'+esc(p.d)+'</p><small>'+n+' chapters · '+p.days+' days · about '+(n/p.days).toFixed(1)+' a day</small><button type="button" class="btn-sm" data-pstart="'+p.id+'">'+(BP && BP.id === p.id ? "Restart from today" : "Start")+'</button></div>'; }).join("") + '</div>'+
    '<p class="cmp-note">Plans use whichever edition you are reading. Your progress stays on this device'+(APP ? ", and today’s reading shows in the “Today’s reading” widget." : ".")+'</p>';
  view.innerHTML = h;
};
view.addEventListener("click", function(e){
  var t;
  if((t = e.target.closest("[data-pstart]"))){ BP = {id: t.dataset.pstart, start: ymd(new Date()), done: {}}; put("hcc.bplan", BP); pushPlanNote(); haptic("strong"); render(); return; }
  if((t = e.target.closest("[data-pstop]"))){ BP = null; put("hcc.bplan", null); pushPlanNote(); render(); return; }
  if((t = e.target.closest("[data-pgo]"))){ var p = t.dataset.pgo.split("~"); goEng(p[0], +p[1]); return; }
});
view.addEventListener("change", function(e){
  var t = e.target.closest("[data-pday]"); if(!t || !BP) return;
  BP.done = BP.done || {}; if(t.checked) BP.done[t.dataset.pday] = 1; else delete BP.done[t.dataset.pday];
  put("hcc.bplan", BP); pushPlanNote(); haptic("tick"); if(t.closest(".bp-done")) render();
});

/* ---------- daily office lectionary (BCP 1979) ---------- */
var LECT = null; window.__LECT = function(d){ LECT = d; };
var DOW = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], MONS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function easter(y){ var a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1; return new Date(y, mo-1, da); }
function addD(d, n){ var x = new Date(d); x.setDate(x.getDate() + n); return x; }
function advent1(y){ var x = new Date(y, 11, 25); var back = x.getDay() === 0 ? 7 : x.getDay(); return addD(x, -back - 21); }
function sundayOnOrBefore(d){ return addD(d, -d.getDay()); }
function office(d){
  d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  var y = d.getFullYear(), a1 = advent1(y), start = d >= a1 ? y : y - 1, yr = ((start + 1) % 2 === 1) ? "y1" : "y2";
  var E = d < a1 ? easter(y) : easter(y + 1);
  var key = MONS[d.getMonth()] + " " + d.getDate(), dow = DOW[d.getDay()], week = null, dayKey = dow;
  var jan6 = new Date(d < a1 ? y : y + 1, 0, 6), ep1 = addD(jan6, 7 - jan6.getDay()), ash = addD(E, -46), lastEp = addD(E, -49), pent = addD(E, 49), trin = addD(E, 56);
  if(d >= a1 && !(d.getMonth() === 11 && d.getDate() >= 24)){ week = "Week of " + (Math.floor(dayDiff(a1, d) / 7) + 1) + " Advent"; }
  else if((d.getMonth() === 11 && d.getDate() >= 24) || (d.getMonth() === 0 && d < ep1)){
    dayKey = key; week = d.getMonth() === 11 && d.getDate() === 24 ? "Week of 4 Advent" : d.getMonth() === 0 && d.getDate() >= 6 ? "The Epiphany and Following" : "Christmas Day and Following";
    if(d.getDay() === 0 && week === "Christmas Day and Following") dayKey = "Sunday";
  }
  else if(d < lastEp){ week = "Week of " + (Math.floor(dayDiff(ep1, d) / 7) + 1) + " Epiphany"; }
  else if(d < ash){ week = "Week of Last Epiphany"; }
  else if(d < addD(E, -42)){ week = "Ash Wednesday and Following"; }
  else if(d < addD(E, -7)){ week = "Week of " + (Math.floor(dayDiff(addD(E, -42), d) / 7) + 1) + " Lent"; }
  else if(d < E){ week = "Holy Week"; }
  else if(d < addD(E, 7)){ week = "Easter Week"; }
  else if(d < pent){ week = "Week of " + (Math.floor(dayDiff(E, d) / 7) + 1) + " Easter"; }
  else if(+d === +pent){ week = "Pentecost"; }
  else {
    var may11 = new Date(d.getFullYear(), 4, 11), s0 = addD(may11, -may11.getDay()); if(may11.getDay() > 3) s0 = addD(s0, 7);
    var S = sundayOnOrBefore(d), n = Math.round(dayDiff(s0, S) / 7) + 1;
    week = "Proper " + Math.max(1, Math.min(29, n));
    if(+d === +trin) week = "__trinity";
    if(+d === +addD(trin, -1)) week = "__trinityeve";
  }
  var list = LECT[yr], hit = null;
  if(week === "__trinity" || week === "__trinityeve") hit = list.filter(function(x){ return /Trinity/.test(x.title||"") && x.day === (week === "__trinity" ? "Sunday" : "Saturday"); })[0];
  if(!hit) hit = list.filter(function(x){ return x.week === week && x.day === dayKey; })[0];
  if(!hit && dayKey !== dow) hit = list.filter(function(x){ return x.week === week && x.day === dow; })[0];
  var holy = (LECT.hd || []).filter(function(x){ return x.day === key; })[0];
  return {yr: yr === "y1" ? "Year One" : "Year Two", week: week === "__trinity" ? "Trinity Sunday" : week === "__trinityeve" ? "Eve of Trinity Sunday" : week, hit: hit, holy: holy, date: d};
}
function refBtns(s){
  return String(s).split(/,\s*|\s+or\s+/).map(function(part){
    var t = part.replace(/[\[\]()]/g, "").trim(), m = t.match(/^((?:[1-4]\s)?[A-Za-z]+\.?)\s*(\d+)(?::(\d+))?/), r = m ? parseRef(m[1] + " " + m[2] + (m[3] ? ":" + m[3] : "")) : null;
    return r ? '<button type="button" class="lc-ref" data-goeng2="'+r.b+'~'+r.c+'~'+(r.v||0)+'">'+esc(part.trim())+'</button>' : '<span class="lc-ref">'+esc(part)+'</span>';
  }).join(" ");
}
function psBtns(arr){ return (arr||[]).map(function(p){ var m = String(p).match(/(\d+)(?::(\d+))?/); return m ? '<button type="button" class="lc-ref" data-goeng2="PSA~'+m[1]+'~'+(m[2]||0)+'">'+esc(p)+'</button>' : esc(p); }).join(" "); }
function lessonsHTML(L){
  if(!L) return "";
  function block(o){ return ["first","altFirst","second","altSecond","third","gospel","altGospel"].filter(function(k){ return o[k]; }).map(function(k){ return '<li><span>'+({first:"First",altFirst:"or",second:"Second",altSecond:"or",third:"Third",gospel:"Gospel",altGospel:"or"}[k])+'</span>'+refBtns(o[k])+'</li>'; }).join(""); }
  var h = "";
  if(L.morning || L.evening){ if(L.morning) h += '<p class="lc-o">Morning</p><ul class="lc-l">'+block(L.morning)+'</ul>'; if(L.evening) h += '<p class="lc-o">Evening</p><ul class="lc-l">'+block(L.evening)+'</ul>'; }
  else h += '<ul class="lc-l">'+block(L)+'</ul>';
  return h;
}
function officeHTML(o){
  var x = o.hit, h = '<div class="lc-meta"><span>'+esc(o.yr)+'</span><span>'+esc((x && x.season) || "")+'</span><span>'+esc(o.week || "")+'</span></div>';
  if(x && x.title) h += '<h4 class="lc-t">'+esc(x.title)+'</h4>';
  if(x){ h += '<div class="lc-ps"><p class="lc-o">Psalms</p>'+(x.psalms && x.psalms.morning ? '<p><span>Morning</span>'+psBtns(x.psalms.morning)+'</p>' : "")+(x.psalms && x.psalms.evening ? '<p><span>Evening</span>'+psBtns(x.psalms.evening)+'</p>' : "")+'</div><p class="lc-o">Lessons</p>' + lessonsHTML(x.lessons); }
  else h += '<p class="vs-none">No entry for this day in the table.</p>';
  if(o.holy) h += '<section class="lc-holy"><p class="eyebrow">Holy day</p><h4 class="lc-t">'+esc(o.holy.title)+'</h4>'+(o.holy.psalms ? '<div class="lc-ps">'+(o.holy.psalms.morning ? '<p><span>Morning</span>'+psBtns(o.holy.psalms.morning)+'</p>' : "")+(o.holy.psalms.evening ? '<p><span>Evening</span>'+psBtns(o.holy.psalms.evening)+'</p>' : "")+'</div>' : "")+lessonsHTML(o.holy.lessons)+'</section>';
  return h;
}
XMODE.today = function(){
  view.innerHTML = '<h3 class="bib-h">Today’s readings</h3><div class="bib-load"><span></span><span></span><span></span></div>';
  script("bible/lect.js", function(){ return !!LECT; }, function(ok){
    if(mode !== "today") return;
    if(!ok){ view.innerHTML += '<p class="vs-none">The lectionary could not be loaded.</p>'; return; }
    var d = st.ld ? new Date(st.ld + "T00:00:00") : new Date(), o = office(d);
    view.innerHTML = '<h3 class="bib-h">Daily readings</h3><div class="lc-nav"><button type="button" class="btn-sm" data-ld="-1" aria-label="Previous day">←</button><label class="vh" for="lcDate">Date</label><input type="date" id="lcDate" value="'+ymd(d)+'"><button type="button" class="btn-sm" data-ld="1" aria-label="Next day">→</button><button type="button" class="btn-sm" data-ld="0">Today</button></div>'+
      '<p class="cmp-note">The Daily Office Lectionary of the Book of Common Prayer (1979), a two-year cycle of psalms and three readings for Morning and Evening Prayer, used by Anglicans and many others. It follows the church year, so dates move with Easter and Advent.</p>'+
      '<section class="lc-card">'+officeHTML(o)+'</section><p class="vs-cite">Table: Book of Common Prayer 1979 (public domain), data from the open “Daily Office” JSON project (MIT). Readings open in the edition you are using.</p>';
  });
};
view.addEventListener("click", function(e){
  var t;
  if((t = e.target.closest("[data-ld]"))){ var n = +t.dataset.ld, d = st.ld ? new Date(st.ld + "T00:00:00") : new Date(); st.ld = n === 0 ? "" : ymd(addD(d, n)); render(); return; }
  if((t = e.target.closest("[data-goeng2]"))){ var p = t.dataset.goeng2.split("~"); goEng(p[0], +p[1], +p[2]); return; }
});
view.addEventListener("change", function(e){ if(e.target.id === "lcDate" && e.target.value){ st.ld = e.target.value; render(); } });

/* ---------- Bible maps ---------- */
var mapArt = $("#bible-maps");
if(mapArt){
  var MP = BX.maps || [], mi = 0, playT = null;
  var chips = $(".bm-chips", mapArt), fig = $(".bm-fig", mapArt), card = $(".bm-card", mapArt);
  function drawMap(k, animate){
    var m = MP[k]; mi = k; clearTimeout(playT);
    $$(".chip", chips).forEach(function(c, i){ c.setAttribute("aria-pressed", i === k ? "true" : "false"); });
    var pts = m.p, path = m.route ? "M" + pts.map(function(p){ return p[1].toFixed(1) + " " + p[2].toFixed(1); }).join(" L") : "";
    var seen = {};
    fig.innerHTML = '<svg viewBox="'+m.vb+'" role="img" aria-label="Map: '+esc(m.t)+'" style="--fs:'+m.fs+'px;--sw:'+m.sw+'px"><use href="#landR" class="land"/>'+(path ? '<path class="bm-route'+(animate ? " anim" : "")+'" d="'+path+'" pathLength="1"/>' : "")+
      '<g class="bm-stops">'+pts.map(function(p, i){ var key = p[1].toFixed(0)+","+p[2].toFixed(0), dup = seen[key]; seen[key] = 1;
        return '<g class="bm-st'+(m.route ? "" : " tribe")+'" data-i="'+i+'" transform="translate('+p[1].toFixed(1)+' '+p[2].toFixed(1)+')" tabindex="0" role="button" aria-label="'+esc(p[0])+'"><circle r="'+m.r+'"/>'+(m.route ? '<text class="n" dy="'+(m.r*0.38).toFixed(2)+'">'+(i+1)+'</text>' : "")+(dup ? "" : '<text class="l" x="'+(m.r*1.5).toFixed(1)+'" y="'+(-m.r*0.9).toFixed(1)+'">'+esc(p[0])+'</text>')+'</g>'; }).join("")+'</g></svg>';
    card.innerHTML = '<p class="eyebrow">'+esc(m.s)+'</p><h3>'+esc(m.t)+'</h3><p class="cmp-note">'+esc(m.note)+'</p><ol class="bm-list">'+pts.map(function(p, i){ return '<li><button type="button" data-bmi="'+i+'">'+esc(p[0])+'</button> <small>'+esc(p[3].replace(/^(\w+) (\d+) (\d+)$/, function(_, b, c, v){ return shortName(edFor(b), b) + " " + c + ":" + v; }))+'</small></li>'; }).join("")+'</ol>';
    if(animate && m.route) play(0);
  }
  function stop(i){
    var m = MP[mi], p = m.p[i]; if(!p) return;
    $$(".bm-st", fig).forEach(function(g){ g.classList.toggle("on", +g.dataset.i === i); });
    $$(".bm-list li", card).forEach(function(li, k){ li.classList.toggle("on", k === i); });
    var r = p[3].split(" "), ed = ED[st.ed].idx[r[0]] != null ? st.ed : edFor(r[0]), c = xchap(ed, r[0], +r[1]);
    var box = $(".bm-verse", mapArt);
    load(srcOf(ed, r[0]), r[0], function(d){ var vv = (chapter(d, c)||[]).filter(function(x){ return x[0] === +r[2]; })[0];
      box.innerHTML = '<p class="vs-lang">'+esc(p[0])+' · '+esc(shortName(ed, r[0]))+' '+c+':'+r[2]+'</p><blockquote>'+(vv ? fmt(vv[1]) : "")+'</blockquote><button type="button" class="btn-sm" data-bmgo="'+ed+'~'+r[0]+'~'+c+'~'+r[2]+'">Read the chapter →</button>'; });
  }
  function play(i){ var m = MP[mi]; if(i >= m.p.length) return; stop(i); playT = setTimeout(function(){ play(i + 1); }, 1500); }
  chips.innerHTML = MP.map(function(m, i){ return '<button type="button" class="chip" data-bmk="'+i+'" aria-pressed="false">'+esc(m.t)+'</button>'; }).join("");
  mapArt.addEventListener("click", function(e){
    var t;
    if((t = e.target.closest("[data-bmk]"))){ drawMap(+t.dataset.bmk, true); haptic("tick"); return; }
    if((t = e.target.closest("[data-bmplay]"))){ drawMap(mi, true); return; }
    if((t = e.target.closest("[data-bmi]"))){ clearTimeout(playT); stop(+t.dataset.bmi); return; }
    if((t = e.target.closest(".bm-st"))){ clearTimeout(playT); stop(+t.dataset.i); return; }
    if((t = e.target.closest("[data-bmgo]"))){ var p = t.dataset.bmgo.split("~"); go(p[0], p[1], +p[2], +p[3]); return; }
  });
  mapArt.addEventListener("keydown", function(e){ var g = e.target.closest(".bm-st"); if(g && (e.key === "Enter" || e.key === " ")){ e.preventDefault(); clearTimeout(playT); stop(+g.dataset.i); } });
  var mapDone = false;
  function mapRoute(){ if(location.hash === "#bible-maps" && !mapDone){ mapDone = true; drawMap(0, true); } }
  addEventListener("hashchange", function(){ setTimeout(mapRoute, 80); }); setTimeout(mapRoute, 200);
}

/* ---------- canon history ---------- */
var canArt = $("#bible-canon");
if(canArt){
  canArt.addEventListener("click", function(e){
    var t = e.target.closest("[data-cf]");
    if(t){ var f = t.dataset.cf; $$("[data-cf]", canArt).forEach(function(x){ x.setAttribute("aria-pressed", x === t ? "true" : "false"); });
      $$(".cn-item", canArt).forEach(function(it){ it.hidden = f && it.dataset.reg !== f; }); $$(".cn-tab tbody tr", canArt).forEach(function(r){ r.hidden = f && r.dataset.reg !== f; }); return; }
    var r = e.target.closest("tr[data-cn]");
    if(r){ var it = $('#cn-'+r.dataset.cn, canArt); if(it){ it.scrollIntoView({block:"center", behavior:"smooth"}); it.classList.remove("flash"); void it.offsetWidth; it.classList.add("flash"); } }
  });
}

/* ---------- cross-reference arcs ---------- */
var arcArt = $("#bible-arcs");
if(arcArt){
  var ARCS = null; window.__ARCS = function(d){ ARCS = d; };
  var cv = $("canvas", arcArt), info = $(".ba-info", arcArt), CH = [], W = 0, Hh = 0, sel = -1, dpr = 1, base = null;
  function setup(){
    if(!ARCS) return; CH = []; ARCS.books.forEach(function(b){ for(var c=1;c<=b[1];c++) CH.push([b[0], c]); });
    var rect = cv.parentNode.getBoundingClientRect(); W = Math.max(300, rect.width); Hh = Math.round(Math.min(560, Math.max(260, W * 0.52)));
    dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = W * dpr; cv.height = Hh * dpr; cv.style.height = Hh + "px";
    draw();
  }
  function X(i){ return 8 + (i + 0.5) / CH.length * (W - 16); }
  function col(a, z){ var d = Math.abs(z - a) / CH.length; return "hsl(" + (Math.round(200 + 160 * d) % 360) + ", 70%, 50%)"; }
  function draw(){
    var g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, Hh);
    var axis = Hh - 26, dark = matchMedia("(prefers-color-scheme: dark)").matches && document.documentElement.dataset.theme !== "light" || document.documentElement.dataset.theme === "dark";
    var maxN = ARCS.a.length ? ARCS.a[0][2] : 1;
    g.lineWidth = 0.6;
    ARCS.a.forEach(function(p){
      var on = sel < 0 || p[0] === sel || p[1] === sel; if(sel >= 0 && !on) return;
      var x1 = X(p[0]), x2 = X(p[1]), r = (x2 - x1) / 2, h = Math.min(axis - 6, r);
      g.globalAlpha = sel < 0 ? Math.min(0.5, 0.06 + p[2] / maxN * 0.6) : 0.85;
      g.strokeStyle = col(p[0], p[1]); g.lineWidth = sel < 0 ? 0.6 : 1.4;
      g.beginPath(); g.ellipse((x1 + x2) / 2, axis, r, h, 0, Math.PI, 2 * Math.PI); g.stroke();
    });
    g.globalAlpha = 1;
    var bx = 0; ARCS.books.forEach(function(b, k){ var x1 = X(bx) - (W - 16) / CH.length / 2, x2 = X(bx + b[1] - 1) + (W - 16) / CH.length / 2; g.fillStyle = k < 39 ? (k % 2 ? "#8a6d3b" : "#b0905a") : (k % 2 ? "#2c5b8c" : "#5a86b5"); g.fillRect(x1, axis + 4, Math.max(1, x2 - x1 - 0.5), 8); bx += b[1]; });
    g.fillStyle = dark ? "#c9c3b8" : "#5b564d"; g.font = "600 11px system-ui, sans-serif"; g.textAlign = "center";
    [["Genesis", 0, "left"], ["Psalms", idxOf("PSA"), "center"], ["Isaiah", idxOf("ISA"), "center"], ["Matthew", idxOf("MAT"), "center"], ["Revelation", CH.length - 1, "right"]].forEach(function(l){ g.textAlign = l[2]; g.fillText(l[0], l[2] === "left" ? 8 : l[2] === "right" ? W - 8 : X(l[1]), axis + 24); });
    if(sel >= 0){ g.fillStyle = dark ? "#fff" : "#111"; g.fillRect(X(sel) - 1, axis - 4, 2, 18); }
  }
  function idxOf(b){ for(var i=0;i<CH.length;i++) if(CH[i][0] === b) return i; return 0; }
  function pickX(x){ return Math.max(0, Math.min(CH.length - 1, Math.floor((x - 8) / (W - 16) * CH.length))); }
  function show(i){
    sel = i; draw(); var c = CH[i], links = ARCS.a.filter(function(p){ return p[0] === i || p[1] === i; }).sort(function(a,b){ return b[2] - a[2]; }).slice(0, 10);
    info.innerHTML = '<p class="vs-lang">'+esc(shortName(edFor(c[0]), c[0]))+' '+c[1]+' · '+links.length+' strong link'+(links.length===1?"":"s")+' shown</p><div class="ba-l">'+links.map(function(p){ var o = CH[p[0] === i ? p[1] : p[0]]; return '<button type="button" class="chip" data-bago="'+o[0]+'~'+o[1]+'">'+esc(shortName(edFor(o[0]), o[0]))+' '+o[1]+'</button>'; }).join("")+'</div><button type="button" class="btn-sm" data-bago="'+c[0]+'~'+c[1]+'">Read '+esc(shortName(edFor(c[0]), c[0]))+' '+c[1]+' →</button> <button type="button" class="btn-sm" data-baclr="1">Show all</button>';
  }
  cv.addEventListener("pointermove", function(e){ if(e.pointerType !== "mouse" || !CH.length) return; var r = cv.getBoundingClientRect(), i = pickX(e.clientX - r.left); cv.title = shortName(edFor(CH[i][0]), CH[i][0]) + " " + CH[i][1]; });
  cv.addEventListener("click", function(e){ if(!CH.length) return; var r = cv.getBoundingClientRect(); show(pickX(e.clientX - r.left)); });
  arcArt.addEventListener("click", function(e){ var t;
    if((t = e.target.closest("[data-bago]"))){ var p = t.dataset.bago.split("~"); goEng(p[0], +p[1]); return; }
    if((t = e.target.closest("[data-baclr]"))){ sel = -1; draw(); info.innerHTML = '<p class="cmp-note">Tap anywhere along the bar to pick a chapter.</p>'; }
    if((t = e.target.closest("[data-bajump]"))){ show(idxOf(t.dataset.bajump.split("~")[0]) + (+t.dataset.bajump.split("~")[1]) - 1); }
  });
  var arcsOn = false;
  function arcRoute(){ if(location.hash !== "#bible-arcs") return; script("bible/arcs.js", function(){ return !!ARCS; }, function(ok){ if(ok){ setup(); if(!arcsOn){ arcsOn = true; addEventListener("resize", function(){ if(location.hash === "#bible-arcs") setup(); }); } } }); }
  addEventListener("hashchange", function(){ setTimeout(arcRoute, 80); }); setTimeout(arcRoute, 250);
}

/* ---------- home: today's readings link ---------- */
function homeLect(){
  var v = $(".votd"); if(!v || $(".votd-lect", v)) return;
  var a = document.createElement("button"); a.type = "button"; a.className = "btn-sm votd-lect"; a.textContent = "Today’s readings";
  var q = $(".qbtns", v); if(q) q.appendChild(a);
  a.addEventListener("click", function(){ mode = "today"; location.hash = "bible"; setTimeout(function(){ render(); toolsMark(); }, 120); });
}
setTimeout(homeLect, 500); addEventListener("hashchange", function(){ setTimeout(homeLect, 120); });

/* ---------- app: daily verse notification setting ---------- */
function verseSettings(){
  if(!APP || !APP.setVerseDaily) return; var v = $(".votd"); if(!v || $(".vset", v)) return;
  var s = {}; try{ s = JSON.parse(APP.getVerseDaily() || "{}"); }catch(e){}
  var box = document.createElement("div"); box.className = "vset";
  box.innerHTML = '<div class="setrow"><label for="vdOn">Daily verse notification (also on the lock screen)</label><input type="checkbox" class="switch" id="vdOn"'+(s.on ? " checked" : "")+'></div><div class="setrow"><label for="vdAt">Time</label><input type="time" id="vdAt" value="'+("0"+(s.h==null?7:s.h)).slice(-2)+':'+("0"+(s.m||0)).slice(-2)+'"></div><p class="cmp-note">Widgets: “Verse of the day”, “Verse of the day (large)” and “Today”, optionally with the Greek or Hebrew, on the home screen or lock screen.</p>';
  v.appendChild(box);
  function push(){ var p = $("#vdAt", box).value.split(":"); try{ APP.setVerseDaily($("#vdOn", box).checked, +p[0]||7, +p[1]||0); }catch(e){} haptic("tick"); }
  $("#vdOn", box).addEventListener("change", push); $("#vdAt", box).addEventListener("change", push);
}
setTimeout(verseSettings, 600); addEventListener("hashchange", function(){ setTimeout(verseSettings, 150); });
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

/* open a verse straight on one tab of its sheet (the widgets' "What the Fathers said" uses ~comm) */
function openVerseTab(v, t){ if(["orig","eds","links","comm"].indexOf(t) < 0) return; var n = 0;
  (function find(){ var el = view && view.querySelector('.bv[data-v="'+v+'"]'); if(el){ tab = t; openSheet(el); return; } if(++n < 50) setTimeout(find, 150); })(); }
/* ---------- route ---------- */
var rendered = false;
function onRoute(){
  var h = location.hash.slice(1);
  if(h.indexOf("bible~") === 0){ var p = h.split("~"); history.replaceState(null, "", "#home"); go(p[1], p[2], +p[3], +p[4]); if(p[5] && +p[4]) openVerseTab(+p[4], p[5]); return; }
  if(h === "bible"){ if(!rendered || pendingV){ rendered = true; render({v: pendingV}); pendingV = 0; } }
  else { if(menu) menu.hidden = true; closeSheet(); hideAct(); fab.hidden = true; pickHide(); if(PICK[mode] != null) mode = "read"; }
  if(h === "bible" && mode === "read" && $(".bib-text, .bib-par", view)) fab.hidden = false;
}
addEventListener("hashchange", function(){ setTimeout(onRoute, 30); });
setTimeout(onRoute, 80);

/* ---------- verse of the day (home) ---------- */
function vIndex(){ var d = new Date(), a = Date.UTC(2026,0,1), b = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); return ((Math.floor((b-a)/864e5) % VOTD.length) + VOTD.length) % VOTD.length; }
function mountVotd(){
  var sh = $(".shelves"); if(!sh || $(".votd", sh) || !VOTD.length) return;
  var k = vIndex(), box = document.createElement("section"); box.className = "votd"; box.setAttribute("aria-label", "Verse of the day");
  function body(){ var v = VOTD[k]; return '<blockquote>'+esc(v.t)+'</blockquote><p class="qa"><b>'+esc(v.r)+'</b> · World English Bible</p>'; }
  function inDef(){ var v = VOTD[k], d = defEd(), kk = k; if(!d || d === "web" || ED[d].idx[v.b] == null) return;
    var ch = xchap(d, v.b, v.c); load(ED[d].books[ED[d].idx[v.b]][1], v.b, function(dt){ if(kk !== k) return;
      var tx = (chapter(dt, ch) || []).filter(function(x){ return x[0] === v.v; }).map(function(x){ return x[1]; }).join(" ").replace(/\s+/g, " ").trim(); if(!tx) return;
      var vb = $(".vbody", box); if(vb) vb.innerHTML = '<blockquote>'+esc(tx)+'</blockquote><p class="qa"><b>'+esc(shortName(d, v.b)+" "+ch+":"+v.v)+'</b> · '+esc(ED[d].name)+'</p>'; }); }
  box.innerHTML = '<p class="shelf-h">Verse of the day</p><div class="vbody">'+body()+'</div><div class="qbtns"><button type="button" class="btn-sm" data-vv="read">Read the chapter</button><button type="button" class="btn-sm" data-vv="next">Another</button></div>';
  var last = get("hcc.bible.last", null);
  if(last) box.innerHTML += '<a class="more" href="#bible">Continue reading: '+esc(last.l)+' ('+esc(last.ed)+') →</a>';
  var q = $(".qotd", sh); sh.insertBefore(box, q ? q.nextSibling : sh.firstChild); inDef();
  box.addEventListener("click", function(e){
    var b = e.target.closest("[data-vv]"); if(!b) return;
    if(b.dataset.vv === "next"){ k = (k + 1 + Math.floor(Math.random()*(VOTD.length-1))) % VOTD.length; $(".vbody", box).innerHTML = body(); inDef(); haptic("tick"); }
    if(b.dataset.vv === "read"){ var v = VOTD[k], e2 = defEd() && ED[defEd()].idx[v.b] != null ? defEd() : ED[st.ed].idx[v.b] != null ? st.ed : "web"; go(e2, v.b, xchap(e2, v.b, v.c), v.v); }
  });
}
mountVotd(); setTimeout(mountVotd, 400);
addEventListener("hashchange", function(){ setTimeout(mountVotd, 60); });

/* ---------- tab bar: Bible ---------- */
var tb = $(".tabbar");
if(tb && !$('[data-tab="bible"]', tb)){
  var bt = document.createElement("button"); bt.type = "button"; bt.dataset.tab = "bible";
  bt.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19"/><path d="M12 6.5v7M9.5 9h5"/></svg><span>Bible</span>';
  var tx = $('[data-tab="texts"]', tb); tb.insertBefore(bt, tx ? tx.nextSibling : null);
  bt.addEventListener("click", function(e){ e.stopPropagation(); document.body.classList.remove("navopen"); location.hash = "bible"; });
  function mark(){ bt.setAttribute("aria-current", location.hash === "#bible" ? "true" : "false"); }
  addEventListener("hashchange", mark); mark();
}

/* ---------- internals for the features in bible-extras.js ---------- */
window.HCCBibleX = {M: M, ED: ED, st: st, view: view, art: art, sheet: sheet, XMODE: XMODE, NOTES: NOTES, BX2: BX2, BOOKORDER: BOOKORDER, NTB: NTB, HASORIG: HASORIG,
  LEX: LEX, FATH: FATH, esc: esc, fmt: fmt, get: get, put: put, haptic: haptic, save: save, render: render, toolsMark: toolsMark, load: load, chapter: chapter,
  shortName: shortName, bname: bname, edFor: edFor, qEd: qEd, srcOf: srcOf, xchap: xchap, engCh: engCh, equiv: equiv, origBook: origBook, grpOf: grpOf, pick: pick,
  script: script, parseRef: parseRef, findRefs: findRefs, refIndex: refIndex, linkRefs: linkRefs, go: go, goEng: goEng, openAt: openAt, openWord: openWord,
  lexEntry: lexEntry, normT: normT, allTags: allTags, closeSheet: closeSheet, hRefs: hRefs, saveNotes: saveNotes, markUI: markUI, curKey: curKey,
  cur: function(){ return cur; }, mode: function(m){ if(m != null) mode = m; return mode; },
  /* open a Bible tool page (search, notes, lexicon…) from anywhere */
  tool: function(m){ mode = m; pickHide(); if(location.hash !== "#bible"){ location.hash = "bible"; setTimeout(function(){ render(); toolsMark(); window.scrollTo({top: art.getBoundingClientRect().top + scrollY - 70}); }, 80); } else { render(); toolsMark(); window.scrollTo({top: art.getBoundingClientRect().top + scrollY - 70}); } }
};
HCCBible.word = openWord;
HCCBible.search = function(q){ st.sq = String(q || "").trim(); st.ss = "all"; save(); HCCBibleX.tool("search"); };

/* ---------- widgets: tell the app what is being watched ---------- */
if(APP && APP.setProgress){
  addEventListener("hashchange", function(){ setTimeout(function(){
    var a = $("main article.active"); if(!a || !a.dataset.ep) return;
    try{ APP.setProgress(a.dataset.title || a.id, "Episode " + a.dataset.ep, a.id); }catch(e){}
  }, 200); });
}
})();
