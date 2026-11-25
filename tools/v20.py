"""Edition 20: apply the DESIGN.md design layer to the built page.

Run from the repository root:  python3 tools/v20.py
It is idempotent: running it again replaces the layer and leaves the markup fixes as they are.

What it does to site/index.html:
  1. Loads Literata (display and body) and Source Sans 3 (interface) instead of Fraunces, Literata and Inter.
     The Android app and the web app use the bundled copies in android/assets/fonts (tools/fonts.js).
  2. Fixes text shown as HTML entities ("Rus&#x27;", "Historians&#x27; views").
  3. Removes internal codes from user-facing labels ("Reference · C", "Edition 15 · The Series").
  4. Gives the 270-odd arrow-only links a class (styled quietly) and an accessible name.
  5. Replaces the Tailwind default accent colours with the historical pigments (keys unchanged).
  6. Appends tools/v20.css and tools/v20.js at the end of <body>, so they come after every earlier layer.
"""
import os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
PAGE = os.path.join(ROOT, 'site', 'index.html')
s = open(PAGE, encoding='utf-8').read()
n0 = len(s)

def sub(pattern, repl, text, flags=0, expect=None, label=''):
    out, n = re.subn(pattern, repl, text, flags=flags)
    if expect is not None and n < expect:
        sys.exit('v20: expected at least %d change(s) for %s, made %d' % (expect, label, n))
    print('  %-34s %d' % (label, n))
    return out

print('Edition 20 design layer')

# 1. fonts
FONTS = ('https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,400..700;1,7..72,400..600'
         '&amp;family=Source+Sans+3:ital,wght@0,400..700;1,400&amp;display=swap')
s = sub(r'<link href="https://fonts\.googleapis\.com/css2[^"]*" rel="stylesheet">',
        '<link href="' + FONTS + '" rel="stylesheet">', s, label='font link')
s = sub(r'(\d+px) Inter, Arial, sans-serif', r"\1 'Source Sans 3', Arial, sans-serif", s, label='canvas font')

# 2. entities that were escaped twice (in data and in rendered markup)
s = sub(r'&amp;#x27;', '’', s, label='double-escaped apostrophes')
i = s.index('window.__EP__='); j = s.index('</script>', i)
s = s[:i] + s[i:j].replace('&#x27;', '’') + s[j:]

# 3. internal codes in labels
s = sub(r'(<p class="eyebrow">Reference) · [A-K]\d?(</p>)', r'\1\2', s, label='eyebrow section codes')
s = sub(r'A historical encyclopedia · Edition 15 · The Series', 'A historical encyclopedia', s, label='edition in eyebrow')
s = sub(r'<small>Edition 15 · The Series</small>', '<small>A story in fifteen seasons</small>', s, label='brand subtitle')

# 4. arrow-only links
s = sub(r'<a (href="[^"]+")>→</a>', r'<a class="go" \1 aria-label="Read more">→</a>', s, label='arrow links (static)')
s = sub(r'<a (href="[^"]+" aria-label="[^"]*")>→</a>', r'<a class="go" \1>→</a>', s, label='arrow links (labelled)')
s = sub(r'\'" aria-label="Read more">→</a>', '\'" class="go" aria-label="Read more">→</a>', s, label='arrow links (script)')

# 5. pigment accents and theme swatches
ACC = ('var ACC = [["orange","#b3361d","#ea7d5f"],["blue","#24448f","#9fb5ec"],["green","#2c6a59","#7dc0ac"],'
       '["gold","#835e10","#d8b068"],["rose","#a02f4e","#e79aae"],["purple","#6c2f72","#cfa3d4"]];')
s = sub(r'var ACC = \[\["orange"[^;]*;', lambda m: ACC, s, label='accent swatches')
s = sub(r'\["dark","Night","#0a0a0c"\],\["light","Light","#f6f3ec"\]', '["dark","Night","#15130f"],["light","Light","#f5f1e8"]', s, label='theme swatches')

# 6. the layer itself
css = open(os.path.join(ROOT, 'tools', 'v20.css'), encoding='utf-8').read()
js = open(os.path.join(ROOT, 'tools', 'v20.js'), encoding='utf-8').read()
block = '<style id="ed20">\n' + css + '</style>\n<script id="ed20js">\n' + js + '</script>\n'
s = re.sub(r'<style id="ed20">.*?</style>\n<script id="ed20js">.*?</script>\n', '', s, flags=re.S)
k = s.rindex('</body>')
s = s[:k] + block + s[k:]

open(PAGE, 'w', encoding='utf-8').write(s)
print('  size %d -> %d characters' % (n0, len(s)))
