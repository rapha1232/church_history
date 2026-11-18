const { chromium } = require('playwright');
const S='/tmp/claude-0/-home-user/c3613a6b-5857-5ba0-ac24-06bcaebd3c5b/scratchpad/';
(async () => {
  const b = await chromium.launch(); const errs=[];
  const go = async (name, vp, hash, scheme, fn, wait=2600) => {
    const p = await b.newPage({viewport:vp, colorScheme:scheme});
    p.on('pageerror', e=>errs.push(name+': '+e.message)); p.on('console', m=>{if(m.type()==='error')errs.push(name+': '+m.text())});
    await p.goto('file:///home/user/church/site/index.html'+hash); await p.waitForTimeout(wait);
    if(fn) await fn(p);
    await p.screenshot({path:S+name+'.png'});
    const ow = await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    console.log(name,'overflow',ow); await p.close();
  };
  const only = process.argv[2];
  const L = [
   ['s-home',{width:1366,height:900},'#home','light'],
   ['s-home2',{width:1366,height:900},'#home','light', async p=>{ await p.evaluate(()=>scrollTo(0,700)); await p.waitForTimeout(900);}],
   ['s-ep',{width:1366,height:900},'#iv-6','light'],
   ['s-epwide',{width:1366,height:900},'#ii-9','dark'],
   ['s-epplain',{width:1366,height:900},'#v-3','light'],
   ['s-season',{width:1366,height:900},'#vol-iii','light'],
   ['s-season2',{width:1366,height:900},'#vol-iii','light', async p=>{ await p.evaluate(()=>scrollTo(0,800)); await p.waitForTimeout(900);}],
   ['s-epscroll',{width:1366,height:900},'#iv-6','light', async p=>{ await p.evaluate(()=>scrollTo(0,1800)); await p.waitForTimeout(900);}],
   ['s-upnext',{width:1366,height:900},'#iv-6','light', async p=>{ await p.evaluate(()=>{scrollTo(0,200); }); await p.waitForTimeout(300); await p.evaluate(()=>document.querySelector('article.active .upnext').scrollIntoView({block:'center'})); await p.waitForTimeout(3200);}],
   ['p-home',{width:400,height:860},'#home','dark'],
   ['p-home2',{width:400,height:860},'#home','light', async p=>{ await p.evaluate(()=>scrollTo(0,750)); await p.waitForTimeout(900);}],
   ['p-ep',{width:400,height:860},'#iv-6','light'],
   ['p-epwide',{width:400,height:860},'#ii-9','dark'],
   ['p-season',{width:400,height:860},'#vol-iii','dark', async p=>{ await p.evaluate(()=>scrollTo(0,640)); await p.waitForTimeout(900);}],
  ];
  for (const l of L) if(!only || l[0].startsWith(only)) await go(...l);
  console.log(errs.join('\n')); await b.close();
})();
