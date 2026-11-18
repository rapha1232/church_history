"""Catholic Mass readings (cpbjr/catholic-readings-api, MIT; references only) and the Orthodox (OCA) lectionary
(brianglass/orthocal, MIT) -> site/bible/lect2.js"""
import json, os, sqlite3, glob
R = '/home/user/church/'
D = R + 'dl/lect2/'
cath = {}
for f in sorted(glob.glob(D + 'catholic-readings-api/readings/*/*.json')):
    j = json.load(open(f, encoding='utf-8'))
    r = j.get('readings', {}); date = j.get('date')
    cf = D + 'catholic-readings-api/liturgical-calendar/%s/%s' % (date[:4], os.path.basename(f))
    cel = ''
    if os.path.exists(cf):
        c = json.load(open(cf, encoding='utf-8')).get('celebration') or {}
        cel = c.get('name') or ''
        if c.get('type'): cel += '|' + c['type']
    cath[date] = [j.get('season', ''), cel, r.get('firstReading', ''), r.get('psalm', ''), r.get('secondReading', ''), r.get('gospel', ''), r.get('alleluia', '')]
db = sqlite3.connect(D + 'orthocal/oca_calendar.db')
per = {}
for p, b, disp, sd in db.execute('select pericope, book, display, sdisplay from pericopes'): per[b + '|' + p] = sd or disp
rd = [[m, d, pd, src or '', desc or '', per.get((bk or '') + '|' + (pc or ''), ''), o] for m, d, pd, src, desc, bk, pc, o in
      db.execute('select month, day, pdist, source, desc, book, pericope, ordering from readings')]
days = [[pd, m, d, t or '', st or '', fn or '', fl, sa or '', fa] for pd, m, d, t, st, fn, fl, sa, fa in
        db.execute('select pdist, month, day, title, subtitle, feast_name, feast_level, saint, fast from days')]
comp = {n: r for n, r in db.execute('select composite_num, reading from composites')}
out = {'cath': cath, 'orth': {'r': rd, 'd': days}}
s = '__LECT2(%s);' % json.dumps(out, ensure_ascii=False, separators=(',', ':'))
open(R + 'site/bible/lect2.js', 'w', encoding='utf-8').write(s)
print('catholic days', len(cath), min(cath), max(cath), 'orthodox readings', len(rd), 'days', len(days), 'KB', len(s.encode()) // 1024)
