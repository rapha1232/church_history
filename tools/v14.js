/* ===================== Bible study tools (Edition 13) ===================== */
var BX = window.__BIBX__ || {};
var XMODE = {};
var LANGEN = {lxxg:1, grk:1, vul:1};
function isEnglish(src){ return !LANGEN[src]; }
function srcOf(ed, b){ var e = ED[ed]; return e && e.idx[b] != null ? e.books[e.idx[b]][1] : null; }
function normT(s){ return String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[ς]/g, "σ").replace(/[’'`]/g, "").replace(/æ/g, "ae").replace(/œ/g, "oe"); }
function ymd(d){ return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2); }
function dayDiff(a, b){ return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 864e5); }
function goEng(b, c, v){ var ed = ED[st.ed].idx[b] != null ? st.ed : edFor(b); go(ed, b, xchap(ed, b, c), v || 0); }

/* ---------- tools strip ---------- */
var tools = $("#bibTools");
function toolsMark(){ if(!tools) return; if(XMODE[mode]){ fab.hidden = true; hideAct(); } $$("[data-act]", tools).forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.act === mode ? "true" : "false"); }); }
if(tools) tools.addEventListener("click", function(e){
  var b = e.target.closest("[data-act]"); if(!b) return;
  mode = mode === b.dataset.act ? "read" : b.dataset.act; haptic("tick"); render(); toolsMark();
  window.scrollTo({top: art.getBoundingClientRect().top + scrollY - 70});
});
addEventListener("hashchange", function(){ setTimeout(toolsMark, 60); });

/* ---------- book introductions ---------- */
function introCard(b, collapsed){
  var x = (BX.intro || {})[b] || (BX.intro || {})[{ESG:"EST", DNG:"DAN"}[b]]; if(!x) return "";
  var body = '<dl class="bi-dl"><dt>Tradition</dt><dd>'+esc(x[0])+'</dd><dt>Scholarship</dt><dd>'+esc(x[1])+'</dd><dt>Date</dt><dd>'+esc(x[2])+'</dd></dl><p class="bi-sum">'+esc(x[3])+'</p>';
  var canon = M.eds.filter(function(e){ return equiv(e.id, b); }).map(function(e){ return e.short; });
  body += '<p class="bi-can"><span>In</span> '+canon.map(esc).join(" · ")+'</p>';
  return collapsed ? '<details class="bintro"><summary>About '+esc(shortName(st.ed, b))+'</summary>'+body+'</details>' : '<section class="bintro open">'+body+'</section>';
}

/* ---------- highlights, notes and bookmarks ---------- */
var NOTES = get("hcc.bnotes", {});
function nkey(ed, b, c, v){ return b + "." + engCh(ed, b, c) + "." + v; }
function noteCls(b, v){ var n = NOTES[nkey(st.ed, b, st.c, v)]; if(!n) return ""; return (n.h ? " hc-" + n.h : "") + (n.n ? " has-note" : "") + (n.k ? " has-bm" : ""); }
function saveNotes(){ put("hcc.bnotes", NOTES); countSaved(); }
var mk = document.createElement("div"); mk.className = "vs-mark";
mk.innerHTML = '<div class="vs-hcs" role="group" aria-label="Highlight colour">'+[["y","Yellow"],["g","Green"],["b","Blue"],["p","Pink"]].map(function(c){ return '<button type="button" class="hcb hc-'+c[0]+'" data-hc="'+c[0]+'" aria-label="Highlight '+c[1]+'" aria-pressed="false"></button>'; }).join("")+
  '<button type="button" class="hcb hcx" data-hc="" aria-label="Remove highlight">✕</button></div><button type="button" class="btn-sm" data-bm="1" aria-pressed="false">☆ Bookmark</button><button type="button" class="btn-sm" data-nt="1">✎ Note</button>'+
  '<div class="vs-nt" hidden><label class="vh" for="vsNote">Your note on this verse</label><textarea id="vsNote" rows="3" placeholder="Write a note…"></textarea></div>';
sheet.insertBefore(mk, $(".vs-tabs", sheet));
function curKey(){ return cur ? nkey(cur.ed, cur.b, cur.c, cur.v) : null; }
function markUI(){
  var n = NOTES[curKey()] || {};
  $$(".hcb", mk).forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.hc && b.dataset.hc === n.h ? "true" : "false"); });
  var bm = $("[data-bm]", mk); bm.setAttribute("aria-pressed", n.k ? "true" : "false"); bm.textContent = n.k ? "★ Bookmarked" : "☆ Bookmark";
  $("#vsNote", mk).value = n.n || ""; $(".vs-nt", mk).hidden = !n.n;
}
function setNote(patch){
  var k = curKey(); if(!k) return; var n = NOTES[k] || {};
  Object.keys(patch).forEach(function(x){ n[x] = patch[x]; });
  n.t = Date.now(); n.ed = cur.ed; n.txt = cur.txt; n.ref = shortName(cur.ed, cur.b) + " " + cur.c + ":" + cur.v;
  if(!n.h && !n.n && !n.k) delete NOTES[k]; else NOTES[k] = n;
  saveNotes(); markUI();
  var el = $('.bv[data-v="'+cur.v+'"]', view);
  if(el && st.b === cur.b && st.c === cur.c){ el.className = el.className.replace(/\s*(hc-\w|has-note|has-bm)/g, ""); el.className += noteCls(cur.b, cur.v); }
}
mk.addEventListener("click", function(e){
  var b = e.target.closest("button"); if(!b) return;
  if(b.dataset.hc != null){ setNote({h: b.dataset.hc}); haptic("tick"); }
  if(b.dataset.bm){ setNote({k: !(NOTES[curKey()]||{}).k}); haptic("tick"); }
  if(b.dataset.nt){ var w = $(".vs-nt", mk); w.hidden = !w.hidden; if(!w.hidden) $("#vsNote", mk).focus(); }
});
var ntT = null;
mk.addEventListener("input", function(e){ if(e.target.id !== "vsNote") return; clearTimeout(ntT); var v = e.target.value; ntT = setTimeout(function(){ setNote({n: v.trim()}); }, 400); });
function countSaved(){
  var n = Object.keys(NOTES).length, a = $("#bibSavedLink");
  var pane = $("#pane-marks");
  if(pane && !a){ a = document.createElement("a"); a.id = "bibSavedLink"; a.className = "bib-saved"; a.href = "#bible"; pane.insertBefore(a, pane.firstChild);
    a.addEventListener("click", function(){ document.body.classList.remove("navopen"); mode = "notes"; setTimeout(function(){ render(); toolsMark(); }, 50); }); }
  if(a) a.textContent = "Bible highlights and notes · " + n;
}
countSaved();
XMODE.notes = function(){
  var f = st.nf || "all", keys = Object.keys(NOTES).sort(function(a,b){ return (NOTES[b].t||0) - (NOTES[a].t||0); });
  var list = keys.filter(function(k){ var n = NOTES[k]; return f === "all" || (f === "h" && n.h) || (f === "n" && n.n) || (f === "k" && n.k); });
  view.innerHTML = '<h3 class="bib-h">Your highlights and notes</h3><div class="cm-chips" role="group" aria-label="Show">'+[["all","All"],["h","Highlights"],["n","Notes"],["k","Bookmarks"]].map(function(x){ return '<button type="button" class="chip" data-nf="'+x[0]+'" aria-pressed="'+(f===x[0])+'">'+x[1]+'</button>'; }).join("")+
    (keys.length ? '<button type="button" class="chip" data-nexp="1">Copy as text</button>' : "")+'</div>'+
    (list.length ? '<ul class="bn-list">' + list.map(function(k){ var n = NOTES[k], p = k.split(".");
      return '<li class="'+(n.h ? "hc-"+n.h : "")+'"><button type="button" class="bn-go" data-eng="'+p[0]+'~'+p[1]+'~'+p[2]+'"><b>'+esc(n.ref || k)+'</b>'+(n.k ? ' <span aria-label="bookmarked">★</span>' : "")+'<small>'+esc(ED[n.ed] ? ED[n.ed].short : "")+' · '+new Date(n.t||0).toLocaleDateString()+'</small></button><p>'+esc((n.txt||"").slice(0, 220))+'</p>'+(n.n ? '<p class="bn-n">'+esc(n.n)+'</p>' : "")+'</li>'; }).join("") + '</ul>'
      : '<p class="vs-none">Nothing here yet. Tap any verse and choose a colour, a bookmark or a note.</p>');
};
view.addEventListener("click", function(e){
  var t;
  if((t = e.target.closest("[data-nf]"))){ st.nf = t.dataset.nf; render(); return; }
  if((t = e.target.closest("[data-nexp]"))){ var txt = Object.keys(NOTES).map(function(k){ var n = NOTES[k]; return n.ref + (n.h ? " [" + n.h + "]" : "") + (n.k ? " ★" : "") + "\n“" + (n.txt||"") + "”" + (n.n ? "\nNote: " + n.n : ""); }).join("\n\n");
    try{ navigator.clipboard.writeText(txt); t.textContent = "Copied"; setTimeout(function(){ t.textContent = "Copy as text"; }, 1500); }catch(err){} return; }
  if((t = e.target.closest("[data-eng]"))){ var p = t.dataset.eng.split("~"); goEng(p[0], +p[1], +p[2]); return; }
});

/* ---------- full-Bible search ---------- */
XMODE.search = function(){
  var e = ED[st.ed];
  view.innerHTML = '<h3 class="bib-h">Search the '+esc(e.name)+'</h3><form class="bs-form" role="search"><label class="vh" for="bsQ">Words or phrase</label><input id="bsQ" type="search" placeholder="Words, or a “phrase in quotes”" value="'+esc(st.sq||"")+'" autocomplete="off" enterkeyhint="search">'+
    '<label class="vh" for="bsScope">Where</label><select id="bsScope"><option value="all">Whole Bible</option><option value="ot">Old Testament</option><option value="dc">Deuterocanon</option><option value="nt">New Testament</option><option value="b">'+esc(shortName(st.ed, st.b))+' only</option></select><button type="submit" class="btn-sm">Search</button></form><div id="bsOut" aria-live="polite"></div>';
  $("#bsScope", view).value = st.ss || "all";
  $("form", view).addEventListener("submit", function(ev){ ev.preventDefault(); st.sq = $("#bsQ", view).value.trim(); st.ss = $("#bsScope", view).value; save(); runSearch(); });
  if(st.sq) runSearch();
};
function loadEdition(ed, books, prog, done){
  var left = books.length, data = {};
  if(!left) return done(data);
  books.forEach(function(bk){ load(bk[1], bk[0], function(d){ data[bk[0]] = d; left--; prog(books.length - left, books.length); if(!left) done(data); }); });
}
function runSearch(){
  var out = $("#bsOut", view), q = st.sq, e = ED[st.ed], scope = st.ss || "all"; if(!q){ out.innerHTML = ""; return; }
  var phrase = /^".*"$|^“.*”$/.test(q), nq = normT(q.replace(/^["“]|["”]$/g, "")), words = nq.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if(!words.length) return;
  var books = e.books.filter(function(b){ return scope === "all" || (scope === "b" ? b[0] === st.b : scope === "ot" ? b[4] === "ot" : scope === "nt" ? b[4] === "nt" : (b[4] === "dc" || b[4] === "app")); });
  out.innerHTML = '<p class="cmp-note">Loading the text… <span id="bsP">0</span>/'+books.length+' books</p>';
  var my = q + scope + st.ed;
  loadEdition(st.ed, books, function(n){ var p = $("#bsP", out); if(p) p.textContent = n; }, function(data){
    if(my !== st.sq + (st.ss||"all") + st.ed) return;
    var hits = [], per = {}, total = 0;
    var res = words.map(function(w){ return new RegExp("(^|[^\\p{L}])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u"); });
    books.forEach(function(bk){
      (data[bk[0]] || []).forEach(function(ch){ ch[1].forEach(function(v){
        var n = normT(v[1]), ok = phrase ? n.indexOf(nq) >= 0 : res.every(function(r){ return r.test(n); });
        if(ok){ total++; per[bk[0]] = (per[bk[0]] || 0) + 1; if(hits.length < 400) hits.push([bk[0], ch[0], v[0], v[1]]); }
      }); });
    });
    if(!total){ out.innerHTML = '<p class="vs-none">No verses match. Try fewer words, or check the spelling'+(isEnglish(srcOf(st.ed, st.b)) ? "" : " (this edition is not in English)")+'.</p>'; return; }
    var max = Math.max.apply(null, Object.keys(per).map(function(k){ return per[k]; }));
    var dist = '<div class="bs-dist">' + books.filter(function(bk){ return per[bk[0]]; }).map(function(bk){ return '<button type="button" class="bs-bk" data-bsb="'+bk[0]+'" title="'+esc(bk[2])+': '+per[bk[0]]+'"><i style="--h:'+Math.max(6, per[bk[0]]/max*100)+'%"></i><span>'+esc(bk[2].replace(/\s*\(.*\)$/,"").replace(/^(\d) /,"$1"))+'</span><b>'+per[bk[0]]+'</b></button>'; }).join("") + '</div>';
    function hl(t){ var s = esc(t); words.forEach(function(w){ if(w.length < 2) return; var re = new RegExp("(" + w.split("").map(function(ch){ return ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[\\u0300-\\u036f]*"; }).join("") + ")", "giu"); s = s.normalize("NFD").replace(re, "<mark>$1</mark>").normalize("NFC"); }); return s; }
    out.innerHTML = '<p class="bs-sum"><b>'+total+'</b> verse'+(total>1?"s":"")+' in <b>'+Object.keys(per).length+'</b> book'+(Object.keys(per).length>1?"s":"")+(total > 400 ? " · first 400 shown" : "")+'</p>' + dist +
      '<ol class="bs-res">' + hits.map(function(h){ return '<li data-bsb="'+h[0]+'"><button type="button" data-gov="'+h[0]+'~'+h[1]+'~'+h[2]+'"><b>'+esc(shortName(st.ed, h[0]))+' '+h[1]+':'+h[2]+'</b><span>'+hl(h[3])+'</span></button></li>'; }).join("") + '</ol>';
  });
}
view.addEventListener("click", function(e){
  var t;
  if((t = e.target.closest("[data-gov]"))){ var p = t.dataset.gov.split("~"); go(st.ed, p[0], +p[1], +p[2]); return; }
  if((t = e.target.closest(".bs-bk"))){ var li = $('.bs-res li[data-bsb="'+t.dataset.bsb+'"]', view); if(li) li.scrollIntoView({block:"center", behavior:"smooth"}); else { st.ss = "b"; st.b = t.dataset.bsb; save(); XMODE.search(); } }
});

/* ---------- word study ---------- */
var CONC = {};
window.__CONC = function(k, d){ CONC[k] = d; };
var BOOKORDER = "GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SOL ISA JER LAM EZE DAN HOS JOE AMO OBA JON MIC NAH HAB ZEP HAG ZEC MAL MAT MAR LUK JOH ACT ROM 1CO 2CO GAL EPH PHI COL 1TH 2TH 1TI 2TI TIT PHM HEB JAM 1PE 2PE 1JO 2JO 3JO JUD REV".split(" ");
function wordStudy(id){
  var k = id[0] === "G" ? "g" : "h", body = $("#vsBody", sheet), me = cur;
  body.innerHTML = '<div class="bib-load"><span></span><span></span><span></span></div>';
  script("bible/conc/"+k+".js", function(){ return !!CONC[k]; }, function(ok){
    script("bible/lex/"+k+".js", function(){ return !!LEX[k]; }, function(){
      if(me !== cur) return;
      var C = CONC[k], base = id.replace(/[A-Z]$/, ""), e = ok && (C[id] || C[base] || C[base+"A"] || C[base+"G"]), L = lexEntry(id);
      if(!e){ body.innerHTML = '<p class="vs-none">No occurrences found.</p>'; return; }
      var refs = e[1].split("|").map(function(r){ var m = r.match(/^([1-3A-Z]{3})(\d+):(\d+)\.(\d+)$/); return m ? [m[1], +m[2], +m[3], +m[4]] : null; }).filter(Boolean);
      var gl = e[0].map(function(g, i){ return [g, refs.filter(function(r){ return r[3] === i; }).length]; }).sort(function(a,b){ return b[1]-a[1]; });
      var byB = {}; refs.forEach(function(r){ byB[r[0]] = (byB[r[0]]||0) + 1; });
      var mx = Math.max.apply(null, Object.keys(byB).map(function(x){ return byB[x]; }));
      body.innerHTML = '<button type="button" class="btn-sm" data-back="orig">← Back to the verse</button>'+
        '<div class="ws-h"><b lang="'+(k==="g"?"grc":"hbo")+'">'+esc(L ? L[0] : id)+'</b> <i>'+esc(L ? L[1] : "")+'</i> <small>'+esc(id)+'</small><p>“'+esc(L ? L[3] : "")+'” · <b>'+refs.length+'</b> occurrence'+(refs.length>1?"s":"")+' in <b>'+Object.keys(byB).length+'</b> book'+(Object.keys(byB).length>1?"s":"")+'</p></div>'+
        '<p class="vs-lang">How it is translated (STEPBible glosses)</p><div class="ws-gl">'+gl.slice(0, 14).map(function(g){ return '<span><b>'+esc(g[0])+'</b> '+g[1]+'</span>'; }).join("")+'</div>'+
        '<p class="vs-lang">Where it appears</p><div class="ws-dist">'+BOOKORDER.filter(function(b){ return byB[b]; }).map(function(b){ return '<span title="'+esc(shortName(edFor(b), b))+': '+byB[b]+'"><i style="--h:'+Math.max(8, byB[b]/mx*100)+'%"></i><small>'+esc(b)+'</small></span>'; }).join("")+'</div>'+
        '<p class="vs-lang">Every occurrence'+(refs.length > 300 ? " (first 300)" : "")+'</p><ul class="ws-refs">'+refs.slice(0, 300).map(function(r){ return '<li><button type="button" data-goeng="'+r[0]+'~'+r[1]+'~'+r[2]+'">'+esc(shortName(edFor(r[0]), r[0]))+' '+r[1]+':'+r[2]+'</button> <span>'+esc(e[0][r[3]])+'</span></li>'; }).join("")+'</ul>';
      body.scrollTop = 0;
    });
  });
}
sheet.addEventListener("click", function(e){
  var t;
  if((t = e.target.closest("[data-ws]"))){ e.stopPropagation(); wordStudy(t.dataset.ws); return; }
  if((t = e.target.closest("[data-back]"))){ showTab(t.dataset.back); return; }
  if((t = e.target.closest("[data-goeng]"))){ var p = t.dataset.goeng.split("~"); closeSheet(); goEng(p[0], +p[1], +p[2]); return; }
  if((t = e.target.closest("[data-gref]"))){ var q = t.dataset.gref.split("~"); location.hash = q[0]; closeSheet(); return; }
}, true);

/* ---------- Septuagint Greek words in the Original tab ---------- */
var GFORM = null; window.__GFORM = function(d){ GFORM = d; };
function lxxSection(c, cb){
  var b = c.b, ed = ED.lxxg, b2 = ed && equiv("lxxg", b); if(!b2 || NTB[b]) return cb("");
  var ch = c.c, src = srcOf(c.ed, c.b); if(b === "PSA" && !GREEKPS[src]) ch = hebToGreek(c.c);
  load("lxxg", b2, function(d){
    var v = (chapter(d, ch)||[]).filter(function(x){ return x[0] === c.v; })[0]; if(!v) return cb("");
    script("bible/lex/gform.js", function(){ return !!GFORM; }, function(){
      var words = v[1].split(/\s+/);
      cb('<p class="vs-lang">Septuagint (Greek Old Testament) · tap a word; matched by form where possible</p><div class="vs-words" lang="grc">' + words.map(function(w){
        var n = normT(w).replace(/[^\u03b1-\u03c9]/g, ""), id = GFORM && GFORM[n] || "";
        return '<button type="button" class="vw lxw'+(id ? "" : " nolex")+'" data-s="'+esc(id)+'" data-m=""><b>'+esc(w.replace(/[.,;·:]+$/,""))+'</b>'+(id ? "" : '<i>not matched</i>')+'</button>';
      }).join("") + '</div><div class="vs-lex" id="vsLex2" aria-live="polite"></div>');
    });
  });
}
function origView2(c, cb){
  var ob = origBook(c.b), hasO = ob && HASORIG[ob];
  function withLxx(h){ lxxSection(c, function(x){ cb(h + (x ? '<hr class="vs-hr">' + x + '<p class="vs-cite">Greek text: Brenton’s Septuagint (public domain). Lexicon links use word forms from the Greek New Testament, so some Septuagint words are not matched.</p>' : "")); }); }
  if(!hasO) return lxxSection(c, function(x){ cb(x ? x + '<p class="vs-cite">There is no Hebrew original in this data for '+esc(bname(c.ed, c.b))+'. Greek text: Brenton’s Septuagint (public domain).</p>' : '<p class="vs-none">No original-language text is available for this verse.</p>'); });
  origView(c, withLxx);
}
var _lexView = lexView;
lexView = function(btn){
  if(btn.classList.contains("lxw")){
    if(!btn.dataset.s){ var box2 = $("#vsLex2", sheet); if(box2) box2.innerHTML = '<p class="vs-none">This form is not in the index. The lexicon covers New Testament vocabulary and dictionary forms.</p>'; return; }
    var a = $("#vsLex", sheet); if(a) a.id = "vsLexA"; var b = $("#vsLex2", sheet); if(b) b.id = "vsLex";
    _lexView(btn);
    if(b) b.id = "vsLex2"; if(a) a.id = "vsLex";
    return;
  }
  _lexView(btn);
};

/* ---------- differences between editions ---------- */
function words(s){ return String(s).replace(/<[^>]+>/g, "").split(/\s+/).filter(Boolean); }
function lcsMark(a, b){
  var n = a.length, m = b.length; if(n * m > 40000) return null;
  var A = a.map(normT), B = b.map(function(x){ return normT(x).replace(/[^\p{L}\p{N}]/gu, ""); }), An = A.map(function(x){ return x.replace(/[^\p{L}\p{N}]/gu, ""); });
  var T = []; for(var i=0;i<=n;i++){ T.push(new Array(m+1).fill(0)); }
  for(i=n-1;i>=0;i--) for(var j=m-1;j>=0;j--) T[i][j] = An[i] === B[j] ? T[i+1][j+1] + 1 : Math.max(T[i+1][j], T[i][j+1]);
  var keep = new Array(m).fill(false); i = 0; j = 0;
  while(i<n && j<m){ if(An[i] === B[j]){ keep[j] = true; i++; j++; } else if(T[i+1][j] >= T[i][j+1]) i++; else j++; }
  return keep;
}
function diffMark(body, c){
  var me = $('.vs-ed[data-ed="'+c.ed+'"] blockquote', body); if(!me) return;
  var base = words(me.textContent); if(!isEnglish(srcOf(c.ed, c.b))) return;
  var tg = document.createElement("label"); tg.className = "vs-dtog"; tg.innerHTML = '<input type="checkbox" checked> Highlight wording that differs from the '+esc(ED[c.ed].short);
  body.insertBefore(tg, body.firstChild);
  $$(".vs-ed", body).forEach(function(d){
    if(d.dataset.ed === c.ed) return; var src = srcOf(d.dataset.ed, equiv(d.dataset.ed, c.b)); if(!isEnglish(src)) return;
    var q = $("blockquote", d), w = words(q.textContent), keep = lcsMark(base, w); if(!keep) return;
    q.innerHTML = w.map(function(x, i){ return keep[i] ? esc(x) : '<mark class="df">'+esc(x)+'</mark>'; }).join(" ");
  });
  $("input", tg).addEventListener("change", function(){ body.classList.toggle("nodiff", !this.checked); });
}

/* ---------- commentary: traditions, Fathers, the series ---------- */
var FATH = {}; window.__FATH = function(b, d){ FATH[b] = d; };
function tradFor(b, ch, v){ return (BX.trad || []).filter(function(t){ return t[0] === b && t[1] === ch && v >= t[2] && v <= t[3]; }); }
var REFIDX = null;
function refIndex(){
  if(REFIDX) return REFIDX; REFIDX = {};
  $$("main article").forEach(function(a){
    if(a.id === "bible" || !a.dataset.title) return;
    findRefs(a.textContent).forEach(function(r){ for(var v=r.v; v<=(r.v2||r.v); v++){ var k = r.b+"."+r.c+"."+v; (REFIDX[k] = REFIDX[k] || []); if(REFIDX[k].indexOf(a.id) < 0) REFIDX[k].push(a.id); } });
  });
  return REFIDX;
}
function commView(c, cb){
  var ob = origBook(c.b) || c.b, ch = engCh(c.ed, c.b, c.c), html = "";
  tradFor(ob, ch, c.v).forEach(function(t){
    html += '<section class="tr-card"><p class="vs-lang">How the churches read '+esc(shortName(edFor(t[0]), t[0]))+' '+t[1]+':'+t[2]+(t[3]!==t[2]?"–"+t[3]:"")+' · '+esc(t[4])+'</p>'+
      t[5].map(function(r){ return '<div class="tr-r tr-'+r[0].toLowerCase()+'"><b>'+esc(r[0])+'</b><p>'+esc(r[1])+'</p></div>'; }).join("")+(t[6] ? '<p class="tr-note">'+esc(t[6])+'</p>' : "")+'</section>';
  });
  var eps = (refIndex()[ob+"."+ch+"."+c.v] || []).map(function(id){ var a = document.getElementById(id); return a ? '<button type="button" class="tr-ep" data-gref="'+id+'">'+esc((a.dataset.ep ? a.dataset.ep + " · " : "") + a.dataset.title)+' →</button>' : ""; }).join("");
  if(eps) html += '<p class="vs-lang">In the series</p><div class="tr-eps">'+eps+'</div>';
  var g = grpOf(ob);
  script("bible/fath/"+g+".js", function(){ return !!FATH[ob] || FATH["__"+g]; }, function(){
    FATH["__"+g] = 1;
    var list = []; (pick(FATH[ob], ch) || []).forEach(function(e){ if(c.v >= e[0] && c.v <= e[1]) list.push(e); });
    list.sort(function(a,b){ return (b[0]===c.v) - (a[0]===c.v) || (a[1]-a[0]) - (b[1]-b[0]); });
    if(list.length) html += '<p class="vs-lang">The Fathers on this verse</p>' + list.slice(0, 8).map(function(e){
      var long = e[4].length > 420;
      return '<div class="fa"><p class="fa-h"><b>'+esc(e[2])+'</b>'+(e[5] ? ' <span class="fa-d" title="'+(e[6] === "w" ? "When this work was written" : "The author’s lifetime (this work is not precisely dated)")+'">'+(e[6] === "w" ? "" : "lived ")+esc(e[5])+'</span>' : "")+' <small>'+esc(e[3].replace(/^Catena Aurea by Aquinas$/, "quoted in Aquinas, Catena Aurea (1262–64)"))+(e[1] !== e[0] ? ' · on vv. '+e[0]+'–'+e[1] : "")+'</small></p><div class="fa-t'+(long ? " clip" : "")+'">'+esc(e[4]).replace(/\n+/g, "</p><p>").replace(/^/, "<p>")+'</p></div>'+(long ? '<button type="button" class="fa-more">Read more</button>' : "")+'</div>';
    }).join("") + '<p class="vs-cite">Excerpts from public-domain translations (Ante-Nicene and Nicene and Post-Nicene Fathers, Newman’s Catena Aurea, and others), via the HistoricalChristianFaith Commentaries Database.</p>';
    cb(html || '<p class="vs-none">No commentary is gathered for this verse yet. Try a neighbouring verse, or the Connections tab.</p>');
  });
}
sheet.addEventListener("click", function(e){ var m = e.target.closest(".fa-more"); if(!m) return; var t = m.previousElementSibling; t.classList.toggle("clip"); m.textContent = t.classList.contains("clip") ? "Read more" : "Show less"; });

/* ---------- scripture references in the episodes ---------- */
var BKRX = null, BKMAP = {};
function bookRx(){
  if(BKRX) return BKRX;
  var names = {};
  M.eds.forEach(function(e){ e.books.forEach(function(b){ var n = b[2].replace(/\s*\(.*\)$/, ""); if(/^(Esther|Daniel) \(/.test(b[2]) || /additions/i.test(b[2])) return; if(!names[n]) names[n] = b[0]; }); });
  names["Psalm"] = "PSA"; names["Song of Solomon"] = "SOL"; names["Ecclesiasticus"] = "SIR"; names["Apocalypse"] = "REV";
  var ab = {"Gen":"GEN","Exod":"EXO","Ex":"EXO","Lev":"LEV","Num":"NUM","Deut":"DEU","Josh":"JOS","Judg":"JDG","1 Sam":"1SA","2 Sam":"2SA","1 Kgs":"1KI","2 Kgs":"2KI","1 Chron":"1CH","2 Chron":"2CH","Neh":"NEH","Ps":"PSA","Pss":"PSA","Prov":"PRO","Eccl":"ECC","Isa":"ISA","Jer":"JER","Lam":"LAM","Ezek":"EZE","Dan":"DAN","Hos":"HOS","Mic":"MIC","Zech":"ZEC","Mal":"MAL","Matt":"MAT","Mt":"MAT","Mk":"MAR","Lk":"LUK","Jn":"JOH","Rom":"ROM","1 Cor":"1CO","2 Cor":"2CO","Gal":"GAL","Eph":"EPH","Phil":"PHI","Col":"COL","1 Thess":"1TH","2 Thess":"2TH","1 Tim":"1TI","2 Tim":"2TI","Tit":"TIT","Heb":"HEB","Jas":"JAM","1 Pet":"1PE","2 Pet":"2PE","1 Jn":"1JO","Rev":"REV","Sir":"SIR","Wis":"WIS","Tob":"TOB","1 Macc":"1MA","2 Macc":"2MA"};
  Object.keys(ab).forEach(function(k){ names[k] = ab[k]; });
  var keys = Object.keys(names).sort(function(a,b){ return b.length - a.length; });
  keys.forEach(function(k){ BKMAP[k.toLowerCase()] = names[k]; });
  BKRX = new RegExp("\\b(" + keys.map(function(k){ return k.replace(/ /g, "\\s").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|") + ")\\.?\\s(\\d{1,3}):(\\d{1,3})(?:\\s?[–-]\\s?(\\d{1,3})(?!:))?", "g");
  return BKRX;
}
function findRefs(text){
  var rx = bookRx(), out = [], m; rx.lastIndex = 0;
  while((m = rx.exec(text))){ var b = BKMAP[m[1].replace(/\s+/g, " ").toLowerCase()]; if(b) out.push({b:b, c:+m[2], v:+m[3], v2: m[4] ? +m[4] : 0, i:m.index, len:m[0].length, s:m[0]}); }
  return out;
}
function linkRefs(a){
  if(!a || a.dataset.srefs || a.id === "bible") return; a.dataset.srefs = "1";
  var tw = document.createTreeWalker(a, NodeFilter.SHOW_TEXT, {acceptNode: function(n){ return n.parentNode.closest("a,button,script,style,textarea,.sref,svg,figcaption,h1,h2,.shelf-h") ? NodeFilter.FILTER_REJECT : /\d:\d/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; }});
  var nodes = []; while(tw.nextNode()) nodes.push(tw.currentNode);
  nodes.forEach(function(n){
    var refs = findRefs(n.nodeValue); if(!refs.length) return;
    var frag = document.createDocumentFragment(), pos = 0, t = n.nodeValue;
    refs.forEach(function(r){
      frag.appendChild(document.createTextNode(t.slice(pos, r.i)));
      var b = document.createElement("button"); b.type = "button"; b.className = "sref"; b.dataset.sref = r.b + "~" + r.c + "~" + r.v; b.textContent = r.s; b.title = "Open this passage";
      frag.appendChild(b); pos = r.i + r.len;
    });
    frag.appendChild(document.createTextNode(t.slice(pos)));
    n.parentNode.replaceChild(frag, n);
  });
}
document.addEventListener("click", function(e){
  var b = e.target.closest(".sref"); if(!b) return; e.preventDefault();
  var p = b.dataset.sref.split("~"), bk = p[0], ed = ED[st.ed].idx[bk] != null ? st.ed : edFor(bk), c = xchap(ed, bk, +p[1]), v = +p[2];
  load(srcOf(ed, bk), bk, function(d){ var vv = (chapter(d, c)||[]).filter(function(x){ return x[0] === v; })[0]; openAt(ed, bk, c, v, vv ? vv[1] : ""); });
});
function linkActive(){ var a = $("main article.active"); if(a) setTimeout(function(){ linkRefs(a); }, 120); }
addEventListener("hashchange", linkActive); setTimeout(linkActive, 300);
/* "Read in context" from the sheet when opened outside the Bible page */
sheet.querySelector(".vs-acts").insertAdjacentHTML("afterbegin", '<button type="button" class="btn-sm" data-ctx="1">Read in context</button>');
sheet.addEventListener("click", function(e){ if(!e.target.closest("[data-ctx]") || !cur) return; var c = cur; closeSheet(); go(c.ed, c.b, c.c, c.v); });

/* ---------- reading plans ---------- */
var CHRONO = "GEN JOB EXO LEV NUM DEU JOS JDG RUT 1SA 2SA PSA 1KI PRO ECC SOL 2KI ISA HOS JOE AMO OBA JON MIC NAH HAB ZEP JER LAM EZE DAN 1CH 2CH EZR HAG ZEC EST NEH MAL MAT MAR LUK JOH ACT JAM GAL 1TH 2TH 1CO 2CO ROM EPH PHI COL PHM 1TI TIT 2TI 1PE 2PE HEB JUD 1JO 2JO 3JO REV".split(" ");
var PLANS = [
  {id:"year", t:"The whole Bible in a year", d:"Genesis to Revelation, about three or four chapters a day.", days:365, books:BOOKORDER},
  {id:"chrono", t:"Chronological, in a year", d:"The books in approximate historical order: Job after Genesis, the prophets beside the kings who heard them, Paul’s letters in the order he wrote them.", days:365, books:CHRONO},
  {id:"nt90", t:"New Testament in 90 days", d:"About three chapters a day.", days:90, books:BOOKORDER.slice(39)},
  {id:"gospels", t:"The four Gospels in 30 days", d:"Matthew, Mark, Luke and John, about three chapters a day.", days:30, books:["MAT","MAR","LUK","JOH"]},
  {id:"psalms", t:"Psalms in a month", d:"Five psalms a day, as in many monastic and Anglican traditions.", days:30, books:["PSA"]},
  {id:"wisdom", t:"Wisdom books in 40 days", d:"Job, Psalms, Proverbs, Ecclesiastes and the Song of Songs.", days:40, books:["JOB","PSA","PRO","ECC","SOL"]}
];
function planChs(p){ var out = []; p.books.forEach(function(b){ var n = (ED.kjv.books[ED.kjv.idx[b]]||[])[3] || 0; for(var c=1;c<=n;c++) out.push([b, c]); }); return out; }
function planDay(p, i){ var a = planChs(p), T = a.length, s = Math.floor(i*T/p.days), e = Math.floor((i+1)*T/p.days); return a.slice(s, e); }
function rangeLabel(chs){
  var out = [], i = 0;
  while(i < chs.length){ var b = chs[i][0], s = chs[i][1], e = s; while(i+1 < chs.length && chs[i+1][0] === b && chs[i+1][1] === e+1){ i++; e++; } out.push(shortName(edFor(b), b) + " " + s + (e !== s ? "–" + e : "")); i++; }
  return out.join("; ");
}
var BP = get("hcc.bplan", null);
function bpToday(){ if(!BP) return 0; var p = PLANS.filter(function(x){ return x.id === BP.id; })[0]; return Math.min(p.days - 1, Math.max(0, dayDiff(new Date(BP.start + "T00:00:00"), new Date()))); }
function pushPlanNote(){
  try{ if(!APP || !APP.setBiblePlan) return; if(!BP){ APP.setBiblePlan(""); return; }
    var p = PLANS.filter(function(x){ return x.id === BP.id; })[0], i = bpToday(); APP.setBiblePlan(p.t + " · day " + (i+1) + ": " + rangeLabel(planDay(p, i))); }catch(e){}
}
pushPlanNote();
XMODE.plans = function(){
  var h = '<h3 class="bib-h">Bible reading plans</h3>';
  if(BP){
    var p = PLANS.filter(function(x){ return x.id === BP.id; })[0], i = bpToday(), done = BP.done || {}, nd = Object.keys(done).length, behind = 0;
    for(var k=0;k<i;k++) if(!done[k]) behind++;
    var today = planDay(p, i);
    h += '<section class="bp-cur"><p class="eyebrow">'+esc(p.t)+'</p><h4>Day '+(i+1)+' of '+p.days+'</h4><div class="bp-bar"><i style="width:'+(nd/p.days*100).toFixed(1)+'%"></i></div><p class="cmp-note">'+nd+' of '+p.days+' days done'+(behind ? ' · '+behind+' earlier day'+(behind>1?"s":"")+' still open' : "")+'</p>'+
      '<p class="bp-today">Today: <b>'+esc(rangeLabel(today))+'</b></p><div class="bp-chs">'+today.map(function(x){ return '<button type="button" class="btn-sm" data-pgo="'+x[0]+'~'+x[1]+'">'+esc(shortName(edFor(x[0]), x[0]))+' '+x[1]+'</button>'; }).join("")+'</div>'+
      '<label class="bp-done"><input type="checkbox" data-pday="'+i+'"'+(done[i] ? " checked" : "")+'> Mark today’s reading as done</label>'+
      '<details class="bp-all"><summary>All days</summary><ol>'+Array.apply(null, {length:p.days}).map(function(_, d){ return '<li class="'+(done[d] ? "dn" : "")+(d === i ? " td" : "")+'"><label><input type="checkbox" data-pday="'+d+'"'+(done[d] ? " checked" : "")+'> Day '+(d+1)+'</label> <span>'+esc(rangeLabel(planDay(p, d)))+'</span></li>'; }).join("")+'</ol></details>'+
      '<button type="button" class="chip" data-pstop="1">Stop this plan</button></section>';
  }
  h += '<div class="bp-grid">' + PLANS.map(function(p){ var n = planChs(p).length; return '<div class="bp-card'+(BP && BP.id === p.id ? " on" : "")+'"><h4>'+esc(p.t)+'</h4><p>'+esc(p.d)+'</p><small>'+n+' chapters · '+p.days+' days · about '+(n/p.days).toFixed(1)+' a day</small><button type="button" class="btn-sm" data-pstart="'+p.id+'">'+(BP && BP.id === p.id ? "Restart from today" : "Start")+'</button></div>'; }).join("") + '</div>'+
    '<p class="cmp-note">Plans use whichever edition you are reading. Your progress stays on this device'+(APP ? ", and today’s reading shows in the “Today’s reading” widget." : ".")+'</p>';
  view.innerHTML = h;
};
view.addEventListener("click", function(e){
  var t;
  if((t = e.target.closest("[data-pstart]"))){ BP = {id: t.dataset.pstart, start: ymd(new Date()), done: {}}; put("hcc.bplan", BP); pushPlanNote(); haptic("strong"); render(); return; }
  if((t = e.target.closest("[data-pstop]"))){ BP = null; put("hcc.bplan", null); pushPlanNote(); render(); return; }
  if((t = e.target.closest("[data-pgo]"))){ var p = t.dataset.pgo.split("~"); goEng(p[0], +p[1]); return; }
});
view.addEventListener("change", function(e){
  var t = e.target.closest("[data-pday]"); if(!t || !BP) return;
  BP.done = BP.done || {}; if(t.checked) BP.done[t.dataset.pday] = 1; else delete BP.done[t.dataset.pday];
  put("hcc.bplan", BP); pushPlanNote(); haptic("tick"); if(t.closest(".bp-done")) render();
});

/* ---------- daily office lectionary (BCP 1979) ---------- */
var LECT = null; window.__LECT = function(d){ LECT = d; };
var DOW = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], MONS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function easter(y){ var a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1; return new Date(y, mo-1, da); }
function addD(d, n){ var x = new Date(d); x.setDate(x.getDate() + n); return x; }
function advent1(y){ var x = new Date(y, 11, 25); var back = x.getDay() === 0 ? 7 : x.getDay(); return addD(x, -back - 21); }
function sundayOnOrBefore(d){ return addD(d, -d.getDay()); }
function office(d){
  d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  var y = d.getFullYear(), a1 = advent1(y), start = d >= a1 ? y : y - 1, yr = ((start + 1) % 2 === 1) ? "y1" : "y2";
  var E = d < a1 ? easter(y) : easter(y + 1);
  var key = MONS[d.getMonth()] + " " + d.getDate(), dow = DOW[d.getDay()], week = null, dayKey = dow;
  var jan6 = new Date(d < a1 ? y : y + 1, 0, 6), ep1 = addD(jan6, 7 - jan6.getDay()), ash = addD(E, -46), lastEp = addD(E, -49), pent = addD(E, 49), trin = addD(E, 56);
  if(d >= a1 && !(d.getMonth() === 11 && d.getDate() >= 24)){ week = "Week of " + (Math.floor(dayDiff(a1, d) / 7) + 1) + " Advent"; }
  else if((d.getMonth() === 11 && d.getDate() >= 24) || (d.getMonth() === 0 && d < ep1)){
    dayKey = key; week = d.getMonth() === 11 && d.getDate() === 24 ? "Week of 4 Advent" : d.getMonth() === 0 && d.getDate() >= 6 ? "The Epiphany and Following" : "Christmas Day and Following";
    if(d.getDay() === 0 && week === "Christmas Day and Following") dayKey = "Sunday";
  }
  else if(d < lastEp){ week = "Week of " + (Math.floor(dayDiff(ep1, d) / 7) + 1) + " Epiphany"; }
  else if(d < ash){ week = "Week of Last Epiphany"; }
  else if(d < addD(E, -42)){ week = "Ash Wednesday and Following"; }
  else if(d < addD(E, -7)){ week = "Week of " + (Math.floor(dayDiff(addD(E, -42), d) / 7) + 1) + " Lent"; }
  else if(d < E){ week = "Holy Week"; }
  else if(d < addD(E, 7)){ week = "Easter Week"; }
  else if(d < pent){ week = "Week of " + (Math.floor(dayDiff(E, d) / 7) + 1) + " Easter"; }
  else if(+d === +pent){ week = "Pentecost"; }
  else {
    var may11 = new Date(d.getFullYear(), 4, 11), s0 = addD(may11, -may11.getDay()); if(may11.getDay() > 3) s0 = addD(s0, 7);
    var S = sundayOnOrBefore(d), n = Math.round(dayDiff(s0, S) / 7) + 1;
    week = "Proper " + Math.max(1, Math.min(29, n));
    if(+d === +trin) week = "__trinity";
    if(+d === +addD(trin, -1)) week = "__trinityeve";
  }
  var list = LECT[yr], hit = null;
  if(week === "__trinity" || week === "__trinityeve") hit = list.filter(function(x){ return /Trinity/.test(x.title||"") && x.day === (week === "__trinity" ? "Sunday" : "Saturday"); })[0];
  if(!hit) hit = list.filter(function(x){ return x.week === week && x.day === dayKey; })[0];
  if(!hit && dayKey !== dow) hit = list.filter(function(x){ return x.week === week && x.day === dow; })[0];
  var holy = (LECT.hd || []).filter(function(x){ return x.day === key; })[0];
  return {yr: yr === "y1" ? "Year One" : "Year Two", week: week === "__trinity" ? "Trinity Sunday" : week === "__trinityeve" ? "Eve of Trinity Sunday" : week, hit: hit, holy: holy, date: d};
}
function refBtns(s){
  return String(s).split(/,\s*|\s+or\s+/).map(function(part){
    var t = part.replace(/[\[\]()]/g, "").trim(), m = t.match(/^((?:[1-4]\s)?[A-Za-z]+\.?)\s*(\d+)(?::(\d+))?/), r = m ? parseRef(m[1] + " " + m[2] + (m[3] ? ":" + m[3] : "")) : null;
    return r ? '<button type="button" class="lc-ref" data-goeng2="'+r.b+'~'+r.c+'~'+(r.v||0)+'">'+esc(part.trim())+'</button>' : '<span class="lc-ref">'+esc(part)+'</span>';
  }).join(" ");
}
function psBtns(arr){ return (arr||[]).map(function(p){ var m = String(p).match(/(\d+)(?::(\d+))?/); return m ? '<button type="button" class="lc-ref" data-goeng2="PSA~'+m[1]+'~'+(m[2]||0)+'">'+esc(p)+'</button>' : esc(p); }).join(" "); }
function lessonsHTML(L){
  if(!L) return "";
  function block(o){ return ["first","altFirst","second","altSecond","third","gospel","altGospel"].filter(function(k){ return o[k]; }).map(function(k){ return '<li><span>'+({first:"First",altFirst:"or",second:"Second",altSecond:"or",third:"Third",gospel:"Gospel",altGospel:"or"}[k])+'</span>'+refBtns(o[k])+'</li>'; }).join(""); }
  var h = "";
  if(L.morning || L.evening){ if(L.morning) h += '<p class="lc-o">Morning</p><ul class="lc-l">'+block(L.morning)+'</ul>'; if(L.evening) h += '<p class="lc-o">Evening</p><ul class="lc-l">'+block(L.evening)+'</ul>'; }
  else h += '<ul class="lc-l">'+block(L)+'</ul>';
  return h;
}
function officeHTML(o){
  var x = o.hit, h = '<div class="lc-meta"><span>'+esc(o.yr)+'</span><span>'+esc((x && x.season) || "")+'</span><span>'+esc(o.week || "")+'</span></div>';
  if(x && x.title) h += '<h4 class="lc-t">'+esc(x.title)+'</h4>';
  if(x){ h += '<div class="lc-ps"><p class="lc-o">Psalms</p>'+(x.psalms && x.psalms.morning ? '<p><span>Morning</span>'+psBtns(x.psalms.morning)+'</p>' : "")+(x.psalms && x.psalms.evening ? '<p><span>Evening</span>'+psBtns(x.psalms.evening)+'</p>' : "")+'</div><p class="lc-o">Lessons</p>' + lessonsHTML(x.lessons); }
  else h += '<p class="vs-none">No entry for this day in the table.</p>';
  if(o.holy) h += '<section class="lc-holy"><p class="eyebrow">Holy day</p><h4 class="lc-t">'+esc(o.holy.title)+'</h4>'+(o.holy.psalms ? '<div class="lc-ps">'+(o.holy.psalms.morning ? '<p><span>Morning</span>'+psBtns(o.holy.psalms.morning)+'</p>' : "")+(o.holy.psalms.evening ? '<p><span>Evening</span>'+psBtns(o.holy.psalms.evening)+'</p>' : "")+'</div>' : "")+lessonsHTML(o.holy.lessons)+'</section>';
  return h;
}
XMODE.today = function(){
  view.innerHTML = '<h3 class="bib-h">Today’s readings</h3><div class="bib-load"><span></span><span></span><span></span></div>';
  script("bible/lect.js", function(){ return !!LECT; }, function(ok){
    if(mode !== "today") return;
    if(!ok){ view.innerHTML += '<p class="vs-none">The lectionary could not be loaded.</p>'; return; }
    var d = st.ld ? new Date(st.ld + "T00:00:00") : new Date(), o = office(d);
    view.innerHTML = '<h3 class="bib-h">Daily readings</h3><div class="lc-nav"><button type="button" class="btn-sm" data-ld="-1" aria-label="Previous day">←</button><label class="vh" for="lcDate">Date</label><input type="date" id="lcDate" value="'+ymd(d)+'"><button type="button" class="btn-sm" data-ld="1" aria-label="Next day">→</button><button type="button" class="btn-sm" data-ld="0">Today</button></div>'+
      '<p class="cmp-note">The Daily Office Lectionary of the Book of Common Prayer (1979), a two-year cycle of psalms and three readings for Morning and Evening Prayer, used by Anglicans and many others. It follows the church year, so dates move with Easter and Advent.</p>'+
      '<section class="lc-card">'+officeHTML(o)+'</section><p class="vs-cite">Table: Book of Common Prayer 1979 (public domain), data from the open “Daily Office” JSON project (MIT). Readings open in the edition you are using.</p>';
  });
};
view.addEventListener("click", function(e){
  var t;
  if((t = e.target.closest("[data-ld]"))){ var n = +t.dataset.ld, d = st.ld ? new Date(st.ld + "T00:00:00") : new Date(); st.ld = n === 0 ? "" : ymd(addD(d, n)); render(); return; }
  if((t = e.target.closest("[data-goeng2]"))){ var p = t.dataset.goeng2.split("~"); goEng(p[0], +p[1], +p[2]); return; }
});
view.addEventListener("change", function(e){ if(e.target.id === "lcDate" && e.target.value){ st.ld = e.target.value; render(); } });

/* ---------- Bible maps ---------- */
var mapArt = $("#bible-maps");
if(mapArt){
  var MP = BX.maps || [], mi = 0, playT = null;
  var chips = $(".bm-chips", mapArt), fig = $(".bm-fig", mapArt), card = $(".bm-card", mapArt);
  function drawMap(k, animate){
    var m = MP[k]; mi = k; clearTimeout(playT);
    $$(".chip", chips).forEach(function(c, i){ c.setAttribute("aria-pressed", i === k ? "true" : "false"); });
    var pts = m.p, path = m.route ? "M" + pts.map(function(p){ return p[1].toFixed(1) + " " + p[2].toFixed(1); }).join(" L") : "";
    var seen = {};
    fig.innerHTML = '<svg viewBox="'+m.vb+'" role="img" aria-label="Map: '+esc(m.t)+'" style="--fs:'+m.fs+'px;--sw:'+m.sw+'px"><use href="#landR" class="land"/>'+(path ? '<path class="bm-route'+(animate ? " anim" : "")+'" d="'+path+'" pathLength="1"/>' : "")+
      '<g class="bm-stops">'+pts.map(function(p, i){ var key = p[1].toFixed(0)+","+p[2].toFixed(0), dup = seen[key]; seen[key] = 1;
        return '<g class="bm-st'+(m.route ? "" : " tribe")+'" data-i="'+i+'" transform="translate('+p[1].toFixed(1)+' '+p[2].toFixed(1)+')" tabindex="0" role="button" aria-label="'+esc(p[0])+'"><circle r="'+m.r+'"/>'+(m.route ? '<text class="n" dy="'+(m.r*0.38).toFixed(2)+'">'+(i+1)+'</text>' : "")+(dup ? "" : '<text class="l" x="'+(m.r*1.5).toFixed(1)+'" y="'+(-m.r*0.9).toFixed(1)+'">'+esc(p[0])+'</text>')+'</g>'; }).join("")+'</g></svg>';
    card.innerHTML = '<p class="eyebrow">'+esc(m.s)+'</p><h3>'+esc(m.t)+'</h3><p class="cmp-note">'+esc(m.note)+'</p><ol class="bm-list">'+pts.map(function(p, i){ return '<li><button type="button" data-bmi="'+i+'">'+esc(p[0])+'</button> <small>'+esc(p[3].replace(/^(\w+) (\d+) (\d+)$/, function(_, b, c, v){ return shortName(edFor(b), b) + " " + c + ":" + v; }))+'</small></li>'; }).join("")+'</ol>';
    if(animate && m.route) play(0);
  }
  function stop(i){
    var m = MP[mi], p = m.p[i]; if(!p) return;
    $$(".bm-st", fig).forEach(function(g){ g.classList.toggle("on", +g.dataset.i === i); });
    $$(".bm-list li", card).forEach(function(li, k){ li.classList.toggle("on", k === i); });
    var r = p[3].split(" "), ed = ED[st.ed].idx[r[0]] != null ? st.ed : edFor(r[0]), c = xchap(ed, r[0], +r[1]);
    var box = $(".bm-verse", mapArt);
    load(srcOf(ed, r[0]), r[0], function(d){ var vv = (chapter(d, c)||[]).filter(function(x){ return x[0] === +r[2]; })[0];
      box.innerHTML = '<p class="vs-lang">'+esc(p[0])+' · '+esc(shortName(ed, r[0]))+' '+c+':'+r[2]+'</p><blockquote>'+(vv ? fmt(vv[1]) : "")+'</blockquote><button type="button" class="btn-sm" data-bmgo="'+ed+'~'+r[0]+'~'+c+'~'+r[2]+'">Read the chapter →</button>'; });
  }
  function play(i){ var m = MP[mi]; if(i >= m.p.length) return; stop(i); playT = setTimeout(function(){ play(i + 1); }, 1500); }
  chips.innerHTML = MP.map(function(m, i){ return '<button type="button" class="chip" data-bmk="'+i+'" aria-pressed="false">'+esc(m.t)+'</button>'; }).join("");
  mapArt.addEventListener("click", function(e){
    var t;
    if((t = e.target.closest("[data-bmk]"))){ drawMap(+t.dataset.bmk, true); haptic("tick"); return; }
    if((t = e.target.closest("[data-bmplay]"))){ drawMap(mi, true); return; }
    if((t = e.target.closest("[data-bmi]"))){ clearTimeout(playT); stop(+t.dataset.bmi); return; }
    if((t = e.target.closest(".bm-st"))){ clearTimeout(playT); stop(+t.dataset.i); return; }
    if((t = e.target.closest("[data-bmgo]"))){ var p = t.dataset.bmgo.split("~"); go(p[0], p[1], +p[2], +p[3]); return; }
  });
  mapArt.addEventListener("keydown", function(e){ var g = e.target.closest(".bm-st"); if(g && (e.key === "Enter" || e.key === " ")){ e.preventDefault(); clearTimeout(playT); stop(+g.dataset.i); } });
  var mapDone = false;
  function mapRoute(){ if(location.hash === "#bible-maps" && !mapDone){ mapDone = true; drawMap(0, true); } }
  addEventListener("hashchange", function(){ setTimeout(mapRoute, 80); }); setTimeout(mapRoute, 200);
}

/* ---------- canon history ---------- */
var canArt = $("#bible-canon");
if(canArt){
  canArt.addEventListener("click", function(e){
    var t = e.target.closest("[data-cf]");
    if(t){ var f = t.dataset.cf; $$("[data-cf]", canArt).forEach(function(x){ x.setAttribute("aria-pressed", x === t ? "true" : "false"); });
      $$(".cn-item", canArt).forEach(function(it){ it.hidden = f && it.dataset.reg !== f; }); $$(".cn-tab tbody tr", canArt).forEach(function(r){ r.hidden = f && r.dataset.reg !== f; }); return; }
    var r = e.target.closest("tr[data-cn]");
    if(r){ var it = $('#cn-'+r.dataset.cn, canArt); if(it){ it.scrollIntoView({block:"center", behavior:"smooth"}); it.classList.remove("flash"); void it.offsetWidth; it.classList.add("flash"); } }
  });
}

/* ---------- cross-reference arcs ---------- */
var arcArt = $("#bible-arcs");
if(arcArt){
  var ARCS = null; window.__ARCS = function(d){ ARCS = d; };
  var cv = $("canvas", arcArt), info = $(".ba-info", arcArt), CH = [], W = 0, Hh = 0, sel = -1, dpr = 1, base = null;
  function setup(){
    if(!ARCS) return; CH = []; ARCS.books.forEach(function(b){ for(var c=1;c<=b[1];c++) CH.push([b[0], c]); });
    var rect = cv.parentNode.getBoundingClientRect(); W = Math.max(300, rect.width); Hh = Math.round(Math.min(560, Math.max(260, W * 0.52)));
    dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = W * dpr; cv.height = Hh * dpr; cv.style.height = Hh + "px";
    draw();
  }
  function X(i){ return 8 + (i + 0.5) / CH.length * (W - 16); }
  function col(a, z){ var d = Math.abs(z - a) / CH.length; return "hsl(" + (Math.round(200 + 160 * d) % 360) + ", 70%, 50%)"; }
  function draw(){
    var g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, Hh);
    var axis = Hh - 26, dark = matchMedia("(prefers-color-scheme: dark)").matches && document.documentElement.dataset.theme !== "light" || document.documentElement.dataset.theme === "dark";
    var maxN = ARCS.a.length ? ARCS.a[0][2] : 1;
    g.lineWidth = 0.6;
    ARCS.a.forEach(function(p){
      var on = sel < 0 || p[0] === sel || p[1] === sel; if(sel >= 0 && !on) return;
      var x1 = X(p[0]), x2 = X(p[1]), r = (x2 - x1) / 2, h = Math.min(axis - 6, r);
      g.globalAlpha = sel < 0 ? Math.min(0.5, 0.06 + p[2] / maxN * 0.6) : 0.85;
      g.strokeStyle = col(p[0], p[1]); g.lineWidth = sel < 0 ? 0.6 : 1.4;
      g.beginPath(); g.ellipse((x1 + x2) / 2, axis, r, h, 0, Math.PI, 2 * Math.PI); g.stroke();
    });
    g.globalAlpha = 1;
    var bx = 0; ARCS.books.forEach(function(b, k){ var x1 = X(bx) - (W - 16) / CH.length / 2, x2 = X(bx + b[1] - 1) + (W - 16) / CH.length / 2; g.fillStyle = k < 39 ? (k % 2 ? "#8a6d3b" : "#b0905a") : (k % 2 ? "#2c5b8c" : "#5a86b5"); g.fillRect(x1, axis + 4, Math.max(1, x2 - x1 - 0.5), 8); bx += b[1]; });
    g.fillStyle = dark ? "#c9c3b8" : "#5b564d"; g.font = "600 11px system-ui, sans-serif"; g.textAlign = "center";
    [["Genesis", 0, "left"], ["Psalms", idxOf("PSA"), "center"], ["Isaiah", idxOf("ISA"), "center"], ["Matthew", idxOf("MAT"), "center"], ["Revelation", CH.length - 1, "right"]].forEach(function(l){ g.textAlign = l[2]; g.fillText(l[0], l[2] === "left" ? 8 : l[2] === "right" ? W - 8 : X(l[1]), axis + 24); });
    if(sel >= 0){ g.fillStyle = dark ? "#fff" : "#111"; g.fillRect(X(sel) - 1, axis - 4, 2, 18); }
  }
  function idxOf(b){ for(var i=0;i<CH.length;i++) if(CH[i][0] === b) return i; return 0; }
  function pickX(x){ return Math.max(0, Math.min(CH.length - 1, Math.floor((x - 8) / (W - 16) * CH.length))); }
  function show(i){
    sel = i; draw(); var c = CH[i], links = ARCS.a.filter(function(p){ return p[0] === i || p[1] === i; }).sort(function(a,b){ return b[2] - a[2]; }).slice(0, 10);
    info.innerHTML = '<p class="vs-lang">'+esc(shortName(edFor(c[0]), c[0]))+' '+c[1]+' · '+links.length+' strong link'+(links.length===1?"":"s")+' shown</p><div class="ba-l">'+links.map(function(p){ var o = CH[p[0] === i ? p[1] : p[0]]; return '<button type="button" class="chip" data-bago="'+o[0]+'~'+o[1]+'">'+esc(shortName(edFor(o[0]), o[0]))+' '+o[1]+'</button>'; }).join("")+'</div><button type="button" class="btn-sm" data-bago="'+c[0]+'~'+c[1]+'">Read '+esc(shortName(edFor(c[0]), c[0]))+' '+c[1]+' →</button> <button type="button" class="btn-sm" data-baclr="1">Show all</button>';
  }
  cv.addEventListener("pointermove", function(e){ if(e.pointerType !== "mouse" || !CH.length) return; var r = cv.getBoundingClientRect(), i = pickX(e.clientX - r.left); cv.title = shortName(edFor(CH[i][0]), CH[i][0]) + " " + CH[i][1]; });
  cv.addEventListener("click", function(e){ if(!CH.length) return; var r = cv.getBoundingClientRect(); show(pickX(e.clientX - r.left)); });
  arcArt.addEventListener("click", function(e){ var t;
    if((t = e.target.closest("[data-bago]"))){ var p = t.dataset.bago.split("~"); goEng(p[0], +p[1]); return; }
    if((t = e.target.closest("[data-baclr]"))){ sel = -1; draw(); info.innerHTML = '<p class="cmp-note">Tap anywhere along the bar to pick a chapter.</p>'; }
    if((t = e.target.closest("[data-bajump]"))){ show(idxOf(t.dataset.bajump.split("~")[0]) + (+t.dataset.bajump.split("~")[1]) - 1); }
  });
  var arcsOn = false;
  function arcRoute(){ if(location.hash !== "#bible-arcs") return; script("bible/arcs.js", function(){ return !!ARCS; }, function(ok){ if(ok){ setup(); if(!arcsOn){ arcsOn = true; addEventListener("resize", function(){ if(location.hash === "#bible-arcs") setup(); }); } } }); }
  addEventListener("hashchange", function(){ setTimeout(arcRoute, 80); }); setTimeout(arcRoute, 250);
}

/* ---------- home: today's readings link ---------- */
function homeLect(){
  var v = $(".votd"); if(!v || $(".votd-lect", v)) return;
  var a = document.createElement("button"); a.type = "button"; a.className = "btn-sm votd-lect"; a.textContent = "Today’s readings";
  var q = $(".qbtns", v); if(q) q.appendChild(a);
  a.addEventListener("click", function(){ mode = "today"; location.hash = "bible"; setTimeout(function(){ render(); toolsMark(); }, 120); });
}
setTimeout(homeLect, 500); addEventListener("hashchange", function(){ setTimeout(homeLect, 120); });

/* ---------- app: daily verse notification setting ---------- */
function verseSettings(){
  if(!APP || !APP.setVerseDaily) return; var v = $(".votd"); if(!v || $(".vset", v)) return;
  var s = {}; try{ s = JSON.parse(APP.getVerseDaily() || "{}"); }catch(e){}
  var box = document.createElement("div"); box.className = "vset";
  box.innerHTML = '<div class="setrow"><label for="vdOn">Daily verse notification (also on the lock screen)</label><input type="checkbox" class="switch" id="vdOn"'+(s.on ? " checked" : "")+'></div><div class="setrow"><label for="vdAt">Time</label><input type="time" id="vdAt" value="'+("0"+(s.h==null?7:s.h)).slice(-2)+':'+("0"+(s.m||0)).slice(-2)+'"></div><p class="cmp-note">Widgets: “Verse of the day”, “Verse of the day (large)” and “Today”, optionally with the Greek or Hebrew, on the home screen or lock screen.</p>';
  v.appendChild(box);
  function push(){ var p = $("#vdAt", box).value.split(":"); try{ APP.setVerseDaily($("#vdOn", box).checked, +p[0]||7, +p[1]||0); }catch(e){} haptic("tick"); }
  $("#vdOn", box).addEventListener("change", push); $("#vdAt", box).addEventListener("change", push);
}
setTimeout(verseSettings, 600); addEventListener("hashchange", function(){ setTimeout(verseSettings, 150); });
