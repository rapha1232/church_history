(function(){
"use strict";
var EP = window.__EP__||{}, SE = window.__SEASONS__||[], IMG = window.__IMG__||{};
var $ = function(s,r){return (r||document).querySelector(s)};
var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
function esc(s){ return String(s||"").replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]}); }
var KEY = "hcc.watch", W = {};
try{ W = JSON.parse(localStorage.getItem(KEY)) || {}; }catch(e){ W = {}; }
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(W)); }catch(e){} }
function active(){ return $("main article.active"); }
function seasonOf(id){ for(var i=0;i<SE.length;i++) if(SE[i].e.indexOf(id)>=0) return SE[i]; return null; }
function absTop(el){ return el.getBoundingClientRect().top + scrollY; }

/* ---------- progress on cards and posters ---------- */
function paint(root){
  $$("[data-epid]", root).forEach(function(a){
    var p = (W[a.dataset.epid]||{}).p || 0;
    a.style.setProperty("--p", Math.round(p*100)+"%");
    a.classList.toggle("started", p>0.03); a.classList.toggle("done", p>=0.95);
  });
  $$(".poster[data-season]", root).forEach(function(a){
    var s = SE.filter(function(x){return x.id===a.dataset.season;})[0]; if(!s) return;
    var t = 0; s.e.forEach(function(id){ t += Math.min(1, (W[id]||{}).p || 0); });
    a.style.setProperty("--p", Math.round(t/s.e.length*100)+"%");
  });
}
function card(id, k, full){
  var e = EP[id]; if(!e) return ""; var im = IMG[e.i];
  var num = full ? e.g : e.g.replace(/^.*·\s*/, "");
  return '<a class="ep" href="#'+id+'" data-epid="'+id+'" style="--k:'+k+'">' +
    (im ? '<span class="th" style="background:'+im.c+'"><img src="'+im.src+'" alt="" loading="lazy" decoding="async">' : '<span class="th none">') +
    '<span class="epnum">'+esc(num)+'</span><span class="epplay" aria-hidden="true"></span></span>' +
    '<span class="epbody"><span class="epmeta">'+esc(full? (W[id]? Math.max(1,Math.ceil(e.m*(1-(W[id].p||0))))+' min left' : e.m+' min') : e.m+' min')+'</span>' +
    '<span class="eptitle">'+esc(e.t)+'</span><span class="epsyn">'+esc(e.y)+'</span></span><span class="epbar" aria-hidden="true"><i></i></span></a>';
}
function inProgress(){
  return Object.keys(W).filter(function(id){ return EP[id] && W[id].p>0.03 && W[id].p<0.95; })
    .sort(function(a,b){ return (W[b].t||0)-(W[a].t||0); });
}

/* ---------- home: shelves ---------- */
var shEps = $("#shEps");
function renderSeason(sid){
  var s = SE.filter(function(x){return x.id===sid;})[0]; if(!s || !shEps) return;
  $$(".schips .chip", shEps).forEach(function(c){ c.setAttribute("aria-selected", c.dataset.s===sid ? "true" : "false"); });
  var row = $(".eprow", shEps); row.innerHTML = s.e.map(function(id,k){ return card(id,k,false); }).join(""); row.scrollLeft = 0;
  paint(row);
}
if(shEps){
  shEps.addEventListener("click", function(e){
    var c = e.target.closest(".chip"); if(!c) return;
    renderSeason(c.dataset.s); c.scrollIntoView({block:"nearest", inline:"center", behavior: reduce?"auto":"smooth"});
  });
}
document.addEventListener("click", function(e){
  var b = e.target.closest("[data-sh]"); if(!b) return;
  var row = $(".row", b.closest(".shelf")); row.scrollBy({left: +b.dataset.sh * row.clientWidth * 0.85, behavior: reduce?"auto":"smooth"});
});
function renderHome(){
  var cont = $("#shCont"), ids = inProgress().slice(0,10);
  if(cont){ cont.hidden = !ids.length; $(".row", cont).innerHTML = ids.map(function(id,k){ return card(id,k,true); }).join(""); }
  var r = $("#bbResume");
  if(r){
    var last = ids[0];
    if(last){ var e = EP[last], im = IMG[e.i];
      r.innerHTML = (im?'<img src="'+im.src+'" alt="">':'') + '<span><small>Continue · '+esc(e.g)+'</small><b>'+esc(e.t)+'</b></span>';
      r.dataset.go = last; r.hidden = false;
    } else r.hidden = true;
  }
  if(shEps && !$(".eprow .ep", shEps)){
    var start = ids[0] && seasonOf(ids[0]); renderSeason((start || SE[0]).id);
  }
  paint(document);
}
var rs = $("#bbResume"); if(rs) rs.addEventListener("click", function(){ location.hash = rs.dataset.go; });

/* ---------- home: billboard carousel ---------- */
var bb = $(".billboard"), bbk = 0, bbt = 0, BBT = 8000;
function bbGo(k){
  var sl = $$(".bb-s", bb), im = $$(".bb-media img", bb), dots = $$(".bb-dots button", bb);
  if(!sl.length) return; k = (k + sl.length) % sl.length; bbk = k; bbt = 0;
  sl.forEach(function(s,i){ var on = i===k; s.classList.toggle("on", on); s.hidden = !on; });
  im.forEach(function(x,i){ x.classList.toggle("on", i===k); if(i===k+1 || (k===sl.length-1 && i===0)) x.loading = "eager"; });
  dots.forEach(function(d,i){ d.setAttribute("aria-selected", i===k ? "true" : "false"); });
}
if(bb){
  bb.style.setProperty("--bbt", BBT/1000+"s");
  $(".bb-dots", bb).addEventListener("click", function(e){ var d = e.target.closest("button"); if(d) bbGo(+d.dataset.k); });
  var paused = false;
  function setP(v){ paused = v; bb.classList.toggle("paused", v); }
  bb.addEventListener("mouseenter", function(){ setP(true); }); bb.addEventListener("mouseleave", function(){ setP(false); });
  bb.addEventListener("focusin", function(){ setP(true); }); bb.addEventListener("focusout", function(){ setP(false); });
  var sx = null;
  bb.addEventListener("touchstart", function(e){ sx = e.touches[0].clientX; }, {passive:true});
  bb.addEventListener("touchend", function(e){ if(sx===null) return; var dx = e.changedTouches[0].clientX - sx; if(Math.abs(dx)>50) bbGo(bbk + (dx<0?1:-1)); sx = null; });
  if(!reduce) setInterval(function(){
    if(paused || document.hidden || !bb.offsetParent) return;
    var r = bb.getBoundingClientRect(); if(r.bottom < 80) return;
    bbt += 200; if(bbt >= BBT) bbGo(bbk+1);
  }, 200);
  else bb.classList.add("paused");
}

/* ---------- season title sequence: cycling stills ---------- */
if(!reduce) setInterval(function(){
  var a = active(); if(!a || document.hidden) return;
  var s = $(".season .slides", a); if(!s) return;
  var im = $$("img", s); if(im.length<2) return;
  var k = im.findIndex(function(x){return x.classList.contains("on");});
  im[k].classList.remove("on"); var n = im[(k+1)%im.length]; n.loading = "eager"; n.classList.add("on");
}, 6500);

/* ---------- episodes: scenes, start, progress, pill, parallax ---------- */
var bar = $("#nowbar"), pill = $("#nowpill"), pillTxt = pill && $("span", pill), lastSave = 0, scrolled = false;
var sio = ("IntersectionObserver" in window && !reduce) ? new IntersectionObserver(function(es){
  es.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add("in"); en.target.classList.remove("pre"); sio.unobserve(en.target); } });
}, {rootMargin:"0px 0px -8% 0px"}) : null;
function prepEpisode(a){
  var n = 0;
  $$(":scope > h3", a).forEach(function(h){
    if(!h.dataset.scene){ n++; h.classList.add("scene"); h.dataset.scene = "Scene " + n; }
    if(sio && !h.dataset.sv){ h.dataset.sv = 1; if(h.getBoundingClientRect().top > innerHeight){ h.classList.add("pre"); sio.observe(h); } }
  });
}
document.addEventListener("click", function(e){
  var b = e.target.closest("[data-start]"); if(!b) return;
  var co = b.closest(".coldopen"), nx = co && co.nextElementSibling; if(!nx) return;
  scrollTo({top: absTop(nx) - 90, behavior: reduce?"auto":"smooth"});
});
if(pill) pill.addEventListener("click", function(){ var a = active(); if(a) scrollTo({top:0, behavior: reduce?"auto":"smooth"}); });
function measure(){
  var a = active(); var ep = a && a.dataset.ep;
  document.body.classList.toggle("in-ep", !!ep);
  if(!ep){ if(pill) pill.classList.remove("show"); return; }
  var co = $(".coldopen", a), un = $(".upnext", a);
  var start = co ? absTop(co) + co.offsetHeight : absTop(a), end = un ? absTop(un) : absTop(a) + a.offsetHeight;
  var p = Math.max(0, Math.min(1, (scrollY + innerHeight*0.35 - start) / Math.max(1, end - start - innerHeight*0.35)));
  if(scrollY + innerHeight >= document.documentElement.scrollHeight - 4) p = 1;
  bar.style.setProperty("--p", p.toFixed(4));
  var mins = +a.dataset.min || 1, left = Math.max(0, Math.ceil(mins*(1-p)));
  if(pill){
    var show = co ? co.getBoundingClientRect().bottom < 40 : scrollY > 300;
    pill.classList.toggle("show", show); pill.hidden = !show;
    pillTxt.innerHTML = '<b>'+esc(ep)+'</b>' + esc(a.dataset.title) + ' · ' + (p>=0.98 ? 'finished' : left + ' min left');
    pill.style.setProperty("--o", (94.25*(1-p)).toFixed(2));
    pill.setAttribute("aria-label", ep + ": " + a.dataset.title);
  }
  var id = a.id, w = W[id] || {p:0};
  if(scrolled && p > (w.p||0)){ w.p = p; }
  w.t = Date.now(); W[id] = w;
  if(Date.now() - lastSave > 1200){ lastSave = Date.now(); save(); }
  // parallax + fade of the cold open while it leaves
  if(co && !reduce){
    var r = co.getBoundingClientRect();
    if(r.bottom > 0){
      var y = Math.max(0, -r.top);
      var bg = $(".co-bg", co), inn = $(".co-in", co), pl = $(".co-plate", co);
      if(bg) bg.style.transform = "translate3d(0,"+(y*0.35).toFixed(1)+"px,0)";
      if(pl) pl.style.transform = "translate3d(0,"+(y*0.18).toFixed(1)+"px,0)";
      if(inn){ inn.style.opacity = Math.max(0, 1 - y/(r.height*0.75)).toFixed(3); inn.style.transform = "translate3d(0,"+(y*0.12).toFixed(1)+"px,0)"; }
    }
  }
}
var tick = false;
addEventListener("scroll", function(){ if(scrollY > 120) scrolled = true; if(!tick){ tick = true; requestAnimationFrame(function(){ tick = false; measure(); }); } }, {passive:true});
addEventListener("resize", function(){ measure(); });
addEventListener("pagehide", save);
document.addEventListener("visibilitychange", function(){ if(document.hidden) save(); });

/* ---------- up next with countdown ---------- */
var cd = null;
function stopCount(un, cancelled){
  if(cd){ clearInterval(cd.iv); cd = null; }
  if(!un) return;
  $(".un-count", un).hidden = true; $(".un-cancel", un).hidden = true;
  if(cancelled) un.dataset.cancel = "1";
}
function startCount(un){
  if(cd || reduce || un.dataset.cancel || !scrolled) return;
  var n = 10, c = $(".un-count", un), b = $("b", c), r = $(".r", c);
  c.hidden = false; $(".un-cancel", un).hidden = false; b.textContent = n; r.style.setProperty("--o", "0");
  cd = {un:un, iv:setInterval(function(){
    n--; b.textContent = Math.max(n,0); r.style.setProperty("--o", (100.5*(10-n)/10).toFixed(1));
    if(n <= 0){ stopCount(un); location.hash = un.dataset.next; }
  }, 1000)};
  r.style.setProperty("--o", (100.5*0/10).toFixed(1));
}
var uio = ("IntersectionObserver" in window) ? new IntersectionObserver(function(es){
  es.forEach(function(en){
    if(!en.target.closest("article.active")) return;
    if(en.intersectionRatio >= 0.8) startCount(en.target);
    else if(cd && cd.un === en.target && en.intersectionRatio < 0.4) stopCount(en.target);
  });
}, {threshold:[0, 0.4, 0.8, 1]}) : null;
if(uio) $$(".upnext").forEach(function(u){ uio.observe(u); });
document.addEventListener("click", function(e){ var c = e.target.closest(".un-cancel"); if(c) stopCount(c.closest(".upnext"), true); });

/* ---------- the cut between episodes ---------- */
var cut = $("#cut"), lastArt = active() && active().id;
function onRoute(){
  var a = active(); if(!a) return;
  if(a.id !== lastArt){
    if(cd) stopCount(cd.un);
    $$(".upnext[data-cancel]").forEach(function(u){ delete u.dataset.cancel; });
    scrolled = false;
    var label = a.dataset.ep || a.dataset.season;
    if(cut && label && lastArt && !reduce){
      $("span", cut).textContent = label;
      cut.classList.remove("go"); void cut.offsetWidth; cut.classList.add("go");
    }
    lastArt = a.id;
  }
  if(a.dataset.ep){ prepEpisode(a); if(!W[a.id]){ W[a.id] = {p:0, t:Date.now()}; save(); } }
  if(a.id === "home") renderHome(); else paint(a);
  measure();
}
addEventListener("hashchange", onRoute);
setTimeout(onRoute, 50);
})();
