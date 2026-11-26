(function(){
"use strict";
var D = window.__DATA__;
var $ = function(s,r){return (r||document).querySelector(s)};
var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var store = {get:function(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}, set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
var articles = $$("main article");
var byId = {}; articles.forEach(function(a){byId[a.id]=a});
var order = D.order;

/* ---------- Routing ---------- */
var current = null;
function articleFor(id){
  if(byId[id]) return byId[id];
  var tl = String(id).indexOf("~"); if(tl > 0 && byId[id.slice(0, tl)]) return byId[id.slice(0, tl)];
  var el = document.getElementById(id);
  if(el){ var a = el.closest("article"); if(a) return a; }
  return null;
}
function show(id, scrollTarget){
  var a = articleFor(id) || byId.home;
  if(current !== a){
    if(current) current.classList.remove("active");
    a.classList.add("active"); current = a;
    document.title = a.dataset.title + " · History of the Christian Church";
    $$(".toc a, .navlist a").forEach(function(l){ if(l.getAttribute("href")==="#"+a.id) l.setAttribute("aria-current","page"); else l.removeAttribute("aria-current"); });
    var cur = $('.toc a[href="#'+a.id+'"]'); if(cur){ var det=cur.closest("details"); if(det) det.open=true; }
    updateBookmarkBtn(); renderLazy(a);
  }
  var target = (scrollTarget && document.getElementById(scrollTarget) && document.getElementById(scrollTarget)!==a) ? document.getElementById(scrollTarget) : null;
  if(document.body.classList.contains("showall")) target = target || a;
  if(target){ target.scrollIntoView({block:"start"}); window.scrollBy(0,-70); } else window.scrollTo(0,0);
  document.body.classList.remove("navopen");
  hidePop();
}
function hashId(){ var h = location.hash.slice(1); try{ h = decodeURIComponent(h); }catch(e){} return h; }
function route(){ var h = hashId() || "home"; show(h, h); }
window.addEventListener("hashchange", route);
document.addEventListener("click", function(e){
  var l = e.target.closest('a[href^="#"]');
  if(!l) return;
  var h = l.getAttribute("href").slice(1);
  if(h && h === location.hash.slice(1)){ e.preventDefault(); show(h,h); }
});

/* ---------- Pager ---------- */
articles.forEach(function(a){
  var i = order.indexOf(a.id); if(i<0) return;
  var p = document.createElement("nav"); p.className="pager"; p.setAttribute("aria-label","Chapter navigation");
  var prev = order[i-1], next = order[i+1];
  p.innerHTML = (prev?'<a class="prev" href="#'+prev+'"><span>← Previous</span>'+esc(byId[prev].dataset.title)+'</a>':'<span></span>') +
                (next?'<a class="next" href="#'+next+'"><span>Next →</span>'+esc(byId[next].dataset.title)+'</a>':'<span></span>');
  a.appendChild(p);
});
document.addEventListener("keydown", function(e){
  if(e.target.matches("input,textarea")) { if(e.key==="Escape"){ e.target.blur(); hideResults(); } return; }
  if(e.key==="/"){ e.preventDefault(); $("#q").focus(); }
  else if(e.key==="Escape"){ hidePop(); document.body.classList.remove("navopen"); }
  else if(e.key==="]" || e.key==="["){ var i=order.indexOf(current.id); var t=order[i+(e.key==="]"?1:-1)]; if(t) location.hash=t; }
});

/* ---------- Progress ---------- */
var prog = $(".progress");
window.addEventListener("scroll", function(){
  var h = document.documentElement; var max = h.scrollHeight - h.clientHeight;
  prog.style.width = (max>0 ? (h.scrollTop/max*100) : 0) + "%";
}, {passive:true});

/* ---------- Sidebar tabs & mobile ---------- */
$$(".navtabs button").forEach(function(b){
  b.addEventListener("click", function(){
    $$(".navtabs button").forEach(function(x){x.setAttribute("aria-selected", x===b?"true":"false")});
    $$(".navpane").forEach(function(p){ p.hidden = p.id !== b.getAttribute("aria-controls"); });
    if(b.getAttribute("aria-controls")==="pane-marks") renderMarks();
  });
});
$("#menuBtn").addEventListener("click", function(){ document.body.classList.toggle("navopen"); });
$(".scrim").addEventListener("click", function(){ document.body.classList.remove("navopen"); });
$$(".era button").forEach(function(b){ b.addEventListener("click", function(){ var u=b.nextElementSibling; u.hidden=!u.hidden; b.setAttribute("aria-expanded", String(!u.hidden)); }); });

/* ---------- Show all / theme ---------- */
$("#allBtn").addEventListener("click", function(){
  var on = !document.body.classList.contains("showall");
  document.body.classList.toggle("showall", on); this.setAttribute("aria-pressed", String(on));
  if(on) articles.forEach(renderLazy);
  show(current.id, current.id);
});
$("#themeBtn").addEventListener("click", function(){
  var r=document.documentElement; var dark = r.getAttribute("data-theme")==="dark" || (!r.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
  r.setAttribute("data-theme", dark?"light":"dark"); store.set("theme", dark?"light":"dark");
});
(function(){ var t=store.get("theme",null); if(t) document.documentElement.setAttribute("data-theme",t); })();

/* ---------- Bookmarks ---------- */
function marks(){ return store.get("marks", []); }
function updateBookmarkBtn(){ var b=$("#markBtn"); var on = marks().indexOf(current.id)>=0; b.setAttribute("aria-pressed", String(on)); b.querySelector("span").textContent = on?"★":"☆"; b.title = on?"Remove bookmark":"Bookmark this chapter"; }
$("#markBtn").addEventListener("click", function(){ var m=marks(); var i=m.indexOf(current.id); if(i>=0) m.splice(i,1); else m.push(current.id); store.set("marks",m); updateBookmarkBtn(); renderMarks(); });
function renderMarks(){
  var m = marks(), ul = $("#marksList");
  ul.innerHTML = m.length ? m.filter(function(id){return byId[id]}).map(function(id){return '<li><a href="#'+id+'">'+esc(byId[id].dataset.title)+'</a></li>'}).join("") : '<li style="padding:6px 16px;color:var(--muted)">No bookmarks yet. Use ☆ in the top bar to save a chapter in this browser.</li>';
}

/* ---------- Popover (glossary, notes, evidence) ---------- */
var pop = $("#pop"); var popFor = null;
function hidePop(){ pop.hidden = true; popFor = null; }
function showPop(anchor, html){
  pop.innerHTML = '<button class="x" aria-label="Close">×</button>' + html; pop.hidden = false; popFor = anchor;
  var r = anchor.getBoundingClientRect(); var pw = Math.min(380, window.innerWidth-24);
  pop.style.maxWidth = pw+"px";
  var left = Math.max(12, Math.min(r.left, window.innerWidth - pw - 12));
  pop.style.left = left+"px"; pop.style.top = "0px";
  var ph = pop.offsetHeight; var top = r.bottom + 8;
  if(top + ph > window.innerHeight - 8) top = Math.max(64, r.top - ph - 8);
  pop.style.top = top+"px";
  pop.querySelector(".x").onclick = hidePop;
}
document.addEventListener("click", function(e){
  var g = e.target.closest(".gl, .ev, sup.fn a");
  if(g){
    e.preventDefault();
    if(popFor === g){ hidePop(); return; }
    if(g.classList.contains("gl")){
      var t = g.dataset.term, def = D.glossary[t];
      if(def) showPop(g, '<h5>'+esc(t.charAt(0).toUpperCase()+t.slice(1))+'</h5><div>'+def[0]+'</div>' + (def[1]?'<p style="margin:.5em 0 0"><a href="#'+def[1]+'">Read more →</a> · <a href="#ref-glossary">Glossary</a></p>':''));
    } else if(g.classList.contains("ev")){
      var k = g.dataset.ev; showPop(g, '<h5>'+esc(D.ev[k][0])+'</h5><div>'+esc(D.ev[k][1])+'</div><p style="margin:.5em 0 0"><a href="#home">About the labels →</a></p>');
    } else {
      var n = document.getElementById(g.getAttribute("href").slice(1));
      if(n) showPop(g, '<h5>Note '+esc(g.textContent)+'</h5><div>'+n.querySelector(".nt").innerHTML+'</div>');
    }
    return;
  }
  if(!e.target.closest("#pop")) hidePop();
  if(!e.target.closest(".searchbox")) hideResults();
});
window.addEventListener("scroll", function(){ if(popFor) hidePop(); }, {passive:true});

/* ---------- Search ---------- */
var q = $("#q"), res = $("#results"); var sel = -1;
function hideResults(){ res.hidden = true; sel=-1; }
function norm(s){ return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,""); }
var IDX = D.search.map(function(d){ return {d:d, t:norm(d.t), b:norm(d.b)}; });
function search(str){
  var terms = norm(str).split(/\s+/).filter(function(x){return x.length>1});
  if(!terms.length) return [];
  var out = [];
  IDX.forEach(function(e){
    var score = 0, ok = true;
    terms.forEach(function(t){
      var inT = e.t.indexOf(t)>=0; var c = 0, i = e.b.indexOf(t);
      if(!inT && i<0){ ok=false; return; }
      while(i>=0 && c<50){ c++; i = e.b.indexOf(t, i+t.length); }
      score += (inT?25:0) + c;
    });
    if(ok) out.push({e:e, s:score + (e.d.k==="Chapter"?2:0)});
  });
  out.sort(function(a,b){return b.s-a.s});
  return out.slice(0,25).map(function(o){
    var b = o.e.d.b, nb = o.e.b, t = terms[0], i = nb.indexOf(t);
    var snip = i<0 ? b.slice(0,140) : (i>60?"…":"") + b.slice(Math.max(0,i-60), i+100) + "…";
    terms.forEach(function(tt){ snip = snip.replace(new RegExp("("+tt.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+")","ig"), "\u0001$1\u0002"); });
    return '<a href="#'+o.e.d.id+'"><span class="rk">'+esc(o.e.d.k)+'</span><span class="rt">'+esc(o.e.d.title)+'</span><span class="rs">'+esc(snip).replace(/\u0001/g,"<mark>").replace(/\u0002/g,"</mark>")+'</span></a>';
  });
}
q.addEventListener("input", function(){
  if(!q.value.trim()){ hideResults(); return; }
  sel = -1;
  if(window.__SX__) return;   /* the grouped, typo-tolerant search renders the results */
  var r = search(q.value);
  res.innerHTML = r.length ? r.join("") : '<div style="padding:12px;color:var(--muted)">No matches. Try another spelling (e.g. “Theotokos”, “Chalcedon”, “Photius”).</div>';
  res.hidden = false;
});
q.addEventListener("keydown", function(e){
  var items = $$("#results a"); if(!items.length) return;
  if(e.key==="ArrowDown"||e.key==="ArrowUp"){ e.preventDefault(); sel = (sel + (e.key==="ArrowDown"?1:-1) + items.length) % items.length; items.forEach(function(x,i){x.classList.toggle("on", i===sel)}); items[sel].scrollIntoView({block:"nearest"}); }
  else if(e.key==="Enter"){ e.preventDefault(); (items[sel]||items[0]).click(); hideResults(); q.blur(); }
});
res.addEventListener("click", function(e){ if(e.target.closest("a")){ hideResults(); q.blur(); } });

/* ---------- Generic chip filters ---------- */
function chipGroup(container, items, onChange, multi){
  container.innerHTML += items.map(function(it){ return '<button class="chip" type="button" aria-pressed="'+(it.on?"true":"false")+'" data-v="'+esc(it.v)+'">'+(it.c?'<span class="sw" style="background:'+it.c+'"></span>':'')+esc(it.l)+'</button>'; }).join("");
  container.addEventListener("click", function(e){
    var b = e.target.closest(".chip"); if(!b) return;
    if(multi){ b.setAttribute("aria-pressed", b.getAttribute("aria-pressed")==="true"?"false":"true"); }
    else { $$(".chip", container).forEach(function(x){ x.setAttribute("aria-pressed", x===b?"true":"false"); }); }
    onChange($$('.chip[aria-pressed="true"]', container).map(function(x){return x.dataset.v}));
  });
}

/* ---------- Lazy renderers for interactive pieces ---------- */
var done = {};
function renderLazy(a){
  if(done[a.id]) return; done[a.id]=true;
  if($("#diagram-families", a)) drawFamilies($("#diagram-families", a));
  if($("#diagram-pentarchy", a)) drawPentarchy($("#diagram-pentarchy", a));
  if($("#diagram-filioque", a)) drawFilioque($("#diagram-filioque", a));
  if($("#atlas", a)) initAtlas();
  if($("#tl", a)) initTimeline();
  if($("#cmp-table", a)) initCompare();
  if($("#ctable", a)) initCouncils();
  if($("#pfilter", a)) initListFilter("#pfilter", ".person");
  if($("#gfilter", a)) initListFilter("#gfilter", ".gterm");
  if($("#bibbar", a)) initBib();
  if($("#regbar", a)) initRegister();
  if($("#mx", a)) initMatrix();
  if($("#chart-demo", a)) drawDemo($("#chart-demo", a));
}
function initListFilter(inp, sel){
  $(inp).addEventListener("input", function(){ var v = norm(this.value); $$(sel).forEach(function(el){ el.hidden = v && norm(el.textContent).indexOf(v)<0; }); });
}
function initCompare(){
  var bar = $('.filterbar[data-filter-for="cmp-table"]');
  var rows = $$("#cmp-table .cmp-row");
  var items = [{v:"all",l:"All topics",on:true}].concat(rows.map(function(r){ return {v:r.dataset.key, l:r.querySelector("h4").textContent.replace(/^\d+\.\s*/,"")}; }));
  chipGroup(bar, items, function(v){ rows.forEach(function(r){ r.hidden = !(v[0]==="all" || v.indexOf(r.dataset.key)>=0); }); }, false);
}
function initCouncils(){
  var bar = $("#cbar"); var t = $("#ctable");
  chipGroup(bar, [{v:"all",l:"All traditions",on:true}].concat(D.trad.map(function(x){return {v:x[0],l:x[1]}})), function(v){
    var k = v[0];
    $$("th[data-t],td[data-t]", t).forEach(function(c){ c.classList.toggle("dim", k!=="all" && c.dataset.t!==k); });
    $$("tbody tr", t).forEach(function(r){ r.hidden = false; });
  }, false);
  $("#conly").addEventListener("change", function(){
    var on = this.checked; var k = ($('#cbar .chip[aria-pressed="true"]')||{}).dataset; k = k? k.v : "all";
    $$("tbody tr", t).forEach(function(r){ if(!on || k==="all"){ r.hidden=false; return; } var c = r.querySelector('td[data-t="'+k+'"]'); r.hidden = !(c && c.dataset.c==="E"); });
  });
}
function initBib(){
  var bar = $("#bibbar"); var state = {cat:"all", top:"all", txt:""};
  function apply(){ $$(".bibentry").forEach(function(e){ e.hidden = !((state.cat==="all"||e.dataset.cat===state.cat) && (state.top==="all"||(" "+e.dataset.top+" ").indexOf(" "+state.top+" ")>=0) && (!state.txt || norm(e.textContent).indexOf(state.txt)>=0)); }); }
  chipGroup($("#bibcat"), [{v:"all",l:"All types",on:true}].concat(D.bibcat.map(function(c){return {v:c[0],l:c[1]}})), function(v){ state.cat=v[0]; apply(); }, false);
  chipGroup($("#bibtop"), [{v:"all",l:"All topics",on:true}].concat(D.bibtop.map(function(c){return {v:c,l:D.topicNames[c]||c}})), function(v){ state.top=v[0]; apply(); }, false);
  $("#bibq").addEventListener("input", function(){ state.txt = norm(this.value); apply(); });
}
function initRegister(){
  chipGroup($("#regbar"), [{v:"all",l:"All",on:true}].concat(Object.keys(D.status).map(function(k){return {v:k,l:D.status[k]}})), function(v){ $$(".regrow").forEach(function(r){ r.hidden = !(v[0]==="all"||r.dataset.s===v[0]); }); }, false);
}

function initMatrix(){
  var t = $("#mx"); var def = ["C","EO","OO","Luth","Angl","Ref","Bapt","Pent"];
  function applyT(v){ $$("th[data-t],td[data-t]", t).forEach(function(c){ c.style.display = v.indexOf(c.dataset.t)>=0 ? "" : "none"; }); }
  chipGroup($("#mxtrad"), D.mxtrad.map(function(x){return {v:x[0], l:x[1], on: def.indexOf(x[0])>=0}}), applyT, true);
  applyT(def);
  chipGroup($("#mxtopic"), [{v:"all",l:"All topics",on:true}].concat(D.mxtopics.map(function(x){return {v:x[0],l:x[1]}})), function(v){ $$("tbody tr", t).forEach(function(r){ r.hidden = !(v[0]==="all" || r.dataset.key===v[0]); }); }, false);
}
function drawDemo(el){
  var data=[["Sub-Saharan Africa",31],["Europe",22],["All other regions (combined)",47]];
  var W=640,H=150,x0=210,x1=600; var s='<svg viewBox="0 0 '+W+' '+H+'">';
  [0,25,50].forEach(function(v){ var x=x0+(x1-x0)*v/50; s+='<line x1="'+x+'" x2="'+x+'" y1="10" y2="120" stroke="var(--rule)"/><text x="'+x+'" y="138" text-anchor="middle" font-size="11" class="muted">'+v+'%</text>'; });
  data.forEach(function(d,i){ var y=18+i*34, w=(x1-x0)*d[1]/50; s+='<text x="'+(x0-8)+'" y="'+(y+15)+'" text-anchor="end" font-size="12">'+d[0]+'</text><rect x="'+x0+'" y="'+y+'" width="'+w+'" height="22" rx="3" fill="'+(i<2?"var(--porphyry)":"var(--muted)")+'"/><text x="'+(x0+w+6)+'" y="'+(y+15)+'" font-size="12" font-weight="700">'+d[1]+'%</text>'; });
  el.innerHTML = s+'</svg>';
}
/* ---------- Timeline ---------- */
function initTimeline(){
  var T = D.timeline, tracks = D.tracks, colors = D.trackColors;
  var strip = $("#tlstrip"), list = $("#tl"); var min=-800, max=2040;
  var ticks = [-600,-300,1,300,600,900,1200,1500,1800];
  var html = ticks.map(function(y){ return '<span class="tick" style="left:'+((y-min)/(max-min)*100)+'%">'+(y<0?(-y)+' BC':y===1?'AD 1':y)+'</span>'; }).join("");
  T.forEach(function(e,i){ html += '<button type="button" title="'+esc(e[1]+': '+e[2].replace(/<[^>]+>/g,""))+'" aria-label="'+esc(e[1])+'" data-i="'+i+'" data-k="'+e[3]+'" style="left:calc('+((e[0]-min)/(max-min)*100)+'% - 2px);background:'+colors[e[3]]+'"></button>'; });
  strip.innerHTML = html;
  var cent = null, lh = "";
  T.forEach(function(e,i){
    var bc = e[0] < 0; var c = bc ? Math.floor((-e[0]-1)/100)+1 : Math.floor((e[0]-1)/100)+1; if(!bc && e[0]<=0) c=1;
    var sfx = (c%10===1&&c%100!==11)?"st":(c%10===2&&c%100!==12)?"nd":(c%10===3&&c%100!==13)?"rd":"th";
    var lab = c + sfx + " century" + (bc?" BC":"");
    if(lab!==cent){ lh += '<li class="tl-c" style="display:block;border:0"><div class="tl-century">'+lab+'</div></li>'; cent=lab; }
    lh += '<li id="tl-'+i+'" data-k="'+e[3]+'"><div><div class="tl-year">'+e[1]+'</div><div class="tl-track" style="color:'+colors[e[3]]+'">'+esc(tracks[e[3]])+'</div></div><div>'+e[2]+' <a href="#'+e[4]+'">Read →</a></div></li>';
  });
  list.innerHTML = lh;
  strip.addEventListener("click", function(e){ var b=e.target.closest("button"); if(!b) return; var li=$("#tl-"+b.dataset.i); li.hidden=false; li.scrollIntoView({block:"center"}); li.style.background="var(--wash)"; setTimeout(function(){li.style.background=""},1500); });
  chipGroup($("#tlbar"), Object.keys(tracks).map(function(k){return {v:k,l:tracks[k],c:colors[k],on:true}}), function(v){
    $$("li[data-k]", list).forEach(function(li){ li.hidden = v.indexOf(li.dataset.k)<0; });
    $$("button", strip).forEach(function(b){ b.style.opacity = v.indexOf(b.dataset.k)<0 ? .12 : 1; });
  }, true);
}

/* ---------- Atlas ---------- */
var KIND = {early:["Apostolic & early Church","#0e7490"],later:["Medieval & modern","#b45309"],see:["Patriarchal sees","var(--porphyry)"],council:["Council sites","var(--lapis)"],east:["Eastern Churches & Syriac world","var(--gold)"],west:["Latin West","var(--ev-doc)"],monastic:["Monastic centres","var(--ev-trad)"]};
var LABEL_OFF = {"Chalcedon":[8,14],"Constantinople":[8,-8],"Nicaea":[8,12],"Seleucia-Ctesiphon":[8,12],"Baghdad":[-56,-6],"Edessa":[-46,-6],"Nisibis":[8,-6],"Vagharshapat (Etchmiadzin)":[8,-8],"Dvin":[8,12],"Mtskheta":[8,-4],"Ephesus":[-54,4],"Damascus":[8,10],"Jerusalem":[-62,4],"Antioch":[8,-6],"Mopsuestia":[-74,-6],"Aachen":[8,-6],"Frankfurt":[8,10],"Florence":[8,10],"Ravenna":[8,-6],"Venice":[8,-8],"Milan":[-36,-6],"Lyon":[-30,-6],"Arles":[-34,10],"Bari":[8,8],"Civitate":[-50,-8],"Rome":[-34,12],"Caesarea (Cappadocia)":[8,-6],"Maragha":[8,-6],"Merv":[8,12],"Herat":[8,10],"Gundeshapur":[8,12],"Rev-Ardashir (Fars)":[8,12]};
function initAtlas(){
  var box = $("#mapbox"), info = $("#mapinfo"); var which = "med"; var on = Object.keys(KIND);
  function draw(){
    var M = D.maps[which];
    var s = '<svg viewBox="0 0 '+M.W+' '+M.H+'" role="img" aria-label="Map: '+({med:"Mediterranean and Near East",levant:"Holy Land and Syria",asia:"Church of the East across Asia"})[which]+'"><path class="grat" d="'+M.grat+'"/><path class="land" d="'+M.land+'"/>';
    M.places.forEach(function(p,i){
      var o = LABEL_OFF[p.n] || [8,4];
      s += '<g class="mk'+(on.indexOf(p.k)<0?' off':'')+'" data-i="'+i+'" tabindex="0" role="button" aria-label="'+esc(p.n)+'"><circle cx="'+p.x+'" cy="'+p.y+'" r="6" fill="'+KIND[p.k][1]+'"/><text x="'+(p.x+o[0])+'" y="'+(p.y+o[1])+'">'+esc(p.n)+'</text></g>';
    });
    box.innerHTML = s + '</svg>';
    info.innerHTML = '<h4>'+({med:"The Mediterranean and Near East",levant:"Holy Land and Syria",asia:"The Church of the East across Asia"})[which]+'</h4><p>Select a place on the map for its history in this period. Coastlines are modern; no ancient borders are drawn, because most were fluid and are reconstructed with uncertainty.</p><p class="caption">Base map: Natural Earth (public domain). Locations are approximate for sites without a modern city.</p>';
  }
  function pick(g){
    $$(".mk", box).forEach(function(x){x.classList.toggle("sel", x===g)});
    var p = D.maps[which].places[+g.dataset.i];
    info.innerHTML = '<p class="eyebrow">'+esc(KIND[p.k][0])+'</p><h4>'+esc(p.n)+'</h4><p>'+esc(p.t)+'</p><p><a href="#'+p.s+'">Read the chapter →</a></p>';
  }
  box.addEventListener("click", function(e){ var g=e.target.closest(".mk"); if(g) pick(g); });
  box.addEventListener("keydown", function(e){ var g=e.target.closest(".mk"); if(g && (e.key==="Enter"||e.key===" ")){ e.preventDefault(); pick(g); } });
  chipGroup($("#mapsel"), [{v:"med",l:"Mediterranean & Near East",on:true},{v:"levant",l:"Holy Land & Syria (detail)"},{v:"asia",l:"Asia (Church of the East)"}], function(v){ which=v[0]; draw(); }, false);
  chipGroup($("#maplayers"), Object.keys(KIND).map(function(k){return {v:k,l:KIND[k][0],c:KIND[k][1],on:true}}), function(v){ on=v; $$(".mk",box).forEach(function(g){ var p=D.maps[which].places[+g.dataset.i]; g.classList.toggle("off", on.indexOf(p.k)<0); }); }, true);
  draw();
}

/* ---------- Diagrams ---------- */
function drawFamilies(el){
  var W=1000,H=330, x0=150, x1=980, y0=1500;
  function X(y){ return x0 + (Math.min(y,2026)-300)/(2026-300)*(x1-x0); }
  var lanes = [
    {n:"Church of the East", y:50, c:"var(--gold)", from:410, to:486, note:"Separate jurisdiction 410–424; dyophysite synod 486; outside Ephesus (431)"},
    {n:"Oriental Orthodox", y:120, c:"var(--ev-trad)", from:451, to:580, note:"Rejection of Chalcedon from 451; separate hierarchy c. 518–580"},
    {n:"Eastern Orthodox", y:190, c:"var(--porphyry)", from:1054, to:1484, note:"Estrangement: 1054 (persons), 1204 (sack), 1484 (Florence rejected)"},
    {n:"Catholic", y:260, c:"var(--lapis)", from:1054, to:1484, note:"Same zone, seen from the West; 1965 lifting of excommunications"}
  ];
  var s = '<svg viewBox="0 0 '+W+' '+H+'"><defs>';
  lanes.forEach(function(l,i){ s += '<linearGradient id="fg'+i+'" x1="0" x2="1"><stop offset="0" stop-color="'+l.c+'" stop-opacity="0"/><stop offset="1" stop-color="'+l.c+'" stop-opacity=".9"/></linearGradient>'; });
  s += '</defs>';
  [300,451,600,800,1000,1054,1204,1453,1700,2000].forEach(function(y){ s += '<line x1="'+X(y)+'" x2="'+X(y)+'" y1="30" y2="300" stroke="var(--rule)" stroke-dasharray="2 3"/><text x="'+X(y)+'" y="320" text-anchor="middle" font-size="11" class="muted">'+y+'</text>'; });
  // common trunk
  s += '<rect x="'+X(300)+'" y="40" width="'+(X(2026)-X(300))+'" height="240" fill="none"/>';
  lanes.forEach(function(l,i){
    var a = X(l.from), b = X(l.to), e = X(2026);
    // shared communion before separation (thin neutral band)
    s += '<rect x="'+X(300)+'" y="'+(l.y+8)+'" width="'+(a-X(300))+'" height="14" fill="var(--rule)" opacity=".7"/>';
    s += '<rect x="'+a+'" y="'+(l.y+4)+'" width="'+(b-a)+'" height="22" fill="url(#fg'+i+')"><title>'+esc(l.note)+'</title></rect>';
    s += '<rect x="'+b+'" y="'+(l.y+4)+'" width="'+(e-b)+'" height="22" fill="'+l.c+'" opacity=".9"><title>'+esc(l.n)+'</title></rect>';
    s += '<text x="'+(x0-8)+'" y="'+(l.y+20)+'" text-anchor="end" font-size="12" font-weight="600">'+esc(l.n)+'</text>';
    s += '<text x="'+(a+4)+'" y="'+(l.y+40)+'" font-size="10.5" class="muted">'+esc(l.note)+'</text>';
  });
  // dialogue markers
  [[1965,"1965"],[1973,"1973"],[1990,"1990"],[1994,"1994"]].forEach(function(d){ s += '<circle cx="'+X(d[0])+'" cy="30" r="4" fill="var(--ev-doc)"/>'; });
  s += '<text x="'+(X(1965)-6)+'" y="22" text-anchor="end" font-size="10.5" class="muted">modern dialogues ●</text>';
  s += '<text x="'+X(310)+'" y="22" font-size="10.5" class="muted">Grey: shared communion (with interruptions). Gradient: zone of separation. Solid: distinct communion.</text>';
  el.innerHTML = s + '</svg>';
}
function drawPentarchy(el){
  var sees = [["Rome","1","Nicaea c. 6 (precedent); first in all lists"],["Constantinople","2","381 c. 3; 451 c. 28"],["Alexandria","3","Nicaea c. 6"],["Antioch","4","Nicaea c. 6"],["Jerusalem","5","Honour 325 c. 7; patriarchate 451"]];
  var s = '<svg viewBox="0 0 640 230">'; var cx=320, cy=112, R=82;
  sees.forEach(function(p,i){ var a = -Math.PI/2 + i*2*Math.PI/5; var x=cx+R*Math.cos(a)*1.9, y=cy+R*Math.sin(a);
    s += '<line x1="'+cx+'" y1="'+cy+'" x2="'+x+'" y2="'+y+'" stroke="var(--rule)"/>';
    s += '<circle cx="'+x+'" cy="'+y+'" r="20" fill="'+(i===0?"var(--porphyry)":i===1?"var(--lapis)":"var(--panel)")+'" stroke="var(--ink)"/><text x="'+x+'" y="'+(y+5)+'" text-anchor="middle" font-size="14" font-weight="700" fill="'+(i<2?"var(--panel)":"var(--ink)")+'">'+p[1]+'</text>';
    var tx = x + (Math.cos(a)>=0.1?26:Math.cos(a)<=-0.1?-26:0), anchor = Math.cos(a)>=0.1?"start":Math.cos(a)<=-0.1?"end":"middle", ty = y + (Math.abs(Math.cos(a))<0.1? -28:0);
    s += '<text x="'+tx+'" y="'+(ty-2)+'" text-anchor="'+anchor+'" font-size="13" font-weight="600">'+p[0]+'</text><text x="'+tx+'" y="'+(ty+13)+'" text-anchor="'+anchor+'" font-size="10.5" class="muted">'+p[2]+'</text>';
  });
  s += '<text x="'+cx+'" y="'+(cy+4)+'" text-anchor="middle" font-size="11" class="muted">order of precedence</text></svg>';
  el.innerHTML = s;
}
function drawFilioque(el){
  function tri(ox, title, sub, edges){
    var F=[ox+90,40], S=[ox+30,150], P=[ox+150,150];
    var s='<text x="'+(ox+90)+'" y="16" text-anchor="middle" font-size="12.5" font-weight="700">'+title+'</text>';
    s+='<text x="'+(ox+90)+'" y="196" text-anchor="middle" font-size="10.5" class="muted">'+sub+'</text>';
    edges.forEach(function(e){ var a=e[0],b=e[1]; s+='<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" stroke="'+(e[2]||"var(--ink)")+'" stroke-width="2" '+(e[3]?'stroke-dasharray="5 4"':'')+' marker-end="url(#arr)"/>'; });
    [[F,"Father"],[S,"Son"],[P,"Spirit"]].forEach(function(n){ s+='<circle cx="'+n[0][0]+'" cy="'+n[0][1]+'" r="20" fill="var(--panel)" stroke="var(--ink)"/><text x="'+n[0][0]+'" y="'+(n[0][1]+4)+'" text-anchor="middle" font-size="10.5" font-weight="600">'+n[1]+'</text>'; });
    return s;
  }
  function sh(a,b){ var dx=b[0]-a[0], dy=b[1]-a[1], d=Math.sqrt(dx*dx+dy*dy); return [[a[0]+dx/d*22, a[1]+dy/d*22],[b[0]-dx/d*26, b[1]-dy/d*26]]; }
  function E(a,b,c,dash){ var p=sh(a,b); return [p[0],p[1],c,dash]; }
  var s='<svg viewBox="0 0 640 210"><defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--ink)"/></marker></defs>';
  var o=[10,230,450];
  s+=tri(o[0],"“From the Father”","Orthodox: Father sole cause",[E([o[0]+90,40],[o[0]+30,150]),E([o[0]+90,40],[o[0]+150,150],"var(--porphyry)")]);
  s+=tri(o[1],"“From the Father through the Son”","Greek fathers; Blachernae 1285",[E([o[1]+90,40],[o[1]+30,150]),E([o[1]+90,40],[o[1]+150,150],"var(--porphyry)"),E([o[1]+30,150],[o[1]+150,150],"var(--muted)",true)]);
  s+=tri(o[2],"“From the Father and the Son”","Latin: as from one principle",[E([o[2]+90,40],[o[2]+30,150]),E([o[2]+90,40],[o[2]+150,150],"var(--lapis)"),E([o[2]+30,150],[o[2]+150,150],"var(--lapis)")]);
  el.innerHTML = s+'</svg>';
}

function esc(s){ return String(s).replace(/[&<>"]/g, function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]}); }

route();
renderMarks();
/* once images have loaded, re-align a link to a spot inside a chapter; never move a reader who has started scrolling */
window.addEventListener('load', function(){ setTimeout(function(){ var h = hashId(); if(h && !byId[h] && document.getElementById(h) && scrollY < 200) route(); }, 0); });
})();
