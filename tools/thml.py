import re, sys, html
from xml.etree import ElementTree as ET
def text(el):
    out = []
    def rec(e):
        if e.tag in ('note', 'pb', 'index', 'added'): 
            if e.tail: out.append(e.tail)
            return
        if e.text: out.append(e.text)
        for c in e: rec(c)
        if e.tail: out.append(e.tail)
    if el.text: out.append(el.text)
    for c in el: rec(c)
    return re.sub(r'\s+', ' ', ''.join(out)).strip()
def load(path):
    s = open(path, encoding='utf-8').read()
    s = re.sub(r'<!DOCTYPE[^>]*>', '', s)
    s = re.sub(r'&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)\w+;', lambda m: html.unescape(m.group(0)), s)
    return ET.fromstring(s)
def walk(root):
    """yield (titlepath, paragraph text)"""
    def rec(e, path):
        for c in e:
            if re.match(r'div\d', c.tag):
                rec(c, path + [(c.get('title') or '', c.get('shorttitle') or '', c.get('n') or '')])
            elif c.tag == 'p':
                t = text(c)
                if t: yield_.append((tuple(path), t))
            elif c.tag not in ('note',):
                rec(c, path)
    yield_ = []
    body = root.find('.//ThML.body')
    rec(body if body is not None else root, [])
    return yield_
if __name__ == '__main__':
    from collections import OrderedDict
    for f in sys.argv[1:]:
        ps = walk(load(f)); c = OrderedDict()
        for p, t in ps: c[p[:2]] = c.get(p[:2], 0) + 1
        print('==', f)
        for k, v in c.items():
            if v > 30: print('  %5d  %s' % (v, ' / '.join((x[0][:50] + ' {' + x[1] + '|' + x[2] + '}') for x in k)))
