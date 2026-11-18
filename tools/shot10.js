const { chromium } = require('playwright');
const S='/tmp/claude-0/-home-user/c3613a6b-5857-5ba0-ac24-06bcaebd3c5b/scratchpad/';
const ref = async (p, r) => { await p.evaluate(()=>document.querySelector('#bibBar [data-act="books"]').click()); await p.waitForTimeout(250); await p.fill('#bibRef', r); await p.press('#bibRef','Enter'); };
(async () => {
  const b = await chromium.launch(); const errs=[];
  const go = async (name, vp, hash, scheme, fn, wait=1500) => {
    const p = await b.newPage({viewport:vp, colorScheme:scheme});
    await p.addInitScript(()=>{ try{ localStorage.setItem('hcc.onb','1'); }catch(e){} });
    await p.addInitScript(()=>{ try{ if(!localStorage.getItem('hcc.bible')) localStorage.setItem('hcc.bible', JSON.stringify({ed:'kjv',b:'JOH',c:1,cmp:'',v:0,study:true,tools:true})); }catch(e){} });
    p.on('pageerror', e=>errs.push(name+': '+e.message)); p.on('console', m=>{if(m.type()==='error')errs.push(name+': '+m.text())});
    await p.goto('file:///home/user/church/site/index.html'+hash); await p.waitForTimeout(wait);
    try{ if(fn) await fn(p); }catch(e){ errs.push(name+' TEST: '+e.message.split('\n')[0]); }
    await p.screenshot({path:S+name+'.png'});
    const ow = await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    console.log(name,'overflow',ow); await p.close();
  };
  const T = (p,s) => p.evaluate(s=>{const e=document.querySelector(s);return e?e.innerText.slice(0,260).replace(/\n/g,' / '):'(none)'},s);
  const L = [
   ['x-search',{width:1366,height:900},'#bible','light', async p=>{ await p.click('#bibTools [data-act="search"]'); await p.fill('#bsQ','"in the beginning"'); await p.press('#bsQ','Enter'); await p.waitForTimeout(3000); console.log(await T(p,'.bs-sum'), '|', await T(p,'.bs-res li')); }],
   ['x-search2',{width:1366,height:900},'#bible~vul~JOH~1~1','light', async p=>{ await p.click('#bibTools [data-act="search"]'); await p.fill('#bsQ','verbum caro'); await p.press('#bsQ','Enter'); await p.waitForTimeout(3000); console.log(await T(p,'.bs-sum'), '|', await T(p,'.bs-res li')); }],
   ['x-ws',{width:1366,height:900},'#bible~kjv~JOH~1~1','light', async p=>{ await p.click('.bv[data-v="1"]'); await p.waitForTimeout(1200); await p.click('.vw[data-w="4"]'); await p.waitForTimeout(1200); await p.click('.lx-ws'); await p.waitForTimeout(2000); console.log(await T(p,'.ws-h'), '|', await T(p,'.ws-gl')); }],
   ['x-notes',{width:1366,height:900},'#bible~kjv~JOH~3~16','light', async p=>{ await p.click('.bv[data-v="16"]'); await p.waitForTimeout(600); await p.click('.hcb.hc-y'); await p.click('[data-bm]'); await p.click('[data-nt]'); await p.fill('#vsNote','God so loved'); await p.waitForTimeout(700); console.log(await p.evaluate(()=>document.querySelector('.bv[data-v="16"]').className)); await p.click('#bibTools [data-act="notes"]'); await p.waitForTimeout(400); console.log(await T(p,'.bn-list')); }],
   ['x-plans',{width:1366,height:900},'#bible','light', async p=>{ await p.click('#bibTools [data-act="plans"]'); await p.waitForTimeout(300); await p.click('[data-pstart="year"]'); await p.waitForTimeout(400); console.log(await T(p,'.bp-cur')); }],
   ['x-today',{width:1366,height:900},'#bible','light', async p=>{ await p.click('#bibTools [data-act="today"]'); await p.waitForTimeout(1200); console.log(await T(p,'.lc-card')); for(const d of ['2026-12-25','2027-02-10','2027-03-28','2027-05-16','2027-06-20','2026-11-29']){ await p.fill('#lcDate', d); await p.dispatchEvent('#lcDate','change'); await p.waitForTimeout(300); console.log(d, await T(p,'.lc-meta'), '/', await T(p,'.lc-t')); } }],
   ['x-comm',{width:1366,height:900},'#bible~kjv~MAT~16~18','light', async p=>{ await p.click('.bv[data-v="18"]'); await p.waitForTimeout(500); await p.click('.vs-tabs [data-tab="comm"]'); await p.waitForTimeout(2500); console.log(await T(p,'#vsBody')); }],
   ['x-lxx',{width:1366,height:900},'#bible~lxxg~GEN~1~1','light', async p=>{ console.log(await T(p,'.bib-text')); await p.click('.bv[data-v="1"]'); await p.waitForTimeout(2000); console.log(await T(p,'#vsBody')); const w = await p.$('.lxw:not(.nolex)'); if(w){ await w.click(); await p.waitForTimeout(1500); console.log(await T(p,'#vsLex2')); } }],
   ['x-sir',{width:1366,height:900},'#bible~dra~SIR~1~1','light', async p=>{ await p.click('.bv[data-v="1"]'); await p.waitForTimeout(2000); console.log(await T(p,'#vsBody')); }],
   ['x-diff',{width:1366,height:900},'#bible~kjv~JOH~3~16','light', async p=>{ await p.click('.bv[data-v="16"]'); await p.waitForTimeout(500); await p.click('.vs-tabs [data-tab="eds"]'); await p.waitForTimeout(2500); console.log(await p.evaluate(()=>document.querySelectorAll('#vsBody mark.df').length)); }],
   ['x-intro',{width:1366,height:900},'#bible~kjv~ROM~1~1','light', async p=>{ console.log(await T(p,'.bintro')); }],
   ['x-sref',{width:1366,height:900},'#iv-6','light', async p=>{ await p.waitForTimeout(600); const n = await p.evaluate(()=>document.querySelectorAll('article.active .sref').length); console.log('srefs', n); const any = await p.evaluate(()=>{ const a=[...document.querySelectorAll('main article')].map(a=>a.id); return a.length; }); if(n){ await p.click('article.active .sref'); await p.waitForTimeout(1500); console.log(await T(p,'#vsH'), await T(p,'#vsBody')); } }],
   ['x-maps',{width:1366,height:900},'#bible-maps','light', async p=>{ await p.waitForTimeout(1500); console.log(await T(p,'.bm-card')); await p.click('[data-bmk="5"]'); await p.waitForTimeout(3500); }],
   ['x-canon',{width:1366,height:900},'#bible-canon','light', async p=>{ await p.click('[data-cf="East"]'); await p.waitForTimeout(300); console.log(await p.evaluate(()=>document.querySelectorAll('.cn-item:not([hidden])').length)); }],
   ['x-arcs',{width:1366,height:900},'#bible-arcs','dark', async p=>{ await p.waitForTimeout(1500); await p.click('[data-bajump="ISA~53"]'); await p.waitForTimeout(500); console.log(await T(p,'.ba-info')); }],
   ['xp-sheet',{width:390,height:844},'#bible~web~ROM~8~28','light', async p=>{ await p.click('.bv[data-v="28"]'); await p.waitForTimeout(600); await p.click('.vs-tabs [data-tab="comm"]'); await p.waitForTimeout(2500); }],
   ['xp-maps',{width:390,height:844},'#bible-maps','dark', async p=>{ await p.waitForTimeout(2500); }],
   ['xp-tools',{width:390,height:844},'#bible','light', async p=>{ await p.click('#bibTools [data-act="today"]'); await p.waitForTimeout(1500); }],
  ];
  for (const l of L) if(!process.argv[2] || l[0].startsWith(process.argv[2])) await go(...l);
  console.log(errs.join('\n')); await b.close();
})();
