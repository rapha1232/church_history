const { chromium } = require('playwright');
const S='/tmp/claude-0/-home-user/c3613a6b-5857-5ba0-ac24-06bcaebd3c5b/scratchpad/';
(async () => {
  const b = await chromium.launch(); const errs=[];
  const go = async (name, vp, hash, scheme, fn, wait=1500) => {
    const p = await b.newPage({viewport:vp, colorScheme:scheme});
    await p.addInitScript(()=>{ try{ localStorage.setItem('hcc.onb','1'); }catch(e){} });
    p.on('pageerror', e=>errs.push(name+': '+e.message)); p.on('console', m=>{if(m.type()==='error')errs.push(name+': '+m.text())});
    await p.goto('file:///home/user/church/site/index.html'+hash); await p.waitForTimeout(wait);
    if(fn) await fn(p);
    await p.screenshot({path:S+name+'.png'});
    const ow = await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    console.log(name,'overflow',ow); await p.close();
  };
  const L = [
   ['y-search',{width:1366,height:900},'#home','light', async p=>{ const t=Date.now(); await p.fill('#q','athanasus exile'); await p.waitForTimeout(900); console.log('search ms', Date.now()-t, await p.evaluate(()=>[...document.querySelectorAll('#results .sx-h')].map(x=>x.textContent).join(' | ')), await p.evaluate(()=>(document.querySelector('.sx-did')||{}).textContent)); }],
   ['y-search2',{width:1366,height:900},'#home','light', async p=>{ await p.fill('#q','filoque'); await p.waitForTimeout(700); console.log(await p.evaluate(()=>[...document.querySelectorAll('#results .sx-h')].map(x=>x.textContent).join(' | ')), await p.evaluate(()=>(document.querySelector('.sx-did')||{}).textContent)); }],
   ['y-jump',{width:1366,height:900},'#home','light', async p=>{ await p.fill('#q','318 servants of Abraham'); await p.waitForTimeout(700); await p.click('#results [data-sx]'); await p.waitForTimeout(1400); console.log('hash', await p.evaluate(()=>location.hash), await p.evaluate(()=>!!document.querySelector('.sx-flash'))); }],
   ['y-take',{width:1366,height:900},'#iv-6','light', async p=>{ await p.evaluate(()=>document.querySelector('article.active .takeaways').scrollIntoView({block:'start'})); await p.waitForTimeout(500); }],
   ['y-doc',{width:1366,height:900},'#iv-6','light', async p=>{ await p.click('article.active .co-act .txtbtn'); await p.waitForTimeout(700); }],
   ['yp-search',{width:400,height:860},'#home','dark', async p=>{ await p.click('.tabbar button:nth-child(2)').catch(()=>{}); await p.waitForTimeout(300); await p.fill('#q','gregori nyssa'); await p.waitForTimeout(800); }],
  ];
  for (const l of L) if(!process.argv[2] || l[0].startsWith(process.argv[2])) await go(...l);
  console.log(errs.join('\n')); await b.close();
})();
