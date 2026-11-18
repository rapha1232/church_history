import json, os, re, time, urllib.request
UA = {'User-Agent': 'ChurchHistoryApp/1.0 (educational offline reader)'}
R = '/home/user/church/img/'
info = json.load(open(R + 'commons.json'))
todo = [(f, d['thumb']) for f, d in info.items() if d.get('thumb') and not os.path.exists(R + 'raw/' + re.sub(r'[^A-Za-z0-9._-]', '_', f) + '.bin')]
print(time.strftime('%T'), 'todo', len(todo), flush=True)
n = 0
for f, u in todo:
    u = re.sub(r'/960px-', '/500px-', u)
    for attempt in range(8):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60) as r:
                open(R + 'raw/' + re.sub(r'[^A-Za-z0-9._-]', '_', f) + '.bin', 'wb').write(r.read()); n += 1; break
        except urllib.error.HTTPError as e:
            if e.code in (404, 400, 403): print('skip', e.code, f, flush=True); break
            time.sleep(45)
        except Exception as e:
            time.sleep(15)
    if n % 20 == 0: print(time.strftime('%T'), 'downloaded', n, flush=True)
    time.sleep(2)
print(time.strftime('%T'), 'done downloads', n, flush=True)
