"""Edition 27: the deuterocanon in the New Testament. Run after tools/v26.py, from the repository root:

    python3 tools/v20.py && ... && python3 tools/v26.py && python3 tools/v27.py

Idempotent. What it does to site/index.html:
  1. Adds the page <article id="bible-dcnt"> (Library, under "Bible companions").
  2. Appends tools/v27.css and tools/v27.js at the end of <body>.
The parallels and their evidence are in site/bible/dcnt.js, built by tools/dc_allusions.py.
"""
import os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
PAGE = os.path.join(ROOT, 'site', 'index.html')
s = open(PAGE, encoding='utf-8').read()
print('Edition 27: the deuterocanon in the New Testament')
ARTICLE = ('<article id="bible-dcnt" data-title="The deuterocanon in the New Testament" data-vol="ref" data-kind="ref" data-topics="bible" class="wide">'
           '<p class="eyebrow">Bible companion</p><h2>The deuterocanon in the New Testament</h2>'
           '<p class="lede">Ten places where New Testament writers echo Wisdom, Sirach, Tobit and Maccabees, each with the evidence from the Greek texts, from strong verbal parallels to weak ones.</p>'
           '<p class="ft-how">An echo shows that a writer knew a book or its language. On its own it does not settle whether he counted the book as Scripture; readers on both sides of the canon question draw different conclusions. Parallels often claimed elsewhere but with no shared wording in these Greek texts are not listed.</p>'
           '<div class="dc-mount"></div></article>\n')
if 'id="bible-dcnt"' in s:
    print('  %-30s already applied' % 'page')
else:
    anchor = '<article id="ref-texts"'
    if s.count(anchor) != 1: sys.exit('v27: expected one %s' % anchor)
    s = s.replace(anchor, ARTICLE + anchor); print('  %-30s done' % 'page')
css = open(os.path.join(ROOT, 'tools', 'v27.css'), encoding='utf-8').read()
js = open(os.path.join(ROOT, 'tools', 'v27.js'), encoding='utf-8').read()
block = '<style id="ed27">\n' + css + '</style>\n<script id="ed27js">\n' + js + '</script>\n'
s = re.sub(r'<style id="ed27">.*?</style>\n<script id="ed27js">.*?</script>\n', '', s, flags=re.S)
k = s.rindex('</body>')
s = s[:k] + block + s[k:]
print('  %-30s done' % 'layer')
open(PAGE, 'w', encoding='utf-8').write(s)
