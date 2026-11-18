R='/home/user/church/'
h=open(R+'site/index.html',encoding='utf-8').read()
i=h.index('\n/* ================= Edition 14: new look'); j=h.index('</style>\n</head>')
h=h[:i]+open(R+'tools/v15.css',encoding='utf-8').read()+h[j:]
open(R+'site/index.html','w',encoding='utf-8').write(h); print('css swapped')
