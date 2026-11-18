"""Words of Jesus (red letters) from eBible USFM \\wj markers, as character ranges in our verse texts -> site/bible/wj.js"""
import json, re, os, glob
R = '/home/user/church/'
NT = 'MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV'.split()
OURS = 'MAT MAR LUK JOH ACT ROM 1CO 2CO GAL EPH PHI COL 1TH 2TH 1TI 2TI TIT PHM HEB JAM 1PE 2PE 1JO 2JO 3JO JUD REV'.split()
U2B = dict(zip(NT, OURS))
def vpl(src):
    d = {}
    for line in open(R + 'bible/raw/%s/%s_vpl.txt' % (src, src), encoding='utf-8'):
        m = re.match(r'^(\w{3}) (\d+):(\d+) (.*)$', line.rstrip('\n'))
        if m: d[(m.group(1), int(m.group(2)), int(m.group(3)))] = m.group(4).replace('¶', '').replace('\xa0', ' ').strip()
    return d
def segments(text):
    """Return list of (plain_text, is_wj) segments for one verse of USFM."""
    t = re.sub(r'\\f .*?\\f\*', '', text, flags=re.S); t = re.sub(r'\\x .*?\\x\*', '', t, flags=re.S)
    t = re.sub(r'\\\+?w ([^|\\]*)\|[^\\]*\\\+?w\*', r'\1', t)      # \w word|strong="..."\w*
    t = re.sub(r'\\\+?(add|nd|qt|k|tl|sc|it|bd|em)\*?', '', t)
    parts, wj, out = re.split(r'(\\wj\*?)', t), False, []
    for p in parts:
        if p == '\\wj': wj = True; continue
        if p == '\\wj*': wj = False; continue
        p = re.sub(r'\\[a-z0-9]+\*?', ' ', p)
        if p: out.append((p, wj))
    return out
def norm(s): return re.sub(r'\s+', ' ', s).strip()
res = {}
for src, folder in (('web', 'eng-web'), ('kjv', 'eng-kjv')):
    V = vpl(folder); out = {}; ok = bad = 0
    for f in glob.glob(R + 'dl/usfm/%s/*.usfm' % folder):
        txt = open(f, encoding='utf-8').read()
        bm = re.search(r'\\id (\w{3})', txt)
        if not bm or bm.group(1) not in U2B: continue
        b = U2B[bm.group(1)]; c = 0
        for chunk in re.split(r'(\\c \d+|\\v \d+[a-z]?)', txt):
            m = re.match(r'\\c (\d+)', chunk)
            if m: c = int(m.group(1)); continue
            m = re.match(r'\\v (\d+)', chunk)
            if m: v = int(m.group(1)); continue
            if not c or '\\wj' not in chunk: continue
            segs = segments(chunk); full = norm(''.join(s for s, _ in segs)); base = V.get((b if b != 'MAR' else 'MAR', c, v))
            if base is None: continue
            # walk the segments, locating each red span in the verse text in order
            # compare without the KJV's [supplied words] brackets, keeping a map back to the original offsets
            idx = [i for i, ch in enumerate(base) if ch not in '[]']; plain = ''.join(base[i] for i in idx)
            spans, pos = [], 0
            for s, w in segs:
                s2 = norm(s).replace('[', '').replace(']', '')
                if not s2: continue
                k = plain.find(s2, pos)
                if k < 0: continue
                if w: spans.append([idx[k], idx[k + len(s2) - 1] + 1])
                pos = k + len(s2)
            if spans:
                merged = []
                for a, z in spans:
                    if merged and a - merged[-1][1] <= 2: merged[-1][1] = z
                    else: merged.append([a, z])
                out['%s%d:%d' % (b, c, v)] = merged; ok += 1
            else: bad += 1
    res[src] = out
    print(src, 'verses with red letters', ok, 'unmatched', bad)
s = '__WJ(%s);' % json.dumps(res, separators=(',', ':'))
open(R + 'site/bible/wj.js', 'w').write(s); print('KB', len(s) // 1024)
