"""Edition 15 layer: why-it-matters notes, timeline page, onboarding, sources drawer, accents, tablet layouts."""
import json, re, sys, html as H
sys.path.insert(0, '/home/user/church/tools')
import bibcur2 as C2
R = '/home/user/church/'
PATH = R + 'site/index.html'
h = open(PATH, encoding='utf-8').read()
if 'id="ref-zoom"' in h: raise SystemExit('extras7 already applied')
def esc(s): return H.escape(s or '', quote=True)
n = 0
def why(m):
    global n
    aid, attrs, body = m.group(1), m.group(2), m.group(3)
    if aid not in C2.WHY: return m.group(0)
    card = '<aside class="why" aria-label="Why it matters today"><p class="shelf-h">Why it matters today</p><p>%s</p></aside>' % esc(C2.WHY[aid])
    k = body.find('<aside class="takeaways"')
    if k < 0: k = body.find('<aside class="upnext"')
    if k < 0: k = len(body)
    n += 1
    return '<article id="%s"%s>%s</article>' % (aid, attrs, body[:k] + card + body[k:])
h = re.sub(r'<article id="([^"]+)"([^>]*)>(.*?)</article>', why, h, flags=re.S)
tl = ('<article id="ref-zoom" data-title="Interactive timeline" data-vol="ref" data-kind="ref" data-topics="calendar" class="wide"><p class="eyebrow">Reference · From 1000 BC to today</p><h2>Interactive timeline</h2>'
      '<p class="lede">Every episode, council, person and anniversary in one zoomable line. Pinch or use the buttons to zoom; drag or scroll sideways to travel; tap anything to open it.</p>'
      '<div class="tl-bar"><div class="cm-chips" role="group" aria-label="Show">'
      '<button type="button" class="chip" data-tl="ep">Episodes</button><button type="button" class="chip" data-tl="co">Councils</button><button type="button" class="chip" data-tl="pe">People</button><button type="button" class="chip" data-tl="ev">Events</button></div>'
      '<div class="cm-chips" role="group" aria-label="Jump to"><button type="button" class="chip" data-tr="-1050,2030">All</button><button type="button" class="chip" data-tr="-200,150">Jesus &amp; apostles</button><button type="button" class="chip" data-tr="100,800">Fathers &amp; councils</button><button type="button" class="chip" data-tr="800,1500">Middle Ages</button><button type="button" class="chip" data-tr="1480,1700">Reformation</button><button type="button" class="chip" data-tr="1700,2030">Modern</button></div>'
      '<div class="tl-zoom"><button type="button" class="iconbtn" data-tz="0.6666" aria-label="Zoom out">−</button><output></output><button type="button" class="iconbtn" data-tz="1.5" aria-label="Zoom in">+</button></div></div>'
      '<div class="tl-wrap" tabindex="0" aria-label="Timeline, scroll sideways"><div class="tl-axis"></div><div class="tl-track"></div></div><div class="tl-card cm-card" hidden aria-live="polite"></div></article>')
k = h.index('<article id="ref-atlas"')
h = h[:k] + tl + h[k:]
h = h.replace('<li><a href="#ref-tree" class="newtag">', '<li><a href="#ref-zoom" class="newtag">Interactive timeline</a></li><li><a href="#ref-tree" class="newtag">', 1)
i = h.index('window.__DATA__=') + 16; j = h.index('</script>', i)
raw = h[i:j].rstrip(); semi = raw.endswith(';'); D = json.loads(raw.rstrip(';'))
if 'ref-zoom' not in D['order']: D['order'].insert(D['order'].index('ref-tree') if 'ref-tree' in D['order'] else len(D['order']), 'ref-zoom')
for _e in D['search']: _e['b'] = ''   # the live search reads the pages themselves; the old index text only slowed start-up
D['search'].append({'id': 'ref-zoom', 'title': 'Interactive timeline', 'k': 'Reference', 't': 'timeline chronology dates years zoom', 'b': ''})
h = h[:i] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + (';' if semi else '') + h[j:]
css = open(R + 'tools/v16.css', encoding='utf-8').read(); js = open(R + 'tools/v16.js', encoding='utf-8').read()
h = h.replace('</style>\n</head>', css + '</style>\n</head>', 1)
k = h.rindex('</body>')
h = h[:k] + '<script>' + js + '</script>\n' + h[k:]
h = h.replace('Edition 14 · The Series', 'Edition 15 · The Series')
open(PATH, 'w', encoding='utf-8').write(h)
print('why notes', n, 'html MB', round(len(h.encode()) / 1e6, 2))
