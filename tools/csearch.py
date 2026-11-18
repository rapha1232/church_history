import json, os, re, time, urllib.request, urllib.parse
UA = {'User-Agent': 'ChurchHistoryApp/1.0 (educational offline reader)'}
R = '/home/user/church/img/'
os.makedirs(R + 'raw_c', exist_ok=True)
Q = {'Oxyrhynchus Papyri': 'Oxyrhynchus papyrus', 'Great Isaiah Scroll': 'Great Isaiah Scroll', 'Alexander of Alexandria': 'Alexander of Alexandria saint icon',
 'Eusebius of Nicomedia': 'Eusebius of Nicomedia', "Xi'an Stele": 'Nestorian Stele Xian', 'Jacob Baradaeus': 'Jacob Baradaeus', 'Miaphysitism': 'Coptic icon Christ',
 'Dioscorus I of Alexandria': 'Dioscorus Alexandria', 'Basilica of the Virgin Mary, Ephesus': 'Church of Mary Ephesus ruins', 'Maximus the Confessor': 'Maximus the Confessor icon',
 'Anabaptism': 'Anabaptist martyrs mirror', 'Azusa Street Revival': 'Azusa Street mission', 'Christian denomination': 'church denominations', 'Gelasian doctrine': 'Pope Gelasius I',
 'Thirty-nine Articles': 'Thirty-nine Articles 1571', 'Lambeth Conference': 'Lambeth Conference bishops', 'Timothy I (Church of the East)': 'Timothy I patriarch Church of the East',
 'Patriarch Sergius I of Constantinople': 'Sergius Patriarch Constantinople', 'Peter III of Antioch': 'Peter III Antioch', 'John I of Antioch': 'John of Antioch 431',
 'Marcellus of Ancyra': 'Marcellus of Ancyra', 'Babai the Great': 'Babai the Great', 'Apollinarius of Laodicea': 'Apollinaris of Laodicea', 'Valentinus (Gnostic)': 'Valentinus gnostic', 'Novatian': 'Novatian antipope'}
O = R + 'csearch.json'
out = json.load(open(O)) if os.path.exists(O) else {}
def get(u, js=True):
    back = 30
    for i in range(14):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60) as r:
                b = r.read(); ct = r.headers.get('Content-Type', '')
                if js: return json.loads(b)
                return b if ct.startswith('image/') else None
        except urllib.error.HTTPError as e:
            if e.code == 429: print('429', back, flush=True); time.sleep(back); back = min(back * 2, 600); continue
            return None
        except Exception: time.sleep(10)
for t, q in Q.items():
    if t in out: continue
    d = get('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({'action': 'query', 'list': 'search', 'srsearch': q + ' filetype:bitmap', 'srnamespace': 6, 'srlimit': 6, 'format': 'json'}))
    files = [x['title'][5:] for x in ((d or {}).get('query') or {}).get('search', [])]
    time.sleep(45)
    info = {}
    if files:
        d2 = get('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({'action': 'query', 'titles': '|'.join('File:' + f for f in files), 'prop': 'imageinfo', 'iiprop': 'extmetadata|size', 'format': 'json'}))
        for p in ((d2 or {}).get('query') or {}).get('pages', {}).values():
            ii = (p.get('imageinfo') or [{}])[0]; md = ii.get('extmetadata') or {}
            v = lambda k: re.sub('<[^>]+>', '', (md.get(k) or {}).get('value', ''))[:300]
            info[p['title'][5:]] = {'lic': v('LicenseShortName'), 'artist': v('Artist'), 'desc': v('ImageDescription'), 'obj': v('ObjectName'), 'date': v('DateTimeOriginal'), 'w': ii.get('width'), 'h': ii.get('height')}
        time.sleep(45)
    cands = []
    for f in files[:4]:
        m = info.get(f, {})
        if not re.search(r'public domain|^pd|cc0|cc[ -]by|attribution', m.get('lic', ''), re.I): continue
        b = get('https://commons.wikimedia.org/w/thumb.php?' + urllib.parse.urlencode({'f': f, 'w': 900}), js=False)
        time.sleep(4)
        if b:
            p = R + 'raw_c/' + re.sub(r'[^A-Za-z0-9._-]', '_', f)[:90] + '.bin'; open(p, 'wb').write(b)
            cands.append(dict(m, file=f, local=p))
    out[t] = cands; json.dump(out, open(O, 'w'), ensure_ascii=False)
    print(time.strftime('%T'), len(cands), t, flush=True)
print('csearch done', flush=True)
