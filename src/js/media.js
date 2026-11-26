(function(){
"use strict";
var IMG = window.__IMG__ || {};
var $ = function(s,r){return (r||document).querySelector(s)};
var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
function esc(s){ return String(s||"").replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]}); }

/* ---------- Fade images in once loaded ---------- */
function arm(img){
  if(img.complete && img.naturalWidth) img.classList.add("ok");
  else { img.addEventListener("load", function(){ img.classList.add("ok"); }, {once:true});
         img.addEventListener("error", function(){ img.classList.add("ok"); }, {once:true}); }
}
$$(".ph-wrap img").forEach(arm);

/* ---------- Lightbox ---------- */
var lb = $("#lb"), stage = $("#lbStage"), lbimg = $("#lbImg"), group = [], idx = 0;
var zs = 1, tx = 0, ty = 0, lastFocus = null, hideT = 0;
function setT(){ lbimg.style.transform = "translate(-50%,-50%) translate("+tx+"px,"+ty+"px) scale("+zs+")"; stage.classList.toggle("zoomed", zs>1.01); }
function show(i, fromEl){
  idx = (i+group.length)%group.length; var id = group[idx], d = IMG[id]; if(!d) return;
  zs=1; tx=0; ty=0; setT();
  lbimg.src = d.src; lbimg.alt = d.alt || d.t;
  $("#lbCount").textContent = (idx+1) + " / " + group.length;
  $("#lbCap").innerHTML = '<h3>'+esc(d.t)+'</h3>' + (d.d?'<p>'+esc(d.d)+'</p>':'') +
    '<p class="lbcredit">'+esc(d.a||"Unknown author")+' · '+esc(d.l)+(d.u?' · <a href="'+esc(d.u)+'" rel="noopener">'+esc(d.sn||"Source")+'</a>':'') +
    (d.w?' · <a href="https://en.wikipedia.org/wiki/'+encodeURIComponent(d.w.replace(/ /g,"_"))+'" rel="noopener">Wikipedia</a>':'') + '</p>';
  var th = $("#lbThumbs");
  if(group.length>1){
    if(th.dataset.g !== group.join("|")){
      th.innerHTML = group.map(function(g,k){ return '<button type="button" data-k="'+k+'" aria-label="Image '+(k+1)+'"><img src="'+IMG[g].src+'" alt="" loading="lazy"></button>'; }).join("");
      th.dataset.g = group.join("|");
    }
    $$("button", th).forEach(function(b,k){ b.setAttribute("aria-current", k===idx?"true":"false"); if(k===idx) b.scrollIntoView({block:"nearest",inline:"center"}); });
    th.hidden = false;
  } else th.hidden = true;
  $("#lbPrev").hidden = $("#lbNext").hidden = group.length<2;
}
function open(id, el){
  var scope = el.closest("[data-gallery]") || el.closest("article") || document;
  group = $$("[data-img]", scope).filter(function(x){ return !x.closest(".gone") && !x.classList.contains("gone"); }).map(function(x){return x.dataset.img;});
  group = group.filter(function(g,k){ return IMG[g] && group.indexOf(g)===k; });
  if(group.indexOf(id)<0) group=[id];
  lastFocus = el; clearTimeout(hideT);
  lb.hidden = false; document.body.classList.add("reading");
  show(group.indexOf(id));
  var srcImg = $("img", el);
  if(srcImg && !reduce){
    var r = srcImg.getBoundingClientRect(), f = document.createElement("img");
    f.src = srcImg.src; f.className="flyer"; f.style.cssText="left:"+r.left+"px;top:"+r.top+"px;width:"+r.width+"px;height:"+r.height+"px";
    document.body.appendChild(f); lbimg.style.opacity = 0;
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      lb.classList.add("on");
      var sr = stage.getBoundingClientRect(), d = IMG[id], ar = (d.iw||4)/(d.ih||3);
      var w = Math.min(sr.width-24, (sr.height-12)*ar), h = w/ar;
      f.style.cssText="left:"+(sr.left+(sr.width-w)/2)+"px;top:"+(sr.top+(sr.height-h)/2)+"px;width:"+w+"px;height:"+h+"px;border-radius:2px";
      setTimeout(function(){ lbimg.style.opacity=1; f.remove(); }, 380);
    }); });
  } else { lb.classList.add("on"); }
  $("#lbClose").focus();
}
function close(){ lb.classList.remove("on"); clearTimeout(hideT); hideT = setTimeout(function(){ lb.hidden = true; }, reduce?0:250); var rd = $("#reader"); if(!rd || rd.hidden) document.body.classList.remove("reading"); if(lastFocus&&lastFocus.focus) lastFocus.focus({preventScroll:true}); }
document.addEventListener("click", function(e){
  var t = e.target.closest("[data-img]");
  if(t && !lb.contains(t)){ e.preventDefault(); open(t.dataset.img, t); return; }
  var k = e.target.closest("#lbThumbs button"); if(k){ show(+k.dataset.k); return; }
});
$("#lbClose").addEventListener("click", close);
$("#lbPrev").addEventListener("click", function(){ show(idx-1); });
$("#lbNext").addEventListener("click", function(){ show(idx+1); });
document.addEventListener("keydown", function(e){
  if(lb.hidden) return;
  if(e.key==="Escape"){ e.stopPropagation(); close(); }
  else if(e.key==="ArrowRight") show(idx+1);
  else if(e.key==="ArrowLeft") show(idx-1);
  else if(e.key==="+"||e.key==="="){ zs=Math.min(5,zs*1.4); setT(); }
  else if(e.key==="-"){ zs=Math.max(1,zs/1.4); if(zs===1){tx=ty=0;} setT(); }
}, true);
/* zoom & pan: wheel, double-click/tap, drag, pinch, swipe */
stage.addEventListener("wheel", function(e){ e.preventDefault(); zs = Math.min(5, Math.max(1, zs * (e.deltaY<0?1.15:1/1.15))); if(zs===1){tx=ty=0;} setT(); }, {passive:false});
stage.addEventListener("dblclick", function(e){ if(zs>1){zs=1;tx=ty=0;} else { zs=2.5; var r=stage.getBoundingClientRect(); tx=(r.width/2-(e.clientX-r.left))*1.5; ty=(r.height/2-(e.clientY-r.top))*1.5; } setT(); });
var pts = {}, start = null, pinch0 = null, lastTap = 0;
stage.addEventListener("pointerdown", function(e){
  if(e.target.closest("button")) return;
  stage.setPointerCapture(e.pointerId); pts[e.pointerId] = {x:e.clientX,y:e.clientY};
  var ids = Object.keys(pts);
  if(ids.length===1){ start = {x:e.clientX,y:e.clientY,tx:tx,ty:ty,t:Date.now()}; stage.classList.add("drag");
    var now=Date.now(); if(e.pointerType!=="mouse" && now-lastTap<300){ if(zs>1){zs=1;tx=ty=0;}else{zs=2.5;} setT(); start=null; } lastTap=now; }
  if(ids.length===2){ var a=pts[ids[0]],b=pts[ids[1]]; pinch0={d:Math.hypot(a.x-b.x,a.y-b.y),z:zs}; start=null; }
});
stage.addEventListener("pointermove", function(e){
  if(!pts[e.pointerId]) return; pts[e.pointerId]={x:e.clientX,y:e.clientY};
  var ids=Object.keys(pts);
  if(ids.length===2 && pinch0){ var a=pts[ids[0]],b=pts[ids[1]]; zs=Math.min(5,Math.max(1,pinch0.z*Math.hypot(a.x-b.x,a.y-b.y)/pinch0.d)); if(zs===1){tx=ty=0;} setT(); return; }
  if(start){ var dx=e.clientX-start.x, dy=e.clientY-start.y; if(zs>1){ tx=start.tx+dx; ty=start.ty+dy; } else { tx=dx; ty=dy*0.4; } setT(); }
});
function up(e){
  delete pts[e.pointerId]; stage.classList.remove("drag");
  if(Object.keys(pts).length<2) pinch0=null;
  if(start && zs<=1.01){ var dx=e.clientX-start.x, dy=e.clientY-start.y;
    if(Math.abs(dx)>60 && Math.abs(dx)>Math.abs(dy)) show(idx+(dx<0?1:-1));
    else if(dy>110) close();
    else { tx=ty=0; setT(); } }
  start=null;
}
stage.addEventListener("pointerup", up); stage.addEventListener("pointercancel", up);

/* ---------- Strip rails: arrow buttons ---------- */
document.addEventListener("click", function(e){
  var b = e.target.closest("[data-rail]"); if(!b) return;
  var row = b.closest(".rail,.strip").querySelector(".row"); row.scrollBy({left:(b.dataset.rail==="next"?1:-1)*row.clientWidth*0.8, behavior: reduce?"auto":"smooth"});
});

/* ---------- Image atlas filters ---------- */
var gal = $("#galchips");
if(gal){
  gal.addEventListener("click", function(e){
    var b = e.target.closest(".chip"); if(!b) return;
    $$(".chip", gal).forEach(function(x){ x.setAttribute("aria-pressed", x===b?"true":"false"); });
    var v = b.dataset.v, n = 0;
    $$("#masonry .tile").forEach(function(t){ var ok = v==="all" || t.dataset.cat===v; t.classList.toggle("gone", !ok); if(ok) n++; });
    $("#galcount").textContent = n + " images";
  });
}

/* ---------- Home mosaic: slow cross-fade through the collection ---------- */
var mos = $(".mosaic");
if(mos && !reduce){
  var pool = (mos.dataset.pool||"").split(",").filter(function(x){return IMG[x];}), p = 0, slot = 0;
  var cells = $$(".m", mos);
  setInterval(function(){
    if(document.hidden || !mos.offsetParent) return;
    var c = cells[slot % cells.length]; slot += 2;
    var next = pool[p++ % pool.length]; if(!next || $$(".m",mos).some(function(x){return x.dataset.img===next;})) return;
    var im = $("img", c); var pre = new Image(); pre.src = IMG[next].src;
    pre.onload = function(){ im.classList.add("out"); setTimeout(function(){ im.src = pre.src; c.dataset.img = next; $(".mcap",c).textContent = IMG[next].t; im.classList.remove("out"); }, 600); };
  }, 3200);
}

/* ---------- Hero parallax ---------- */
if(!reduce){
  var ticking = false;
  function par(){
    ticking = false;
    var h = $("article.active figure.hero .hero-media"); if(!h) return;
    var r = h.getBoundingClientRect(), vh = innerHeight;
    if(r.bottom<0||r.top>vh) return;
    var p = (r.top + r.height/2 - vh/2) / vh; h.querySelector("img").style.setProperty("--py", (p*-28).toFixed(1)+"px");
  }
  addEventListener("scroll", function(){ if(!ticking){ ticking=true; requestAnimationFrame(par); } }, {passive:true});
  setTimeout(par, 100);
}

/* ---------- Reveal on scroll (only for things that start off-screen) ---------- */
var io = ("IntersectionObserver" in window && !reduce) ? new IntersectionObserver(function(es){
  es.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add("rv-in"); en.target.classList.remove("rv-pre"); io.unobserve(en.target); } });
}, {rootMargin:"0px 0px -6% 0px"}) : null;
function prepReveal(root){
  if(!io) return;
  $$(".strip, .deeper, blockquote.src, .tile, .person, .era-card, details.doctext, .key, .cards .card", root).forEach(function(el){
    if(el.dataset.rv) return; el.dataset.rv = 1;
    var r = el.getBoundingClientRect();
    if(r.top > innerHeight*0.95){ el.classList.add("rv-pre"); io.observe(el); }
  });
}
function onRoute(){
  var a = $("article.active"); if(!a) return;
  if(!reduce){ a.classList.remove("enter"); void a.offsetWidth; a.classList.add("enter"); }
  setTimeout(function(){ prepReveal(a); $$(".ph-wrap img", a).forEach(arm); }, 60);
}
addEventListener("hashchange", function(){ setTimeout(onRoute, 0); });
setTimeout(onRoute, 120);
})();
