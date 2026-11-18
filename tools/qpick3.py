import json,re
from collections import defaultdict
c=json.load(open('q/cands.json')); st=json.load(open('q/rev_state.json'))
K=lambda q: re.sub(r'\W','',q.lower())[:60]
done=set(st['rej'])|set(K(o['q']) for o in st['keep'])
seen=set(done); by=defaultdict(list)
for o in sorted(c,key=lambda o:-o['s']):
    k=K(o['q'])
    if k in seen: continue
    seen.add(k); by[o['a']].append(o)
Q={'Augustine of Hippo':130,'John Chrysostom':120,'Basil of Caesarea':25,'Jerome':30,'Ambrose of Milan':25,'Leo the Great':25,'Cyprian of Carthage':20,'Clement of Alexandria':20,'Gregory of Nazianzus':15,'Ephrem the Syrian':25,'Lactantius':15,'Cyril of Jerusalem':15,'Aphrahat':10,'John Cassian':10,'Hilary of Poitiers':5}
pick=[]
for a,lst in by.items():
    n=Q.get(a,5); ws=defaultdict(list)
    for o in lst: ws[o['w']].append(o)
    got=[]
    while len(got)<n and any(ws.values()):
        for w in list(ws):
            if ws[w] and len(got)<n: got.append(ws[w].pop(0))
    pick+=got
base=2000
for i,o in enumerate(pick): o['id']=base+i
json.dump(pick,open('q/pick.json','w'),ensure_ascii=False)
with open('q/review.txt','w') as f:
    for o in pick: f.write('%d %s\n'%(o['id'],o['q']))
print(len(pick))
