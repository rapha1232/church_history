import re
CTX = r'(?:\b(?:in|by|from|until|till|after|before|since|c\.|ca\.|AD|around|circa|of)\s+(?:the\s+(?:year\s+)?)?|\(|–|-|,\s)'
RX = re.compile(CTX + r'(\d{2,4})(?:\s*(BC|BCE|AD|CE))?(?=[\s.,;:)\]–-]|$)')
NOUN = re.compile(r'^(?:\s+(?:[A-Z]?[a-z]+\s+)?(?:bishops|books|years|people|km|members|percent|million|thousand|men|monks|copies|words|chapters|canons|signatories|delegates|churches|martyrs|servants|names|lines|letters|pages|soldiers|days|times|cities|dioceses|manuscripts|clergy|priests)\b|%|,\d|\.\d)', re.I)
PRE_BAD = re.compile(r'(?:chapter|ch\.|canons?|vol\.|pp?\.|no\.|Psalm|Genesis|Exodus|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Hebrews|Isaiah|article|art\.|session|book|letter|epistle|homily|sermon|§|number|figure|about|some|over|nearly|perhaps|roughly|approximately|least|than|DH|Novel|Gaius|Antiquities|Tanner)\W{0,3}$', re.I)
BIB = re.compile(r'(ANF|NPNF|Trans\.|Press|Oxford|Cambridge|Chicago|Princeton|Leiden|Turnhout|Wiesbaden|Brunswick|Harvard|Clarendon|Brepols|Zeitschrift|ed\.|eds\.|edition)', re.I)
def first_year(text):
    for m in RX.finditer(text):
        y = int(m.group(1)); era = m.group(2)
        numstart = m.start(1)
        pre = text[max(0, numstart - 30):numstart]
        post = text[m.end():m.end() + 26]
        if PRE_BAD.search(text[max(0, numstart - 18):numstart].rstrip('( –-')): continue
        if BIB.search(text[max(0, numstart - 40):numstart]): continue
        if re.search(r'\d[,.:]\s*\d*\s*[–-]?\s*$', pre): continue
        if y >= 1800 and re.search(r"[A-Z][a-zA-Zé'’]+\s*\($|[A-Z][a-z]+'s [A-Z][^()]{0,30}\($", pre): continue
        if y >= 1800 and re.search(r"(?:[A-Z][a-z]+,\s*$|[\"”'’]\s*,?\s*\(?$|(?:thesis|research|category|model|construct|study|book|term)\W*\($|\s,\s*$)", pre): continue
        if NOUN.match(post): continue
        if era and era.startswith('B'): y = -y
        if y > 2026 or y == 0 or (0 < y < 30 and not era): continue
        if y < 100 and not era and not re.match(r'\s*[–-]\s*\d', post) and not re.search(r'(c\.|AD)\s*$', pre): continue
        return y, text[max(0, m.start() - 30):m.end() + 20]
    return None
