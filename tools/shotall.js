// baseline / review screenshots: node tools/shotall.js <prefix> [filter]
const { chromium } = require('playwright');
const S='/tmp/claude-0/-home-user/c3613a6b-5857-5ba0-ac24-06bcaebd3c5b/scratchpad/';
const pre = process.argv[2] || 'r', filt = process.argv[3] || '';
(async () => {
  const b = await chromium.launch(); const errs=[];
  const go = async (name, vp, hash, scheme, fn, wait=1600) => {
    const p = await b.newPage({viewport:vp, colorScheme:scheme, deviceScaleFactor:1, hasTouch: vp.width<500, isMobile: vp.width<500});
    await p.addInitScript(()=>{ try{ localStorage.setItem('hcc.onb','1'); }catch(e){} });
    if(scheme==='light') await p.addInitScript(()=>{ try{ localStorage.setItem('theme','"light"'); }catch(e){} });
    p.on('pageerror', e=>errs.push(name+': '+e.message)); p.on('console', m=>{if(m.type()==='error')errs.push(name+': '+m.text())});
    await p.goto('file:///home/user/church/site/index.html'+hash); await p.waitForTimeout(wait);
    try{ if(fn) await fn(p); }catch(e){ errs.push(name+' TEST: '+e.message.split('\n')[0]); }
    await p.screenshot({path:S+pre+'-'+name+'.png'});
    const ow = await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    console.log(name,'overflow',ow); await p.close();
  };
  const P={width:390,height:844}, D={width:1366,height:900};
  const sc = y => async p => { await p.evaluate(y=>window.scrollTo(0,y), y); await p.waitForTimeout(500); };
  const L = [
   ['p-home',P,'#home','dark'], ['p-home2',P,'#home','dark',sc(900)], ['p-home3',P,'#home','light',sc(1900)],
   ['p-ep',P,'#iv-6','dark'], ['p-ep2',P,'#iv-6','dark',sc(1500)], ['p-ep3',P,'#iv-6','light',sc(4200)],
   ['p-season',P,'#vol-iv','dark',sc(500)],
   ['p-bible',P,'#bible~kjv~JOH~1~1','dark'], ['p-bible2',P,'#bible~web~PSA~23~1','light'],
   ['p-nav',P,'#home','dark', async p=>{ const t = await p.$('.tb2 [data-t="library"]') || await p.$('.tabbar [data-tab="contents"]'); await t.tap(); await p.waitForTimeout(600); }],
   ['p-people',P,'#ref-people','light',sc(500)], ['p-gloss',P,'#ref-glossary','dark',sc(300)], ['p-texts',P,'#ref-texts','light',sc(200)],
   ['d-home',D,'#home','dark'], ['d-home2',D,'#home','light',sc(900)], ['d-ep',D,'#iv-6','light',sc(1300)], ['d-bible',D,'#bible~kjv~JOH~1~1','light'], ['d-bible2',D,'#bible~kjv~ROM~8~28','dark'],
   ['d-people',D,'#ref-people','dark',sc(400)], ['d-council',D,'#ref-councilmap','light',sc(300)],
  ];
  for (const l of L) if(!filt || l[0].startsWith(filt)) await go(...l);
  console.log(errs.join('\n')); await b.close();
})();
