"""Edition 25: quote cards with full attribution. Run after tools/v24.py, from the repository root:

    python3 tools/v20.py && python3 tools/v21.py && python3 tools/v22.py && python3 tools/v23.py && python3 tools/v24.py && python3 tools/v25.py

Idempotent. Appends tools/v25.css and tools/v25.js at the end of <body>: window.HCCShareCard now puts the
translation or edition on every card. The reader (tools/v23.js) and Studies (tools/v21.js) offer Share card.
"""
import os, re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
PAGE = os.path.join(ROOT, 'site', 'index.html')
s = open(PAGE, encoding='utf-8').read()
print('Edition 25: quote cards')
css = open(os.path.join(ROOT, 'tools', 'v25.css'), encoding='utf-8').read()
js = open(os.path.join(ROOT, 'tools', 'v25.js'), encoding='utf-8').read()
block = '<style id="ed25">\n' + css + '</style>\n<script id="ed25js">\n' + js + '</script>\n'
s = re.sub(r'<style id="ed25">.*?</style>\n<script id="ed25js">.*?</script>\n', '', s, flags=re.S)
k = s.rindex('</body>')
s = s[:k] + block + s[k:]
print('  %-30s done' % 'layer')
open(PAGE, 'w', encoding='utf-8').write(s)
