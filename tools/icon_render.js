// Renders the PNG icons from the SVGs that tools/icon.py writes. Run from the repository root:
//   python3 tools/icon.py && node tools/icon_render.js
const {chromium} = require('playwright'), fs = require('fs');
const jobs = [['android/icon.svg', 'android/icon512.png', 512], ['android/icon-full.svg', 'android/icon-full512.png', 512],
  ['android/icon-maskable.svg', 'android/icon-maskable512.png', 512]];
for (const [d, n] of [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]])
  jobs.push(['android/icon.svg', `android/res/mipmap-${d}/ic_launcher.png`, n]);
(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  for (const [src, out, size] of jobs) {
    const svg = fs.readFileSync(src, 'utf8').replace(/width="\d+" height="\d+"/, `width="${size}" height="${size}"`);
    await p.setViewportSize({width: size, height: size});
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    await p.screenshot({path: out, omitBackground: true, clip: {x: 0, y: 0, width: size, height: size}});
    console.log(out, size);
  }
  await b.close();
})();
