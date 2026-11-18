"""Edition 14 layer: the new look (design tokens, type, shell, home, Bible reader chrome)."""
import re
R = '/home/user/church/'
PATH = R + 'site/index.html'
h = open(PATH, encoding='utf-8').read()
if 'Edition 14: new look' in h: raise SystemExit('extras6 already applied')
FONTS = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..600&family=Inter:wght@400;500;600;700&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400&display=swap'
h, n = re.subn(r'<link href="https://fonts\.googleapis\.com/css2[^"]*" rel="stylesheet">', '<link href="%s" rel="stylesheet">' % FONTS.replace('&', '&amp;'), h, count=1)
assert n == 1
# dark is the default look unless the reader has chosen a theme
boot = '<script>try{if(!localStorage.getItem("theme"))document.documentElement.setAttribute("data-theme","dark")}catch(e){document.documentElement.setAttribute("data-theme","dark")}</script>'
h = h.replace('<head>', '<head>' + boot, 1) if '<head>' in h else boot + h
css = open(R + 'tools/v15.css', encoding='utf-8').read(); js = open(R + 'tools/v15.js', encoding='utf-8').read()
h = h.replace('</style>\n</head>', css + '</style>\n</head>', 1)
assert 'Edition 14: new look' in h
k = h.rindex('</body>')
h = h[:k] + '<script>' + js + '</script>\n' + h[k:]
h = h.replace('Edition 13 · The Series', 'Edition 14 · The Series')
open(PATH, 'w', encoding='utf-8').write(h)
print('new look ok; html MB', round(len(h.encode()) / 1e6, 2))
