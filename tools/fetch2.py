import json, time, os, re, sys, urllib.request, urllib.parse
sys.path.insert(0, '/home/user/church/tools')
from imgmap import CH, DOCIMG, PEOPLE
UA = {'User-Agent': 'ChurchHistoryApp/1.0 (educational offline reader)'}
ROOT = '/home/user/church/img/'
def log(*a): print(time.strftime('%H:%M:%S'), *a, flush=True)
def get(url, tries=12):
    wait = 30
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code in (404, 400): return None
            log('http', e.code, 'wait', wait); time.sleep(wait); wait = min(wait * 1.6, 300)
        except Exception as e:
            log('err', e); time.sleep(10)
    return None
people = re.findall(r'<div class="person"[^>]*>\s*<h4[^>]*>(.*?)</h4>', open('/home/user/church/orig.html').read())
people = [re.sub('<[^>]+>', '', p) for p in people]
titles = []
for v in CH.values(): titles += v
titles += list(DOCIMG.values()) + [PEOPLE.get(p, p) for p in people]
titles = list(dict.fromkeys(titles))
P = ROOT + 'pages.json'
pages = json.load(open(P)) if os.path.exists(P) else {}
todo = [t for t in titles if t not in pages]
log('titles', len(titles), 'todo', len(todo))
for i in range(0, len(todo), 45):
    ch = todo[i:i + 45]
    url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=pageimages|description&piprop=original|name&titles=' + urllib.parse.quote('|'.join(ch))
    raw = get(url)
    if not raw: log('fail batch'); continue
    q = json.loads(raw)['query']
    m = {}
    for n in q.get('normalized', []) + q.get('redirects', []): m[n['to']] = n['from']
    for p in q['pages'].values():
        t = p.get('title'); orig = t
        chain = [t]
        while chain[-1] in m: chain.append(m[chain[-1]])
        rec = {'title': t, 'file': p.get('pageimage'), 'orig': p.get('original', {}), 'desc': p.get('description', '')}
        for c in chain: pages[c] = rec
    for t in ch: pages.setdefault(t, {'title': t, 'file': None})
    json.dump(pages, open(P, 'w')); log('pages', len(pages)); time.sleep(5)
files = sorted({p['file'] for p in pages.values() if p.get('file') and '/commons/' in p.get('orig', {}).get('source', '')})
L = ROOT + 'commons.json'
info = json.load(open(L)) if os.path.exists(L) else {}
todo = [f for f in files if f not in info]
log('files', len(files), 'todo', len(todo))
for i in range(0, len(todo), 45):
    ch = todo[i:i + 45]
    url = ('https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=960'
           '&iiextmetadatafilter=LicenseShortName|Artist|ImageDescription|DateTimeOriginal|ObjectName&titles=' + urllib.parse.quote('|'.join('File:' + f for f in ch)))
    raw = get(url)
    if not raw: log('fail lic'); continue
    q = json.loads(raw)['query']
    back = {n['to']: n['from'] for n in q.get('normalized', [])}
    for p in q['pages'].values():
        name = back.get(p['title'], p['title'])[5:]
        ii = (p.get('imageinfo') or [{}])[0]
        md = ii.get('extmetadata', {})
        info[name] = {'thumb': ii.get('thumburl'), 'w': ii.get('width'), 'h': ii.get('height'),
                      **{k: re.sub(r'\s+', ' ', re.sub('<[^>]+>', '', (md.get(k) or {}).get('value', ''))).strip()[:400] for k in ('LicenseShortName', 'Artist', 'ImageDescription', 'DateTimeOriginal', 'ObjectName')}}
    json.dump(info, open(L, 'w')); log('info', len(info)); time.sleep(5)
os.makedirs(ROOT + 'raw', exist_ok=True)
n = 0
for f, d in info.items():
    if not d.get('thumb'): continue
    out = ROOT + 'raw/' + re.sub(r'[^A-Za-z0-9._-]', '_', f) + '.bin'
    if os.path.exists(out): continue
    data = get(d['thumb'])
    if data: open(out, 'wb').write(data); n += 1
    if n % 25 == 0: log('downloaded', n)
    time.sleep(1.2)
log('done downloads', n)
