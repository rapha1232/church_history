"""Build site/index.html from the sources in src/.   python3 scripts/build_site.py [output path]

The page is one self-contained HTML file (it has to open from file:// in the Android app, where ES modules and
fetch() of local files do not work). It is assembled from src/ like this:

  src/index.html        the template: <head>, the order of every stylesheet and script, and the directives below
  src/partials/*.html   large static markup (header and navigation, overlays, the SVG map paths)
  src/pages/            one file per page (<article id="...">), listed in reading order in src/pages/order.txt
  src/css/*.css         stylesheets
  src/js/*.js           scripts (src/js/head/ runs in <head>, before the page is drawn)
  src/data/*.json       data published as window.__NAME__ (src/data/DATA.json -> window.__DATA__)

Directives in the template (each on its own, written as an HTML comment):

  <!--@include partials/x.html-->     the file, as is
  <!--@style css/a.css css/b.css-->    one <style> element with the files in that order
  <!--@script js/a.js-->               one <script> element with the files in that order
  <!--@data DATA IMG-->                <script>window.__DATA__={...};window.__IMG__={...};</script> (minified JSON)
  <!--@pages-->                        every page listed in src/pages/order.txt, in that order

A directive's file list may span several lines. Other comments in the template are notes for editors and are
left out of the built page (comments inside partials, pages, CSS and JS are kept).

Every file in src/css, src/js, src/data, src/partials and src/pages must be used exactly once, so nothing is
forgotten or included twice. The build is deterministic: the same sources always give the same page.
"""
import json, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = os.path.join(ROOT, 'src')
OUT = os.path.join(ROOT, 'site', 'index.html')


class BuildError(Exception):
    pass


def build(src=SRC):
    used = set()

    def read(rel):
        p = os.path.join(src, rel)
        if not os.path.isfile(p):
            raise BuildError('missing file: src/%s' % rel)
        if rel in used:
            raise BuildError('used twice: src/%s' % rel)
        used.add(rel)
        return open(p, encoding='utf-8', newline='').read()

    def data(name):
        o = json.loads(read('data/%s.json' % name))
        return 'window.__%s__=%s;' % (name, json.dumps(o, ensure_ascii=False, separators=(',', ':')))

    def pages():
        order = read('pages/order.txt')
        out = []
        for line in order.splitlines():
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            html = read('pages/' + line)
            pid = os.path.splitext(os.path.basename(line))[0]
            if not html.startswith('<article id="%s"' % pid):
                raise BuildError('src/pages/%s must start with <article id="%s"' % (line, pid))
            out.append(html if html.endswith('\n') else html + '\n')
        return ''.join(out)

    def directive(m):
        kind, args = m.group(1), m.group(2).split()
        if kind == 'include':
            return ''.join(read(a) for a in args)
        if kind == 'style':
            return '<style>' + ''.join(read(a) for a in args) + '</style>'
        if kind == 'script':
            return '<script>' + ''.join(read(a) for a in args) + '</script>'
        if kind == 'data':
            return '<script>' + ''.join(data(a) for a in args) + '</script>'
        if kind == 'pages':
            return pages()
        raise BuildError('unknown directive: @%s' % kind)

    tpl = read('index.html')
    tpl = re.sub(r'[ \t]*<!--(?!@).*?-->[ \t]*\n?', '', tpl, flags=re.S)   # template comments are notes for editors
    page = re.sub(r'<!--@(\w+)\s*(.*?)-->', directive, tpl, flags=re.S)
    for script in re.findall(r'<script>(.*?)</script>', page, re.S):
        if '</script' in script:
            raise BuildError('a script contains "</script": escape it as "<\\/script"')

    # every source file must be used
    unused = []
    for d in ('css', 'js', 'data', 'partials', 'pages'):
        for base, _, files in os.walk(os.path.join(src, d)):
            for f in files:
                rel = os.path.relpath(os.path.join(base, f), src).replace(os.sep, '/')
                if rel not in used:
                    unused.append(rel)
    if unused:
        raise BuildError('files in src/ that the template does not use:\n  ' + '\n  '.join(sorted(unused)))
    return page


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else OUT
    try:
        page = build()
    except BuildError as e:
        sys.exit('build_site: %s' % e)
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    open(out, 'w', encoding='utf-8', newline='').write(page)
    print('built %s (%.1f MB)' % (os.path.relpath(out), len(page.encode('utf-8')) / 1e6))


if __name__ == '__main__':
    main()
