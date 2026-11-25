"""Edition 24: authenticity labels. Run after tools/v23.py, from the repository root:

    python3 tools/v20.py && python3 tools/v21.py && python3 tools/v22.py && python3 tools/v23.py && python3 tools/v24.py

Idempotent. Appends tools/v24.css and tools/v24.js (window.HCCAuth: the labels, their evidence and sources) at the
end of <body>. The Early Christian texts reader (tools/v23.js) and Studies (tools/v21.js) show them when present.
"""
import os, re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
PAGE = os.path.join(ROOT, 'site', 'index.html')
s = open(PAGE, encoding='utf-8').read()
print('Edition 24: authenticity labels')
css = open(os.path.join(ROOT, 'tools', 'v24.css'), encoding='utf-8').read()
js = open(os.path.join(ROOT, 'tools', 'v24.js'), encoding='utf-8').read()
block = '<style id="ed24">\n' + css + '</style>\n<script id="ed24js">\n' + js + '</script>\n'
s = re.sub(r'<style id="ed24">.*?</style>\n<script id="ed24js">.*?</script>\n', '', s, flags=re.S)
k = s.rindex('</body>')
s = s[:k] + block + s[k:]
print('  %-30s done' % 'layer')
open(PAGE, 'w', encoding='utf-8').write(s)
