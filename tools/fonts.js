// Fetch Google Fonts CSS + woff2 with a real browser and write android/assets/fonts(.css)
const { chromium } = require('playwright'); const fs = require('fs'); const crypto = require('crypto');
const path = require('path');
const URL = process.argv[2], OUT = path.join(__dirname, '..', 'android', 'assets') + '/';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const r = await p.goto(URL); let css = await r.text();
  const keep = /\/\* (latin|latin-ext|greek|greek-ext) \*\//;
  const blocks = css.split(/(?=\/\* [a-z-]+ \*\/)/).filter(x => keep.test(x));
  fs.rmSync(OUT + 'fonts', {recursive:true, force:true}); fs.mkdirSync(OUT + 'fonts');
  let out = '', n = 0, bytes = 0; const seen = {};
  for (const blk of blocks) {
    const m = blk.match(/url\((https:[^)]+)\)/); if (!m) continue;
    if (!seen[m[1]]) { const resp = await p.request.get(m[1]); const buf = await resp.body(); const name = crypto.createHash('sha1').update(m[1]).digest('hex').slice(0,10) + '.woff2'; fs.writeFileSync(OUT + 'fonts/' + name, buf); seen[m[1]] = name; n++; bytes += buf.length; }
    out += blk.replace(m[1], 'fonts/' + seen[m[1]]);
  }
  fs.writeFileSync(OUT + 'fonts.css', out); console.log('fonts', n, 'KB', Math.round(bytes/1024)); await b.close();
})();
