// new-look interactions
const { chromium } = require('playwright');
const S='/tmp/claude-0/-home-user/c3613a6b-5857-5ba0-ac24-06bcaebd3c5b/scratchpad/';
(async () => {
  const b = await chromium.launch(); const errs=[];
  const go = async (name, vp, hash, theme, fn, wait=1600) => {
    const ph = vp.width<500;
    const p = await b.newPage({viewport:vp, deviceScaleFactor:1, hasTouch: ph, isMobile: ph});
    await p.addInitScript(()=>{ try{ localStorage.setItem('hcc.onb','1'); }catch(e){} });
    if(theme==='light') await p.addInitScript(()=>{ try{ localStorage.setItem('theme','"light"'); }catch(e){} });
    p.on('pageerror', e=>errs.push(name+': '+e.message)); p.on('console', m=>{if(m.type()==='error')errs.push(name+': '+m.text())});
    await p.goto('file:///home/user/church/site/index.html'+hash); await p.waitForTimeout(wait);
    try{ if(fn) await fn(p); }catch(e){ errs.push(name+' TEST: '+e.message.split('\n')[0]); }
    await p.screenshot({path:S+'n-'+name+'.png'});
    const ow = await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    console.log(name,'overflow',ow); await p.close();
  };
  const P={width:390,height:844}, D={width:1366,height:900};
  const T = (p,s) => p.evaluate(s=>{const e=document.querySelector(s);return e?e.innerText.slice(0,200).replace(/\n/g,' / '):'(none)'},s);
  const tap = (p,s) => p.evaluate(s=>document.querySelector(s).click(), s);
  const L = [
   ['pick-books',P,'#bible~kjv~JOH~3~16','dark', async p=>{ await tap(p,'#bibBar [data-act="books"]'); await p.waitForTimeout(600); console.log(await T(p,'#bpickH'), await p.evaluate(()=>document.querySelector('.bib-bk.on')?.innerText)); }],
   ['pick-ch',P,'#bible~kjv~JOH~3~16','dark', async p=>{ await tap(p,'#bibBar [data-act="books"]'); await p.waitForTimeout(400); await tap(p,'.bpick [data-b="ROM"]'); await p.waitForTimeout(500); console.log(await T(p,'#bpickH')); await p.screenshot({path:S+'n-pick-ch0.png'}); await tap(p,'.bpick [data-c="8"]'); await p.waitForTimeout(900); console.log(await T(p,'.bib-ch'), await p.evaluate(()=>document.querySelector('.bpick').hidden)); }],
   ['pick-cancel',P,'#bible~kjv~JOH~3~16','dark', async p=>{ await tap(p,'#bibBar [data-act="books"]'); await p.waitForTimeout(300); await tap(p,'.bpick [data-b="ROM"]'); await p.waitForTimeout(300); await tap(p,'.bpick .vs-x'); await p.waitForTimeout(300); console.log('after cancel:', await T(p,'#bibBar .bk'), await T(p,'.bib-ch')); }],
   ['pick-eds',P,'#bible~kjv~JOH~3~16','light', async p=>{ await tap(p,'#bibBar [data-act="eds"]'); await p.waitForTimeout(600); }],
   ['pick-go',P,'#bible','dark', async p=>{ await tap(p,'#bibBar [data-act="books"]'); await p.waitForTimeout(300); await p.fill('#bibRef','ps 23'); await p.press('#bibRef','Enter'); await p.waitForTimeout(900); console.log(await T(p,'.bib-ch')); }],
   ['act',P,'#bible~web~JOH~3~1','dark', async p=>{ await tap(p,'.bv[data-v="16"]'); await p.waitForTimeout(500); console.log(await T(p,'.bib-act'), 'sheet hidden', await p.evaluate(()=>document.querySelector('.vsheet').hidden)); await p.evaluate(()=>document.querySelector('.bv[data-v="16"]').scrollIntoView({block:'center'})); await p.waitForTimeout(300); }],
   ['act-hl',P,'#bible~web~JOH~3~1','dark', async p=>{ await tap(p,'.bv[data-v="16"]'); await p.waitForTimeout(300); await tap(p,'.bib-act .hc-g'); await p.waitForTimeout(300); console.log(await p.evaluate(()=>document.querySelector('.bv[data-v="16"]').className), 'act hidden', await p.evaluate(()=>document.querySelector('.bib-act').hidden)); await tap(p,'.bv[data-v="17"]'); await p.waitForTimeout(200); await tap(p,'.bib-act [data-a="study"]'); await p.waitForTimeout(1500); console.log(await T(p,'#vsH'), await T(p,'#vsBody')); }],
   ['study-p',P,'#bible~kjv~ROM~8~1','light', async p=>{ await tap(p,'#bibBar [data-study="1"]'); await p.waitForTimeout(400); await tap(p,'.bv[data-v="2"]'); await p.waitForTimeout(1200); console.log('study sheet', await T(p,'#vsH')); await tap(p,'.vsheet [data-vs="x"]'); await p.waitForTimeout(300); }],
   ['tools-p',P,'#bible~kjv~ROM~8~1','dark', async p=>{ await tap(p,'#bibBar [data-more]'); await p.waitForTimeout(300); console.log('tools shown', await p.evaluate(()=>getComputedStyle(document.querySelector('#bibTools')).display)); }],
   ['fab',P,'#bible~kjv~ROM~8~1','dark', async p=>{ await tap(p,'.bib-fabs [data-fstep="1"]'); await p.waitForTimeout(900); console.log(await T(p,'#bibBar .bk')); await p.evaluate(()=>window.scrollTo(0,900)); await p.waitForTimeout(300); await p.evaluate(()=>window.scrollTo(0,1400)); await p.waitForTimeout(600); console.log('chrome-off', await p.evaluate(()=>document.body.classList.contains('chrome-off'))); }],
   ['study-d',D,'#bible~kjv~JOH~1~1','light', async p=>{ await tap(p,'#bibBar [data-study="1"]'); await p.waitForTimeout(1800); console.log('docked', await p.evaluate(()=>document.querySelector('.vsheet').classList.contains('docked')), await T(p,'#vsH')); await tap(p,'.bv[data-v="14"]'); await p.waitForTimeout(1200); console.log(await T(p,'#vsH')); }],
   ['study-d2',D,'#bible~kjv~JOH~1~1','dark', async p=>{ await tap(p,'#bibBar [data-study="1"]'); await p.waitForTimeout(1500); await tap(p,'.vs-tabs [data-tab="comm"]'); await p.waitForTimeout(2000); await tap(p,'#bibBar [data-study="0"]'); await p.waitForTimeout(400); console.log('closed', await p.evaluate(()=>document.querySelector('.vsheet').hidden)); await tap(p,'#bibBar [data-study="1"]'); await p.waitForTimeout(1500); }],
   ['read-d',D,'#bible~web~PSA~23~1','dark'],
   ['pick-d',D,'#bible~kjv~JOH~1~1','light', async p=>{ await tap(p,'#bibBar [data-act="books"]'); await p.waitForTimeout(600); }],
   ['home-d',D,'#home','dark', async p=>{ await p.evaluate(()=>window.scrollTo(0,820)); await p.waitForTimeout(500); }],
   ['home-l',P,'#home','light', async p=>{ await p.evaluate(()=>document.querySelector('.today-h').scrollIntoView()); await p.evaluate(()=>window.scrollBy(0,-70)); await p.waitForTimeout(500); }],
   ['search-p',P,'#home','dark', async p=>{ await tap(p,'.tb2 [data-t="search"]'); await p.waitForTimeout(300); await p.fill('#q','nicaea'); await p.waitForTimeout(900); }],
   ['saved-p',P,'#home','dark', async p=>{ await tap(p,'.tb2 [data-t="saved"]'); await p.waitForTimeout(600); }],
   ['ep-l',P,'#iv-6','light', async p=>{ await p.evaluate(()=>window.scrollTo(0,1500)); await p.waitForTimeout(500); }],
   ['texts-l',P,'#ref-texts','light'],
   ['tree-d',D,'#ref-tree','dark'],
  ];
  const f = process.argv[2];
  for (const l of L) if(!f || l[0].startsWith(f)) await go(...l);
  console.log(errs.join('\n')); await b.close();
})();
