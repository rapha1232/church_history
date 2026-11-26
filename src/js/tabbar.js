(function(){
"use strict";
var $ = function(s,r){return (r||document).querySelector(s)};
var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var APP = window.HCCApp && window.HCCApp.isApp ? window.HCCApp : null;
function hap(){ try{ if(APP) APP.haptic("tick"); }catch(e){} }
function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]}); }
function get(k,d){ try{ var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } }
var phone = matchMedia("(max-width: 760px)");

/* ---------- tab bar ---------- */
var old = $(".tabbar");
if(old){
  var tb = document.createElement("nav"); tb.className = "tabbar tb2"; tb.setAttribute("aria-label", "App navigation");
  var I = {
    home: '<path d="M4 11l8-7 8 7"/><path d="M6 10v9h4.5v-5h3v5H18v-9"/>',
    bible: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19"/><path d="M12 6.5v7M9.5 9h5"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    library: '<path d="M4 5h4v14H4zM10 5h4v14h-4z"/><path d="M16.2 6.3l3.6-1 3 12.6-3.6 1z" transform="translate(-2 0)"/>',
    saved: '<path d="M7 4h10v16l-5-3.6L7 20z"/>'
  };
  tb.innerHTML = [["home","Home"],["bible","Bible"],["search","Search"],["library","Library"],["saved","Saved"]].map(function(t){
    return '<button type="button" data-t="'+t[0]+'" aria-current="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+I[t[0]]+'</svg><span>'+t[1]+'</span></button>'; }).join("");
  old.parentNode.replaceChild(tb, old);
  function mark(){
    var h = location.hash.slice(1) || "home", nav = document.body.classList.contains("navopen"), so = document.body.classList.contains("search-on");
    var on = so ? "search" : nav ? (navPane === "marks" ? "saved" : "library") : h === "home" ? "home" : h.indexOf("bible") === 0 ? "bible" : /^ref-|^method/.test(h) ? "library" : "";
    $$("button", tb).forEach(function(b){ b.setAttribute("aria-current", b.dataset.t === on ? "true" : "false"); });
  }
  var navPane = "toc";
  tb.addEventListener("click", function(e){
    var b = e.target.closest("button"); if(!b) return; var t = b.dataset.t, body = document.body; hap();
    if(t !== "search") body.classList.remove("search-on");
    if(t === "home"){ body.classList.remove("navopen"); if(location.hash === "#home") window.scrollTo({top: 0, behavior: "smooth"}); else location.hash = "home"; }
    else if(t === "bible"){ body.classList.remove("navopen"); if(location.hash !== "#bible") location.hash = "bible"; }
    else if(t === "search"){ body.classList.remove("navopen"); body.classList.remove("chrome-off"); body.classList.add("search-on"); var q = $("#q"); if(q){ q.focus(); q.select(); } }
    else if(t === "library" || t === "saved"){
      var want = t === "saved" ? "marks" : "toc";
      if(body.classList.contains("navopen") && navPane === want){ body.classList.remove("navopen"); }
      else { navPane = want; var tab = $('.navtabs [aria-controls="pane-'+want+'"]'); if(tab) tab.click(); body.classList.add("navopen"); body.classList.remove("chrome-off"); }
    }
    mark();
  });
  addEventListener("hashchange", function(){ document.body.classList.remove("search-on"); setTimeout(mark, 10); });
  var q0 = $("#q"); if(q0) q0.addEventListener("blur", function(){ setTimeout(function(){ if(document.activeElement !== q0){ document.body.classList.remove("search-on"); mark(); } }, 250); });
  new MutationObserver(mark).observe(document.body, {attributes: true, attributeFilter: ["class"]});
  mark();
}

/* ---------- chrome hides while reading (phones) ---------- */
var lastY = scrollY, acc = 0;
function reading(){ var a = $("main article.active"); return !!a && (!!a.dataset.ep || (a.id === "bible" && a.dataset.mode === "read")); }
addEventListener("scroll", function(){
  var y = scrollY, d = y - lastY; lastY = y;
  var body = document.body;
  body.classList.toggle("scrolled", y > 8);
  if(!phone.matches || !reading() || body.classList.contains("navopen") || body.classList.contains("vs-open") || body.classList.contains("search-on")){ if(body.classList.contains("chrome-off")) body.classList.remove("chrome-off"); acc = 0; return; }
  if((d > 0) !== (acc > 0)) acc = 0; acc += d;
  if(y < 120 || acc < -36) body.classList.remove("chrome-off");
  else if(acc > 60 && y + innerHeight < document.documentElement.scrollHeight - 140) body.classList.add("chrome-off");
}, {passive: true});
addEventListener("hashchange", function(){ document.body.classList.remove("chrome-off"); acc = 0; });

/* ---------- home: Today ---------- */
function today(){
  var sh = $("#home .shelves"); if(!sh) return;
  if(!$(".today-h", sh)){
    var d = new Date(), hr = d.getHours(), h = document.createElement("header"); h.className = "today-h";
    h.innerHTML = '<p>'+esc(d.toLocaleDateString(undefined, {weekday: "long", day: "numeric", month: "long"}))+'</p><h2>'+(hr < 5 ? "Good night" : hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening")+'</h2>';
    sh.appendChild(h);
    var j = document.createElement("nav"); j.className = "today-jump"; j.setAttribute("aria-label", "Shortcuts");
    var last = get("hcc.bible.last", null);
    j.innerHTML = '<a href="#bible"><b>'+(last ? "Continue "+esc(last.l) : "Open the Bible")+'</b><small>'+(last ? esc(last.ed) : "Nine editions")+'</small></a><a href="#ref-otd"><b>On this day</b><small>Church calendar</small></a><a href="#bible-maps"><b>Maps</b><small>Journeys of Scripture</small></a><a href="#ref-tree"><b>Family tree</b><small>How the churches divide</small></a><a href="#ref-people"><b>People</b><small>148 lives</small></a>';
    sh.appendChild(j);
  }
  $$(".qotd, .votd", sh).forEach(function(card){
    var rows = $$(":scope > .setrow, :scope > .vset, :scope > p[style]", card); if(!rows.length || $(".card-set", card)) return;
    var det = document.createElement("details"); det.className = "card-set"; det.innerHTML = "<summary>Notifications and widgets</summary>";
    card.appendChild(det); rows.forEach(function(r){ det.appendChild(r); });
  });
}
setTimeout(today, 300); setTimeout(today, 1200); addEventListener("hashchange", function(){ setTimeout(today, 250); });

/* ---------- episodes: reading time left in the floating pill is handled by the series layer; add scene numbers ---------- */
function scenes(){
  var a = $("main article.active"); if(!a || !a.dataset.ep || a.dataset.sc) return; a.dataset.sc = "1";
  $$("h3[id]", a).forEach(function(h, i){ if(!h.closest(".takeaways, .notes, .deeper, .cast, .sstrip")) h.dataset.n = String(i + 1).padStart(2, "0"); });
}
setTimeout(scenes, 200); addEventListener("hashchange", function(){ setTimeout(scenes, 150); });
})();
