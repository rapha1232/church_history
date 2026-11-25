"""Edition 28: how doctrines developed. Run after tools/v27.py, from the repository root:

    python3 tools/v20.py && ... && python3 tools/v26.py && python3 tools/v27.py && python3 tools/v28.py

Idempotent. What it does to site/index.html:
  1. Adds the page <article id="ref-doctrines"> (Library, under "Councils and doctrine").
  2. Appends tools/v28.css and tools/v28.js at the end of <body>.
The witnesses are in site/bible/doctrines.js, built and checked by tools/doctrines.py.
"""
import os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
PAGE = os.path.join(ROOT, 'site', 'index.html')
s = open(PAGE, encoding='utf-8').read()
print('Edition 28: how doctrines developed')
ARTICLE = ('<article id="ref-doctrines" data-title="How doctrines developed" data-vol="ref" data-kind="ref" data-topics="doctrine" class="wide">'
           '<p class="eyebrow">Reference · Doctrine</p><h2>How doctrines developed</h2>'
           '<p class="lede">The primacy of Rome, the Eucharist and justification: the witnesses in order, from Scripture to the confessions, each placed against one stated proposition and quoted word for word.</p>'
           '<div class="dt-mount"></div></article>\n')
if 'id="ref-doctrines"' in s:
    print('  %-30s already applied' % 'page')
else:
    anchor = '<article id="ref-texts"'
    if s.count(anchor) != 1: sys.exit('v28: expected one %s' % anchor)
    s = s.replace(anchor, ARTICLE + anchor); print('  %-30s done' % 'page')
css = open(os.path.join(ROOT, 'tools', 'v28.css'), encoding='utf-8').read()
js = open(os.path.join(ROOT, 'tools', 'v28.js'), encoding='utf-8').read()
block = '<style id="ed28">\n' + css + '</style>\n<script id="ed28js">\n' + js + '</script>\n'
s = re.sub(r'<style id="ed28">.*?</style>\n<script id="ed28js">.*?</script>\n', '', s, flags=re.S)
k = s.rindex('</body>')
s = s[:k] + block + s[k:]
print('  %-30s done' % 'layer')
open(PAGE, 'w', encoding='utf-8').write(s)
