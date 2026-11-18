import json,re,sys
st=json.load(open('q/rev_state.json')); p=json.load(open('q/pick.json'))
lo,hi=int(sys.argv[1]),int(sys.argv[2]); keep=set(int(x) for x in sys.argv[3].split(','))
K=lambda o: re.sub(r'\W','',o['q'].lower())[:60]
have=set(K(o) for o in st['keep'])
for o in p:
    if lo<=o['id']<hi:
        if o['id'] in keep and K(o) not in have: st['keep'].append(o); have.add(K(o))
        elif o['id'] not in keep: st['rej'].append(K(o))
json.dump(st,open('q/rev_state.json','w'),ensure_ascii=False); print(len(st['keep']))
