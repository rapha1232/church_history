"""Edition 26: Fathers on this verse. Run after tools/v25.py, from the repository root:

    python3 tools/v20.py && python3 tools/v21.py && python3 tools/v22.py && python3 tools/v23.py && python3 tools/v24.py && python3 tools/v25.py && python3 tools/v26.py

Idempotent. What it does to site/index.html (and the sources it was built from):
  1. Extends window.HCCBible with fcount (excerpts and distinct authors per verse of a chapter, from the Fathers'
     commentary already in site/bible/fath/), state and openTab. The same text is in tools/v21.py's Bible API.
  2. Adds Settings > Church Fathers in the Bible (a switch; on by default).
  3. Appends tools/v26.css and tools/v26.js at the end of <body>.
"""
import json, os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
P = lambda *a: os.path.join(ROOT, *a)
files = {}
def src(f):
    if f not in files: files[f] = open(P(f), encoding='utf-8').read()
    return files[f]
def once(label, old, new, targets):
    for f in targets:
        s = src(f)
        if new in s: print('  %-28s %-16s already applied' % (label, f)); continue
        if s.count(old) != 1: sys.exit('v26: expected exactly one match for %s in %s, found %d' % (label, f, s.count(old)))
        files[f] = s.replace(old, new); print('  %-28s %-16s done' % (label, f))

print('Edition 26: Fathers on this verse')
API_OLD = "  cur: function(){ return cur; }\n};"
API_NEW = """  /* Edition 26: how many excerpts in the Fathers' commentary cover each verse of a chapter */
  fcount: function(ed, b, c, cb){ try{ var ob = origBook(b) || b, ch = engCh(ed, b, c), g = grpOf(ob);
    script("bible/fath/"+g+".js", function(){ return !!FATH[ob] || FATH["__"+g]; }, function(){ FATH["__"+g] = 1; var n = {}, who = {};
      (pick(FATH[ob], ch) || []).forEach(function(e){ for(var v = e[0]; v <= e[1] && v - e[0] < 200; v++){ n[v] = (n[v] || 0) + 1; (who[v] = who[v] || {})[e[2]] = 1; } });
      var out = {}; Object.keys(n).forEach(function(v){ out[v] = [n[v], Object.keys(who[v]).length]; }); cb(out); }); }catch(e){ cb({}); } },
  state: function(){ return {ed: st.ed, b: st.b, c: st.c, mode: mode}; },
  openTab: function(v, t){ try{ openVerseTab(v, t); }catch(e){} },
  cur: function(){ return cur; }
};"""
once('Bible API', API_OLD, API_NEW, ['site/index.html', 'tools/v21.py'])

SET_OLD = '  var DE = (window.__BIBMAN__ || {eds: []}).eds, de = get("hcc.bible.def", "");'
SET_NEW = ('''  h += section("Church Fathers in the Bible", '<label class="set-row"><span><small>' + esc(t("Show how many excerpts from the Church Fathers comment on each verse. Tap the number to read them.")) + '</small></span><input type="checkbox" class="switch" id="setFcount"' + (get("hcc.bible.fcount", "1") !== "0" ? " checked" : "") + '></label>');\n''' + SET_OLD)
once('Settings switch', SET_OLD, SET_NEW, ['site/index.html', 'tools/v18.js'])
CH_OLD = '  else if(el.id === "setDefEd"){'
CH_NEW = '  else if(el.id === "setFcount"){ put("hcc.bible.fcount", el.checked ? "1" : "0"); if(window.HCCFathersCount) HCCFathersCount.refresh(); }\n' + CH_OLD
once('Settings change', CH_OLD, CH_NEW, ['site/index.html', 'tools/v18.js'])

TR = {
 "Church Fathers in the Bible": ["Padres de la Iglesia en la Biblia", "Padres da Igreja na Bíblia", "Pères de l’Église dans la Bible", "آباء الكنيسة في الكتاب المقدس"],
 "Show how many excerpts from the Church Fathers comment on each verse. Tap the number to read them.": [
   "Muestra cuántos extractos de los Padres de la Iglesia comentan cada versículo. Toca el número para leerlos.",
   "Mostra quantos trechos dos Padres da Igreja comentam cada versículo. Toque no número para lê-los.",
   "Indique combien d’extraits des Pères de l’Église commentent chaque verset. Touchez le nombre pour les lire.",
   "يعرض عدد المقتطفات من آباء الكنيسة التي تعلق على كل آية. المس الرقم لقراءتها."],
}
for f in ['site/index.html', 'tools/v18.js']:
    s = src(f); i = s.index('var T = {'); j = s.index('\n};', i); T = s[i:j]
    add = [(k, v) for k, v in TR.items() if '%s:' % json.dumps(k, ensure_ascii=False) not in T]
    if add:
        line = '\n' + ', '.join('%s:%s' % (json.dumps(k, ensure_ascii=False), json.dumps(v, ensure_ascii=False)) for k, v in add) + ','
        files[f] = s[:i + len('var T = {')] + line + s[i + len('var T = {'):]
    print('  %-28s %-16s %d added' % ('translations', f, len(add)))

s = src('site/index.html')
css = open(P('tools', 'v26.css'), encoding='utf-8').read()
js = open(P('tools', 'v26.js'), encoding='utf-8').read()
block = '<style id="ed26">\n' + css + '</style>\n<script id="ed26js">\n' + js + '</script>\n'
s = re.sub(r'<style id="ed26">.*?</style>\n<script id="ed26js">.*?</script>\n', '', s, flags=re.S)
k = s.rindex('</body>')
files['site/index.html'] = s[:k] + block + s[k:]
print('  %-28s done' % 'layer')
for f, s in files.items():
    open(P(f), 'w', encoding='utf-8').write(s)
