"""Edition 23: Early Christian texts. Run after tools/v22.py, from the repository root:

    python3 tools/v20.py && python3 tools/v21.py && python3 tools/v22.py && python3 tools/v23.py

Idempotent. What it does to site/index.html:
  1. Adds the page <article id="ref-fathers"> (listed in Library under "Texts and sources").
  2. Appends tools/v23.css and tools/v23.js at the end of <body>.
The texts themselves are in site/bible/texts/ (built by tools/fathers_texts.py) and load on demand.
"""
import os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
PAGE = os.path.join(ROOT, 'site', 'index.html')
s = open(PAGE, encoding='utf-8').read()

print('Edition 23: early Christian texts')
ARTICLE = ('<article id="ref-fathers" data-title="Early Christian texts" data-vol="ref" data-kind="ref" data-topics="reference" class="wide">'
           '<p class="eyebrow">Reference · Texts</p><h2>Early Christian texts</h2>'
           '<p class="lede">The Didache, Clement, Ignatius, Polycarp, Justin, Irenaeus and Cyprian in full, in public-domain translations, with their notes and links to every scripture they cite.</p>'
           '<div class="ft-mount"></div></article>\n')
if 'id="ref-fathers"' in s:
    print('  %-30s already applied' % 'page')
else:
    anchor = '<article id="ref-texts"'
    if s.count(anchor) != 1: sys.exit('v23: expected one %s' % anchor)
    s = s.replace(anchor, ARTICLE + anchor); print('  %-30s done' % 'page')

css = open(os.path.join(ROOT, 'tools', 'v23.css'), encoding='utf-8').read()
js = open(os.path.join(ROOT, 'tools', 'v23.js'), encoding='utf-8').read()
block = '<style id="ed23">\n' + css + '</style>\n<script id="ed23js">\n' + js + '</script>\n'
s = re.sub(r'<style id="ed23">.*?</style>\n<script id="ed23js">.*?</script>\n', '', s, flags=re.S)
k = s.rindex('</body>')
s = s[:k] + block + s[k:]
print('  %-30s done' % 'layer')
open(PAGE, 'w', encoding='utf-8').write(s)
