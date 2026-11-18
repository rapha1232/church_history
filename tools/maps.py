import json, re, time, urllib.request, urllib.parse, os
UA = {'User-Agent': 'ChurchHistoryApp/1.0 (educational offline reader)'}
R = '/home/user/church/img/'
Q = {"i-1": "Palestine ancient Israel tribes map", "i-6": "Palestine time of Christ map", "ii-4": "Jerusalem ancient plan map",
     "ii-5": "travels of St. Paul map", "iii-10": "Roman empire map ancient", "v-1": "Asia map 1700", "vii-5": "Byzantine empire map",
     "viii-1": "Europe Charlemagne map", "x-4": "crusades map", "xi-2": "Germany 1550 map", "xii-4": "America 1600 map",
     "xiii-2": "Russia map 1700", "ix-3": "Constantinople map", "xiv-4": "Africa map 1800 missions"}
out = {}
def get(u, js=True):
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=40) as r:
                b = r.read(); return json.loads(b) if js else b
        except Exception: time.sleep(4)
for ch, q in Q.items():
    d = get('https://www.loc.gov/maps/?' + urllib.parse.urlencode({'q': q, 'fo': 'json', 'c': 8}))
    for r in (d or {}).get('results', []):
        urls = r.get('image_url') or []
        best = None
        for u in urls:
            m = re.search(r'#h=(\d+)&w=(\d+)', u)
            if m and 600 <= int(m.group(2)) <= 1600 and (not best or int(m.group(2)) > best[1]): best = (u.split('#')[0], int(m.group(2)))
        if not best: continue
        b = get(best[0], js=False)
        if b and len(b) > 8000:
            p = R + 'raw_m/map_' + ch + '.bin'; open(p, 'wb').write(b)
            out[ch] = {'museum': 'Library of Congress', 'img': best[0], 'title': r.get('title', ''), 'artist': ', '.join(r.get('contributor') or [])[:90], 'date': r.get('date', ''),
                       'url': r.get('id', ''), 'lic': 'No known restrictions (Library of Congress)', 'local': p}
            print(ch, '|', r.get('title', '')[:90], r.get('date', ''), flush=True); break
    time.sleep(1)
json.dump(out, open(R + 'maps.json', 'w'))
