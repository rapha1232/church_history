"""Extract quotable sentences from public-domain ANF/NPNF translations (CCEL ThML editions)."""
import json, re, sys, random
sys.path.insert(0, '/home/user/church/tools')
from thml import load, walk
Q = '/home/user/church/q/'
# (volume, regex on title path, author, work title, series)
W = [
 ('anf01', r'^CLEMENT OF ROME / First Epistle', 'Clement of Rome', 'First Epistle to the Corinthians'),
 ('anf01', r'^IGNATIUS / Epistle to the (\w+)', 'Ignatius of Antioch', 'Epistle to the {1}'),
 ('anf01', r'Epistle of Mathetes|Diognetus', 'Epistle to Diognetus', 'Epistle to Diognetus'),
 ('anf01', r'^POLYCARP', 'Polycarp of Smyrna', 'Epistle to the Philippians'),
 ('anf01', r'^JUSTIN MARTYR / The First Apology', 'Justin Martyr', 'First Apology'),
 ('anf01', r'^JUSTIN MARTYR / Dialogue with Trypho', 'Justin Martyr', 'Dialogue with Trypho'),
 ('anf01', r'^IRENÆUS / Against Heresies: (Book \w+)', 'Irenaeus of Lyon', 'Against Heresies, {1}'),
 ('anf02', r'^CLEMENT OF ALEXANDRIA / Exhortation', 'Clement of Alexandria', 'Exhortation to the Heathen'),
 ('anf02', r'^CLEMENT OF ALEXANDRIA / The Instructor', 'Clement of Alexandria', 'The Instructor'),
 ('anf02', r'^CLEMENT OF ALEXANDRIA / The Stromata', 'Clement of Alexandria', 'Stromata'),
 ('anf02', r'^CLEMENT OF ALEXANDRIA / Who is the Rich', 'Clement of Alexandria', 'Who Is the Rich Man That Shall Be Saved?'),
 ('anf02', r'^ATHENAGORAS / A Plea', 'Athenagoras', 'A Plea for the Christians'),
 ('anf03', r'/ Apology\.', 'Tertullian', 'Apology'),
 ('anf03', r'/ On Prayer\.', 'Tertullian', 'On Prayer'),
 ('anf03', r'/ On Patience\.', 'Tertullian', 'On Patience'),
 ('anf03', r'/ On Repentance\.', 'Tertullian', 'On Repentance'),
 ('anf03', r'/ The Prescription Against Heretics', 'Tertullian', 'The Prescription Against Heretics'),
 ('anf04', r'^Minucius Felix', 'Minucius Felix', 'Octavius'),
 ('anf04', r'^Origen\. / Origen De Principiis', 'Origen', 'On First Principles'),
 ('anf04', r'^Origen\. / Origen Against Celsus', 'Origen', 'Against Celsus'),
 ('anf05', r'^Cyprian\. / The Treatises of Cyprian\. / ([^/]+)', 'Cyprian of Carthage', '{1}'),
 ('anf05', r'^Cyprian\. / The Epistles of Cyprian', 'Cyprian of Carthage', 'Epistles'),
 ('anf07', r'^Lactantius / The Divine Institutes', 'Lactantius', 'The Divine Institutes'),
 ('npnf101', r'^The Confessions', 'Augustine of Hippo', 'Confessions'),
 ('npnf101', r'^Letters of St\. Augustin', 'Augustine of Hippo', 'Letters'),
 ('npnf102', r'^City of God', 'Augustine of Hippo', 'The City of God'),
 ('npnf102', r'^On Christian Doctrine', 'Augustine of Hippo', 'On Christian Doctrine'),
 ('npnf103', r'/ On the Holy Trinity', 'Augustine of Hippo', 'On the Trinity'),
 ('npnf103', r'/ The Enchiridion', 'Augustine of Hippo', 'Enchiridion'),
 ('npnf103', r'/ On the Catechising', 'Augustine of Hippo', 'On the Catechising of the Uninstructed'),
 ('npnf103', r'/ On Patience', 'Augustine of Hippo', 'On Patience'),
 ('npnf106', r'^Our Lord’s Sermon on the Mount', 'Augustine of Hippo', 'Our Lord’s Sermon on the Mount'),
 ('npnf106', r'^Sermons on Selected Lessons', 'Augustine of Hippo', 'Sermons on New Testament Lessons'),
 ('npnf108', r'^Expositions on the Book of Psalms\. / (Psalm [IVXLC]+)', 'Augustine of Hippo', 'Expositions on the Psalms, {1}'),
 ('npnf111', r"on Paul's Epis", 'John Chrysostom', 'Homilies on Romans'),
 ('npnf111', r'Acts of the Apostles', 'John Chrysostom', 'Homilies on Acts'),
 ('npnf107', r'^Lectures or Tractates on the Gospel', 'Augustine of Hippo', 'Tractates on the Gospel of John'),
 ('npnf107', r'First Epistle of John|Ten Homilies on the First Epistle', 'Augustine of Hippo', 'Homilies on the First Epistle of John'),
 ('npnf107', r'^Two Books of Soliloquies', 'Augustine of Hippo', 'Soliloquies'),
 ('npnf109', r'^Treatise Concerning the Christian Priesthood', 'John Chrysostom', 'On the Priesthood'),
 ('npnf109', r'^The Homilies on the Statues', 'John Chrysostom', 'Homilies on the Statues'),
 ('npnf110', r'^The Homilies of St\. John Chrysostom', 'John Chrysostom', 'Homilies on Matthew'),
 ('npnf112', r'Corinthians', 'John Chrysostom', 'Homilies on the Corinthians'),
 ('npnf113', r'/ Homilies on (Ephesians|Philippians|Colossians|1 Timothy|2 Timothy|Philemon|Titus)\.', 'John Chrysostom', 'Homilies on {1}'),
 ('npnf114', r'^The Homilies of St\. John Chrysostom on the Gospel', 'John Chrysostom', 'Homilies on John'),
 ('npnf114', r'Hebrews', 'John Chrysostom', 'Homilies on Hebrews'),
 ('npnf204', r'^The Incarnation of the Word', 'Athanasius of Alexandria', 'On the Incarnation'),
 ('npnf204', r'^Against the Heathen', 'Athanasius of Alexandria', 'Against the Heathen'),
 ('npnf204', r'^Life of Antony', 'Athanasius of Alexandria', 'Life of Antony'),
 ('npnf205', r'/ On Virginity', 'Gregory of Nyssa', 'On Virginity'),
 ('npnf205', r'/ On the Making of Man', 'Gregory of Nyssa', 'On the Making of Man'),
 ('npnf205', r'/ +On the Soul and the Resurrection', 'Gregory of Nyssa', 'On the Soul and the Resurrection'),
 ('npnf205', r'/ The Great Catechism', 'Gregory of Nyssa', 'The Great Catechism'),
 ('npnf206', r'^The Letters of St\. Jerome', 'Jerome', 'Letters'),
 ('npnf206', r'/ The Life of S\. Hilarion', 'Jerome', 'Life of Hilarion'),
 ('npnf207', r'^The Catechetical Lectures', 'Cyril of Jerusalem', 'Catechetical Lectures'),
 ('npnf207', r'^Select Orations of Saint Gregory', 'Gregory of Nazianzus', 'Orations'),
 ('npnf207', r'^Select Letters of Saint Gregory', 'Gregory of Nazianzus', 'Letters'),
 ('npnf208', r'^The Letters', 'Basil of Caesarea', 'Letters'),
 ('npnf208', r'On the Spirit|De Spiritu', 'Basil of Caesarea', 'On the Holy Spirit'),
 ('npnf208', r'Hexaemeron', 'Basil of Caesarea', 'Hexaemeron'),
 ('npnf209', r'/ De Trinitate or On the Trinity', 'Hilary of Poitiers', 'On the Trinity'),
 ('npnf209', r'^John of Damascus', 'John of Damascus', 'An Exact Exposition of the Orthodox Faith'),
 ('npnf210', r'/ On the Duties of the Clergy', 'Ambrose of Milan', 'On the Duties of the Clergy'),
 ('npnf210', r'/ Concerning Repentance', 'Ambrose of Milan', 'Concerning Repentance'),
 ('npnf210', r'/ On the Mysteries', 'Ambrose of Milan', 'On the Mysteries'),
 ('npnf210', r'/ Concerning Virgins', 'Ambrose of Milan', 'Concerning Virgins'),
 ('npnf211', r'/ On the Life of St\. Martin', 'Sulpicius Severus', 'Life of St Martin'),
 ('npnf211', r'Twelve Books on the Institutes', 'John Cassian', 'Institutes'),
 ('npnf211', r'Conferences of John Cassian', 'John Cassian', 'Conferences'),
 ('npnf211', r'Commonitory|Vincent', 'Vincent of Lérins', 'Commonitory'),
 ('npnf212', r'Leo the Great\. / Sermons', 'Leo the Great', 'Sermons'),
 ('npnf212', r'Leo the Great\. / Letters', 'Leo the Great', 'Letters'),
 ('npnf212', r'/ The Book of Pastoral Rule', 'Gregory the Great', 'Pastoral Rule'),
 ('npnf213', r'Ephraim Syrus:\s+(The Nisibene Hymns|Nineteen Hymns on the Nativity|The Pearl|Three Homilies)', 'Ephrem the Syrian', '{1}'),
 ('npnf213', r'Aphrahat', 'Aphrahat', 'Demonstrations'),
]
GOOD = set('god lord christ love soul faith prayer pray humility humble truth peace grace heart hope mercy charity virtue pride patience joy church wisdom sin forgive forgiveness spirit light life death heaven poor rich neighbour neighbor holy holiness repentance tears silence word desire rest seek fear praise glory beauty good evil body mind will friend friendship kindness gentle meek almsgiving fasting temptation devil cross martyr eternal'.split())
BAD = re.compile(r'\b(Jews?|Jewish|heretic|heretics|heresy|Valentin|Marcion|Gnostic|Arian|Arius|Eunomius|Celsus|Manichæ|Pelagi|Novatian|Sabelli|pagan|heathen|demons?|idols?|chapter|aforesaid|above|below|we have said|as I said|already said|book|treatise|the former|the latter|vol\.|cf\.|ibid|you say|thou sayest|he says|they say|Trypho|Hermogenes|Praxeas|Apollinar|Nestori|Eutych|Donatist|women|woman|wives|slaves?|barbarian|Moses|Abraham|Elias|David|Paul|Peter|Isaiah|Jeremiah|Solomon|Noah|Adam|Eve|Esau|Jacob|Pharaoh|O man|thou fool|Tertullian|Origen|Julian)\b', re.I)
START_BAD = re.compile(r'^(And|But|For|Therefore|Wherefore|This|These|That|Those|Such|He|She|They|It|Its|Thus|So|Hence|Again|Moreover|Nor|Or|Then|Now|Yet|Also|Whence|Which|Who|Whom|Here|There|Accordingly|Consequently|Besides|Further|Furthermore|Nay|Yea|Lastly|Finally|Afterwards|When|As|If|Since|Because|Although|Though|Even|Hereupon|Wherein|Whereupon|What|Why|How|Lo|Behold|Again|Let us now|In this|In these|Of this|Of these|By this|To this|From this|On this|At this|With this|After this|Both|Either|Neither|One|Another|Some|Others|Many|Most|All these|No one of these|I mean|You see|See|Do you|Did you|Have you|Are you|Seest|Hast|Dost|Art thou|Wilt thou|Thou|Ye|You)\b')
def sentences(t):
    t = re.sub(r'\[[^\]]*\]', '', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return re.split(r'(?<=[.!?])\s+(?=[A-Z“"‘])', t)
def good(s):
    w = s.split()
    if not 12 <= len(w) <= 46: return 0
    if not s[0].isupper() or s[-1] not in '.!': return 0
    if START_BAD.match(s) or BAD.search(s) or EXTRA.search(s): return 0
    if re.search(r'[“”"’‘]', s) and not re.search(r"\w’\w", s): return 0
    if re.search(r'&c|Greeting|greeting|Fare ye well|^May (you|the)|^(A|An) (description|establishment|argument|exhortation)|^Of |^(The|An?) (answer|signs?)\b|^How |^That |^Whether |^(Let us|We must|We shall|We will) (now|then)? ?(see|consider|inquire|notice|examine|turn|speak|pass|proceed|discuss|deal)|^I (will|shall|have|had|am|was|do|did|know|think|pray|entreat|beseech|urge|cannot|must|deem|trust|hope|observe|see|heard|received)\b|^We have\b', s): return 0
    caps = sum(1 for x in w if x[:1].isupper()); 
    if caps > len(w) * 0.4: return 0
    if re.search(r'[\(\)\[\]0-9;:—–]|--|\bi\.e\b|\be\.g\b', s): return 0
    if re.search(r'[α-ωΑ-Ω֐-׿]', s): return 0
    if s.count('"') % 2 or s.count('“') != s.count('”') or "‘" in s or '’ ' in s and s.count('’') > 2: return 0
    if re.search(r'\b(he|she|they|him|them|his|her|their|this|these|those|it)\b', ' '.join(w[:5]), re.I) and not re.search(r'\b(God|Christ|Lord)\b', s): return 0
    lw = set(re.findall(r'[a-z]+', s.lower()))
    sc = len(lw & GOOD)
    if sc < 2: return 0
    sc += 2 if re.match(r'^(Love|Faith|Prayer|Humility|Patience|Peace|God|Christ|The soul|The heart|Nothing|No one|Whoever|Whosoever|He who|He that|Let|Where|Blessed|Every|To|Great|True|Truth|Hope|Charity|Mercy|Grace|Pride|Silence|Our|We|I|O Lord|O God)\b', s) else 0
    sc -= abs(len(w) - 24) / 12
    return sc
XP = re.compile(r'Introduct|Title Page|Prolegom|Preface|Notice|Index|Excursus|Contents|Analysis|Argument|Summary|Notes?\b|Appendix|Fragment|Spurious|Doubtful|Chronolog|Table', re.I)
EXTRA = re.compile(r'\b(salute|greet|congratulat|your (Holiness|Reverence|Excellency|Grace|Piety|Sanctity|Charity|Affection|Lordship|Beatitude|Brotherliness|Love|letter)|my (lord|brother|son|dear|sister|daughter)|beloved brother|dearest|letters?|write|wrote|written|messenger|bearer|to whom be|world without end|for ever and ever|saith|said unto|it is written|the Apostle|the prophet|the Scripture says|Amen|Ghost|aforementioned|the following|as follows|below|hereafter)\b', re.I)
def cite(path, depth):
    parts = []
    for t, st, n in path[depth:]:
        lab = st or ''
        t = t.strip()
        if not lab:
            m = re.match(r'^((?:Chapter|Book|Homily|Letter|Epistle|Sermon|Lecture|Oration|Conference|Section|Hymn|Demonstration|Tractate|Part)\s+[\w.]+)', t)
            lab = m.group(1).rstrip('.') if m else (t.rstrip('.') if 3 < len(t) <= 48 and not re.search(r'[;:]', t) else '')
            if re.match(r'^(John|Matthew|Matt\.|Heb\.|Hebrews|[12] Cor)\b.*\d', lab): lab = 'Homily on ' + lab.replace('.', ':', 1) if re.search(r'\d\.\d', lab) else 'Homily on ' + lab
        if lab and lab not in parts: parts.append(lab.rstrip('.'))
    return ', '.join(parts[:3])
def run():
    out = []
    for vol in sorted(set(w[0] for w in W)):
        try: ps = walk(load(Q + vol + '.xml'))
        except Exception as e: print('ERR', vol, e); continue
        specs = [w for w in W if w[0] == vol]
        for path, t in ps:
            if any(XP.search(x[0]) for x in path[1:]) or (len(path) == 1 and XP.search(path[0][0])): continue
            joined = ' / '.join(x[0].strip() for x in path)
            for _, rx, au, wk in specs:
                m = re.search(rx, joined)
                if not m: continue
                work = wk.replace('{1}', (m.group(1) if m.groups() else '').strip(' .')) if '{1}' in wk else wk
                depth = len(re.search(rx, joined).group(0).split(' / '))
                for s in sentences(t):
                    sc = good(s)
                    if sc > 0: out.append({'q': s, 'a': au, 'w': work, 'c': cite(path, depth), 'v': vol, 's': round(sc, 2)})
                break
    return out
if __name__ == '__main__':
    out = run()
    from collections import Counter
    print(len(out), Counter(o['a'] for o in out).most_common())
    json.dump(out, open(Q + 'cands.json', 'w'), ensure_ascii=False, indent=0)
