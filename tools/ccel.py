import re,sys,json
from bs4 import BeautifulSoup, NavigableString
def clean(t):
    t=re.sub(r'\s+',' ',t).strip()
    return t
def blocks(path):
    soup=BeautifulSoup(open(path,encoding='utf-8').read(),'html.parser')
    main=soup.find(id='theText') or soup.find('div',class_='book-content') or soup.body
    for s in main.select('sup, .pb, .footer_note, .Note, .mnote, script, style'): s.decompose()
    for sp in main.select('[lang]'):
        blk=sp.find_parent(['p','td','th','h4','h3'])
        if blk is not None and not blk.get('lang'): blk['lang']=sp['lang']
    for sc in main.select('span.sc'): sc.unwrap()
    for sp in main.select('span, i, em, b, a'): sp.unwrap()
    main.smooth()
    fn=main.find(id=re.compile('^footnotes'))
    out=[]
    def walk(el):
        for c in el.children:
            if isinstance(c,NavigableString): continue
            if c.name=='table':
                for tr in c.find_all('tr'):
                    if tr.find_parent('table') is not c: continue
                    cells=tr.find_all(['td','th'],recursive=False)
                    out.append(('row' if cells and cells[0].name=='td' else 'hrow',[ (x.get_text(' '),(x.find(attrs={'lang':True}) or {}).get('lang') if hasattr(x,'find') else None) for x in cells]))
            elif c.name in ('p','h1','h2','h3','h4','h5','h6'):
                out.append((c.name,[(c.get_text(' '),c.get('lang') or (c.find(attrs={'lang':True}) or {}).get('lang'))]))
            else: walk(c)
    walk(main)
    return [(k,[(clean(t),l) for t,l in cs]) for k,cs in out]
if __name__=='__main__':
    for k,cs in blocks(sys.argv[1]):
        print(k,len(cs),' || '.join(f"[{l}]{t[:int(sys.argv[2]) if len(sys.argv)>2 else 60]}" for t,l in cs))
