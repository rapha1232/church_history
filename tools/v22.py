"""Edition 22: a default Bible edition for quotes and references. Run after tools/v21.py, from the repository root:

    python3 tools/v20.py && python3 tools/v21.py && python3 tools/v22.py

Idempotent. Adds "Default Bible" to Settings: any edition on the device (the bundled ones and those added from a
file). The choice is kept in localStorage under "hcc.bible.def"; empty means the edition being read, as before.
It is used for:
  - verses quoted in Studies and their reference labels (window.HCCBible.text / .label),
  - Bible links opened from Studies (window.HCCBible.go with no edition),
  - the verse of the day and its "Read the chapter" button,
  - cross-references and labels when the edition being read lacks a book,
  - the edition the Bible opens in the very first time.
Books the default edition lacks fall back to the edition being read, then the WEB, then any edition that has them.

Patches site/index.html and the sources it was built from (tools/v13.js, tools/v18.js, tools/v21.py), so later
rebuilds keep the change.
"""
import json, os, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
P = lambda *a: os.path.join(ROOT, *a)

PATCHES = [
 ('first edition',
  'var st = get("hcc.bible", {ed:"kjv", b:"JOH", c:1, cmp:"", v:0});',
  'var st = get("hcc.bible", {ed:get("hcc.bible.def", "") || "kjv", b:"JOH", c:1, cmp:"", v:0});',
  ['site/index.html', 'tools/v13.js']),
 ('default edition helpers',
  'function edFor(b){ if(ED[st.ed].idx[b] != null) return st.ed; return ED.web.idx[b]',
  '/* Edition 22: the default edition for quotes and references (Settings > Default Bible) */\n'
  'function defEd(){ var d = get("hcc.bible.def", ""); return d && ED[d] ? d : ""; }\n'
  'function qEd(b){ var d = defEd(); if(d && ED[d].idx[b] != null) return d; return ED[st.ed].idx[b] != null ? st.ed : edFor(b); }\n'
  'function edFor(b){ if(ED[st.ed].idx[b] != null) return st.ed; var d = defEd(); if(d && ED[d].idx[b] != null) return d; return ED.web.idx[b]',
  ['site/index.html', 'tools/v13.js']),
 ('links open in the default',
  '  if(ed && ED[ed]) st.ed = ed;\n  var b2 = equiv(st.ed, b);',
  '  if(ed && ED[ed]) st.ed = ed;\n  else if(!ed && defEd() && ED[defEd()].idx[b] != null) st.ed = defEd();\n  var b2 = equiv(st.ed, b);',
  ['site/index.html', 'tools/v13.js']),
 ('verse of the day text',
  """  function body(){ var v = VOTD[k]; return '<blockquote>'+esc(v.t)+'</blockquote><p class="qa"><b>'+esc(v.r)+'</b> · World English Bible</p>'; }""",
  """  function body(){ var v = VOTD[k]; return '<blockquote>'+esc(v.t)+'</blockquote><p class="qa"><b>'+esc(v.r)+'</b> · World English Bible</p>'; }
  function inDef(){ var v = VOTD[k], d = defEd(), kk = k; if(!d || d === "web" || ED[d].idx[v.b] == null) return;
    var ch = xchap(d, v.b, v.c); load(ED[d].books[ED[d].idx[v.b]][1], v.b, function(dt){ if(kk !== k) return;
      var tx = (chapter(dt, ch) || []).filter(function(x){ return x[0] === v.v; }).map(function(x){ return x[1]; }).join(" ").replace(/\\s+/g, " ").trim(); if(!tx) return;
      var vb = $(".vbody", box); if(vb) vb.innerHTML = '<blockquote>'+esc(tx)+'</blockquote><p class="qa"><b>'+esc(shortName(d, v.b)+" "+ch+":"+v.v)+'</b> · '+esc(ED[d].name)+'</p>'; }); }""",
  ['site/index.html', 'tools/v13.js']),
 ('verse of the day insert',
  "+' ('+esc(last.ed)+') →</a>';\n  var q = $(\".qotd\", sh); sh.insertBefore(box, q ? q.nextSibling : sh.firstChild);\n",
  "+' ('+esc(last.ed)+') →</a>';\n  var q = $(\".qotd\", sh); sh.insertBefore(box, q ? q.nextSibling : sh.firstChild); inDef();\n",
  ['site/index.html', 'tools/v13.js']),
 ('verse of the day next',
  """$(".vbody", box).innerHTML = body(); haptic("tick"); }""",
  """$(".vbody", box).innerHTML = body(); inDef(); haptic("tick"); }""",
  ['site/index.html', 'tools/v13.js']),
 ('verse of the day read',
  """var v = VOTD[k]; go(ED[st.ed].idx[v.b] != null ? st.ed : "web", v.b, v.c, v.v); }""",
  """var v = VOTD[k], e2 = defEd() && ED[defEd()].idx[v.b] != null ? defEd() : ED[st.ed].idx[v.b] != null ? st.ed : "web"; go(e2, v.b, xchap(e2, v.b, v.c), v.v); }""",
  ['site/index.html', 'tools/v13.js']),
 ('Studies quotes',
  'var ed = ED[st.ed].idx[r.b] != null ? st.ed : edFor(r.b), ch = xchap(ed, r.b, r.c)',
  'var ed = qEd(r.b), ch = xchap(ed, r.b, r.c)',
  ['site/index.html', 'tools/v21.py']),
 ('Studies labels',
  'label: function(b, c, v, v2){ try{ return shortName(edFor(b), b)',
  'label: function(b, c, v, v2){ try{ return shortName(qEd(b), b)',
  ['site/index.html', 'tools/v21.py']),
 ('Settings section',
  '  h += section("Your reading and notes",',
  '''  var DE = (window.__BIBMAN__ || {eds: []}).eds, de = get("hcc.bible.def", "");
  h += section("Default Bible", '<div class="set-row"><span><small>' + esc(t("Used for verses quoted in Studies, Bible references, the verse of the day and links that open the Bible. Books it does not have come from another edition.")) + '</small></span><span class="set-b"><select id="setDefEd" aria-label="' + esc(t("Default Bible")) + '"><option value="">' + esc(t("The edition I am reading")) + '</option>' +
    DE.map(function(e){ return '<option value="' + esc(e.id) + '"' + (e.id === de ? " selected" : "") + '>' + esc(e.short + " · " + e.name) + '</option>'; }).join("") + '</select></span></div>');
  h += section("Your reading and notes",''',
  ['site/index.html', 'tools/v18.js']),
 ('Settings select width',
  '<select id="setDefEd" aria-label=',
  '<select id="setDefEd" style="width:100%;max-width:100%;min-width:0" aria-label=',
  ['site/index.html', 'tools/v18.js']),
 ('Settings change',
  '  else if(el.id === "setAuto"){',
  '  else if(el.id === "setDefEd"){ put("hcc.bible.def", el.value); try{ var b0 = get("hcc.bible", null); if(!b0 && el.value){ put("hcc.bible", {ed: el.value, b: "JOH", c: 1, cmp: "", v: 0}); } }catch(err){} if(window.HCCToast) HCCToast(t("Default Bible saved")); }\n  else if(el.id === "setAuto"){',
  ['site/index.html', 'tools/v18.js']),
]

TR = {
 "Default Bible": ["Biblia predeterminada", "Bíblia padrão", "Bible par défaut", "الكتاب المقدس الافتراضي"],
 "The edition I am reading": ["La edición que estoy leyendo", "A edição que estou lendo", "L’édition que je lis", "الطبعة التي أقرأها"],
 "Default Bible saved": ["Biblia predeterminada guardada", "Bíblia padrão salva", "Bible par défaut enregistrée", "حُفظ الكتاب المقدس الافتراضي"],
 "Used for verses quoted in Studies, Bible references, the verse of the day and links that open the Bible. Books it does not have come from another edition.": [
   "Se usa para los versículos citados en Estudios, las referencias bíblicas, el versículo del día y los enlaces que abren la Biblia. Los libros que no tiene se toman de otra edición.",
   "Usada nos versículos citados em Estudos, nas referências bíblicas, no versículo do dia e nos links que abrem a Bíblia. Os livros que ela não tem vêm de outra edição.",
   "Utilisée pour les versets cités dans les Études, les références bibliques, le verset du jour et les liens qui ouvrent la Bible. Les livres qu’elle n’a pas viennent d’une autre édition.",
   "تُستخدم للآيات المقتبسة في الدراسات والمراجع الكتابية وآية اليوم والروابط التي تفتح الكتاب المقدس. الأسفار غير الموجودة فيها تؤخذ من طبعة أخرى."],
}

print('Edition 22: default Bible edition')
files = {}
def src(f):
    if f not in files: files[f] = open(P(f), encoding='utf-8').read()
    return files[f]

for label, old, new, targets in PATCHES:
    for f in targets:
        s = src(f)
        if new in s: print('  %-28s %-16s already applied' % (label, f)); continue
        if s.count(old) != 1: sys.exit('v22: expected exactly one match for %s in %s, found %d' % (label, f, s.count(old)))
        files[f] = s.replace(old, new); print('  %-28s %-16s done' % (label, f))

for f in ['site/index.html', 'tools/v18.js']:
    s = src(f); i = s.index('var T = {'); j = s.index('\n};', i); T = s[i:j]
    add = [(k, v) for k, v in TR.items() if '%s:' % json.dumps(k, ensure_ascii=False) not in T]
    if add:
        line = '\n' + ', '.join('%s:%s' % (json.dumps(k, ensure_ascii=False), json.dumps(v, ensure_ascii=False)) for k, v in add) + ','
        files[f] = s[:i + len('var T = {')] + line + s[i + len('var T = {'):]
    print('  %-28s %-16s %d added' % ('translations', f, len(add)))

for f, s in files.items():
    open(P(f), 'w', encoding='utf-8').write(s)
