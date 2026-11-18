"""Edition 12 layer: the Bible reader (seven English editions across traditions) and verse of the day."""
import json, re, sys, subprocess
sys.path.insert(0, '/home/user/church/tools')
import bibx as BX
R = '/home/user/church/'
PATH = R + 'site/index.html'
h = open(PATH, encoding='utf-8').read()
if 'id="bible"' in h: raise SystemExit('extras5 already applied')
subprocess.run([sys.executable, '-I', R + 'tools/bible.py'], check=True)
subprocess.run([sys.executable, '-I', R + 'tools/orig.py'], check=True)
for t in ('fathers.py', 'bib2.py', 'tipnr.py', 'topics.py', 'wj.py', 'lect2.py'): subprocess.run([sys.executable, '-I', R + 'tools/' + t], check=True)
man = open(R + 'site/bible/manifest.js', encoding='utf-8').read()
man = man[len('__BIBMAN('):-2]
votd = open(R + 'tools/verses.json', encoding='utf-8').read()
M = json.loads(man)
rows = ''.join('<tr><td><b>%s</b> %s</td><td>%s</td><td>%d</td></tr>' % (e['short'], e['name'], e['trad'], len(e['books'])) for e in M['eds'])
art = ('<article id="bible" data-title="The Bible" data-vol="ref" data-kind="ref" data-topics="scripture"><p class="eyebrow">Library · Scripture</p><h2>The Bible</h2>'
       '<p class="lede">The whole Bible in nine public-domain editions: seven in English, one for each way the churches draw the boundary of the Old Testament (the 66 books of Protestant Bibles, the 73 of the Catholic Church, and the wider Septuagint canon of the Orthodox), with the Septuagint and New Testament in Greek and the Latin Vulgate. Pick an edition, a book and a chapter, or type a reference. Compare any two editions verse by verse. Tap any verse to see it in every edition, in the original Hebrew or Greek with a lexicon for each word, and the passages it connects to across the Bible.</p>'
       '<div class="bib-bar" id="bibBar"></div>' + BX.tools + '<div id="bibView" aria-live="polite"></div>' + BX.trad_list.replace('%', '%%') +
       '<details class="bib-about"><summary>Why the Bibles of the churches differ</summary>'
       '<p>All Christians share the 27 books of the New Testament. The difference lies in the Old Testament. Early Christians mostly read it in Greek, in the Septuagint, which included books and passages not found in the later Hebrew canon: Tobit, Judith, Wisdom, Sirach, Baruch, 1–2 Maccabees and additions to Esther and Daniel. Jerome, translating the Vulgate around 400, preferred the Hebrew and called the extra books “apocrypha”, but translated several of them; councils at Hippo (393) and Carthage (397) listed them as canonical.</p>'
       '<p>At the Reformation, Luther placed these books in a separate section, “useful and good to read” but not equal to Scripture, and later Protestant Bibles dropped them altogether. The Council of Trent (1546) affirmed them as fully canonical: Catholics call them deuterocanonical. The Orthodox churches, following the Septuagint, read a slightly wider set (including 1 Esdras, 3 Maccabees, the Prayer of Manasseh and Psalm 151), confirmed at the Synod of Jerusalem (1672), while giving them a secondary place as anagignoskomena, books “to be read”.</p>'
       '<div class="tablewrap"><table class="data"><thead><tr><th>Edition</th><th>Tradition</th><th>Books</th></tr></thead><tbody>%s</tbody></table></div>'
       '<p class="cmp-note">Texts: King James Version and World English Bible from eBible.org; Douay–Rheims (Challoner revision, 1899 printing); Sir Lancelot Brenton’s translation of the Septuagint (1851) and his Greek text; the Clementine Vulgate (1592). All are in the public domain. The Greek New Testament is the NA28 text as tagged by STEPBible (CC BY 4.0). The Fathers’ comments come from public-domain translations via the HistoricalChristianFaith Commentaries Database; the daily lectionary is that of the Book of Common Prayer (1979). The Revised Standard Version Catholic Edition (RSV-CE) and the New American Bible Revised Edition (NABRE), the translations most used by English-speaking Catholics today, are under copyright and cannot be included; every chapter links to them on BibleGateway and the USCCB’s own site. Original-language word data and lexicons: STEPBible.org (Tyndale House, Cambridge), CC BY 4.0. Cross-references: OpenBible.info, CC BY. Psalm numbers in the Douay–Rheims and Septuagint follow the Greek; the reader converts them when you compare with a Hebrew-numbered edition.</p></details></article>') % rows
k = h.index('<article id="ref-atlas"')
h = h[:k] + art + BX.maps_art + BX.canon_art + BX.arcs_art + h[k:]
h = h.replace('<li><a href="#ref-texts" class="newtag">', '<li><a href="#bible" class="newtag">The Bible: nine editions</a></li><li><a href="#bible-maps" class="newtag">Bible maps</a></li><li><a href="#bible-canon" class="newtag">How the canon formed</a></li><li><a href="#bible-arcs" class="newtag">The Bible’s web of connections</a></li><li><a href="#ref-texts" class="newtag">', 1)
i = h.index('window.__DATA__=') + 16; j = h.index('</script>', i)
raw = h[i:j].rstrip(); semi = raw.endswith(';'); D = json.loads(raw.rstrip(';'))
for aid in ('bible', 'bible-maps', 'bible-canon', 'bible-arcs'):
    if aid not in D['order']: D['order'].insert(D['order'].index('ref-texts'), aid)
D['search'].append({'id': 'bible', 'title': 'The Bible', 'k': 'Library', 't': 'bible scripture kjv king james douay rheims septuagint brenton world english catholic orthodox protestant apocrypha deuterocanonical',
                    'b': ' '.join(b[2] for e in M['eds'] for b in e['books'])})
D['search'] += [{'id': 'bible-maps', 'title': 'Bible maps', 'k': 'Library', 't': 'maps abraham exodus tribes jesus paul journeys rome', 'b': ''},
                {'id': 'bible-canon', 'title': 'How the canon formed', 'k': 'Library', 't': 'canon muratorian athanasius carthage trent apocrypha deuterocanonical', 'b': ''},
                {'id': 'bible-arcs', 'title': 'The Bible’s web of connections', 'k': 'Library', 't': 'cross references arcs connections', 'b': ''}]
h = h[:i] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + (';' if semi else '') + h[j:]
css = open(R + 'tools/v13.css', encoding='utf-8').read() + open(R + 'tools/v14.css', encoding='utf-8').read(); js = open(R + 'tools/v13.js', encoding='utf-8').read().replace('/* @@V14@@ */', open(R + 'tools/v14.js', encoding='utf-8').read() + open(R + 'tools/v16b.js', encoding='utf-8').read())
h = h.replace('</style>\n</head>', css + '</style>\n</head>', 1)
k = h.rindex('</body>')
h = h[:k] + '<script>window.__BIBMAN__=' + man + ';window.__VOTD__=' + votd + ';window.__BIBX__=' + BX.bibx_json() + ';window.__BIBX2__=' + BX.bibx2_json() + ';</script><script>' + js + '</script>\n' + h[k:]
h = h.replace('Edition 11 · The Series', 'Edition 13 · The Series')
open(PATH, 'w', encoding='utf-8').write(h)
print('bible layer ok; html MB', round(len(h.encode()) / 1e6, 2))
