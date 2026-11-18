import json, os, re, sys, time, urllib.request, urllib.parse, threading
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, '/home/user/church/tools')
from imgmap import CH, DOCIMG, PEOPLE
from multi import key, PT, have_wiki  # reuse helpers (multi.py guarded below)
UA = {'User-Agent': 'ChurchHistoryApp/1.0 (educational offline reader)'}
R = '/home/user/church/img/'
lock = threading.Lock()
def log(*a):
    with lock: print(time.strftime('%T'), *a, flush=True)
def get(url, js=True):
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
                b = r.read(); return json.loads(b) if js else b
        except urllib.error.HTTPError as e:
            if e.code in (400, 403, 404, 410): return None
            time.sleep(4 * (i + 1))
        except Exception:
            time.sleep(3)
mkeep = set(json.load(open(R + 'museum_keep.json')))
topics = []
for v in CH.values(): topics += v
topics += list(DOCIMG.values()) + list(PT)
topics = [t for t in dict.fromkeys(topics) if not have_wiki(t) and t not in mkeep]
E = R + 'europeana.json'
out = json.load(open(E)) if os.path.exists(E) else {}
LIC = {'publicdomain/mark': 'Public Domain Mark', 'publicdomain/zero': 'CC0', 'licenses/by-sa': 'CC BY-SA', 'licenses/by/': 'CC BY'}
def lic(r):
    for k, v in LIC.items():
        if k in r: return v
    return None
def work(t):
    if t in out: return
    k = key(t); found = None; cands = []
    q = t.replace('Pope ', '').replace('Saint ', '')
    d = get('https://api.europeana.eu/record/v2/search.json?' + urllib.parse.urlencode({'wskey': 'api2demo', 'query': q, 'qf': 'TYPE:IMAGE', 'reusability': 'open', 'rows': 20, 'profile': 'rich'}))
    for it in (d or {}).get('items', []):
        title = ' '.join(it.get('title') or [])
        l = lic(' '.join(it.get('rights') or []))
        if not l or k not in title.lower(): continue
        full = (it.get('edmIsShownBy') or [None])[0]; prev = (it.get('edmPreview') or [None])[0]
        cands.append({'museum': (it.get('dataProvider') or ['Europeana'])[0] + ' via Europeana', 'title': title[:200], 'artist': ', '.join(x for x in (it.get('dcCreator') or []) if not x.startswith('http'))[:90],
                      'date': ' '.join((it.get('year') or [])[:1]), 'url': (it.get('guid') or '').split('?')[0], 'lic': l, 'full': full, 'prev': prev})
    for c in cands[:3]:
        b = None
        if c['full']:
            b = get(c['full'], js=False)
            if b and (len(b) > 6_000_000 or not (b[:3] == b'\xff\xd8\xff' or b[:4] == b'\x89PNG' or b[:4] == b'RIFF')): b = None
        if not b and c['prev']:
            b = get(c['prev'], js=False)
        if b and len(b) > 5000:
            p = R + 'raw_e/' + re.sub(r'[^A-Za-z0-9]', '_', t)[:80] + '.bin'; open(p, 'wb').write(b); c['local'] = p; found = c; break
    with lock:
        out[t] = found; json.dump(out, open(E, 'w'))
    log('found' if found else 'none ', t, '|', (found or {}).get('museum', '')[:40], '|', (found or {}).get('title', '')[:70])
if __name__ == '__main__':
    os.makedirs(R + 'raw_e', exist_ok=True)
    log('topics', len(topics))
    with ThreadPoolExecutor(5) as ex: list(ex.map(work, topics))
    log('europeana done', sum(1 for v in out.values() if v))
