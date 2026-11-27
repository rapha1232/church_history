(function(){
"use strict";
/* Print or save as PDF (the button next to Bookmark on every episode and reference page).
   In a browser: print the current page alone, in the light theme, with folded sections opened and a title at the top.
   In the Android app (the WebView has no window.print): save the page as a standalone HTML file to print from there. */
var $ = function(s,r){return (r||document).querySelector(s)};
var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var APP = window.HCCApp && window.HCCApp.isApp ? window.HCCApp : null;
function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]}); }
function t(s){ return window.HCCSettings && HCCSettings.t ? HCCSettings.t(s) : s; }
function toast(m){ if(window.HCCToast) HCCToast(m); }
function current(){ return $("main > article.active"); }
function heading(a){
  var title = a.dataset.title || (a.querySelector("h1,h2") || {}).textContent || "", sub = a.dataset.ep ? a.dataset.ep : (a.querySelector(".eyebrow") || {}).textContent || "";
  return {title: title.trim(), sub: sub.trim()};
}
var saved = null;
function before(){
  var a = current(); if(!a || saved) return;
  var h = heading(a), ph = document.createElement("header"); ph.className = "print-head";
  ph.innerHTML = '<p>History of the Christian Church' + (h.sub ? ' · ' + esc(h.sub) : "") + '</p><h1>' + esc(h.title) + '</h1>';
  a.insertBefore(ph, a.firstChild);
  var closed = $$("details:not([open])", a); closed.forEach(function(d){ d.open = true; });
  var root = document.documentElement;
  saved = {ph: ph, closed: closed, theme: root.getAttribute("data-theme")};
  root.setAttribute("data-theme", "light"); root.classList.add("printing");
}
function after(){
  if(!saved) return; var root = document.documentElement;
  saved.ph.parentNode.removeChild(saved.ph); saved.closed.forEach(function(d){ d.open = false; });
  if(saved.theme) root.setAttribute("data-theme", saved.theme); else root.removeAttribute("data-theme");
  root.classList.remove("printing"); saved = null;
}
addEventListener("beforeprint", before); addEventListener("afterprint", after);

var STRIP = "button, nav, script, .ed21-ptools, .co-act, .upnext, .pager, .trail, .shelves, .cast, .smap, .emap, .strip, .mosaic, .rail, svg, input, select, img, .sx-tabs, .hx-bar, .bm, .quick";
function standalone(a){
  var h = heading(a), c = a.cloneNode(true);
  $$(STRIP, c).forEach(function(x){ if(x.parentNode) x.parentNode.removeChild(x); });
  $$("details", c).forEach(function(d){ d.setAttribute("open", ""); });
  $$("a[href^='#']", c).forEach(function(l){ var s = document.createElement("span"); s.innerHTML = l.innerHTML; l.parentNode.replaceChild(s, l); });
  $$("[hidden]", c).forEach(function(x){ x.removeAttribute("hidden"); });
  var css = 'body{font:16px/1.6 Georgia,"Times New Roman",serif;color:#1e1b16;background:#fff;max-width:44rem;margin:2rem auto;padding:0 1rem}h1,h2,h3,h4{font-family:Georgia,serif;line-height:1.25}h1{font-size:1.9rem;margin:.2em 0 .6em}' +
    '.k{font:600 11px/1.4 Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#9b3b22}blockquote{margin:1em 0;padding:.2em 1em;border-left:3px solid #c9b48a;color:#333}table{border-collapse:collapse;font:13px/1.4 Arial,sans-serif}' +
    'th,td{border:1px solid #ccc;padding:5px 7px;vertical-align:top;text-align:left}dt{font-weight:bold}summary{font-weight:bold;list-style:none}small,.eyebrow{color:#666}footer{margin-top:3em;font:12px Arial,sans-serif;color:#666}@media print{body{margin:0;max-width:none}}';
  return '<!doctype html><html lang="' + esc(document.documentElement.lang || "en") + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(h.title) + '</title><style>' + css + '</style></head><body>' +
    '<p class="k">History of the Christian Church' + (h.sub ? ' · ' + esc(h.sub) : "") + '</p><h1>' + esc(h.title) + '</h1>' + c.innerHTML +
    '<footer>Saved from History of the Christian Church on ' + esc(new Date().toLocaleDateString()) + '.</footer></body></html>';
}
function slug(s){ return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "page"; }
function go(){
  var a = current(); if(!a) return;
  if(APP && APP.saveFile){ try{ APP.saveFile(slug(heading(a).title) + ".html", "text/html", standalone(a)); toast(t("Saved. Open the file to print it or save it as PDF.")); }catch(e){ toast(t("Could not save the page")); } return; }
  before(); setTimeout(function(){ window.print(); setTimeout(after, 500); }, 60);
}
document.addEventListener("click", function(e){ if(e.target.closest(".ed21-print")) go(); });
window.HCCPrint = {page: go, html: function(){ var a = current(); return a ? standalone(a) : ""; }};
})();
