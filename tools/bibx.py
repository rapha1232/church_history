"""Builds the HTML and data for the Bible study layer: tools strip, maps / canon / arcs articles, contested passages, window.__BIBX__."""
import json, html as H, sys
sys.path.insert(0, '/home/user/church/tools')
import bibcur as C, geo
def esc(s): return H.escape(s or '', quote=True)

# ---- maps, projected with the same regional projection as the land outline (#landR) ----
pr, br, Wr, Hr = geo.regional()
def proj(lat, lon):
    x, y = pr(lon, lat); return ((x - br[0]) * Wr / (br[2] - br[0]), (y - br[1]) * Hr / (br[3] - br[1]))
maps = []
for mid, t, s, note, pts in C.MAPS:
    P = [(n, ) + proj(la, lo) + (ref,) for n, la, lo, ref in pts]
    xs = [p[1] for p in P]; ys = [p[2] for p in P]
    w = max(xs) - min(xs); h = max(ys) - min(ys); side = max(w, h * 1.25, 28)
    cx = (max(xs) + min(xs)) / 2; cy = (max(ys) + min(ys)) / 2
    W = side * 1.35; Hh = max(h * 1.3, W * 0.62)
    vb = '%.1f %.1f %.1f %.1f' % (cx - W / 2, cy - Hh / 2, W, Hh)
    k = W / 1000
    maps.append({'id': mid, 't': t, 's': s, 'note': note, 'route': mid != 'tribes', 'vb': vb, 'fs': round(13 * k, 2), 'sw': round(3 * k, 2), 'r': round(7 * k, 2),
                 'p': [[p[0], round(p[1], 2), round(p[2], 2), p[3]] for p in P]})

tools = ('<nav class="bib-tools" id="bibTools" aria-label="Bible tools">'
         '<button type="button" data-act="search" aria-pressed="false">Search</button>'
         '<button type="button" data-act="today" aria-pressed="false">Today’s readings</button>'
         '<button type="button" data-act="plans" aria-pressed="false">Reading plans</button>'
         '<button type="button" data-act="notes" aria-pressed="false">My notes</button>'
         '<button type="button" data-act="topics" aria-pressed="false">Topics</button>'
         '<button type="button" data-act="names" aria-pressed="false">People &amp; places</button>'
         '<button type="button" data-act="harmony" aria-pressed="false">Gospel harmony</button>'
         '<button type="button" data-act="psalter" aria-pressed="false">Psalter</button>'
         '<button type="button" data-red="1" aria-pressed="false">Red letters</button>'
         '<label class="bib-cmpl"><span class="vh">Compare with</span><select id="bibCmp"></select></label>'
         '<a href="#bible-maps">Maps</a><a href="#bible-canon">How the canon formed</a><a href="#bible-arcs">Connections chart</a></nav>')

# contested passages list (for the Bible page)
trad_list = ('<details class="bib-about"><summary>Passages the churches read differently</summary><p class="cmp-note">Tap a passage to open it with the Catholic, Orthodox and Protestant readings side by side (Commentary tab).</p><ul class="tr-list">%s</ul></details>') % ''.join(
    '<li><button type="button" class="sref" data-sref="%s~%d~%d">%s %d:%d%s</button> <span>%s</span></li>' % (b, c, v1, esc(C.INTRO and {'MAT': 'Matthew', 'JOH': 'John', 'ROM': 'Romans', 'JAM': 'James', '1TI': '1 Timothy', 'LUK': 'Luke', '2MA': '2 Maccabees', '1CO': '1 Corinthians', '2TH': '2 Thessalonians', '2TI': '2 Timothy', 'EXO': 'Exodus', 'ISA': 'Isaiah', 'GEN': 'Genesis'}.get(b, b)), c, v1, ('–%d' % v2) if v2 != v1 else '', esc(title))
    for b, c, v1, v2, title, _, _ in C.TRAD)

maps_art = ('<article id="bible-maps" data-title="Bible maps" data-vol="ref" data-kind="ref" data-topics="scripture" class="wide"><p class="eyebrow">Library · Scripture</p><h2>Bible maps</h2>'
            '<p class="lede">The journeys of Abraham and the Exodus, the tribes of Israel, the ministry of Jesus and the travels of Paul. Pick a map to trace the route; tap a stop to read the passage.</p>'
            '<div class="cm-chips bm-chips" role="group" aria-label="Choose a map"></div>'
            '<div class="cm-grid"><figure class="cmap"><div class="smap-top"><h3 class="shelf-h">Route</h3><button type="button" class="mplay" data-bmplay="1" aria-label="Replay the route"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg><span>Play</span></button></div><div class="smap-svg bm-fig"></div><div class="bm-verse" aria-live="polite"></div></figure>'
            '<div class="cm-card bm-card"></div></div></article>')

reg_names = {'East': 'Greek East', 'West': 'Latin West', 'Protestant': 'Protestant', 'Catholic': 'Catholic', 'Orthodox': 'Orthodox', 'Oriental': 'Oriental Orthodox'}
V = {'Y': ('Y', 'In the canon'), 'N': ('N', 'Excluded'), 'R': ('R', 'Read, not canonical'), 'D': ('D', 'Disputed'), '': ('', 'Not mentioned')}
items = ''.join(
    '<li class="cn-item" id="cn-%d" data-reg="%s"><p class="cn-y">%s</p><div><h4>%s <span class="cn-reg">%s</span></h4><p>%s</p>%s</div></li>' % (
        k, reg, ('c. %d' % y) if y < 400 or k in (1, 2) else str(y), esc(n), esc(reg_names[reg]), esc(note),
        ('<p class="cn-v">%s</p>' % ' '.join('<span class="cv cv-%s" title="%s">%s</span>' % (vv or 'n', esc(V[vv][1]), esc(C.CANON_NAMES[b])) for b, vv in d.items() if vv)) if d else '')
    for k, (y, n, reg, note, d) in enumerate(C.CANON))
rows = ''.join('<tr data-cn="%d" data-reg="%s"><th scope="row">%s <small>%s</small></th>%s</tr>' % (
    k, reg, esc(n), ('c. %d' % y) if y < 400 else y, ''.join('<td class="cv-%s" title="%s">%s</td>' % (d.get(b, '') or 'n', esc(V[d.get(b, '')][1]), d.get(b, '') or '·') for b in C.CANON_BOOKS))
    for k, (y, n, reg, note, d) in enumerate(C.CANON))
canon_art = ('<article id="bible-canon" data-title="How the canon formed" data-vol="ref" data-kind="ref" data-topics="scripture" class="wide"><p class="eyebrow">Library · Scripture</p><h2>How the canon formed</h2>'
             '<p class="lede">No council in the first centuries handed down a list from nowhere: the churches read the books they had received, argued over a few, and slowly converged. These are the lists that mark the way, from the second century to the Reformation and beyond.</p>'
             '<div class="cm-chips" role="group" aria-label="Show"><button type="button" class="chip" data-cf="" aria-pressed="true">All</button>%s</div>'
             '<ol class="cn-list">%s</ol>'
             '<h3>The disputed books, list by list</h3><p class="cmp-note">Y = in the canon · R = to be read but not canonical · D = disputed or set apart · N = excluded · “·” = not mentioned. Tap a row to see the source.</p>'
             '<div class="tablewrap"><table class="data cn-tab"><thead><tr><th>List</th>%s</tr></thead><tbody>%s</tbody></table></div></article>') % (
    ''.join('<button type="button" class="chip" data-cf="%s" aria-pressed="false">%s</button>' % (r, esc(n)) for r, n in reg_names.items()),
    items, ''.join('<th title="%s">%s</th>' % (esc(C.CANON_NAMES[b]), esc(C.CANON_NAMES[b])) for b in C.CANON_BOOKS), rows)
arcs_art = ('<article id="bible-arcs" data-title="Connections chart" data-vol="ref" data-kind="ref" data-topics="scripture" class="wide"><p class="eyebrow">Library · Scripture</p><h2>The Bible’s web of connections</h2>'
            '<p class="lede">Every arc joins two chapters that readers and the Treasury of Scripture Knowledge link together: over eight thousand of the strongest chapter-to-chapter connections, from about 170,000 verse links. Colour shows distance: short arcs within a book, long arcs between the Testaments. Tap the bar to pick a chapter.</p>'
            '<div class="ba-wrap"><canvas role="img" aria-label="Arc diagram of cross-references between the chapters of the Bible"></canvas></div><div class="ba-info" aria-live="polite"><p class="cmp-note">Tap anywhere along the bar to pick a chapter, or try: '
            '<button type="button" class="chip" data-bajump="GEN~1">Genesis 1</button> <button type="button" class="chip" data-bajump="ISA~53">Isaiah 53</button> <button type="button" class="chip" data-bajump="PSA~22">Psalm 22</button> <button type="button" class="chip" data-bajump="JOH~1">John 1</button> <button type="button" class="chip" data-bajump="HEB~1">Hebrews 1</button></p></div>'
            '<p class="vs-cite">Data: OpenBible.info cross-references (CC BY), aggregated by chapter.</p></article>')

BIBX = {'intro': C.INTRO, 'trad': [[b, c, v1, v2, t, rs, note] for b, c, v1, v2, t, rs, note in C.TRAD], 'maps': maps}
def bibx_json(): return json.dumps(BIBX, ensure_ascii=False, separators=(',', ':'))
import bibcur2 as C2
def bibx2_json(): return json.dumps({'harmony': C2.HARMONY, 'kath': C2.KATHISMATA, 'bcp30': C2.BCP30}, ensure_ascii=False, separators=(',', ':'))
