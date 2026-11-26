(function(){
"use strict";
var X = window.__X__||{}, X2 = window.__X2__||{}, EP = window.__EP__||{}, IMG = window.__IMG__||{};
var $ = function(s,r){return (r||document).querySelector(s)};
var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
var APP = window.HCCApp || null;
function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]}); }
function load(k,d){ try{ var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } }
function save(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function active(){ return $("main article.active"); }
function hap(k){ if(window.__haptic) window.__haptic(k); }
function fy(y){ return y == null ? "" : (y < 0 ? (-y)+" BC" : String(y)); }
var MON = ["January","February","March","April","May","June","July","August","September","October","November","December"];

/* ---------- reading settings ---------- */
var RS = load("hcc.read", {size:1, lh:0, dim:false});
function applyRS(){
  document.documentElement.style.setProperty("--rs", RS.size||1);
  if(RS.lh) document.documentElement.style.setProperty("--rl", RS.lh); else document.documentElement.style.removeProperty("--rl");
  document.body.classList.toggle("dimimg", !!RS.dim);
}
applyRS();
window.HCCReadRS = {set: function(v){ RS.size = v; applyRS(); save("hcc.read", RS); }};
var tb = $("#themeBtn");
if(tb){
  var b = document.createElement("button"); b.type = "button"; b.className = "iconbtn rsbtn"; b.id = "rsBtn"; b.textContent = "Aa";
  b.title = "Reading settings"; b.setAttribute("aria-label","Reading settings"); b.setAttribute("aria-expanded","false");
  tb.parentNode.insertBefore(b, tb);
  var p = document.createElement("div"); p.className = "rset"; p.hidden = true; p.setAttribute("role","dialog"); p.setAttribute("aria-label","Reading settings");
  p.innerHTML = '<h4>Theme</h4><div class="rs-th">'+[["auto","Auto","linear-gradient(90deg,#eff1ec 50%,#101219 50%)"],["light","Light","#eff1ec"],["sepia","Sepia","#f3ead6"],["dark","Night","#101219"]].map(function(t){ return '<button type="button" data-th="'+t[0]+'"><i style="background:'+t[2]+'"></i>'+t[1]+'</button>'; }).join("")+'</div>'+
    '<div class="rs-row"><label for="rsSize">Text size</label><input type="range" id="rsSize" min="0.9" max="1.3" step="0.05"></div>'+
    '<div class="rs-row"><label for="rsLh">Line spacing</label><input type="range" id="rsLh" min="1.5" max="2.1" step="0.1"></div>'+
    '<div class="rs-row"><label for="rsDim">Dim pictures</label><input type="checkbox" class="switch" id="rsDim"></div>';
  document.body.appendChild(p);
  function curTheme(){ return document.documentElement.getAttribute("data-theme") || "auto"; }
  function syncP(){ $$(".rs-th button", p).forEach(function(x){ x.setAttribute("aria-pressed", x.dataset.th === curTheme() ? "true" : "false"); }); $("#rsSize").value = RS.size||1; $("#rsLh").value = RS.lh||1.7; $("#rsDim").checked = !!RS.dim; }
  b.addEventListener("click", function(e){ e.stopPropagation(); p.hidden = !p.hidden; b.setAttribute("aria-expanded", String(!p.hidden)); syncP(); });
  document.addEventListener("click", function(e){ if(!p.hidden && !e.target.closest(".rset,#rsBtn")){ p.hidden = true; b.setAttribute("aria-expanded","false"); } });
  document.addEventListener("keydown", function(e){ if(e.key === "Escape" && !p.hidden){ p.hidden = true; b.focus(); } });
  window.HCCReadSetOpen = function(){ return !p.hidden; }; window.HCCReadSetClose = function(){ p.hidden = true; b.setAttribute("aria-expanded","false"); };
  p.addEventListener("click", function(e){
    var t = e.target.closest("[data-th]"); if(!t) return;
    var v = t.dataset.th, r = document.documentElement;
    if(v === "auto"){ r.removeAttribute("data-theme"); try{ localStorage.removeItem("theme"); }catch(err){} }
    else { r.setAttribute("data-theme", v); save("theme", v); }
    syncP(); hap("tick");
  });
  $("#rsSize", p).addEventListener("input", function(){ RS.size = +this.value; applyRS(); save("hcc.read", RS); });
  $("#rsLh", p).addEventListener("input", function(){ RS.lh = +this.value; applyRS(); save("hcc.read", RS); });
  $("#rsDim", p).addEventListener("change", function(){ RS.dim = this.checked; applyRS(); save("hcc.read", RS); });
}

/* ---------- family tree ---------- */
function showBranch(id){
  var t = (X2.tree||{})[id], card = $("#treeCard"); if(!t || !card) return;
  var col = getComputedStyle($('.tb[data-t="'+id+'"]')).getPropertyValue("--sc");
  card.style.setProperty("--tc", col);
  card.innerHTML = '<h4>'+esc(t.l)+'</h4><p style="margin:0 0 6px;color:var(--muted)">'+fy(t.s)+' – '+(t.e?fy(t.e):"today")+'</p><p style="margin:0 0 6px">'+esc(t.n)+'</p><a href="#'+t.ep+'">Read: '+esc(EP[t.ep]?EP[t.ep].g+" "+EP[t.ep].t:"the story")+' →</a>';
  $$(".tb").forEach(function(x){ x.classList.toggle("on", x.dataset.t === id); }); $(".tree").classList.add("dim");
}
document.addEventListener("pointerover", function(e){ if(e.pointerType !== "mouse") return; var t = e.target.closest(".tb"); if(t) showBranch(t.dataset.t); });
document.addEventListener("click", function(e){
  var t = e.target.closest(".tb"); if(!t) return;
  if(!t.classList.contains("on")){ e.preventDefault(); showBranch(t.dataset.t); hap("tick"); }
});

/* ---------- people finder & life timeline ---------- */
var pfEra = "";
function filterPeople(){
  var q = ($("#pfQ")||{}).value || "", role = ($("#pfRole")||{}).value || "", trad = ($("#pfTrad")||{}).value || "", n = 0;
  q = q.toLowerCase().trim();
  $$("#ref-people .person").forEach(function(c){
    var ok = (!pfEra || c.dataset.era === pfEra) && (!role || (" "+c.dataset.roles+" ").indexOf(" "+role+" ") >= 0) && (!trad || c.dataset.trad === trad) && (!q || c.textContent.toLowerCase().indexOf(q) >= 0);
    c.classList.toggle("pf-off", !ok); if(ok) n++;
  });
  var o = $("#pfN"); if(o) o.textContent = n + " people";
}
document.addEventListener("input", function(e){ if(e.target.id === "pfQ") filterPeople(); });
document.addEventListener("change", function(e){ if(e.target.id === "pfRole" || e.target.id === "pfTrad") filterPeople(); });
document.addEventListener("click", function(e){
  var c = e.target.closest("#pfind [data-era]"); if(!c) return;
  pfEra = c.dataset.era; $$("#pfind [data-era]").forEach(function(x){ x.setAttribute("aria-pressed", x===c?"true":"false"); }); filterPeople();
});
function addLifeButtons(){
  $$("#ref-people .person").forEach(function(c){
    if(c._lb) return; c._lb = 1; var pb = $(".pbody", c); if(!pb) return;
    var b = document.createElement("button"); b.type = "button"; b.className = "lifebtn"; b.dataset.person = c.id; b.textContent = "Life & times →"; pb.appendChild(b);
  });
}
document.addEventListener("click", function(e){
  var c = e.target.closest("[data-person]"); if(!c) return;
  setTimeout(function(){
    var card = $(".bio .bio-card"), m = (X2.pm||{})[c.dataset.person]; if(!card || !m || $(".life", card)) return;
    var b = m.b, d = m.dd; if(b == null && d == null) return;
    if(b == null) b = d - 50; if(d == null) d = Math.min(2026, b + 70);
    var a0 = Math.floor((b - 10)/50)*50, a1 = Math.ceil((d + 10)/50)*50, W = a1 - a0;
    var ev = (X2.otd||[]).filter(function(o){ return o[2] && o[2] >= b && o[2] <= d; }).sort(function(x,y){ return x[2]-y[2]; }).slice(0, 8);
    var ticks = ""; for(var y = a0; y <= a1; y += Math.max(50, Math.round(W/4/50)*50)) ticks += '<span class="tick" style="left:'+((y-a0)/W*100)+'%">'+fy(y)+'</span>';
    var div = document.createElement("div"); div.className = "life";
    div.innerHTML = '<h4>Life & times</h4><div class="life-axis"><span class="span" style="left:'+((b-a0)/W*100)+'%;width:'+Math.max(1.5,(d-b)/W*100)+'%"></span>'+ticks+'</div>'+
      (ev.length ? '<ul>'+ev.map(function(o){ return '<li><b>'+fy(o[2])+'</b><span>'+esc(o[3])+' <a href="#'+o[4]+'" data-bio-close>→</a></span></li>'; }).join("")+'</ul>' : '<p style="font:13px var(--font-ui);color:var(--muted)">'+fy(m.b)+(m.dd!=null?' – '+fy(m.dd):'')+'</p>');
    var sum = $(".bio-sum", card); if(sum) sum.parentNode.insertBefore(div, sum.nextSibling);
  }, 20);
});

/* ---------- on this day ---------- */
function todays(){
  var t = new Date(), m = t.getMonth()+1, d = t.getDate(), all = X2.otd||[];
  var hit = all.filter(function(o){ return o[0]===m && o[1]===d; });
  if(hit.length) return {label:"On this day", items:hit};
  var near = [];
  for(var k=1;k<=4 && near.length<3;k++){ [k,-k].forEach(function(off){ var x = new Date(t.getFullYear(), t.getMonth(), t.getDate()+off); all.forEach(function(o){ if(o[0]===x.getMonth()+1 && o[1]===x.getDate()) near.push(o); }); }); }
  return {label:"This week in church history", items:near.slice(0,3)};
}
function otdLi(o){ return '<li class="k-'+o[5]+'"><b>'+o[1]+' '+MON[o[0]-1].slice(0,3)+'</b><span>'+(o[2]?'<i>'+fy(o[2])+'</i> · ':'')+esc(o[3])+' <a class="go" href="#'+o[4]+'" class="go" aria-label="Read more">→</a></span></li>'; }
function mountOTD(){
  var sh = $(".shelves"); if(!sh || $(".otd", sh)) return;
  var r = todays(); if(!r.items.length) return;
  var box = document.createElement("section"); box.className = "otd"; box.setAttribute("aria-label", r.label);
  box.innerHTML = '<p class="shelf-h">'+r.label+'</p><ul>'+r.items.map(otdLi).join("")+'</ul><a class="more" href="#ref-otd">Full calendar →</a>';
  var q = $(".qotd", sh); sh.insertBefore(box, q ? q.nextSibling : sh.firstChild);
}
function markToday(){
  var t = new Date(), key = (t.getMonth()+1)+"-"+t.getDate();
  $$("#ref-otd li").forEach(function(li){ li.classList.toggle("today", li.dataset.md === key); });
  var r = todays(), box = $("#otdToday"); if(box) box.innerHTML = r.items.length ? '<div class="otd"><p class="shelf-h">'+r.label+'</p><ul>'+r.items.map(otdLi).join("")+'</ul></div>' : "";
}

/* ---------- reading plans ---------- */
var PL = load("hcc.plan", null);
function W(){ return load("hcc.watch", {}); }
function planState(p){ var w = W(), done = p.eps.filter(function(e){ return (w[e]||{}).p >= 0.9; }); var next = p.eps.filter(function(e){ return !((w[e]||{}).p >= 0.9); })[0]; return {done:done.length, next:next, total:p.eps.length}; }
function planById(id){ return (X2.plans||[]).filter(function(p){ return p.id===id; })[0]; }
function renderPlans(){
  $$("#plans .plan").forEach(function(s){
    var p = planById(s.dataset.plan); if(!p) return; var st = planState(p), w = W();
    s.classList.toggle("active", !!(PL && PL.id === p.id));
    $(".plan-p", s).style.setProperty("--pp", Math.round(st.done/st.total*100)+"%");
    $$("li", s).forEach(function(li){ li.classList.toggle("done", (w[li.dataset.epid]||{}).p >= 0.9); li.classList.toggle("next", li.dataset.epid === st.next); });
    var b = $("[data-pstart]", s); b.textContent = (PL && PL.id === p.id) ? (st.next ? "Continue: day "+(st.done+1) : "Completed ✓") : (st.done ? "Resume plan" : "Start plan");
  });
}
function syncPlanNote(){
  if(!APP || !APP.setPlanNote) return;
  var p = PL && planById(PL.id), st = p && planState(p);
  try{ APP.setPlanNote(st && st.next ? p.t + " · day " + (st.done+1) + ": " + EP[st.next].t : ""); }catch(e){}
}
document.addEventListener("click", function(e){
  var b = e.target.closest("[data-pstart]"); if(!b) return;
  var p = planById(b.dataset.pstart); if(!p) return;
  PL = {id:p.id, t:Date.now()}; save("hcc.plan", PL); syncPlanNote(); hap("strong");
  var st = planState(p); if(st.next) location.hash = st.next; else renderPlans();
});
function mountToday(){
  var sh = $(".shelves"); if(!sh) return; var old = $(".today-read", sh); if(old) old.remove();
  var p = PL && planById(PL.id); if(!p) return; var st = planState(p); if(!st.next) return;
  var e = EP[st.next], im = IMG[e.i], a = document.createElement("a"); a.className = "today-read"; a.href = "#"+st.next;
  a.innerHTML = (im?'<span class="th" style="background:'+im.c+'"><img src="'+im.src+'" alt="" loading="lazy"></span>':'')+'<span><small>Today’s reading · '+esc(p.t)+' · day '+(st.done+1)+' of '+st.total+'</small><b>'+esc(e.t)+'</b><span>'+esc(e.g)+' · '+e.m+' min</span></span>';
  var q = $(".qotd", sh); sh.insertBefore(a, q || sh.firstChild);
}

/* ---------- original-language creeds ---------- */
var otpop = document.createElement("div"); otpop.className = "otpop"; otpop.hidden = true; otpop.setAttribute("role","tooltip"); document.body.appendChild(otpop);
document.addEventListener("click", function(e){
  var t = e.target.closest("[data-oc]");
  if(t && t.closest(".cmp-tabs")){
    $$("#ref-originals .cmp-tabs [data-oc]").forEach(function(x){ x.setAttribute("aria-selected", x===t?"true":"false"); });
    $$("#ref-originals .oc-pane").forEach(function(p){ p.hidden = p.dataset.oc !== t.dataset.oc; }); otpop.hidden = true; return;
  }
  var o = e.target.closest(".ot");
  if(o){
    var d = (X2.terms||{})[o.dataset.k]; if(!d) return;
    $$(".ot.on").forEach(function(x){ x.classList.remove("on"); }); $$('.ot[data-k="'+o.dataset.k+'"]').forEach(function(x){ x.classList.add("on"); });
    var r = o.getBoundingClientRect(); otpop.innerHTML = '<b>'+esc(d[0])+'</b>'+esc(d[1]); otpop.hidden = false;
    otpop.style.left = Math.min(innerWidth-180, Math.max(180, r.left + r.width/2)) + scrollX + "px"; otpop.style.top = r.bottom + scrollY + 8 + "px"; hap("tick");
    return;
  }
  if(!e.target.closest(".otpop")){ otpop.hidden = true; $$(".ot.on").forEach(function(x){ x.classList.remove("on"); }); }
});

/* ---------- share cards ---------- */
function wrap(ctx, text, max){ var w = text.split(" "), lines = [], cur = ""; w.forEach(function(x){ var t = cur ? cur+" "+x : x; if(ctx.measureText(t).width > max && cur){ lines.push(cur); cur = x; } else cur = t; }); if(cur) lines.push(cur); return lines; }
function makeCard(q, by, sub){
  var c = document.createElement("canvas"), W0 = 1080, H0 = 1350; c.width = W0; c.height = H0; var x = c.getContext("2d");
  var g = x.createLinearGradient(0,0,0,H0); g.addColorStop(0,"#15171f"); g.addColorStop(1,"#0b0c10"); x.fillStyle = g; x.fillRect(0,0,W0,H0);
  x.strokeStyle = "rgba(226,184,91,.35)"; x.lineWidth = 2; x.strokeRect(48,48,W0-96,H0-96);
  x.fillStyle = "rgba(226,184,91,.18)"; x.font = "600 420px Georgia, serif"; x.fillText("“", 80, 420);
  var size = q.length > 260 ? 46 : q.length > 160 ? 54 : 62, lines;
  do { x.font = "500 "+size+"px Fraunces, Georgia, serif"; lines = wrap(x, q, W0-220); size -= 2; } while(lines.length * size * 1.32 > 760 && size > 30);
  size += 2; x.fillStyle = "#f3eee4"; var y = Math.max(300, (H0 - lines.length*size*1.32)/2 - 40);
  lines.forEach(function(l){ x.fillText(l, 110, y); y += size*1.32; });
  x.fillStyle = "#e2b85b"; x.font = "600 34px 'Source Sans 3', Arial, sans-serif"; y += 40; wrap(x, "— "+by, W0-220).forEach(function(l){ x.fillText(l, 110, y); y += 44; });
  if(sub){ x.fillStyle = "rgba(243,238,228,.6)"; x.font = "28px 'Source Sans 3', Arial, sans-serif"; wrap(x, sub, W0-220).slice(0,3).forEach(function(l){ x.fillText(l, 110, y+6); y += 38; }); }
  x.fillStyle = "rgba(243,238,228,.5)"; x.font = "600 24px 'Source Sans 3', Arial, sans-serif"; x.fillText("THE HISTORY OF THE CHRISTIAN CHURCH", 110, H0-96);
  return c;
}
var cp = document.createElement("div"); cp.className = "cardprev"; cp.hidden = true; cp.setAttribute("role","dialog"); cp.setAttribute("aria-label","Share card");
cp.innerHTML = '<div class="cbox"><img alt="Share card preview"><div class="row2"><button type="button" class="btn-sm" data-cp="close">Close</button><button type="button" class="btn-sm pri" data-cp="save">Save image</button></div></div>';
document.body.appendChild(cp);
var cardCanvas = null;
function openCard(q, by, sub){ cardCanvas = makeCard(q, by, sub); $("img", cp).src = cardCanvas.toDataURL("image/png"); cp.hidden = false; hap("tick"); }
window.HCCShareCard = openCard;
function saveCard(){
  if(!cardCanvas) return; var name = "church-history-quote.png";
  if(APP && APP.saveFileB64){ try{ APP.saveFileB64(name, "image/png", cardCanvas.toDataURL("image/png").split(",")[1]); return; }catch(e){} }
  cardCanvas.toBlob(function(blob){
    var file = null; try{ file = new File([blob], name, {type:"image/png"}); }catch(e){}
    if(file && navigator.canShare && navigator.canShare({files:[file]})){ navigator.share({files:[file]}).catch(function(){}); return; }
    if(window.claude && window.claude.use){
      window.claude.use("downloads").then(function(dl){ if(dl) return dl.save({filename:name, data:blob}).catch(function(){}); plain(); }, plain); return;
    }
    plain();
    function plain(){ var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function(){ a.remove(); }, 1000); }
  }, "image/png");
}
document.addEventListener("keydown", function(e){ if(e.key === "Escape" && !cp.hidden){ e.stopPropagation(); cp.hidden = true; } }, true);
window.HCCCardOpen = function(){ return !cp.hidden; }; window.HCCCardClose = function(){ cp.hidden = true; };
cp.addEventListener("click", function(e){ var b = e.target.closest("[data-cp]"); if(e.target === cp || (b && b.dataset.cp === "close")) cp.hidden = true; if(b && b.dataset.cp === "save") saveCard(); });
document.addEventListener("click", function(e){
  var b = e.target.closest("[data-q='card']");
  if(b){ var box = b.closest(".qotd"), q = $("blockquote", box).textContent, a = $(".qa b", box).textContent, w = $(".qa i", box); openCard(q, a, w ? w.textContent : ""); return; }
  var n = e.target.closest("[data-nbcard]");
  if(n){ var it = n.closest(".nb-item"), sec = n.closest(".nb-ep"); openCard($("q", it).textContent, ($("h3 a", sec).lastChild||{}).textContent || "", "From my notebook"); return; }
  var s = e.target.closest(".seltool [data-act='card']");
  if(s){ var t = (getSelection()+"").replace(/\s+/g," ").trim(), a2 = active(); if(t) openCard(t, a2 ? a2.dataset.title : "", a2 && a2.dataset.ep ? a2.dataset.ep : ""); $(".seltool").hidden = true; }
});
function addCardButtons(){
  var q = $(".qotd .qbtns"); if(q && !$("[data-q='card']", q)){ var b = document.createElement("button"); b.type = "button"; b.className = "btn-sm"; b.dataset.q = "card"; b.textContent = "Share card"; q.appendChild(b); }
  var st = $(".seltool"); if(st && !$("[data-act='card']", st)){ var c = document.createElement("button"); c.type = "button"; c.dataset.act = "card"; c.textContent = "Card"; st.appendChild(c); }
  $$(".nb-item .nb-a").forEach(function(a){ if(!$("[data-nbcard]", a)){ var c2 = document.createElement("button"); c2.type = "button"; c2.dataset.nbcard = "1"; c2.textContent = "Share card"; a.appendChild(c2); } });
}

/* ---------- app: on-this-day in notification ---------- */
function appOTD(){
  if(!APP || !APP.getDaily || $("#qdOtd")) return; var on = $("#qdOn"); if(!on) return;
  var row = document.createElement("div"); row.className = "setrow"; row.innerHTML = '<label for="qdOtd">Include “On this day”</label><input type="checkbox" class="switch" id="qdOtd">';
  on.closest(".setrow").parentNode.insertBefore(row, on.closest(".setrow").nextSibling);
  var cb = $("#qdOtd"); try{ var s = JSON.parse(APP.getDaily()||"{}"); cb.checked = s.otd !== false; }catch(e){ cb.checked = true; }
  cb.addEventListener("change", function(){ try{ APP.setOtd(cb.checked); }catch(e){} hap("tick"); });
}

/* ---------- route hook ---------- */
function onRoute(){
  var a = active(); if(!a) return;
  if(a.id === "home"){ setTimeout(function(){ mountOTD(); mountToday(); addCardButtons(); appOTD(); }, 120); }
  if(a.id === "ref-people"){ addLifeButtons(); filterPeople(); }
  if(a.id === "ref-otd") markToday();
  if(a.id === "ref-plans") renderPlans();
  if(a.id === "ref-tree"){ var first = $(".tb[data-t='apostolic']"); if(first && !$("#treeCard h4")) showBranch("apostolic"); }
  if(a.id === "ref-notebook") setTimeout(addCardButtons, 60);
  addCardButtons(); syncPlanNote();
}
addEventListener("hashchange", function(){ setTimeout(onRoute, 40); });
setTimeout(onRoute, 150);
})();
