"""People and places of the Bible from STEPBible TIPNR (CC BY 4.0) -> site/bible/names.js"""
import json, re, html as H
R = '/home/user/church/'
F = R + 'dl/stepbible/Proper Nouns/TIPNR - Translators Individualised Proper Names with all References - STEPBible.org CC BY.txt'
STEPB = 'Gen Exo Lev Num Deu Jos Jdg Rut 1Sa 2Sa 1Ki 2Ki 1Ch 2Ch Ezr Neh Est Job Psa Pro Ecc Sng Isa Jer Lam Ezk Dan Hos Jol Amo Oba Jon Mic Nam Hab Zep Hag Zec Mal Mat Mrk Luk Jhn Act Rom 1Co 2Co Gal Eph Php Col 1Th 2Th 1Ti 2Ti Tit Phm Heb Jas 1Pe 2Pe 1Jn 2Jn 3Jn Jud Rev'.split()
OURS = 'GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SOL ISA JER LAM EZE DAN HOS JOE AMO OBA JON MIC NAH HAB ZEP HAG ZEC MAL MAT MAR LUK JOH ACT ROM 1CO 2CO GAL EPH PHI COL 1TH 2TH 1TI 2TI TIT PHM HEB JAM 1PE 2PE 1JO 2JO 3JO JUD REV'.split()
S2B = dict(zip(STEPB, OURS))
def ref(r):
    m = re.match(r'^([1-3]?[A-Z][a-z]{1,2})\.(\d+)\.(\d+)', r.strip())
    return ('%s%s:%s' % (S2B[m.group(1)], m.group(2), m.group(3))) if m and m.group(1) in S2B else None
def clean(s):
    s = re.sub(r'<ref="([^"]*)">([^<]*)</ref>', lambda m: '[[' + m.group(1) + '|' + m.group(2) + ']]', s)
    s = re.sub(r'<strong="[^"]*">([^<]*)</strong>', r'\1', s)
    s = re.sub(r'<\s*br\s*/?>', ' ', s, flags=re.I); s = re.sub(r'<[^>]+>', '', s)
    s = H.unescape(s).replace(' ', ' ')
    return re.sub(r'\s+', ' ', s).strip()
def links(s):
    """[[Gen.12.1-3|Gen.12.1-3]] -> {{GEN12:1|Gen 12:1-3}}"""
    def f(m):
        r = ref(m.group(1).split(',')[0].split(';')[0].split('-')[0])
        lab = m.group(2).replace('.', ' ', 1).replace('.', ':', 1)
        return '{{%s|%s}}' % (r, lab) if r else lab
    return re.sub(r'\[\[([^|\]]+)\|([^\]]+)\]\]', f, s)
def uid(u): return u.split('=')[0].strip()
def label(u): return u.split('@')[0].split('|')[-1].strip()
lines = open(F, encoding='utf-8').read().split('\n')
people, places = {}, {}
kind, cur = None, None
for ln in lines:
    if ln.startswith('$========== PERSON'): kind = 'p'; cur = None; continue
    if ln.startswith('$========== PLACE'): kind = 'l'; cur = None; continue
    if ln.startswith('$=========='): kind = None; cur = None; continue
    if not kind: continue
    c = ln.split('\t')
    if cur is None and c and '@' in c[0] and not ln.startswith(('–', '@')):
        u = uid(c[0])
        if kind == 'p':
            cur = {'k': 'p', 'id': u, 'n': label(u), 'd': c[1].strip() if len(c) > 1 else '', 'fa': [x.strip() for x in (c[2] if len(c) > 2 else '').replace('+', ',').split(',') if '@' in x],
                   'sib': [x.strip() for x in (c[3] if len(c) > 3 else '').split(',') if '@' in x], 'sp': [x.strip() for x in (c[4] if len(c) > 4 else '').split(',') if '@' in x],
                   'ch': [x.strip() for x in (c[5] if len(c) > 5 else '').split(',') if '@' in x], 'tr': c[6].strip() if len(c) > 6 else '', 'ty': c[8].strip() if len(c) > 8 else '', 'refs': [], 'names': []}
            people[u] = cur
        else:
            m = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', c[4] if len(c) > 4 else '')
            cur = {'k': 'l', 'id': u, 'n': label(u), 'ob': c[1].strip() if len(c) > 1 else '', 'geo': [round(float(m.group(1)), 4), round(float(m.group(2)), 4)] if m else None,
                   'area': c[6].strip().strip('>').strip() if len(c) > 6 else '', 'refs': [], 'names': []}
            places[u] = cur
        continue
    if cur is None: continue
    if ln.startswith('– ') and not ln.startswith('– Total'):
        if len(c) >= 5:
            nm = c[3].split('=')[0].split(',')[0].split(';')[0].strip()
            if nm and nm not in cur['names']: cur['names'].append(nm)
            for r in ';'.join(x for x in c[4:6] if re.search(r'[A-Z][a-z]{1,2}\.\d', x)).split(';'):
                rr = ref(r)
                if rr and rr not in cur['refs']: cur['refs'].append(rr)
    elif ln.startswith('@Brief='): cur['b'] = clean(ln[7:])
    elif ln.startswith('@Briefest='): cur['bb'] = clean(ln[10:])
    elif ln.startswith('@Short='): cur['s'] = clean(ln[7:].split('\t')[0])
    elif ln.startswith('@Article='): cur['a'] = links(clean(ln[9:].split('\t')[0]))
    elif ln.startswith('@Ambiguity='): cur = None
def slim(x):
    out = {'n': x['n']}
    for k in ('d', 'tr', 'ty', 'ob', 'area', 'b', 'bb', 's'):
        if x.get(k): out[k] = x[k]
    if x.get('a'):
        a = x['a']
        if len(a) > 1600: a = a[:1600].rsplit('. ', 1)[0] + '.'
        out['a'] = a
    if x.get('geo'): out['g'] = x['geo']
    for k in ('fa', 'sib', 'sp', 'ch'):
        if x.get(k): out[k] = [y for y in x[k] if y in people][:30]
    alt = [n for n in x['names'] if n != x['n'] and (n not in ('God', 'LORD', 'Lord') or x['n'] in ('God', 'Jesus'))]
    if alt: out['al'] = alt[:6]
    out['r'] = x['refs'][:60]; out['rc'] = len(x['refs'])
    return out
P = {k: slim(v) for k, v in people.items()}
L = {k: slim(v) for k, v in places.items()}
s = '__NAMES(%s);' % json.dumps({'p': P, 'l': L}, ensure_ascii=False, separators=(',', ':'))
open(R + 'site/bible/names.js', 'w', encoding='utf-8').write(s)
print('people', len(P), 'places', len(L), 'with geo', sum(1 for v in L.values() if 'g' in v), 'with article', sum(1 for v in P.values() if 'a' in v), 'MB', round(len(s.encode()) / 1e6, 2))
