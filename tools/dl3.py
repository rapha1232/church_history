import json, os, re, time, urllib.request, urllib.parse
UA = {'User-Agent': 'ChurchHistoryApp/1.0 (educational offline reader)'}
R = '/home/user/church/img/'
info = json.load(open(R + 'commons.json'))
def p(f): return R + 'raw/' + re.sub(r'[^A-Za-z0-9._-]', '_', f) + '.bin'
todo = [f for f, d in info.items() if not os.path.exists(p(f))]
print(time.strftime('%T'), 'todo', len(todo), flush=True)
n = 0; i = 0; back = 30
while i < len(todo):
    f = todo[i]
    u = 'https://commons.wikimedia.org/w/thumb.php?' + urllib.parse.urlencode({'f': f.replace('File:', '').replace(' ', '_'), 'w': 960})
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60) as r:
            b = r.read(); ct = r.headers.get('Content-Type', '')
        if ct.startswith('image/') and len(b) > 3000:
            open(p(f), 'wb').write(b); n += 1; print(time.strftime('%T'), 'ok', n, f, flush=True)
        else: print(time.strftime('%T'), 'bad', ct, f, flush=True)
        i += 1; back = 30; time.sleep(2)
    except urllib.error.HTTPError as e:
        if e.code == 429: print(time.strftime('%T'), '429 wait', back, flush=True); time.sleep(back); back = min(back * 2, 300)
        else: print(time.strftime('%T'), 'http', e.code, f, flush=True); i += 1
    except Exception as e: print('err', e, flush=True); time.sleep(15)
print(time.strftime('%T'), 'done downloads', n, flush=True)
