"""Search further open-access sources for topics still lacking an image.
Sources: SMK (Denmark), Finna (Finland), Wellcome Collection, Europeana (alt queries), Library of Congress (alt queries), Cleveland/AIC/Met (loose)."""
import json, os, re, sys, time, urllib.request, urllib.parse, threading
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, '/home/user/church/tools')
from multi import key
UA = {'User-Agent': 'ChurchHistoryApp/1.0 (educational offline reader)'}
R = '/home/user/church/img/'
os.makedirs(R + 'raw_s', exist_ok=True)
lock = threading.Lock()
def get(url, js=True, t=40):
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=t) as r:
                b = r.read(); return json.loads(b) if js else b
        except urllib.error.HTTPError as e:
            if e.code in (400, 401, 403, 404, 410): return None
            time.sleep(5 * (i + 1))
        except Exception: time.sleep(4)
def clean(t):
    t = re.sub(r'\(.*?\)', '', t); return t.replace('Pope ', '').replace('Saint ', '').replace('St. ', '').strip()
def ok(title, k): return k in (title or '').lower()

def smk(t, k):
    d = get('https://api.smk.dk/api/v1/art/search/?' + urllib.parse.urlencode({'keys': clean(t), 'offset': 0, 'rows': 15, 'filters': '[has_image:true],[public_domain:true]'}))
    out = []
    for it in (d or {}).get('items', []) or []:
        title = ' '.join(x.get('title', '') for x in it.get('titles') or [])
        im = it.get('image_thumbnail') or it.get('image_native')
        if im and ok(title, k):
            cr = ', '.join(p.get('creator', '') for p in it.get('production') or [] if p.get('creator'))
            dt = ', '.join(p.get('period', '') for p in it.get('production_date') or [])
            out.append({'museum': 'Statens Museum for Kunst', 'img': re.sub(r'/full/!?\d*,?\d*/', '/full/!900,900/', im) if 'iiif' in im else im, 'title': title, 'artist': cr[:90], 'date': dt,
                        'url': it.get('frontend_url', ''), 'lic': 'Public domain (SMK Open)'})
    return out
def finna(t, k):
    q = urllib.parse.urlencode([('lookfor', clean(t)), ('filter[]', 'online_boolean:1'), ('filter[]', 'usage_rights_str_mv:usage_A'), ('limit', 15)] +
                               [('field[]', f) for f in ('title', 'images', 'imageRights', 'id', 'nonPresenterAuthors', 'buildings', 'year')])
    d = get('https://api.finna.fi/v1/search?' + q); out = []
    for it in (d or {}).get('records', []) or []:
        if it.get('images') and ok(it.get('title'), k):
            lic = (it.get('imageRights') or {}).get('copyright', '')
            if not re.search(r'CC0|PDM|public|CC BY(?!-N)', lic, re.I): continue
            out.append({'museum': ((it.get('buildings') or [{}])[0].get('translated') or 'Finna') + ' via Finna', 'img': 'https://finna.fi' + it['images'][0],
                        'title': it['title'][:200], 'artist': ', '.join(a.get('name', '') for a in it.get('nonPresenterAuthors') or [])[:90], 'date': str(it.get('year', '')),
                        'url': 'https://finna.fi/Record/' + urllib.parse.quote(it['id']), 'lic': lic})
    return out
def wellcome(t, k):
    d = get('https://api.wellcomecollection.org/catalogue/v2/images?' + urllib.parse.urlencode({'query': clean(t), 'pageSize': 15, 'include': 'source.contributors'}))
    out = []
    for it in (d or {}).get('results', []) or []:
        src = it.get('source') or {}; title = src.get('title', '')
        loc = (it.get('locations') or [{}])[0]; lic = (loc.get('license') or {}).get('id', '')
        if lic not in ('pdm', 'cc-0', 'cc-by', 'cc-by-sa') or not ok(title, k): continue
        base = loc['url'].rsplit('/info.json', 1)[0]
        out.append({'museum': 'Wellcome Collection', 'img': base + '/full/!900,900/0/default.jpg', 'title': title[:200],
                    'artist': ', '.join((c.get('agent') or {}).get('label', '') for c in src.get('contributors') or [])[:90], 'date': '',
                    'url': 'https://wellcomecollection.org/works/' + src.get('id', ''), 'lic': {'pdm': 'Public Domain Mark', 'cc-0': 'CC0', 'cc-by': 'CC BY 4.0', 'cc-by-sa': 'CC BY-SA'}[lic] + ' (Wellcome Collection)'})
    return out
LIC = {'publicdomain/mark': 'Public Domain Mark', 'publicdomain/zero': 'CC0', 'licenses/by-sa': 'CC BY-SA', 'licenses/by/': 'CC BY'}
def europeana(t, k):
    out = []
    for q in (clean(t), k + ' portrait' if len(k) > 4 else None):
        if not q: continue
        d = get('https://api.europeana.eu/record/v2/search.json?' + urllib.parse.urlencode({'wskey': 'api2demo', 'query': q, 'qf': 'TYPE:IMAGE', 'reusability': 'open', 'rows': 20, 'profile': 'rich'}))
        for it in (d or {}).get('items', []) or []:
            title = ' '.join(it.get('title') or []); rr = ' '.join(it.get('rights') or [])
            l = next((v for kk, v in LIC.items() if kk in rr), None)
            if not l or not ok(title, k): continue
            im = (it.get('edmIsShownBy') or it.get('edmPreview') or [None])[0]
            if im: out.append({'museum': (it.get('dataProvider') or ['Europeana'])[0] + ' via Europeana', 'img': im, 'prev': (it.get('edmPreview') or [None])[0], 'title': title[:200],
                               'artist': ', '.join(x for x in (it.get('dcCreator') or []) if not x.startswith('http'))[:90], 'date': ' '.join((it.get('year') or [])[:1]), 'url': (it.get('guid') or '').split('?')[0], 'lic': l})
    return out
def loc(t, k):
    d = get('https://www.loc.gov/pictures/search/?' + urllib.parse.urlencode({'q': clean(t), 'fo': 'json', 'c': 20}))
    out = []
    for r in (d or {}).get('results', []) or []:
        title = r.get('title', ''); im = (r.get('image') or {}).get('full')
        if im and ok(title, k):
            if im.startswith('//'): im = 'https:' + im
            out.append({'museum': 'Library of Congress', 'img': im, 'title': title[:200], 'artist': r.get('creator', '')[:90], 'date': r.get('created_published_date', ''),
                        'url': r.get('links', {}).get('item', ''), 'lic': 'No known restrictions (Library of Congress)'})
    return out
SRC = [wellcome, smk, finna, europeana, loc]
miss = json.load(open(R + 'missing.json'))
O = R + 'scour.json'
out = json.load(open(O)) if os.path.exists(O) else {}
def work(t):
    if t in out: return
    k = key(t); cands = []
    for fn in SRC:
        try: cs = fn(t, k)
        except Exception as e: cs = []
        for c in cs[:2]:
            b = get(c['img'], js=False, t=60)
            if (not b or len(b) < 5000 or len(b) > 8_000_000) and c.get('prev'): b = get(c['prev'], js=False)
            if b and len(b) > 5000 and (b[:3] == b'\xff\xd8\xff' or b[:4] == b'\x89PNG' or b[8:12] == b'WEBP'):
                p = R + 'raw_s/%s_%d.bin' % (re.sub(r'[^A-Za-z0-9]', '_', t)[:60], len(cands)); open(p, 'wb').write(b); c['local'] = p; c['key'] = k; cands.append(c)
        if len(cands) >= 4: break
    with lock:
        out[t] = cands; json.dump(out, open(O, 'w'))
        print(time.strftime('%T'), len(cands), t, '|', ' / '.join(c['museum'][:25] for c in cands), flush=True)
if __name__ == '__main__':
    print('topics', len(miss), flush=True)
    with ThreadPoolExecutor(4) as ex: list(ex.map(work, miss))
    print('scour done', sum(1 for v in out.values() if v), flush=True)
