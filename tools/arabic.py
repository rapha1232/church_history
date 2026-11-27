"""Add the Arabic Bible (Smith–Van Dyck, 1865) to the Bible library.

Usage: python3 tools/arabic.py path/to/arb-vd_vpl.txt

The text is eBible.org's public-domain edition (https://ebible.org/details.php?id=arb-vd), downloaded as
arb-vd_vpl.zip. This writes site/bible/arb/{ot1,ot2,nt}.js in the same format as the other editions and adds
(or replaces) the "arb" edition in src/data/BIBMAN.json, with Arabic book names after the English ones.

Why Van Dyck: the Maronite Church's own Arabic Bible is the Jesuit translation (Beirut, 1876–1880), revised by
Dar el-Machreq in 1989. The revision is under copyright, and the 1876–1880 original exists only as page scans,
so no clean public-domain text of it can be shipped. Van Dyck is the public-domain Arabic Bible read in Lebanon
across the churches. It has the 66 books; the deuterocanonical books stay available in the Catholic editions.
"""
import json, os, re, sys
R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')) + '/'
MAN = R + 'src/data/BIBMAN.json'
OUT = R + 'site/bible/arb/'

AR = {'GEN': 'التكوين', 'EXO': 'الخروج', 'LEV': 'اللاويين', 'NUM': 'العدد', 'DEU': 'التثنية', 'JOS': 'يشوع', 'JDG': 'القضاة',
      'RUT': 'راعوث', '1SA': 'صموئيل الأول', '2SA': 'صموئيل الثاني', '1KI': 'الملوك الأول', '2KI': 'الملوك الثاني',
      '1CH': 'أخبار الأيام الأول', '2CH': 'أخبار الأيام الثاني', 'EZR': 'عزرا', 'NEH': 'نحميا', 'EST': 'أستير', 'JOB': 'أيوب',
      'PSA': 'المزامير', 'PRO': 'الأمثال', 'ECC': 'الجامعة', 'SOL': 'نشيد الأنشاد', 'ISA': 'إشعياء', 'JER': 'إرميا',
      'LAM': 'مراثي إرميا', 'EZE': 'حزقيال', 'DAN': 'دانيال', 'HOS': 'هوشع', 'JOE': 'يوئيل', 'AMO': 'عاموس', 'OBA': 'عوبديا',
      'JON': 'يونان', 'MIC': 'ميخا', 'NAH': 'ناحوم', 'HAB': 'حبقوق', 'ZEP': 'صفنيا', 'HAG': 'حجي', 'ZEC': 'زكريا', 'MAL': 'ملاخي',
      'MAT': 'متى', 'MAR': 'مرقس', 'LUK': 'لوقا', 'JOH': 'يوحنا', 'ACT': 'أعمال الرسل', 'ROM': 'رومية', '1CO': 'كورنثوس الأولى',
      '2CO': 'كورنثوس الثانية', 'GAL': 'غلاطية', 'EPH': 'أفسس', 'PHI': 'فيلبي', 'COL': 'كولوسي', '1TH': 'تسالونيكي الأولى',
      '2TH': 'تسالونيكي الثانية', '1TI': 'تيموثاوس الأولى', '2TI': 'تيموثاوس الثانية', 'TIT': 'تيطس', 'PHM': 'فليمون',
      'HEB': 'العبرانيين', 'JAM': 'يعقوب', '1PE': 'بطرس الأولى', '2PE': 'بطرس الثانية', '1JO': 'يوحنا الأولى',
      '2JO': 'يوحنا الثانية', '3JO': 'يوحنا الثالثة', 'JUD': 'يهوذا', 'REV': 'رؤيا يوحنا'}


def parse(path):
    books = {}
    for line in open(path, encoding='utf-8'):
        m = re.match(r'^(\w{3}) (\d+):(\d+) (.*)$', line.rstrip('\n'))
        if not m: continue
        b, c, v, t = m.group(1), int(m.group(2)), int(m.group(3)), m.group(4).replace('\xa0', ' ').strip()
        if t: books.setdefault(b, {}).setdefault(c, []).append([v, t])
    return books


def main(path):
    data = parse(path)
    man = json.load(open(MAN, encoding='utf-8'))
    kjv = next(e for e in man['eds'] if e['id'] == 'kjv')
    missing = [b[0] for b in kjv['books'] if b[0] not in data]
    assert not missing, 'books missing from the source: %s' % missing
    files = {}
    books = []
    for code, _, name, _, sec in kjv['books']:
        chs = data[code]
        files.setdefault(man['sgrp'][man['grp'][code]], []).append(
            '__BIB("arb","%s",%s);' % (code, json.dumps([[c, chs[c]] for c in sorted(chs)], ensure_ascii=False, separators=(',', ':'))))
        books.append([code, 'arb', '%s (%s)' % (name, AR[code]), max(chs), sec])
    os.makedirs(OUT, exist_ok=True)
    for f, parts in files.items():
        open(OUT + f + '.js', 'w', encoding='utf-8').write('\n'.join(parts) + '\n')
    ed = {'id': 'arb', 'name': 'Arabic Bible (Smith–Van Dyck)', 'short': 'عربي', 'trad': 'Arabic', 'year': '1865',
          'lang': 'ar', 'rtl': 1, 'books': books,
          'note': 'الكتاب المقدس: the Arabic Bible translated in Beirut by Eli Smith, Cornelius Van Dyck, Butrus al-Bustani and '
                  'Nasif al-Yaziji, published in 1865, with the 66-book canon. It is the public-domain Arabic text read across '
                  'the churches of Lebanon and the Middle East. The Maronite liturgy reads the Catholic Jesuit translation '
                  '(Beirut, 1876–1880; revised 1989), which is still under copyright; for the deuterocanonical books use the '
                  'Douay–Rheims or the Vulgate, or add your own copy under Settings → Bible editions from a file.'}
    man['eds'] = [e for e in man['eds'] if e['id'] != 'arb'] + [ed]
    man['src']['arb'] = 'Smith–Van Dyck Arabic Bible, 1865 (eBible.org, public domain)'
    json.dump(man, open(MAN, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    open(MAN, 'a').write('\n')
    print('arb:', len(books), 'books,', sum(len(v) for b in data.values() for v in b.values()), 'verses')


if __name__ == '__main__':
    main(sys.argv[1])
