import json, os, re, sys, time, urllib.request, urllib.parse, threading
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, '/home/user/church/tools')
from imgmap import CH, DOCIMG, PEOPLE
UA = {'User-Agent': 'ChurchHistoryApp/1.0 (educational offline reader)'}
R = '/home/user/church/img/'
os.makedirs(R + 'raw_m', exist_ok=True)
lock = threading.Lock()
def log(*a):
    with lock: print(time.strftime('%T'), *a, flush=True)
def get(url, js=True):
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                b = r.read(); return json.loads(b) if js else b
        except urllib.error.HTTPError as e:
            if e.code in (400, 403, 404, 410): return None
            time.sleep(4 * (i + 1))
        except Exception:
            time.sleep(3)
    return None
pages = json.load(open(R + 'pages.json'))
def have_wiki(t):
    f = (pages.get(t) or {}).get('file')
    return f and os.path.exists(R + 'raw/' + re.sub(r'[^A-Za-z0-9._-]', '_', f) + '.bin')
html = open('/home/user/church/orig.html').read()
people = [re.sub('<[^>]+>', '', p) for p in re.findall(r'<div class="person"[^>]*>\s*<h4[^>]*>(.*?)</h4>', html)]
PT = {PEOPLE.get(p, p) for p in people}
topics = []
for v in CH.values(): topics += v
topics += list(DOCIMG.values()) + list(PT)
topics = [t for t in dict.fromkeys(topics) if not have_wiki(t)]
STOP = set('saint saints pope of the and council first second third fourth church great i ii iii iv v vi vii viii ix x xi xii xiii xiv xv xxiii patriarch st. de la in on theologian holy christian ecumenical rome constantinople alexandria antioch the'.split())
def key(t):
    t = re.sub(r'\(.*?\)', '', t)
    words = [w.strip('(),.’\'"').lower() for w in t.split()]
    words = [w for w in words if w and w not in STOP and len(w) > 2]
    return sorted(words, key=len, reverse=True)[0] if words else t.lower()
def loc(t, k):
    d = get('https://www.loc.gov/photos/?' + urllib.parse.urlencode({'q': t, 'fo': 'json', 'c': 12, 'fa': 'online-format:image'}))
    for r in (d or {}).get('results', []):
        title = (r.get('title') or '')
        if k not in title.lower(): continue
        best = None
        for u in r.get('image_url') or []:
            m = re.search(r'#h=(\d+)&w=(\d+)', u)
            if m and int(m.group(2)) >= 500 and (not best or int(m.group(2)) > best[1]) and int(m.group(2)) <= 1400: best = (u.split('#')[0], int(m.group(2)))
        if best:
            return {'museum': 'Library of Congress', 'img': best[0], 'title': title, 'artist': ', '.join(r.get('contributor') or [])[:90], 'date': r.get('date', ''),
                    'url': r.get('id') or r.get('url', ''), 'lic': 'No known restrictions (Library of Congress)'}
def met(t, k):
    d = get('https://collectionapi.metmuseum.org/public/collection/v1.1/search?' + urllib.parse.urlencode({'q': t, 'hasImages': 'true', 'limit': 15}))
    for oid in ((d or {}).get('objectIDs') or [])[:15]:
        o = get('https://collectionapi.metmuseum.org/public/collection/v1/objects/%d' % oid)
        if o and o.get('isPublicDomain') and o.get('primaryImageSmall') and k in (o.get('title') or '').lower():
            return {'museum': 'The Metropolitan Museum of Art', 'img': o['primaryImageSmall'], 'title': o.get('title', ''), 'artist': o.get('artistDisplayName') or o.get('culture') or '',
                    'date': o.get('objectDate', ''), 'url': o.get('objectURL', ''), 'lic': 'Public domain (The Met Open Access, CC0)'}
def aic(t, k):
    d = get('https://api.artic.edu/api/v1/artworks/search?' + urllib.parse.urlencode({'q': t, 'limit': 12, 'fields': 'id,title,image_id,artist_display,date_display,is_public_domain'}))
    for o in (d or {}).get('data', []):
        if o.get('is_public_domain') and o.get('image_id') and k in (o.get('title') or '').lower():
            return {'museum': 'Art Institute of Chicago', 'img': 'https://www.artic.edu/iiif/2/%s/full/843,/0/default.jpg' % o['image_id'], 'title': o.get('title', ''),
                    'artist': (o.get('artist_display') or '').split('\n')[0], 'date': o.get('date_display', ''), 'url': 'https://www.artic.edu/artworks/%d' % o['id'], 'lic': 'Public domain (Art Institute of Chicago, CC0)'}
def cma(t, k):
    d = get('https://openaccess-api.clevelandart.org/api/artworks/?' + urllib.parse.urlencode({'q': t, 'cc0': 1, 'has_image': 1, 'limit': 12}))
    for o in (d or {}).get('data', []):
        im = ((o.get('images') or {}).get('web') or {}).get('url')
        if im and k in (o.get('title') or '').lower():
            return {'museum': 'Cleveland Museum of Art', 'img': im, 'title': o.get('title', ''), 'artist': ', '.join((c.get('description') or '') for c in (o.get('creators') or []))[:90],
                    'date': o.get('creation_date', ''), 'url': o.get('url', ''), 'lic': 'CC0 (Cleveland Museum of Art Open Access)'}
M = R + 'museum.json'
out = {}
def work(t):
    k = key(t)
    srcs = (met, aic, cma, loc) if t in PT else (loc, met, aic, cma)
    found = None
    for fn in srcs:
        try: found = fn(t, k)
        except Exception as e: found = None
        if found: break
    if found:
        b = get(found['img'], js=False)
        if b and len(b) > 4000:
            p = R + 'raw_m/' + re.sub(r'[^A-Za-z0-9]', '_', t)[:80] + '.bin'; open(p, 'wb').write(b); found['local'] = p; found['key'] = k
        else: found = None
    with lock:
        out[t] = found; json.dump(out, open(M, 'w'))
    log('found' if found else 'none ', t, '|', (found or {}).get('museum', ''), '|', (found or {}).get('title', '')[:70])
if __name__ == '__main__':
    log('topics', len(topics))
    with ThreadPoolExecutor(6) as ex: list(ex.map(work, topics))
    log('multi done', sum(1 for v in out.values() if v), 'of', len(out))
