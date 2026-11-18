import json, re, sys, html as H
sys.path.insert(0, '/home/user/church/tools')
from render_docs import render, esc
from deep4 import DEEP

ROOT = '/home/user/church/'
s = open(ROOT + 'orig.html', encoding='utf-8').read()
docs = json.load(open(ROOT + 'docs.json', encoding='utf-8'))
DOC = {d['id']: d for d in docs}

BOOK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M8 7h8M8 10.5h6"/></svg>'
def btn(did, label=None):
    d = DOC[did]
    return '<button type="button" class="txtbtn" data-doc="%s">%s<span>%s</span></button>' % (did, BOOK, esc(label or d['title']))

# ---------- 1. Head: title, fonts, viewport, design layer ----------
s = s.replace('<meta name="viewport" content="width=device-width, initial-scale=1">',
              '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="claude:viewport-fit-sides" content="cover">')
s = re.sub(r'<link href="https://fonts\.googleapis\.com/css2[^"]*" rel="stylesheet">',
           '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=IBM+Plex+Sans:wght@400;500;600;700&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400&display=swap" rel="stylesheet">', s)
css = open(ROOT + 'tools/design.css', encoding='utf-8').read()
s = s.replace('</style>\n</head>', css + '</style>\n</head>', 1)

# ---------- 2. Top bar brand ----------
s = s.replace('<a class="brand" href="#home">History of the Christian Church<small>Complete edition · Vols I–XV</small></a>',
              '<a class="brand" href="#home"><span class="mark" aria-hidden="true">☧</span><span class="bt">History of the Christian Church<small>Edition 5 · Vols I–XV · Full texts</small></span></a>')

# ---------- 3. In-depth sections ----------
count_deep = 0
for cid, (title, paras) in DEEP.items():
    m = re.search(r'<article id="%s"[^>]*>' % re.escape(cid), s)
    if not m:
        print('missing article', cid); continue
    end = s.index('</article>', m.end())
    seg = s[m.end():end]
    block = ('<section class="deeper" aria-label="In depth"><p class="dk">In depth</p><h3 id="%s-deep">%s</h3>%s'
             '<p class="dnote">Added in Edition 5 as a synthesis of standard scholarship; see the works cited in this chapter and the bibliography. It carries no evidence labels of its own.</p></section>') % (
        cid, esc(title), ''.join('<p>%s</p>' % esc(p) for p in paras))
    k = seg.find('<section class="notes"')
    if k < 0: k = seg.find('<aside class="quick"')
    if k < 0: k = len(seg)
    seg = seg[:k] + block + seg[k:]
    s = s[:m.end()] + seg + s[end:]
    count_deep += 1

# ---------- 4. Full-text strips under chapter titles ----------
ctxmap = {}
for d in docs:
    for c in d['ctx']:
        ctxmap.setdefault(c, []).append(d['id'])
for cid, ids in ctxmap.items():
    m = re.search(r'<article id="%s"[^>]*>' % re.escape(cid), s)
    if not m: print('ctx missing', cid); continue
    h = s.find('</h2>', m.end())
    strip = '<div class="docstrip"><span>Full text</span>%s</div>' % ''.join(btn(i) for i in ids)
    s = s[:h + 5] + strip + s[h + 5:]

# ---------- 5. Buttons after quoted extracts ----------
QMAP = [('iv-6', 'We believe in one God, the Father Almighty, maker of all things', 'nicaea325'),
        ('iv-9', 'And we believe in the Holy Ghost, the Lord and Giver-of-Life', 'nicene'),
        ('iv-11', 'If anyone will not confess that the Emmanuel', 'cyril12'),
        ('iv-12', 'Following the holy Fathers we teach with one voice', 'chalcedon'),
        ('vi-6', 'two natural wills and two natural operations', 'const3'),
        ('vi-7', 'the honour which is paid to the image passes', 'nicaea2'),
        ('iv-3', 'liberty to follow that mode of religion', 'milan'),
        ('x-6', 'Porro subesse Romano Pontifici', 'unam'),
        ('xi-2', 'Dominus et magister noster', 'theses95'),
        ('xi-5', 'We are accounted righteous before God', 'art39'),
        ('xi-6', 'Also they teach that men can not be justified', 'augsburg'),
        ('xi-6', 'If any one saith, that by faith alone', 'trent6')]
nq = 0
for cid, key, did in QMAP:
    m = re.search(r'<article id="%s"[^>]*>' % re.escape(cid), s)
    end = s.index('</article>', m.end())
    k = s.find(key, m.end(), end)
    if k < 0: print('quote key missing', cid, key); continue
    e = s.index('</blockquote>', k) + len('</blockquote>')
    s = s[:e] + '<div class="afterq">%s</div>' % btn(did, 'Read the full text: ' + DOC[did]['title']) + s[e:]
    nq += 1

# ---------- 6. Documents library table ----------
RMAP = [('Lactantius, On the Deaths of the Persecutors', ['milan']), ('Creed and canons of Nicaea', ['nicaea325']),
        ('Canons and creed of Constantinople I', ['nicene']), ('Acts and canons of Ephesus', ['cyril12']),
        ('Definition and canons of Chalcedon', ['chalcedon']), ('Acts of Constantinople II, III and Nicaea II (extracts)', ['const3', 'nicaea2']),
        ('Augsburg Confession', ['augsburg']), ('Council of Trent, Sixth Session', ['trent6']), ('Unam sanctam', ['unam']),
        ('Thirty-Nine Articles', ['art39']), ('Luther, Ninety-Five Theses', ['theses95'])]
i0 = s.index('<article id="ref-docs"'); i1 = s.index('</article>', i0)
seg = s[i0:i1]
for name, ids in RMAP:
    k = seg.find('<strong>%s</strong>' % name)
    if k < 0: print('docs row missing', name); continue
    r = seg.index('</tr>', k)
    a = seg.rfind('<a href="http', k, r)
    if a < 0: a = seg.rfind('</td>', k, r)
    seg = seg[:a] + ''.join(btn(i, 'Full text') for i in ids) + ' ' + seg[a:]
seg = seg.replace('<h2>Historical documents library</h2><p>',
                  '<h2>Historical documents library</h2><p><strong>New in Edition 5:</strong> the complete texts of %d creeds, conciliar definitions and confessions are now included and work offline. Open them from the <a href="#ref-texts">full-texts library</a> or with the “Full text” buttons below. ' % len(docs), 1)
s = s[:i0] + seg + s[i1:]

# ---------- 7. Texts library article ----------
FAMS = ['Ancient creeds', 'Councils', 'Catholic', 'Lutheran', 'Reformed', 'Anglican', 'Methodist', 'Ecumenical']
items = []
for d in docs:
    body, toc = render(d)
    d['_html'] = body
    items.append(
        '<details class="doctext" id="text-%s" data-doc-id="%s" data-fam="%s" data-title="%s" data-date="%s" data-words="%s" data-ctx="%s">'
        '<summary><span class="tt">%s</span><span class="mt">%s · %s words</span><span class="fam">%s</span></summary>'
        '<div class="docintro"><p>%s</p><p class="src">Source: %s</p></div>'
        '<div class="docacts">%s%s</div>'
        '<div class="docbody dtext">%s</div></details>' % (
            d['id'], d['id'], esc(d['fam']), esc(d['title']), esc(d['date']), format(d['words'], ','), ','.join(d['ctx']),
            esc(d['title']), esc(d['date']), format(d['words'], ','), esc(d['fam']),
            esc(d['intro']), esc(d['src']), btn(d['id'], 'Open in reader'),
            ''.join('<a class="txtbtn" href="#%s"><span>Context: %s</span></a>' % (c, '%s') for c in d['ctx'][:2]),
            body))
lib = ('<article id="ref-texts" data-title="Creeds and confessions: full texts" data-vol="ref" data-kind="ref" data-topics="reference" class="wide">'
       '<p class="eyebrow">Reference · F2</p><h2>Creeds and confessions: full texts</h2>'
       '<p class="lede">The complete texts of the creeds, conciliar definitions and confessions discussed in this edition, in public-domain English translations, with a short note on each. Tap a title to expand it, or open it in the reader for comfortable reading and a table of contents.</p>'
       '<p>Book-length works such as Calvin’s Institutes or the Book of Concord are not reproduced; follow the links in the <a href="#ref-docs">documents library</a>. Translations are mostly those in Philip Schaff’s <cite>Creeds of Christendom</cite> (1877, with later revisions) and the Nicene and Post-Nicene Fathers; their wording is old but faithful. Where a source prints text in brackets, the brackets are the translator’s.</p>'
       '<div class="libbar"><div class="filterbar" id="libchips" style="margin:0"><button class="chip" type="button" aria-pressed="true" data-v="all">All</button>%s</div>'
       '<input class="filter" id="libq" type="search" placeholder="Filter texts (e.g. justification, Filioque)" aria-label="Filter texts"></div>'
       '<div id="textlib">%s</div></article>') % (
    ''.join('<button class="chip" type="button" aria-pressed="false" data-v="%s">%s</button>' % (esc(f), esc(f)) for f in FAMS if any(d['fam'] == f for d in docs)),
    ''.join(items))
# fill context link titles
def ctx_title(cid):
    m = re.search(r'<article id="%s" data-title="([^"]*)"' % re.escape(cid), s)
    return m.group(1) if m else cid
lib = re.sub(r'<a class="txtbtn" href="#([^"]+)"><span>Context: %s</span></a>',
             lambda m: '<a class="txtbtn" href="#%s"><span>Context: %s</span></a>' % (m.group(1), ctx_title(m.group(1))), lib)
k = s.index('<article id="ref-atlas"')
s = s[:k] + lib + '\n' + s[k:]

# ---------- 8. Navigation entries ----------
s = s.replace('<li><a href="#ref-docs">Historical documents library</a></li>',
              '<li><a href="#ref-docs">Historical documents library</a></li><li><a href="#ref-texts" class="newtag">Creeds &amp; confessions: full texts</a></li>')
pane = '<div class="navgroup">Full texts</div><ul class="navlist">' + ''.join('<li><a href="#text-%s">%s</a></li>' % (d['id'], esc(d['title'])) for d in docs) + '</ul>'
s = s.replace('<div class="navpane" id="pane-topics" hidden>', '<div class="navpane" id="pane-topics" hidden>' + pane, 1)

# ---------- 9. Home page ----------
s = s.replace('<p class="eyebrow">A historical encyclopedia · Edition 4 (fact-checked, with footnotes and source links)</p>',
              '<p class="eyebrow">A historical encyclopedia · Edition 5</p>')
newed = ('<div class="newed">'
         '<a href="#ref-texts"><span class="num">New · Full texts</span><b>%d creeds and confessions</b><span>From the Old Roman Creed to Westminster, complete and readable offline.</span></a>'
         '<a href="#iv-10"><span class="num">New · In depth</span><b>%d deeper chapters</b><span>Extended explanations added to the shortest and most-asked-about chapters.</span></a>'
         '<a href="#iv-6"><span class="num">Start reading</span><b>Nicaea, 325</b><span>The council, its creed and the full text side by side.</span></a>'
         '</div>') % (len(docs), count_deep)
s = s.replace('<p class="cover-meta">c. 1200 BC – AD 2026 · Volumes I–XV · Parts III–IV · Updated November 2026</p>\n</div>',
              '<p class="cover-meta">c. 1200 BC – AD 2026 · Volumes I–XV · Parts III–IV · Updated November 2026</p>\n</div>' + newed, 1)
s = s.replace('<h2>What this edition is</h2>',
              '<h2>What this edition is</h2><p><strong>Edition 5</strong> adds a redesigned reading layout, “In depth” sections in %d chapters, and a library of %d complete creeds, conciliar definitions and confessions with a built-in reader. Each chapter that discusses one of these texts now links to it directly.</p>' % (count_deep, len(docs)), 1)

# ---------- 10. Data: order + search ----------
i = s.index('window.__DATA__=') + len('window.__DATA__=')
j = s.index('</script>', i)
raw = s[i:j].rstrip()
semi = raw.endswith(';')
D = json.loads(raw.rstrip(';'))
o = D['order']; o.insert(o.index('ref-docs') + 1, 'ref-texts')
def plain(h): return re.sub(r'\s+', ' ', H.unescape(re.sub('<[^>]+>', ' ', h))).strip()
for e in D['search']:
    if e['k'] == 'Chapter' and e['id'] in DEEP:
        t, ps = DEEP[e['id']]
        e['b'] += ' In depth: ' + t + ' ' + ' '.join(ps)
for d in docs:
    D['search'].append({'id': 'text-' + d['id'], 'title': d['title'], 'k': 'Full text', 't': d['title'] + ' ' + d['fam'],
                        'b': d['intro'] + ' ' + plain(d['_html'])})
D['search'].append({'id': 'ref-texts', 'title': 'Creeds and confessions: full texts', 'k': 'Reference', 't': 'Creeds and confessions full texts library',
                    'b': 'Complete texts: ' + ', '.join(d['title'] for d in docs)})
s = s[:i] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + (';' if semi else '') + s[j:]

# ---------- 11. Reader + tab bar markup and addon script ----------
reader = ('<div class="reader" id="reader" hidden role="dialog" aria-modal="true" aria-labelledby="rtitle"><div class="rscrim"></div><div class="rpanel">'
          '<div class="rhead"><div class="rt"><div class="rfam" id="rfam"></div><h2 id="rtitle"></h2><div class="rdate" id="rdate"></div></div>'
          '<div class="rtools"><button class="iconbtn" id="rtocBtn" type="button" aria-expanded="false" title="Contents">Contents</button>'
          '<button class="iconbtn" id="rsmall" type="button" aria-label="Smaller text" title="Smaller text">A−</button>'
          '<button class="iconbtn" id="rbig" type="button" aria-label="Larger text" title="Larger text">A+</button>'
          '<button class="iconbtn" id="rclose" type="button" aria-label="Close reader" title="Close (Esc)">✕</button></div></div>'
          '<nav class="rtoc" id="rtoc" hidden aria-label="Sections of this text"></nav><div class="rbody" id="rbody"></div></div></div>')
ICON = lambda p: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%s</svg>' % p
tabbar = ('<nav class="tabbar" aria-label="App navigation">'
          '<button type="button" data-tab="contents">%s<span>Contents</span></button>'
          '<button type="button" data-tab="search">%s<span>Search</span></button>'
          '<button type="button" data-tab="texts">%s<span>Texts</span></button>'
          '<button type="button" data-tab="saved">%s<span>Saved</span></button></nav>') % (
    ICON('<path d="M4 6h16M4 12h16M4 18h10"/>'), ICON('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
    ICON('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>'),
    ICON('<path d="M6 3h12v18l-6-4-6 4z"/>'))
addon = open(ROOT + 'tools/addon.js', encoding='utf-8').read()
k = s.rindex('</body>')
s = s[:k] + reader + tabbar + '<script>' + addon + '</script>\n' + s[k:]

open(ROOT + 'index.html', 'w', encoding='utf-8').write(s)
print('deep', count_deep, 'quotes', nq, 'size', len(s.encode()))
