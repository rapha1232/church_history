"""Deuterocanonical books in the New Testament: parallels with evidence computed from the Greek texts.

    python3 tools/dc_allusions.py

Reads the app's own Greek Bible (site/bible/lxxg: the Septuagint as printed by Brenton, public domain;
site/bible/grk: the NA28 text from STEPBible TAGNT, CC BY 4.0) and writes site/bible/dcnt.js.

Only pairs with checkable evidence are included. For each pair the script recomputes, from the whole Greek Bible:
  - rare: a word (accents removed) shared by both passages and found in almost no other verse; lists every verse.
  - combo: a set of word roots that occur together (within 4 verses) in both passages; lists every other place
    where they occur together.
Pairs often quoted elsewhere but with no verbal overlap in these texts (e.g. Matthew 27:43 / Wisdom 2:18,
Romans 1 / Wisdom 13, Matthew 7:12 / Tobit 4:15, Matthew 6:7 / Sirach 7:14) are deliberately left out.
"""
import collections, json, os, re, unicodedata

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
B = os.path.join(ROOT, 'site', 'bible')

def load(path):
    s = open(path, encoding='utf-8').read(); out = {}
    for m in re.finditer(r'__BIB\("(\w+)","(\w+)",(\[.*?\])\);', s, flags=re.S):
        out[m.group(2)] = {c: {v: t for v, t in vs} for c, vs in json.loads(m.group(3))}
    return out
G = {}
for f in ('lxxg/ot1.js', 'lxxg/ot2.js', 'grk/nt.js'): G.update(load(os.path.join(B, f)))

def norm(w):
    w = unicodedata.normalize('NFD', w.lower()); w = ''.join(ch for ch in w if unicodedata.category(ch) != 'Mn')
    return re.sub(r'[^α-ως]', '', w).replace('ς', 'σ')
def toks(t): return [norm(x) for x in t.split() if norm(x)]
def ref(b, c, v): return '%s %d:%d' % (b, c, v)
where = collections.defaultdict(list)
for b, chs in G.items():
    for c, vs in chs.items():
        for v, t in vs.items():
            for w in set(toks(t)): where[w].append(ref(b, c, v))

def verses(b, c, v1, v2): return [(v, G[b][c][v].replace('¶', '').strip()) for v in range(v1, v2 + 1) if v in G[b][c]]
def windows(roots, span=4):
    hits, prev = [], None
    for b, chs in G.items():
        for c, vs in chs.items():
            ks = sorted(vs)
            for i, v in enumerate(ks):
                win = ' '.join(toks(' '.join(vs[k] for k in ks[i:i + span])))
                if all(r in win for r in roots):
                    if prev and prev[0] == b and prev[1] == c and v - prev[2] < span: prev = (b, c, v); continue
                    hits.append(ref(b, c, v)); prev = (b, c, v)
    return hits
BOOKS = list(G)
def order(r): b, cv = r.split(' '); c, v = cv.split(':'); return (BOOKS.index(b), int(c), int(v))
def rare(forms): return sorted({r for f in forms for r in where.get(f, [])}, key=order)

# kind: strong (a rare shared word or a combination found only in these passages), event, history, partial (shared
# with other books), weak (common words); nt and dc are [book, chapter, first verse, last verse]
PAIRS = [
 {'id': 'heb1-wis7', 'kind': 'strong', 'nt': ['HEB', 1, 3, 3], 'dc': ['WIS', 7, 25, 26], 'title': 'Christ as the radiance of God’s glory',
  'ev': {'type': 'rare', 'forms': ['απαυγασμα'], 'gloss': 'ἀπαύγασμα, “radiance”'}},
 {'id': '2cor5-wis9', 'kind': 'strong', 'nt': ['2CO', 5, 1, 4], 'dc': ['WIS', 9, 15, 15], 'title': 'The body as an earthly “tent” that weighs us down',
  'ev': {'type': 'rare', 'forms': ['σκηνοσ', 'σκηνουσ', 'σκηνει'], 'gloss': 'σκῆνος, “tent” (of the body)'}},
 {'id': 'eph6-wis5', 'kind': 'strong', 'nt': ['EPH', 6, 11, 17], 'dc': ['WIS', 5, 17, 20], 'title': 'The full armour of God',
  'ev': {'type': 'combo', 'roots': ['πανοπλ', 'θωρακ'], 'gloss': 'πανοπλία, “full armour”, with θώραξ, “breastplate”', 'note': 'Isaiah 59:17 also has the breastplate of righteousness and the helmet of salvation, but not the “full armour”.'}},
 {'id': 'rev8-tob12', 'kind': 'strong', 'nt': ['REV', 8, 2, 4], 'dc': ['TOB', 12, 12, 15], 'title': 'Seven angels and the prayers of the saints',
  'ev': {'type': 'combo', 'roots': ['επτα', 'αγγελ', 'προσευχ', 'αγιων'], 'gloss': '“seven” + “angels” + “prayers” + “of the saints”'}},
 {'id': 'jn10-1mac4', 'kind': 'history', 'nt': ['JOH', 10, 22, 23], 'dc': ['1MA', 4, 52, 59], 'title': 'The Feast of Dedication (Hanukkah)',
  'ev': {'type': 'history', 'forms': ['εγκαινια'], 'gloss': 'ἐγκαίνια, “dedication”', 'text': 'John names the winter feast of Dedication; 1 Maccabees 4:52–59 tells how it was instituted after the temple was cleansed, calling it the ἐγκαινισμός of the altar (4:56, 59). John refers to the feast, not to the book.'}},
 {'id': 'heb11-2mac6', 'kind': 'event', 'nt': ['HEB', 11, 35, 35], 'dc': ['2MA', 6, 18, 31], 'dc2': ['2MA', 7, 1, 42], 'title': 'Martyrs tortured, refusing release, for a better resurrection',
  'ev': {'type': 'event', 'forms': ['ετυμπανισθησαν'], 'gloss': 'ἐτυμπανίσθησαν, “were tortured” (on the τύμπανον)', 'text': 'Hebrews’ verb occurs nowhere else in the New Testament. In 2 Maccabees, Eleazar is taken to the τύμπανον (6:19, 28) after refusing a way to be released from death (6:21–22), and the seven brothers die in hope of the resurrection (7:14).'}},
 {'id': 'rom9-wis15', 'kind': 'partial', 'nt': ['ROM', 9, 20, 21], 'dc': ['WIS', 15, 7, 7], 'title': 'The potter, the clay and vessels for different uses',
  'ev': {'type': 'combo', 'roots': ['κεραμ', 'πηλ', 'σκευ'], 'gloss': 'κεραμεύς, “potter”, πηλός, “clay”, σκεῦος, “vessel”; both also say the vessels come “from the same” clay', 'note': 'The image is also in Isaiah (29:16; 45:9) and Jeremiah 18, and Romans 9:20 echoes Isaiah.'}},
 {'id': 'mt11-sir51', 'kind': 'partial', 'nt': ['MAT', 11, 28, 30], 'dc': ['SIR', 51, 23, 27], 'title': 'An invitation to take up a yoke and find rest',
  'ev': {'type': 'combo', 'roots': ['ζυγ', 'αναπαυ', 'ψυχ'], 'gloss': 'ζυγός, “yoke”, ἀνάπαυσις, “rest”, ψυχή, “soul”'}},
 {'id': 'lk1-sir10', 'kind': 'weak', 'nt': ['LUK', 1, 52, 52], 'dc': ['SIR', 10, 14, 14], 'title': 'God casts down rulers from their thrones',
  'ev': {'type': 'combo', 'roots': ['καθειλ', 'θρον'], 'gloss': 'καθεῖλεν, “he cast down”, with θρόνος, “throne”'}},
 {'id': 'jas1-sir5', 'kind': 'weak', 'nt': ['JAM', 1, 19, 19], 'dc': ['SIR', 5, 11, 11], 'title': 'Be quick to hear',
  'ev': {'type': 'combo', 'roots': ['ταχυσ', 'ακ'], 'gloss': 'ταχύς, “quick”, with a word for hearing'}},
]

out = []
for p in PAIRS:
    e = dict(p['ev'])
    if e['type'] in ('rare', 'history', 'event'):
        e['found'] = rare(e['forms'])
    else:
        e['found'] = windows(e['roots'])
    nt, dc = p['nt'], p['dc']
    q = {'id': p['id'], 'kind': p['kind'], 'title': p['title'], 'nt': nt, 'dc': dc, 'ev': e,
         'grk': {'nt': verses(*nt), 'dc': verses(*dc)}}
    if p.get('dc2'): q['dc2'] = p['dc2']
    out.append(q)
    print('%-12s %-8s found in %d place(s): %s' % (p['id'], p['kind'], len(e['found']), ', '.join(e['found'][:10])))
meta = {'sources': 'Greek Old Testament: the Septuagint as printed by L. C. L. Brenton (public domain, eBible.org). Greek New Testament: the NA28 text from STEPBible.org TAGNT (CC BY 4.0).',
        'method': 'Words are compared without accents. “Found in” lists every verse of the Greek Bible containing the word, or every place where all the listed word roots occur within four verses of each other.'}
open(os.path.join(B, 'dcnt.js'), 'w', encoding='utf-8').write('__DCNT(' + json.dumps({'meta': meta, 'pairs': out}, ensure_ascii=False, separators=(',', ':')) + ');\n')
