"""Edition 10 layer: family tree, people finder, on this day, reading plans, original-language creeds, glossary links, reading mode."""
import json, re, html as H, sys
sys.path.insert(0, '/home/user/church/tools')
import v10data as V
R = '/home/user/church/'
PATH = R + 'site/index.html'
h = open(PATH, encoding='utf-8').read()
if 'id="ref-tree"' in h: raise SystemExit('extras2 already applied')
def esc(s): return H.escape(s or '', quote=True)
i = h.index('window.__EP__=') + 14; EP = json.loads(h[i:h.index(';window.__SEASONS__', i)])
i = h.index('window.__X__=') + 13; X = json.loads(h[i:h.index(';</script>', i)])
i = h.index('window.__DATA__=') + 16; j = h.index('</script>', i); D = json.loads(h[i:j].rstrip().rstrip(';'))

# ---------- family tree SVG ----------
W, LANE, TOP, LEFT = 1000, 30, 46, 6
def X_(y): return LEFT + (y - 0) / 2026 * (W - LEFT - 150)
T = {t[0]: t for t in V.TREE}
paths, labels = [], []
for k, (tid, lab, s, e, par, by, lane, ep, note) in enumerate(V.TREE):
    y0 = TOP + lane * LANE; x1 = X_(e if e else 2026)
    if par:
        pl = T[par][6]; py = TOP + pl * LANE; bx = X_(by)
        d = 'M%.1f %.1f C%.1f %.1f %.1f %.1f %.1f %.1f L%.1f %.1f' % (bx, py, bx + 26, py, bx + 8, y0, bx + 34, y0, x1, y0)
        x0 = bx + 34
    else:
        x0 = X_(s); d = 'M%.1f %.1f L%.1f %.1f' % (x0, y0, x1, y0)
    paths.append('<a href="#%s" class="tb" data-t="%s" style="--d:%dms"><title>%s</title><path class="hit" d="%s"/><path d="%s"/>%s</a>' % (
        ep, tid, k * 90, esc(lab), d, d, '<circle cx="%.1f" cy="%.1f" r="4"/>' % (x1, y0) if not e else ''))
    labels.append('<text x="%.1f" y="%.1f" class="tl" data-t="%s">%s</text>' % (x1 + 8 if not e else x0 + 4, y0 - 6 if e else y0 + 4, tid, esc(lab)))
Hh = TOP + 15 * LANE + 10
TOP_ADJ = 0
splits = ''.join('<line x1="%.1f" x2="%.1f" y1="%d" y2="%d" class="ts"/><text x="%.1f" y="%d" class="tsl">%s %d</text>' % (X_(y), X_(y), 18 if k % 2 == 0 else 30, Hh, X_(y), 12 if k % 2 == 0 else 26, esc(n), y) for k, (y, n) in enumerate(V.SPLITS))
axis = ''.join('<text x="%.1f" y="%d" class="tax">%d</text>' % (X_(y), Hh + 14, y) for y in (100, 500, 1000, 1500, 2000))
tree_svg = '<svg viewBox="0 0 %d %d" class="tree" role="img" aria-label="Family tree of the Christian churches">%s<g>%s</g><g>%s</g>%s</svg>' % (W, Hh + 22, splits, ''.join(paths), ''.join(labels), axis)
tree_art = ('<article id="ref-tree" data-title="Family tree of the churches" data-vol="ref" data-kind="ref" data-topics="churches" class="wide"><p class="eyebrow">Reference · How the churches branched</p><h2>Family tree of the churches</h2>'
            '<p class="lede">From one apostolic movement to the families of churches today. Each line is a tradition; it branches where communion broke. Select a branch to read its story.</p>'
            '<div class="tree-wrap">%s</div><div class="tree-card" id="treeCard" aria-live="polite"><p>Tap or hover over a branch.</p></div>'
            '<p class="cmp-note">Simplified: churches have often re-united, split again, or exist in partial communion. Dates mark the conventional turning points, not the whole process.</p></article>') % tree_svg

# ---------- people meta ----------
TRAD = {'Martin Luther': 'Protestant', 'John Calvin': 'Protestant', 'Philip Melanchthon': 'Protestant', 'Menno Simons': 'Protestant', 'Thomas Cranmer': 'Protestant', 'John Wesley': 'Protestant',
        'William Wilberforce': 'Protestant', 'Dietrich Bonhoeffer': 'Protestant', 'Friedrich Schleiermacher': 'Protestant', 'Samuel Ajayi Crowther': 'Protestant', 'Ellen G. White': 'Protestant',
        'Henry VIII': 'Protestant', 'John Wycliffe': 'Pre-Reformation', 'Jan Hus': 'Pre-Reformation', 'Gregory Palamas': 'Orthodox', 'Athenagoras I': 'Orthodox', 'Bessarion': 'Catholic',
        'Mar Dinkha IV': 'Church of the East', 'Stephen Douaihy': 'Catholic', 'Vladimir of Kiev': 'Orthodox', 'Boris I of Bulgaria': 'Orthodox'}
NONCHR = {'Caiaphas', 'Cyrus the Great', 'Decius', 'Galerius', 'Herod Antipas', 'Herod the Great', 'Judas Maccabeus', 'Antiochus IV Epiphanes', 'Pontius Pilate', 'Trajan', 'Licinius'}
ROLES = [('pope', r'\bpope|bishop of rome'), ('bishop', r'bishop|patriarch|archbishop|catholicos|metropolitan'), ('ruler', r'emperor|king|empress|prince|tsar|ruler|governor|prefect|high priest'),
         ('theologian', r'theolog|apologist|father|scholar|philosopher|historian|writer|exegete'), ('reformer', r'reform'), ('monk', r'monk|abbot|ascetic|nun|friar|mystic|hermit|founder of'),
         ('martyr', r'martyr'), ('missionary', r'mission|apostle'), ('heretic', r'heresiarch|heretic|condemned')]
def years(d):
    d = d.split('·')[0]
    nums = [(int(n), bool(bc)) for n, bc in re.findall(r'(\d{1,4})(?:s)?\s*(BC)?', d)]
    if not nums: return None, None
    def v(x): return -x[0] if x[1] or ('BC' in d and x is nums[0] and 'AD' not in d and len(nums) > 1 and nums[0][0] > nums[-1][0]) else x[0]
    vals = [v(x) for x in nums]
    if 'BC' in d and len(vals) >= 2 and 'AD' not in d and vals[0] > 0 and vals[1] > 0 and vals[0] > vals[1]: vals = [-vals[0], -vals[1]]
    if re.match(r'\s*(d\.|died)', d): return None, vals[-1]
    if re.match(r'\s*(r\.|reigned|fl\.)', d) and len(vals) >= 2: return vals[0], vals[1]
    return vals[0], vals[-1] if len(vals) > 1 else None
PM = {}
for pid, p in X['people'].items():
    b, dd = years(p['d']); role = (p['d'].split('·', 1)[1] if '·' in p['d'] else '').lower() + ' ' + p['sum'].lower()
    rs = [k for k, rx in ROLES if re.search(rx, role)][:3] or ['other']
    if p['name'] in NONCHR: trad = 'Jewish & Roman world'
    elif p['name'] in TRAD: trad = TRAD[p['name']]
    elif (dd or b or 0) and (dd or b) < 1054: trad = 'Early Church'
    else: trad = 'Catholic'
    PM[pid] = {'b': b, 'dd': dd, 'roles': rs, 'trad': trad}
TRADS = ['Early Church', 'Catholic', 'Orthodox', 'Church of the East', 'Pre-Reformation', 'Protestant', 'Jewish & Roman world']
ROLEL = {'pope': 'Popes', 'bishop': 'Bishops & patriarchs', 'ruler': 'Rulers', 'theologian': 'Theologians & writers', 'reformer': 'Reformers', 'monk': 'Monks, nuns & mystics', 'martyr': 'Martyrs', 'missionary': 'Missionaries', 'other': 'Others'}
ERAS = [('ancient', 'Before 100', -2000, 99), ('early', '100–500', 100, 499), ('medieval', '500–1500', 500, 1499), ('reform', '1500–1800', 1500, 1799), ('modern', '1800–today', 1800, 2100)]
def era(m):
    y = m['dd'] if m['dd'] is not None else m['b']
    if y is None: return ''
    for k, l, a, b2 in ERAS:
        if a <= y <= b2: return k
    return ''
pf = ('<div class="pfind" id="pfind"><input type="search" id="pfQ" placeholder="Search people" aria-label="Search people">'
      '<div class="pf-row" role="group" aria-label="Era"><button type="button" class="chip" data-era="" aria-pressed="true">All eras</button>%s</div>'
      '<div class="pf-row"><label>Role <select id="pfRole"><option value="">All roles</option>%s</select></label><label>Tradition <select id="pfTrad"><option value="">All traditions</option>%s</select></label>'
      '<span class="pf-n" id="pfN"></span></div></div>') % (
    ''.join('<button type="button" class="chip" data-era="%s" aria-pressed="false">%s</button>' % (k, l) for k, l, a, b2 in ERAS),
    ''.join('<option value="%s">%s</option>' % (k, v) for k, v in ROLEL.items()), ''.join('<option>%s</option>' % t for t in TRADS))
s0 = h.index('<article id="ref-people"'); s1 = h.index('</article>', s0)
body = h[s0:s1]
k = body.find('<div class="dir"')
body = body[:k] + pf + body[k:]
def tag2(m):
    pid = m.group(2); mt = PM.get(pid)
    if not mt: return m.group(0)
    return '<div class="person%s" id="%s" data-era="%s" data-roles="%s" data-trad="%s">' % (m.group(1) or '', pid, era(mt), ' '.join(mt['roles']), esc(mt['trad']))
body = re.sub(r'<div class="person( noimg)?" id="([^"]+)">', lambda m: tag2(m), body)
h = h[:s0] + body + h[s1:]
for pid, mt in PM.items(): X['people'][pid].update(mt)

# ---------- on this day page ----------
MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
otd = sorted(V.OTD, key=lambda x: (x[0], x[1], x[2] or 0))
rows = ''
for mo in range(1, 13):
    items = [x for x in otd if x[0] == mo]
    if not items: continue
    rows += '<section class="otd-m"><h3>%s</h3><ul>%s</ul></section>' % (MON[mo - 1], ''.join(
        '<li data-md="%d-%d" class="k-%s"><b>%d %s</b><span>%s%s <a href="#%s">%s</a></span></li>' % (
            mo, d, kind, d, MON[mo - 1][:3], ('<i>%d</i> · ' % yr if yr and yr > 0 else ''), esc(t), ep, esc(EP.get(ep, {}).get('g', 'Read')) if ep in EP else 'Read') for mo2, d, yr, t, ep, kind in items))
otd_art = ('<article id="ref-otd" data-title="On this day in church history" data-vol="ref" data-kind="ref" data-topics="calendar"><p class="eyebrow">Reference · Calendar</p><h2>On this day in church history</h2>'
           '<p class="lede">Councils, deaths of great figures, turning points and the main feasts, day by day. Some ancient dates are traditional rather than certain; they are marked as such.</p>'
           '<div class="otd-today" id="otdToday"></div>%s</article>') % rows

# ---------- reading plans ----------
plans_art = ('<article id="ref-plans" data-title="Reading plans" data-vol="ref" data-kind="ref" data-topics="plans"><p class="eyebrow">Reference · Guided reading</p><h2>Reading plans</h2>'
             '<p class="lede">Short guided paths through the series, one episode a day. Your progress is saved on this device, and the app can remind you each day.</p>'
             '<div class="plans" id="plans">%s</div></article>') % ''.join(
    '<section class="plan" data-plan="%s"><div class="plan-hd"><p class="pk">%s</p><h3>%s</h3><p>%s</p></div><ol>%s</ol><div class="plan-ft"><span class="plan-p"><i></i></span><button type="button" class="btn-sm pri" data-pstart="%s">Start plan</button></div></section>' % (
        pid, esc(dur), esc(t), esc(desc), ''.join('<li data-epid="%s"><a href="#%s"><b>Day %d</b> %s</a></li>' % (e, e, n + 1, esc(EP[e]['t'] if e in EP else e)) for n, e in enumerate(eps)), pid)
    for pid, t, dur, desc, eps in V.PLANS)

# ---------- original-language creeds ----------
def mark(s):
    return re.sub(r'\[\[([^|\]]+)\|([a-z]+)\]\]', lambda m: '<button type="button" class="ot" data-k="%s">%s</button>' % (m.group(2), esc(m.group(1))), esc(s).replace('[[', '[[').replace(']]', ']]')) if s else ''
def mark2(s):
    out, pos = [], 0
    for m in re.finditer(r'\[\[([^|\]]+)\|([a-z]+)\]\]', s):
        out.append(esc(s[pos:m.start()])); out.append('<button type="button" class="ot" data-k="%s">%s</button>' % (m.group(2), esc(m.group(1)))); pos = m.end()
    out.append(esc(s[pos:])); return ''.join(out)
tabs = ''.join('<button type="button" role="tab" data-oc="%s" aria-selected="%s">%s</button>' % (k, 'true' if n == 0 else 'false', esc(c['title'])) for n, (k, c) in enumerate(V.CREEDS_ORIG.items()))
panes = ''
for n, (k, c) in enumerate(V.CREEDS_ORIG.items()):
    cols = [ix for ix in range(3) if c['langs'][ix]]
    head = ''.join('<th>%s</th>' % esc(c['langs'][ix]) for ix in cols)
    body = ''.join('<tr>%s</tr>' % ''.join('<td class="%s" data-l="%s"%s>%s</td>' % (['gr', 'la', 'en'][ix], esc(c['langs'][ix]), ' lang="grc"' if ix == 0 else (' lang="la"' if ix == 1 else ''), mark2(r[ix])) for ix in cols) for r in c['rows'])
    panes += '<div class="oc-pane" data-oc="%s"%s><p class="cmp-note">%s</p><div class="tablewrap"><table class="oc"><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div></div>' % (k, '' if n == 0 else ' hidden', esc(c['note']), head, body)
orig_art = ('<article id="ref-originals" data-title="The creeds in Greek and Latin" data-vol="ref" data-kind="ref" data-topics="creeds" class="wide"><p class="eyebrow">Reference · Original languages</p><h2>The creeds in Greek and Latin</h2>'
            '<p class="lede">Read the great creeds clause by clause in the language in which they were written, beside an English translation. Tap an underlined word for what it means and why it mattered.</p>'
            '<div class="cmp-tabs" role="tablist">%s</div>%s</article>') % (tabs, panes)

# ---------- glossary auto-links (first occurrence per episode) ----------
SKIP = {'doctrine', 'council', 'canon', 'communion', 'catholic', 'orthodox', 'dogma', 'heresy', 'schism', 'jurisdiction', 'ecumenical', 'church of the east', 'oriental orthodox', 'eastern catholic', 'apostolic see', 'see', 'creed', 'bishop', 'pope', 'liturgy', 'sacrament'}
terms = sorted([t for t in D.get('glossary', {}) if t not in SKIP and len(t) > 4], key=len, reverse=True)
trx = re.compile(r'\b(%s)\b' % '|'.join(re.escape(t) for t in terms), re.I)
def link_terms(body):
    used = set(re.findall(r'data-term="([^"]+)"', body))
    def para(m):
        tagname, inner = m.group(1), m.group(2)
        parts = re.split(r'(<[^>]+>)', inner); depth = 0; out = []
        for p in parts:
            if p.startswith('<'):
                if re.match(r'<(a|button|sup|em|i|strong|b|cite|code)\b', p): depth += 1
                elif re.match(r'</(a|button|sup|em|i|strong|b|cite|code)>', p): depth = max(0, depth - 1)
                out.append(p); continue
            if depth:
                out.append(p); continue
            def rep(mm):
                key = mm.group(1).lower()
                if key in used: return mm.group(0)
                used.add(key); return '<button type="button" class="gl" data-term="%s">%s</button>' % (esc(key), mm.group(0))
            out.append(trx.sub(rep, p))
        return '<%s>%s</%s>' % (tagname, ''.join(out), tagname)
    return re.sub(r'<(p|li)>(.*?)</\1>', para, body, flags=re.S)
cnt = 0
for m in list(re.finditer(r'<article id="([^"]+)"([^>]*data-ep[^>]*)>(.*?)</article>', h, re.S)):
    pass
def rew(m):
    global cnt
    nb = link_terms(m.group(3)); cnt += nb.count('class="gl"') - m.group(3).count('class="gl"')
    return '<article id="%s"%s>%s</article>' % (m.group(1), m.group(2), nb)
h = re.sub(r'<article id="([^"]+)"([^>]*data-ep[^>]*)>(.*?)</article>', rew, h, flags=re.S)

# ---------- insert articles, nav, order, search ----------
k = h.index('<article id="ref-atlas"')
h = h[:k] + tree_art + otd_art + plans_art + orig_art + h[k:]
h = h.replace('<li><a href="#ref-compare" class="newtag">Compare the creeds</a></li>',
              '<li><a href="#ref-tree" class="newtag">Family tree of the churches</a></li><li><a href="#ref-compare">Compare the creeds</a></li><li><a href="#ref-originals" class="newtag">Creeds in Greek and Latin</a></li><li><a href="#ref-otd" class="newtag">On this day</a></li><li><a href="#ref-plans" class="newtag">Reading plans</a></li>', 1)
i = h.index('window.__DATA__=') + 16; j = h.index('</script>', i)
raw = h[i:j].rstrip(); semi = raw.endswith(';'); D = json.loads(raw.rstrip(';'))
o = D['order']
for aid in ('ref-tree', 'ref-originals', 'ref-otd', 'ref-plans'): o.insert(o.index('ref-atlas'), aid)
D['search'] += [{'id': 'ref-tree', 'title': 'Family tree of the churches', 'k': 'Reference', 't': 'family tree churches denominations branches split schism', 'b': ' '.join(t[1] + ' ' + t[8] for t in V.TREE)},
                {'id': 'ref-otd', 'title': 'On this day', 'k': 'Reference', 't': 'calendar on this day anniversaries feasts dates', 'b': ' '.join(x[3] for x in V.OTD)},
                {'id': 'ref-plans', 'title': 'Reading plans', 'k': 'Reference', 't': 'reading plan guided path days', 'b': ' '.join(p[1] + ' ' + p[3] for p in V.PLANS)},
                {'id': 'ref-originals', 'title': 'The creeds in Greek and Latin', 'k': 'Reference', 't': 'Greek Latin original creed homoousios filioque credo', 'b': ''}]
h = h[:i] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + (';' if semi else '') + h[j:]
# extras card on home
h = h.replace('<a class="xcard" href="#ref-texts">', '<a class="xcard" href="#ref-tree"><span class="th none" aria-hidden="true"></span><span>Family tree of the churches</span></a><a class="xcard" href="#ref-plans"><span class="th none" aria-hidden="true"></span><span>Reading plans</span></a><a class="xcard" href="#ref-texts">', 1)

X2 = {'tree': {t[0]: {'l': t[1], 's': t[2], 'e': t[3], 'ep': t[7], 'n': t[8]} for t in V.TREE}, 'otd': [list(x) for x in V.OTD],
      'plans': [{'id': p[0], 't': p[1], 'eps': p[4]} for p in V.PLANS], 'terms': V.TERMS, 'pm': PM}
css = open(R + 'tools/v10.css', encoding='utf-8').read()
js = open(R + 'tools/v10.js', encoding='utf-8').read()
h = h.replace('</style>\n</head>', css + '</style>\n</head>', 1)
k = h.rindex('</body>')
h = h[:k] + '<script>window.__X2__=' + json.dumps(X2, ensure_ascii=False, separators=(',', ':')) + ';</script><script>' + js + '</script>\n' + h[k:]
h = h.replace('Edition 8 · The Series', 'Edition 9 · The Series')
i = h.index('window.__X__=') + 13; j2 = h.index(';</script>', i)
h = h[:i] + json.dumps(X, ensure_ascii=False, separators=(',', ':')) + h[j2:]
open(PATH, 'w', encoding='utf-8').write(h)
json.dump([list(x) for x in V.OTD], open(R + 'tools/onthisday.json', 'w'), ensure_ascii=False)
print('glossary links added', cnt, 'people meta', len(PM), 'html MB', round(len(h.encode()) / 1e6, 2))
