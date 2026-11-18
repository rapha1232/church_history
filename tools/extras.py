"""Edition 8 layer on top of series.py: cast, maps, scene breaks, creed compare, notebook, quotes, season colours."""
import json, re, math, html as H, sys
sys.path.insert(0, '/home/user/church/tools')
from places import P as PLACES, SPREAD
import geo
R = '/home/user/church/'
PATH = R + 'site/index.html'
h = open(PATH, encoding='utf-8').read()
if 'id="landR"' in h: raise SystemExit('extras already applied')
i = h.index('window.__IMG__=') + 15; IMG = json.loads(h[i:h.index(';</script>', i)])
i = h.index('window.__EP__=') + 14; EP = json.loads(h[i:h.index(';window.__SEASONS__', i)])
i = h.index('window.__SEASONS__=') + 19; SE = json.loads(h[i:h.index(';</script>', i)])
def esc(s): return H.escape(s or '', quote=True)
def text(s):
    s = re.sub(r'<(button|sup|figure|figcaption|script|style|header|aside)\b.*?</\1>', ' ', s, flags=re.S)
    return re.sub(r'\s+', ' ', H.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()

ROM = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii', 'xiii', 'xiv', 'xv']
# ---------- season colours (light, dark) ----------
COL = {'i': ('#8a6a2e', '#d8b46a'), 'ii': ('#3d6b55', '#7fc3a2'), 'iii': ('#9a3a28', '#ee8c74'), 'iv': ('#6b3a7a', '#c39ad2'),
       'v': ('#8a5a22', '#e0a463'), 'vi': ('#2c5b8c', '#8fb7ea'), 'vii': ('#977015', '#e6c25c'), 'viii': ('#3f6b37', '#97c98c'),
       'ix': ('#8a2a3c', '#ec8a9c'), 'x': ('#57478c', '#ab9ce6'), 'xi': ('#36404d', '#b7c2d1'), 'xii': ('#8c2c5c', '#e98fbd'),
       'xiii': ('#1f6b6b', '#79cdcd'), 'xiv': ('#6e5634', '#d3b484'), 'xv': ('#21668a', '#7cc3e8'), 'p3': ('#4d5878', '#aab4d6'), 'p4': ('#69557a', '#c4add6')}
css_sc = ''.join('article[data-vol="%s"]{--rubric:%s;--sc:%s;--scl:%s}' % (k, a, a, b) for k, (a, b) in COL.items())
css_scd = ''.join('article[data-vol="%s"]{--rubric:%s;--sc:%s}' % (k, b, b) for k, (a, b) in COL.items())
SC = {k: v for k, v in COL.items()}

# ---------- articles ----------
arts = {}
for m in re.finditer(r'<article id="([^"]+)"([^>]*)>(.*?)</article>', h, re.S):
    a = dict(re.findall(r'data-([a-z]+)="([^"]*)"', m.group(2))); a['id'] = m.group(1); a['body'] = m.group(3); a['span'] = m.span()
    arts[m.group(1)] = a

# ---------- people & cast ----------
pb = arts['ref-people']['body']
PEOPLE = {}
for m in re.finditer(r'<div class="person(?: noimg)?" id="([^"]+)">(.*?)<div class="pbody"><h4>(.*?)</h4><div class="d">(.*?)</div><div>(.*?)</div></div></div>', pb, re.S):
    pid, head, name, d, summ = m.groups()
    name = H.unescape(re.sub('<[^>]+>', '', name))
    if any(p['name'] == name for p in PEOPLE.values()): continue
    im = re.search(r'data-img="([^"]+)"', head)
    link = re.search(r'href="#([^"]+)"', summ)
    PEOPLE[pid] = {'name': name, 'd': H.unescape(re.sub('<[^>]+>', '', d)), 'sum': text(re.sub(r'<a [^>]*>→</a>', '', summ)), 'img': im.group(1) if im else '', 'link': link.group(1) if link else ''}
GEN = set('John Gregory Leo Pope Saint St. Cyril Clement Peter Paul James Thomas Francis Martin Benedict Innocent Pius Ignatius Theodore Eusebius Dionysius Simeon Mary Charles William Henry Louis Frederick Philip Isaac Jacob Stephen Mar Herod Boris Damasus Celestine Boniface Gregory'.split())
ALIAS = {'Gregory I “the Great”': r'Gregory the Great|Gregory I\b', 'Leo I “the Great”': r'Leo the Great|Leo I\b', 'Peter (Simon Cephas)': r'Peter(?! (?:the Great|Lombard|Abelard|Mogila|Waldo|of|Damian|Chrysologus|Canisius|III|II)\b)',
         'Paul of Tarsus': r'(?<!John )Paul(?! (?:of Samosata|VI|III|II|IV|the Deacon)\b)', 'Constantine I': r'Constantine(?! (?:V|VI|IV|XI|IX|VII)\b)(?!ople)', 'Theodosius I': r'Theodosius(?! II)',
         'Justinian I': r'Justinian', 'Damasus I': r'Damasus', 'Celestine I': r'Celestine(?! V\b)', 'Martin I': r'Pope Martin|Martin I\b', 'Martin Luther': r'Luther(?!an)',
         'John Calvin': r'Calvin(?!is)', 'Herod the Great': r'Herod the Great', 'Herod Antipas': r'Antipas', 'Ignatius of Antioch': r'Ignatius(?! of Loyola| Loyola)',
         'Ignatius of Loyola': r'Loyola', 'Clement of Rome': r'Clement of Rome|1 Clement', 'Clement of Alexandria': r'Clement of Alexandria', 'Cyril of Alexandria': r'Cyril of Alexandria',
         'John of Damascus': r'John of Damascus|Damascene', 'Gregory of Nazianzus': r'Nazianz(?:us|en)', 'Gregory Palamas': r'Palamas', 'Eusebius of Caesarea': r'Eusebius(?! of Nicomedia)',
         'Francis of Assisi': r'Francis of Assisi', 'Dominic': r'Dominic(?!an)', 'Irenaeus of Lyons': r'Irenaeus', 'Constantine': r'Constantine', 'Pontius Pilate': r'Pilate',
         'Boris I of Bulgaria': r'Boris', 'Vladimir of Kiev': r'Vladimir', 'Antony of Egypt': r'Antony(?! of Padua)', 'Mar Dinkha IV': r'Dinkha', 'Erasmus of Rotterdam': r'Erasmus',
         'Teresa of Ávila': r'Teresa of Ávila|Teresa of Avila', 'John the Baptist': r'John the Baptist', 'Basil of Caesarea': r'Basil(?! II\b)', 'Bernard of Clairvaux': r'Bernard of Clairvaux|Bernard\b(?! of)',
         'Polycarp of Smyrna': r'Polycarp', 'Cyprian of Carthage': r'Cyprian', 'Augustine of Hippo': r'Augustine(?! of Canterbury)', 'Anselm of Canterbury': r'Anselm', 'Athenagoras I': r'Patriarch Athenagoras|Athenagoras I\b',
         'Henry VIII': r'Henry VIII', 'Innocent III': r'Innocent III', 'Boniface VIII': r'Boniface VIII', 'Pius IX': r'Pius IX', 'John Paul II': r'John Paul II', 'Leo IX': r'Leo IX',
         'Stephen Douaihy': r'Douaihy|Duwayhi', 'Samuel Ajayi Crowther': r'Crowther', 'Ellen G. White': r'Ellen (?:G\. )?White', 'John Henry Newman': r'Newman', 'Galileo Galilei': r'Galileo',
         'Cyrus the Great': r'Cyrus', 'Judas Maccabeus': r'Judas Maccabe', 'Antiochus IV Epiphanes': r'Antiochus IV|Antiochus Epiphanes'}
def matcher(name):
    if name in ALIAS: return re.compile(r'\b(?:%s)' % ALIAS[name])
    parts = [re.escape(name)]
    w = name.split()
    if ' of ' in name and w[0] not in GEN: parts.append(re.escape(w[0]) + r'\b')
    elif ' of ' not in name and len(w) > 1 and w[-1] not in GEN and len(w[-1]) > 3 and not re.match(r'^[IVX]+$', w[-1]): parts.append(re.escape(w[-1]) + r'\b')
    elif len(w) == 1: parts.append(re.escape(w[0]) + r'\b')
    return re.compile(r'\b(?:%s)' % '|'.join(parts))
MATCH = {pid: matcher(p['name']) for pid, p in PEOPLE.items()}
CAST = {}; APPEAR = {pid: [] for pid in PEOPLE}
for eid in EP:
    t = text(arts[eid]['body'])
    found = []
    for pid, rx in MATCH.items():
        ms = list(rx.finditer(t))
        if ms: found.append((pid, len(ms), ms[0].start()))
    found.sort(key=lambda x: -x[1]); found = found[:8]; found.sort(key=lambda x: x[2])
    CAST[eid] = [f[0] for f in found]
    for f in found: APPEAR[f[0]].append(eid)

# ---------- places ----------
PL = []
for name, lat, lon, extra, kind in PLACES:
    pat = re.escape(name) + ('|' + extra if extra else '')
    PL.append({'n': name, 'lat': lat, 'lon': lon, 'k': kind, 'rx': re.compile(r'\b(?:%s)\b' % pat)})
EPL = {}
for eid in EP:
    t = text(arts[eid]['body'])
    EPL[eid] = [k for k, p in enumerate(PL) if p['rx'].search(t)]
pr, br, Wr, Hr = geo.regional(); pw, bw, Ww, Hw = geo.world()
def proj(p, which):
    if which == 'reg':
        x, y = pr(p['lon'], p['lat']); return ((x - br[0]) * Wr / (br[2] - br[0]), (y - br[1]) * Hr / (br[3] - br[1]))
    x, y = pw(p['lon'], p['lat']); return ((x - bw[0]) * Ww / (bw[2] - bw[0]), (y - bw[1]) * Hw / (bw[3] - bw[1]))
def inreg(p): return -12 <= p['lon'] <= 62 and 8.5 <= p['lat'] <= 60.5
def viewbox(pts, which, minw):
    W, Hh = (Wr, Hr) if which == 'reg' else (Ww, Hw)
    xs = [x for x, y in pts]; ys = [y for x, y in pts]
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    w = max(max(xs) - min(xs) + 80, minw); hh = max(max(ys) - min(ys) + 70, w * 0.62); w = max(w, hh / 0.62)
    w = min(w, W); hh = min(hh, Hh)
    x0 = min(max(0, cx - w / 2), W - w); y0 = min(max(0, cy - hh / 2), Hh - hh)
    return '%.0f %.0f %.0f %.0f' % (x0, y0, w, hh)
def year0(per):
    m = re.match(r'\s*(-?\d+)', (per or '').replace('–', '-'))
    return int(m.group(1)) if m else None
PERIOD = {aid: arts[aid].get('period', '') for aid in arts}
def season_map(s):
    eps = s['e']; first = {}
    for k, eid in enumerate(eps):
        for pi in EPL.get(eid, []): first.setdefault(pi, k + 1)
    if len(first) < 2: return ''
    which = 'reg' if all(inreg(PL[pi]) for pi in first) else 'world'
    pts = {pi: proj(PL[pi], which) for pi in first}
    vb = viewbox(list(pts.values()), which, 360 if which == 'reg' else 700)
    vw = float(vb.split()[2]); sc = vw / 1000
    yrs = []
    for k, eid in enumerate(eps):
        y = year0(PERIOD.get(eid)); yrs.append(y if y is not None else (yrs[-1] if yrs else None))
    sp = ''
    for name, lat, lon, yr in SPREAD:
        p = {'lat': lat, 'lon': lon}
        if which == 'reg' and not inreg(p): continue
        x, y = proj(p, which)
        sp += '<circle class="sp" cx="%.1f" cy="%.1f" r="%.1f" data-y="%d"><title>%s (c. %d)</title></circle>' % (x, y, 26 * sc + 6, yr, esc(name), yr)
    pins = ''
    for pi, k in sorted(first.items(), key=lambda x: x[1]):
        x, y = pts[pi]; p = PL[pi]
        eps_here = [eid for eid in eps if pi in EPL.get(eid, [])]
        big = p['k'] in ('see', 'council') or len(eps_here) >= 2
        pins += ('<g class="pin%s" data-e="%d" transform="translate(%.1f %.1f)"><a href="#%s"><title>%s — %s</title><circle r="%.1f"/><circle class="halo" r="%.1f"/>'
                 '<text x="%.1f" y="%.1f">%s</text></a></g>') % (' big' if big else '', k, x, y, eps_here[0], esc(p['n']), esc('; '.join(EP[e]['g'] + ' ' + EP[e]['t'] for e in eps_here[:3])),
                                                                  4.2 * sc + 1.2, 9 * sc + 3, 7 * sc + 2, 3.5 * sc + 1, esc(p['n']))
    labels = json.dumps([{'g': EP[e]['g'], 't': EP[e]['t'], 'y': yrs[k]} for k, e in enumerate(eps)], ensure_ascii=False)
    return ('<figure class="smap" data-n="%d" data-labels="%s"><div class="smap-top"><h3 class="shelf-h">The map of this season</h3>'
            '<button type="button" class="mplay" aria-label="Play the season on the map"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg><span>Play</span></button></div>'
            '<div class="smap-svg"><svg viewBox="%s" role="img" aria-label="Map of places in %s" style="--fs:%.2fpx"><use href="#land%s" class="land"/><g class="spread">%s</g><g class="pins">%s</g></svg></div>'
            '<div class="smap-ctl"><input type="range" min="1" max="%d" value="%d" aria-label="Episode on the map"><output></output></div>'
            '<figcaption>Places named in each episode, in the order they first appear. Soft circles mark where and roughly when peoples or rulers adopted Christianity. Select a place to open its episode.</figcaption></figure>') % (
        len(eps), esc(labels), vb, esc(s['t']), 9 * sc + 3, 'R' if which == 'reg' else 'W', sp, pins, len(eps), len(eps))
def ep_map(eid):
    pis = EPL.get(eid, [])
    if not pis: return ''
    which = 'reg' if all(inreg(PL[pi]) for pi in pis) else 'world'
    pts = {pi: proj(PL[pi], which) for pi in pis}
    vb = viewbox(list(pts.values()), which, 260 if which == 'reg' else 600)
    sc = float(vb.split()[2]) / 1000
    pins = ''.join('<g class="pin big" transform="translate(%.1f %.1f)"><title>%s</title><circle r="%.1f"/><circle class="halo" r="%.1f"/><text x="%.1f" y="%.1f">%s</text></g>' % (
        x, y, esc(PL[pi]['n']), 4.4 * sc + 1.4, 9 * sc + 3, 7 * sc + 2, 3.5 * sc + 1, esc(PL[pi]['n'])) for pi, (x, y) in pts.items())
    return ('<figure class="emap"><div class="smap-top"><h3 class="shelf-h">Where this episode happens</h3></div><div class="smap-svg"><svg viewBox="%s" role="img" aria-label="Map: %s" style="--fs:%.2fpx">'
            '<use href="#land%s" class="land"/><g class="pins">%s</g></svg></div></figure>') % (vb, esc(', '.join(PL[pi]['n'] for pi in pis)), 9 * sc + 3, 'R' if which == 'reg' else 'W', pins)

# ---------- per-episode rewrite ----------
def cast_html(eid):
    ids = CAST.get(eid) or []
    if not ids: return ''
    out = []
    for pid in ids:
        p = PEOPLE[pid]; im = IMG.get(p['img'])
        ph = '<span class="cav" style="background:%s"><img src="%s" alt="" loading="lazy" decoding="async"></span>' % (im['c'], im['src']) if im else '<span class="cav none">%s</span>' % esc(p['name'][:1])
        out.append('<button type="button" class="cm" data-person="%s">%s<span><b>%s</b><small>%s</small></span></button>' % (pid, ph, esc(p['name']), esc(p['d'].split('·')[0].strip())))
    return '<section class="cast" aria-label="Cast"><p class="cast-h">Starring</p><div class="cast-row">%s</div></section>' % ''.join(out)
def scene_breaks(body):
    tiles = re.findall(r'<button type="button" class="tile" data-img="([^"]+)"[^>]*>.*?</button>', body, re.S)
    big = [t for t in tiles if IMG.get(t, {}).get('iw', 0) >= 600][:2]
    if not big: return body
    h3s = [m.start() for m in re.finditer(r'\n?<h3 id="[^"]+">', body)]
    targets = [h3s[k] for k in (1, 3) if k < len(h3s)][:len(big)]
    if not targets: return body
    for t in big[:len(targets)]:
        body = re.sub(r'<button type="button" class="tile" data-img="%s"[^>]*>.*?</button>' % t, '', body, count=1, flags=re.S)
    if not re.search(r'<button type="button" class="tile"', body):
        body = re.sub(r'<div class="strip">.*?</div></div>', '', body, count=1, flags=re.S)
    h3s = [m.start() for m in re.finditer(r'\n?<h3 id="[^"]+">', body)]
    targets = [h3s[k] for k in (1, 3) if k < len(h3s)][:len(big)]
    for pos, t in sorted(zip(targets, big), reverse=True):
        d = IMG[t]
        fig = ('<figure class="sbreak bleed"><button type="button" class="sb-media" data-img="%s" aria-label="Enlarge: %s" style="background:%s"><img src="%s" alt="%s" loading="lazy" decoding="async"></button>'
               '<figcaption><b>%s</b>%s</figcaption></figure>') % (t, esc(d['t']), d['c'], d['src'], esc(d.get('alt') or d['t']), esc(d['t']), (' — ' + esc(d['d'])) if d.get('d') else '')
        body = body[:pos] + fig + body[pos:]
    return body
repl = {}
for eid in EP:
    b = arts[eid]['body']
    b = scene_breaks(b)
    k = b.find('</header>')
    if k >= 0: b = b[:k + 9] + cast_html(eid) + b[k + 9:]
    mp = ep_map(eid)
    if mp:
        k = b.find('<section class="notes"')
        if k < 0: k = b.find('<aside class="upnext"')
        if k < 0: k = len(b)
        b = b[:k] + mp + b[k:]
    repl[eid] = b
for s in SE:
    b = arts[s['id']]['body']
    mp = season_map(s)
    if mp:
        k = b.find('</section>', b.find('<section class="eplist"')) + 10
        b = b[:k] + mp + b[k:]
    repl[s['id']] = b

# ---------- compare creeds (new reference article) ----------
DOCS = {d['id']: d for d in json.load(open(R + 'docs.json'))}
def flat(d): return ' '.join(x.get('p', '') for x in d['body'] if isinstance(x, dict) and x.get('p'))
nic = flat(DOCS['nicene'])
east = re.sub(r'\s*\[(?:God of God|and the Son|essence)\]', '', nic).replace('[I believe] ', '').replace('[I believe]', '')
west = re.sub(r'\s*\[essence\]', '', nic); west = re.sub(r'\[(God of God|and the Son)\]', r'\1', west).replace('[I believe] ', 'I believe ')
CREEDS = {
 'n': {'t': 'Nicaea (325) and Constantinople (381)', 'a': ['The Creed of Nicaea, 325', flat(DOCS['nicaea325'])], 'b': ['The Nicene Creed of 381 (as received in the East)', east],
       'note': 'The council of 381 enlarged the third article on the Holy Spirit, dropped the anathemas and smoothed the second article. The two English versions come from different translations, so some differences are of wording only.'},
 'f': {'t': 'East and West: the Filioque', 'a': ['Nicene Creed, Eastern form (381)', east], 'b': ['Nicene Creed, Western form', west],
       'note': 'The Latin West added “and the Son” (Filioque) to the procession of the Spirit, first in Spain (589) and later at Rome (1014). It remains a dividing point between Orthodox and Western Churches.'},
 'a': {'t': 'The Old Roman Creed and the Apostles’ Creed', 'a': ['The Old Roman Creed (c. 340)', flat(DOCS['old-roman'])], 'b': ['The Apostles’ Creed (received text)', flat(DOCS['apostles'])],
       'note': 'The Apostles’ Creed grew out of the baptismal creed of Rome. Clauses such as “maker of heaven and earth”, “descended into hell”, “communion of saints” and “life everlasting” were added in Gaul between the 5th and 8th centuries.'},
}
cmp_art = ('<article id="ref-compare" data-title="Compare the creeds" data-vol="ref" data-kind="ref" data-topics="creeds"><p class="eyebrow">Reference · Creeds side by side</p><h2>Compare the creeds</h2>'
           '<p class="lede">See exactly what changed between the great creeds. Additions are underlined, omissions struck through, and identical wording stays plain.</p>'
           '<div class="cmp-tabs" role="tablist">%s</div><div class="cmp-mode" role="group" aria-label="View"><button type="button" data-m="side" aria-pressed="true">Side by side</button><button type="button" data-m="merge" aria-pressed="false">Merged</button></div>'
           '<p class="cmp-note" id="cmpNote"></p><div class="cmp" id="cmp"></div></article>') % ''.join(
    '<button type="button" role="tab" data-c="%s" aria-selected="%s">%s</button>' % (k, 'true' if k == 'n' else 'false', esc(v['t'])) for k, v in CREEDS.items())
notebook = ('<article id="ref-notebook" data-title="My notebook" data-vol="ref" data-kind="ref" data-topics="notes"><p class="eyebrow">Your highlights and notes</p><h2>My notebook</h2>'
            '<p class="lede">Select any text in an episode to highlight it or add a note. Everything stays on this device; export it any time.</p>'
            '<div class="nb-tools"><button type="button" class="btn-sm" data-nb="md">Export as Markdown</button><button type="button" class="btn-sm" data-nb="json">Export backup (JSON)</button>'
            '<label class="btn-sm">Import backup<input type="file" accept="application/json,.json" hidden id="nbImport"></label></div><div id="nbList"></div></article>')

# ---------- apply article rewrites ----------
for aid in sorted(repl, key=lambda x: arts[x]['span'][0], reverse=True):
    s0, s1 = arts[aid]['span']; whole = h[s0:s1]
    ot = whole[:whole.index('>') + 1]
    h = h[:s0] + ot + repl[aid] + '</article>' + h[s1:]
k = h.index('<article id="ref-atlas"')
h = h[:k] + cmp_art + notebook + h[k:]
h = h.replace('<li><a href="#ref-atlas">Atlas</a></li>', '<li><a href="#ref-compare" class="newtag">Compare the creeds</a></li><li><a href="#ref-notebook" class="newtag">My notebook</a></li><li><a href="#ref-atlas">Atlas</a></li>', 1)
i = h.index('window.__DATA__=') + len('window.__DATA__='); j = h.index('</script>', i)
raw = h[i:j].rstrip(); semi = raw.endswith(';'); D = json.loads(raw.rstrip(';'))
o = D['order']; o.insert(o.index('ref-atlas'), 'ref-compare'); o.insert(o.index('ref-atlas'), 'ref-notebook')
D['search'].append({'id': 'ref-compare', 'title': 'Compare the creeds', 'k': 'Reference', 't': 'Compare creeds Nicene Filioque Apostles Old Roman differences', 'b': ' '.join(v['t'] for v in CREEDS.values())})
D['search'].append({'id': 'ref-notebook', 'title': 'My notebook', 'k': 'Reference', 't': 'Highlights notes notebook export', 'b': ''})
h = h[:i] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + (';' if semi else '') + h[j:]

# ---------- data, css, js ----------
paths = json.load(open(R + 'geo/paths.json'))
landsvg = ('<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><path id="landR" d="%s"/><path id="landW" d="%s"/></defs></svg>' % (paths['reg']['d'], paths['world']['d']))
QUOTES = json.load(open(R + 'tools/quotes.json'))
X = {'people': {pid: dict(p, ep=APPEAR[pid][:40]) for pid, p in PEOPLE.items()}, 'creeds': CREEDS, 'quotes': QUOTES, 'col': COL,
     'order': [e for s in SE for e in s['e']]}
css = open(R + 'tools/extras.css', encoding='utf-8').read()
css = css.replace('/*SEASONCOL*/', css_sc + '@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) ' + css_scd.replace('}article', '}:root:not([data-theme="light"]) article') + '}:root[data-theme="dark"] ' + css_scd.replace('}article', '}:root[data-theme="dark"] article'))
js = open(R + 'tools/extras.js', encoding='utf-8').read()
h = h.replace('</style>\n</head>', css + '</style>\n</head>', 1)
k = h.rindex('</body>')
h = h[:k] + landsvg + '<script>window.__X__=' + json.dumps(X, ensure_ascii=False, separators=(',', ':')) + ';</script><script>' + js + '</script>\n' + h[k:]
h = h.replace('<small>Edition 7 · The Series</small>', '<small>Edition 8 · The Series</small>').replace('Edition 7 · The Series', 'Edition 8 · The Series')
open(PATH, 'w', encoding='utf-8').write(h)
print('cast', sum(1 for v in CAST.values() if v), 'epmaps', sum(1 for e in EP if EPL.get(e)), 'quotes', len(QUOTES), 'html MB', round(len(h.encode()) / 1e6, 2))
