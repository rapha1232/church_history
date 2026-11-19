"""Edition 19 layer: Settings page (language, backup, Bible editions from a file, offline study packs, updates),
the Fathers' commentary link (#bible~ed~BOOK~c~v~comm) and the loader hook for imported editions.
Run after extras8.py:  python3 tools/extras9.py [path/to/index.html]  (default site/index.html). Also patches tools/v13.js."""
import json, sys
PATH = sys.argv[1] if len(sys.argv) > 1 else 'site/index.html'
LOAD_A = '  if(WAIT[k]){ WAIT[k].push(cb); return; } WAIT[k] = [cb];\n'
LOAD_B = LOAD_A + ('  if(window.HCCUserEd && HCCUserEd.owns(src)){ HCCUserEd.load(src, b, function(d){ if(d) CACHE[k] = d; var w = WAIT[k] || []; delete WAIT[k]; '
                   'w.forEach(function(f){ f(d); }); }); return; }\n')
ROUTE_A = 'if(h.indexOf("bible~") === 0){ var p = h.split("~"); history.replaceState(null, "", "#home"); go(p[1], p[2], +p[3], +p[4]); return; }'
ROUTE_B = 'if(h.indexOf("bible~") === 0){ var p = h.split("~"); history.replaceState(null, "", "#home"); go(p[1], p[2], +p[3], +p[4]); if(p[5] && +p[4]) openVerseTab(+p[4], p[5]); return; }'
FN_A = '/* ---------- route ---------- */\nvar rendered = false;'
FN_B = ('/* open a verse straight on one tab of its sheet (the widgets\' "What the Fathers said" uses ~comm) */\n'
        'function openVerseTab(v, t){ if(["orig","eds","links","comm"].indexOf(t) < 0) return; var n = 0;\n'
        '  (function find(){ var el = view && view.querySelector(\'.bv[data-v="\'+v+\'"]\'); if(el){ tab = t; openSheet(el); return; } if(++n < 50) setTimeout(find, 150); })(); }\n') + FN_A


def patch_bible(s):
    if 'HCCUserEd.owns(src)' not in s:
        assert s.count(LOAD_A) == 1 and s.count(ROUTE_A) == 1 and s.count(FN_A) == 1
        s = s.replace(LOAD_A, LOAD_B).replace(ROUTE_A, ROUTE_B).replace(FN_A, FN_B)
    return s


v13 = open('tools/v13.js', encoding='utf-8').read()
open('tools/v13.js', 'w', encoding='utf-8').write(patch_bible(v13))

h = open(PATH, encoding='utf-8').read()
h = patch_bible(h)
PRE_AT = '<script>(function(){\n"use strict";\nvar M = window.__BIBMAN__, VOTD'
if 'Edition 19: Bible editions the reader added' not in h:
    assert h.count(PRE_AT) == 1
    h = h.replace(PRE_AT, '<script>' + open('tools/v18pre.js', encoding='utf-8').read() + '</script>' + PRE_AT)
if 'id="ref-settings"' not in h:
    page = ('<article id="ref-settings" data-title="Settings" data-vol="ref" data-kind="ref" data-topics="settings"><p class="eyebrow">Reference · This app</p>'
            '<h2>Settings</h2><p class="lede">Language, your reading and notes, Bible editions you add, offline packs and updates.</p><div class="set-mount"></div></article>')
    k = h.index('<article id="ref-atlas"')
    h = h[:k] + page + h[k:]
    nav = '<li><a href="#ref-zoom" class="newtag">Interactive timeline</a></li>'
    assert nav in h
    h = h.replace(nav, nav + '<li><a href="#ref-settings" class="newtag">Settings</a></li>', 1)
    i = h.index('window.__DATA__=') + 16; j = h.index('</script>', i)
    raw = h[i:j].rstrip(); semi = raw.endswith(';'); D = json.loads(raw.rstrip(';'))
    if 'ref-settings' not in D['order']: D['order'].append('ref-settings')
    D['search'].append({'id': 'ref-settings', 'title': 'Settings', 'k': 'Reference', 't': 'settings language backup restore export import edition offline download update widgets', 'b': ''})
    h = h[:i] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + (';' if semi else '') + h[j:]
if '/* Edition 19: the Settings page' not in h:
    k = h.rindex('</body>')
    h = h[:k] + '<script>' + open('tools/v18.js', encoding='utf-8').read() + '</script>\n' + h[k:]
open(PATH, 'w', encoding='utf-8').write(h)
print('edition 19 layer applied to', PATH)
