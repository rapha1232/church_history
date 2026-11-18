import re,sys,json
sys.path.insert(0,'/home/user/church/tools')
from ccel import blocks
HEAD=re.compile(r'^(A ?rt\s?\. ?[IVXLC]+\.?.*|ART(ICLE)?\.? [IVXLC]+.*|Q ?uestion \d+\.|CHAPTER [IVXLC]+\.?.*|C ?HAP\. ?[IVXLC]+\..*|[IVXLC]+\.|Article [IVXLC]+\.?.*|LORD\'S DAY \d+\.?|L ?ord\'s D ?ay .*|Ques\. \d+\..*|FIRST HEAD.*|SECOND HEAD.*|THIRD AND FOURTH.*|FIFTH HEAD.*|Rejection of Errors.*|REJECTION OF ERRORS.*)$')
def fix(t):
    t=re.sub(r'\s+([,.;:?!])',r'\1',t)
    return t.strip()
def extract(path,col,mode='rows',skip_until=None,stop_at=None,colmap=None):
    items=[]
    started = skip_until is None
    for k,cells in blocks(path):
        if k=='row' and len(cells)==3 and cells[0][0].startswith('«'): continue
        if mode=='rows':
            if k not in('row','hrow'): 
                if k=='p' and (cells[0][1] is None or not started): txt=cells[0][0]
                else: continue
            else:
                cols=(colmap or {}).get(len(cells),[col])
                if len(cells)<=max(cols): continue
                txt=' '.join(cells[c][0] for c in cols if cells[c][0].strip())
        else:
            if k not in ('p','h4'): continue
            w=cells[0][0].lower().split()
            if cells[0][1] and (not w or sum(x in ('the','and','of','to','that','is','in','we','be','which') for x in w)/len(w)<0.08): continue
            txt=cells[0][0]
        txt=fix(txt)
        if not txt: continue
        if not started:
            if re.search(skip_until,txt): started=True
            else: continue
        if stop_at and re.search(stop_at,txt): break
        items.append(txt)
    # build structure
    out=[]
    for t in items:
        if HEAD.match(t) or (k=='hrow'):
            out.append({'h':t}); continue
        if out and 'p' in out[-1] and (t[0].islower() or out[-1]['p'][-1] not in '.:?!;"”’)]'):
            out[-1]['p']+=' '+t
        else: out.append({'p':t})
    return out
if __name__=='__main__':
    r=extract(sys.argv[1],int(sys.argv[2]),sys.argv[3] if len(sys.argv)>3 else 'rows')
    for x in r[:int(sys.argv[4]) if len(sys.argv)>4 else 40]: print(x)
    print(len(r), sum(len(x.get('p','')) for x in r))
