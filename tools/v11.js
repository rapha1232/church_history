(function(){
"use strict";
var X3 = window.__X3__||{}, EP = window.__EP__||{};
var $ = function(s,r){return (r||document).querySelector(s)};
var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]}); }
function hap(k){ if(window.__haptic) window.__haptic(k); }
function active(){ return $("main article.active"); }

/* ---------- council map ---------- */
var cmKind = "", cmTimer = null;
function cmCard(id){
  var c = (X3.councils||{})[id], box = $("#cmCard"); if(!c || !box) return;
  box.innerHTML = '<p class="pk">'+(c.s===c.e?c.s:c.s+"–"+c.e)+' · '+esc(c.pl)+'</p><h3>'+esc(c.n)+'</h3>'+
    '<dl><dt>Present</dt><dd>'+esc(c.b)+'</dd><dt>Called by</dt><dd>'+esc(c.by)+'</dd><dt>Decided</dt><dd>'+esc(c.d)+'</dd></dl>'+
    '<div class="rchips">'+(X3.trads||[]).map(function(t){ var v = c.r[t[0]]||""; return v ? '<span class="rchip r-'+v+'"><b>'+esc(t[1])+'</b>'+esc(X3.rec[v])+'</span>' : ''; }).join("")+'</div>'+
    (EP[c.ep]?'<a class="btn-sm" href="#'+c.ep+'">Read: '+esc(EP[c.ep].g)+' '+esc(EP[c.ep].t)+' →</a>':'');
  $$(".cpin").forEach(function(p){ p.classList.toggle("sel", p.dataset.c === id); });
  $$(".cmtab tr[data-c]").forEach(function(r){ r.classList.toggle("sel", r.dataset.c === id); });
}
function cmApply(){
  var inp = $("#cmYear"); if(!inp) return; var y = +inp.value, last = null;
  $$(".cpin").forEach(function(p){ var on = +p.dataset.y <= y && (!cmKind || p.classList.contains("k-"+cmKind)); p.classList.toggle("off", !on); if(on && (!last || +p.dataset.y >= +last.dataset.y)) last = p; });
  $$(".cmtab tr[data-c]").forEach(function(r){ var c = X3.councils[r.dataset.c]; r.hidden = !(c.s <= y && (!cmKind || c.k === cmKind)); });
  $("#cmOut").textContent = y < 100 ? "AD " + y : String(y);
  return last;
}
document.addEventListener("input", function(e){ if(e.target.id === "cmYear"){ stopCm(); cmApply(); } });
document.addEventListener("click", function(e){
  var p = e.target.closest(".cpin"); if(p){ cmCard(p.dataset.c); hap("tick"); return; }
  var g = e.target.closest("[data-cgo]"); if(g){ cmCard(g.dataset.cgo); var cd = $("#cmCard"); if(cd && innerWidth < 900) cd.scrollIntoView({block:"nearest", behavior: reduce?"auto":"smooth"}); return; }
  var k = e.target.closest("[data-ck]"); if(k){ cmKind = k.dataset.ck; $$("[data-ck]").forEach(function(x){ x.setAttribute("aria-pressed", x===k?"true":"false"); }); cmApply(); return; }
  if(e.target.closest("#cmPlay")){ if(cmTimer){ stopCm(); return; } playCm(); }
});
function stopCm(){ clearInterval(cmTimer); cmTimer = null; var b = $("#cmPlay"); if(b){ b.setAttribute("aria-pressed","false"); $("span",b).textContent = "Play"; } }
function playCm(){
  var ids = Object.keys(X3.councils).filter(function(id){ return !cmKind || X3.councils[id].k === cmKind; }).sort(function(a,b){ return X3.councils[a].s - X3.councils[b].s; });
  var i = 0, b = $("#cmPlay"); b.setAttribute("aria-pressed","true"); $("span",b).textContent = "Pause";
  function step(){ if(i >= ids.length){ stopCm(); return; } var c = X3.councils[ids[i]]; $("#cmYear").value = c.s; cmApply(); cmCard(ids[i]);
    var pin = $('.cpin[data-c="'+ids[i]+'"]'); if(pin && !reduce){ pin.classList.remove("pop"); void pin.getBBox(); pin.classList.add("pop"); } i++; }
  step(); cmTimer = setInterval(step, reduce ? 600 : 1500);
}

/* ---------- family tree: sub-churches ---------- */
var tc = null;
function addSub(){
  var card = $("#treeCard"), on = $(".tb.on"); if(!card || !on || $(".subl", card)) return;
  var list = (X3.sub||{})[on.dataset.t] || []; if(!list.length) return;
  var d = document.createElement("div"); d.className = "subl";
  d.innerHTML = '<p class="pk">Churches in this family</p><ul>'+list.map(function(s){ return '<li><b>'+esc(s[0])+'</b><span>'+esc(s[1])+'</span></li>'; }).join("")+'</ul>';
  card.appendChild(d);
}
if("MutationObserver" in window){ tc = new MutationObserver(function(){ addSub(); }); }
function watchTree(){ var c = $("#treeCard"); if(c && tc && !c._w){ c._w = 1; tc.observe(c, {childList:true}); addSub(); } }

/* ---------- how do we know (evidence labels) ---------- */
document.addEventListener("click", function(e){
  var g = e.target.closest(".ev"); if(!g || !g.closest("main article")) return;
  var k = g.dataset.ev; if(k !== "dis" && k !== "unc" && k !== "con" && k !== "doc") return;
  setTimeout(function(){
    var pop = $("#pop"); if(!pop || pop.hidden || $(".hdk", pop)) return;
    var blk = g.closest("p,li,td,blockquote") || g.parentNode, notes = [];
    $$("sup.fn a", blk).forEach(function(a){ var n = document.getElementById(a.getAttribute("href").slice(1)); if(n){ var c = n.cloneNode(true); $$("a", c).forEach(function(x){ if(x.textContent.trim()==="↩") x.remove(); }); notes.push(c.textContent.trim()); } });
    var q = g.closest("blockquote"), cite = q ? $("cite", q) : null;
    var div = document.createElement("div"); div.className = "hdk";
    div.innerHTML = '<p class="pk">How do we know?</p>' + (notes.length || cite ?
      '<ul>'+notes.slice(0,3).map(function(n){ return '<li>'+esc(n)+'</li>'; }).join("")+(cite?'<li>'+esc(cite.textContent.trim())+'</li>':'')+'</ul>' :
      '<p>The sources for this paragraph are listed in the episode’s notes.</p>') +
      (k === "dis" || k === "unc" ? '<p><a href="#ref-debates">All debates and uncertainties →</a></p>' : '');
    pop.appendChild(div);
    var r = pop.getBoundingClientRect(); if(r.bottom > innerHeight - 8) pop.style.top = Math.max(64, innerHeight - r.height - 8) + "px";
  }, 0);
});

/* ---------- traditions side by side (comparison matrix) ---------- */
function initSide(){
  var a = $("#p3-matrix"), t = $("#mx"); if(!a || !t || $("#sbs", a)) return;
  var trads = $$("thead th[data-t]", t).map(function(th){ return [th.dataset.t, th.title]; });
  var box = document.createElement("section"); box.id = "sbs"; box.className = "sbs";
  var opts = function(sel){ return trads.map(function(x){ return '<option value="'+x[0]+'"'+(x[0]===sel?' selected':'')+'>'+esc(x[1])+'</option>'; }).join(""); };
  box.innerHTML = '<h3 class="shelf-h">Two traditions side by side</h3><div class="sbs-ctl"><select id="sbsA" aria-label="First tradition">'+opts("C")+'</select><span>and</span><select id="sbsB" aria-label="Second tradition">'+opts("Luth")+'</select>'+
    '<label class="sbs-only"><input type="checkbox" id="sbsDiff"> Show differences only</label></div><div id="sbsList"></div>';
  var tw = t.closest(".tablewrap"); tw.parentNode.insertBefore(box, $("#mxtrad", a) || tw);
  function norm(s){ return s.toLowerCase().replace(/\(.*?\)/g,"").replace(/[^a-z]+/g," ").trim(); }
  function render(){
    var A = $("#sbsA").value, B = $("#sbsB").value, only = $("#sbsDiff").checked, la = $("#sbsA").selectedOptions[0].text, lb = $("#sbsB").selectedOptions[0].text, n = 0;
    var html = $$("tbody tr[data-key]", t).map(function(r){
      var ca = $('td[data-t="'+A+'"]', r), cb = $('td[data-t="'+B+'"]', r); if(!ca || !cb) return "";
      var same = norm(ca.textContent) === norm(cb.textContent); if(only && same) return ""; n++;
      var topic = $("td strong", r), link = $("td a", r);
      return '<div class="sbs-row'+(same?' same':'')+'"><div class="sbs-t">'+esc(topic?topic.textContent:"")+(link?' <a href="'+link.getAttribute("href")+'" aria-label="Read more">→</a>':'')+(same?'<span>Same</span>':'')+'</div><div class="sbs-a"><small>'+esc(la)+'</small>'+esc(ca.textContent)+'</div><div class="sbs-b"><small>'+esc(lb)+'</small>'+esc(cb.textContent)+'</div></div>';
    }).join("");
    $("#sbsList").innerHTML = html || '<p class="cmp-note">These two traditions’ summaries match on every topic.</p>';
  }
  box.addEventListener("change", render); render();
}

/* ---------- route ---------- */
function onRoute(){
  var a = active(); if(!a) return;
  if(a.id === "ref-councilmap"){ cmApply(); if(!$("#cmCard h3")) cmCard("nic1"); }
  else stopCm();
  if(a.id === "ref-tree") setTimeout(watchTree, 200);
  if(a.id === "p3-matrix") initSide();
}
addEventListener("hashchange", function(){ setTimeout(onRoute, 50); });
setTimeout(onRoute, 200);
})();
