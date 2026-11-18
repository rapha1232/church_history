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
Q={'Augustine of Hippo':260,'John Chrysostom':140,'Basil of Caesarea':50,'Jerome':50,'Hilary of Poitiers':25,'Ambrose of Milan':45,'Leo the Great':40,'Cyprian of Carthage':35,'Clement of Alexandria':35,'Gregory of Nazianzus':35,'Ephrem the Syrian':30,'Lactantius':20,'John of Damascus':12,'Cyril of Jerusalem':20,'Aphrahat':20,'Gregory of Nyssa':15,'Tertullian':15,'Origen':12,'John Cassian':25,'Irenaeus of Lyon':12,'Clement of Rome':12,'Athanasius of Alexandria':12,'Gregory the Great':13,'Justin Martyr':8,'Vincent of Lérins':8,'Sulpicius Severus':4,'Polycarp of Smyrna':3,'Epistle to Diognetus':2,'Ignatius of Antioch':0}
pick=[]
for a,lst in by.items():
    n=Q.get(a,5); ws=defaultdict(list)
    for o in lst: ws[o['w']].append(o)
    got=[]
    while len(got)<n and any(ws.values()):
        for w in list(ws):
            if ws[w] and len(got)<n: got.append(ws[w].pop(0))
    pick+=got
base=1000
for i,o in enumerate(pick): o['id']=base+i
json.dump(pick,open('q/pick.json','w'),ensure_ascii=False)
with open('q/review.txt','w') as f:
    for o in pick: f.write('%d %s\n'%(o['id'],o['q']))
print(len(pick))
