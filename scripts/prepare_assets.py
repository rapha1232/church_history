"""Copy the web app into android/assets for the APK.
The study packs listed in PACKS are not bundled: the app downloads them from the web app the first time
they are needed (or all at once from Settings) and keeps them. assets/packs.json lists their files."""
import json, os, re, shutil, sys
R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')) + '/'
A = R + 'android/assets/'
# word-by-word Greek and Hebrew, lexicons, concordance, the Greek Bible and the Latin Vulgate
PACKS = {'study': ['bible/orig', 'bible/lex', 'bible/conc'], 'greek': ['bible/lxxg'], 'latin': ['bible/vul'], 'arabic': ['bible/arb']}

sys.path.insert(0, R + 'scripts')
from build_site import build
s = build()  # the page, built from src/
s = re.sub(r'<link rel="preconnect"[^>]*>', '', s)
s = re.sub(r'<link href="https://fonts\.googleapis\.com/css2[^"]*" rel="stylesheet">', '<link href="fonts.css" rel="stylesheet">', s)
s = s.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
assert 'fonts.googleapis' not in s
open(A + 'index.html', 'w', encoding='utf-8').write(s)
skip = {d for ds in PACKS.values() for d in ds}
for d in ('img', 'bible'):
    shutil.rmtree(A + d, ignore_errors=True)
    shutil.copytree(R + 'site/' + d, A + d, ignore=lambda src, names: [n for n in names if os.path.relpath(os.path.join(src, n), R + 'site').replace(os.sep, '/') in skip])
for f in ('quotes.json', 'onthisday.json', 'verses.json'):
    shutil.copy(R + 'tools/' + f, A + f)
packs = {}
for name, dirs in PACKS.items():
    files = []
    for d in dirs:
        for root, _, fs in os.walk(R + 'site/' + d):
            for f in sorted(fs):
                p = os.path.relpath(os.path.join(root, f), R + 'site').replace(os.sep, '/')
                files.append([p, os.path.getsize(R + 'site/' + p)])
    packs[name] = sorted(files)
json.dump(packs, open(A + 'packs.json', 'w'), separators=(',', ':'))
print('assets ready; packs:', {k: round(sum(x[1] for x in v) / 1e6, 1) for k, v in packs.items()}, 'MB')
