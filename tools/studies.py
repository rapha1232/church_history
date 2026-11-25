"""Ready-made studies (site/bible/studies.js), offered in Studies under "Ready-made studies".

    python3 tools/studies.py      (after tools/doctrines.py)

Five balanced studies built only from texts in this app. As in tools/doctrines.py, every quotation of a Father or a
document must appear word for word in its source, or nothing is written. Bible items carry no quotation (the app
shows the verses in the reader's default edition). Items are placed on the side whose proponents chiefly cite them;
where the other side reads the same text differently, the note says so. Each study's overview states the question
and says how the items were chosen.
"""
import importlib.util, json, os, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
spec = importlib.util.spec_from_file_location('doctrines', os.path.join(ROOT, 'tools', 'doctrines.py'))
argv, sys.argv = sys.argv, [sys.argv[0]]
dmod = importlib.util.module_from_spec(spec); spec.loader.exec_module(dmod)  # also re-verifies the timeline
sys.argv = argv
CAT = dmod.CAT
BAD = []

def credit(w): return 'trans. %s; %s' % (CAT[w]['tr'], CAT[w]['ed'])
def V(b, c, v1, v2=None, note=''): return {'type': 'verse', 'b': b, 'c': c, 'v': v1, 'v2': v2 or v1, 'note': note}
def F(w, n, author, date, q, note=''):
    if q not in dmod.work_text(w, n): BAD.append('%s %s: %s' % (w, n, q[:70]))
    cite = CAT[w]['cite'] + (' greeting' if n == '0' else ' ' + n)
    return {'type': 'father', 'author': author, 'work': cite, 'date': date, 'quote': q, 'ft': w + '~' + n, 'src': credit(w), 'note': note}
def D(doc, q, note=''):
    if q not in dmod.doc_text(doc): BAD.append('%s: %s' % (doc, q[:70]))
    return {'type': 'doc', 'doc': doc, 'quote': q, 'note': note}
def N(title, text): return {'type': 'note', 'title': title, 'text': text, 'note': ''}
KJV = {}
import re
for f in ('ot1.js', 'ot2.js', 'nt.js'):
    for m in re.finditer(r'__BIB\("kjv","(\w+)",(\[.*?\])\);', open(os.path.join(ROOT, 'site', 'bible', 'kjv', f), encoding='utf-8').read(), flags=re.S):
        KJV[m.group(1)] = {c: {x[0]: re.sub(r'<[^>]+>', '', str(x[1])) for x in vs} for c, vs in json.loads(m.group(2))}
def kjv_check(it):
    # a phrase quoted from the KJV in a verse note must be in the KJV text of that passage
    for q in re.findall(r'“([^”]+)” \(KJV\)', it.get('note', '')):
        t = ' '.join(KJV.get(it['b'], {}).get(it['c'], {}).get(v, '') for v in range(it['v'], it['v2'] + 1))
        if re.sub(r'\W+', ' ', q.lower()).strip() not in re.sub(r'\W+', ' ', t.lower()):
            BAD.append('KJV %s %d:%d: %s' % (it['b'], it['c'], it['v'], q))
HOW = 'Built from texts in this app; every quotation is checked word for word against its source. Items sit on the side whose advocates chiefly cite them; notes give the other reading where there is one. Add your own evidence and conclusion.'

STUDIES = [
 {'id': 'papacy', 'title': 'The primacy of Rome', 'blurb': 'Did Christ give Peter, and the church of Rome after him, authority over the other churches?',
  'sides': [['Cited for Roman primacy', [
     V('MAT', 16, 17, 19, 'Read in Catholic tradition of Peter himself as the rock, with the keys. Others read the rock as Peter’s confession of faith or as Christ, and ask whether any role passes to successors.'),
     V('LUK', 22, 31, 32, 'Christ prays for Peter alone and charges him to strengthen his brothers.'),
     V('JOH', 21, 15, 17, '“Feed my sheep”; others read it as restoring Peter after his three denials.'),
     F('1clem', '59', 'The church of Rome', 'c. 96', 'But if certain persons should be disobedient unto the words spoken by Him through us, let them understand that they will entangle themselves in no slight transgression and danger', 'Rome intervenes at Corinth. Others read this as brotherly counsel; the letter names no bishop of Rome.'),
     F('ign-rom', '0', 'Ignatius of Antioch', 'early 2nd century', 'even unto her that hath the presidency in the country of the region of the Romans', 'Others note that the same greeting speaks of “the presidency of love”.'),
     F('iren-ah3', '3', 'Irenaeus of Lyons', 'c. 180', 'For it is a matter of necessity that every Church should agree with this Church, on account of its pre-eminent authority', 'The Greek is lost; the Latin behind “agree with” and “pre-eminent authority” is read in different ways (see the translators’ note).'),
     D('unam', 'we declare, say, define and pronounce it to be altogether necessary for salvation for every human creature that he be subject to the Roman pontiff'),
     D('pastor', 'by virtue of his supreme Apostolic authority, he defines a doctrine regarding faith or morals to be held by the universal Church')]],
   ['Cited against Roman primacy', [
     V('GAL', 2, 11, 14, 'Paul opposes Peter to his face at Antioch. Others answer that this corrects Peter’s conduct, not his teaching.'),
     V('1PE', 5, 1, 1, 'Peter calls himself a “fellow elder”.'),
     V('ACT', 15, 13, 21, 'At the Jerusalem council James gives the decisive judgement. Others stress Peter’s speech earlier in the chapter (15:7–11).'),
     F('cyp-unity', '4', 'Cyprian of Carthage', '251', 'Assuredly the rest of the apostles were also the same as was Peter, endowed with a like partnership both of honour and power; but the beginning proceeds from unity.', 'The Received Text. The other version of this chapter, the Primacy Text, speaks of the primacy given to Peter and his chair; see the authenticity note in the reader. Both sides cite this chapter.'),
     D('art39', 'The bishop of Rome hath no iurisdiction in this Realme of Englande.'),
     D('westminster', 'There is no other head of the Church but the Lord Jesus Christ: nor can the Pope of Rome, in any sense be head thereof')]]]},
 {'id': 'eucharist', 'title': 'The Eucharist', 'blurb': 'Are the bread and wine of the Lord’s Supper Christ’s body and blood, and in what sense?',
  'sides': [['Cited for a real change or presence', [
     V('MAT', 26, 26, 28, '“This is my body … this is my blood.” Others read the words figuratively or of a spiritual presence.'),
     V('JOH', 6, 53, 56, 'Whether this discourse speaks of the Eucharist at all is itself debated.'),
     V('1CO', 11, 23, 29, 'Eating “unworthily” makes one guilty of the body and blood of the Lord.'),
     F('didache', '14', 'The Didache', 'late 1st or early 2nd century', 'that your sacrifice may be pure', 'Calls the Sunday breaking of bread a sacrifice; it does not say what the bread is.'),
     F('ign-smyrn', '6', 'Ignatius of Antioch', 'early 2nd century', 'because they allow not that the eucharist is the flesh of our Savior Jesus Christ, which flesh suffered for our sins', 'Said against teachers who denied that Christ had real flesh.'),
     F('justin-1apol', '66', 'Justin Martyr', 'c. 150–155', 'so likewise have we been taught that the food which is blessed by the prayer of His word, and from which our blood and flesh by transmutation are nourished, is the flesh and blood of that Jesus who was made flesh'),
     D('augsburg', 'the [true] body and blood of Christ are truly present [under the form of bread and wine], and are [there] communicated to those that eat in the Lord\'s Supper', 'Lutheran; it affirms presence without defining a change of substance.')]],
   ['Cited for a spiritual or symbolic reading', [
     V('JOH', 6, 63, 63, '“It is the spirit that quickeneth; the flesh profiteth nothing” (KJV). Others read “the flesh” as human understanding, not Christ’s flesh.'),
     D('heidelberg', 'so also in the Lord\'s Supper the sacred bread does not become the body of Christ itself'),
     D('art39', 'The body of Christe is geuen, taken, and eaten in the Supper only after an heauenly and spirituall maner', 'Affirms that Christ’s body is truly given and received, but spiritually.'),
     D('westminster', 'yet as really, but spiritually, present to the faith of believers in that ordinance', 'Affirms a real but spiritual presence.')]]]},
 {'id': 'justification', 'title': 'Justification by faith', 'blurb': 'Are sinners justified before God by faith alone, apart from works?',
  'sides': [['Cited for faith alone', [
     V('ROM', 3, 28, 28, 'Others read “the deeds of the law” as the works of the Mosaic law, not all good works.'),
     V('GAL', 2, 16, 16),
     V('EPH', 2, 8, 9, '“For by grace are ye saved through faith” (KJV) and “Not of works” (KJV); verse 10 goes on to good works.'),
     F('1clem', '32', 'Clement of Rome', 'c. 96', 'are not justified through ourselves or through our own wisdom or understanding or piety or works which we wrought in holiness of heart, but through faith', 'The next chapter at once insists on good works (see the other side).'),
     D('augsburg', 'but are justified freely [of grace] for Christ\'s sake through faith'),
     D('heidelberg', 'Only by true faith in Jesus Christ'),
     D('art39', 'that we are iustified by fayth onely, is a most wholesome doctrine'),
     D('westminster', 'is the alone instrument of justification; yet is it not alone in the person justified', 'Saving faith is never alone: it “worketh by love”.')]],
   ['Cited against faith alone', [
     V('JAM', 2, 24, 24, '“Not by faith only” (KJV). Others read James as speaking of a faith that shows itself in works, not of how one is first justified.'),
     V('GAL', 5, 6, 6, '“Faith which worketh by love” (KJV), cited by both sides.'),
     F('1clem', '33', 'Clement of Rome', 'c. 96', 'let us hasten with instancy and zeal to accomplish every good work'),
     D('trent6', 'If any one saith, that by faith alone the impious is justified', 'Canon 9 condemns the view that nothing else is required to cooperate in receiving justification.')]]]},
 {'id': 'scripture', 'title': 'Scripture and tradition', 'blurb': 'Is Scripture the only infallible rule of faith, or does the Church’s tradition carry authority alongside it?',
  'sides': [['Cited for Scripture alone as the rule', [
     V('2TI', 3, 15, 17, 'Scripture makes the man of God “perfect, throughly furnished” (KJV). Others answer that this speaks of the Old Testament and does not say “alone”.'),
     V('ACT', 17, 11, 11, 'The Bereans test Paul’s preaching by the Scriptures.'),
     F('iren-ah3', '1', 'Irenaeus of Lyons', 'c. 180', 'handed down to us in the Scriptures, to be the ground and pillar of our faith'),
     D('art39', 'Holy Scripture conteyneth all thinges necessarie to saluation'),
     D('belgic', 'We believe that these Holy Scriptures fully contain the will of God'),
     D('westminster', 'is either expressly set down in Scripture, or by good and necessary consequence may be deduced from Scripture')]],
   ['Cited for tradition alongside Scripture', [
     V('2TH', 2, 15, 15, '“Hold the traditions which ye have been taught, whether by word, or our epistle” (KJV).'),
     V('1TI', 3, 15, 15, 'The Church as “the pillar and ground of the truth”.'),
     F('iren-ah3', '4', 'Irenaeus of Lyons', 'c. 180', 'Suppose there arise a dispute relative to some important question among us, should we not have recourse to the most ancient Churches with which the apostles held constant intercourse', 'Irenaeus appeals to the apostolic churches as well as to Scripture; both sides cite Book III.'),
     F('iren-ah3', '3', 'Irenaeus of Lyons', 'c. 180', 'to contemplate clearly the tradition of the apostles manifested throughout the whole world')]]]},
 {'id': 'canon', 'title': 'The deuterocanonical books', 'blurb': 'Are Tobit, Wisdom, Sirach, Maccabees and the other deuterocanonical books part of Scripture?',
  'sides': [['Cited for including them', [
     V('HEB', 1, 3, 3, '“Radiance” (ἀπαύγασμα) occurs only here and in Wisdom 7:26 in the whole Greek Bible. Others answer that an echo shows knowledge of a book, not that it was held to be Scripture.'),
     V('WIS', 7, 25, 26),
     V('HEB', 11, 35, 35, 'Alludes to the martyrs of 2 Maccabees 6–7.'),
     V('2MA', 7, 9, 14),
     V('JOH', 10, 22, 23, 'Jesus at the Feast of Dedication, whose origin 1 Maccabees 4 records.'),
     N('See also: The deuterocanon in the New Testament', 'All ten parallels with the evidence from the Greek: Library → Bible companions → The deuterocanon in the New Testament.')]],
   ['Cited for excluding them', [
     D('westminster', 'The books commonly called Apocrypha, not being of divine inspiration, are no part of the Canon of the Scripture'),
     D('art39', 'the Churche doth reade for example of lyfe and instruction of manners: but yet doth it not applie them to establishe any doctrene', 'The Church of England reads them, but not to establish doctrine; it cites Jerome for this.'),
     N('See also: the canon', 'Which churches count which books: Library → Bible companions → the canon page.')]]]},
]

for s_ in STUDIES:
    for lab, items in s_['sides']:
        for it in items:
            if it['type'] == 'verse': kjv_check(it)
if BAD:
    for b in BAD: print('NOT FOUND', b)
    sys.exit('studies: %d quotation(s) not found word for word; nothing written' % len(BAD))
out = []
for s in STUDIES:
    sides = [{'label': lab, 'items': [dict(it, id='%s-%d-%d' % (s['id'], si, i)) for i, it in enumerate(items)]} for si, (lab, items) in enumerate(s['sides'])]
    out.append({'id': s['id'], 'title': s['title'], 'blurb': s['blurb'], 'study': {'title': s['title'], 'overview': s['blurb'] + '\n\n' + HOW, 'sides': sides}})
open(os.path.join(ROOT, 'site', 'bible', 'studies.js'), 'w', encoding='utf-8').write('__STUDIES(' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ');\n')
print('studies: %d studies, %d items, every quotation found in its source' % (len(out), sum(len(sd['items']) for s in out for sd in s['study']['sides'])))
