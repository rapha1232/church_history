const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const errs=[];
  for (const [name, vp, hash, scheme] of [['desk-home',{width:1366,height:900},'#home','light'],['desk-iv6',{width:1366,height:900},'#iv-6','light'],['phone-x2',{width:400,height:860},'#x-2','dark'],['desk-texts',{width:1366,height:900},'#ref-texts','dark']]) {
    const p = await b.newPage({viewport:vp, colorScheme:scheme});
    p.on('console', m=>{ if(m.type()==='error') errs.push(name+': '+m.text())});
    p.on('pageerror', e=>errs.push(name+' PAGEERR: '+e.message));
    await p.goto('file:///home/user/church/index.html'+hash);
    await p.waitForTimeout(1200);
    if(name==='phone-x2'){ await p.evaluate(()=>document.querySelector('.deeper').scrollIntoView()); }
    await p.screenshot({path:'/tmp/claude-0/-home-user/c3613a6b-5857-5ba0-ac24-06bcaebd3c5b/scratchpad/'+name+'.png'});
    if(name==='desk-iv6'){ await p.click('article.active .docstrip .txtbtn'); await p.waitForTimeout(500); await p.screenshot({path:'/tmp/claude-0/-home-user/c3613a6b-5857-5ba0-ac24-06bcaebd3c5b/scratchpad/reader.png'}); }
    const ow = await p.evaluate(()=>document.documentElement.scrollWidth - document.documentElement.clientWidth);
    console.log(name,'overflow',ow);
  }
  console.log(errs.join('\n'));
  await b.close();
})();
