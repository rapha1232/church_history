"""Edition 12 layer: key takeaways, season timeline strips, enriched documents (search lives in v12.js)."""
import json, re, html as H, sys
sys.path.insert(0, '/home/user/church/tools')
import v12data as V
R = '/home/user/church/'
PATH = R + 'site/index.html'
h = open(PATH, encoding='utf-8').read()
if 'class="takeaways"' in h: raise SystemExit('extras4 already applied')
def esc(s): return H.escape(s or '', quote=True)
def text(s):
    s = re.sub(r'<(button|sup|figure|cite)\b.*?</\1>', ' ', s, flags=re.S)
    return re.sub(r'\s+([.,;:])', r'\1', re.sub(r'\s+', ' ', H.unescape(re.sub(r'<[^>]+>', ' ', s)))).strip()
i = h.index('window.__EP__=') + 14; EP = json.loads(h[i:h.index(';window.__SEASONS__', i)])
i = h.index('window.__SEASONS__=') + 19; SE = json.loads(h[i:h.index(';</script>', i)])
PER = {m.group(1): m.group(2) for m in re.finditer(r'<article id="([^"]+)"[^>]*data-period="([^"]*)"', h)}
def span(p):
    n = [int(x) for x in re.findall(r'-?\d+', (p or '').replace('–', '-').replace('- ', '-'))]
    if not n: return None
    a = n[0]; b = n[1] if len(n) > 1 else n[0]
    if b < a and len(str(b)) < len(str(a)): b = int(str(a)[:len(str(a)) - len(str(b))] + str(b))
    return (a, max(a, b))
def first_sentences(t, n=1, minlen=50):
    ss = re.split(r'(?<=[.!?])\s+(?=[A-Z“"(])', t); out = ''
    for s in ss:
        out = (out + ' ' + s).strip()
        if len(out) >= minlen: n -= 1
        if n <= 0: break
    return out if len(out) <= 320 else out[:300].rsplit(' ', 1)[0] + '…'

# ---------- season strips ----------
def strip(s, cur=None):
    eps = [(e, span(PER.get(e))) for e in s['e']]
    eps = [(e, sp) for e, sp in eps if sp]
    if len(eps) < 2: return ''
    lo = min(sp[0] for _, sp in eps); hi = max(sp[1] for _, sp in eps); W = max(1, hi - lo)
    rows = ''; lanes = []
    for k, (e, (a, b)) in sorted(enumerate(eps), key=lambda x: x[1][1][0]):
        left = (a - lo) / W * 100; wid = max(5.5, (b - a) / W * 100)
        if left + wid > 100: left = 100 - wid
        for ln, end in enumerate(lanes):
            if end + 0.8 <= left: lanes[ln] = left + wid; break
        else:
            lanes.append(left + wid); ln = len(lanes) - 1
        rows += '<a class="ss-b%s" href="#%s" style="left:%.2f%%;width:%.2f%%;top:%dpx" title="%s · %s"><span>%s</span></a>' % (
            ' cur' if e == cur else '', e, left, wid, ln * 18, esc(EP[e]['g'] + ' ' + EP[e]['t']), esc(PER.get(e, '')), esc(EP[e]['g'].split('·')[-1].strip()))
    nl = len(lanes)
    def fy(y): return '%d BC' % -y if y < 0 else str(y)
    return ('<figure class="sstrip"><figcaption class="shelf-h">%s at a glance</figcaption><div class="ss-track" style="height:%dpx">%s</div><div class="ss-ax"><span>%s</span><span>%s</span></div></figure>') % (
        esc(s['l']), nl * 18 + 6, rows, fy(lo), fy(hi))

# ---------- key takeaways ----------
def takeaways(body):
    b = re.sub(r'<blockquote.*?</blockquote>|<header class="coldopen.*?</header>|<section class="(?:notes|deeper|cast)[^"]*".*?</section>|<aside.*?</aside>|<figure.*?</figure>', '', body, flags=re.S)
    pts = []
    hs = [m for m in re.finditer(r'<h3 id="[^"]+">(.*?)</h3>', b, re.S)]
    for n, m in enumerate(hs):
        seg = b[m.end(): hs[n + 1].start() if n + 1 < len(hs) else len(b)]
        pm = re.search(r'<p>(.*?)</p>', seg, re.S)
        if not pm: continue
        t = text(pm.group(1))
        if len(t) > 40: pts.append((text(m.group(1)), first_sentences(t)))
        if len(pts) == 3: break
    if len(pts) < 3:
        for m in re.finditer(r'<p>(.*?)</p>', b, re.S):
            t = text(m.group(1))
            if len(t) < 60: continue
            s = first_sentences(t)
            if all(s != x[1] for x in pts): pts.append(('', s))
            if len(pts) == 3: break
    if not pts: return ''
    return '<aside class="takeaways" aria-label="Key takeaways"><p class="shelf-h">Key takeaways</p><ol>%s</ol></aside>' % ''.join(
        '<li>%s%s</li>' % ('<b>%s.</b> ' % esc(t.rstrip('.?')) if t else '', esc(s)) for t, s in pts)

season_of = {e: s for s in SE for e in s['e']}
cnt = 0
def rew(m):
    global cnt
    aid, attrs, body = m.group(1), m.group(2), m.group(3)
    if aid in EP:
        add = takeaways(body) + strip(season_of[aid], aid) if aid in season_of else takeaways(body)
        k = body.find('<aside class="upnext"')
        if k < 0: k = len(body)
        body = body[:k] + add + body[k:]; cnt += 1
    elif any(s['id'] == aid for s in SE):
        s = [x for x in SE if x['id'] == aid][0]
        k = body.find('</section>', body.find('<section class="eplist"')) + 10
        if k > 9: body = body[:k] + strip(s) + body[k:]
    return '<article id="%s"%s>%s</article>' % (aid, attrs, body)
h = re.sub(r'<article id="([^"]+)"([^>]*)>(.*?)</article>', rew, h, flags=re.S)

# ---------- documents: context, reception, related ----------
TITLES = {m.group(1): H.unescape(m.group(2)) for m in re.finditer(r'id="text-([^"]+)"[^>]*data-title="([^"]*)"', h)}
def docmore(m):
    did = m.group(1); seg = m.group(0)
    if did not in V.DOCX: return seg
    ctx, rec, rel = V.DOCX[did]
    more = ('<div class="docmore"><h5>What it answered</h5><p>%s</p><h5>How it was received</h5><p>%s</p>%s</div>') % (
        esc(ctx), esc(rec), ('<h5>Related documents</h5><p class="docrel">%s</p>' % ' '.join('<button type="button" class="txtbtn sm" data-doc="%s">%s</button>' % (r, esc(TITLES.get(r, r))) for r in rel if r in TITLES)) if rel else '')
    return seg.replace('<p class="src">', more + '<p class="src">', 1)
out, pos = [], 0
for m in re.finditer(r'id="text-([^"]+)"', h):
    did = m.group(1)
    if did not in V.DOCX: continue
    a0 = h.find('<div class="docintro">', m.end()); a1 = h.find('<p class="src">', a0); a2 = h.find('</div>', a0)
    if a0 < 0 or a1 < 0 or a1 > a2: continue
    ctx, rec, rel = V.DOCX[did]
    more = ('<div class="docmore"><h5>What it answered</h5><p>%s</p><h5>How it was received</h5><p>%s</p>%s</div>') % (
        esc(ctx), esc(rec), ('<h5>Related documents</h5><p class="docrel">%s</p>' % ' '.join('<button type="button" class="txtbtn sm" data-doc="%s">%s</button>' % (r, esc(TITLES.get(r, r))) for r in rel if r in TITLES)) if rel else '')
    out.append(h[pos:a1]); out.append(more); pos = a1
out.append(h[pos:]); h = ''.join(out)

css = open(R + 'tools/v12.css', encoding='utf-8').read(); js = open(R + 'tools/v12.js', encoding='utf-8').read()
h = h.replace('</style>\n</head>', css + '</style>\n</head>', 1)
k = h.rindex('</body>')
h = h[:k] + '<script>' + js + '</script>\n' + h[k:]
h = h.replace('Edition 10 · The Series', 'Edition 11 · The Series')
open(PATH, 'w', encoding='utf-8').write(h)
print('takeaways', cnt, 'docs enriched', h.count('class="docmore"'), 'html MB', round(len(h.encode()) / 1e6, 2))
