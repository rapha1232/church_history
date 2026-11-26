(function(){
"use strict";
/* Edition 20: UX. Feedback with undo, back keeps your place, resume an episode, a useful empty search. */
var $ = function(s,r){return (r||document).querySelector(s)};
function get(k,d){ try{ var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } }
function put(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]}); }
function tr(s){ return window.HCCSettings && HCCSettings.t ? HCCSettings.t(s) : s; }

/* ---------- toast: short confirmation, optional action (Undo, View) ---------- */
var toast = document.createElement("div"); toast.className = "hcc-toast"; toast.setAttribute("role","status"); toast.setAttribute("aria-live","polite");
document.body.appendChild(toast);
var tT = 0;
function hide(){ toast.classList.remove("on"); }
window.HCCToast = function(msg, o){
  o = o || {}; clearTimeout(tT);
  toast.innerHTML = '<span>'+esc(tr(msg))+'</span>' + (o.action ? '<button type="button">'+esc(tr(o.action))+'</button>' : "");
  var b = $("button", toast); if(b) b.onclick = function(){ hide(); try{ o.run(); }catch(e){} };
  void toast.offsetWidth; toast.classList.add("on");
  tT = setTimeout(hide, o.ms || (o.action ? 5500 : 2600));
};
toast.addEventListener("pointerenter", function(){ clearTimeout(tT); });
toast.addEventListener("pointerleave", function(){ tT = setTimeout(hide, 1800); });
addEventListener("hashchange", function(){ setTimeout(hide, 0); });

/* bookmarks: say what happened and where to find it */
var mb = $("#markBtn");
if(mb) mb.addEventListener("click", function(){
  var on = mb.getAttribute("aria-pressed") === "true";
  HCCToast(on ? "Bookmarked" : "Bookmark removed", on ? {action: "View", run: function(){ location.hash = "library"; }} : {action: "Undo", run: function(){ mb.click(); }});
});

/* ---------- Back returns to where you were on the page ---------- */
var sT = 0, restoring = false;
function remember(){ try{ var st = history.state && typeof history.state === "object" ? history.state : {}; if(st.y !== scrollY){ st = Object.assign({}, st, {y: Math.round(scrollY)}); history.replaceState(st, ""); } }catch(e){} }
addEventListener("scroll", function(){ if(restoring) return; clearTimeout(sT); sT = setTimeout(remember, 160); }, {passive: true});
addEventListener("popstate", function(e){
  var y = e.state && e.state.y; if(!(y > 0)) return;
  restoring = true;
  /* the page re-renders on the hash change first; land after it, and once more after late layout */
  [60, 260, 600].forEach(function(t){ setTimeout(function(){ if(Math.abs(scrollY - y) > 4) scrollTo({top: y, behavior: "instant" in document.documentElement.style ? "instant" : "auto"}); }, t); });
  setTimeout(function(){ restoring = false; remember(); }, 700);
  window.__restored = Date.now();
});

/* ---------- reopen an episode where you stopped ---------- */
function offerResume(){
  var a = $("main article.active"); if(!a || !a.dataset.ep) return;
  if(window.__restored && Date.now() - window.__restored < 1500) return;
  var w = (get("hcc.watch", {}) || {})[a.id]; if(!w || !(w.y > 700) || !(w.p > 0.05) || w.p >= 0.95) return;
  var EP = window.__EP__ || {}, e = EP[a.id], left = e && e.m ? Math.max(1, Math.ceil(e.m * (1 - w.p))) : 0, id = a.id, y = w.y;
  setTimeout(function(){
    if(scrollY > 300 || !$("#" + id + ".active")) return;
    HCCToast(tr("Continue where you left off") + (left ? " · " + left + " " + tr("min left") : ""), {action: "Resume", ms: 7000, run: function(){ scrollTo({top: y, behavior: "smooth"}); }});
  }, 500);
}
addEventListener("hashchange", function(){ setTimeout(offerResume, 120); });
setTimeout(offerResume, 1600);

/* ---------- search: recent searches and good starting points before typing ---------- */
var q = $("#q"), res = $("#results");
if(q && res){
  var phone = matchMedia("(max-width: 760px)");
  function ph(){ q.placeholder = phone.matches ? "Search the history" : "Search people, councils, terms, or John 3:16…  ( / )"; }
  ph(); if(phone.addEventListener) phone.addEventListener("change", ph);
  var SUGGEST = ["Nicaea", "Augustine", "Great Schism", "Reformation", "Chalcedon", "Desert Fathers", "Icons", "Church of the East"];
  function recent(){ var r = get("hcc.recent", []); return Array.isArray(r) ? r : []; }
  function addRecent(v){ v = String(v || "").trim(); if(v.length < 2) return; var r = recent().filter(function(x){ return x.toLowerCase() !== v.toLowerCase(); }); r.unshift(v); put("hcc.recent", r.slice(0, 6)); }
  function start(){
    if(q.value.trim() || document.activeElement !== q) return;
    var r = recent();
    res.classList.remove("sx");
    res.innerHTML = '<div class="sx-start">' +
      (r.length ? '<p class="sx-sh shelf-h"><span>'+esc(tr("Recent"))+'</span><button type="button" data-sxclear="1">'+esc(tr("Clear"))+'</button></p><div class="sx-chips">' + r.map(function(x){ return '<button type="button" data-sxq="'+esc(x)+'">'+esc(x)+'</button>'; }).join("") + '</div>' : "") +
      '<p class="sx-sh shelf-h"><span>'+esc(tr("Try"))+'</span></p><div class="sx-chips">' + SUGGEST.filter(function(x){ return !r.some(function(y){ return y.toLowerCase() === x.toLowerCase(); }); }).map(function(x){ return '<button type="button" data-sxq="'+esc(x)+'">'+esc(x)+'</button>'; }).join("") + '</div></div>';
    res.hidden = false;
  }
  q.addEventListener("focus", function(){ setTimeout(start, 0); });
  q.addEventListener("input", function(){ if(!q.value.trim()) setTimeout(start, 0); });
  res.addEventListener("mousedown", function(e){ if(e.target.closest("[data-sxq],[data-sxclear]")) e.preventDefault(); });
  res.addEventListener("click", function(e){
    var c = e.target.closest("[data-sxclear]"); if(c){ put("hcc.recent", []); start(); return; }
    var b = e.target.closest("[data-sxq]"); if(b){ q.value = b.dataset.sxq; q.dispatchEvent(new Event("input")); q.focus(); return; }
    if(e.target.closest("a[href], [data-sx]")) addRecent(q.value);
  }, true);
  q.addEventListener("keydown", function(e){ if(e.key === "Enter") addRecent(q.value); });
}
})();