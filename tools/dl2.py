import json, os, re, time, urllib.request
UA = {'User-Agent': 'ChurchHistoryApp/1.0 (educational offline reader)'}
R = '/home/user/church/img/'
info = json.load(open(R + 'commons.json'))
todo = [(f, re.sub(r'/960px-', '/500px-', d['thumb'])) for f, d in info.items() if d.get('thumb') and not os.path.exists(R + 'raw/' + re.sub(r'[^A-Za-z0-9._-]', '_', f) + '.bin')]
print(time.strftime('%T'), 'todo', len(todo), flush=True)
n = 0; i = 0
while i < len(todo):
    f, u = todo[i]
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60) as r:
            open(R + 'raw/' + re.sub(r'[^A-Za-z0-9._-]', '_', f) + '.bin', 'wb').write(r.read())
        n += 1; i += 1; print(time.strftime('%T'), 'ok', n, flush=True); time.sleep(3)
    except urllib.error.HTTPError as e:
        if e.code == 429: print(time.strftime('%T'), '429 wait', flush=True); time.sleep(120)
        else: i += 1
    except Exception: time.sleep(20)
print(time.strftime('%T'), 'done downloads', n, flush=True)
