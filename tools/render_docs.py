import re, html as H

def esc(s): return H.escape(s, quote=True)

LABEL = re.compile(r'^((?:Art\.|ART\.|Article|ARTICLE)\s*[IVXLC]+\.?(?:\s*[—–-]\s*)?|CANON\s+[IVXLC]+\.?\s*[—–-]?|Canon\s+[IVXLC]+\.?\s*[—–-]?|\d{1,3}\.|Ans\.|Answer\.|A\.)\s+(.*)$', re.S)
QPAT = re.compile(r'^(?:Ques(?:tion)?\.?\s*(\d+)\.?)\s*(.*)$', re.S)
HEADPAT = re.compile(r'^(Chapter|CHAPTER|Cap\.|CHAP\.|Art\.|ART\.|Article|ARTICLE|PART|Part|Section|SECTION|Session|SESSION|Lord\'s Day|LORD\'S DAY|FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|THE (FIRST|SECOND|THIRD) PART|Rejection|REJECTION|DECREE|Decree|The Ratification|Conclusion|CONCLUSION|Preface|PREFACE|Anathema)\b|^[IVXLC]+\.\s*$')

def is_caps(t):
    letters = [c for c in t if c.isalpha()]
    return len(letters) > 3 and sum(c.isupper() for c in letters) / len(letters) > 0.85

def classify(body):
    """Turn extracted items into typed blocks: ('h',title,sub) ('q',n,text) ('a',text) ('p',label,text)."""
    out = []
    pending_answer = False
    for it in body:
        t = re.sub(r'^[—–\-]{2,}\s*', '', (it.get('h') or it.get('p') or '').strip())
        if not t or re.fullmatch(r'[—–\-\s*]+', t): continue
        # question
        m = QPAT.match(t)
        if m and len(t) < 400:
            n, rest = m.group(1), m.group(2).strip()
            out.append(['q', n, rest]); continue
        if t in ('Answer.', 'Ans.', 'Answer'):
            pending_answer = True; continue
        if out and out[-1][0] == 'q' and not out[-1][2]:
            out[-1][2] = t; continue
        if pending_answer:
            out.append(['a', t]); pending_answer = False; continue
        m = LABEL.match(t)
        if m and len(t) > 90:
            lab = m.group(1).strip()
            if lab in ('Ans.', 'Answer.', 'A.'):
                out.append(['a', m.group(2)]); continue
            out.append(['p', lab, m.group(2)]); continue
        short = len(t) <= 95
        if short and (HEADPAT.match(t) or is_caps(t) or 'h' in it):
            # subtitle merge: heading directly followed by another short heading-ish line
            if out and out[-1][0] == 'h' and not out[-1][2] and (out[-1][1].rstrip('.').strip() in ('I','II','III') or re.match(r'^(Art|ART|Chapter|CHAPTER|Article|[IVXLC]+\.|Anathema)', out[-1][1])):
                out[-1][2] = t; continue
            out.append(['h', t, '']); continue
        if short and out and out[-1][0] == 'h' and not out[-1][2] and re.match(r'^(Of |OF |On |Concerning|De )', t):
            out[-1][2] = t; continue
        out.append(['p', '', t])
    return out

def render(doc):
    blocks = classify(doc['body'])
    parts, toc, n = [], [], 0
    for b in blocks:
        if b[0] == 'h':
            n += 1; hid = 'd-%s-%d' % (doc['id'], n)
            title = b[1].rstrip(':')
            sub = b[2]
            parts.append('<h4 class="dh" id="%s">%s%s</h4>' % (hid, esc(title), ('<span class="dsub">%s</span>' % esc(sub)) if sub else ''))
            toc.append((hid, (title + (' ' + sub if sub else '')).strip()))
        elif b[0] == 'q':
            parts.append('<p class="dq"><b class="dl">Q.%s</b> %s</p>' % ((' ' + b[1]) if b[1] else '', esc(b[2])))
        elif b[0] == 'a':
            parts.append('<p class="da"><b class="dl">A.</b> %s</p>' % esc(b[1]))
        else:
            lab = b[1]
            parts.append('<p>%s%s</p>' % (('<b class="dl">%s</b> ' % esc(lab)) if lab else '', esc(b[2])))
    return ''.join(parts), toc
