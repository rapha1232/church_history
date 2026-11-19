"""Edition 18 layer: widget settings in the web app (tools/v17.js) and updated widget wording.
Run after extras7.py:  python3 tools/extras8.py [path/to/index.html]  (default site/index.html)."""
import sys
PATH = sys.argv[1] if len(sys.argv) > 1 else 'site/index.html'
h = open(PATH, encoding='utf-8').read()
OLD_Q = 'Home-screen widgets: Quote of the day, Verse of the day, On this day, Continue, and Today’s reading. Add them from your launcher’s widget list.'
NEW_Q = 'Widgets for the home screen and lock screen: Today, Quote of the day, Verse of the day, On this day, Continue reading and Today’s reading, each with its own theme and text size.'
OLD_V = 'Widgets: “Verse of the day” and “Verse of the day (large)”, with the Greek or Hebrew.'
NEW_V = 'Widgets: “Verse of the day”, “Verse of the day (large)” and “Today”, optionally with the Greek or Hebrew, on the home screen or lock screen.'
h = h.replace(OLD_Q, NEW_Q).replace(OLD_V, NEW_V)
if '/* Edition 18: widgets' not in h:
    k = h.rindex('</body>')
    h = h[:k] + '<script>' + open('tools/v17.js', encoding='utf-8').read() + '</script>\n' + h[k:]
open(PATH, 'w', encoding='utf-8').write(h)
print('edition 18 layer applied to', PATH)
