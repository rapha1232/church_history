const { chromium } = require('playwright');
const S='/tmp/claude-0/-home-user/c3613a6b-5857-5ba0-ac24-06bcaebd3c5b/scratchpad/';
(async () => {
  const b = await chromium.launch(); const errs=[];
  const go = async (name, vp, hash, scheme, fn, wait=2200) => {
    const p = await b.newPage({viewport:vp, colorScheme:scheme});
    p.on('pageerror', e=>errs.push(name+': '+e.message)); p.on('console', m=>{if(m.type()==='error')errs.push(name+': '+m.text())});
    await p.goto('file:///home/user/church/site/index.html'+hash); await p.waitForTimeout(wait);
    if(fn) await fn(p);
    await p.screenshot({path:S+name+'.png'});
    const ow = await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    console.log(name,'overflow',ow); await p.close();
  };
  const only = process.argv[2];
  const sc = (y)=>async p=>{ await p.evaluate(y=>scrollTo(0,y),y); await p.waitForTimeout(900); };
  const L = [
   ['x-cast',{width:1366,height:900},'#iv-6','light', sc(700)],
   ['x-rail',{width:1440,height:900},'#iv-6','light', sc(1700)],
   ['x-break',{width:1366,height:900},'#i-4','dark', async p=>{ await p.evaluate(()=>document.querySelector('article.active .sbreak').scrollIntoView({block:'center'})); await p.waitForTimeout(1600);}],
   ['x-emap',{width:1366,height:900},'#iv-6','light', async p=>{ await p.evaluate(()=>document.querySelector('article.active .emap').scrollIntoView({block:'center'})); await p.waitForTimeout(900);}],
   ['x-smap',{width:1366,height:900},'#vol-iv','light', async p=>{ await p.evaluate(()=>document.querySelector('article.active .smap').scrollIntoView({block:'start'})); await p.waitForTimeout(900);}],
   ['x-smapw',{width:1366,height:900},'#vol-xv','dark', async p=>{ await p.evaluate(()=>document.querySelector('article.active .smap').scrollIntoView({block:'start'})); await p.waitForTimeout(900);}],
   ['x-bio',{width:1366,height:900},'#iv-6','light', async p=>{ await p.evaluate(()=>scrollTo(0,700)); await p.waitForTimeout(500); await p.click('article.active .cm'); await p.waitForTimeout(700);}],
   ['x-cmp',{width:1366,height:900},'#ref-compare','light', async p=>{ await p.click('[data-c="f"]'); await p.waitForTimeout(1200);}],
   ['x-home',{width:1366,height:900},'#home','light', sc(760)],
   ['x-hl',{width:1366,height:900},'#iv-6','light', async p=>{ await p.evaluate(()=>scrollTo(0,950)); await p.waitForTimeout(400);
       const box = await p.evaluate(()=>{ const el=[...document.querySelectorAll('article.active > p')][1]; const r=el.getBoundingClientRect(); return [r.left+5,r.top+8,r.left+300,r.top+8]; });
       await p.mouse.move(box[0],box[1]); await p.mouse.down(); await p.mouse.move(box[2],box[3],{steps:8}); await p.mouse.up(); await p.waitForTimeout(400);
       await p.click('.seltool [data-hc="y"]'); await p.waitForTimeout(300);
       await p.evaluate(()=>{ const s=[...document.querySelectorAll('article.active > p')][3]; const r=document.createRange(); r.selectNodeContents(s.firstChild); getSelection().removeAllRanges(); getSelection().addRange(r); });
       await p.mouse.move(600,600); await p.mouse.up(); await p.waitForTimeout(200);
     }],
   ['x-nb',{width:1366,height:900},'#iv-6','light', async p=>{ await p.evaluate(()=>{localStorage.setItem('hcc.notes',JSON.stringify([{id:'n1',art:'iv-6',text:'The council met at Nicaea in Bithynia',at:0,c:'g',note:'Check the date of the opening.',t:1}]));}); await p.goto('file:///home/user/church/site/index.html#ref-notebook'); await p.waitForTimeout(1200);}],
   ['xp-ep',{width:400,height:860},'#iv-6','dark', sc(820)],
   ['xp-smap',{width:400,height:860},'#vol-iii','light', async p=>{ await p.evaluate(()=>document.querySelector('article.active .smap').scrollIntoView({block:'start'})); await p.waitForTimeout(900);}],
   ['xp-home',{width:400,height:860},'#home','light', sc(700)],
   ['xp-cmp',{width:400,height:860},'#ref-compare','dark'],
  ];
  for (const l of L) if(!only || l[0].startsWith(only)) await go(...l);
  console.log(errs.join('\n')); await b.close();
})();
