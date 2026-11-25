"""Original-language texts for the Early Christian texts reader (site/bible/texts/<id>.orig.js).

    python3 tools/originals.py <First1KGreek checkout> <csel-dev checkout>

Sources (all CC BY-SA 4.0 digital editions of public-domain printed texts, from Open Greek and Latin):
  First1KGreek  data/tlg1443/tlg001  Ignatius, seven letters   K. Lake, The Apostolic Fathers I (Loeb, 1912)
                data/tlg1271/tlg001  1 Clement                 K. Lake (Loeb, 1912)
                data/tlg1311/tlg001  Didache                   K. Lake (Loeb, 1912)
                data/tlg0645/tlg001  Justin, First Apology     G. Rauschen, Florilegium Patristicum (Bonn, 1911)
  csel-dev      data/stoa0104a/stoa010  Cyprian, De unitate    W. von Hartel, CSEL 3.1 (Vienna, 1868)
Each file calls __FTO({id, lang, ed, lic, note, ch: {chapter: [[section, text], …]}}). Chapters use the reader's numbering
("0" = greeting or preface). Editors' notes and apparatus are left out.
"""
import json, os, re, subprocess, sys

G, L = sys.argv[1], sys.argv[2]
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'site', 'bible', 'texts')
LIC = 'CC BY-SA 4.0, Open Greek and Latin (First1KGreek / Perseus)'

def read(repo, path):
    p = os.path.join(repo, path)
    if os.path.exists(p): return open(p, encoding='utf-8').read()
    return subprocess.run(['git', '-C', repo, 'show', 'HEAD:' + path], capture_output=True, text=True, check=True).stdout

def text(s):
    s = re.sub(r'<note.*?</note>', '', s, flags=re.S)
    s = re.sub(r'<lb[^>]*/>', ' ', s)
    s = re.sub(r'<[^>]+>', '', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return re.sub(r'\s+([,.;:·])', r'\1', s)

def divs(x, subtype):
    """Yield (n, inner xml) for <div subtype=...> at one level, handling nesting by counting."""
    out, i = [], 0
    pat = re.compile(r'<div\b[^>]*subtype="%s"[^>]*n="([^"]+)"[^>]*>|<div\b[^>]*n="([^"]+)"[^>]*subtype="%s"[^>]*>' % (subtype, subtype))
    while True:
        m = pat.search(x, i)
        if not m: break
        depth, j = 1, m.end()
        while depth:
            o = x.find('<div', j); c = x.find('</div>', j)
            if o != -1 and o < c: depth += 1; j = o + 4
            else: depth -= 1; j = c + 6
        out.append((m.group(1) or m.group(2), x[m.end():j - 6])); i = j
    return out

def chap_key(n):
    return '0' if n in ('praef', 'preface', 'pr', '0') else n

def chapters(x):
    ch = {}
    for n, inner in divs(x, 'chapter'):
        secs = divs(inner, 'section')
        ch[chap_key(n)] = [[s, text(t)] for s, t in secs] if secs else [['', text(inner)]]
    return ch

CHNOTE = {('cyp-unity', '4'): 'Hartel’s Received Text includes the words “super unum aedificat ecclesiam” (“upon one he builds the Church”), which the English translation beside it places in its notes among the “interpolated” lines. The Primacy Text adds further lines that are not in this text.'}
DONE = {}

def write(wid, lang, ed, lic, note, ch):
    data = {'id': wid, 'lang': lang, 'ed': ed, 'lic': lic, 'note': note, 'ch': ch,
            'chnote': {n: v for (w, n), v in CHNOTE.items() if w == wid}}
    DONE[wid] = lang
    open(os.path.join(OUT, wid + '.orig.js'), 'w', encoding='utf-8').write('__FTO(' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ');\n')
    print('%-14s %-3s %3d chapters' % (wid, lang, len(ch)))

LAKE = 'K. Lake, The Apostolic Fathers, vol. 1 (Loeb Classical Library, 1912)'
NOTE_LAKE = 'Lake’s Greek text; the English beside it is Lightfoot’s translation, made from Lightfoot’s own text, so the two can differ in small details.'

ign = read(G, 'data/tlg1443/tlg001/tlg1443.tlg001.1st1K-grc1.xml')
IGN = ['ign-eph', 'ign-magn', 'ign-trall', 'ign-rom', 'ign-phld', 'ign-smyrn', 'ign-pol']
eps = divs(ign, 'epistle')
assert len(eps) == 7, len(eps)
for (n, inner), wid in zip(eps, IGN):
    write(wid, 'grc', LAKE, LIC, NOTE_LAKE, chapters(inner))

write('1clem', 'grc', LAKE, LIC, NOTE_LAKE, chapters(read(G, 'data/tlg1271/tlg001/tlg1271.tlg001.1st1K-grc1.xml')))
write('didache', 'grc', LAKE, LIC, NOTE_LAKE, chapters(read(G, 'data/tlg1311/tlg001/tlg1311.tlg001.1st1K-grc1.xml')))
write('justin-1apol', 'grc', 'G. Rauschen, S. Iustini Apologiae duae, Florilegium Patristicum 2 (Bonn, 1911)', LIC,
      'Rauschen’s Greek text; the English beside it is the Ante-Nicene translation (1885), made from an older text, so the two can differ in small details. The appended imperial letters are not included.',
      chapters(read(G, 'data/tlg0645/tlg001/tlg0645.tlg001.1st1K-grc1.xml')))

cy = read(L, 'data/stoa0104a/stoa010/stoa0104a.stoa010.opp-lat1.xml')
write('cyp-unity', 'la', 'W. von Hartel, S. Thasci Caecili Cypriani Opera omnia, CSEL 3.1 (Vienna, 1868)', 'CC BY-SA 4.0, Open Greek and Latin (CSEL)',
      'Hartel’s text, which is the Received Text of chapter 4; he gives the Primacy Text only in his critical apparatus, which is not reproduced here. This digital text was made from a scan of the 1868 print and may contain small transcription errors.',
      {n: [['', text(t)]] for n, t in divs(cy[cy.find('<body'):], 'section')})

# mark the catalogue entries that have an original-language text
idx = os.path.join(OUT, 'index.js')
cat = json.loads(open(idx, encoding='utf-8').read()[len('__FTI('):-3])
for w in cat:
    if w['id'] in DONE: w['orig'] = DONE[w['id']]
    else: w.pop('orig', None)
open(idx, 'w', encoding='utf-8').write('__FTI(' + json.dumps(cat, ensure_ascii=False, indent=0) + ');\n')
