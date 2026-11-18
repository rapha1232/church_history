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
    if(fn) await fn(p);
    await p.screenshot({path:S+name+'.png'});
    const ow = await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    console.log(name,'overflow',ow); await p.close();
  };
  const txt = p => p.evaluate(()=>{const v=document.querySelector('#bibView');return v.querySelector('h3')?.textContent+' | '+(v.querySelector('.bv')||{}).textContent?.slice(0,90)});
  const L = [
   ['b-read',{width:1366,height:900},'#bible','light', async p=>{ console.log(await txt(p)); }],
   ['b-eds',{width:1366,height:900},'#bible','light', async p=>{ await p.click('[data-act="eds"]'); await p.waitForTimeout(300); }],
   ['b-books',{width:1366,height:900},'#bible','light', async p=>{ await p.click('[data-act="eds"]'); await p.click('[data-ed="dra"]'); await p.waitForTimeout(500); await p.click('[data-act="books"]'); await p.waitForTimeout(300); }],
   ['b-ref',{width:1366,height:900},'#bible','light', async p=>{ await ref(p,'Psalm 23'); await p.waitForTimeout(700); console.log(await txt(p)); await ref(p,'1 cor 13:4'); await p.waitForTimeout(800); console.log(await txt(p), await p.evaluate(()=>document.querySelector('.bv.hl')?.dataset.v)); }],
   ['b-cmp',{width:1366,height:900},'#bible','light', async p=>{ await ref(p,'Psalm 23'); await p.waitForTimeout(500); await p.selectOption('#bibCmp','dra'); await p.waitForTimeout(800); console.log(await p.evaluate(()=>document.querySelector('.bib-note')?.textContent+' || '+document.querySelectorAll('.bib-row').length)); }],
   ['b-lxx',{width:1366,height:900},'#bible~lxx~DNG~3~1','dark', async p=>{ console.log(await txt(p)); await p.click('[data-step="1"]'); await p.waitForTimeout(500); console.log(await txt(p)); }],
   ['b-sir',{width:1366,height:900},'#bible','light', async p=>{ await ref(p,'Sirach 2'); await p.waitForTimeout(800); console.log(await txt(p)); await p.selectOption('#bibCmp','kjv'); await p.waitForTimeout(800); console.log(await p.evaluate(()=>document.querySelector('.bib-note')?.textContent)); }],
   ['b-ext',{width:1366,height:900},'#bible~dra~PSA~22~1','light', async p=>{ console.log(await p.evaluate(()=>[...document.querySelectorAll('.bib-ext')].map(a=>a.href).join(' '))); await p.evaluate(()=>document.querySelector('.bib-exts').scrollIntoView({block:'center'})); }],
   ['b-home',{width:1366,height:900},'#home','light', async p=>{ await p.evaluate(()=>document.querySelector('.votd').scrollIntoView({block:'center'})); await p.waitForTimeout(300); }],
   ['b-votd',{width:1366,height:900},'#home','light', async p=>{ await p.click('[data-vv="read"]'); await p.waitForTimeout(1200); console.log(await p.evaluate(()=>location.hash), await txt(p), await p.evaluate(()=>document.querySelector('.bv.hl')?.dataset.v)); }],
   ['bp-read',{width:390,height:844},'#bible','dark', async p=>{ await ref(p,'John 1'); await p.waitForTimeout(600); await p.click('.bv[data-v="3"]'); await p.waitForTimeout(300); }],
   ['bp-cmp',{width:390,height:844},'#bible','light', async p=>{ await p.selectOption('#bibCmp','webo'); await p.waitForTimeout(800); }],
   ['bp-tab',{width:390,height:844},'#home','light', async p=>{ await p.click('.tb2 [data-t="bible"]'); await p.waitForTimeout(700); console.log(await p.evaluate(()=>location.hash)); }],
  ];
  for (const l of L) if(!process.argv[2] || l[0].startsWith(process.argv[2])) await go(...l);
  console.log(errs.join('\n')); await b.close();
})();
