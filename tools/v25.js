/* Edition 25: quote cards with full attribution. Every card names who said it, where (work and passage) and in
   which translation or edition. A quote too long for the card is shortened at a word boundary and marked
   "abridged" on the card itself, never cut silently. Replaces window.HCCShareCard and adds Share card to the
   quote of the day, the Early Christian texts reader and Studies items. */
(function(){
"use strict";
var $ = function(s, r){ return (r || document).querySelector(s); };
var APP = window.HCCApp && window.HCCApp.isApp ? window.HCCApp : null;
var MAX = 640;

function wrap(x, text, max){ var w = String(text).split(" "), lines = [], cur = ""; w.forEach(function(t){ var s = cur ? cur + " " + t : t; if(x.measureText(s).width > max && cur){ lines.push(cur); cur = t; } else cur = s; }); if(cur) lines.push(cur); return lines; }
function abridge(q){
  q = String(q || "").replace(/\s+/g, " ").trim();
  if(q.length <= MAX) return {q: q, cut: false};
  return {q: q.slice(0, MAX - 20).replace(/\s+\S*$/, "").replace(/[,;:]$/, "") + " …", cut: true};
}
function card(o){
  var W = 1080, H = 1350, P = 110, c = document.createElement("canvas"); c.width = W; c.height = H; var x = c.getContext("2d");
  var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#15171f"); g.addColorStop(1, "#0b0c10"); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.strokeStyle = "rgba(226,184,91,.35)"; x.lineWidth = 2; x.strokeRect(48, 48, W - 96, H - 96);
  x.fillStyle = "rgba(226,184,91,.22)"; x.font = "600 240px Georgia, serif"; x.fillText("“", 84, 290);
  var a = abridge(o.q), meta = [];
  /* attribution block, measured first so the quote gets the space that is left */
  x.font = "600 34px 'IBM Plex Sans', Arial, sans-serif"; var byL = o.by ? wrap(x, "— " + o.by, W - 2 * P) : [];
  x.font = "28px 'IBM Plex Sans', Arial, sans-serif"; var subL = o.sub ? wrap(x, o.sub, W - 2 * P) : [];
  var srcT = [o.src, a.cut ? "Abridged; the full passage is longer." : ""].filter(Boolean).join(" · ");
  x.font = "24px 'IBM Plex Sans', Arial, sans-serif"; var srcL = srcT ? wrap(x, srcT, W - 2 * P).slice(0, 4) : [];
  var metaH = byL.length * 44 + subL.length * 38 + (srcL.length ? 14 + srcL.length * 32 : 0);
  var TOP = 340, room = H - 170 - TOP - metaH - 50, size = 64, lines, lh;
  do { x.font = "500 " + size + "px 'Cormorant Garamond', Georgia, serif"; lines = wrap(x, a.q, W - 2 * P); lh = size * 1.3; size -= 2; } while(lines.length * lh > room && size > 26);
  var y = TOP + Math.max(0, (room - lines.length * lh) / 2);
  x.fillStyle = "#f3eee4"; lines.forEach(function(l){ x.fillText(l, P, y); y += lh; });
  y += 36;
  x.fillStyle = "#e2b85b"; x.font = "600 34px 'IBM Plex Sans', Arial, sans-serif"; byL.forEach(function(l){ x.fillText(l, P, y); y += 44; });
  x.fillStyle = "rgba(243,238,228,.72)"; x.font = "28px 'IBM Plex Sans', Arial, sans-serif"; subL.forEach(function(l){ x.fillText(l, P, y); y += 38; });
  if(srcL.length){ y += 14; x.fillStyle = "rgba(243,238,228,.55)"; x.font = "24px 'IBM Plex Sans', Arial, sans-serif"; srcL.forEach(function(l){ x.fillText(l, P, y); y += 32; }); }
  x.fillStyle = "rgba(243,238,228,.5)"; x.font = "600 24px 'IBM Plex Sans', Arial, sans-serif"; x.fillText("THE HISTORY OF THE CHRISTIAN CHURCH", P, H - 96);
  return {canvas: c, cut: a.cut};
}

/* preview */
var cp = document.createElement("div"); cp.className = "cardprev ed25"; cp.hidden = true; cp.setAttribute("role", "dialog"); cp.setAttribute("aria-label", "Share card");
cp.innerHTML = '<div class="cbox"><img alt="Share card preview"><p class="ed25-cut" hidden>The quote was too long for one card, so it is abridged and marked as such.</p><div class="row2"><button type="button" class="btn-sm" data-c25="close">Close</button><button type="button" class="btn-sm pri" data-c25="save">Save image</button></div></div>';
document.body.appendChild(cp);
var cur = null;
function open(o){
  var r = card(o); cur = r.canvas;
  $("img", cp).src = cur.toDataURL("image/png"); $(".ed25-cut", cp).hidden = !r.cut; cp.hidden = false;
  try{ if(APP) APP.haptic("tick"); }catch(e){}
  setTimeout(function(){ var b = $('[data-c25="save"]', cp); if(b) b.focus(); }, 30);
}
function close(){ cp.hidden = true; }
function save(){
  if(!cur) return; var name = "church-history-quote.png";
  if(APP && APP.saveFileB64){ try{ APP.saveFileB64(name, "image/png", cur.toDataURL("image/png").split(",")[1]); return; }catch(e){} }
  cur.toBlob(function(b){
    var f = typeof File === "function" ? new File([b], name, {type: "image/png"}) : null;
    if(f && navigator.canShare && navigator.canShare({files: [f]})){ navigator.share({files: [f]}).catch(function(){}); return; }
    var a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.parentNode.removeChild(a); }, 1000);
  }, "image/png");
}
cp.addEventListener("click", function(e){ var b = e.target.closest("[data-c25]"); if(e.target === cp || (b && b.dataset.c25 === "close")) close(); else if(b && b.dataset.c25 === "save") save(); });
document.addEventListener("keydown", function(e){ if(e.key === "Escape" && !cp.hidden) close(); });

/* Bible editions: "John 3:16 (KJV)" -> the edition's full name and date */
function edition(short){
  var M = window.__BIBMAN__ || {eds: []}, e = M.eds.filter(function(x){ return x.short === short; })[0];
  return e ? e.name + (e.year ? ", " + e.year : "") : "";
}
/* the same signature as before, plus an optional source line */
window.HCCShareCard = function(q, by, sub, src){
  if(!src){ var m = String(by || "").match(/^(.*)\s\(([^()]+)\)$/); if(m && edition(m[2])){ by = m[1]; src = edition(m[2]); } }
  open({q: q, by: by, sub: sub, src: src || ""});
};
window.HCCCard = open;

/* quote of the day: its chapter and source edition belong on the card */
document.addEventListener("click", function(e){
  var b = e.target.closest('.qotd [data-q="card"]'); if(!b) return;
  var box = b.closest(".qotd"), qa = $(".qa", box); if(!qa) return;
  e.stopPropagation(); e.preventDefault();
  var who = ($("b", qa) || {}).textContent || "", sm = $("small", qa), src = sm ? sm.textContent : "";
  var t = qa.cloneNode(true); var s2 = t.querySelector("small"); if(s2) s2.parentNode.removeChild(s2); var bb = t.querySelector("b"); if(bb) bb.parentNode.removeChild(bb);
  var w0 = (t.querySelector("i") || {}).textContent || "", where = t.textContent.replace(/^\s*(\([^)]*\))?\s*·\s*/, "").replace(/\s+/g, " ").trim();
  var rest = where.slice(w0.length).replace(/^,\s*/, "");
  if(w0 && rest && rest.toLowerCase().indexOf(w0.toLowerCase()) === 0) where = rest; /* "On the Incarnation, On the Incarnation of the Word" */
  var date = (qa.textContent.match(/^\s*[^(]*\(([^)]+)\)/) || [])[1];
  open({q: $("blockquote", box).textContent, by: who + (date ? " (" + date + ")" : ""), sub: where, src: src});
}, true);
})();
