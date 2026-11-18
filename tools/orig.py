"""Original-language layer: STEPBible TAGNT (Greek NT) + TAHOT (Hebrew OT) word data, TBESG/TBESH lexicons,
and OpenBible.info cross references -> site/bible/{orig,lex,xref}/*.js"""
import json, os, re, glob, html as H, shutil
R = '/home/user/church/'
STEP = R + 'dl/stepbible/'
OUT = R + 'site/bible/'
OT = 'GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SOL ISA JER LAM EZE DAN HOS JOE AMO OBA JON MIC NAH HAB ZEP HAG ZEC MAL'.split()
NT = 'MAT MAR LUK JOH ACT ROM 1CO 2CO GAL EPH PHI COL 1TH 2TH 1TI 2TI TIT PHM HEB JAM 1PE 2PE 1JO 2JO 3JO JUD REV'.split()
STEPB = 'Gen Exo Lev Num Deu Jos Jdg Rut 1Sa 2Sa 1Ki 2Ki 1Ch 2Ch Ezr Neh Est Job Psa Pro Ecc Sng Isa Jer Lam Ezk Dan Hos Jol Amo Oba Jon Mic Nam Hab Zep Hag Zec Mal Mat Mrk Luk Jhn Act Rom 1Co 2Co Gal Eph Php Col 1Th 2Th 1Ti 2Ti Tit Phm Heb Jas 1Pe 2Pe 1Jn 2Jn 3Jn Jud Rev'.split()
OSIS = 'Gen Exod Lev Num Deut Josh Judg Ruth 1Sam 2Sam 1Kgs 2Kgs 1Chr 2Chr Ezra Neh Esth Job Ps Prov Eccl Song Isa Jer Lam Ezek Dan Hos Joel Amos Obad Jonah Mic Nah Hab Zeph Hag Zech Mal Matt Mark Luke John Acts Rom 1Cor 2Cor Gal Eph Phil Col 1Thess 2Thess 1Tim 2Tim Titus Phlm Heb Jas 1Pet 2Pet 1John 2John 3John Jude Rev'.split()
ALL = OT + NT
S2B = dict(zip(STEPB, ALL)); O2B = dict(zip(OSIS, ALL))
GROUPS = [('law', 'GEN EXO LEV NUM DEU'), ('hist', 'JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST'), ('wis', 'JOB PSA PRO ECC SOL'),
          ('proph', 'ISA JER LAM EZE DAN HOS JOE AMO OBA JON MIC NAH HAB ZEP HAG ZEC MAL'), ('gosp', 'MAT MAR LUK JOH ACT'), ('epis', 'ROM 1CO 2CO GAL EPH PHI COL 1TH 2TH 1TI 2TI TIT PHM HEB JAM 1PE 2PE 1JO 2JO 3JO JUD REV')]
GRP = {b: g for g, bs in GROUPS for b in bs.split()}
REF = re.compile(r'^([1-3]?[A-Z][a-z]{1,2})\.(\d+)\.(\d+)(?:\([^)]*\))?#\d+=(\S+)$')

words = {}  # book -> chapter -> verse -> [word...]
def add(b, c, v, w):
    if v == 0: v = 1  # psalm titles: shown with verse 1, as in the English editions
    words.setdefault(b, {}).setdefault(c, {}).setdefault(v, []).append(w)
# ---- Greek NT ----
for f in sorted(glob.glob(STEP + 'Translators Amalgamated OT+NT/TAGNT*')):
    for line in open(f, encoding='utf-8'):
        p = line.rstrip('\n').split('\t')
        m = REF.match(p[0]) if p else None
        if not m or len(p) < 5: continue
        bk, c, v, typ = m.groups()
        if 'N' not in typ: continue  # keep the critical (NA28) text
        gm = re.match(r'^(\S+)\s+\(([^)]*)\)', p[1])
        if not gm: continue
        g, tr = gm.group(1), gm.group(2)
        st, _, mo = p[3].partition('=')
        add(S2B[bk], int(c), int(v), [g, tr, p[2].strip(), st.strip(), mo.strip()])
# ---- Hebrew OT ----
for f in sorted(glob.glob(STEP + 'Translators Amalgamated OT+NT/TAHOT*')):
    for line in open(f, encoding='utf-8'):
        p = line.rstrip('\n').split('\t')
        m = REF.match(p[0]) if p else None
        if not m or len(p) < 6: continue
        bk, c, v, typ = m.groups()
        if bk not in S2B: continue
        heb = p[1].replace('/', '').replace('\\', '')
        tr = p[2].replace('/', '').replace('\\', '').replace('.', '').lower()
        gl = re.sub(r'\s+', ' ', p[3].replace('/', ' ').replace('\\', ' ')).strip()
        parts = re.split(r'[/\\]', p[4]); morphs = re.split(r'[/\\]', p[5][1:] if p[5].startswith(('H', 'A')) else p[5])
        k = next((i for i, x in enumerate(parts) if x.startswith('{')), 0)
        st = re.sub(r'[^GH0-9A-Z]', '', parts[k]) if parts else ''
        lang = p[5][:1] if p[5] else 'H'
        mo = (lang + morphs[k]) if k < len(morphs) else p[5]
        add(S2B[bk], int(c), int(v), [heb, tr, gl, st, mo])
for d in ('orig', 'lex', 'xref'): shutil.rmtree(OUT + d, ignore_errors=True); os.makedirs(OUT + d)
sizes = {}
def write(path, s):
    open(OUT + path, 'w', encoding='utf-8').write(s); sizes[path] = len(s.encode())
chunks = {}
used = set()
for b in ALL:
    if b not in words: raise SystemExit('no words for ' + b)
    arr = [[c, [[v, words[b][c][v]] for v in sorted(words[b][c])]] for c in sorted(words[b])]
    for c in words[b].values():
        for ws in c.values():
            for w in ws: used.add(w[3])
    chunks.setdefault(GRP[b], []).append('__ORIG(%s,%s);' % (json.dumps(b), json.dumps(arr, ensure_ascii=False, separators=(',', ':'))))
for g, js in chunks.items(): write('orig/%s.js' % g, '\n'.join(js))

# ---- lexicons ----
def clean(s):
    s = re.sub(r"<ref='[^']*'>([^<]*)</ref>", r'\1', s)
    s = re.sub(r'<\s*br\s*/?\s*>', '\n', s, flags=re.I)
    s = re.sub(r'</?(?!b>|/b>|i>|/i>)[^>]*>', '', s)
    s = re.sub(r'<(/?)(b|i)>', r'[\1\2]', s)        # protect b/i
    s = H.escape(H.unescape(s), quote=False)
    s = re.sub(r'\[(/?)(b|i)\]', r'<\1\2>', s)
    s = s.replace('__', ' ').replace(' ', ' ')
    s = re.sub(r'[ \t]+', ' ', s); s = re.sub(r'\n\s*', '\n', s).strip()
    return s
def lex(path, prefix):
    out = {}
    for line in open(path, encoding='utf-8'):
        p = line.rstrip('\n').split('\t')
        if len(p) < 8 or not re.match(r'^%s\d' % prefix, p[0]): continue
        eid = p[1].split('=')[0].strip()
        if not eid: continue
        d = clean(p[7])
        if len(d) > 2400: d = d[:2400].rsplit(' ', 1)[0] + ' …'
        out[eid] = [p[3].strip(), p[4].strip(), p[5].strip(), p[6].strip(), d]
    return out
LG = lex(STEP + 'Lexicons/TBESG - Translators Brief lexicon of Extended Strongs for Greek - STEPBible.org CC BY.txt', 'G')
LH = lex(STEP + 'Lexicons/TBESH - Translators Brief lexicon of Extended Strongs for Hebrew - STEPBible.org CC BY.txt', 'H')
def keep(L):
    k = {}
    for s in used:
        base = re.sub(r'[A-Z]$', '', s)
        for cand in (s, base, base + 'A', base + 'G', base + 'H'):
            if cand in L: k[cand] = L[cand]; break
    return k
KG, KH = keep(LG), keep(LH)
miss = sorted(s for s in used if not any(c in LG or c in LH for c in (s, re.sub(r'[A-Z]$', '', s), re.sub(r'[A-Z]$', '', s) + 'A')))
write('lex/g.js', '__LEX("g",%s);' % json.dumps(KG, ensure_ascii=False, separators=(',', ':')))
write('lex/h.js', '__LEX("h",%s);' % json.dumps(KH, ensure_ascii=False, separators=(',', ':')))

# ---- cross references ----
XR = {}
def pref(s):
    m = re.match(r'^(\w+)\.(\d+)\.(\d+)(?:-(\w+)\.(\d+)\.(\d+))?$', s)
    if not m or m.group(1) not in O2B: return None
    b, c, v = O2B[m.group(1)], int(m.group(2)), int(m.group(3))
    t = '%s%d:%d' % (b, c, v)
    if m.group(4):
        b2, c2, v2 = O2B.get(m.group(4)), int(m.group(5)), int(m.group(6))
        if b2 == b and c2 == c: t += '-%d' % v2
        elif b2 == b: t += '-%d:%d' % (c2, v2)
    return (b, c, v), t
for line in open(R + 'dl/xref/cross_references.txt', encoding='utf-8'):
    p = line.rstrip('\n').split('\t')
    if len(p) < 3 or not p[2].lstrip('-').isdigit(): continue
    a, z, votes = pref(p[0]), pref(p[1]), int(p[2])
    if not a or not z or votes < 3: continue
    XR.setdefault(a[0], []).append((votes, z[1]))
xch = {}; nref = 0
for (b, c, v), lst in XR.items():
    lst.sort(key=lambda x: -x[0]); lst = lst[:12]; nref += len(lst)
    xch.setdefault(b, {}).setdefault(c, {})[v] = '|'.join('%s~%d' % (t, n) for n, t in lst)
xchunks = {}
for b in ALL:
    if b not in xch: continue
    arr = [[c, [[v, xch[b][c][v]] for v in sorted(xch[b][c])]] for c in sorted(xch[b])]
    xchunks.setdefault(GRP[b], []).append('__XREF(%s,%s);' % (json.dumps(b), json.dumps(arr, separators=(',', ':'))))
for g, js in xchunks.items(): write('xref/%s.js' % g, '\n'.join(js))
print('books', len(words), 'lexG', len(KG), 'lexH', len(KH), 'missing lex', len(miss), miss[:12], 'xrefs', nref)
print(max(sizes.values()), len(sizes), 'files total MB', round(sum(sizes.values()) / 1e6, 1))
