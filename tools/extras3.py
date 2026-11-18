"""Edition 11 layer: council atlas, how-do-we-know index, tree drill-down data, traditions side by side."""
import json, re, html as H, sys
sys.path.insert(0, '/home/user/church/tools')
import v11data as V, geo
R = '/home/user/church/'
PATH = R + 'site/index.html'
h = open(PATH, encoding='utf-8').read()
if 'id="ref-councilmap"' in h: raise SystemExit('extras3 already applied')
def esc(s): return H.escape(s or '', quote=True)
def text(s): return re.sub(r'\s+', ' ', H.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()
i = h.index('window.__EP__=') + 14; EP = json.loads(h[i:h.index(';window.__SEASONS__', i)])

# ---------- council atlas ----------
pr, br, Wr, Hr = geo.regional()
def proj(lat, lon):
    x, y = pr(lon, lat); return ((x - br[0]) * Wr / (br[2] - br[0]), (y - br[1]) * Hr / (br[3] - br[1]))
pts = [proj(c[5], c[6]) for c in V.COUNCILS]
xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
x0, x1, y0, y1 = min(xs) - 40, max(xs) + 60, min(ys) - 40, max(ys) + 40
vb = '%.0f %.0f %.0f %.0f' % (x0, y0, x1 - x0, y1 - y0)
sc = (x1 - x0) / 1000
pins, seen = '', {}
for k, c in enumerate(V.COUNCILS):
    x, y = pts[k]; key = (round(x), round(y)); n = seen.get(key, 0); seen[key] = n + 1
    pins += ('<g class="cpin k-%s" data-c="%s" data-y="%d" transform="translate(%.1f %.1f)"><circle class="halo" r="%.1f"/><circle r="%.1f"/><text x="%.1f" y="%.1f">%s</text></g>') % (
        c[12], c[0], c[2], x, y, 10 * sc + 3, (4.5 + n * 1.2) * sc + 2, 7 * sc + 2, (3.5 - n * 9) * sc + 1, esc(c[4]))
REC = {'E': 'Ecumenical', 'A': 'Accepted', 'P': 'Partly / locally', 'R': 'Rejected', '': '—'}
rows = ''.join('<tr data-c="%s" class="k-%s"><td><button type="button" class="linkbtn" data-cgo="%s">%s</button><small>%s</small></td>%s</tr>' % (
    c[0], c[12], c[0], esc(c[1]), ('%d' % c[2]) + ('–%d' % c[3] if c[3] != c[2] else ''),
    ''.join('<td class="rc r-%s" title="%s">%s</td>' % (c[10].get(t) or 'n', esc(REC[c[10].get(t, '')]), c[10].get(t) or '·') for t, _ in V.TRADS)) for c in V.COUNCILS)
cm_art = ('<article id="ref-councilmap" data-title="Map of the councils" data-vol="ref" data-kind="ref" data-topics="councils" class="wide"><p class="eyebrow">Reference · Councils through time</p><h2>Map of the councils</h2>'
          '<p class="lede">Thirty-one councils from Jerusalem to Vatican II and Crete: where they met, who called them, what they decided, and which churches receive them today. Press Play or drag the year.</p>'
          '<div class="cm-chips" role="group" aria-label="Show"><button type="button" class="chip" data-ck="" aria-pressed="true">All</button><button type="button" class="chip" data-ck="ecumenical" aria-pressed="false">The seven ecumenical councils</button><button type="button" class="chip" data-ck="western" aria-pressed="false">Western general councils</button><button type="button" class="chip" data-ck="disputed" aria-pressed="false">Disputed</button><button type="button" class="chip" data-ck="local" aria-pressed="false">Regional</button><button type="button" class="chip" data-ck="orthodox" aria-pressed="false">Orthodox synods</button><button type="button" class="chip" data-ck="protestant" aria-pressed="false">Protestant assemblies</button></div>'
          '<div class="cm-grid"><figure class="cmap"><div class="smap-top"><h3 class="shelf-h">Councils</h3><button type="button" class="mplay" id="cmPlay" aria-label="Play the councils in order"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg><span>Play</span></button></div>'
          '<div class="smap-svg"><svg viewBox="%s" role="img" aria-label="Map of church councils" style="--fs:%.2fpx"><use href="#landR" class="land"/><g class="pins">%s</g></svg></div>'
          '<div class="smap-ctl"><input type="range" id="cmYear" min="40" max="2016" value="2016" aria-label="Year"><output id="cmOut">2016</output></div></figure>'
          '<div class="cm-card" id="cmCard" aria-live="polite"><p class="cmp-note">Select a council on the map or in the table.</p></div></div>'
          '<h3>Who receives which council</h3><p class="cmp-note">E = counted as ecumenical or fully authoritative · A = accepted (its teaching received, or authoritative within that church) · P = partly or locally received · R = rejected · “·” = not applicable. Protestant churches do not count councils as infallible but generally accept the doctrinal decisions of the early councils as faithful to Scripture; Reformed and Lutheran churches differ over later ones.</p>'
          '<div class="tablewrap"><table class="data cmtab"><thead><tr><th>Council</th>%s</tr></thead><tbody>%s</tbody></table></div></article>') % (
    vb, 9 * sc + 3, pins, ''.join('<th>%s</th>' % esc(n) for _, n in V.TRADS), rows)

# ---------- how do we know: index of contested and uncertain claims ----------
notes_by_id = {}
for m in re.finditer(r'<li id="(fn-[^"]+)">(.*?)</li>', h, re.S):
    notes_by_id[m.group(1)] = text(re.sub(r'<a [^>]*>↩</a>', '', m.group(2)))
items = []
for m in re.finditer(r'<article id="([^"]+)"[^>]*data-ep[^>]*>(.*?)</article>', h, re.S):
    aid, body = m.groups()
    for pm in re.finditer(r'<(p|li)>(.*?)</\1>', body, re.S):
        para = pm.group(2)
        for em in re.finditer(r'<button type="button" class="ev (dis|unc)"', para):
            before = para[:em.start()]
            t = text(re.sub(r'<(button|sup)\b.*?</\1>', ' ', before))
            sents = re.split(r'(?<=[.!?])\s+', t)
            claim = ' '.join(sents[-2:]) if len(sents[-1]) < 80 else sents[-1]
            if len(claim) < 25: continue
            fns = re.findall(r'href="#(fn-[^"]+)"', para)
            items.append({'ep': aid, 'k': em.group(1), 'claim': claim[-420:], 'notes': [notes_by_id[f] for f in fns if f in notes_by_id][:3]})
by = {}
for it in items: by.setdefault(it['ep'], []).append(it)
dbody = ''
for aid in [x for x in EP if x in by]:
    dbody += '<section class="db-ep"><h3><a href="#%s"><small>%s</small>%s</a></h3>%s</section>' % (aid, esc(EP[aid]['g']), esc(EP[aid]['t']), ''.join(
        '<div class="db-it k-%s"><p class="db-tag">%s</p><p class="db-claim">%s</p>%s</div>' % (
            it['k'], 'Contested' if it['k'] == 'dis' else 'Uncertain', esc(it['claim']),
            ('<details><summary>How do we know? Sources and debate</summary><ul>%s</ul></details>' % ''.join('<li>%s</li>' % esc(n) for n in it['notes'])) if it['notes'] else '<p class="db-none">See the episode for the evidence discussed.</p>')
        for it in by[aid]))
db_art = ('<article id="ref-debates" data-title="Debates and uncertainties" data-vol="ref" data-kind="ref" data-topics="sources"><p class="eyebrow">Reference · How do we know?</p><h2>Debates and uncertainties</h2>'
          '<p class="lede">Every claim in the series marked <span class="ev dis" style="cursor:default">Contested</span> or <span class="ev unc" style="cursor:default">Uncertain</span>, gathered in one place, with the sources and scholarly positions cited for it. Tap a label anywhere in the text to see the same information in place.</p>'
          '<p class="cmp-note">%d contested and uncertain points in %d episodes.</p>%s</article>') % (len(items), len(by), dbody)

# ---------- insert ----------
k = h.index('<article id="ref-atlas"')
h = h[:k] + cm_art + db_art + h[k:]
h = h.replace('<li><a href="#ref-compare">Compare the creeds</a></li>', '<li><a href="#ref-councilmap" class="newtag">Map of the councils</a></li><li><a href="#ref-debates" class="newtag">Debates and uncertainties</a></li><li><a href="#ref-compare">Compare the creeds</a></li>', 1)
i = h.index('window.__DATA__=') + 16; j = h.index('</script>', i)
raw = h[i:j].rstrip(); semi = raw.endswith(';'); D = json.loads(raw.rstrip(';'))
for aid in ('ref-councilmap', 'ref-debates'): D['order'].insert(D['order'].index('ref-atlas'), aid)
D['search'] += [{'id': 'ref-councilmap', 'title': 'Map of the councils', 'k': 'Reference', 't': 'councils map ecumenical reception synod', 'b': ' '.join(c[1] + ' ' + c[9] for c in V.COUNCILS)},
                {'id': 'ref-debates', 'title': 'Debates and uncertainties', 'k': 'Reference', 't': 'contested uncertain debate sources how do we know evidence', 'b': ' '.join(it['claim'] for it in items)[:20000]}]
h = h[:i] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + (';' if semi else '') + h[j:]
X3 = {'councils': {c[0]: {'n': c[1], 's': c[2], 'e': c[3], 'pl': c[4], 'b': c[7], 'by': c[8], 'd': c[9], 'r': c[10], 'ep': c[11], 'k': c[12]} for c in V.COUNCILS},
      'trads': V.TRADS, 'rec': REC, 'sub': V.SUB, 'evn': {f['ep'] + '|' + str(n): f for n, f in enumerate(items)}}
css = open(R + 'tools/v11.css', encoding='utf-8').read(); js = open(R + 'tools/v11.js', encoding='utf-8').read()
h = h.replace('</style>\n</head>', css + '</style>\n</head>', 1)
k = h.rindex('</body>')
X3.pop('evn')
h = h[:k] + '<script>window.__X3__=' + json.dumps(X3, ensure_ascii=False, separators=(',', ':')) + ';</script><script>' + js + '</script>\n' + h[k:]
h = h.replace('Edition 9 · The Series', 'Edition 10 · The Series')
open(PATH, 'w', encoding='utf-8').write(h)
print('debates', len(items), 'episodes', len(by), 'html MB', round(len(h.encode()) / 1e6, 2))
