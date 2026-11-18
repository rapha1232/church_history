"""Bible study data: Strong's concordance, Greek form index (for Septuagint taps), chapter-level cross-reference arcs,
BCP daily office lectionary, original text for the verse-of-the-day widget."""
import json, os, re, unicodedata, collections
R = '/home/user/church/'
OUT = R + 'site/bible/'
def loadjs(path, fn):
    out = {}
    for line in open(path, encoding='utf-8'):
        line = line.strip()
        if not line.startswith(fn + '('): continue
        b = json.loads(line[len(fn) + 1:line.index(',')])
        out[b] = json.loads(line[line.index(',') + 1:-2])
    return out
ORIG = {}
for f in os.listdir(OUT + 'orig'): ORIG.update(loadjs(OUT + 'orig/' + f, '__ORIG'))
NT = set('MAT MAR LUK JOH ACT ROM 1CO 2CO GAL EPH PHI COL 1TH 2TH 1TI 2TI TIT PHM HEB JAM 1PE 2PE 1JO 2JO 3JO JUD REV'.split())
# ---- concordance ----
conc = {'g': {}, 'h': {}}
for b, chs in ORIG.items():
    for c, vs in chs:
        for v, ws in vs:
            for w in ws:
                sid = w[3]
                if not sid or sid in ('H9014',): continue
                k = 'g' if sid[0] == 'G' else 'h'
                e = conc[k].setdefault(sid, [[], []])
                gl = re.sub(r'[\[\]<>.,;:!?]', '', w[2]).strip().lower() or '—'
                if gl not in e[0]: e[0].append(gl)
                e[1].append('%s%d:%d.%d' % (b, c, v, e[0].index(gl)))
sizes = {}
for k in conc:
    for sid, e in conc[k].items(): e[1] = '|'.join(e[1])
    s = '__CONC(%s,%s);' % (json.dumps(k), json.dumps(conc[k], ensure_ascii=False, separators=(',', ':')))
    os.makedirs(OUT + 'conc', exist_ok=True); open(OUT + 'conc/%s.js' % k, 'w', encoding='utf-8').write(s); sizes['conc/' + k] = len(s.encode())
# ---- Greek form index: lets Septuagint words open the lexicon when the same form or lemma is known ----
def norm(w):
    w = unicodedata.normalize('NFD', w.lower())
    w = ''.join(ch for ch in w if not unicodedata.combining(ch))
    return re.sub(r'[^α-ως]', '', w).replace('ς', 'σ')
forms = collections.defaultdict(collections.Counter)
for b, chs in ORIG.items():
    if b not in NT: continue
    for c, vs in chs:
        for v, ws in vs:
            for w in ws:
                n = norm(w[0])
                if n and w[3]: forms[n][w[3]] += 1
lexg = loadjs(OUT + 'lex/g.js', '__LEX') if False else None
txt = open(OUT + 'lex/g.js', encoding='utf-8').read(); LG = json.loads(txt[txt.index(',') + 1:-2])
for sid, e in LG.items():
    n = norm(e[0].split(',')[0])
    if n and n not in forms: forms[n][sid] += 1
fx = {n: c.most_common(1)[0][0] for n, c in forms.items()}
s = '__GFORM(%s);' % json.dumps(fx, ensure_ascii=False, separators=(',', ':'))
open(OUT + 'lex/gform.js', 'w', encoding='utf-8').write(s); sizes['gform'] = len(s.encode())
# ---- cross-reference arcs by chapter ----
ORDER = 'GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SOL ISA JER LAM EZE DAN HOS JOE AMO OBA JON MIC NAH HAB ZEP HAG ZEC MAL MAT MAR LUK JOH ACT ROM 1CO 2CO GAL EPH PHI COL 1TH 2TH 1TI 2TI TIT PHM HEB JAM 1PE 2PE 1JO 2JO 3JO JUD REV'.split()
nch = {b: max(c for c, _ in ORIG[b]) for b in ORDER}
idx, k = {}, 0
for b in ORDER:
    for c in range(1, nch[b] + 1): idx[(b, c)] = k; k += 1
XR = {}
for f in os.listdir(OUT + 'xref'): XR.update(loadjs(OUT + 'xref/' + f, '__XREF'))
pairs = collections.Counter()
for b, chs in XR.items():
    for c, vs in chs:
        a = idx.get((b, c))
        if a is None: continue
        for v, s2 in vs:
            for it in s2.split('|'):
                m = re.match(r'^([1-3A-Z]{3})(\d+):\d+.*~(\d+)$', it)
                if not m: continue
                z = idx.get((m.group(1), int(m.group(2))))
                if z is None or z == a: continue
                pairs[(min(a, z), max(a, z))] += int(m.group(3))
top = [p for p in pairs.most_common() if p[1] >= 40][:9000]
arcs = {'books': [[b, nch[b]] for b in ORDER], 'a': [[a, z, n] for (a, z), n in top]}
s = '__ARCS(%s);' % json.dumps(arcs, separators=(',', ':'))
open(OUT + 'arcs.js', 'w', encoding='utf-8').write(s); sizes['arcs'] = len(s.encode())
# ---- lectionary ----
L = R + 'dl/lect/json/readings/'
lect = {'y1': json.load(open(L + 'dol-year-1.json', encoding='utf-8')), 'y2': json.load(open(L + 'dol-year-2.json', encoding='utf-8')),
        'hd': json.load(open(L + 'dol-holy-days.json', encoding='utf-8'))}
s = '__LECT(%s);' % json.dumps(lect, ensure_ascii=False, separators=(',', ':'))
open(OUT + 'lect.js', 'w', encoding='utf-8').write(s); sizes['lect'] = len(s.encode())
# ---- verse of the day: add the original-language text ----
VP = R + 'tools/verses.json'
V = json.load(open(VP, encoding='utf-8'))
for x in V:
    m = re.match(r'^.*? (\d+):(\d+)(?:-(\d+))?$', x['r'])
    c, a = int(m.group(1)), int(m.group(2)); z = int(m.group(3) or a)
    vs = dict((v, ws) for cc, vv in ORIG.get(x['b'], []) if cc == c for v, ws in vv)
    words = [w[0] for v in range(a, z + 1) for w in vs.get(v, [])]
    x['o'] = re.sub(r'[\u0591-\u05AF\u05BD]', '', ' '.join(words)); x['ol'] = 'grc' if x['b'] in NT else 'hbo'
json.dump(V, open(VP, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print({k: round(v / 1e6, 2) for k, v in sizes.items()}, 'arcs', len(top), 'forms', len(fx), 'conc', len(conc['g']), len(conc['h']))
