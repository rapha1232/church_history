const { chromium } = require('playwright');
const S='/tmp/claude-0/-home-user/c3613a6b-5857-5ba0-ac24-06bcaebd3c5b/scratchpad/';
(async () => {
  const b = await chromium.launch(); const errs=[];
  const go = async (name, vp, hash, scheme, fn, wait=1800) => {
    const p = await b.newPage({viewport:vp, colorScheme:scheme});
    p.on('pageerror', e=>errs.push(name+': '+e.message)); p.on('console', m=>{if(m.type()==='error')errs.push(name+': '+m.text())});
    await p.goto('file:///home/user/church/site/index.html'+hash); await p.waitForTimeout(wait);
    if(fn) await fn(p);
    await p.screenshot({path:S+name+'.png'});
    const ow = await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    console.log(name,'overflow',ow); await p.close();
  };
  const L = [
   ['v-tree',{width:1366,height:900},'#ref-tree','light', async p=>{ await p.dispatchEvent('.tb[data-t="orthodox"] path.hit','mouseover'); await p.waitForTimeout(400);}, 2600],
   ['v-people',{width:1366,height:900},'#ref-people','dark', async p=>{ await p.click('#pfind [data-era="early"]'); await p.selectOption('#pfRole','bishop'); await p.waitForTimeout(300);}],
   ['v-life',{width:1366,height:900},'#ref-people','light', async p=>{ await p.evaluate(()=>document.querySelector('#p-augustine-of-hippo .lifebtn').click()); await p.waitForTimeout(700);}],
   ['v-otd',{width:1366,height:900},'#ref-otd','light'],
   ['v-plans',{width:1366,height:900},'#ref-plans','light'],
   ['v-orig',{width:1366,height:900},'#ref-originals','light', async p=>{ await p.click('#ref-originals .ot[data-k="homoousios"]'); await p.waitForTimeout(300);}],
   ['v-home',{width:1366,height:900},'#home','light', async p=>{ await p.click('#ref-plans [data-pstart="councils"]').catch(()=>{}); await p.evaluate(()=>{localStorage.setItem('hcc.plan',JSON.stringify({id:'councils',t:1}));}); await p.reload(); await p.waitForTimeout(1500); await p.evaluate(()=>scrollTo(0,700)); await p.waitForTimeout(700);}],
   ['v-sepia',{width:1366,height:900},'#iv-6','light', async p=>{ await p.click('#rsBtn'); await p.click('[data-th="sepia"]'); await p.evaluate(()=>scrollTo(0,800)); await p.waitForTimeout(500);}],
   ['v-card',{width:1366,height:900},'#home','light', async p=>{ await p.evaluate(()=>scrollTo(0,700)); await p.waitForTimeout(400); await p.click('[data-q="card"]'); await p.waitForTimeout(600);}],
   ['v-gl',{width:1366,height:900},'#iv-7','light', async p=>{ await p.evaluate(()=>document.querySelectorAll('article.active .gl')[0].scrollIntoView({block:'center'})); await p.waitForTimeout(300); await p.evaluate(()=>document.querySelectorAll('article.active .gl')[0].click()); await p.waitForTimeout(400);}],
   ['vp-orig',{width:400,height:860},'#ref-originals','dark'],
   ['vp-tree',{width:400,height:860},'#ref-tree','light'],
   ['vp-people',{width:400,height:860},'#ref-people','light'],
  ];
  for (const l of L) if(!process.argv[2] || l[0].startsWith(process.argv[2])) await go(...l);
  console.log(errs.join('\n')); await b.close();
})();
