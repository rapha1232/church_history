"""Build the early Christian texts library (site/bible/texts/) from public-domain CCEL editions.

    python3 tools/fathers_texts.py <folder with the CCEL ThML files>

Download these first (CCEL marks each of them "Public Domain"):
    https://www.ccel.org/ccel/lightfoot/fathers.xml   -> lightfoot.xml
        J. B. Lightfoot, The Apostolic Fathers, ed. and completed by J. R. Harmer (London: Macmillan, 1891).
        Checked against the Internet Archive scan of the 1891 edition (apostolicfathers00lighuoft):
        6-word phrases sampled from every work were found in the scan's OCR text.
    https://www.ccel.org/ccel/schaff/anf01.xml        -> anf01.xml   (Ante-Nicene Fathers vol. 1, 1885)
    https://www.ccel.org/ccel/schaff/anf05.xml        -> anf05.xml   (Ante-Nicene Fathers vol. 5)

Writes site/bible/texts/<id>.js (one per work, loaded on demand) and site/bible/texts/index.js (the catalogue).
Each work file calls __FT({id, ch: [{n, t, p: [html…], fn: [html…]}]}); paragraphs are escaped HTML in which
scripture references are <a data-sref="BOOK~ch~v"> links and footnote markers are <sup data-fn="i">.
"""
import html, json, os, re, sys
from bs4 import BeautifulSoup, NavigableString, Tag

SRC = sys.argv[1] if len(sys.argv) > 1 else '.'
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'site', 'bible', 'texts')

LIGHTFOOT = {'ed': 'J. B. Lightfoot, The Apostolic Fathers, edited and completed by J. R. Harmer (London: Macmillan, 1891)',
             'tr': 'J. B. Lightfoot', 'src': 'https://www.ccel.org/ccel/lightfoot/fathers',
             'brackets': 'Words in square brackets are Lightfoot’s: words supplied to complete the sense, or doubtful readings.'}
ANF1 = {'ed': 'Ante-Nicene Fathers, vol. 1, ed. Alexander Roberts and James Donaldson, American edition with notes by A. Cleveland Coxe (1885)',
        'src': 'https://www.ccel.org/ccel/schaff/anf01',
        'brackets': 'Square brackets mark words supplied by the translators and remarks by the American editor, A. Cleveland Coxe (1885); they are not part of the ancient text. Notes are the translators’ and editors’.'}
ANF5 = {'ed': 'Ante-Nicene Fathers, vol. 5, ed. Alexander Roberts and James Donaldson, American edition with notes by A. Cleveland Coxe',
        'src': 'https://www.ccel.org/ccel/schaff/anf05',
        'brackets': 'Square brackets are remarks by the American editor, A. Cleveland Coxe, not Cyprian’s words. Chapter 4 follows the so-called Received Text; the lines of the other version, the Primacy Text, are given only in the notes, marked “[Here is interpolated]”, and the editors call them spurious. That was their judgement in the 1880s; see the authenticity note.'}

# id, author, title, short citation, usual dating, file, selector, source info, extra
WORKS = [
 ('1clem', 'Clement of Rome', 'First Epistle to the Corinthians (1 Clement)', '1 Clem.', 'c. 96 (usual dating)', 'lightfoot', 'First Clement', LIGHTFOOT, {}),
 ('ign-eph', 'Ignatius of Antioch', 'Letter to the Ephesians', 'Ign. Eph.', 'early 2nd century (usual dating c. 107–115)', 'lightfoot', 'The Epistle of Ignatius to the Ephesians', LIGHTFOOT, {}),
 ('ign-magn', 'Ignatius of Antioch', 'Letter to the Magnesians', 'Ign. Magn.', 'early 2nd century (usual dating c. 107–115)', 'lightfoot', 'The Epistle of Ignatius to the Magnesians', LIGHTFOOT, {}),
 ('ign-trall', 'Ignatius of Antioch', 'Letter to the Trallians', 'Ign. Trall.', 'early 2nd century (usual dating c. 107–115)', 'lightfoot', 'The Epistle of Ignatius to the Trallians', LIGHTFOOT, {}),
 ('ign-rom', 'Ignatius of Antioch', 'Letter to the Romans', 'Ign. Rom.', 'early 2nd century (usual dating c. 107–115)', 'lightfoot', 'The Epistle of Ignatius to the Romans', LIGHTFOOT, {}),
 ('ign-phld', 'Ignatius of Antioch', 'Letter to the Philadelphians', 'Ign. Phld.', 'early 2nd century (usual dating c. 107–115)', 'lightfoot', 'The Epistle of Ignatius to the Philadelphians', LIGHTFOOT, {}),
 ('ign-smyrn', 'Ignatius of Antioch', 'Letter to the Smyrnaeans', 'Ign. Smyrn.', 'early 2nd century (usual dating c. 107–115)', 'lightfoot', 'The Epistle of Ignatius to the Smyrnaeans', LIGHTFOOT, {}),
 ('ign-pol', 'Ignatius of Antioch', 'Letter to Polycarp', 'Ign. Pol.', 'early 2nd century (usual dating c. 107–115)', 'lightfoot', 'The Epistle fo Ignatius to Polycarp', LIGHTFOOT, {}),
 ('pol-phil', 'Polycarp of Smyrna', 'Letter to the Philippians', 'Pol. Phil.', 'first half of the 2nd century', 'lightfoot', 'The Epistle of Polycarp', LIGHTFOOT, {}),
 ('mart-pol', 'The church of Smyrna', 'The Martyrdom of Polycarp', 'Mart. Pol.', 'soon after Polycarp’s death (c. 155–160)', 'lightfoot', 'The Martyrdom of Polycarp', LIGHTFOOT, {}),
 ('didache', 'Anonymous', 'The Didache (Teaching of the Twelve Apostles)', 'Did.', 'late 1st or early 2nd century (debated)', 'lightfoot', 'Didache', LIGHTFOOT, {}),
 ('justin-1apol', 'Justin Martyr', 'First Apology', 'Justin, 1 Apol.', 'c. 150–155', 'anf01', 'viii.ii', dict(ANF1, tr='Marcus Dods and George Reith'), {'appendix_from': 68}),
 ('iren-ah3', 'Irenaeus of Lyons', 'Against Heresies, Book III', 'Iren. Haer.', 'c. 180', 'anf01', 'ix.iv', dict(ANF1, tr='W. H. Rambaut (groundwork) and Alexander Roberts'), {'book': 3}),
 ('cyp-unity', 'Cyprian of Carthage', 'On the Unity of the Church', 'Cyprian, Unit.', '251', 'anf05', 'iv.v.i', dict(ANF5, tr='Ernest Wallis'), {'sections': True}),
]

OSIS = {'Gen':'GEN','Exod':'EXO','Lev':'LEV','Num':'NUM','Deut':'DEU','Josh':'JOS','Judg':'JDG','Ruth':'RUT','1Sam':'1SA','2Sam':'2SA',
 '1Kgs':'1KI','2Kgs':'2KI','1Chr':'1CH','2Chr':'2CH','Ezra':'EZR','Neh':'NEH','Esth':'EST','Job':'JOB','Ps':'PSA','Prov':'PRO','Eccl':'ECC',
 'Song':'SOL','Isa':'ISA','Jer':'JER','Lam':'LAM','Ezek':'EZE','Dan':'DAN','Hos':'HOS','Joel':'JOE','Amos':'AMO','Obad':'OBA','Jonah':'JON',
 'Mic':'MIC','Nah':'NAH','Hab':'HAB','Zeph':'ZEP','Hag':'HAG','Zech':'ZEC','Mal':'MAL','Matt':'MAT','Mark':'MAR','Luke':'LUK','John':'JOH',
 'Acts':'ACT','Rom':'ROM','1Cor':'1CO','2Cor':'2CO','Gal':'GAL','Eph':'EPH','Phil':'PHI','Col':'COL','1Thess':'1TH','2Thess':'2TH',
 '1Tim':'1TI','2Tim':'2TI','Titus':'TIT','Phlm':'PHM','Heb':'HEB','Jas':'JAM','1Pet':'1PE','2Pet':'2PE','1John':'1JO','2John':'2JO',
 '3John':'3JO','Jude':'JUD','Rev':'REV','Tob':'TOB','Jdt':'JDT','Wis':'WIS','Sir':'SIR','Bar':'BAR','1Macc':'1MA','2Macc':'2MA',
 'Sus':'SUS','Bel':'BEL','EpJer':'EPJ','PrAzar':'PRA','1Esd':'1ES','2Esd':'4ES','PrMan':'PRM'}

def sref(tag):
    m = re.match(r'Bible:([1-3]?[A-Za-z]+)\.(\d+)(?:\.(\d+))?', tag.get('osisref') or tag.get('osisRef') or '')
    if not m or m.group(1) not in OSIS: return None
    return '%s~%s~%s' % (OSIS[m.group(1)], m.group(2), m.group(3) or 1)

def render(el, notes):
    """Escaped HTML for a paragraph: text, scripture links, footnote markers. Notes are collected into `notes`."""
    out = []
    for c in el.children:
        if isinstance(c, NavigableString):
            out.append(html.escape(str(c), quote=False)); continue
        if not isinstance(c, Tag): continue
        if c.name in ('index', 'pb', 'br', 'script', 'style'): continue
        if c.name == 'note':
            inner = ' '.join(render(p, []) for p in c.find_all('p')) or render(c, [])
            inner = re.sub(r'\s+', ' ', inner).strip()
            if inner:
                notes.append(inner); out.append('<sup data-fn="%d">%d</sup>' % (len(notes), len(notes)))
            continue
        if c.name in ('scripref', 'scripRef'):
            r = sref(c); t = render(c, notes)
            out.append('<a data-sref="%s">%s</a>' % (r, t) if r else t); continue
        if c.name in ('i', 'em'): out.append('<i>%s</i>' % render(c, notes)); continue
        if c.name == 'span' and 'sc' in (c.get('class') or []): out.append(render(c, notes)); continue
        lang = c.get('lang')
        inner = render(c, notes)
        out.append('<span lang="%s">%s</span>' % (html.escape(lang), inner) if lang in ('el', 'la', 'he', 'grc', 'syr') else inner)
    return ''.join(out)

def clean(h):
    h = re.sub(r'\s+', ' ', h).strip()
    h = re.sub(r'\s+([,.;:])', r'\1', h)
    return h

def lightfoot_work(x, title, prefix_re):
    a = x.find('title="%s"' % title); b = x.find('<div2', a + 10)
    soup = BeautifulSoup(x[x.rfind('<div2', 0, a):b if b > 0 else len(x)], 'html.parser')
    chs, cur = [], None
    for el in soup.div2.find_all(['h2', 'p'], recursive=True):
        if el.name == 'h2':
            m = re.match(r'^\s*(?:\d\s+)?[A-Za-z]+\.\s*(Prologue|\d+)\s*$', el.get_text(' '))
            if m:
                cur = {'n': '0' if m.group(1) == 'Prologue' else m.group(1), 't': 'Greeting' if m.group(1) == 'Prologue' else '', 'p': [], 'fn': []}
                chs.append(cur)
            continue
        if cur is None: continue
        t = clean(render(el, cur['fn']))
        if t: cur['p'].append(t)
    return chs

def anf_chapters(x, divid, extra):
    a = x.find('id="%s"' % divid); a = x.rfind('<div', 0, a)
    lvl = x[a + 4]
    b = x.find('<div%s ' % lvl, a + 10)
    soup = BeautifulSoup(x[a:b if b > 0 else len(x)], 'html.parser')
    top = soup.find(lambda t: t.name and t.name.startswith('div'))
    chs = []
    if extra.get('sections'):
        cur = None
        for el in top.find_all('p'):
            if el.find_parent('note'): continue
            fn = cur['fn'] if cur else []
            t = clean(render(el, fn))
            m = re.match(r'^(\d+)\.\s', re.sub(r'<[^>]+>', '', t))
            if m:
                cur = {'n': m.group(1), 't': '', 'p': [], 'fn': []}; chs.append(cur)
                t = clean(render(el, cur['fn']))
                t = re.sub(r'^(\s*(?:<[^>]+>)*)\d+\.\s*', r'\1', t)
            if cur is None or not t: continue
            cur['p'].append(t)
        return chs
    sub = 'div%d' % (int(lvl) + 1)
    for i, d in enumerate(top.find_all(sub, recursive=False)):
        title = d.get('title', '')
        m = re.match(r'Chapter ([IVXLC]+)\.?\s*[—-]*\s*(.*)', title)
        n = str(roman(m.group(1))) if m else ('0' if title.lower().startswith('preface') else 'A%d' % i)
        t = m.group(2).strip() if m else title.strip()
        ch = {'n': n, 't': t, 'p': [], 'fn': []}
        for el in d.find_all('p'):
            if el.find_parent('note'): continue
            s = clean(render(el, ch['fn']))
            if not s: continue
            if extra.get('book'):  # mark ANF section numbers "1." as section anchors
                s = re.sub(r'^((?:<[^>]+>)*)(\d+)\.\s', lambda mm: mm.group(1) + '<b class="ft-sec" data-sec="%s">%s.</b> ' % (mm.group(2), mm.group(2)), s)
            ch['p'].append(s)
        if extra.get('appendix_from') and m and roman(m.group(1)) > extra['appendix_from']: ch['app'] = 1
        if not m and n.startswith('A'): ch['app'] = 1; ch['n'] = 'App. %d' % (len([c for c in chs if c.get('app')]) + 1)
        chs.append(ch)
    return chs

def roman(s):
    v = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100}; t = 0
    for i, c in enumerate(s):
        t += -v[c] if i + 1 < len(s) and v[s[i + 1]] > v[c] else v[c]
    return t

def main():
    files = {k: open(os.path.join(SRC, k + '.xml'), encoding='utf-8').read() for k in ('lightfoot', 'anf01', 'anf05')}
    os.makedirs(OUT, exist_ok=True)
    cat = []
    for wid, author, title, cite, date, f, sel, src, extra in WORKS:
        chs = lightfoot_work(files[f], sel, None) if f == 'lightfoot' else anf_chapters(files[f], sel, extra)
        assert chs and all(c['p'] for c in chs), (wid, [c['n'] for c in chs if not c['p']])
        data = {'id': wid, 'ch': chs}
        open(os.path.join(OUT, wid + '.js'), 'w', encoding='utf-8').write('__FT(' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ');\n')
        words = sum(len(re.sub(r'<[^>]+>', ' ', p).split()) for c in chs for p in c['p'])
        cat.append({'id': wid, 'author': author, 'title': title, 'cite': cite, 'date': date, 'ed': src['ed'], 'tr': src['tr'],
                    'src': src['src'], 'brackets': src['brackets'], 'chapters': [[c['n'], c['t'], 1 if c.get('app') else 0] for c in chs], 'words': words,
                    **({'book': extra['book']} if extra.get('book') else {})})
        print('%-14s %3d chapters %7d words' % (wid, len(chs), words))
    open(os.path.join(OUT, 'index.js'), 'w', encoding='utf-8').write('__FTI(' + json.dumps(cat, ensure_ascii=False, indent=0) + ');\n')

if __name__ == '__main__':
    main()
