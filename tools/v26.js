/* Edition 26: "Fathers on this verse". In the Bible, a small number after a verse number says how many excerpts
   in the Church Fathers' commentary (site/bible/fath/) cover that verse; tapping it opens the verse's Commentary
   tab. Settings > Church Fathers in the Bible turns it off. */
(function(){
"use strict";
var view = document.getElementById("bibView"); if(!view) return;
var B = function(){ return window.HCCBible || {}; };
function on(){ try{ var v = localStorage.getItem("hcc.bible.fcount"); return (v ? JSON.parse(v) : "1") !== "0"; }catch(e){ return true; } } /* stored as JSON by Settings */
var last = "", timer = 0;
function clear(){ Array.prototype.forEach.call(view.querySelectorAll(".fv"), function(b){ b.parentNode.removeChild(b); }); last = ""; }
function run(){
  if(!on()){ if(view.querySelector(".fv")) clear(); return; }
  var s = B().state && B().state(); if(!s || !B().fcount || !view.querySelector(".bv[data-v]")) return;
  var key = s.ed + "~" + s.b + "~" + s.c;
  if(key === last && view.querySelector(".fv")) return;
  last = key;
  B().fcount(s.ed, s.b, s.c, function(cnt){
    var s2 = B().state(); if(s2.ed + "~" + s2.b + "~" + s2.c !== key) return;
    Array.prototype.forEach.call(view.querySelectorAll(".bv[data-v]"), function(el){
      if(el.querySelector(".fv")) return;
      var v = el.dataset.v, x = cnt[v]; if(!x) return;
      var sup = el.querySelector("sup"), b = document.createElement("button");
      b.type = "button"; b.className = "fv"; b.dataset.fv = v; b.textContent = x[0];
      var label = x[0] + (x[0] === 1 ? " excerpt" : " excerpts") + " from " + x[1] + (x[1] === 1 ? " Church Father" : " Church Fathers") + " on verse " + v;
      b.title = label; b.setAttribute("aria-label", label);
      if(sup && sup.nextSibling) el.insertBefore(b, sup.nextSibling); else el.insertBefore(b, el.firstChild);
    });
  });
}
new MutationObserver(function(){ clearTimeout(timer); timer = setTimeout(run, 120); }).observe(view, {childList: true, subtree: true});
view.addEventListener("click", function(e){
  var b = e.target.closest(".fv"); if(!b) return;
  e.stopPropagation(); e.preventDefault();
  if(B().openTab) B().openTab(+b.dataset.fv, "comm");
}, true);
window.HCCFathersCount = {refresh: function(){ last = ""; run(); }};
setTimeout(run, 400);
})();
