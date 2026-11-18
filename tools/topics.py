"""Topical index from OpenBible.info topic scores (CC BY) -> site/bible/topics.js"""
import json, re, collections
R = '/home/user/church/'
OSIS = 'Gen Exod Lev Num Deut Josh Judg Ruth 1Sam 2Sam 1Kgs 2Kgs 1Chr 2Chr Ezra Neh Esth Job Ps Prov Eccl Song Isa Jer Lam Ezek Dan Hos Joel Amos Obad Jonah Mic Nah Hab Zeph Hag Zech Mal Matt Mark Luke John Acts Rom 1Cor 2Cor Gal Eph Phil Col 1Thess 2Thess 1Tim 2Tim Titus Phlm Heb Jas 1Pet 2Pet 1John 2John 3John Jude Rev'.split()
OURS = 'GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SOL ISA JER LAM EZE DAN HOS JOE AMO OBA JON MIC NAH HAB ZEP HAG ZEC MAL MAT MAR LUK JOH ACT ROM 1CO 2CO GAL EPH PHI COL 1TH 2TH 1TI 2TI TIT PHM HEB JAM 1PE 2PE 1JO 2JO 3JO JUD REV'.split()
O2B = dict(zip(OSIS, OURS))
def conv(o):
    m = re.match(r'^(\w+)\.(\d+)\.(\d+)(?:-(\w+)\.(\d+)\.(\d+))?$', o)
    if not m or m.group(1) not in O2B: return None
    b, c, v = O2B[m.group(1)], int(m.group(2)), int(m.group(3))
    s = '%s%d:%d' % (b, c, v)
    if m.group(4) and O2B.get(m.group(4)) == b:
        c2, v2 = int(m.group(5)), int(m.group(6))
        s += ('-%d' % v2) if c2 == c else ('-%d:%d' % (c2, v2))
    return s
T = collections.defaultdict(list)
for ln in open(R + 'dl/topics/topic-scores.txt', encoding='utf-8'):
    p = ln.rstrip('\n').split('\t')
    if len(p) < 3 or not p[2].lstrip('-').isdigit(): continue
    r = conv(p[1])
    if r: T[p[0].strip().lower()].append((int(p[2]), r))
CATS = [
 ('God', 'trinity:The Trinity|gods love:God’s love|god is love:God is love|grace:Grace|mercy:Mercy|sovereignty:God’s sovereignty|faithfulness:Faithfulness|gods will:God’s will|creation:Creation|image of god:The image of God|names of god:Names of God|holiness:Holiness'),
 ('Christ', 'jesus christ:Jesus Christ|jesus being god:Jesus as God|birth of jesus:The birth of Jesus|christmas:Christmas|the cross:The cross|atonement:Atonement|blood of jesus:The blood of Jesus|easter:Easter|resurrection:Resurrection|second coming:The second coming|kingdom of god:The kingdom of God|miracles:Miracles'),
 ('The Holy Spirit', 'holy spirit:The Holy Spirit|fruit of the spirit:Fruit of the Spirit|spiritual gifts:Spiritual gifts|gifts of the spirit:Gifts of the Spirit'),
 ('Salvation', 'salvation:Salvation|faith:Faith|repentance:Repentance|forgiveness:Forgiveness|justification:Justification|sanctification:Sanctification|righteousness:Righteousness|born again:Being born again|eternal life:Eternal life|predestination:Predestination|election:Election|free will:Free will'),
 ('Church and sacraments', 'church:The Church|the church:The Church (2)|body of christ:The body of Christ|unity in the church:Unity in the Church|fellowship:Fellowship|baptism:Baptism|communion:Communion|the lords supper:The Lord’s Supper|eucharist:Eucharist|confession:Confession|elders:Elders|church leadership:Church leadership|apostles:Apostles|tradition:Tradition|the virgin mary:The Virgin Mary|saints:Saints|heresy:Heresy|false teachers:False teachers|creeds:Creeds'),
 ('Prayer and worship', 'prayer:Prayer|worship:Worship|praise:Praise|thanksgiving:Thanksgiving|fasting:Fasting|sabbath:The Sabbath|giving:Giving|tithing:Tithing|rest:Rest'),
 ('Christian life', 'love:Love|love your enemies:Love your enemies|kindness:Kindness|humility:Humility|patience:Patience|peace:Peace|joy:Joy|hope:Hope|obedience:Obedience|self control:Self-control|courage:Courage|strength:Strength|wisdom:Wisdom|truth:Truth|honesty:Honesty|integrity:Integrity|trusting god:Trusting God|contentment:Contentment|gratitude:Gratitude|forgiving others:Forgiving others|serving others:Serving others|discipleship:Discipleship|spiritual growth:Spiritual growth|hospitality:Hospitality|being a christian:Being a Christian'),
 ('Sin and temptation', 'sin:Sin|temptation:Temptation|pride:Pride|anger:Anger|lust:Lust|greed:Greed|jealousy:Jealousy|envy:Envy|gossip:Gossip|lying:Lying|idolatry:Idolatry|addiction:Addiction|backsliding:Backsliding|apostasy:Apostasy|the tongue:The tongue|the heart:The heart'),
 ('Suffering and comfort', 'suffering:Suffering|trials:Trials|grief:Grief|death:Death|loss:Loss|fear:Fear|anxiety:Anxiety|worry:Worry|depression:Depression|loneliness:Loneliness|comfort:Comfort|healing:Healing|protection:Protection|persecution:Persecution|martyrs:Martyrs'),
 ('Family and relationships', 'marriage:Marriage|divorce:Divorce|family:Family|children:Children|parenting:Parenting|friendship:Friendship|women:Women|men:Men|old age:Old age|youth:Youth|widows:Widows'),
 ('Justice, work and money', 'the poor:The poor|poverty:Poverty|justice:Justice|social justice:Social justice|oppression:Oppression|work:Work|money:Money|wealth:Wealth|debt:Debt|generosity:Generosity|stewardship:Stewardship|leadership:Leadership|government:Government|obeying authority:Obeying authority|war:War'),
 ('Last things', 'end times:The end times|heaven:Heaven|hell:Hell|judgment:Judgment|angels:Angels|demons:Demons|satan:Satan|spiritual warfare:Spiritual warfare'),
 ('Scripture and mission', 'the bible:The Bible|word of god:The word of God|prophecy:Prophecy|the law:The Law|ten commandments:The Ten Commandments|covenants:Covenants|israel:Israel|gentiles:The Gentiles|evangelism:Evangelism|the great commission:The Great Commission|missions:Missions|calling:Calling|purpose:Purpose'),
]
keep = []
for cat, items in CATS:
    out = []
    for it in items.split('|'):
        k, lab = it.split(':')
        if lab.endswith('(2)'): continue
        lst = sorted(T.get(k, []), key=lambda x: -x[0]); good = [r for sc, r in lst if sc >= 1][:24]
        if len(good) >= 4: out.append([lab, good])
    keep.append([cat, out])
s = '__TOPICS(%s);' % json.dumps(keep, separators=(',', ':'))
open(R + 'site/bible/topics.js', 'w').write(s)
print('categories', len(keep), 'topics', sum(len(c[1]) for c in keep), 'KB', len(s) // 1024)
