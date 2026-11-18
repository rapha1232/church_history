"""Edition 7 'The Series' layer: seasons, episodes, cold opens, shelves, up-next.
Runs on site/index.html after build_media.py (in place)."""
import json, re, html as H
R = '/home/user/church/'
P = R + 'site/index.html'
h = open(P, encoding='utf-8').read()
if 'class="billboard' in h: raise SystemExit('already applied')

ROM = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii', 'xiii', 'xiv', 'xv']
SPECIAL = {'p3': 'Part III', 'p4': 'Part IV'}
i = h.index('window.__IMG__=') + 15; IMG = json.loads(h[i:h.index(';</script>', i)])
i = h.index('window.__DATA__=') + 16; j = h.index('</script>', i); D = json.loads(h[i:j].rstrip().rstrip(';'))
order = D['order']

def text(s):
    s = re.sub(r'<(button|sup|figure|figcaption|script|style)\b.*?</\1>', ' ', s, flags=re.S)
    return re.sub(r'\s+', ' ', H.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()
def syn(body, n=210):
    for p in re.findall(r'<p(?:\s+class="lede")?>(.*?)</p>', body, re.S):
        t = text(p)
        if len(t) < 60: continue
        out = ''
        for s in re.split(r'(?<=[.!?])\s+(?=[A-Z“"(])', t):
            if out and len(out) + len(s) > n: break
            out = (out + ' ' + s).strip()
        if len(out) > n + 40: out = out[:n].rsplit(' ', 1)[0] + '…'
        return re.sub(r'\s+([.,;:])', r'\1', out)
    return ''
def esc(s): return H.escape(s or '', quote=True)
def src(im): return IMG[im]['src'] if im in IMG else ''
def col(im): return IMG[im]['c'] if im in IMG else '#20232c'

arts = {}
for m in re.finditer(r'<article id="([^"]+)"([^>]*)>(.*?)</article>', h, re.S):
    a = dict(re.findall(r'data-([a-z]+)="([^"]*)"', m.group(2)))
    a['id'] = m.group(1); a['body'] = m.group(3); a['span'] = m.span()
    h2 = re.search(r'<h2[^>]*>(.*?)</h2>', a['body'], re.S); a['h2'] = text(h2.group(1)) if h2 else a.get('title', '')
    hero = re.search(r'<figure class="hero">.*?data-img="([^"]+)".*?</figure>', a['body'], re.S)
    a['hero'] = hero.group(1) if hero else None
    anyimg = re.search(r'data-img="([^"]+)"', a['body'])
    a['img'] = a['hero'] or (anyimg.group(1) if anyimg else None)
    a['min'] = max(2, round(len(text(a['body']).split()) / 230))
    a['syn'] = syn(a['body'])
    arts[a['id']] = a

# ---- seasons & episodes
seasons = []
for code in ROM + list(SPECIAL):
    v = arts.get('vol-' + code)
    if not v: continue
    eps = [arts[x] for x in order if x in arts and arts[x].get('vol') == code and arts[x].get('kind') != 'vol']
    n = 0
    for e in eps:
        if e.get('kind') or e['id'].endswith('-other'): e['elabel'] = 'Bonus'; e['enum'] = None
        else: n += 1; e['enum'] = n; e['elabel'] = 'Episode %d' % n
    sp = code in SPECIAL
    snum = None if sp else ROM.index(code) + 1
    lede = re.search(r'<p class="lede">(.*?)</p>', v['body'], re.S)
    yrs = re.search(r'<p class="eyebrow">[^<]*?·\s*([^<]+)</p>', v['body'])
    pool = [e['hero'] for e in eps if e['hero'] and IMG.get(e['hero'], {}).get('iw', 0) >= 500]
    pool = list(dict.fromkeys(([v['hero']] if v['hero'] else []) + pool))
    pool.sort(key=lambda x: -min(IMG[x].get('iw', 0), 900) * (1.0 if IMG[x].get('iw', 0) >= IMG[x].get('ih', 1) else 0.8))
    s = {'code': code, 'id': v['id'], 'n': snum, 'sp': sp, 'label': SPECIAL[code] if sp else 'Season %d' % snum,
         'short': SPECIAL[code] if sp else 'S%d' % snum, 'title': v['h2'], 'yrs': (yrs.group(1).strip() if yrs else ''),
         'lede': text(lede.group(1)) if lede else v['syn'], 'eps': eps, 'pool': pool[:6],
         'min': sum(e['min'] for e in eps)}
    for e in eps:
        e['season'] = s
        e['tag'] = (s['short'] + ' · ' + ('E%d' % e['enum'] if e['enum'] else 'Bonus')) if not sp else (re.sub(r'.*·\s*', '', text(re.search(r'<p class="eyebrow">(.*?)</p>', e['body']).group(1))) if '<p class="eyebrow">' in e['body'] else 'Special')
    seasons.append(s)
S = {s['id']: s for s in seasons}
EP = {e['id']: e for s in seasons for e in s['eps']}

def thumb(im, cls='', eager=False, inner=''):
    if not im: return '<span class="th none %s" aria-hidden="true">%s</span>' % (cls, inner)
    return '<span class="th %s" style="background:%s"><img src="%s" alt="" decoding="async"%s>%s</span>' % (cls, col(im), src(im), '' if eager else ' loading="lazy"', inner)
def epcard(e, cls='ep'):
    s = e['season']
    num = e['tag'] if s['sp'] else ('E%d' % e['enum'] if e['enum'] else 'Bonus')
    return ('<a class="%s" href="#%s" data-epid="%s">%s'
            '<span class="epbody"><span class="epmeta">%s · %d min</span><span class="eptitle">%s</span><span class="epsyn">%s</span></span>'
            '<span class="epbar" aria-hidden="true"><i></i></span></a>') % (
        cls, e['id'], e['id'], thumb(e['img'] or (s['pool'][0] if s['pool'] else None), inner='<span class="epnum">%s</span><span class="epplay" aria-hidden="true"></span>' % esc(num)), esc(e.get('period') and ('c. ' + e['period'].replace('-', '–')) or s['short']), e['min'], esc(e['title']), esc(e['syn']))
def poster(s):
    im = s['pool'][0] if s['pool'] else None
    big = s['code'].upper() if not s['sp'] else s['label'].split()[-1]
    return ('<a class="poster" href="#%s" data-season="%s">%s<span class="pnum" aria-hidden="true">%s</span><span class="pbody"><span class="pk">%s</span>'
            '<span class="pt">%s</span><span class="pm">%s · %d episodes</span></span><span class="pring" aria-hidden="true"><i></i></span></a>') % (
        s['id'], s['id'], thumb(im), esc(big), esc(s['label']), esc(s['title']), esc(s['yrs'] or 'Companion series'), len(s['eps']))
def words(t):
    return ''.join('<span class="w"><span style="--i:%d">%s</span></span> ' % (k, esc(w)) for k, w in enumerate(t.split())).strip()
def slides(pool, cls='slides'):
    return '<div class="%s" aria-hidden="true">%s</div>' % (cls, ''.join(
        '<img class="%s" src="%s" alt="" decoding="async"%s style="--c:%s">' % ('on' if k == 0 else '', src(im), '' if k == 0 else ' loading="lazy"', col(im)) for k, im in enumerate(pool)))
PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg>'
ENL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>'

repl = {}
# ---- episodes: cold open + up next
for e in EP.values():
    b = e['body']; s = e['season']
    ey = re.search(r'\s*<p class="eyebrow">.*?</p>\s*<h2[^>]*>.*?</h2>', b, re.S)
    if not ey: continue
    rest = b[ey.end():]
    ds = re.match(r'\s*(<div class="docstrip">.*?</div>)', rest, re.S); dsh = ''
    if ds: dsh = ds.group(1); rest = rest[ds.end():]
    cap = ''
    fh = re.match(r'\s*<figure class="hero">.*?</figure>', rest, re.S)
    if fh:
        f = fh.group(0); rest = rest[fh.end():]
        cb = re.search(r'<figcaption><span><b>(.*?)</b>', f, re.S); cr = re.search(r'<span class="credit">(.*?)</span>', f, re.S)
        cap = '<button type="button" class="co-enl" data-img="%s" aria-label="Enlarge: %s">%s<span><b>%s</b>%s</span></button>' % (
            e['hero'], esc(text(cb.group(1)) if cb else ''), ENL, cb.group(1) if cb else '', (' · ' + cr.group(1)) if cr else '')
    k = order.index(e['id']); prev = next((x for x in reversed(order[:k]) if x in EP or x in S), None)
    prevh = ''
    if prev in EP: prevh = '<span class="co-prev">Previously: <a href="#%s">%s</a></span>' % (prev, esc(arts[prev]['title']))
    numbered = [x for x in s['eps'] if x['enum']]
    fin = bool((not s['sp']) and numbered and e is numbered[-1])
    kick = ('<span>%s</span><span>%s</span>' % (s['label'], e['elabel'])) if not s['sp'] else '<span>%s</span><span>%s</span>' % (s['label'], esc(e['tag']))
    if fin: kick += '<span class="fin">Season finale</span>'
    per = ('c. ' + e['period'].replace('-', '–')) if e.get('period') else s['yrs']
    hi = IMG.get(e['hero']) or {}
    wide = bool(hi) and hi.get('iw', 0) >= 850 and hi.get('iw', 0) / max(1, hi.get('ih', 1)) >= 1.25
    mode = ' plain' if not e['hero'] else (' wide' if wide else '')
    co = ('<header class="coldopen bleed%s">' % mode +
          ('<div class="co-bg" style="background:%s"><img src="%s" alt="" decoding="async"></div>%s' % (col(e['hero']), src(e['hero']),
              '' if wide else '<div class="co-plate" style="aspect-ratio:%d/%d"><img src="%s" alt="%s" decoding="async"></div>' % (hi.get('iw', 4), hi.get('ih', 3), src(e['hero']), esc(hi.get('alt') or hi.get('t', '')))) if e['hero'] else
           '<div class="co-bg"><span class="co-big" aria-hidden="true">%s</span></div>' % esc(s['code'].upper() if not s['sp'] else e['tag'].split()[-1])) +
          '<div class="co-bars" aria-hidden="true"></div><div class="co-in">'
          '<p class="co-kick">%s</p><h2 class="co-title">%s</h2>'
          '<p class="co-meta"><span>%s</span><span>%d min</span>%s</p>'
          '<p class="co-syn">%s</p>'
          '<div class="co-act"><button type="button" class="btn-play" data-start>%s<span>Start episode</span></button>%s</div>'
          '</div>%s</header>') % (kick, words(e['h2']), esc(per), e['min'], prevh, esc(e['syn']), PLAY, dsh.replace('<span>Full text</span>', ''), cap)
    # up next
    nx = next((x for x in order[k + 1:] if x in EP or x in S), None)
    up = ''
    if nx:
        if nx in S:
            ns = S[nx]; im = ns['pool'][0] if ns['pool'] else None
            lab = ('Next season · ' + ns['label']) if not ns['sp'] else ('Up next · ' + ns['label'])
            t, sy, href = ns['title'], ns['lede'][:200].rsplit(' ', 1)[0] + '…' if len(ns['lede']) > 200 else ns['lede'], nx
        else:
            ne = EP[nx]; im = ne['img']; lab = 'Up next · ' + ne['tag']; t, sy, href = ne['title'], ne['syn'], nx
        up = ('<aside class="upnext" data-next="%s" aria-label="Up next"><a class="un-card" href="#%s">%s<span class="un-body"><span class="un-k">%s</span>'
              '<span class="un-t">%s</span><span class="un-s">%s</span></span></a><div class="un-act"><a class="btn-play" href="#%s">%s<span>Play now</span></a>'
              '<span class="un-count" hidden><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="16"/><circle class="r" cx="18" cy="18" r="16"/></svg><b></b></span>'
              '<button type="button" class="un-cancel" hidden>Stay here</button>%s</div></aside>') % (
            href, href, thumb(im, 'un-th'), esc(lab), esc(t), esc(sy), href, PLAY,
            ('<a class="un-prev" href="#%s">← Previous</a>' % prev) if prev else '')
    nb = '\n' + co + rest
    nb = nb.rstrip() + up + '\n'
    repl[e['id']] = (nb, ' data-ep="%s" data-min="%d"' % (esc(e['tag']), e['min']))

# ---- season openers
for s in seasons:
    v = arts[s['id']]; b = v['body']
    ey = re.search(r'\s*<p class="eyebrow">.*?</p>\s*<h2[^>]*>.*?</h2>', b, re.S)
    rest = b[ey.end():]
    rest = re.sub(r'^\s*<figure class="hero">.*?</figure>', '', rest, count=1, flags=re.S)
    rest = re.sub(r'<p class="lede">.*?</p>', '', rest, count=1, flags=re.S)
    rest = re.sub(r'<div class="key"><h4>In this volume</h4>.*?</div>', '', rest, count=1, flags=re.S)
    first = next((e for e in s['eps'] if e['enum']), s['eps'][0] if s['eps'] else None)
    big = s['code'].upper() if not s['sp'] else s['label'].split()[-1]
    hd = ('<header class="season bleed">%s<div class="co-bars" aria-hidden="true"></div><span class="s-num" aria-hidden="true">%s</span><div class="co-in">'
          '<p class="co-kick"><span>%s</span><span>%s</span></p><h2 class="co-title">%s</h2>'
          '<p class="co-meta"><span>%d episodes</span><span>%s</span></p><p class="co-syn">%s</p>'
          '<div class="co-act">%s<a class="btn-ghost" href="#home" data-shelf="%s">All seasons</a></div></div></header>') % (
        slides(s['pool']) if s['pool'] else '<div class="slides"></div>', esc(big), esc(s['label']), esc(s['yrs'] or 'Companion series'), words(s['title']),
        len(s['eps']), ('%d h %02d min' % (s['min'] // 60, s['min'] % 60)) if s['min'] >= 60 else '%d min' % s['min'], esc(s['lede']),
        ('<a class="btn-play" href="#%s">%s<span>Play %s</span></a>' % (first['id'], PLAY, 'episode 1' if first['enum'] else 'first study')) if first else '', s['id'])
    eps = '<section class="eplist" aria-label="Episodes"><h3 class="shelf-h">Episodes</h3><div class="epgrid">%s</div></section>' % ''.join(epcard(e) for e in s['eps'])
    repl[s['id']] = ('\n' + hd + eps + rest, ' data-season="%s"' % esc(s['label']))

# ---- home: billboard + shelves
home = arts['home']
bb_slides = [s for s in seasons if s['pool']]
bb = ('<section class="billboard bleed" aria-label="Featured seasons" aria-roledescription="carousel">' +
      '<div class="bb-media" aria-hidden="true">%s</div><div class="co-bars" aria-hidden="true"></div>' % ''.join(
          '<img class="%s" src="%s" alt="" decoding="async"%s style="--c:%s">' % ('on' if k == 0 else '', src(s['pool'][0]), '' if k < 2 else ' loading="lazy"', col(s['pool'][0])) for k, s in enumerate(bb_slides)) +
      '<div class="co-in"><p class="bb-brand">The History of the Christian Church <span>· a story in fifteen seasons</span></p>' +
      '<div class="bb-slides">%s</div>' % ''.join(
          ('<div class="bb-s%s" data-k="%d"%s><p class="co-kick"><span>%s</span><span>%s</span></p><h2 class="co-title">%s</h2><p class="co-syn">%s</p>'
           '<div class="co-act"><a class="btn-play" href="#%s">%s<span>Play %s</span></a><a class="btn-ghost" href="#%s">Episodes</a></div></div>') % (
              ' on' if k == 0 else '', k, '' if k == 0 else ' hidden', esc(s['label']), esc(s['yrs'] or 'Companion series'), words(s['title']),
              esc(s['lede'][:230].rsplit(' ', 1)[0] + '…' if len(s['lede']) > 230 else s['lede']),
              (next((e for e in s['eps'] if e['enum']), s['eps'][0]))['id'], PLAY, (s['short'] + ' E1') if not s['sp'] else 'first study', s['id'])
          for k, s in enumerate(bb_slides)) +
      '<div class="bb-dots" role="tablist" aria-label="Choose a season">%s</div></div>' % ''.join(
          '<button type="button" role="tab" data-k="%d" aria-label="%s"%s><i></i></button>' % (k, esc(s['label']), ' aria-selected="true"' if k == 0 else '') for k, s in enumerate(bb_slides)) +
      '<button type="button" class="bb-resume" id="bbResume" hidden></button></section>')
EXTRAS = [('ref-timeline', 'Master chronology'), ('ref-gallery', 'Image atlas'), ('ref-councils', 'The councils'), ('ref-people', 'People'),
          ('ref-atlas', 'Atlas'), ('ref-texts', 'Full texts'), ('ref-churches', 'Churches today'), ('ref-myths', 'Myths & misconceptions')]
EXIMG = {'ref-timeline': 'medcd5f7e8', 'ref-gallery': 'm8d547b0ff', 'ref-councils': 'mbb99b28cd', 'ref-atlas': 'm359608290', 'ref-texts': 'ie90c9f4de'}
def extra(i, t):
    im = EXIMG.get(i) or arts[i]['img']
    return '<a class="xcard" href="#%s">%s<span>%s</span></a>' % (i, thumb(im), esc(t))
shelves = ('<div class="shelves bleed">'
           '<section class="shelf" id="shCont" hidden><div class="shelf-top"><h3 class="shelf-h">Continue reading</h3></div><div class="row"></div></section>'
           '<section class="shelf"><div class="shelf-top"><h3 class="shelf-h">Seasons</h3><div class="sh-nav"><button type="button" data-sh="-1" aria-label="Scroll left">‹</button><button type="button" data-sh="1" aria-label="Scroll right">›</button></div></div>'
           '<div class="row posters">%s</div></section>' % ''.join(poster(s) for s in seasons) +
           '<section class="shelf" id="shEps"><div class="shelf-top"><h3 class="shelf-h">Episodes</h3><div class="sh-nav"><button type="button" data-sh="-1" aria-label="Scroll left">‹</button><button type="button" data-sh="1" aria-label="Scroll right">›</button></div></div>'
           '<div class="schips" role="tablist" aria-label="Season">%s</div><div class="row eprow"></div></section>' % ''.join(
               '<button type="button" role="tab" class="chip" data-s="%s"%s>%s</button>' % (s['id'], ' aria-selected="true"' if k == 0 else '', esc(s['short'].replace('S', 'Season ') if not s['sp'] else s['label'])) for k, s in enumerate(seasons)) +
           '<section class="shelf"><div class="shelf-top"><h3 class="shelf-h">Extras</h3></div><div class="row xrow">%s</div></section>' % ''.join(extra(i, t) for i, t in EXTRAS if i in arts) +
           '<p class="shelf-h about-h">About this edition</p></div>')
hb = home['body']
k = hb.index('<div class="cover">')
repl['home'] = ('\n' + bb + shelves + hb[k:], '')

# ---- apply (back to front)
for aid in sorted(repl, key=lambda x: arts[x]['span'][0], reverse=True):
    a = arts[aid]; nb, attrs = repl[aid]
    s0, s1 = a['span']; whole = h[s0:s1]
    opentag = whole[:whole.index('>')] + attrs + '>'
    h = h[:s0] + opentag + nb + '</article>' + h[s1:]

EPJ = {e['id']: {'s': e['season']['id'], 't': e['title'], 'g': e['tag'], 'm': e['min'], 'i': e['img'] or '', 'y': e['syn']} for e in EP.values()}
SJ = [{'id': s['id'], 'l': s['label'], 'sh': s['short'], 't': s['title'], 'e': [e['id'] for e in s['eps']]} for s in seasons]
css = open(R + 'tools/series.css', encoding='utf-8').read()
js = open(R + 'tools/series.js', encoding='utf-8').read()
h = h.replace('</style>\n</head>', css + '</style>\n</head>', 1)
k = h.rindex('</body>')
h = h[:k] + '<div class="cut" id="cut" aria-hidden="true"><span></span></div><div class="nowbar" id="nowbar" aria-hidden="true"><i></i></div>' \
    '<button type="button" class="nowpill" id="nowpill" hidden><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15"/><circle class="r" cx="18" cy="18" r="15"/></svg><span></span></button>' \
    '<script>window.__EP__=' + json.dumps(EPJ, ensure_ascii=False, separators=(',', ':')) + ';window.__SEASONS__=' + json.dumps(SJ, ensure_ascii=False, separators=(',', ':')) + \
    ';</script><script>' + js + '</script>\n' + h[k:]
h = h.replace('<small>Edition 6 · Illustrated</small>', '<small>Edition 7 · The Series</small>')
h = h.replace('A historical encyclopedia · Edition 6 · Illustrated', 'A historical encyclopedia · Edition 7 · The Series')
open(P, 'w', encoding='utf-8').write(h)
print('seasons', len(seasons), 'episodes', len(EP), 'coldopens', sum(1 for x in repl if x in EP))
