import json, os, re, sys, time, urllib.request, urllib.parse
sys.path.insert(0, '/home/user/church/tools')
from imgmap import CH, DOCIMG, PEOPLE
UA = {'User-Agent': 'ChurchHistoryApp/1.0 (educational offline reader)'}
R = '/home/user/church/img/'
os.makedirs(R + 'raw_m', exist_ok=True)
def log(*a): print(time.strftime('%T'), *a, flush=True)
def get(url, js=True):
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
                b = r.read(); return json.loads(b) if js else b
        except urllib.error.HTTPError as e:
            if e.code in (400, 403, 404): return None
            time.sleep(5 * (i + 1))
        except Exception:
            time.sleep(4)
    return None
pages = json.load(open(R + 'pages.json')); info = json.load(open(R + 'commons.json'))
def have_wiki(t):
    f = (pages.get(t) or {}).get('file')
    return f and os.path.exists(R + 'raw/' + re.sub(r'[^A-Za-z0-9._-]', '_', f) + '.bin')
html = open('/home/user/church/orig.html').read()
people = [re.sub('<[^>]+>', '', p) for p in re.findall(r'<div class="person"[^>]*>\s*<h4[^>]*>(.*?)</h4>', html)]
topics = []
for v in CH.values(): topics += v
topics += list(DOCIMG.values()) + [PEOPLE.get(p, p) for p in people]
topics = [t for t in dict.fromkeys(topics) if not have_wiki(t)]
STOP = {'saint', 'saints', 'pope', 'of', 'the', 'and', 'council', 'first', 'second', 'third', 'church', 'great', 'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii', 'xiii', 'xiv', 'xv', 'xxiii', 'patriarch', 'cathedral', 'basilica', 'st.', 'de', 'la', 'in', 'on', 'theologian', 'church)', '(church', 'east)', 'constantinople', 'alexandria', 'antioch', 'rome', 'holy', 'christian'}
def key(t):
    words = [w.strip('(),.’\'"') for w in t.split()]
    words = [w for w in words if w and w.lower() not in STOP]
    return sorted(words, key=len, reverse=True)[0].lower() if words else t.lower()
M = R + 'museum.json'
out = json.load(open(M)) if os.path.exists(M) else {}
log('topics without wiki image', len(topics))
for t in topics:
    if t in out: continue
    k = key(t); found = None
    # Met
    s = get('https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q=' + urllib.parse.quote(t))
    for oid in ((s or {}).get('objectIDs') or [])[:12]:
        o = get('https://collectionapi.metmuseum.org/public/collection/v1/objects/%d' % oid); time.sleep(0.25)
        if not o or not o.get('isPublicDomain') or not o.get('primaryImageSmall'): continue
        hay = ' '.join([o.get('title', ''), ' '.join(x.get('term', '') for x in (o.get('tags') or [])), o.get('objectName', '')]).lower()
        if k in hay:
            found = {'museum': 'The Metropolitan Museum of Art', 'img': o['primaryImageSmall'], 'title': o.get('title', ''), 'artist': o.get('artistDisplayName') or o.get('culture') or '',
                     'date': o.get('objectDate', ''), 'url': o.get('objectURL', ''), 'lic': 'Public domain (Met Open Access, CC0)'}
            break
    if not found:
        s = get('https://openaccess-api.clevelandart.org/api/artworks/?cc0=1&has_image=1&limit=8&q=' + urllib.parse.quote(t))
        for o in ((s or {}).get('data') or []):
            im = ((o.get('images') or {}).get('web') or {}).get('url')
            hay = (o.get('title', '') + ' ' + (o.get('description') or '')[:300]).lower()
            if im and k in hay:
                found = {'museum': 'Cleveland Museum of Art', 'img': im, 'title': o.get('title', ''), 'artist': ', '.join(c.get('description', '') for c in (o.get('creators') or []))[:90] or o.get('culture', [''])[0] if o.get('culture') else '',
                         'date': o.get('creation_date', ''), 'url': o.get('url', ''), 'lic': 'CC0 (Cleveland Museum of Art Open Access)'}
                break
    if not found:
        s = get('https://api.artic.edu/api/v1/artworks/search?' + urllib.parse.urlencode({'q': t, 'limit': 8, 'fields': 'id,title,image_id,artist_display,date_display,is_public_domain'}))
        for o in ((s or {}).get('data') or []):
            if o.get('is_public_domain') and o.get('image_id') and k in (o.get('title') or '').lower():
                found = {'museum': 'Art Institute of Chicago', 'img': 'https://www.artic.edu/iiif/2/%s/full/843,/0/default.jpg' % o['image_id'], 'title': o.get('title', ''),
                         'artist': (o.get('artist_display') or '').split('\n')[0], 'date': o.get('date_display', ''), 'url': 'https://www.artic.edu/artworks/%d' % o['id'], 'lic': 'Public domain (Art Institute of Chicago, CC0)'}
                break
    if found:
        fn = R + 'raw_m/' + re.sub(r'[^A-Za-z0-9]', '_', t)[:80] + '.bin'
        b = get(found['img'], js=False)
        if b and len(b) > 3000:
            open(fn, 'wb').write(b); found['local'] = fn
        else: found = None
    out[t] = found
    json.dump(out, open(M, 'w'))
    log('found' if found else 'none', t, '|', (found or {}).get('museum', ''), (found or {}).get('title', '')[:60])
log('museum done', sum(1 for v in out.values() if v))
