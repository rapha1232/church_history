"""Build the Bible library: per-book JS files for each source text + an edition manifest."""
import json, os, re, shutil
R = '/home/user/church/'
RAW = R + 'bible/raw/'
OUT = R + 'site/bible/'
SRC = {'kjv': 'eng-kjv', 'web': 'eng-web', 'dra': 'engDRA', 'lxx': 'eng-Brenton', 'lxxg': 'grcbrent', 'vul': 'latVUC'}
NAMES = {'GEN': 'Genesis', 'EXO': 'Exodus', 'LEV': 'Leviticus', 'NUM': 'Numbers', 'DEU': 'Deuteronomy', 'JOS': 'Joshua', 'JDG': 'Judges', 'RUT': 'Ruth', '1SA': '1 Samuel', '2SA': '2 Samuel',
 '1KI': '1 Kings', '2KI': '2 Kings', '1CH': '1 Chronicles', '2CH': '2 Chronicles', 'EZR': 'Ezra', 'NEH': 'Nehemiah', 'EST': 'Esther', 'JOB': 'Job', 'PSA': 'Psalms', 'PRO': 'Proverbs', 'ECC': 'Ecclesiastes',
 'SOL': 'Song of Songs', 'ISA': 'Isaiah', 'JER': 'Jeremiah', 'LAM': 'Lamentations', 'EZE': 'Ezekiel', 'DAN': 'Daniel', 'HOS': 'Hosea', 'JOE': 'Joel', 'AMO': 'Amos', 'OBA': 'Obadiah', 'JON': 'Jonah',
 'MIC': 'Micah', 'NAH': 'Nahum', 'HAB': 'Habakkuk', 'ZEP': 'Zephaniah', 'HAG': 'Haggai', 'ZEC': 'Zechariah', 'MAL': 'Malachi', 'TOB': 'Tobit', 'JDT': 'Judith', 'ESG': 'Esther (Greek)', 'WIS': 'Wisdom',
 'SIR': 'Sirach', 'BAR': 'Baruch', 'EPJ': 'Letter of Jeremiah', 'PRA': 'Song of the Three Young Men', 'SUS': 'Susanna', 'BEL': 'Bel and the Dragon', '1MA': '1 Maccabees', '2MA': '2 Maccabees',
 '3MA': '3 Maccabees', '4MA': '4 Maccabees', '1ES': '1 Esdras', '4ES': '2 Esdras', 'PRM': 'Prayer of Manasseh', 'PSX': 'Psalm 151', 'DNG': 'Daniel (Greek)', 'MAT': 'Matthew', 'MAR': 'Mark', 'LUK': 'Luke',
 'JOH': 'John', 'ACT': 'Acts', 'ROM': 'Romans', '1CO': '1 Corinthians', '2CO': '2 Corinthians', 'GAL': 'Galatians', 'EPH': 'Ephesians', 'PHI': 'Philippians', 'COL': 'Colossians', '1TH': '1 Thessalonians',
 '2TH': '2 Thessalonians', '1TI': '1 Timothy', '2TI': '2 Timothy', 'TIT': 'Titus', 'PHM': 'Philemon', 'HEB': 'Hebrews', 'JAM': 'James', '1PE': '1 Peter', '2PE': '2 Peter', '1JO': '1 John', '2JO': '2 John',
 '3JO': '3 John', 'JUD': 'Jude', 'REV': 'Revelation'}
DOUAY = {'1SA': '1 Samuel (1 Kings)', '2SA': '2 Samuel (2 Kings)', '1KI': '1 Kings (3 Kings)', '2KI': '2 Kings (4 Kings)', '1CH': '1 Chronicles (1 Paralipomenon)', '2CH': '2 Chronicles (2 Paralipomenon)',
         'EZR': 'Ezra (1 Esdras)', 'NEH': 'Nehemiah (2 Esdras)', 'TOB': 'Tobit (Tobias)', 'SOL': 'Song of Songs (Canticle of Canticles)', 'SIR': 'Sirach (Ecclesiasticus)', 'ISA': 'Isaiah (Isaias)',
         'JER': 'Jeremiah (Jeremias)', 'EZE': 'Ezekiel (Ezechiel)', 'HOS': 'Hosea (Osee)', 'OBA': 'Obadiah (Abdias)', 'JON': 'Jonah (Jonas)', 'MIC': 'Micah (Micheas)', 'ZEP': 'Zephaniah (Sophonias)',
         'HAG': 'Haggai (Aggeus)', 'ZEC': 'Zechariah (Zacharias)', 'MAL': 'Malachi (Malachias)', 'HAB': 'Habakkuk (Habacuc)', 'REV': 'Revelation (Apocalypse)', '1MA': '1 Maccabees (1 Machabees)', '2MA': '2 Maccabees (2 Machabees)'}
LXXN = {'1SA': '1 Samuel (1 Kingdoms)', '2SA': '2 Samuel (2 Kingdoms)', '1KI': '1 Kings (3 Kingdoms)', '2KI': '2 Kings (4 Kingdoms)', '1CH': '1 Chronicles (1 Paralipomenon)', '2CH': '2 Chronicles (2 Paralipomenon)',
        'EZR': 'Ezra (2 Esdras)', 'NEH': 'Nehemiah (2 Esdras, cont.)', '1ES': '1 Esdras', 'ESG': 'Esther', 'DNG': 'Daniel', 'PSA': 'Psalms'}
OT = ['GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO', 'ECC', 'SOL', 'ISA', 'JER', 'LAM', 'EZE', 'DAN',
      'HOS', 'JOE', 'AMO', 'OBA', 'JON', 'MIC', 'NAH', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL']
NT = ['MAT', 'MAR', 'LUK', 'JOH', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHI', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAM', '1PE', '2PE', '1JO', '2JO', '3JO', 'JUD', 'REV']
MINOR = ['HOS', 'JOE', 'AMO', 'OBA', 'JON', 'MIC', 'NAH', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL']
CATH_OT = ['GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'TOB', 'JDT', 'EST', '1MA', '2MA', 'JOB', 'PSA', 'PRO', 'ECC', 'SOL', 'WIS', 'SIR',
           'ISA', 'JER', 'LAM', 'BAR', 'EZE', 'DAN'] + MINOR
DEUTERO = {'TOB', 'JDT', 'WIS', 'SIR', 'BAR', '1MA', '2MA', 'ESG', 'DNG', 'EPJ', 'PRA', 'SUS', 'BEL', '1ES', '4ES', 'PRM', '3MA', '4MA', 'PSX'}
ORTH_OT = ['GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', '1ES', 'EZR', 'NEH', 'TOB', 'JDT', 'ESG', '1MA', '2MA', '3MA', 'PSA', 'PSX', 'PRM', 'JOB',
           'PRO', 'ECC', 'SOL', 'WIS', 'SIR'] + MINOR + ['ISA', 'JER', 'BAR', 'LAM', 'EPJ', 'EZE', 'DNG']
def parse(src):
    path = RAW + SRC[src] + '/' + SRC[src] + '_vpl.txt'
    books = {}
    for line in open(path, encoding='utf-8'):
        m = re.match(r'^(\w{3}) (\d+):(\d+) (.*)$', line.rstrip('\n'))
        if not m: continue
        b, c, v, t = m.group(1), int(m.group(2)), int(m.group(3)), m.group(4).strip()
        para = 1 if '¶' in t else 0
        t = t.replace('¶', '').replace('\xa0', ' ').strip()
        books.setdefault(b, {}).setdefault(c, []).append([v, t] + ([1] if para else []))
    return books
DATA = {s: parse(s) for s in SRC}
def greek_nt():
    """NA28 Greek New Testament text rebuilt from STEPBible TAGNT (CC BY 4.0)."""
    import glob
    S2B = dict(zip('Mat Mrk Luk Jhn Act Rom 1Co 2Co Gal Eph Php Col 1Th 2Th 1Ti 2Ti Tit Phm Heb Jas 1Pe 2Pe 1Jn 2Jn 3Jn Jud Rev'.split(), NT))
    books = {}
    for f in sorted(glob.glob(R + 'dl/stepbible/Translators Amalgamated OT+NT/TAGNT*')):
        for line in open(f, encoding='utf-8'):
            p = line.split('\t')
            m = re.match(r'^([1-3]?[A-Z][a-z]{1,2})\.(\d+)\.(\d+)#\d+=(\S+)$', p[0]) if p else None
            if not m or m.group(1) not in S2B or 'N' not in m.group(4): continue
            w = p[1].split(' (')[0].strip()
            ch = books.setdefault(S2B[m.group(1)], {}).setdefault(int(m.group(2)), [])
            v = int(m.group(3))
            if ch and ch[-1][0] == v: ch[-1][1] += ' ' + w
            else: ch.append([v, w])
    return books
DATA['grk'] = greek_nt()
GROUPS = [('law', 'GEN EXO LEV NUM DEU'), ('hist', 'JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST'), ('wis', 'JOB PSA PRO ECC SOL'),
          ('proph', 'ISA JER LAM EZE DAN HOS JOE AMO OBA JON MIC NAH HAB ZEP HAG ZEC MAL'), ('gosp', 'MAT MAR LUK JOH ACT'), ('epis', 'ROM 1CO 2CO GAL EPH PHI COL 1TH 2TH 1TI 2TI TIT PHM HEB JAM 1PE 2PE 1JO 2JO 3JO JUD REV')]
GRP = {b: g for g, bs in GROUPS for b in bs.split()}
SG = {'law': 'ot1', 'hist': 'ot1', 'wis': 'ot2', 'proph': 'ot2', 'dc': 'ot2', 'gosp': 'nt', 'epis': 'nt'}
shutil.rmtree(OUT, ignore_errors=True)
sizes = 0; files = 0; FILES = {}
for s, books in DATA.items():
    os.makedirs(OUT + s, exist_ok=True)
    chunks = {}
    for b, chs in books.items():
        arr = [[c, chs[c]] for c in sorted(chs)]
        chunks.setdefault(SG[GRP.get(b, 'dc')], []).append('__BIB(%s,%s,%s);' % (json.dumps(s), json.dumps(b), json.dumps(arr, ensure_ascii=False, separators=(',', ':'))))
    for g, js in chunks.items():
        js = '\n'.join(js); open(OUT + s + '/' + g + '.js', 'w', encoding='utf-8').write(js); sizes += len(js.encode()); files += 1
def book(code, src, names=None, sec='ot'):
    n = len(DATA[src].get(code, {}))
    if not n: raise SystemExit('missing %s in %s' % (code, src))
    return [code, src, (names or {}).get(code, NAMES[code]), n, sec]
def sec_of(code, default): return 'dc' if code in DEUTERO else default
ED = []
ED.append({'id': 'kjv', 'name': 'King James Version', 'short': 'KJV', 'trad': 'Protestant', 'year': '1611 (1769 text)', 'books': [book(b, 'kjv') for b in OT] + [book(b, 'kjv', sec='nt') for b in NT],
           'note': 'The 66-book Protestant canon. Words in square brackets were supplied by the translators (printed in italics in the 1611 edition).'})
ED.append({'id': 'web', 'name': 'World English Bible', 'short': 'WEB', 'trad': 'Protestant', 'year': '2000–2020 (modern English)', 'books': [book(b, 'web') for b in OT] + [book(b, 'web', sec='nt') for b in NT],
           'note': 'A modern public-domain revision of the American Standard Version (1901), with the 66-book Protestant canon.'})
KJVA = ['1ES', '4ES', 'TOB', 'JDT', 'ESG', 'WIS', 'SIR', 'BAR', 'PRA', 'SUS', 'BEL', 'PRM', '1MA', '2MA']
ED.append({'id': 'kjva', 'name': 'King James Version with Apocrypha', 'short': 'KJV+A', 'trad': 'Anglican & historic Protestant', 'year': '1611 (1769 text)',
           'books': [book(b, 'kjv') for b in OT] + [book(b, 'kjv', {'ESG': 'Additions to Esther', '4ES': '2 Esdras', 'PRA': 'Song of the Three Holy Children'}, 'dc') for b in KJVA] + [book(b, 'kjv', sec='nt') for b in NT],
           'note': 'As printed in 1611: the Apocrypha between the Testaments. The Church of England’s Articles (VI) say they are read “for example of life and instruction of manners” but not to establish doctrine.'})
ED.append({'id': 'dra', 'name': 'Douay–Rheims Bible (Challoner)', 'short': 'DRA', 'trad': 'Catholic', 'year': '1582–1610, revised 1749–52',
           'books': [book(b, 'dra', DOUAY, sec_of(b, 'ot')) for b in CATH_OT] + [book(b, 'dra', DOUAY, 'nt') for b in NT],
           'note': 'The 73-book Catholic canon, translated from the Latin Vulgate. Esther and Daniel include the Greek additions; Baruch 6 is the Letter of Jeremiah. Psalms follow the Greek and Latin numbering (one lower than the Hebrew for most of the book).'})
WEBC_OT = [('ESG' if b == 'EST' else 'DNG' if b == 'DAN' else b) for b in CATH_OT]
ED.append({'id': 'webc', 'name': 'World English Bible, Catholic canon', 'short': 'WEB-C', 'trad': 'Catholic', 'year': 'modern English',
           'books': [book(b, 'web', {'ESG': 'Esther (with additions)', 'DNG': 'Daniel (with additions)'}, sec_of(b, 'ot') if b not in ('ESG', 'DNG') else 'ot') for b in WEBC_OT] + [book(b, 'web', sec='nt') for b in NT],
           'note': 'The 73-book Catholic canon in modern English, in Catholic order: Tobit, Judith and Maccabees with the historical books, Wisdom and Sirach with the wisdom books, Baruch after Lamentations.'})
LXX_ORDER = [b if b != 'PSX' else None for b in ORTH_OT]
ED.append({'id': 'lxx', 'name': 'Septuagint (Brenton) with KJV New Testament', 'short': 'LXX', 'trad': 'Orthodox', 'year': 'LXX translated 1851; NT 1611',
           'books': [book(b, 'lxx', LXXN, sec_of(b, 'ot') if b not in ('ESG', 'DNG') else 'ot') for b in ORTH_OT if b != 'PSX'] + [book('SUS', 'lxx', sec='dc'), book('BEL', 'lxx', sec='dc'), book('4MA', 'lxx', sec='app')] + [book(b, 'kjv', sec='nt') for b in NT],
           'note': 'The Old Testament of the Orthodox Church is the Greek Septuagint. Brenton’s 1851 translation includes the books Orthodox call anagignoskomena (“readable”): 1 Esdras, Tobit, Judith, 1–3 Maccabees, Prayer of Manasseh, Wisdom, Sirach, Baruch, the Letter of Jeremiah, Susanna, Bel and the Dragon and Psalm 151 (at the end of Psalms), with 4 Maccabees as an appendix. Psalm numbering is Greek. Brenton has no New Testament, so the KJV New Testament is paired with it.'})
ED.append({'id': 'webo', 'name': 'World English Bible, Orthodox canon', 'short': 'WEB-O', 'trad': 'Orthodox', 'year': 'modern English',
           'books': [book(b, 'web', {'ESG': 'Esther', 'DNG': 'Daniel', 'EZR': 'Ezra (2 Esdras)', 'NEH': 'Nehemiah'}, sec_of(b, 'ot') if b not in ('ESG', 'DNG') else 'ot') for b in ORTH_OT if b != 'EPJ']
                    + [book('4MA', 'web', sec='app')] + [book(b, 'web', sec='nt') for b in NT],
           'note': 'The wider Orthodox canon in modern English, in Septuagint order, with Psalm 151, the Prayer of Manasseh and 3 Maccabees, and 4 Maccabees as an appendix. The Letter of Jeremiah is Baruch 6. The Old Testament text follows the Hebrew-based WEB for books shared with Protestants.'})
LXXG = [b for b in ORTH_OT if b not in ('PSX', 'NEH') and b in DATA['lxxg']] + [b for b in ('SUS', 'BEL', '4MA') if b in DATA['lxxg']]
ED.append({'id': 'lxxg', 'name': 'Septuagint and New Testament in Greek', 'short': 'LXX-GR', 'trad': 'Original Greek', 'year': 'Septuagint (Brenton’s Greek text); NT: NA28 text',
           'books': [book(b, 'lxxg', dict(LXXN, EZR='Ezra–Nehemiah (2 Esdras)'), 'app' if b == '4MA' else sec_of(b, 'ot') if b not in ('ESG', 'DNG') else 'ot') for b in LXXG] + [book(b, 'grk', sec='nt') for b in NT],
           'note': 'The Bible of the Greek-speaking Church: the Septuagint, the Greek translation of the Hebrew scriptures made from the third century BC and quoted throughout the New Testament, with the New Testament in its original Greek. Ezra and Nehemiah form one book (2 Esdras); Psalm numbering is Greek.'})
ED.append({'id': 'vul', 'name': 'Vulgata Clementina (Latin Vulgate)', 'short': 'VUL', 'trad': 'Latin (Catholic)', 'year': '1592 (Clementine edition of Jerome’s translation)',
           'books': [book(b, 'vul', DOUAY, sec_of(b, 'ot')) for b in CATH_OT] + [book(b, 'vul', DOUAY, 'nt') for b in NT],
           'note': 'The Latin Bible of the Western Church for over a thousand years. Jerome translated most of it around 382–405; the Clementine edition of 1592 was the official Catholic text until 1979. The Douay–Rheims is its English translation, so the two can be compared verse by verse. Psalm numbering is Greek and Latin.'})
man = {'grp': GRP, 'sgrp': SG, 'eds': ED, 'src': {'kjv': 'King James Version (eBible.org edition, public domain)', 'web': 'World English Bible (eBible.org, public domain)', 'dra': 'Douay–Rheims 1899 American edition (public domain)', 'lxx': 'Brenton, The Septuagint Version of the Old Testament (1851, public domain)', 'lxxg': 'Septuagint Greek text as printed by Brenton (eBible.org, public domain)', 'grk': 'Greek New Testament (NA28 text) from STEPBible.org TAGNT, CC BY 4.0', 'vul': 'Vulgata Clementina (eBible.org, public domain)'}}
open(OUT + 'manifest.js', 'w', encoding='utf-8').write('__BIBMAN(' + json.dumps(man, ensure_ascii=False, separators=(',', ':')) + ');')
print('files', files, 'MB', round(sizes / 1e6, 1), 'editions', [(e['id'], len(e['books'])) for e in ED])
