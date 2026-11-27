(function(){
"use strict";
/* Edition 25 reference pages: sub-routes (#ref-succession~rome), the heresy filters, and the
   "Meanwhile in the world" strip on each episode (data/WORLD.json: [year, text, region]). */
var W = window.__WORLD__ || [];
var $ = function(s,r){return (r||document).querySelector(s)};
var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]}); }
function fy(y){ return y < 0 ? (-y) + " BC" : String(y); }

/* ---------- sub-routes: #page~key scrolls to #<data-sub>-key, and opens it if it is a <details> ---------- */
function sub(){
  var h = decodeURIComponent(location.hash.slice(1)), i = h.indexOf("~"); if(i < 0) return;
  var a = document.getElementById(h.slice(0, i)); if(!a || !a.dataset.sub) return;
  var el = document.getElementById(a.dataset.sub + "-" + h.slice(i+1)); if(!el) return;
  if(el.tagName === "DETAILS") el.open = true;
  setTimeout(function(){ el.scrollIntoView({block: "start"}); }, 120);
}
addEventListener("hashchange", function(){ setTimeout(sub, 60); setTimeout(sub, 500); }); setTimeout(sub, 300); setTimeout(sub, 1000);

/* ---------- heresies: filters ---------- */
var hx = $("#ref-heresies");
if(hx){
  var f = {th: "", era: "", live: false};
  var apply = function(){
    var n = 0, cards = $$(".hx", hx);
    cards.forEach(function(c){ var ok = (!f.th || c.dataset.th === f.th) && (!f.era || c.dataset.era === f.era) && (!f.live || c.dataset.live === "1"); c.hidden = !ok; if(ok) n++; });
    var out = $(".hx-count", hx); if(out) out.textContent = n === cards.length ? cards.length + " movements" : n + " of " + cards.length + " movements" + (n ? "" : ". Try fewer filters.");
  };
  hx.addEventListener("click", function(e){
    var b = e.target.closest("[data-hth],[data-hera],[data-hlive]"); if(!b) return;
    if(b.hasAttribute("data-hlive")){ f.live = !f.live; b.setAttribute("aria-pressed", String(f.live)); }
    else {
      var k = b.hasAttribute("data-hth") ? "th" : "era", v = b.getAttribute(k === "th" ? "data-hth" : "data-hera");
      f[k] = v; $$(k === "th" ? "[data-hth]" : "[data-hera]", hx).forEach(function(x){ x.setAttribute("aria-pressed", String(x === b)); });
    }
    apply();
  });
  apply();
}

/* ---------- in-page tabs (succession, buildings, icons): jump without leaving the page ---------- */
document.addEventListener("click", function(e){
  var a = e.target.closest("[data-sc],[data-gd]"), art = a && a.closest("article[data-sub]"); if(!art) return; e.preventDefault();
  history.replaceState(null, "", "#" + art.id + "~" + (a.dataset.sc || a.dataset.gd)); sub();
});

/* ---------- meanwhile in the world ---------- */
function strip(){
  var a = document.getElementById(location.hash.slice(1).split("~")[0]); if(!a || !a.dataset.ep || !W.length) return;
  var old = $(".mw", a); if(old) return;
  var ys = $$("[data-year]", a).map(function(b){ return +b.dataset.year; }).filter(function(y){ return !isNaN(y); }).sort(function(x, y){ return x - y; });
  if(ys.length < 2) return;
  var lo = ys[Math.floor(ys.length * 0.15)], hi = ys[Math.min(ys.length - 1, Math.floor(ys.length * 0.85))];
  if(hi - lo < 40){ var mid = (lo + hi) / 2; lo = Math.round(mid - 40); hi = Math.round(mid + 40); }
  var ev = W.filter(function(w){ return w[0] >= lo && w[0] <= hi; });
  if(!ev.length) return;
  if(ev.length > 5){ var step = (ev.length - 1) / 4, pick = []; for(var i = 0; i < 5; i++) pick.push(ev[Math.round(i * step)]); ev = pick; }
  var box = document.createElement("aside"); box.className = "mw"; box.setAttribute("aria-label", "Meanwhile in the world");
  box.innerHTML = '<p class="shelf-h mw-h"><span>Meanwhile in the world</span> · '+esc(fy(lo))+'–'+esc(fy(hi))+'</p><ol>' + ev.map(function(w){ return '<li><b>'+esc(fy(w[0]))+'</b><span>'+esc(w[1])+'</span><small>'+esc(w[2])+'</small></li>'; }).join("") + '</ol>';
  var at = $(":scope > .upnext", a) || $(":scope > section.notes", a) || $(":scope > .pager", a);
  if(at) a.insertBefore(box, at); else a.appendChild(box);
}
addEventListener("hashchange", function(){ setTimeout(strip, 400); }); setTimeout(strip, 900);
window.HCCWorld = {between: function(lo, hi){ return W.filter(function(w){ return w[0] >= lo && w[0] <= hi; }); }};
})();
