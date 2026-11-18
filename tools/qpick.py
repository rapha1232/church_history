import json,re
from collections import defaultdict
c=json.load(open('q/cands.json'))
seen=set(); by=defaultdict(list)
for o in sorted(c,key=lambda o:-o['s']):
    k=re.sub(r'\W','',o['q'].lower())[:60]
    if k in seen: continue
    seen.add(k); by[o['a']].append(o)
Q={'Augustine of Hippo':150,'John Chrysostom':110,'Basil of Caesarea':45,'Jerome':50,'Ambrose of Milan':40,'Leo the Great':35,'Cyprian of Carthage':40,'Aphrahat':25,'Gregory of Nazianzus':35,'Clement of Alexandria':35,'Ignatius of Antioch':35,'Lactantius':25,'John of Damascus':20,'Cyril of Jerusalem':25,'John Cassian':30,'Origen':20,'Tertullian':25,'Gregory of Nyssa':25,'Clement of Rome':20,'Irenaeus of Lyon':20,'Athanasius of Alexandria':20,'Gregory the Great':13,'Justin Martyr':12,'Vincent of Lérins':11,'Sulpicius Severus':6,'Polycarp of Smyrna':6,'Epistle to Diognetus':2,'Hilary of Poitiers':35,'Ephrem the Syrian':35}
pick=[]
for a,lst in by.items():
    n=Q.get(a,10); ws=defaultdict(list)
    for o in lst: ws[o['w']].append(o)
    got=[]
    while len(got)<n and any(ws.values()):
        for w in list(ws):
            if ws[w] and len(got)<n: got.append(ws[w].pop(0))
    pick+=got
for i,o in enumerate(pick): o['id']=i
json.dump(pick,open('q/pick.json','w'),ensure_ascii=False)
with open('q/review.txt','w') as f:
    for o in pick: f.write('%d %s\n'%(o['id'],o['q']))
print(len(pick))
