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
   ['w-cm',{width:1366,height:900},'#ref-councilmap','light', async p=>{ await p.evaluate(()=>document.querySelector('.cpin[data-c="chalc"]').dispatchEvent(new MouseEvent('click',{bubbles:true}))); await p.waitForTimeout(400);}],
   ['w-cmtab',{width:1366,height:900},'#ref-councilmap','dark', async p=>{ await p.evaluate(()=>document.querySelector('.cmtab').scrollIntoView()); await p.waitForTimeout(400);}],
   ['w-deb',{width:1366,height:900},'#ref-debates','light', async p=>{ await p.evaluate(()=>{const d=document.querySelector('#ref-debates details'); d.open=true; d.scrollIntoView({block:'center'});}); await p.waitForTimeout(400);}],
   ['w-ev',{width:1366,height:900},'#iv-6','light', async p=>{ await p.evaluate(()=>{const e=[...document.querySelectorAll('article.active > p .ev')].find(x=>x.parentNode.querySelector('sup.fn')); e.scrollIntoView({block:'center'}); e.click();}); await p.waitForTimeout(500);}],
   ['w-sbs',{width:1366,height:900},'#p3-matrix','light', async p=>{ await p.evaluate(()=>document.querySelector('#sbs').scrollIntoView()); await p.waitForTimeout(400);}],
   ['w-tree',{width:1366,height:900},'#ref-tree','light', async p=>{ await p.evaluate(()=>document.querySelector('.tb[data-t="orthodox"] path.hit').dispatchEvent(new MouseEvent('mouseover',{bubbles:true}))); await p.waitForTimeout(400); await p.evaluate(()=>document.querySelector('#treeCard').scrollIntoView({block:'center'})); await p.waitForTimeout(300);}, 2600],
   ['wp-cm',{width:400,height:860},'#ref-councilmap','light', async p=>{ await p.evaluate(()=>scrollTo(0,500)); await p.waitForTimeout(400);}],
   ['wp-sbs',{width:400,height:860},'#p3-matrix','dark', async p=>{ await p.evaluate(()=>document.querySelector('#sbs').scrollIntoView()); await p.waitForTimeout(400);}],
  ];
  for (const l of L) if(!process.argv[2] || l[0].startsWith(process.argv[2])) await go(...l);
  console.log(errs.join('\n')); await b.close();
})();
