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
  const T = p => p.evaluate(()=>document.querySelector('#vsBody').innerText.slice(0,300).replace(/\n/g,' / '));
  const L = [
   ['o-greek',{width:1366,height:900},'#bible~kjv~JOH~1~1','light', async p=>{ await p.click('.bv[data-v="1"]'); await p.waitForTimeout(1500); console.log(await T(p)); await p.click('.vw[data-w="4"]'); await p.waitForTimeout(1500); console.log(await p.evaluate(()=>document.querySelector('#vsLex').innerText.slice(0,300))); }],
   ['o-heb',{width:1366,height:900},'#bible~dra~PSA~22~1','light', async p=>{ await p.click('.bv[data-v="1"]'); await p.waitForTimeout(1500); console.log(await T(p)); await p.click('.vw[data-w="0"]'); await p.waitForTimeout(1500); console.log(await p.evaluate(()=>document.querySelector('#vsLex').innerText.slice(0,250))); }],
   ['o-eds',{width:1366,height:900},'#bible~kjv~GEN~1~1','light', async p=>{ await p.click('.bv[data-v="1"]'); await p.waitForTimeout(500); await p.click('.vs-tabs [data-tab="eds"]'); await p.waitForTimeout(1500); console.log(await T(p)); }],
   ['o-links',{width:1366,height:900},'#bible~kjv~JOH~1~1','light', async p=>{ await p.click('.bv[data-v="1"]'); await p.waitForTimeout(500); await p.click('.vs-tabs [data-tab="links"]'); await p.waitForTimeout(1800); console.log(await T(p)); }],
   ['o-conn',{width:1366,height:900},'#bible~kjv~JOH~1~1','light', async p=>{ await p.waitForTimeout(1000); console.log(await p.evaluate(()=>document.querySelector('#bibConn').innerText.slice(0,300).replace(/\n/g,' / '))); await p.click('.bc summary'); await p.evaluate(()=>document.querySelector('#bibConn').scrollIntoView({block:'center'})); await p.waitForTimeout(400); }],
   ['o-sir',{width:1366,height:900},'#bible~dra~SIR~2~1','light', async p=>{ await p.click('.bv[data-v="1"]'); await p.waitForTimeout(800); console.log(await T(p)); }],
   ['op-greek',{width:390,height:844},'#bible~web~ROM~8~28','dark', async p=>{ await p.click('.bv[data-v="28"]'); await p.waitForTimeout(1500); await p.click('.vw[data-w="2"]'); await p.waitForTimeout(1200); }],
   ['op-heb',{width:390,height:844},'#bible~web~GEN~1~1','light', async p=>{ await p.click('.bv[data-v="1"]'); await p.waitForTimeout(1500); }],
  ];
  for (const l of L) if(!process.argv[2] || l[0].startsWith(process.argv[2])) await go(...l);
  console.log(errs.join('\n')); await b.close();
})();
