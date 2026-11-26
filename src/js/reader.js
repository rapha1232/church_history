(function(){
"use strict";
var $ = function(s,r){return (r||document).querySelector(s)};
var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var st = {get:function(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}, set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

/* ---------- Full-text reader ---------- */
var reader = $("#reader"), rbody = $("#rbody"), rtoc = $("#rtoc"), lastFocus = null;
var scale = st.get("hcc-rscale", 1);
function applyScale(){ rbody.style.setProperty("--rscale", scale); }
applyScale();
function openDoc(id){
  var src = document.getElementById("text-"+id); if(!src) return;
  lastFocus = document.activeElement;
  $("#rfam").textContent = src.dataset.fam;
  $("#rtitle").textContent = src.dataset.title;
  $("#rdate").textContent = src.dataset.date + " · " + src.dataset.words + " words";
  var intro = $(".docintro", src).cloneNode(true); intro.className = "rintro";
  var ctx = src.dataset.ctx ? src.dataset.ctx.split(",") : [];
  if(ctx.length){
    var p = document.createElement("p"); p.className="src";
    p.innerHTML = "Read about it: " + ctx.map(function(c){ var a=document.getElementById(c); return '<a href="#'+c+'" data-close>'+(a?a.dataset.title:c)+'</a>'; }).join(" · ");
    intro.appendChild(p);
  }
  var body = $(".docbody", src).cloneNode(true); body.className = "dtext";
  $$("[id]", body).forEach(function(h){ h.id = "r" + h.id; });
  rbody.innerHTML = ""; rbody.appendChild(intro); rbody.appendChild(body);
  var ir = src.dataset.imgRef, IM = window.__IMG__ || {};
  if(ir && IM[ir]){ var bn = document.createElement("button"); bn.type="button"; bn.className="rbanner ph-wrap"; bn.dataset.img = ir; bn.style.background = IM[ir].c; bn.setAttribute("aria-label","Enlarge: "+IM[ir].t);
    bn.innerHTML = '<img class="ok" src="'+IM[ir].src+'" alt="">'; rbody.insertBefore(bn, rbody.firstChild); }
  var hs = $$("h4.dh", body);
  rtoc.innerHTML = hs.map(function(h){ return '<a href="#" data-to="'+h.id+'">'+h.textContent.replace(/</g,"&lt;")+'</a>'; }).join("");
  rtoc.hidden = true; $("#rtocBtn").hidden = hs.length < 3; $("#rtocBtn").setAttribute("aria-expanded","false");
  reader.hidden = false; document.body.classList.add("reading");
  rbody.scrollTop = 0; $("#rclose").focus();
  st.set("hcc-lastdoc", id);
}
function closeDoc(){ if(reader.hidden) return; reader.hidden = true; if($("#lb").hidden) document.body.classList.remove("reading"); if(lastFocus && lastFocus.focus) lastFocus.focus({preventScroll:true}); }
document.addEventListener("click", function(e){
  var b = e.target.closest("[data-doc]");
  if(b){ e.preventDefault(); openDoc(b.dataset.doc); return; }
  if(e.target.closest("#rclose") || e.target.classList.contains("rscrim")){ closeDoc(); return; }
  var c = e.target.closest("[data-close]"); if(c && reader.contains(c)){ closeDoc(); return; }
  var t = e.target.closest("[data-to]");
  if(t){ e.preventDefault(); var h=document.getElementById(t.dataset.to); if(h){ rbody.scrollTop = h.offsetTop - 12; } rtoc.hidden = true; $("#rtocBtn").setAttribute("aria-expanded","false"); }
});
$("#rtocBtn").addEventListener("click", function(){ rtoc.hidden = !rtoc.hidden; this.setAttribute("aria-expanded", rtoc.hidden?"false":"true"); });
$("#rsmall").addEventListener("click", function(){ scale = Math.max(.8, +(scale-.1).toFixed(2)); applyScale(); st.set("hcc-rscale",scale); });
$("#rbig").addEventListener("click", function(){ scale = Math.min(1.6, +(scale+.1).toFixed(2)); applyScale(); st.set("hcc-rscale",scale); });
document.addEventListener("keydown", function(e){ if(e.key==="Escape" && !reader.hidden){ e.stopPropagation(); closeDoc(); } }, true);

/* ---------- Library filters ---------- */
var lib = $("#textlib");
if(lib){
  var fam = "all", q = $("#libq");
  function filt(){
    var s = (q.value||"").toLowerCase().trim();
    $$("details.doctext", lib).forEach(function(d){
      var ok = (fam==="all" || d.dataset.fam===fam) && (!s || d.dataset.title.toLowerCase().indexOf(s)>=0 || d.textContent.toLowerCase().indexOf(s)>=0);
      d.hidden = !ok;
    });
  }
  $("#libchips").addEventListener("click", function(e){
    var b = e.target.closest(".chip"); if(!b) return;
    $$("#libchips .chip").forEach(function(x){ x.setAttribute("aria-pressed", x===b?"true":"false"); });
    fam = b.dataset.v; filt();
  });
  q.addEventListener("input", filt);
}

/* ---------- Open a <details> that is the target of a link ---------- */
function openTarget(){
  var h = location.hash.slice(1); try{ h = decodeURIComponent(h); }catch(e){} if(!h) return;
  var el = document.getElementById(h);
  if(el && el.tagName==="DETAILS"){ el.open = true; setTimeout(function(){ el.scrollIntoView({block:"start"}); window.scrollBy(0,-80); }, 30); }
}
window.addEventListener("hashchange", function(){ closeDoc(); openTarget(); markTab(); });
setTimeout(openTarget, 60);

/* ---------- Bottom tab bar ---------- */
var tabbar = $(".tabbar");
function markTab(){
  if(!tabbar) return;
  var h = location.hash.slice(1);
  $$("button", tabbar).forEach(function(b){ b.setAttribute("aria-current", (b.dataset.tab==="texts" && (h==="ref-texts"||h.indexOf("text-")===0)) ? "true" : "false"); });
}
if(tabbar){
  tabbar.addEventListener("click", function(e){
    var b = e.target.closest("button"); if(!b) return;
    var t = b.dataset.tab;
    if(t==="contents"){ var tb=$('.navtabs [aria-controls="pane-toc"]'); if(tb) tb.click(); document.body.classList.toggle("navopen"); }
    else if(t==="search"){ document.body.classList.remove("navopen"); window.scrollTo(0,0); $("#q").focus(); }
    else if(t==="texts"){ document.body.classList.remove("navopen"); location.hash = "ref-texts"; }
    else if(t==="saved"){ var mb=$('.navtabs [aria-controls="pane-marks"]'); if(mb) mb.click(); document.body.classList.add("navopen"); }
  });
  markTab();
}
})();
