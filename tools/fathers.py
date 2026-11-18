"""Fathers on each verse: public-domain excerpts from the HistoricalChristianFaith Commentaries-Database -> site/bible/fath/<group>.js"""
import os, re, json, collections, html as H, sys
sys.path.insert(0, '/home/user/church/tools')
import fdates
R = '/home/user/church/'
SRC = R + 'dl/hccf/'
OUT = R + 'site/bible/fath/'
NAMES = {'Genesis': 'GEN', 'Exodus': 'EXO', 'Leviticus': 'LEV', 'Numbers': 'NUM', 'Deuteronomy': 'DEU', 'Joshua': 'JOS', 'Judges': 'JDG', 'Ruth': 'RUT', '1 Samuel': '1SA', '2 Samuel': '2SA',
 '1 Kings': '1KI', '2 Kings': '2KI', '1 Chronicles': '1CH', '2 Chronicles': '2CH', 'Ezra': 'EZR', 'Nehemiah': 'NEH', 'Esther': 'EST', 'Job': 'JOB', 'Psalms': 'PSA', 'Proverbs': 'PRO', 'Ecclesiastes': 'ECC',
 'Song of Solomon': 'SOL', 'Song of Songs': 'SOL', 'Isaiah': 'ISA', 'Jeremiah': 'JER', 'Lamentations': 'LAM', 'Ezekiel': 'EZE', 'Daniel': 'DAN', 'Hosea': 'HOS', 'Joel': 'JOE', 'Amos': 'AMO', 'Obadiah': 'OBA',
 'Jonah': 'JON', 'Micah': 'MIC', 'Nahum': 'NAH', 'Habakkuk': 'HAB', 'Zephaniah': 'ZEP', 'Haggai': 'HAG', 'Zechariah': 'ZEC', 'Malachi': 'MAL', 'Matthew': 'MAT', 'Mark': 'MAR', 'Luke': 'LUK', 'John': 'JOH',
 'Acts': 'ACT', 'Romans': 'ROM', '1 Corinthians': '1CO', '2 Corinthians': '2CO', 'Galatians': 'GAL', 'Ephesians': 'EPH', 'Philippians': 'PHI', 'Colossians': 'COL', '1 Thessalonians': '1TH',
 '2 Thessalonians': '2TH', '1 Timothy': '1TI', '2 Timothy': '2TI', 'Titus': 'TIT', 'Philemon': 'PHM', 'Hebrews': 'HEB', 'James': 'JAM', '1 Peter': '1PE', '2 Peter': '2PE', '1 John': '1JO', '2 John': '2JO',
 '3 John': '3JO', 'Jude': 'JUD', 'Revelation': 'REV', 'Tobit': 'TOB', 'Judith': 'JDT', 'Wisdom of Solomon': 'WIS', 'Wisdom': 'WIS', 'Sirach': 'SIR', 'Baruch': 'BAR', '1 Maccabees': '1MA', '2 Maccabees': '2MA'}
GRP = {}
for g, bs in [('law', 'GEN EXO LEV NUM DEU'), ('hist', 'JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST'), ('wis', 'JOB PSA PRO ECC SOL'),
              ('proph', 'ISA JER LAM EZE DAN HOS JOE AMO OBA JON MIC NAH HAB ZEP HAG ZEC MAL'), ('gosp', 'MAT MAR LUK JOH ACT'),
              ('epis', 'ROM 1CO 2CO GAL EPH PHI COL 1TH 2TH 1TI 2TI TIT PHM HEB JAM 1PE 2PE 1JO 2JO 3JO JUD REV')]:
    for b in bs.split(): GRP[b] = g
ANF = {'Tertullian', 'Irenaeus', 'Cyprian', 'Clement of Alexandria', 'Hippolytus of Rome', 'Justin Martyr', 'Lactantius', 'Methodius of Olympus', 'Novatian', 'Ignatius of Antioch', 'Polycarp of Smyrna',
       'Apostolic Constitutions', 'Arnobius', 'Victorinus of Pettau', 'Gregory Thaumaturgus', 'Dionysius of Alexandria', 'Athenagoras', 'Theophilus of Antioch', 'Tatian', 'Clement of Rome', 'Barnabas',
       'Shepherd of Hermas', 'Mathetes', 'Commodianus', 'Minucius Felix', 'Archelaus', 'Peter of Alexandria', 'Alexander of Alexandria', 'Julius Africanus', 'Anatolius', 'Pamphilus'}
NPNF = {'Gregory of Nyssa', 'Gregory of Nazianzus', 'Athanasius of Alexandria', 'Cyril of Jerusalem', 'Hilary of Poitiers', 'Leo the Great', 'John Cassian', 'Ephrem the Syrian',
        'Aphrahat the Persian Sage', 'Eusebius of Caesarea', 'John Damascene', 'Sulpitius Severus', 'Rufinus of Aquileia', 'Vincent of Lerins', 'Socrates Scholasticus', 'Sozomen'}
NTB = 'Matthew|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|Statues'
def public(a, t):
    if 'Catena Aurea' in t: return True
    if re.search(r'Heraclides|Certain Propositions|Forty Gospel|Unfinished', t): return False
    if a in ANF: return True
    if a in NPNF: return not t.startswith('Commentary')
    if a == 'Augustine of Hippo': return bool(re.match(r'(Tractate|Exposition on (the )?Psalm|Our Lord.s Sermon|Sermon|Letter|City of God|On |Confessions|Enchiridion|Homil|Against|Reply|Of |Concerning|Harmony|Treatise|Lectures)', t))
    if a == 'John Chrysostom': return bool(re.search(r'Homil', t) and re.search(NTB, t)) or bool(re.match(r'(Letter|On the Priesthood|Treatise|Instructions to Catechumens)', t))
    if a == 'Origen of Alexandria': return bool(re.match(r'(Commentary on the Gospel of John, Book (1|2|4|5|6|10|13)\b|Commentary on (the Gospel of )?Matthew,? Book (10|11|12|13|14)\b|Against Celsus|De Principiis|On First Principles|Letter)', t))
    if a == 'Cyril of Alexandria': return bool(re.search(r'John|Luke', t)) or t.startswith('Letter')
    if a == 'Ambrose of Milan': return bool(re.match(r'(On |Letter|Concerning|Three Books|Two Books|Exhortation)', t))
    if a == 'Jerome': return bool(re.match(r'(Letter|Against|Lives|Apology|Preface|Life of|Dialogue Against)', t))
    if a == 'Gregory the Dialogist': return bool(re.match(r'(Morals|Moralia|Pastoral|Book of Pastoral|Dialogues|Letter|Epistle)', t))
    if a == 'Basil of Caesarea': return bool(re.match(r'(Hexaemeron|Homily [IVX]+ \(?Hexa|Letter|On the Holy Spirit|De Spiritu)', t))
    if a == 'Theodoret of Cyrus': return bool(re.match(r'(Letter|Ecclesiastical History|Dialogue|Counter-Statements)', t))
    return False
def clip(q, n=900):
    q = re.sub(r'\s+\n', '\n', q).strip()
    q = re.sub(r'\n{3,}', '\n\n', q)
    if len(q) <= n: return q
    cut = q[:n]; k = max(cut.rfind('. '), cut.rfind('? '), cut.rfind('! '))
    return (cut[:k + 1] if k > n * 0.5 else cut.rsplit(' ', 1)[0]) + ' …'
yrs = {}
for d in os.listdir(SRC):
    m = os.path.join(SRC, d, 'metadata.toml')
    if os.path.isfile(m):
        y = re.search(r'default_year=(-?\d+)', open(m, encoding='utf-8').read()); yrs[d] = int(y.group(1)) if y else 9999
E = collections.defaultdict(list)
for d in os.listdir(SRC):
    p = os.path.join(SRC, d)
    if not os.path.isdir(p) or d.startswith('.'): continue
    for f in os.listdir(p):
        m = re.match(r'^(.+?) (\d+)_(\d+)(?:-(\d+))?\.toml$', f)
        if not m or m.group(1) not in NAMES: continue
        b, c, v1 = NAMES[m.group(1)], int(m.group(2)), int(m.group(3)); v2 = int(m.group(4) or v1)
        t = open(os.path.join(p, f), encoding='utf-8').read()
        for blk in t.split('[[commentary]]')[1:]:
            st = re.search(r'source_title="([^"]*)"', blk); st = st.group(1).strip() if st else ''
            q = re.search(r"quote='''(.*?)'''", blk, re.S); q = q.group(1).strip() if q else ''
            if not q or len(q) < 60 or not public(d, st): continue
            q = H.unescape(re.sub(r'<[^>]+>', '', q))
            au = d
            if 'Catena Aurea' in st:   # the Catena quotes many Fathers: the speaker is usually named at the start
                mm = re.match(r'^([A-Z][A-Za-z .]{2,40}?)(?:\s*\([^)]*\))?\s*:\s*', q)
                if mm and len(mm.group(1).split()) <= 4 and not re.match(r'^(It|There|And|But|This|The|He|For|So|Then|Or|What|Hence|Thus|Again|Also|Here|Now|Wherefore|As|According|Ord|Nicodemus)\b', mm.group(1)): au = mm.group(1).strip(); q = q[mm.end():]
            E[(b, c)].append([v1, v2, au, yrs.get(d, 9999) if au == d else yrs.get(d, 9999), st, q])
os.makedirs(OUT, exist_ok=True)
for fn in os.listdir(OUT): os.remove(OUT + fn)
chunks = collections.defaultdict(list); total = 0; nverses = 0
for (b, c), lst in E.items():
    # at most 4 excerpts per verse start, preferring different authors and earlier writers
    by = collections.defaultdict(list)
    for e in lst: by[e[0]].append(e)
    out = []
    for v, es in sorted(by.items()):
        es.sort(key=lambda e: (e[3], -len(e[5])))
        seen, pick = set(), []
        for e in es:
            if e[2] in seen: continue
            seen.add(e[2]); pick.append(e)
            if len(pick) == 4: break
        for e in pick: out.append([e[0], e[1], e[2], e[4], clip(e[5])] + list(fdates.date_for(e[2], e[4]))); total += 1
        nverses += 1
    chunks[GRP.get(b, 'dc')].append((b, c, out))
for g, items in chunks.items():
    books = collections.defaultdict(list)
    for b, c, out in items: books[b].append([c, out])
    js = '\n'.join('__FATH(%s,%s);' % (json.dumps(b), json.dumps(sorted(v), ensure_ascii=False, separators=(',', ':'))) for b, v in books.items())
    open(OUT + g + '.js', 'w', encoding='utf-8').write(js)
print('excerpts', total, 'verse starts', nverses, {g: round(os.path.getsize(OUT + g + '.js') / 1e6, 1) for g in chunks})
