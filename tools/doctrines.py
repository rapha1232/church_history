"""How doctrines developed: dated witnesses for a few disputed doctrines (site/bible/doctrines.js).

    python3 tools/doctrines.py

Every entry points to a text that is in the app: a Bible passage, a chapter of the Early Christian texts
(site/bible/texts/) or a document in the creeds and confessions library (content/docs.json). Every quotation must
appear word for word in that text, or the script stops: nothing here is paraphrased into quotation marks.
Bible entries carry no quotation; the app shows the verses in the reader's default edition.

Each witness is placed against one carefully worded statement per doctrine:
  affirms · denies · qualified (affirms in a limited sense, stated in the note) · debated (read both ways).
Early witnesses whose meaning is disputed are marked "debated", not counted for one side.
"""
import json, os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
DOCS = {d['id']: d for d in json.load(open(os.path.join(ROOT, 'content', 'docs.json'), encoding='utf-8'))}

def flat(x):
    if isinstance(x, str): return x
    if isinstance(x, dict): return ' '.join(flat(v) for v in x.values() if isinstance(v, (str, list, dict)))
    if isinstance(x, list): return ' '.join(flat(v) for v in x)
    return ''
def clean(s): return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', s)).strip()
def doc_text(i): return clean(' '.join(flat(b) for b in DOCS[i]['body']))
def work_text(w, n):
    d = json.loads(open(os.path.join(ROOT, 'site', 'bible', 'texts', w + '.js'), encoding='utf-8').read()[5:-3])
    ch = [c for c in d['ch'] if c['n'] == n][0]
    return clean(' '.join(re.sub(r'<sup[^>]*>.*?</sup>', '', p) for p in ch['p']))

B = lambda b, c, v1, v2, note, stance='debated': {'type': 'bible', 'ref': [b, c, v1, v2], 'stance': stance, 'note': note}
F = lambda year, date, w, n, who, q, stance, note: {'type': 'father', 'year': year, 'date': date, 'work': w, 'n': n, 'who': who, 'q': q, 'stance': stance, 'note': note}
D = lambda year, date, i, who, q, stance, note: {'type': 'doc', 'year': year, 'date': date, 'doc': i, 'who': who, 'q': q, 'stance': stance, 'note': note}

DOCTRINES = [
 {'id': 'rome', 'title': 'The primacy of Rome', 'statement': 'The church of Rome and its bishop hold a primacy of authority over the other churches.',
  'items': [
   dict(B('MAT', 16, 17, 19, 'Read of Peter himself, of his confession of faith, or of Christ as the rock; and of whether a role passes to successors.'), year=30, date='c. 30 (events); written later'),
   dict(B('LUK', 22, 31, 32, 'Christ prays for Peter alone and tells him to strengthen his brothers. How far this sets Peter over the others is debated.'), year=30, date='c. 30 (events)'),
   dict(B('JOH', 21, 15, 17, 'The threefold charge “Feed my sheep”: a commission for Peter, read by some as restoring him after his denials.'), year=30, date='c. 30 (events)'),
   F(96, 'c. 96', '1clem', '59', 'The church of Rome (1 Clement)', 'But if certain persons should be disobedient unto the words spoken by Him through us, let them understand that they will entangle themselves in no slight transgression and danger', 'debated',
     'Rome writes uninvited to settle a dispute at Corinth, and speaks with assurance. Whether this shows authority over Corinth or brotherly counsel is debated; the letter names no bishop of Rome.'),
   F(110, 'early 2nd century', 'ign-rom', '0', 'Ignatius of Antioch', 'even unto her that hath the presidency in the country of the region of the Romans', 'debated',
     'Ignatius greets Rome alone in this way, but “presidency” may be local, and the same greeting speaks of “the presidency of love”.'),
   F(180, 'c. 180', 'iren-ah3', '3', 'Irenaeus of Lyons', 'For it is a matter of necessity that every Church should agree with this Church, on account of its pre-eminent authority', 'debated',
     'The Greek is lost and the Latin (“propter potiorem principalitatem … convenire”) is read in different ways; the ANF translators say they are “far from sure” of their rendering.'),
   F(251, '251', 'cyp-unity', '4', 'Cyprian of Carthage', 'Assuredly the rest of the apostles were also the same as was Peter, endowed with a like partnership both of honour and power; but the beginning proceeds from unity.', 'debated',
     'This is the Received Text of chapter 4. Another version, the Primacy Text, speaks of the primacy given to Peter and the chair of Peter; see the authenticity note in the reader.'),
   D(1302, '1302', 'unam', 'Boniface VIII, Unam sanctam', 'we declare, say, define and pronounce it to be altogether necessary for salvation for every human creature that he be subject to the Roman pontiff', 'affirms', 'A papal bull.'),
   D(1571, '1563 / 1571', 'art39', 'Church of England, Thirty-Nine Articles (Art. 37)', 'The bishop of Rome hath no iurisdiction in this Realme of Englande.', 'denies', 'Denies the pope’s jurisdiction in England.'),
   D(1646, '1646', 'westminster', 'Westminster Confession (25.6)', 'There is no other head of the Church but the Lord Jesus Christ: nor can the Pope of Rome, in any sense be head thereof', 'denies', ''),
   D(1870, '1870', 'pastor', 'First Vatican Council, Pastor aeternus', 'by virtue of his supreme Apostolic authority, he defines a doctrine regarding faith or morals to be held by the universal Church', 'affirms', 'Defines papal infallibility when the pope speaks ex cathedra.'),
  ]},
 {'id': 'eucharist', 'title': 'The Eucharist', 'statement': 'The bread and wine of the Eucharist are, or become, Christ’s body and blood.',
  'items': [
   dict(B('MAT', 26, 26, 28, '“This is my body … this is my blood”: read literally, figuratively, or of a presence that is real but spiritual.'), year=30, date='c. 30 (events)'),
   dict(B('JOH', 6, 53, 56, 'Whether this discourse speaks of the Eucharist at all is itself debated.'), year=30, date='c. 30 (events)'),
   dict(B('1CO', 11, 23, 29, 'Paul repeats the words of institution and warns of eating “unworthily”.'), year=55, date='c. 55'),
   F(100, 'late 1st or early 2nd century', 'didache', '14', 'The Didache', 'that your sacrifice may be pure', 'debated',
     'Calls the Sunday breaking of bread a “sacrifice”; it does not say what the bread is.'),
   F(110, 'early 2nd century', 'ign-smyrn', '6', 'Ignatius of Antioch', 'because they allow not that the eucharist is the flesh of our Savior Jesus Christ, which flesh suffered for our sins', 'affirms',
     'Said against teachers who denied that Christ had real flesh.'),
   F(155, 'c. 150–155', 'justin-1apol', '66', 'Justin Martyr', 'so likewise have we been taught that the food which is blessed by the prayer of His word, and from which our blood and flesh by transmutation are nourished, is the flesh and blood of that Jesus who was made flesh', 'affirms', ''),
   D(1530, '1530', 'augsburg', 'Augsburg Confession (Art. 10)', 'the [true] body and blood of Christ are truly present [under the form of bread and wine], and are [there] communicated to those that eat in the Lord\'s Supper', 'affirms', 'The bracketed words are additions printed in Schaff’s text.'),
   D(1563, '1563', 'heidelberg', 'Heidelberg Catechism (Q. 78)', 'so also in the Lord\'s Supper the sacred bread does not become the body of Christ itself', 'denies', ''),
   D(1571, '1563 / 1571', 'art39', 'Thirty-Nine Articles (Art. 28)', 'The body of Christe is geuen, taken, and eaten in the Supper only after an heauenly and spirituall maner', 'qualified', 'Rejects transubstantiation but affirms that Christ’s body is given and received, spiritually.'),
   D(1646, '1646', 'westminster', 'Westminster Confession (29.7)', 'yet as really, but spiritually, present to the faith of believers in that ordinance', 'qualified', 'Denies that Christ’s body and blood are “corporally or carnally in, with, or under the bread and wine”.'),
  ]},
 {'id': 'justification', 'title': 'Justification', 'statement': 'Sinners are justified before God by faith alone, apart from works.',
  'items': [
   dict(B('ROM', 3, 28, 28, '“Justified by faith without the deeds of the law” (KJV): cited for faith alone; others read “works of the law” more narrowly.'), year=57, date='c. 57'),
   dict(B('GAL', 2, 16, 16, 'Justification “by the faith of Jesus Christ”, not “by the works of the law” (KJV).'), year=50, date='c. 50'),
   dict(B('JAM', 2, 24, 24, '“By works a man is justified, and not by faith only” (KJV): the only place the words “faith only” occur in the KJV New Testament, read as contradicting or as complementing Paul.'), year=60, date='mid 1st century'),
   F(96, 'c. 96', '1clem', '32', 'Clement of Rome', 'are not justified through ourselves or through our own wisdom or understanding or piety or works which we wrought in holiness of heart, but through faith', 'debated',
     'The next chapter (33) at once insists on good works; the two chapters are cited by both sides.'),
   D(1530, '1530', 'augsburg', 'Augsburg Confession (Art. 4)', 'but are justified freely [of grace] for Christ\'s sake through faith', 'affirms', ''),
   D(1547, '1547', 'trent6', 'Council of Trent, Decree on Justification (Canon 9)', 'If any one saith, that by faith alone the impious is justified', 'denies', 'Condemns the view that nothing else is required to cooperate in receiving justification.'),
   D(1563, '1563', 'heidelberg', 'Heidelberg Catechism (Q. 60)', 'Only by true faith in Jesus Christ', 'affirms', ''),
   D(1571, '1563 / 1571', 'art39', 'Thirty-Nine Articles (Art. 11)', 'that we are iustified by fayth onely, is a most wholesome doctrine', 'affirms', ''),
   D(1646, '1646', 'westminster', 'Westminster Confession (11.2)', 'is the alone instrument of justification; yet is it not alone in the person justified', 'affirms', 'Faith alone justifies, but saving faith is never alone: it “worketh by love”.'),
  ]},
]

CAT = {w['id']: w for w in json.loads(open(os.path.join(ROOT, 'site', 'bible', 'texts', 'index.js'), encoding='utf-8').read()[len('__FTI('):-3])}
bad = 0
for d in DOCTRINES:
    for it in d['items']:
        if it['type'] == 'father':
            t = work_text(it['work'], it['n'])
            it['cite'] = CAT[it['work']]['cite'] + (' greeting' if it['n'] == '0' else ' ' + it['n'])
        elif it['type'] == 'doc':
            t = doc_text(it['doc']); it['title'] = DOCS[it['doc']]['title']
        else:
            continue
        if it['q'] not in t:
            bad += 1; print('NOT FOUND in %s: %s' % (it.get('work') or it.get('doc'), it['q'][:80]))
    d['items'].sort(key=lambda x: x['year'])
if bad: sys.exit('doctrines: %d quotation(s) not found word for word; nothing written' % bad)
open(os.path.join(ROOT, 'site', 'bible', 'doctrines.js'), 'w', encoding='utf-8').write('__DOCTR(' + json.dumps(DOCTRINES, ensure_ascii=False, separators=(',', ':')) + ');\n')
print('doctrines: %d doctrines, %d witnesses, every quotation found in its source' % (len(DOCTRINES), sum(len(d['items']) for d in DOCTRINES)))
