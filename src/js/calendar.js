(function(){
"use strict";
/* Saints and feasts (#ref-calendar) and the saint of the day on the home page. Data: data/SAINTS.json.
   Fixed feasts: [month, day, name, traditions, note, link]. Movable: [base, offset, name, traditions, note, link]
   where base is W (Western Easter), E (Orthodox Pascha), SUN ("month-nth-weekday": nth Sunday of a month) or ADV (Advent Sunday). */
var S = window.__SAINTS__, X = (window.__X__ || {}).people || {};
var $ = function(s,r){return (r||document).querySelector(s)};
var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]}); }
function get(k,d){ try{ var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } }
function put(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
if(!S) return;
var MON = ["January","February","March","April","May","June","July","August","September","October","November","December"];
var TR = {R:["Roman","Roman Catholic"], B:["Byzantine","Orthodox and Byzantine Catholic"], M:["Maronite","Maronite"], A:["Anglican","Church of England"]};
var DEF = {catholic:"R", orthodox:"B", anglican:"A"}[get("hcc.trad","")] || "";
var st = get("hcc.cal", {t: DEF, y: 0});

/* ---------- dates ---------- */
function westernEaster(y){ // anonymous Gregorian algorithm
  var a = y%19, b = Math.floor(y/100), c = y%100, d = Math.floor(b/4), e = b%4, f = Math.floor((b+8)/25), g = Math.floor((b-f+1)/3),
      h = (19*a+b-d-g+15)%30, i = Math.floor(c/4), k = c%4, l = (32+2*e+2*i-h-k)%7, m = Math.floor((a+11*h+22*l)/451),
      mo = Math.floor((h+l-7*m+114)/31), da = ((h+l-7*m+114)%31)+1;
  return new Date(y, mo-1, da);
}
function julianShift(y){ return Math.floor(y/100) - Math.floor(y/400) - 2; } // days the Julian calendar lags (13 in 1900–2099)
function orthodoxEaster(y){ // Meeus' Julian algorithm, converted to the civil (Gregorian) date
  var a = y%4, b = y%7, c = y%19, d = (19*c+15)%30, e = (2*a+4*b-d+34)%7, mo = Math.floor((d+e+114)/31), da = ((d+e+114)%31)+1;
  return new Date(y, mo-1, da + julianShift(y));
}
function addDays(dt, n){ return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()+n); }
function nthSunday(y, m, n){ var d = new Date(y, m-1, 1); d = addDays(d, (7 - d.getDay()) % 7); return addDays(d, 7*(n-1)); }
function adventSunday(y){ var xmas = new Date(y, 11, 25), back = xmas.getDay() || 7; return addDays(xmas, -back - 21); }
function movable(y){
  var W = westernEaster(y), E = orthodoxEaster(y), A = adventSunday(y);
  return S.movable.map(function(r){
    var d = r[0] === "W" ? addDays(W, r[1]) : r[0] === "E" ? addDays(E, r[1]) : r[0] === "ADV" ? addDays(A, r[1]) :
            (function(p){ p = p.split("-").map(Number); return nthSunday(y, p[0], p[1]); })(r[1]);
    return {d: d, n: r[2], t: r[3], note: r[4], link: r[5] || ""};
  }).sort(function(a, b){ return a.d - b.d; });
}
function fmt(d, wd){ return (wd ? ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()] + " " : "") + d.getDate() + " " + MON[d.getMonth()].slice(0, 3); }
function same(a, b){ return a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

/* ---------- links ---------- */
function href(link){ if(!link) return ""; if(link.indexOf("p-") === 0) return X[link] ? "#" + X[link].link : ""; return "#" + link; }
function tags(t){ return t.split("").map(function(c){ return '<span class="cal-tag t-'+c+'" title="'+esc(TR[c][1])+'">'+esc(TR[c][0])+'</span>'; }).join(""); }
function row(dateLabel, r){
  var h = href(r.link), old = r.t.indexOf("B") >= 0 && r.d && r.fixed ? addDays(r.d, julianShift(r.d.getFullYear())) : null;
  return '<li class="cal-row'+(r.today ? " today" : "")+'"><b class="cal-d">'+esc(dateLabel)+'</b><div><p class="cal-n">'+(h ? '<a href="'+h+'">'+esc(r.n)+'</a>' : esc(r.n))+'</p>' +
    (r.note ? '<p class="cal-note">'+esc(r.note)+'</p>' : "") + '<p class="cal-tags">'+tags(r.t)+(old ? '<span class="cal-old">Old Calendar: '+esc(fmt(old))+'</span>' : "")+'</p></div></li>';
}
function pass(t){ return !st.t || t.indexOf(st.t) >= 0; }
function fixedOn(d){ return S.fixed.filter(function(r){ return r[0] === d.getMonth()+1 && r[1] === d.getDate(); }).map(function(r){ return {d: new Date(d.getFullYear(), r[0]-1, r[1]), n: r[2], t: r[3], note: r[4], link: r[5], fixed: 1}; }); }
function on(d){ var y = d.getFullYear(); return fixedOn(d).concat(movable(y).filter(function(m){ return same(m.d, d); })); }

/* ---------- the page ---------- */
var mount = $("#calMount");
function render(){
  if(!mount) return;
  var now = new Date(), y = st.y || now.getFullYear(), today = on(now).filter(function(r){ return pass(r.t); });
  var h = '<div class="cal-bar" role="group" aria-label="Tradition"><button type="button" class="chip" data-ct="" aria-pressed="'+(!st.t)+'">All traditions</button>' +
    Object.keys(TR).map(function(k){ return '<button type="button" class="chip" data-ct="'+k+'" aria-pressed="'+(st.t === k)+'">'+esc(TR[k][0])+'</button>'; }).join("") + '</div>';
  h += '<section class="cal-today" aria-label="Today"><p class="shelf-h"><span>Today</span> · '+esc(fmt(now, true))+'</p>' + (today.length ? '<ul class="cal-list">' + today.map(function(r){ r.today = 1; return row(fmt(r.d), r); }).join("") + '</ul>' :
    '<p class="cal-empty">No commemoration from this list today'+(st.t ? ' in the '+esc(TR[st.t][0])+' calendar' : "")+'. ' + nextLabel(now) + '</p>') + '</section>';
  var mv = movable(y).filter(function(r){ return pass(r.t); });
  h += '<section class="cal-mv"><div class="cal-mvh"><h3>Movable feasts</h3><label class="cal-y">Year <input type="number" id="calY" min="1583" max="4099" value="'+y+'" inputmode="numeric"></label></div>' +
    '<p class="cal-sum">Easter '+esc(fmt(westernEaster(y)))+' · Orthodox Pascha '+esc(fmt(orthodoxEaster(y)))+(same(westernEaster(y), orthodoxEaster(y)) ? " (the same day this year)" : "")+'</p>' +
    '<ul class="cal-list">' + mv.map(function(r){ return row(fmt(r.d, true), r); }).join("") + '</ul></section>';
  h += '<nav class="cal-months" aria-label="Months">' + MON.map(function(m, i){ return '<a href="#ref-calendar~m'+(i+1)+'" data-cm="'+(i+1)+'">'+m.slice(0,3)+'</a>'; }).join("") + '</nav>';
  MON.forEach(function(m, i){
    var rows = S.fixed.filter(function(r){ return r[0] === i+1 && pass(r[3]); });
    h += '<section class="cal-m" id="calM'+(i+1)+'"><h3>'+m+'</h3>' + (rows.length ? '<ul class="cal-list">' + rows.map(function(r){
      var d = new Date(y, r[0]-1, r[1]); return row(fmt(d), {d: d, n: r[2], t: r[3], note: r[4], link: r[5], fixed: 1, today: same(d, now) && y === now.getFullYear()});
    }).join("") + '</ul>' : '<p class="cal-empty">Nothing listed for this tradition.</p>') + '</section>';
  });
  h += '<p class="cal-cite">'+esc(S.note)+'</p>';
  mount.innerHTML = h;
}
function nextLabel(now){
  for(var i = 1; i < 30; i++){ var d = addDays(now, i), r = on(d).filter(function(x){ return pass(x.t); }); if(r.length) return 'Next: <b>'+esc(r[0].n)+'</b>, '+esc(fmt(d, true))+'.'; }
  return "";
}
if(mount){
  mount.addEventListener("click", function(e){
    var b = e.target.closest("[data-ct]"); if(b){ st.t = b.dataset.ct; put("hcc.cal", st); render(); return; }
    var m = e.target.closest("[data-cm]"); if(m){ e.preventDefault(); var s = $("#calM"+m.dataset.cm); if(s) s.scrollIntoView({block: "start"}); }
  });
  mount.addEventListener("change", function(e){ if(e.target.id === "calY"){ var v = +e.target.value; if(v >= 1583 && v <= 4099){ st.y = v === new Date().getFullYear() ? 0 : v; put("hcc.cal", st); render(); } } });
}
var drawn = false;
function route(){ if(location.hash.indexOf("#ref-calendar") === 0 && !drawn){ drawn = true; render(); } }
addEventListener("hashchange", function(){ setTimeout(route, 30); }); setTimeout(route, 60);

/* ---------- home: saint of the day ---------- */
function mountHome(){
  var sh = $(".shelves"); if(!sh || $(".cal-home", sh)) return;
  var now = new Date(), list = on(now), mine = list.filter(function(r){ return pass(r.t); });
  if(mine.length) list = mine;
  var box = document.createElement("section"); box.className = "cal-home"; box.setAttribute("aria-label", "Saints and feasts today");
  box.innerHTML = '<p class="shelf-h">Today in the Church’s year</p>' + (list.length ? '<ul>' + list.slice(0, 4).map(function(r){ var h = href(r.link);
    return '<li><b>'+(h ? '<a href="'+h+'">'+esc(r.n)+'</a>' : esc(r.n))+'</b> '+tags(r.t)+'</li>'; }).join("") + '</ul>' : '<p class="cal-empty">'+nextLabel(now)+'</p>') +
    '<a class="more" href="#ref-calendar">Saints and feasts →</a>';
  var o = $(".otd", sh); sh.insertBefore(box, o ? o.nextSibling : sh.firstChild);
}
mountHome(); setTimeout(mountHome, 700);
addEventListener("hashchange", function(){ setTimeout(mountHome, 90); });
window.HCCCalendar = {easter: westernEaster, pascha: orthodoxEaster, on: on};
})();
