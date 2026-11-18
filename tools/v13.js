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
var st = get("hcc.bible", {ed:"kjv", b:"JOH", c:1, cmp:"", v:0});
if(!ED[st.ed]) st.ed = "kjv";
var readSet = get("hcc.bible.read", {});

/* ---------- loading ---------- */
var CACHE = {}, WAIT = {}, LOADING = {};
window.__BIB = function(src, b, data){ var k = src+"/"+b; CACHE[k] = data; (WAIT[k]||[]).forEach(function(f){ f(data); }); delete WAIT[k]; };
function load(src, b, cb){
  var k = src+"/"+b; if(CACHE[k]) return cb(CACHE[k]);
  if(WAIT[k]){ WAIT[k].push(cb); return; } WAIT[k] = [cb];
  function sg(bk){ var g = (M.grp||{})[bk] || "dc"; return M.sgrp ? M.sgrp[g] : g; }
  var file = "bible/"+src+"/"+sg(b)+".js";
  if(LOADING[file]) return; LOADING[file] = 1;
  var s = document.createElement("script"); s.src = file; s.async = true;
  s.onload = function(){ Object.keys(WAIT).forEach(function(kk){ if(kk.indexOf(src+"/") === 0 && !CACHE[kk] && sg(kk.slice(src.length+1)) === sg(b)){ var w = WAIT[kk]; delete WAIT[kk]; w.forEach(function(f){ f(null); }); } }); };
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
      view.innerHTML = head + (cmp ? right : '<div class="bib-text'+(POETRY[st.b] ? " poetry" : "")+'">'+verses(list, st.b, hl)+'</div>') + nav + '<section class="bib-conn" id="bibConn" aria-label="Connected chapters"></section>' +
        ext() + '<p class="bib-src">'+esc(M.src[bk[1]] || "")+'</p>';
      if(!opts.keep) window.scrollTo({top: art.getBoundingClientRect().top + scrollY - 70, behavior: "instant" in window ? "instant" : "auto"});
      if(hl){ var el = $('.bv[data-v="'+hl+'"]', view); if(el) setTimeout(function(){ el.scrollIntoView({block:"center"}); }, 60); }
      progress(); conn(); if(studyDock()) setTimeout(function(){ studyAuto(hl); }, 40); else if(sheet.classList.contains("docked")) closeSheet();
    }
    if(!cmp) return done();
    var b2 = equiv(cmp, st.b);
    if(!b2){ return done('<p class="bib-note">'+esc(bname(st.ed, st.b))+' is not part of the '+esc(ED[cmp].name)+'.</p><div class="bib-text">'+verses(list, st.b, hl)+'</div>'); }
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
        return '<div class="bib-row"><p>'+(a ? '<span class="bv'+(hl===k?" hl":"")+'" data-v="'+k+'"><sup>'+k+'</sup>'+fmt(a[1])+'</span>' : '<span class="bib-gap">—</span>')+'</p><p>'+(z ? '<span class="bv2"><sup>'+k+'</sup>'+fmt(z[1])+'</span>' : '<span class="bib-gap">—</span>')+'</p></div>';
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
  var b2 = equiv(st.ed, b);
  if(!b2){ var alt = M.eds.filter(function(e){ return e.idx[b] != null; })[0]; if(alt){ st.ed = alt.id; b2 = b; } else return false; }
  st.b = b2; st.c = c || 1; mode = "read";
  if(location.hash !== "#bible") { pendingV = v || 0; location.hash = "bible"; } else render({v: v||0});
  return true;
}
var pendingV = 0;
window.HCCBible = {go: go};

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
  if(a === "study" || a === "note"){ act.hidden = true; if(el) el.classList.add("sel"); openAt(cur.ed, cur.b, cur.c, cur.v, cur.txt); if(a === "note"){ var w = $(".vs-nt", sheet); if(w){ w.hidden = false; var ta = $("#vsNote", sheet); if(ta) ta.focus(); } } }
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
      out[i] = '<div class="vs-ed'+(e.id === c.ed ? " me" : "")+'" data-ed="'+e.id+'"><p><b>'+esc(e.short)+'</b> '+esc(e.trad)+(c2 !== c.c ? ' · Psalm '+c2 : "")+'</p><blockquote>'+(t ? fmt(t[1]) : '<span class="bib-gap">Not numbered the same way in this edition.</span>')+'</blockquote></div>';
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
function edFor(b){ if(ED[st.ed].idx[b] != null) return st.ed; return ED.web.idx[b] != null ? "web" : M.eds.filter(function(e){ return e.idx[b] != null; })[0].id; }
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

/* @@V14@@ */
/* ---------- route ---------- */
var rendered = false;
function onRoute(){
  var h = location.hash.slice(1);
  if(h.indexOf("bible~") === 0){ var p = h.split("~"); history.replaceState(null, "", "#home"); go(p[1], p[2], +p[3], +p[4]); return; }
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
  box.innerHTML = '<p class="shelf-h">Verse of the day</p><div class="vbody">'+body()+'</div><div class="qbtns"><button type="button" class="btn-sm" data-vv="read">Read the chapter</button><button type="button" class="btn-sm" data-vv="next">Another</button></div>';
  var last = get("hcc.bible.last", null);
  if(last) box.innerHTML += '<a class="more" href="#bible">Continue reading: '+esc(last.l)+' ('+esc(last.ed)+') →</a>';
  var q = $(".qotd", sh); sh.insertBefore(box, q ? q.nextSibling : sh.firstChild);
  box.addEventListener("click", function(e){
    var b = e.target.closest("[data-vv]"); if(!b) return;
    if(b.dataset.vv === "next"){ k = (k + 1 + Math.floor(Math.random()*(VOTD.length-1))) % VOTD.length; $(".vbody", box).innerHTML = body(); haptic("tick"); }
    if(b.dataset.vv === "read"){ var v = VOTD[k]; go(ED[st.ed].idx[v.b] != null ? st.ed : "web", v.b, v.c, v.v); }
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

/* ---------- widgets: tell the app what is being watched ---------- */
if(APP && APP.setProgress){
  addEventListener("hashchange", function(){ setTimeout(function(){
    var a = $("main article.active"); if(!a || !a.dataset.ep) return;
    try{ APP.setProgress(a.dataset.title || a.id, "Episode " + a.dataset.ep, a.id); }catch(e){}
  }, 200); });
}
})();
