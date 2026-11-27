// Accessibility check: runs axe-core (WCAG 2.1 A and AA rules) on the main pages of the built app in Chromium,
// in the dark and light themes. Fails on any "critical" or "serious" violation that is not in KNOWN below.
// Run from the repository root:
//   npm install --no-save playwright axe-core && python3 scripts/build_site.py && node tests/a11y.js
// Set A11Y_REPORT=1 to print every violation, including minor and moderate ones.
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'file://' + path.join(ROOT, 'site', 'index.html');
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const PHONE = { width: 390, height: 844 }, DESK = { width: 1280, height: 900 };

const ROUTES = ['#home', '#series', '#iv-6', '#library', '#bible~web~JOH~3~16', '#bible~arb~JOH~3~16', '#prayers', '#ref-people', '#ref-settings',
  '#ref-calendar', '#ref-succession', '#ref-heresies', '#ref-buildings', '#ref-icons', '#ref-spread'];
const THEMES = (process.env.A11Y_THEMES || 'dark,light,sepia').split(',');

// Rules with known, accepted exceptions: [rule id, CSS selector fragment, reason]. Keep this list short and explain each entry.
const KNOWN = [];

(async () => {
  const browser = await chromium.launch();
  const found = [], report = process.env.A11Y_REPORT === '1';
  for (const theme of THEMES) for (const vp of [PHONE, DESK]) for (const hash of ROUTES) {
    const p = await browser.newPage({ viewport: vp });
    await p.addInitScript(t => { try { localStorage.setItem('hcc.onb', '1'); localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await p.goto(URL + hash);
    await p.waitForTimeout(1500);
    await p.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
    await p.waitForTimeout(900); // let the theme's colour transitions finish
    await p.addScriptTag({ content: AXE });
    const res = await p.evaluate(async () => {
      const a = document.querySelector('main > article.active');
      // Only the page being shown, the header and the tab bar: hidden pages are display:none and axe skips them anyway.
      const r = await axe.run({ include: [['main > article.active'], ['.topbar'], ['.tabbar']].filter(s => document.querySelector(s[0])) },
        { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }, resultTypes: ['violations'] });
      return { id: a ? a.id : '', v: r.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map(n => n.target.join(' ')).slice(0, 6), n: v.nodes.length })) };
    });
    for (const v of res.v) {
      const nodes = v.nodes.filter(sel => !KNOWN.some(k => k[0] === v.id && sel.indexOf(k[1]) >= 0));
      if (!nodes.length) continue;
      const blocking = v.impact === 'critical' || v.impact === 'serious';
      if (blocking || report) found.push({ blocking, where: theme + ' ' + (vp === PHONE ? 'phone' : 'desktop') + ' ' + hash, v, nodes });
    }
    await p.close();
  }
  await browser.close();
  const seen = new Set();
  for (const f of found) {
    const key = f.v.id + '|' + f.nodes.join(',');
    if (seen.has(key)) continue; seen.add(key);
    console.log((f.blocking ? 'FAIL ' : 'note ') + f.v.impact + ' ' + f.v.id + ' (' + f.v.n + ') on ' + f.where + ': ' + f.v.help + '\n     ' + f.nodes.join('\n     '));
  }
  const n = found.filter(f => f.blocking).length;
  if (n) { console.log('\n' + n + ' serious or critical accessibility problem(s)'); process.exit(1); }
  console.log('\nNo serious or critical accessibility problems on ' + ROUTES.length + ' pages × ' + THEMES.length + ' themes × 2 sizes');
})();
