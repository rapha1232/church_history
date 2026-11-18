const { chromium } = require('playwright');
const S='/tmp/claude-0/-home-user/c3613a6b-5857-5ba0-ac24-06bcaebd3c5b/scratchpad/';
(async () => {
  const b = await chromium.launch(); const errs=[];
  const go = async (name, vp, hash, scheme, fn) => {
    const p = await b.newPage({viewport:vp, colorScheme:scheme});
    p.on('pageerror', e=>errs.push(name+': '+e.message)); p.on('console', m=>{if(m.type()==='error')errs.push(name+': '+m.text())});
    await p.goto('file:///home/user/church/site/index.html'+hash); await p.waitForTimeout(1500);
    if(fn) await fn(p);
    await p.screenshot({path:S+name+'.png'});
    const ow = await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    console.log(name,'overflow',ow); await p.close();
  };
  const which = process.argv[2]||'all';
  await go('m-home',{width:1366,height:900},'#home','light');
  await go('m-chapter',{width:1366,height:900},'#iv-6','light');
  await go('m-people',{width:1366,height:900},'#ref-people','dark');
  await go('m-gallery',{width:1366,height:900},'#ref-gallery','dark');
  await go('m-lightbox',{width:400,height:860},'#ref-gallery','dark', async p=>{ await p.click('article.active .tile'); await p.waitForTimeout(900); });
  await go('m-phone',{width:400,height:860},'#home','light', async p=>{ await p.evaluate(()=>scrollTo(0,500)); await p.waitForTimeout(800); });
  console.log(errs.join('\n')); await b.close();
})();
