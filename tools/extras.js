(function(){
"use strict";
var X = window.__X__||{}, EP = window.__EP__||{}, IMG = window.__IMG__||{};
var $ = function(s,r){return (r||document).querySelector(s)};
var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
var APP = window.HCCApp || null;
function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]}); }
function active(){ return $("main article.active"); }
function haptic(k){ try{ if(APP && APP.haptic) APP.haptic(k||"tick"); else if(navigator.vibrate && k==="strong") navigator.vibrate(12); }catch(e){} }
window.__haptic = haptic;
function load(k,d){ try{ var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } }
function save(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function download(name, mime, text){
  if(APP && APP.saveFile){ try{ APP.saveFile(name, mime, text); return; }catch(e){} }
  if(window.claude && window.claude.use){
    window.claude.use("downloads").then(function(dl){
      if(dl) return dl.save({filename:name, data:text}).catch(function(err){ if(err && err.code !== "declined") alert("This file could not be saved here."); });
      blobSave(name, mime, text);
    }, function(){ blobSave(name, mime, text); });
    return;
  }
  blobSave(name, mime, text);
}
function blobSave(name, mime, text){
  var b = new Blob([text], {type:mime}), a = document.createElement("a");
  a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
var bar = 58;

/* ---------- haptics on primary actions ---------- */
document.addEventListener("click", function(e){ if(e.target.closest(".btn-play,.poster,.ep,.chip,.mplay,.cm")) haptic("tick"); }, true);

/* ---------- cast & biography sheet ---------- */
var bio = document.createElement("div"); bio.className = "bio"; bio.hidden = true; bio.setAttribute("role","dialog"); bio.setAttribute("aria-modal","true");
bio.innerHTML = '<div class="bio-card" tabindex="-1"></div>'; document.body.appendChild(bio);
var bioLast = null;
function openBio(pid, from){
  var p = (X.people||{})[pid]; if(!p) return; bioLast = from;
  var im = IMG[p.img], a = active(), sc = a ? getComputedStyle(a).getPropertyValue("--sc") : "";
  var eps = (p.ep||[]).filter(function(e){return EP[e];});
  $(".bio-card", bio).innerHTML = '<div class="bio-hd" style="--bsc:'+(sc||"#666")+'"><div class="bio-ph">'+(im?'<img src="'+im.src+'" alt="">':'')+'</div><div><h3>'+esc(p.name)+'</h3><p>'+esc(p.d)+'</p></div><button type="button" class="bio-x" aria-label="Close">✕</button></div>'+
    '<p class="bio-sum">'+esc(p.sum)+'</p>'+
    (eps.length?'<div class="bio-eps"><h4>Appears in '+eps.length+' episode'+(eps.length>1?'s':'')+'</h4>'+eps.map(function(e){ return '<a href="#'+e+'" data-bio-close><b>'+esc(EP[e].g)+'</b><span>'+esc(EP[e].t)+'</span></a>'; }).join("")+'</div>':'')+
    (p.link?'<a class="bio-more" href="#'+p.link+'" data-bio-close>Read more →</a>':'')+'<a class="bio-more" href="#ref-people" data-bio-close>All people</a>';
  bio.hidden = false; requestAnimationFrame(function(){ bio.classList.add("on"); }); $(".bio-x", bio).focus(); haptic("tick");
}
function closeBio(){ bio.classList.remove("on"); setTimeout(function(){ bio.hidden = true; }, reduce?0:250); if(bioLast && bioLast.focus) bioLast.focus({preventScroll:true}); }
document.addEventListener("click", function(e){
  var c = e.target.closest("[data-person]"); if(c){ openBio(c.dataset.person, c); return; }
  if(e.target === bio || e.target.closest(".bio-x")) { closeBio(); return; }
  if(e.target.closest("[data-bio-close]")) closeBio();
});
document.addEventListener("keydown", function(e){ if(e.key==="Escape" && !bio.hidden){ e.stopPropagation(); closeBio(); } }, true);

/* ---------- maps ---------- */
function setMap(m, v){
  var labels = JSON.parse(m.dataset.labels||"[]"), L = labels[v-1] || {}, yr = L.y;
  $$(".pin", m).forEach(function(p){ var e = +p.dataset.e, was = !p.classList.contains("off"); p.classList.toggle("off", e > v); p.classList.toggle("now", e === v);
    if(e === v && (!was || m._playing) && !reduce){ p.classList.remove("pop"); void p.getBBox(); p.classList.add("pop"); } });
  $$(".sp", m).forEach(function(c){ c.classList.toggle("off", yr == null || +c.dataset.y > yr); });
  declutter(m);
  $("output", m).textContent = (L.g||"") + (L.y!=null? " · c. "+(L.y<0? (-L.y)+" BC" : L.y) : "") + " — " + (L.t||"");
  $("input", m).value = v;
}
function declutter(svgRoot){
  var boxes = [];
  var ts = $$(".pin:not(.off)", svgRoot).sort(function(a,b){ return (b.classList.contains("now")-a.classList.contains("now")) || (b.classList.contains("big")-a.classList.contains("big")); });
  ts.forEach(function(p){ var t = $("text", p); if(!t) return; t.classList.remove("hide");
    if(!p.classList.contains("big") && !p.classList.contains("now")) return;
    var r; try{ r = t.getBBox(); }catch(e){ return; } var tr = p.transform.baseVal.consolidate(); var x = tr ? tr.matrix.e : 0, y = tr ? tr.matrix.f : 0;
    var b = {x:x+r.x-1, y:y+r.y-1, w:r.width+2, h:r.height+2};
    if(boxes.some(function(o){ return b.x < o.x+o.w && b.x+b.w > o.x && b.y < o.y+o.h && b.y+b.h > o.y; })) t.classList.add("hide"); else boxes.push(b);
  });
}
function initMaps(root){
  $$(".emap", root).forEach(function(m){ if(!m._init){ m._init = 1; declutter(m); } });
  $$(".smap", root).forEach(function(m){
    if(m._init) return; m._init = 1;
    var inp = $("input", m), btn = $(".mplay", m), n = +m.dataset.n;
    setMap(m, n);
    inp.addEventListener("input", function(){ stop(); setMap(m, +inp.value); });
    function stop(){ clearInterval(m._t); m._playing = false; btn.setAttribute("aria-pressed","false"); $("span",btn).textContent = "Play"; }
    btn.addEventListener("click", function(){
      if(m._playing){ stop(); return; }
      m._playing = true; btn.setAttribute("aria-pressed","true"); $("span",btn).textContent = "Pause";
      var v = 1; setMap(m, v);
      m._t = setInterval(function(){ v++; if(v > n){ stop(); return; } setMap(m, v); }, reduce ? 300 : 1400);
    });
  });
}

/* ---------- scene breaks reveal ---------- */
var sbio = ("IntersectionObserver" in window) ? new IntersectionObserver(function(es){ es.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add("in"); sbio.unobserve(en.target); } }); }, {rootMargin:"0px 0px -15% 0px"}) : null;

/* ---------- dates in the text: rail + chip ---------- */
var YR = /(?:\b(?:in|by|from|until|till|after|before|since|c\.|ca\.|AD|around|circa|of)\s+(?:the\s+(?:year\s+)?)?|\(|–|-|,\s)(\d{2,4})(?:\s*(BC|BCE|AD|CE))?(?=[\s.,;:)\]–-]|$)/g;
var Y_NOUN = /^(?:\s+(?:[A-Z]?[a-z]+\s+)?(?:bishops|books|years|people|km|members|percent|million|thousand|men|monks|copies|words|chapters|canons|signatories|delegates|churches|martyrs|servants|names|lines|letters|pages|soldiers|days|times|cities|dioceses|manuscripts|clergy|priests)\b|%|,\d|\.\d)/i;
var Y_PRE = /(?:chapter|ch\.|canons?|vol\.|pp?\.|no\.|Psalm|Genesis|Exodus|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Hebrews|Isaiah|article|art\.|session|book|letter|epistle|homily|sermon|§|number|figure|about|some|over|nearly|perhaps|roughly|approximately|least|than|DH|Novel|Gaius|Antiquities|Tanner)\W{0,3}$/i;
var Y_BIB = /(ANF|NPNF|Trans\.|Press|Oxford|Cambridge|Chicago|Princeton|Leiden|Turnhout|Wiesbaden|Brunswick|Harvard|Clarendon|Brepols|Zeitschrift|ed\.|eds\.|edition)/i;
var Y_SCHOLAR = /(?:[A-Z][a-z]+,\s*$|["”'’]\s*,?\s*\(?$|(?:thesis|research|category|model|construct|study|book|term)\W*\($|\s,\s*$)/;
function firstYear(t){
  YR.lastIndex = 0; var m;
  while((m = YR.exec(t))){
    var y = +m[1], era = m[2], ns = m.index + m[0].length - m[1].length - (era ? m[0].length - m[0].indexOf(m[1]) - m[1].length : 0);
    ns = t.indexOf(m[1], m.index);
    var pre = t.slice(Math.max(0, ns-30), ns), post = t.slice(YR.lastIndex, YR.lastIndex+26);
    if(Y_PRE.test(t.slice(Math.max(0, ns-18), ns).replace(/[( –-]+$/,""))) continue;
    if(Y_BIB.test(t.slice(Math.max(0, ns-40), ns))) continue;
    if(/\d[,.:]\s*\d*\s*[–-]?\s*$/.test(pre)) continue;
    if(y >= 1800 && (/[A-Z][a-zA-Zé'’]+\s*\($|[A-Z][a-z]+'s [A-Z][^()]{0,30}\($/.test(pre) || Y_SCHOLAR.test(pre))) continue;
    if(Y_NOUN.test(post)) continue;
    if(era && /^B/.test(era)) y = -y;
    if(y > 2026 || y === 0 || (y > 0 && y < 30 && !era)) continue;
    if(y > 0 && y < 100 && !era && !/^\s*[–-]\s*\d/.test(post) && !/(c\.|AD)\s*$/.test(pre)) continue;
    return y;
  }
  return null;
}
var trail = document.createElement("nav"); trail.className = "trail"; trail.setAttribute("aria-label","Dates in this episode"); trail.innerHTML = "<ol></ol>"; document.body.appendChild(trail);
var chip = document.createElement("div"); chip.className = "tchip"; chip.setAttribute("aria-hidden","true"); document.body.appendChild(chip);
var blocks = [], curY = null;
function fmtY(y){ return y < 0 ? (-y) + " BC" : String(y); }
function prepYears(a){
  blocks = [];
  if(!a || !a.dataset.ep){ trail.classList.remove("has"); return; }
  $$(":scope > p, :scope > ul, :scope > ol, :scope > blockquote, :scope > h3, :scope > .tablewrap, :scope > section.deeper", a).forEach(function(b){
    var c = b.cloneNode(true); $$("button,sup,cite", c).forEach(function(x){ x.remove(); });
    var y = firstYear(c.textContent.replace(/\s+/g," "));
    if(y === null) return;
    b.dataset.year = y; blocks.push(b);
  });
  var seen = {}, list = blocks.filter(function(b){ var y = b.dataset.year; if(seen[y]) return false; seen[y] = 1; return true; });
  if(list.length > 14){ var step = list.length / 14, l2 = []; for(var i=0;i<14;i++) l2.push(list[Math.floor(i*step)]); list = l2; }
  $("ol", trail).innerHTML = list.map(function(b){ return '<li data-y="'+b.dataset.year+'"><button type="button">'+fmtY(+b.dataset.year)+'</button></li>'; }).join("");
  trail._list = list;
  trail.classList.toggle("has", list.length >= 2);
  curY = null; chip.classList.remove("show");
}
trail.addEventListener("click", function(e){
  var li = e.target.closest("li"); if(!li) return; var k = $$("li", trail).indexOf(li), b = trail._list[k]; if(!b) return;
  scrollTo({top: b.getBoundingClientRect().top + scrollY - bar - 40, behavior: reduce?"auto":"smooth"}); haptic("tick");
});
function trackYear(){
  if(!blocks.length){ chip.classList.remove("show"); return; }
  var line = innerHeight * 0.4, y = null;
  for(var i=0;i<blocks.length;i++){ if(blocks[i].getBoundingClientRect().top < line) y = +blocks[i].dataset.year; else break; }
  var co = $("article.active .coldopen"), past = co ? co.getBoundingClientRect().bottom < 60 : true;
  chip.classList.toggle("show", y != null && past);
  if(y !== curY){
    curY = y;
    if(y != null){ chip.innerHTML = '<b class="flip">'+fmtY(y)+'</b>'+esc((active()||{}).dataset ? active().dataset.ep : ""); }
    $$("li", trail).forEach(function(li){ li.classList.toggle("on", y != null && +li.dataset.y === y); });
  }
}
var tk = false;
addEventListener("scroll", function(){ if(!tk){ tk = true; requestAnimationFrame(function(){ tk = false; trackYear(); }); } }, {passive:true});

/* ---------- compare creeds ---------- */
function toks(s){ return s.replace(/\s+/g," ").trim().split(" "); }
function norm(w){ return w.toLowerCase().replace(/[^a-z0-9]/g,""); }
function diff(a, b){
  var A = toks(a), B = toks(b), n = A.length, m = B.length, i, j, L = [];
  for(i=0;i<=n;i++){ L.push(new Uint16Array(m+1)); }
  for(i=n-1;i>=0;i--) for(j=m-1;j>=0;j--) L[i][j] = norm(A[i])===norm(B[j]) ? L[i+1][j+1]+1 : Math.max(L[i+1][j], L[i][j+1]);
  var out = []; i = 0; j = 0;
  while(i<n && j<m){ if(norm(A[i])===norm(B[j])){ out.push(["=",A[i],B[j]]); i++; j++; } else if(L[i+1][j] >= L[i][j+1]){ out.push(["-",A[i]]); i++; } else { out.push(["+",B[j]]); j++; } }
  while(i<n){ out.push(["-",A[i++]]); } while(j<m){ out.push(["+",B[j++]]); }
  return out;
}
var cmpKey = "n", cmpMode = "side";
function renderCmp(){
  var c = (X.creeds||{})[cmpKey], box = $("#cmp"); if(!c || !box) return;
  var d = diff(c.a[1], c.b[1]), k = 0;
  function w(s, tag){ k++; return (tag?'<'+tag+' class="w" style="--k:'+k+'">':'<span class="w" style="--k:'+k+'">')+esc(s)+(tag?'</'+tag+'>':'</span>')+' '; }
  $("#cmpNote").textContent = c.note;
  if(cmpMode === "side"){
    var L = d.filter(function(x){return x[0]!=="+";}).map(function(x){ return w(x[1], x[0]==="-"?"del":""); }).join("");
    k = 0;
    var R = d.filter(function(x){return x[0]!=="-";}).map(function(x){ return w(x[0]==="="?x[2]:x[1], x[0]==="+"?"ins":""); }).join("");
    box.className = "cmp"; box.innerHTML = '<section><h4>'+esc(c.a[0])+'</h4>'+L+'</section><section><h4>'+esc(c.b[0])+'</h4>'+R+'</section>';
  } else {
    box.className = "cmp merge"; box.innerHTML = '<section><h4>'+esc(c.a[0])+' → '+esc(c.b[0])+'</h4>'+d.map(function(x){ return w(x[0]==="="?x[2]:x[1], x[0]==="+"?"ins":x[0]==="-"?"del":""); }).join("")+'</section>';
  }
}
document.addEventListener("click", function(e){
  var t = e.target.closest(".cmp-tabs [data-c]"); if(t){ cmpKey = t.dataset.c; $$(".cmp-tabs [data-c]").forEach(function(x){ x.setAttribute("aria-selected", x===t?"true":"false"); }); renderCmp(); return; }
  var m = e.target.closest(".cmp-mode [data-m]"); if(m){ cmpMode = m.dataset.m; $$(".cmp-mode [data-m]").forEach(function(x){ x.setAttribute("aria-pressed", x===m?"true":"false"); }); renderCmp(); return; }
  var g = e.target.closest("[data-cmpgo]"); if(g){ cmpKey = g.dataset.cmpgo; var rc = $("#rclose"); if(rc) rc.click(); setTimeout(function(){ location.hash = "ref-compare"; }, 50); }
});
var DOCCMP = {nicaea325:"n", nicene:"f", "old-roman":"a", apostles:"a"};
document.addEventListener("click", function(e){
  var b = e.target.closest("[data-doc]"); if(!b) return;
  setTimeout(function(){
    var head = $(".rhead .rt"), old = $(".rd-cmp"); if(old) old.remove();
    var k = DOCCMP[b.dataset.doc]; if(!k || !head) return;
    var a = document.createElement("button"); a.type = "button"; a.className = "btn-sm rd-cmp"; a.dataset.cmpgo = k; a.textContent = "Compare with another creed";
    a.style.marginTop = "8px"; head.appendChild(a);
  }, 30);
});

/* ---------- highlights & notes ---------- */
var NK = "hcc.notes", NOTES = load(NK, []);
var tool = document.createElement("div"); tool.className = "seltool"; tool.hidden = true; tool.setAttribute("role","toolbar"); tool.setAttribute("aria-label","Highlight");
tool.innerHTML = '<button type="button" class="sw" data-hc="y" style="background:#f3d36b" aria-label="Yellow highlight"></button><button type="button" class="sw" data-hc="g" style="background:#7fd18c" aria-label="Green highlight"></button><button type="button" class="sw" data-hc="b" style="background:#86b6f2" aria-label="Blue highlight"></button><button type="button" class="sw" data-hc="p" style="background:#f29ac4" aria-label="Pink highlight"></button><button type="button" data-act="note">✎ Note</button><button type="button" data-act="copy">Copy</button>';
document.body.appendChild(tool);
var pop = document.createElement("div"); pop.className = "notepop"; pop.hidden = true;
pop.innerHTML = '<textarea aria-label="Note"></textarea><div class="row2"><button type="button" class="btn-sm dang" data-np="del">Remove highlight</button><span><button type="button" class="btn-sm" data-np="cancel">Close</button> <button type="button" class="btn-sm pri" data-np="save">Save</button></span></div>';
document.body.appendChild(pop);
var selInfo = null, popNote = null;
function textNodes(root){ var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode:function(n){ return n.parentNode.closest("header,figure,button,.cast,.smap,.emap,.upnext,.pager,script,style,.notes") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }}), a = []; while(w.nextNode()) a.push(w.currentNode); return a; }
function captureSel(){
  var s = getSelection(); if(!s || s.isCollapsed || !s.rangeCount) return null;
  var r = s.getRangeAt(0), a = r.commonAncestorContainer; a = a.nodeType===1 ? a : a.parentNode;
  var art = a.closest && a.closest("main article"); if(!art || a.closest("header,.cast,.smap,.emap,.upnext,figure,button")) return null;
  var txt = s.toString().replace(/\s+/g," ").trim(); if(txt.length < 3 || txt.length > 1200) return null;
  var full = textNodes(art).map(function(n){return n.nodeValue;}).join("").replace(/\s+/g," ");
  var pre = document.createRange(); pre.setStart(art, 0); pre.setEnd(r.startContainer, r.startOffset);
  var before = pre.toString().replace(/\s+/g," "), idx = full.indexOf(txt, Math.max(0, before.length - 40));
  return {art: art.id, text: txt, at: idx, rect: r.getBoundingClientRect()};
}
function showTool(){
  var c = captureSel(); selInfo = c; if(!c){ tool.hidden = true; return; }
  tool.hidden = false; tool.style.left = Math.min(innerWidth-120, Math.max(120, c.rect.left + c.rect.width/2)) + scrollX + "px"; tool.style.top = c.rect.top + scrollY + "px";
}
document.addEventListener("mouseup", function(e){ if(e.target.closest(".seltool,.notepop")) return; setTimeout(showTool, 10); });
document.addEventListener("selectionchange", function(){ clearTimeout(tool._t); tool._t = setTimeout(function(){ if(!("ontouchstart" in window)) return; showTool(); }, 350); });
document.addEventListener("mousedown", function(e){ if(!e.target.closest(".seltool")) tool.hidden = true; if(!e.target.closest(".notepop,mark.hl")) pop.hidden = true; });
function wrapRange(art, n){
  var nodes = textNodes(art), pos = 0, norm = [], map = [];
  nodes.forEach(function(nd){ var v = nd.nodeValue; for(var i=0;i<v.length;i++){ var ch = /\s/.test(v[i]) ? " " : v[i]; if(ch===" " && norm.length && norm[norm.length-1]===" ") continue; norm.push(ch); map.push([nd,i]); } });
  var hay = norm.join(""), at = hay.indexOf(n.text, Math.max(0,(n.at||0)-200)); if(at < 0) at = hay.indexOf(n.text); if(at < 0) return false;
  var end = at + n.text.length - 1, s = map[at], e = map[end];
  var groups = [], cur = null;
  for(var k=at;k<=end;k++){ var m = map[k]; if(!cur || cur.node !== m[0]){ cur = {node:m[0], s:m[1], e:m[1]}; groups.push(cur); } else cur.e = m[1]; }
  groups.forEach(function(g){
    var nd = g.node; if(!nd.parentNode) return;
    var r = document.createRange(); r.setStart(nd, g.s); r.setEnd(nd, g.e+1);
    var mk = document.createElement("mark"); mk.className = "hl" + (n.note ? " note" : ""); mk.dataset.c = n.c; mk.dataset.nid = n.id;
    try{ r.surroundContents(mk); }catch(err){}
  });
  return true;
}
function unwrap(id){ $$('mark.hl[data-nid="'+id+'"]').forEach(function(m){ var p = m.parentNode; while(m.firstChild) p.insertBefore(m.firstChild, m); p.removeChild(m); p.normalize(); }); }
function paintNotes(a){ if(!a || a._hl) return; a._hl = 1; NOTES.filter(function(n){ return n.art === a.id; }).forEach(function(n){ wrapRange(a, n); }); }
function addNote(c, note){
  var n = {id: "n"+Date.now().toString(36)+Math.random().toString(36).slice(2,5), art: selInfo.art, text: selInfo.text, at: selInfo.at, c: c, note: note||"", t: Date.now()};
  NOTES.push(n); save(NK, NOTES); var a = document.getElementById(n.art); getSelection().removeAllRanges(); wrapRange(a, n); tool.hidden = true; haptic("strong"); return n;
}
tool.addEventListener("click", function(e){
  var b = e.target.closest("button"); if(!b || !selInfo) return;
  if(b.dataset.hc){ addNote(b.dataset.hc); return; }
  if(b.dataset.act === "copy"){ try{ navigator.clipboard.writeText(selInfo.text); }catch(err){} tool.hidden = true; return; }
  if(b.dataset.act === "note"){ var r = selInfo.rect, n = addNote("y"); openPop(n, r); }
});
function openPop(n, r){
  popNote = n; $("textarea", pop).value = n.note || ""; pop.hidden = false;
  pop.style.left = Math.min(innerWidth-170, Math.max(170, r.left + r.width/2)) + scrollX + "px"; pop.style.top = r.bottom + scrollY + 10 + "px"; $("textarea", pop).focus();
}
document.addEventListener("click", function(e){ var m = e.target.closest("mark.hl"); if(!m || getSelection().toString()) return; var n = NOTES.filter(function(x){return x.id===m.dataset.nid;})[0]; if(n) openPop(n, m.getBoundingClientRect()); });
pop.addEventListener("click", function(e){
  var b = e.target.closest("[data-np]"); if(!b || !popNote) return;
  if(b.dataset.np === "save"){ popNote.note = $("textarea", pop).value.trim(); save(NK, NOTES); $$('mark.hl[data-nid="'+popNote.id+'"]').forEach(function(m){ m.classList.toggle("note", !!popNote.note); }); }
  if(b.dataset.np === "del"){ unwrap(popNote.id); NOTES = NOTES.filter(function(x){return x.id!==popNote.id;}); save(NK, NOTES); }
  pop.hidden = true; renderNotebook();
});
function title(id){ var a = document.getElementById(id); return a ? a.dataset.title : id; }
function renderNotebook(){
  var box = $("#nbList"); if(!box) return;
  if(!NOTES.length){ box.innerHTML = '<div class="nb-empty">No highlights yet. Open any episode, select a sentence, and choose a colour or ✎ Note.</div>'; return; }
  var by = {}, order = [];
  NOTES.slice().sort(function(a,b){return a.t-b.t;}).forEach(function(n){ if(!by[n.art]){ by[n.art] = []; order.push(n.art); } by[n.art].push(n); });
  box.innerHTML = order.map(function(id){
    return '<section class="nb-ep"><h3><a href="#'+id+'"><small>'+esc(EP[id]?EP[id].g:"")+'</small>'+esc(title(id))+'</a></h3>'+by[id].map(function(n){
      return '<div class="nb-item" data-c="'+n.c+'"><q>'+esc(n.text)+'</q>'+(n.note?'<p>'+esc(n.note)+'</p>':'')+'<div class="nb-a"><a href="#'+id+'" data-goto="'+n.id+'">Open</a><button type="button" data-nbdel="'+n.id+'">Delete</button></div></div>'; }).join("")+'</section>';
  }).join("");
}
function toMD(){
  var by = {}; NOTES.forEach(function(n){ (by[n.art] = by[n.art]||[]).push(n); });
  return "# My notebook — History of the Christian Church\n\nExported " + new Date().toLocaleString() + "\n\n" + Object.keys(by).map(function(id){
    return "## " + (EP[id]?EP[id].g+" — ":"") + title(id) + "\n\n" + by[id].map(function(n){ return "> " + n.text + (n.note ? "\n\n" + n.note : ""); }).join("\n\n") + "\n";
  }).join("\n");
}
document.addEventListener("click", function(e){
  var d = e.target.closest("[data-nbdel]"); if(d){ unwrap(d.dataset.nbdel); NOTES = NOTES.filter(function(x){return x.id!==d.dataset.nbdel;}); save(NK, NOTES); renderNotebook(); return; }
  var x = e.target.closest("[data-nb]"); if(!x) return;
  if(x.dataset.nb === "md") download("church-history-notebook.md", "text/markdown", toMD());
  if(x.dataset.nb === "json") download("church-history-notebook.json", "application/json", JSON.stringify({v:1, notes:NOTES, watch:load("hcc.watch",{})}, null, 1));
});
document.addEventListener("change", function(e){
  if(e.target.id !== "nbImport" || !e.target.files[0]) return;
  var fr = new FileReader(); fr.onload = function(){ try{ var d = JSON.parse(fr.result), have = {}; NOTES.forEach(function(n){ have[n.id] = 1; });
    (d.notes||[]).forEach(function(n){ if(n && n.id && !have[n.id]) NOTES.push(n); }); save(NK, NOTES); $$("main article").forEach(function(a){ a._hl = 0; }); renderNotebook(); }catch(err){ alert("That file is not a notebook backup."); } };
  fr.readAsText(e.target.files[0]);
});
document.addEventListener("click", function(e){ var g = e.target.closest("[data-goto]"); if(!g) return; var id = g.dataset.goto; setTimeout(function(){ var m = $('mark.hl[data-nid="'+id+'"]'); if(m) m.scrollIntoView({block:"center"}); }, 450); });

/* ---------- quote of the day ---------- */
var Q = X.quotes || [];
function dayIndex(){ var d = new Date(), a = Date.UTC(2026,0,1), b = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); return ((Math.floor((b-a)/864e5) % Q.length) + Q.length) % Q.length; }
function qhtml(q){ return '<blockquote>'+esc(q.q)+'</blockquote><p class="qa"><b>'+esc(q.a)+'</b>'+(q.d?' ('+esc(q.d)+')':'')+' · <i>'+esc(q.w)+'</i>'+(q.c?', '+esc(q.c):'')+'<br><small>'+esc(q.s)+' (public domain)</small></p>'; }
function mountQuote(){
  var sh = $(".shelves"); if(!sh || $(".qotd") || !Q.length) return;
  var k = dayIndex(), box = document.createElement("section"); box.className = "qotd"; box.setAttribute("aria-label","Quote of the day");
  box.innerHTML = '<p class="shelf-h">Quote of the day</p><div class="qbody">'+qhtml(Q[k])+'</div><div class="qbtns"><button type="button" class="btn-sm" data-q="next">Another</button><button type="button" class="btn-sm" data-q="copy">Copy</button></div>' + (APP ? appSettings() : "");
  sh.insertBefore(box, sh.firstChild);
  box.addEventListener("click", function(e){
    var b = e.target.closest("[data-q]"); if(!b) return;
    if(b.dataset.q === "next"){ box.classList.add("swap"); setTimeout(function(){ k = Math.floor(Math.random()*Q.length); $(".qbody", box).innerHTML = qhtml(Q[k]); box.classList.remove("swap"); }, reduce?0:300); haptic("tick"); }
    if(b.dataset.q === "copy"){ var q = Q[k]; try{ navigator.clipboard.writeText("“"+q.q+"” — "+q.a+", "+q.w+(q.c?", "+q.c:"")); b.textContent = "Copied"; setTimeout(function(){ b.textContent = "Copy"; }, 1500); }catch(err){} }
  });
  if(APP) wireSettings(box);
}
function appSettings(){
  return '<div class="setrow"><label for="qdOn">Daily quote notification</label><input type="checkbox" class="switch" id="qdOn"></div><div class="setrow"><label for="qdAt">Time</label><input type="time" id="qdAt" value="08:00"></div>'+
         '<p style="font:12.5px/1.5 var(--font-ui);color:var(--muted);margin:6px 0 0">Widgets for the home screen and lock screen: Today, Quote of the day, Verse of the day, On this day, Continue reading and Today’s reading, each with its own theme and text size.</p>';
}
function wireSettings(box){
  var on = $("#qdOn", box), at = $("#qdAt", box);
  try{ var s = JSON.parse(APP.getDaily()||"{}"); on.checked = !!s.on; if(s.h!=null) at.value = ("0"+s.h).slice(-2)+":"+("0"+s.m).slice(-2); }catch(e){}
  function push(){ var p = at.value.split(":"); try{ APP.setDaily(on.checked, +p[0]||8, +p[1]||0); }catch(e){} haptic("tick"); }
  on.addEventListener("change", push); at.addEventListener("change", push);
}

/* ---------- swipe between episodes (touch) ---------- */
var sx = null, sy = 0, st0 = 0;
document.addEventListener("touchstart", function(e){
  var a = active(); if(!a || !a.dataset.ep || e.touches.length !== 1 || !$("#lb").hidden || document.body.classList.contains("reading")) { sx = null; return; }
  if(e.target.closest(".row,.cast-row,.strip,.smap,.emap,.tablewrap,table,input,textarea,.seltool,.notepop,.schips,.bb-slides,.co-act,.sbreak")){ sx = null; return; }
  sx = e.touches[0].clientX; sy = e.touches[0].clientY; st0 = Date.now();
}, {passive:true});
document.addEventListener("touchend", function(e){
  if(sx === null) return; var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy; sx = null;
  if(Date.now() - st0 > 700 || Math.abs(dx) < 90 || Math.abs(dy) > 45 || (getSelection()+"").length) return;
  var o = X.order||[], a = active(), i = o.indexOf(a.id); if(i < 0) return;
  var to = o[i + (dx < 0 ? 1 : -1)]; if(!to) return;
  haptic("strong"); location.hash = to;
  setTimeout(function(){ var b = active(); if(b && !reduce){ b.classList.remove("swipe-l","swipe-r"); void b.offsetWidth; b.classList.add(dx < 0 ? "swipe-l" : "swipe-r"); } }, 0);
}, {passive:true});

/* ---------- app splash ---------- */
if(APP && !sessionStorage.getItem("hcc.splash")){
  try{ sessionStorage.setItem("hcc.splash","1"); }catch(e){}
  var sp = document.createElement("div"); sp.className = "splash";
  sp.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 12 V88 M50 12 h12 a14 14 0 0 1 0 28 h-12"/><path d="M28 34 L72 74 M72 34 L28 74"/></svg><p>The History of the Christian Church</p>';
  document.body.appendChild(sp); setTimeout(function(){ sp.classList.add("done"); setTimeout(function(){ sp.remove(); }, 700); }, reduce ? 300 : 1900);
}

/* ---------- route hook ---------- */
function onRoute(){
  var a = active(); if(!a) return;
  initMaps(a); paintNotes(a);
  if(sbio) $$(".sbreak", a).forEach(function(f){ if(!f._o){ f._o = 1; sbio.observe(f); } });
  prepYears(a); trackYear();
  if(a.id === "home") mountQuote();
  if(a.id === "ref-compare") renderCmp();
  if(a.id === "ref-notebook") renderNotebook();
  if(a.id === "ref-compare"){ $$(".cmp-tabs [data-c]").forEach(function(x){ x.setAttribute("aria-selected", x.dataset.c===cmpKey?"true":"false"); }); }
}
addEventListener("hashchange", function(){ setTimeout(onRoute, 20); });
setTimeout(onRoute, 80);
})();
