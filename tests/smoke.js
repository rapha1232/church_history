// Smoke test: opens the built app (site/index.html) in Chromium and fails on any JavaScript error,
// page wider than a phone screen, or a broken core feature. Run from the repository root:
//   node tests/smoke.js
// Needs Playwright (npm install playwright, then npx playwright install chromium).
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'file://' + path.join(ROOT, 'site', 'index.html');
const PHONE = { width: 390, height: 844 }, DESK = { width: 1366, height: 900 };

// [name, viewport, hash]
const ROUTES = [
  ['home', PHONE, '#home'], ['season', PHONE, '#vol-iv'], ['episode', PHONE, '#iv-6'],
  ['bible-kjv', PHONE, '#bible~kjv~JOH~1~1'], ['bible-dra-tobit', PHONE, '#bible~dra~TOB~1~1'],
  ['bible-greek', PHONE, '#bible~lxxg~GEN~1~1'],
  ['series', PHONE, '#series'], ['library', PHONE, '#library'], ['studies', PHONE, '#studies'],
  ['people', PHONE, '#ref-people'], ['glossary', PHONE, '#ref-glossary'], ['texts', PHONE, '#ref-texts'],
  ['settings', PHONE, '#ref-settings'], ['timeline', PHONE, '#ref-zoom'],
  ['home-desktop', DESK, '#home'], ['episode-desktop', DESK, '#iv-6'], ['bible-desktop', DESK, '#bible~web~ROM~8~28'],
];

const failures = [];
const fail = (name, msg) => { failures.push(name + ': ' + msg); console.log('  FAIL ' + name + ': ' + msg); };

async function page(browser, name, vp) {
  const p = await browser.newPage({ viewport: vp, hasTouch: vp.width < 500, isMobile: vp.width < 500 });
  await p.addInitScript(() => { try { localStorage.setItem('hcc.onb', '1'); } catch (e) {} });
  p.on('pageerror', e => fail(name, 'page error: ' + e.message.split('\n')[0]));
  p.on('console', m => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/net::ERR_|Failed to load resource/.test(t)) return; // missing optional files on file://, reported below if they matter
    fail(name, 'console error: ' + t.split('\n')[0]);
  });
  return p;
}

async function finish(browser) {
  await browser.close();
  if (failures.length) { console.log('\n' + failures.length + ' failure(s)'); process.exit(1); }
  console.log('\nAll smoke tests passed');
  process.exit(0);
}

(async () => {
  const browser = await chromium.launch();

  for (const [name, vp, hash] of ROUTES) {
    const p = await page(browser, name, vp);
    await p.goto(URL + hash);
    await p.waitForTimeout(1500);
    const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (over > 1) fail(name, 'page is ' + over + 'px wider than the screen');
    const shown = await p.evaluate(() => { const a = document.querySelector('main > article.active'); return a ? a.id : ''; });
    if (!shown) fail(name, 'no page is shown');
    console.log('  ok   ' + name + (shown ? ' (' + shown + ')' : ''));
    await p.close();
  }

  // Bible: verse text loads
  {
    const p = await page(browser, 'bible-text', PHONE);
    await p.goto(URL + '#bible~web~JOH~3~16');
    await p.waitForTimeout(2000);
    const txt = await p.evaluate(() => document.querySelector('#bible').innerText);
    if (!/God so loved the world/.test(txt)) fail('bible-text', 'John 3:16 (WEB) did not render');
    else console.log('  ok   bible-text');
    await p.close();
  }

  // Studies: import a study file, verses load, Default Bible changes the edition
  {
    const p = await page(browser, 'studies-import', PHONE);
    await p.goto(URL + '#studies');
    await p.waitForTimeout(1200);
    const fixture = path.join(__dirname, 'fixtures', 'study.json');
    const input = await p.$('input[type=file][data-st="import"]');
    if (!input) { fail('studies-import', 'the Import a study file button is missing'); await p.close(); return finish(browser); }
    await input.setInputFiles(fixture);
    await p.waitForTimeout(2500);
    const n = await p.$$eval('.st-it', x => x.length);
    if (n !== 3) fail('studies-import', 'expected 3 items after import, found ' + n);
    const re = await p.$$eval('.st-re .st-go', x => x.length), rby = await p.$$eval('.st-it.is-answered', x => x.length);
    if (re !== 1 || rby !== 1) fail('studies-import', 'answer link lost on import (answers ' + re + ', answered ' + rby + ')');
    await p.click('[data-view=threads]'); await p.waitForTimeout(300);
    if (await p.$$eval('.st-root .st-thread .st-tn', x => x.length) !== 1) fail('studies-import', 'Threads view does not nest the answer');
    await p.click('[data-view=cols]'); await p.waitForTimeout(300);
    const v = await p.$$eval('.st-it.t-verse .st-q', x => x.map(e => e.textContent));
    if (!v.length || /Loading/.test(v[0])) fail('studies-import', 'verse text did not load');
    // Change the default and re-open the study in the same page. (A reload is avoided on purpose: headless
    // Chromium can drop localStorage writes made just before reloading a file:// page.)
    const study = await p.evaluate(() => location.hash);
    await p.evaluate(() => { localStorage.setItem('hcc.bible.def', '"dra"'); location.hash = 'home'; });
    await p.waitForTimeout(500);
    await p.evaluate(h => { location.hash = h; }, study);
    await p.waitForTimeout(2500);
    const lab = await p.$$eval('.st-it.t-verse .st-head', x => x.map(e => e.textContent));
    if (!lab.length || !/DRA/.test(lab[0])) fail('studies-import', 'Default Bible (DRA) not applied: ' + lab.join(' | '));
    if (!failures.some(f => f.startsWith('studies-import'))) console.log('  ok   studies-import');
    await p.close();
  }

  // Early Christian texts: catalogue, a deep link to a section, scripture links
  {
    const p = await page(browser, 'fathers', PHONE);
    await p.goto(URL + '#ref-fathers');
    await p.waitForTimeout(1500);
    const n = await p.$$eval('#ref-fathers .ed21-rows li', x => x.length);
    if (n !== 14) fail('fathers', 'expected 14 works in the catalogue, found ' + n);
    await p.evaluate(() => { location.hash = 'ref-fathers~iren-ah3~3~2'; });
    await p.waitForTimeout(1500);
    const here = await p.$eval('.ft-here', x => x.textContent).catch(() => '');
    if (!/every Church should agree with this Church/.test(here)) fail('fathers', 'Irenaeus 3.3.2 did not open at its section');
    if (await p.$$eval('#ft-3 [data-sref]', x => x.length) < 1) fail('fathers', 'no scripture links in Irenaeus 3.3');
    if (!(await p.$('#ft-3 .au-box'))) fail('fathers', 'no authenticity note on Irenaeus 3.3');
    const m = await p.evaluate(() => [HCCAuth.match('Ignatius of Antioch', 'Letter to the Smyrnaeans 8'), HCCAuth.match('Ignatius', 'Epistle to the Tarsians'), HCCAuth.match('Augustine', 'Sermon 131')].join(','));
    if (m !== 'ign7,ignlong,') fail('fathers', 'authenticity matcher returned ' + m);
    await p.evaluate(() => { location.hash = 'ref-fathers~ign-rom~0'; });
    await p.waitForTimeout(1500);
    await p.click('[data-ft=orig]'); await p.waitForTimeout(1200);
    const gk = await p.$eval('#ft-0 .ft-o', x => x.textContent).catch(() => '');
    if (!/προκαθημένη τῆς ἀγάπης/.test(gk)) fail('fathers', 'Greek of Romans greeting not shown');
    await p.click('[data-ft=orig]'); await p.waitForTimeout(300);
    if (!failures.some(f => f.startsWith('fathers'))) console.log('  ok   fathers');
    await p.close();
  }

  // Quote cards carry the edition, and long quotes are marked abridged
  {
    const p = await page(browser, 'cards', PHONE);
    await p.goto(URL + '#home');
    await p.waitForTimeout(1500);
    const r = await p.evaluate(() => {
      HCCShareCard('In the beginning God created the heaven and the earth.', 'Genesis 1:1 (KJV)', '');
      const a = !document.querySelector('.cardprev.ed25').hidden && document.querySelector('.ed25-cut').hidden;
      HCCCard({q: 'word '.repeat(400), by: 'Test', sub: '', src: 'Test edition'});
      const b = !document.querySelector('.ed25-cut').hidden;
      return a && b;
    });
    if (!r) fail('cards', 'card preview or abridged notice did not behave as expected');
    else console.log('  ok   cards');
    await p.close();
  }

  // Settings: exactly one Default Bible section listing every edition
  {
    const p = await page(browser, 'settings-default-bible', PHONE);
    await p.goto(URL + '#ref-settings');
    await p.waitForTimeout(1500);
    const secs = await p.$$eval('#ref-settings .set-sec h3', h => h.filter(x => x.textContent === 'Default Bible').length);
    const opts = await p.$$eval('#setDefEd option', o => o.length);
    if (secs !== 1) fail('settings-default-bible', 'expected one Default Bible section, found ' + secs);
    if (opts < 10) fail('settings-default-bible', 'expected at least 10 options, found ' + opts);
    if (secs === 1 && opts >= 10) console.log('  ok   settings-default-bible');
    await p.close();
  }

  await finish(browser);
})().catch(e => { console.error(e); process.exit(1); });
