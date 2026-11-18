import json, re, os, sys, hashlib, html as H
from PIL import Image, ImageOps
sys.path.insert(0, '/home/user/church/tools')
from imgmap import CH, DOCIMG, PEOPLE
R = '/home/user/church/'
OUT = R + 'site/'
os.makedirs(OUT + 'img', exist_ok=True)
Image.MAX_IMAGE_PIXELS = None
pages = json.load(open(R + 'img/pages.json'))
info = json.load(open(R + 'img/commons.json'))
museum = json.load(open(R + 'img/museum.json'))
mkeep = set(json.load(open(R + 'img/museum_keep.json')))
_eu = json.load(open(R + 'img/europeana.json'))
for _t in json.load(open(R + 'img/eu_keep.json')):
    if _t not in mkeep and _eu.get(_t):
        museum[_t] = _eu[_t]; mkeep.add(_t)
if os.path.exists(R + 'img/scour_keep.json'):
    _sc = json.load(open(R + 'img/scour.json'))
    for _t, (_i, _lab) in json.load(open(R + 'img/scour_keep.json')).items():
        if _t not in mkeep and _sc.get(_t) and len(_sc[_t]) > _i:
            _v = dict(_sc[_t][_i]); _v['label'] = _lab; museum[_t] = _v; mkeep.add(_t)
skip = set(json.load(open(R + 'img/reject.json'))) if os.path.exists(R + 'img/reject.json') else set()
def esc(s): return H.escape(s or '', quote=True)
OKLIC = re.compile(r'public domain|^pd|cc0|cc[ -]by|attribution|no restrictions|free art license', re.I)
html = open(R + 'index.html', encoding='utf-8').read()
people = [re.sub('<[^>]+>', '', p) for p in re.findall(r'<div class="person"[^>]*>\s*<h4[^>]*>(.*?)</h4>', html)]
PEOPLE_T = {PEOPLE.get(p, p) for p in people}
MAN = re.compile(r'codex|papyr|scroll|gospels|bible|psalter|book of|theses|catechism|confession|creed|articles|didache|inscription|stele|stela|cylinder|fragment|manuscript|folio|summa|institutes|rule of|prayer|declaration|decree|unam|edict|glagolitic|septuagint|graffito|ossuary|pilate stone', re.I)
PLACE = re.compile(r'cathedral|church|basilica|monastery|abbey|sophia|lavra|valley|mount |temple|forum|pantheon|wall|colosseum|catacomb|qumran|masada|galilee|capernaum|antioch|edessa|lyon|iznik|İznik|ravenna|constantinople|lalibela|meteora|athos|mosul|palais|university|krak|cappadocia|herrnhut|stoa|gate|arch of|dome|wittenberg|vitale|herod\'s|mosque|chora|notre|rila|irene|sepulchre|lateran|patriarchate|trento|pierre|kadisha|svetitskhoveli|etchmiadzin', re.I)
def cat(topic, f):
    if topic in PEOPLE_T: return 'people'
    if re.search(r'map|karte|carte', f, re.I): return 'maps'
    if MAN.search(topic) or MAN.search(f): return 'texts'
    if PLACE.search(topic) or PLACE.search(f): return 'places'
    return 'art'
IMG = {}
def short(s, n):
    s = re.sub(r'\s+', ' ', s or '').strip()
    s = re.sub(r'^(English|Deutsch|Français|Italiano|Español):\s*', '', s)
    if len(s) <= n: return s
    cut = s[:n]; k = max(cut.rfind('. '), cut.rfind('; '))
    return (cut[:k + 1] if k > n * 0.5 else cut.rsplit(' ', 1)[0] + '…')
def museum_for(topic):
    v = museum.get(topic)
    if topic not in mkeep or not v or not v.get('local'): return None
    iid = 'm' + hashlib.md5(topic.encode()).hexdigest()[:9]
    if iid in IMG: IMG[iid]['topics'].add(topic); return iid
    dst = OUT + 'img/' + iid + '.webp'
    try:
        im = Image.open(v['local']); im = ImageOps.exif_transpose(im).convert('RGB'); im.thumbnail((900, 1100), Image.LANCZOS)
        if not os.path.exists(dst): im.save(dst, 'WEBP', quality=64, method=6)
        avg = im.resize((1, 1), Image.BOX).getpixel((0, 0))
    except Exception as e:
        print('bad museum', topic, e); return None
    t = v.get('label') or (pages.get(topic) or {}).get('title') or topic
    desc = short(v['title'] + (', ' + v['date'] if v.get('date') else ''), 170)
    IMG[iid] = {'src': 'img/%s.webp' % iid, 't': t, 'd': desc, 'a': short(v.get('artist') or v['museum'], 90), 'l': v['lic'], 'f': '', 'u': v.get('url', ''), 'sn': v['museum'],
                'w': t, 'iw': im.size[0], 'ih': im.size[1], 'c': '#%02x%02x%02x' % avg, 'cat': cat(t, v['title']), 'alt': short(v['title'], 140), 'topics': {topic}}
    return iid
def image_for(topic):
    r = wiki_for(topic)
    return r or museum_for(topic)
def wiki_for(topic):
    rec = pages.get(topic)
    if not rec or not rec.get('file'): return None
    f = rec['file']
    if f in skip: return None
    d = info.get(f)
    if not d or not d.get('thumb'): return None
    lic = d.get('LicenseShortName', '')
    if not OKLIC.search(lic): return None
    iid = 'i' + hashlib.md5(f.encode()).hexdigest()[:9]
    if iid in IMG:
        IMG[iid]['topics'].add(topic); return iid
    raw = R + 'img/raw/' + re.sub(r'[^A-Za-z0-9._-]', '_', f) + '.bin'
    if not os.path.exists(raw): return None
    dst = OUT + 'img/' + iid + '.webp'
    try:
        im = Image.open(raw); im = ImageOps.exif_transpose(im)
        if im.mode in ('RGBA', 'LA', 'P'):
            im = im.convert('RGBA'); bg = Image.new('RGB', im.size, (250, 248, 242)); bg.paste(im, mask=im.split()[-1]); im = bg
        im = im.convert('RGB')
        im.thumbnail((900, 1100), Image.LANCZOS)
        if not os.path.exists(dst): im.save(dst, 'WEBP', quality=64, method=6)
        avg = im.resize((1, 1), Image.BOX).getpixel((0, 0))
    except Exception as e:
        print('bad image', f, e); return None
    art = re.sub(r'^[^:]{0,120}\.(jpe?g|png|tiff?|svg|gif)[^:]{0,40}:\s*', '', d.get('Artist', ''), flags=re.I)
    art = re.sub(r'The original uploader was (.*?) at English Wikipedia\.?', r'\1 (English Wikipedia)', art)
    art = short(re.sub(r'\s*\(talk\)|Unknown author', '', art), 90) or 'Unknown author'
    stem = re.sub(r'\.[a-z]+$', '', f, flags=re.I).replace('_', ' ').lower()
    def good(x):
        x = (x or '').strip()
        return len(x.split()) >= 3 and x.lower() != stem and not re.search(r'\d{6,}|^img|^dsc|\.jpe?g', x, re.I)
    desc = next((short(x, 170) for x in (d.get('ObjectName'), d.get('ImageDescription')) if good(x)), short(rec.get('desc', ''), 170))
    desc = desc[:1].upper() + desc[1:]
    IMG[iid] = {'src': 'img/%s.webp' % iid, 't': rec.get('title') or topic, 'd': desc, 'a': art, 'l': lic or 'Public domain', 'f': f, 'u': 'https://commons.wikimedia.org/wiki/File:' + f.replace(' ', '_'), 'sn': 'Wikimedia Commons',
                'w': rec.get('title') or topic, 'iw': im.size[0], 'ih': im.size[1], 'c': '#%02x%02x%02x' % avg, 'cat': cat(rec.get('title') or topic, f),
                'alt': short(d.get('ImageDescription') or rec.get('title') or topic, 140), 'topics': {topic}}
    return iid
def ph(iid, cls='', eager=False, tag='span', extra=''):
    d = IMG[iid]
    return '<%s class="ph-wrap %s" style="background:%s"%s><img src="%s" alt="%s" width="%d" height="%d" decoding="async"%s></%s>' % (
        tag, cls, d['c'], extra, d['src'], esc(d['alt']), d['iw'], d['ih'], '' if eager else ' loading="lazy"', tag)
ZOOM = '<span class="zoomhint" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5M11 8v6M8 11h6"/></svg>Enlarge</span>'
def tile(iid, cap=None):
    d = IMG[iid]
    return '<button type="button" class="tile" data-img="%s" data-cat="%s">%s<span class="tc">%s<small>%s</small></span></button>' % (
        iid, d['cat'], ph(iid), esc(cap or d['t']), esc(short(d['d'], 70)))

# ---- LoC maps
mapsj = json.load(open(R + 'img/maps.json'))
MAPS = {}
for ch, src in (('i-1', 'i-1'), ('i-5', 'iii-10')):
    v = mapsj.get(src)
    if not v: continue
    museum['__map_' + ch] = v; mkeep.add('__map_' + ch)
    iid = museum_for('__map_' + ch)
    if iid:
        IMG[iid]['t'] = short(v['title'], 80); IMG[iid]['cat'] = 'maps'; MAPS[ch] = iid
# ---- chapters: hero + strip
nh = ns = 0
for cid, topics in CH.items():
    m = re.search(r'<article id="%s"[^>]*>' % re.escape(cid), html)
    if not m: print('no article', cid); continue
    ids = [x for x in (image_for(t) for t in topics) if x]
    if cid in MAPS: ids.append(MAPS[cid])
    ids = list(dict.fromkeys(ids))
    if not ids or cid == 'home': continue
    end = html.index('</article>', m.end()); seg = html[m.end():end]
    hero = ids[0]; d = IMG[hero]
    fig = ('<figure class="hero"><button type="button" class="hero-media ph-wrap" style="background:%s" data-img="%s" aria-label="Enlarge: %s"><img src="%s" alt="%s" width="%d" height="%d" decoding="async" loading="lazy">%s</button>'
           '<figcaption><span><b>%s</b>%s</span><span class="credit">%s · %s</span></figcaption></figure>') % (
        d['c'], hero, esc(d['t']), d['src'], esc(d['alt']), d['iw'], d['ih'], ZOOM, esc(d['t']), (' — ' + esc(short(d['d'], 110))) if d['d'] else '', esc(d['a']), esc(d['l']))
    k = seg.find('</h2>')
    if k >= 0:
        k += 5
        if seg.startswith('<div class="docstrip">', k): k = seg.index('</div>', k) + 6
        seg = seg[:k] + fig + seg[k:]; nh += 1
    rest = ids[1:]
    if rest:
        strip = ('<div class="strip"><p class="lbl"><span>In pictures</span><span>%d images · tap to enlarge</span></p><div class="row">%s</div></div>') % (len(rest), ''.join(tile(i) for i in rest))
        cands = [seg.find('<h3', k if k >= 0 else 0), seg.find('<section class="deeper"'), seg.find('<section class="notes"'), seg.find('<aside class="quick"')]
        cands = [c for c in cands if c > 0]
        at = min(cands) if cands else len(seg)
        seg = seg[:at] + strip + seg[at:]; ns += 1
    html = html[:m.end()] + seg + html[end:]

# ---- people
np_ = 0
def person_sub(m):
    global np_
    block = m.group(0)
    name = re.sub('<[^>]+>', '', re.search(r'<h4[^>]*>(.*?)</h4>', block).group(1))
    iid = image_for(PEOPLE.get(name, name))
    head = re.match(r'<div class="person"([^>]*)>', block)
    inner = block[head.end():-6]
    if iid:
        np_ += 1
        return '<div class="person"%s>%s<div class="pbody">%s</div></div>' % (head.group(1), ph(iid, 'pp', tag='button', extra=' type="button" data-img="%s" aria-label="Portrait of %s"' % (iid, esc(name))), inner)
    return '<div class="person noimg"%s><div class="pmono" aria-hidden="true">%s</div><div class="pbody">%s</div></div>' % (head.group(1), esc(name[0]), inner)
i0 = html.index('<article id="ref-people"'); i1 = html.index('</article>', i0)
seg = re.sub(r'<div class="person"[^>]*>.*?</div></div>', person_sub, html[i0:i1], flags=re.S)
seg = seg.replace('<div class="dir"', '<div class="dir" data-gallery', 1)
html = html[:i0] + seg + html[i1:]

# ---- texts library thumbs
for did, topic in DOCIMG.items():
    iid = image_for(topic)
    if not iid: continue
    html = html.replace('<details class="doctext" id="text-%s"' % did, '<details class="doctext" data-img-ref="%s" id="text-%s"' % (iid, did), 1)
    k = html.find('<details class="doctext" data-img-ref="%s" id="text-%s"' % (iid, did))
    s = html.index('<summary>', k) + 9
    html = html[:s] + ph(iid, 'dthumb') + html[s:]

# ---- home: mosaic + era rail
home_ids = [x for x in (image_for(t) for t in CH['home'] + ['Basil of Caesarea', 'Chludov Psalter', 'Basilica of San Vitale', 'Abgar V', "Saint Catherine's Monastery", 'Etchmiadzin Cathedral', 'Fourth Crusade', 'John of Damascus', 'Council of Trent']) if x]
home_ids = [x for x in dict.fromkeys(home_ids) if IMG[x]['iw'] >= 400][:6]
pool = [i for i in IMG if IMG[i]['cat'] in ('art', 'texts', 'places')]
mosaic = '<div class="mosaic" data-gallery data-pool="%s">%s</div>' % (','.join(pool), ''.join(
    '<button type="button" class="m ph-wrap" style="background:%s" data-img="%s" aria-label="Enlarge: %s"><img src="%s" alt="%s" decoding="async"><span class="mcap">%s</span></button>' % (
        IMG[i]['c'], i, esc(IMG[i]['t']), IMG[i]['src'], esc(IMG[i]['alt']), esc(IMG[i]['t'])) for i in home_ids[:6]))
cards = []
for vid in ['vol-i', 'vol-ii', 'vol-iii', 'vol-iv', 'vol-v', 'vol-vi', 'vol-vii', 'vol-viii', 'vol-ix', 'vol-x', 'vol-xi', 'vol-xii', 'vol-xiii', 'vol-xiv', 'vol-xv', 'vol-p3', 'vol-p4']:
    ids = [x for x in (image_for(t) for t in CH.get(vid, [])) if x]
    mm = re.search(r'<article id="%s" data-title="([^"]*)"' % vid, html)
    if not ids or not mm: continue
    title = mm.group(1); num = vid.split('-')[1].upper()
    lab = ('Volume ' + num) if not num.startswith('P') else 'Part ' + ('III' if num == 'P3' else 'IV')
    t2 = re.sub(r'^Volume [IVXLC]+ — |^Part [IV]+ — ', '', title)
    cards.append('<a class="era-card" href="#%s">%s<span class="ec"><span>%s</span><b>%s</b></span></a>' % (vid, ph(ids[0]), lab, esc(t2)))
rail = ('<div class="rail"><p class="strip"><span class="lbl" style="display:flex;width:100%%"><span>Browse the volumes</span>'
        '<span class="rail-nav"><button type="button" data-rail="prev" aria-label="Scroll back">←</button><button type="button" data-rail="next" aria-label="Scroll forward">→</button></span></span></p>'
        '<div class="row">%s</div></div>') % ''.join(cards)
k = html.index('<div class="newed">')
html = html[:k] + mosaic + html[k:]
k = html.index('<h2>What this edition is</h2>')
html = html[:k] + rail + html[k:]

# ---- image atlas
CATS = [('people', 'People'), ('texts', 'Manuscripts & documents'), ('places', 'Places & buildings'), ('art', 'Art & events'), ('maps', 'Maps')]
order = sorted(IMG, key=lambda i: ([c for c, _ in CATS].index(IMG[i]['cat']), IMG[i]['t']))
gal = ('<article id="ref-gallery" data-title="Image atlas" data-vol="ref" data-kind="ref" data-topics="reference" class="wide"><p class="eyebrow">Reference · G</p><h2>Image atlas</h2>'
       '<p class="lede">Every picture in this edition in one place: portraits, icons, manuscripts, buildings and the art of each period. Tap any image to enlarge it; pinch or scroll to zoom, swipe to move through the set.</p>'
       '<p>Images come from Wikimedia Commons, the Library of Congress, Europeana partner libraries and museums, and the open-access collections of The Met, the Art Institute of Chicago and the Cleveland Museum of Art. All are in the public domain or under free licences. Authors and licences are listed under each image and in <a href="#ref-images">Visual sources</a>.</p>'
       '<div class="galbar"><div class="filterbar" id="galchips" style="margin:0"><button class="chip" type="button" aria-pressed="true" data-v="all">All</button>%s</div><span class="galcount" id="galcount">%d images</span></div>'
       '<div class="masonry" id="masonry" data-gallery>%s</div></article>') % (
    ''.join('<button class="chip" type="button" aria-pressed="false" data-v="%s">%s</button>' % (c, l) for c, l in CATS if any(IMG[i]['cat'] == c for i in IMG)),
    len(IMG), ''.join(tile(i) for i in order))
k = html.index('<article id="ref-atlas"')
html = html[:k] + gal + '\n' + html[k:]
# credits in Visual sources
rows = ''.join('<tr><td><button type="button" class="txtbtn" data-img="%s"><span>%s</span></button></td><td>%s</td><td>%s</td><td><a href="%s" rel="noopener">%s</a></td></tr>' % (
    i, esc(IMG[i]['t']), esc(IMG[i]['a']), esc(IMG[i]['l']), esc(IMG[i]['u']), esc(IMG[i]['sn'] + (': ' + short(IMG[i]['f'], 50) if IMG[i]['f'] else ''))) for i in order)
cred = '<h3>Image credits (Edition 6)</h3><p>%d images from Wikimedia Commons, the Library of Congress, Europeana partner institutions, The Metropolitan Museum of Art, the Art Institute of Chicago and the Cleveland Museum of Art, reduced in size for this edition. Licences are as stated by each source at the time of download; images marked CC BY or CC BY-SA may be reused under the same terms with this attribution.</p><div class="tablewrap" data-gallery><table class="data"><thead><tr><th>Subject</th><th>Author</th><th>Licence</th><th>Source</th></tr></thead><tbody>%s</tbody></table></div>' % (len(IMG), rows)
i0 = html.index('<article id="ref-images"'); i1 = html.index('</article>', i0)
k = html.find('<section class="notes"', i0, i1); k = i1 if k < 0 else k
html = html[:k] + cred + html[k:]

# ---- nav, order, search
html = html.replace('<li><a href="#ref-atlas">Atlas</a></li>', '<li><a href="#ref-gallery" class="newtag">Image atlas</a></li><li><a href="#ref-atlas">Atlas</a></li>', 1)
i = html.index('window.__DATA__=') + len('window.__DATA__=')
j = html.index('</script>', i)
raw = html[i:j].rstrip(); semi = raw.endswith(';')
D = json.loads(raw.rstrip(';'))
o = D['order']; o.insert(o.index('ref-atlas'), 'ref-gallery')
D['search'].append({'id': 'ref-gallery', 'title': 'Image atlas', 'k': 'Reference', 't': 'Image atlas pictures gallery images portraits manuscripts', 'b': ' '.join(IMG[x]['t'] for x in order)})
html = html[:i] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + (';' if semi else '') + html[j:]

# ---- CSS, data, lightbox, script
css = open(R + 'tools/media.css', encoding='utf-8').read()
html = html.replace('</style>\n</head>', css + '</style>\n</head>', 1)
for v in IMG.values(): v.pop('topics', None)
lbx = ('<div class="lb" id="lb" hidden role="dialog" aria-modal="true" aria-label="Image viewer"><div class="lb-top"><span id="lbCount"></span><div class="lb-actions">'
       '<button type="button" class="lbb" id="lbClose" aria-label="Close image (Esc)">✕</button></div></div>'
       '<div class="lb-stage" id="lbStage"><img id="lbImg" alt=""><button type="button" class="lbb lb-prev" id="lbPrev" aria-label="Previous image">←</button><button type="button" class="lbb lb-next" id="lbNext" aria-label="Next image">→</button></div>'
       '<div class="lb-cap"><div id="lbCap"></div><div class="lb-thumbs" id="lbThumbs"></div></div></div>')
js = open(R + 'tools/media.js', encoding='utf-8').read()
k = html.rindex('</body>')
html = html[:k] + lbx + '<script>window.__IMG__=' + json.dumps(IMG, ensure_ascii=False, separators=(',', ':')) + ';</script><script>' + js + '</script>\n' + html[k:]
html = html.replace('Edition 5 · Vols I–XV · Full texts', 'Edition 6 · Illustrated')
html = html.replace('<p class="eyebrow">A historical encyclopedia · Edition 5</p>', '<p class="eyebrow">A historical encyclopedia · Edition 6 · Illustrated</p>')
html = html.replace('<div class="rbody" id="rbody">', '<div class="rbody" id="rbody" data-gallery>')
open(OUT + 'index.html', 'w', encoding='utf-8').write(html)
tot = sum(os.path.getsize(OUT + 'img/' + f) for f in os.listdir(OUT + 'img'))
from collections import Counter
print('images', len(IMG), 'heroes', nh, 'strips', ns, 'portraits', np_, 'img MB', round(tot / 1e6, 1), 'html MB', round(len(html.encode()) / 1e6, 2), Counter(v['cat'] for v in IMG.values()))
