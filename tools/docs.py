import re,json,html,sys
sys.path.insert(0,'/home/user/church/tools')
from extract import extract, fix
from ccel import blocks
S='/home/user/church/src/'
def nat(f):
    s=open(S+f,encoding='utf-8',errors='replace').read()
    s=re.sub(r'<(script|style)[\s\S]*?</\1>','',s)
    s=re.sub(r'<br\s*/?>','\n',s); s=re.sub(r'</p>|</h\d>|</div>','\n\n',s)
    s=html.unescape(re.sub('<[^>]+>','',s))
    return re.sub(r'\n\s*\n+','\n\n',s)
def paras(t): return [{'p':re.sub(r'\s+',' ',x).strip()} for x in t.split('\n\n') if x.strip()]
def slice_(t,a,b): i=t.index(a); j=t.index(b,i+len(a)) if b else len(t); return t[i:j]
def ccel_rows(f,col,start=None,stop=None,drop=(),colmap=None):
    r=extract(S+f,col,'rows',start,stop,colmap)
    return [x for x in r if not any(re.search(d,x.get('p',x.get('h',''))) for d in drop)]
D=[]
def add(**k): D.append(k)

# ---- Ancient creeds (texts typed from standard public-domain forms)
add(id='old-roman',title='The Old Roman Creed',date='c. 340 (attested)',fam='Ancient creeds',ctx=['iii-5','ii-8'],
 intro='The baptismal creed of the church at Rome, known in Greek from Marcellus of Ancyra (c. 340) and in Latin from Rufinus (c. 400). It is the ancestor of the Apostles’ Creed: compare the two and the later additions (“maker of heaven and earth”, “descended into hell”, “communion of saints”, “life everlasting”) stand out.',
 src='Translation after the text of Rufinus, Commentary on the Apostles’ Creed; public domain.',
 body=[{'p':'I believe in God the Father Almighty;'},{'p':'and in Christ Jesus, his only Son, our Lord, who was born of the Holy Spirit and the Virgin Mary, crucified under Pontius Pilate and buried; on the third day he rose again from the dead, ascended into heaven, sits at the right hand of the Father, whence he will come to judge the living and the dead;'},{'p':'and in the Holy Spirit, the holy Church, the forgiveness of sins, the resurrection of the flesh.'}])
add(id='apostles',title='The Apostles’ Creed',date='received form by c. 700',fam='Ancient creeds',ctx=['iii-5','vol-p3'],
 intro='The Western baptismal creed. The legend that each of the twelve apostles contributed a clause is medieval; the text grew out of the Old Roman Creed and reached this “received form” in Gaul by the early eighth century. It is used by Catholics, Lutherans, Anglicans, Reformed and Methodists, but has never been a liturgical creed of the Orthodox Churches.',
 src='Traditional English text as in the Book of Common Prayer (1662); public domain. Schaff, Creeds of Christendom II.',
 body=[{'p':'I believe in God the Father Almighty, Maker of heaven and earth:'},{'p':'And in Jesus Christ his only Son our Lord, who was conceived by the Holy Ghost, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, dead, and buried: he descended into hell; the third day he rose again from the dead; he ascended into heaven, and sitteth on the right hand of God the Father Almighty; from thence he shall come to judge the quick and the dead.'},{'p':'I believe in the Holy Ghost; the holy Catholic Church; the communion of saints; the forgiveness of sins; the resurrection of the body, and the life everlasting. Amen.'}])
add(id='nicaea325',title='The Creed of Nicaea',date='325',fam='Ancient creeds',ctx=['iv-6','vi-1'],
 intro='The creed issued by the Council of Nicaea against Arius. It is shorter than the creed now recited in church: it ends abruptly at “the Holy Spirit” and adds anathemas condemning Arian slogans. Its key word is homoousios, “of one substance”.',
 src='Schaff, Creeds of Christendom II (1877), Symbolum Nicænum A.D. 325; public domain.',
 body=[{'p':'We believe in one God, the Father Almighty, maker of all things visible and invisible.'},{'p':'And in one Lord Jesus Christ, the Son of God, begotten of the Father, the only-begotten; that is, of the essence of the Father, God of God, Light of Light, very God of very God, begotten, not made, being of one substance with the Father; by whom all things were made both in heaven and on earth; who for us men, and for our salvation, came down and was incarnate and was made man; he suffered, and the third day he rose again, ascended into heaven; from thence he shall come to judge the quick and the dead.'},{'p':'And in the Holy Ghost.'},{'p':'But those who say: “There was a time when he was not”; and “He was not before he was made”; and “He was made out of nothing”, or “He is of another substance” or “essence”, or “The Son of God is created”, or “changeable”, or “alterable” — they are condemned by the holy catholic and apostolic Church.'}])
nc=ccel_rows('creeds2.iv.i.ii.ii.html',1,start=r'I believe in one God',stop=r'^\[The Western')
add(id='nicene',title='The Niceno-Constantinopolitan (Nicene) Creed',date='381',fam='Ancient creeds',ctx=['iv-9','vi-2','viii-5'],
 intro='The creed commonly called “the Nicene Creed”, recited at the Eucharist in the Orthodox, Oriental, Catholic, Anglican and Lutheran Churches. It is associated with the Council of Constantinople (381) and was read out at Chalcedon (451). The Greek original says the Spirit proceeds “from the Father”; Western churches later added “and the Son” (Filioque), shown here in brackets.',
 src='Schaff, Creeds of Christendom II, Forma recepta Ecclesiæ Occidentalis (Protestant English text); public domain.',
 body=nc)
ch=ccel_rows('creeds2.iv.i.iii.html',1,start=r'^We, then, following',stop=r'SYMBOLUM CHALCEDONENSE')
add(id='chalcedon',title='The Definition of Chalcedon',date='22 October 451',fam='Ancient creeds',ctx=['iv-12','vi-4','v-3'],
 intro='The Christological definition of the Council of Chalcedon: one Christ “acknowledged in two natures”, without confusion, change, division or separation. Accepted by the Catholic, Eastern Orthodox and most Protestant Churches; rejected by the Oriental Orthodox Churches, whose dispute with it is now widely treated as largely verbal.',
 src='Schaff, Creeds of Christendom II, Symbolum Chalcedonense; public domain.',
 body=ch)
ath=ccel_rows('creeds2.iv.i.iv.html',1,start=r'^1\. Whosoever')
add(id='athanasian',title='The Athanasian Creed (Quicunque vult)',date='c. 500, Southern Gaul',fam='Ancient creeds',ctx=['iv-8','viii-5'],
 intro='A Latin hymn-like statement of Trinitarian and Christological doctrine. Athanasius did not write it; it was composed in the Latin West, probably in southern Gaul around 500. It includes the Filioque (v. 23) and its warning clauses have long been debated.',
 src='Schaff, Creeds of Christendom II, “Old Translation Revised”; public domain.',
 body=ath)

# ---- Conciliar
t=nat('3810.htm'); seg=slice_(t,'The Twelve Anathemas of St. Cyril Against Nestorius','Historical Introduction') if 'Historical Introduction' in t[t.index('The Twelve Anathemas of St. Cyril'):] else None
an=[]
seg=t[t.index('The Twelve Anathemas of St. Cyril Against Nestorius')+52:]
for n in range(1,13):
    m=re.search(r'\n%d\n\n(.*?)\n\nNestorius:'%n,seg,re.S)
    an.append({'h':'Anathema %d'%n}); an.append({'p':re.sub(r'\s+',' ',m.group(1)).strip()})
add(id='cyril12',title='The Twelve Anathemas of Cyril of Alexandria',date='430',fam='Councils',ctx=['iv-11','vi-3','vi-5'],
 intro='Appended to Cyril’s third letter to Nestorius (November 430). Nestorius was required to sign them and refused. They became a lasting point of friction: the Church of the East rejects them, Chalcedon did not formally adopt them, and Constantinople II (553) defended them.',
 src='NPNF II/14 (H. R. Percival, 1900), Council of Ephesus; public domain.',body=an)
t=nat('c3.htm'); seg=slice_(t,'The holy, great, and Ecumenical Synod which has been assembled','\n\nThe Prosphoneticus')
if len(seg)>12000: seg=seg[:seg.index('\n\n',9000)]
add(id='const3',title='Definition of Faith of Constantinople III',date='16 September 681',fam='Councils',ctx=['vi-6'],
 intro='The Sixth Ecumenical Council’s definition against Monothelitism: Christ has two natural wills and two natural operations, the human will freely following the divine. It also condemns by name Pope Honorius I.',
 src='NPNF II/14 (Percival, 1900), Sixth Ecumenical Council, Definition of Faith; public domain.',body=paras(seg))
t=nat('nic2.htm'); i=t.index('To make our confession short'); j=t.index('\n\n',t.index('Those, therefore who dare to think'))
add(id='nicaea2',title='Definition of Nicaea II on Icons',date='13 October 787',fam='Councils',ctx=['vi-7','viii-3'],
 intro='The Seventh Ecumenical Council’s decree restoring icons. Its key distinction is between honour or veneration (proskynesis) and the worship (latreia) due to God alone, and its key principle is that the honour paid to the image passes to its prototype.',
 src='NPNF II/14 (Percival, 1900), Seventh Ecumenical Council, Decree; public domain.',body=paras(t[i:j]))
t=nat('lact.htm'); i=t.index('When we, Constantine and Licinius'); j=t.index('Licinius having issued this ordinance')
add(id='milan',title='The “Edict of Milan” (Letter of Licinius)',date='13 June 313',fam='Councils',ctx=['iv-3'],
 intro='Not an edict issued at Milan, but a letter posted by Licinius at Nicomedia, recording what he and Constantine had agreed at Milan. It grants freedom of worship to Christians and all others and orders confiscated church property returned.',
 src='Lactantius, On the Deaths of the Persecutors 48, trans. W. Fletcher, ANF 7; public domain.',body=paras(t[i:j]))

# ---- Medieval / Catholic
us=[x for x in extract(S+'creeds2.vii.v.html',0,'p') if 'p' in x]
us=[x for x in us if not x['p'].startswith('[Since') and not x['p'].startswith('The Bull of')]
add(id='unam',title='Unam sanctam',date='18 November 1302',fam='Catholic',ctx=['x-6'],
 intro='Boniface VIII’s bull issued during his conflict with Philip IV of France: one Church, outside which there is no salvation; two swords, spiritual and temporal; and the closing definition that submission to the Roman Pontiff is necessary for salvation.',
 src='Schaff, Creeds of Christendom II, Appendix III; public domain.',body=us)
tr=ccel_rows('creeds2.v.i.i.iv.html',1,start=r'^DECREE ON JUSTIFICATION')
add(id='trent6',title='Council of Trent, Decree on Justification',date='13 January 1547',fam='Catholic',ctx=['xii-1','xi-6','xii-5'],
 intro='Session VI of Trent, its most important doctrinal decree: sixteen chapters setting out the Catholic doctrine of justification and thirty-three canons rejecting positions attributed to the Reformers. The 1999 Joint Declaration on the Doctrine of Justification judged that its condemnations do not apply to the Lutheran teaching presented there.',
 src='Schaff, Creeds of Christendom II (Waterworth translation, revised); public domain.',body=tr)
pf=ccel_rows('creeds2.v.i.ii.html',1,start=r'^I\. I, ')
add(id='tridentine',title='Profession of the Tridentine Faith',date='1564',fam='Catholic',ctx=['xii-1'],
 intro='Issued by Pius IV after Trent and required of bishops, theologians and converts until 1967. It adds to the Nicene Creed a summary of Trent’s teaching on tradition, sacraments, purgatory, saints, images, indulgences and the Roman Church.',
 src='Schaff, Creeds of Christendom II; public domain.',body=pf)
add(id='ineffabilis',title='Ineffabilis Deus: the definition',date='8 December 1854',fam='Catholic',ctx=['p4-f'],
 intro='The defining sentence of Pius IX’s bull on the Immaculate Conception of Mary, the first dogma defined by a pope without a council. Orthodox and Protestant Churches do not accept it.',
 src='Schaff, Creeds of Christendom II (translation of the definition); public domain.',
 body=[{'p':'We declare, pronounce and define that the doctrine which holds that the most Blessed Virgin Mary, in the first instant of her conception, by a singular grace and privilege of Almighty God, in view of the merits of Christ Jesus the Saviour of the human race, was preserved free from all stain of original sin, was revealed by God, and is therefore to be firmly and constantly believed by all the faithful.'},{'p':'Wherefore, if any shall dare — which God forbid! — to think otherwise than as it has been defined by us, let them clearly know that they are condemned by their own judgment, that they have suffered shipwreck in the faith, and have fallen away from the unity of the Church.'}])
add(id='pastor',title='Pastor aeternus: the definition of infallibility',date='18 July 1870',fam='Catholic',ctx=['xiv-7','vii-6'],
 intro='The closing section of chapter 4 of the First Vatican Council’s constitution on the Church. Note the conditions: the pope speaks ex cathedra, as pastor of all Christians, defining a doctrine of faith or morals to be held by the whole Church.',
 src='Schaff, Creeds of Christendom II, Vatican Council, Constitutio dogmatica prima de Ecclesia Christi, ch. 4; public domain.',
 body=[{'p':'But since in this very age, in which the salutary efficacy of the Apostolic office is most of all required, not a few are found who take away from its authority, we judge it altogether necessary solemnly to assert the prerogative which the only-begotten Son of God vouchsafed to join with the supreme pastoral office.'},{'p':'Therefore faithfully adhering to the tradition received from the beginning of the Christian faith, for the glory of God our Saviour, the exaltation of the Catholic religion, and the salvation of Christian people, the sacred Council approving, we teach and define that it is a dogma divinely revealed: that the Roman Pontiff, when he speaks ex cathedra, that is, when in discharge of the office of pastor and doctor of all Christians, by virtue of his supreme Apostolic authority, he defines a doctrine regarding faith or morals to be held by the universal Church, by the divine assistance promised to him in blessed Peter, is possessed of that infallibility with which the divine Redeemer willed that his Church should be endowed for defining doctrine regarding faith or morals; and that therefore such definitions of the Roman Pontiff are irreformable of themselves, and not from the consent of the Church.'},{'p':'But if any one — which may God avert — presume to contradict this our definition: let him be anathema.'},{'p':'Given at Rome in public Session solemnly held in the Vatican Basilica in the year of our Lord one thousand eight hundred and seventy, on the eighteenth day of July, in the twenty-fifth year of our Pontificate.'}])

# ---- Reformation
g=open(S+'pg274.txt',encoding='utf-8').read()
g=g[g.index('Out of love for the truth'):g.index('95. And thus be confident')+200]
g=g[:g.index('\n\n',g.index('95. And thus'))]
th=[]
for blk in re.split(r'\n\s*\n',g):
    b=re.sub(r'\s+',' ',blk).strip()
    if b: th.append({'p':b})
add(id='theses95',title='The Ninety-Five Theses',date='31 October 1517',fam='Lutheran',ctx=['xi-2','xi-1'],
 intro='Luther’s Latin propositions for an academic disputation on indulgences, sent to Archbishop Albrecht of Mainz. Whether they were also nailed to the Castle Church door is debated. They challenge the preaching of indulgences, not yet the papacy or justification as such.',
 src='Works of Martin Luther, vol. 1 (Philadelphia: Holman, 1915), trans. C. M. Jacobs, via Project Gutenberg #274; public domain.',body=th)
au=ccel_rows('creeds3.iii.ii.html',1,start=r'Invincible Emperor Charles V',drop=(r'^—+$',))
add(id='augsburg',title='The Augsburg Confession',date='25 June 1530',fam='Lutheran',ctx=['xi-2','xi-6'],
 intro='Written by Philip Melanchthon and read to Charles V at the Diet of Augsburg, it is the basic confession of the Lutheran Churches. Part One (Articles I–XXI) sets out doctrine and stresses continuity with the catholic faith; Part Two (XXII–XXVIII) treats the abuses the reformers had corrected.',
 src='Schaff, Creeds of Christendom III, English translation by C. P. Krauth (1868, rev. 1874); public domain.',body=au)
sc=ccel_rows('creeds3.iii.iii.html',1)
hd=ccel_rows('creeds3.iv.vi.html',1)
add(id='heidelberg',title='The Heidelberg Catechism',date='1563',fam='Reformed',ctx=['xi-3'],
 intro='Written at Heidelberg under Elector Frederick III, chiefly by Zacharias Ursinus. Its 129 questions follow the pattern of Romans: our misery, our deliverance, our thankfulness. It opens with its best-known question, “What is thy only comfort in life and in death?”',
 src='Schaff, Creeds of Christendom III (American Reformed translation); public domain.',body=hd)
bg=ccel_rows('creeds3.iv.viii.html',1,start=r'^The Confession of Faith$')
add(id='belgic',title='The Belgic Confession',date='1561, revised 1619',fam='Reformed',ctx=['xi-3'],
 intro='Composed in French by Guido de Brès, a Reformed preacher in the southern Netherlands who was executed in 1567. Revised at the Synod of Dort, it is one of the “Three Forms of Unity” of Dutch Reformed Churches with the Heidelberg Catechism and the Canons of Dort.',
 src='Schaff, Creeds of Christendom III (text of the Reformed Church in America); public domain.',body=bg)
dt=[x for x in extract(S+'creeds3.iv.xvi.html',0,'p',r'^FIRST HEAD OF DOCTRINE')]
add(id='dort',title='The Canons of Dort',date='1618–1619',fam='Reformed',ctx=['xi-3','xi-6'],
 intro='The Synod of Dordrecht’s answer to the five articles of the Remonstrants (Arminians). Its five “heads of doctrine” are the source of what English speakers later summarized as the “five points of Calvinism”.',
 src='Schaff, Creeds of Christendom III (text of the Reformed Church in America); public domain.',body=dt)
wc=ccel_rows('creeds3.iv.xvii.ii.html',0,start=r'^Confession of Faith\.?$',colmap={4:[0,1]})
add(id='westminster',title='The Westminster Confession of Faith',date='1646–1647',fam='Reformed',ctx=['xi-3','xi-5'],
 intro='Drafted by the Westminster Assembly of divines summoned by the English Parliament during the Civil War. It became the confession of the Church of Scotland and of Presbyterian Churches worldwide. American Presbyterians later revised the chapters on the civil magistrate.',
 src='Schaff, Creeds of Christendom III (with the American alterations noted); public domain.',body=wc)
ws=ccel_rows('creeds3.iv.xviii.html',0,start=r'^The Shorter Catechism')
add(id='wsc',title='The Westminster Shorter Catechism',date='1647',fam='Reformed',ctx=['xi-3'],
 intro='The Westminster Assembly’s 107 questions for teaching the young, beginning “What is the chief end of man?”',
 src='Schaff, Creeds of Christendom III; public domain.',body=ws)
a39=ccel_rows('39.html',1)
_i=next(i for i,x in enumerate(a39) if 'whereupon it was agreed' in x.get('p',''))
_j=next(i for i,x in enumerate(a39) if x.get('p','').startswith('The Ratification'))
a39=a39[_i:_j+2]
add(id='art39',title='The Thirty-Nine Articles of Religion',date='1563 / 1571',fam='Anglican',ctx=['xi-5'],
 intro='The doctrinal statement of the Church of England, completed under Elizabeth I. The English edition of 1571, given here in its original spelling, is the authoritative text; it steers between Rome and the Anabaptists and leans Reformed on the sacraments.',
 src='Schaff, Creeds of Christendom III, English edition of 1571; public domain.',body=a39)
me=[x for x in extract(S+'creeds3.v.vi.html',0,'p',r'^I\. OF FAITH')]
add(id='methodist',title='The Methodist Articles of Religion',date='1784',fam='Methodist',ctx=['xiv-3'],
 intro='John Wesley abridged the Thirty-Nine Articles to twenty-four for American Methodists; the Christmas Conference of 1784 added an article on the civil rulers of the new United States. They remain doctrinal standards of United Methodism and related churches.',
 src='Schaff, Creeds of Christendom III; public domain.',body=me)
add(id='lambeth',title='The Chicago-Lambeth Quadrilateral',date='1886 / 1888',fam='Ecumenical',ctx=['xv-4'],
 intro='Four points proposed by the American Episcopal bishops at Chicago (1886) and adopted by the Lambeth Conference (1888) as a basis for reunion. It shaped Anglican ecumenism for the next century.',
 src='Resolution 11 of the Lambeth Conference of 1888; public domain.',
 body=[{'p':'That, in the opinion of this Conference, the following Articles supply a basis on which approach may be by God’s blessing made towards Home Reunion:'},{'p':'(a) The Holy Scriptures of the Old and New Testaments, as “containing all things necessary to salvation,” and as being the rule and ultimate standard of faith.'},{'p':'(b) The Apostles’ Creed, as the Baptismal Symbol; and the Nicene Creed, as the sufficient statement of the Christian faith.'},{'p':'(c) The two Sacraments ordained by Christ Himself — Baptism and the Supper of the Lord — ministered with unfailing use of Christ’s words of Institution, and of the elements ordained by Him.'},{'p':'(d) The Historic Episcopate, locally adapted in the methods of its administration to the varying needs of the nations and peoples called of God into the Unity of His Church.'}])
for d in D:
    d['words']=sum(len((x.get('p') or x.get('h')).split()) for x in d['body'])
json.dump(D,open('/home/user/church/docs.json','w'),ensure_ascii=False)
for d in D: print(d['id'],len(d['body']),d['words'])
