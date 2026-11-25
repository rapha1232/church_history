(function(){
"use strict";
/* Edition 20: two body classes for the design layer (DESIGN.md §4).
   ed20-deep: the reader has scrolled more than a screen, so "back to top" is worth showing.
   ed20-hero: the active page's hero image is still in view, so floating UI (the year trail and the
   Sources button) stays out of the way instead of covering the picture and its caption. */
var b = document.body, queued = false;
function hero(){
  var a = document.querySelector("main > article.active");
  return a && a.querySelector(":scope > .coldopen, :scope > .season, :scope > .billboard");
}
function update(){
  queued = false;
  var y = window.scrollY || document.documentElement.scrollTop || 0;
  b.classList.toggle("ed20-deep", y > window.innerHeight * 0.9);
  var h = hero(), inView = false;
  if (h) { var r = h.getBoundingClientRect(); inView = r.bottom > 140 && r.height > 0; }
  b.classList.toggle("ed20-hero", inView);
}
function later(){ if (!queued) { queued = true; requestAnimationFrame(update); } }
window.addEventListener("scroll", later, {passive:true});
window.addEventListener("resize", later);
window.addEventListener("hashchange", function(){ setTimeout(update, 60); });
setTimeout(update, 0); setTimeout(update, 600);
})();
