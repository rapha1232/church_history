(function(){
"use strict";
/* How Christianity spread (#ref-spread). Data: data/SPREAD.json, [year, place, lat, lon, note, link, traditional?].
   The land outline is the shared #landR path, in the same projection as the Bible maps (geoXY). */
var D = window.__SPREAD__ || [], X = (window.__X__ || {}).people || {};
var $ = function(s,r){return (r||document).querySelector(s)};
var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]}); }
var mount = $("#spMount"); if(!mount || !D.length) return;
var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
function geoXY(lat, lon){ var k = Math.cos(40 * Math.PI / 180), s = 1000 / (74 * k); return [(lon + 12) * k * s, (60.5 - lat) * s]; }
/* #landW is a Mercator world map; this fit reproduces its coastlines (checked on Australia and Cape Horn) */
function worldXY(lat, lon){ return [2.759 * lon + 474.9, 293.2 - 159.4 * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360))]; }
function href(l){ if(!l) return ""; if(l.indexOf("p-") === 0) return X[l] ? "#" + X[l].link : ""; return "#" + l; }
var VIEWS = {med: {vb: [-20, -80, 1000, 940], r: 7, fs: 17, land: "landR", xy: geoXY}, world: {vb: [-28, 62, 1000, 420], r: 4.2, fs: 13, land: "landW", xy: worldXY}};
var MIN = 30, MAX = 2000, year = MIN, view = "auto", playing = false, raf = 0, last = 0;
var P = D.map(function(d, i){ return {i: i, y: d[0], n: d[1], lat: d[2], lon: d[3], note: d[4], link: d[5], trad: !!d[6]}; });

function curView(){ return view === "auto" ? (year < 1450 ? "med" : "world") : view; }
function build(){
  mount.innerHTML =
    '<div class="sp-top"><div class="sp-y" aria-live="off"><b id="spYear">30</b><span id="spCount"></span></div>' +
    '<div class="sp-views" role="group" aria-label="Map extent"><button type="button" class="chip" data-spv="auto" aria-pressed="true">Follow the story</button><button type="button" class="chip" data-spv="med" aria-pressed="false">Mediterranean</button><button type="button" class="chip" data-spv="world" aria-pressed="false">World</button></div></div>' +
    '<figure class="sp-map"><svg id="spSvg" role="img" aria-label="Map of the spread of Christianity"><use href="#landR" class="land" id="spLand"/><g id="spDots"></g></svg></figure>' +
    '<div class="sp-ctl"><button type="button" class="btn-sm pri" id="spPlay" aria-label="'+tr("Play")+'">▶ '+tr("Play")+'</button>' +
    '<label class="sp-range"><span class="vh">Year</span><input type="range" id="spR" min="'+MIN+'" max="'+MAX+'" step="1" value="'+year+'" aria-valuetext="AD '+year+'"></label></div>' +
    '<div class="sp-scale" aria-hidden="true"><span>30</span><span>500</span><span>1000</span><span>1500</span><span>2000</span></div>' +
    '<h3 class="sp-h">Most recent</h3><ol class="sp-list" id="spList"></ol>';
  $("#spDots").innerHTML = P.map(function(p){ return '<g class="sp-pt'+(p.trad ? " trad" : "")+'" data-i="'+p.i+'"><circle class="sp-ring"/><circle class="sp-dot"/><text class="sp-l"></text></g>'; }).join("");
  draw(true);
}
function draw(full){
  var v = VIEWS[curView()], svg = $("#spSvg");
  if(full || svg.dataset.v !== curView()){
    svg.setAttribute("viewBox", v.vb.join(" ")); svg.dataset.v = curView(); $("#spLand").setAttribute("href", "#" + v.land);
    svg.style.aspectRatio = v.vb[2] + "/" + v.vb[3];
    $$(".sp-pt", svg).forEach(function(g){ var d = $(".sp-dot", g), r = $(".sp-ring", g), t = $(".sp-l", g); d.setAttribute("r", v.r); r.setAttribute("r", v.r * 2.2); t.setAttribute("x", v.r * 1.5); t.setAttribute("y", -v.r * 0.9); t.style.fontSize = v.fs + "px"; var p = P[+g.dataset.i], xy = v.xy(p.lat, p.lon), right = xy[0] > v.vb[0] + v.vb[2] * 0.86; g.setAttribute("transform", "translate(" + xy[0].toFixed(1) + " " + xy[1].toFixed(1) + ")");
      t.textContent = p.n; t.setAttribute("text-anchor", right ? "end" : "start"); if(right) t.setAttribute("x", -v.r * 1.5); });
    svg.classList.toggle("wv", curView() === "world");
  }
  var shown = P.filter(function(p){ return p.y <= year; }), recent = shown.slice(-6).map(function(p){ return p.i; });
  $$(".sp-pt", svg).forEach(function(g){ var p = P[+g.dataset.i], on = p.y <= year;
    g.classList.toggle("on", on); g.classList.toggle("new", on && year - p.y < (year < 1000 ? 25 : 60)); g.classList.toggle("lab", recent.indexOf(p.i) >= 0); });
  $("#spYear").textContent = "AD " + year;
  $("#spCount").textContent = shown.length + " of " + P.length + " places";
  var r = $("#spR"); if(+r.value !== year){ r.value = year; } r.setAttribute("aria-valuetext", "AD " + year);
  $("#spList").innerHTML = shown.slice(-5).reverse().map(function(p){ var h = href(p.link);
    return '<li><b>'+p.y+(p.trad ? ' <small>tradition</small>' : "")+'</b><div><p class="sp-n">'+(h ? '<a href="'+h+'">'+esc(p.n)+'</a>' : esc(p.n))+'</p><p class="sp-note">'+esc(p.note)+'</p></div></li>'; }).join("") ||
    '<li class="sp-empty">Press play, or drag the year.</li>';
  $$("[data-spv]", mount).forEach(function(b){ b.setAttribute("aria-pressed", String(b.dataset.spv === view)); });
}
function speed(y){ return y < 120 ? 6 : y < 1100 ? 45 : 70; }
function tick(t){
  if(!playing) return;
  var dt = last ? Math.min(0.1, (t - last) / 1000) : 0; last = t;
  year = Math.min(MAX, year + Math.max(1, Math.round(speed(year) * dt)));
  draw(); if(year >= MAX) return stop();
  raf = requestAnimationFrame(tick);
}
function tr(x){ return window.HCCSettings && HCCSettings.t ? HCCSettings.t(x) : x; }
function play(){ if(year >= MAX) year = MIN; playing = true; last = 0; $("#spPlay").textContent = "❚❚ " + tr("Pause"); $("#spPlay").setAttribute("aria-label", tr("Pause")); raf = requestAnimationFrame(tick); }
function stop(){ playing = false; cancelAnimationFrame(raf); var b = $("#spPlay"); if(b){ b.textContent = "▶ " + tr("Play"); b.setAttribute("aria-label", tr("Play")); } }

mount.addEventListener("input", function(e){ if(e.target.id === "spR"){ stop(); year = +e.target.value; draw(); } });
mount.addEventListener("click", function(e){
  if(e.target.closest("#spPlay")){ playing ? stop() : play(); return; }
  var v = e.target.closest("[data-spv]"); if(v){ view = v.dataset.spv; draw(true); return; }
  var g = e.target.closest(".sp-pt.on"); if(g){ var p = P[+g.dataset.i], h = href(p.link); if(h) location.hash = h.slice(1); }
});
var drawn = false;
function route(){ if(location.hash === "#ref-spread"){ if(!drawn){ drawn = true; build(); } } else stop(); }
addEventListener("hashchange", function(){ setTimeout(route, 30); }); setTimeout(route, 60);
if(reduce) mount.classList.add("still");
})();
