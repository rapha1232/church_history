import json, time, os, re, sys, urllib.request, urllib.parse
sys.path.insert(0, '/home/user/church/tools')
from imgmap import CH, DOCIMG, PEOPLE
UA = {'User-Agent': 'ChurchHistoryApp/1.0 (educational offline reader)'}
ROOT = '/home/user/church/img/'
cache_p = ROOT + 'summary.json'
cache = json.load(open(cache_p)) if os.path.exists(cache_p) else {}
def get(url, tries=5):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 404: return None
            if e.code in (429, 503): time.sleep(8 * (i + 1)); continue
            if e.code == 400: return None
            time.sleep(3)
        except Exception:
            time.sleep(3)
    return None
people = re.findall(r'<div class="person"[^>]*>\s*<h4[^>]*>(.*?)</h4>', open('/home/user/church/orig.html').read())
people = [re.sub('<[^>]+>', '', p) for p in people]
titles = []
for v in CH.values(): titles += v
titles += list(DOCIMG.values())
titles += [PEOPLE.get(p, p) for p in people]
titles = list(dict.fromkeys(titles))
print('titles', len(titles), flush=True)
for t in titles:
    if t in cache: continue
    raw = get('https://en.wikipedia.org/api/rest_v1/page/summary/' + urllib.parse.quote(t.replace(' ', '_'), safe=''))
    d = json.loads(raw) if raw else {}
    cache[t] = {'title': d.get('title'), 'type': d.get('type'), 'orig': (d.get('originalimage') or {}), 'thumb': (d.get('thumbnail') or {}), 'desc': d.get('description', '')}
    json.dump(cache, open(cache_p, 'w'))
    time.sleep(0.7)
print('summaries done', flush=True)
# download
for t, d in cache.items():
    o = d.get('orig') or {}
    src = o.get('source', '')
    if not src or '/wikipedia/commons/' not in src: continue
    fn = urllib.parse.unquote(src.split('?')[0].rsplit('/', 1)[1])
    d['file'] = fn
    out = ROOT + 'raw/' + re.sub(r'[^A-Za-z0-9._-]', '_', fn)
    if not out.lower().endswith(('.jpg', '.jpeg', '.png')): out += '.png'
    d['local'] = out
    if os.path.exists(out): continue
    w = o.get('width', 0)
    path = src.split('?')[0].replace('https://upload.wikimedia.org/wikipedia/commons/', '')
    a, b, name = path.split('/', 2)
    data = None
    for tw in (960, 500, 330):
        if w and w <= tw and not name.lower().endswith(('.svg', '.tif', '.tiff')):
            continue
        ext = '.png' if name.lower().endswith('.svg') else ('.jpg' if name.lower().endswith(('.tif', '.tiff')) else '')
        data = get('https://thumb.wikimedia.org/wikipedia/commons/thumb/%s/%s/%s/%dpx-%s%s' % (a, b, name, tw, name, ext))
        if data and len(data) > 2000: break
        data = None
    if data is None:
        data = get(src.split('?')[0])
    if data:
        open(out, 'wb').write(data)
    time.sleep(0.5)
json.dump(cache, open(cache_p, 'w'))
print('downloads done', flush=True)
# licenses from Commons, 40 per request
files = sorted({d['file'] for d in cache.values() if d.get('file')})
lic_p = ROOT + 'licenses.json'
lic = json.load(open(lic_p)) if os.path.exists(lic_p) else {}
todo = [f for f in files if f not in lic]
for i in range(0, len(todo), 40):
    chunk = todo[i:i + 40]
    url = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=extmetadata&iiextmetadatafilter=LicenseShortName|Artist|ImageDescription|DateTimeOriginal|Credit&titles=' + urllib.parse.quote('|'.join('File:' + f for f in chunk))
    raw = get(url)
    if not raw: continue
    q = json.loads(raw)['query']
    norm = {n['to']: n['from'] for n in q.get('normalized', [])}
    for p in q['pages'].values():
        name = p['title'][5:]
        name = norm.get(p['title'], p['title'])[5:]
        md = (p.get('imageinfo') or [{}])[0].get('extmetadata', {})
        lic[name] = {k: re.sub('<[^>]+>', '', (md.get(k) or {}).get('value', ''))[:300] for k in ('LicenseShortName', 'Artist', 'ImageDescription', 'DateTimeOriginal')}
    json.dump(lic, open(lic_p, 'w'))
    time.sleep(1)
print('licenses done', len(lic), flush=True)
