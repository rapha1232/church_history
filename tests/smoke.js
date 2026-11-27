// Smoke test: opens the built app (site/index.html) in Chromium and fails on any JavaScript error,
// page wider than a phone screen, or a broken core feature. Run from the repository root:
//   python3 scripts/build_site.py && node tests/smoke.js
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
  ['settings', PHONE, '#ref-settings'], ['timeline', PHONE, '#ref-zoom'], ['prayers', PHONE, '#prayers'],
  ['home-desktop', DESK, '#home'], ['episode-desktop', DESK, '#iv-6'], ['bible-desktop', DESK, '#bible~web~ROM~8~28'],
  ['bible-arabic', PHONE, '#bible~arb~JOH~3~16'], ['calendar', PHONE, '#ref-calendar'], ['succession', PHONE, '#ref-succession'],
  ['heresies', PHONE, '#ref-heresies'], ['buildings', PHONE, '#ref-buildings'], ['icons', PHONE, '#ref-icons'], ['spread', PHONE, '#ref-spread'],
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

  // Arabic Bible: right to left, and the text loads
  {
    const p = await page(browser, 'bible-arabic-text', PHONE);
    await p.goto(URL + '#bible~arb~JOH~3~16');
    await p.waitForTimeout(2000);
    const r = await p.evaluate(() => { const t = document.querySelector('#bible .bib-text'); return t ? [t.dir, t.lang, t.textContent] : null; });
    if (!r || r[0] !== 'rtl' || r[1] !== 'ar' || !/هكذا أحب ٱلله ٱلعالم/.test(r[2].replace(/[\u064B-\u0652\u0670]/g, ''))) fail('bible-arabic-text', 'John 3:16 (Van Dyck) did not render right to left');
    else console.log('  ok   bible-arabic-text');
    await p.close();
  }

  // Edition 25 reference pages: the calendar's Easter dates, heresy filters, the spread map, search filters, print
  {
    const p = await page(browser, 'edition25', PHONE);
    await p.goto(URL + '#ref-calendar');
    await p.waitForTimeout(1500);
    const e = await p.evaluate(() => [2025, 2026, 2027].map(y => { const w = HCCCalendar.easter(y), o = HCCCalendar.pascha(y); return (w.getMonth() + 1) + '/' + w.getDate() + ' ' + (o.getMonth() + 1) + '/' + o.getDate(); }).join(', '));
    if (e !== '4/20 4/20, 4/5 4/12, 3/28 5/2') fail('edition25', 'Easter / Pascha dates wrong: ' + e);
    await p.evaluate(() => { location.hash = 'ref-heresies'; });
    await p.waitForTimeout(800);
    await p.click('#ref-heresies [data-hth="christ"]');
    const vis = await p.$$eval('#ref-heresies .hx', x => x.filter(c => !c.hidden).length);
    if (vis < 5 || vis > 12) fail('edition25', 'heresy filter "Christ" shows ' + vis + ' entries');
    await p.evaluate(() => { location.hash = 'ref-spread'; });
    await p.waitForTimeout(800);
    await p.evaluate(() => { const r = document.querySelector('#spR'); r.value = 1000; r.dispatchEvent(new Event('input', { bubbles: true })); });
    const sp = await p.$$eval('#spDots .sp-pt.on', x => x.length);
    if (sp < 30 || sp > 45) fail('edition25', 'spread map shows ' + sp + ' places in AD 1000');
    await p.evaluate(() => { location.hash = 'iv-6'; });
    await p.waitForTimeout(1500);
    if (!(await p.$('#iv-6 .ed21-print'))) fail('edition25', 'no Print button on an episode');
    if (!(await p.$('#iv-6 .mw li'))) fail('edition25', 'no "Meanwhile in the world" strip on an episode');
    await p.fill('#q', 'Athanasius');
    await p.waitForTimeout(800);
    await p.click('#results [data-sxf="people"]');
    const groups = await p.$$eval('#results .sx-g', x => x.filter(g => getComputedStyle(g).display !== 'none').map(g => g.dataset.sxg).join(','));
    if (groups !== 'people') fail('edition25', 'search filter "People" shows ' + groups);
    if (!failures.some(f => f.startsWith('edition25'))) console.log('  ok   edition25');
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

  // Fathers on this verse: Matthew 16:18 has 7 excerpts in the bundled commentary
  {
    const p = await page(browser, 'fathers-count', PHONE);
    await p.goto(URL + '#bible~kjv~MAT~16~18');
    await p.waitForTimeout(2500);
    const n = await p.$eval('#bibView .bv[data-v="18"] .fv', x => x.textContent).catch(() => '');
    if (n !== '7') fail('fathers-count', 'expected 7 on Matthew 16:18, found "' + n + '"');
    else console.log('  ok   fathers-count');
    await p.close();
  }

  // The deuterocanon in the New Testament: 10 visible parallels and a marker on Hebrews 1:3
  {
    const p = await page(browser, 'dcnt', PHONE);
    await p.goto(URL + '#bible-dcnt');
    await p.waitForTimeout(2500);
    const n = await p.$$eval('.dc-pair', x => x.filter(e => e.offsetHeight > 0).length);
    if (n !== 10) fail('dcnt', 'expected 10 visible parallels, found ' + n);
    await p.goto(URL + '#bible~kjv~HEB~1~3');
    await p.waitForTimeout(2500);
    const m = await p.$$eval('#bibView .dcm', x => x.map(b => b.textContent).join('|'));
    if (!/Wisdom 7:25/.test(m)) fail('dcnt', 'no Wisdom marker on Hebrews 1:3 (' + m + ')');
    if (!failures.some(f => f.startsWith('dcnt'))) console.log('  ok   dcnt');
    await p.close();
  }

  // How doctrines developed: three doctrines, the Eucharist tab has 10 witnesses
  {
    const p = await page(browser, 'doctrines', PHONE);
    await p.goto(URL + '#ref-doctrines~eucharist');
    await p.waitForTimeout(2500);
    const tabs = await p.$$eval('[data-dt]', x => x.length), n = await p.$$eval('.dt-it', x => x.length);
    if (tabs !== 3 || n !== 10) fail('doctrines', 'expected 3 doctrines and 10 Eucharist witnesses, found ' + tabs + ' and ' + n);
    else console.log('  ok   doctrines');
    await p.close();
  }

  // Ready-made studies: five offered; adding one creates a study with its verses loaded
  {
    const p = await page(browser, 'ready-studies', PHONE);
    await p.goto(URL + '#studies');
    await p.waitForTimeout(1200);
    await p.click('[data-st=ready]'); await p.waitForTimeout(1200);
    const n = await p.$$eval('[data-ready]', x => x.length);
    if (n !== 5) fail('ready-studies', 'expected 5 ready-made studies, found ' + n);
    else {
      await p.click('[data-ready="0"]'); await p.waitForTimeout(2500);
      const r = await p.evaluate(() => [document.querySelectorAll('.st-it').length, [...document.querySelectorAll('.st-it.t-verse .st-q')].filter(e => !/Loading/.test(e.textContent)).length]);
      if (r[0] !== 14 || r[1] !== 6) fail('ready-studies', 'papacy study: expected 14 items and 6 loaded verses, found ' + r.join(' and '));
      else console.log('  ok   ready-studies');
    }
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

  // a Bible reference typed in the search bar opens that verse
  {
    const p = await page(browser, 'search-bible-ref', DESK);
    await p.goto(URL + '#home');
    await p.waitForTimeout(1500);
    await p.focus('#q');
    await p.type('#q', 'John 3:36');
    await p.keyboard.press('Enter');
    await p.waitForTimeout(1500);
    const r = await p.evaluate(() => ({ hash: location.hash, st: window.HCCBible && HCCBible.state(), hl: (document.querySelector('#bible .bv.hl') || {}).dataset }));
    if (r.hash !== '#bible' || !r.st || r.st.b !== 'JOH' || r.st.c !== 3 || !r.hl || r.hl.v !== '36') fail('search-bible-ref', 'expected John 3:36, got ' + JSON.stringify(r));
    else console.log('  ok   search-bible-ref');
    await p.close();
  }

  // the Prayers page: themes filter the list, Bible prayers load their text
  {
    const p = await page(browser, 'prayers', PHONE);
    await p.goto(URL + '#prayers');
    await p.waitForTimeout(1500);
    const themes = await p.$$eval('#prayers .pr-th', b => b.length);
    await p.click('#prayers .pr-th[data-prth="night"]');
    await p.waitForTimeout(400);
    const night = await p.$$eval('#prResults .pr-card', d => d.length);
    await p.click('#prResults [data-pid="ps-4-8"] summary');
    await p.waitForTimeout(1500);
    const verse = await p.$eval('#prResults [data-pid="ps-4-8"] .pr-text', e => e.textContent);
    if (themes < 20 || night < 10 || !/peace/i.test(verse)) fail('prayers', 'themes ' + themes + ', night prayers ' + night + ', Psalm 4:8 "' + verse.slice(0, 60) + '"');
    else console.log('  ok   prayers');
    await p.close();
  }

  // Bible tools: lexicon, the Fathers on a passage, parallel passages
  {
    const p = await page(browser, 'bible-tools', DESK);
    await p.goto(URL + '#bible~web~JOH~1~1');
    await p.waitForTimeout(2000);
    await p.evaluate(() => HCCBible.lexicon('shalom'));
    await p.waitForTimeout(3000);
    const lex = await p.$$eval('#bibView .lx-res li', l => l.length);
    await p.evaluate(() => { HCCBibleX.st.fq = 'John 1'; HCCBibleX.tool('fathers'); });
    await p.waitForTimeout(2500);
    const fa = await p.$$eval('#bibView .fp-sec .fa', l => l.length);
    await p.evaluate(() => { HCCBibleX.st.pi = 0; HCCBibleX.tool('parallels'); });
    await p.waitForTimeout(2000);
    const cols = await p.$$eval('#plCols .hg-col p sup', l => l.length);
    if (lex < 1 || fa < 20 || cols < 10) fail('bible-tools', 'lexicon ' + lex + ', Fathers ' + fa + ', parallel verses ' + cols);
    else console.log('  ok   bible-tools');
    await p.close();
  }

  await finish(browser);
})().catch(e => { console.error(e); process.exit(1); });
