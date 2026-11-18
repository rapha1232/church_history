const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs=[]; const ext=[];
  const p = await b.newPage({viewport:{width:412,height:880}, deviceScaleFactor:1});
  p.on('pageerror', e=>errs.push(e.message)); p.on('console', m=>{if(m.type()==='error')errs.push(m.text())});
  p.on('request', r=>{ if(!r.url().startsWith('file:')) ext.push(r.url()) });
  await p.goto('file:///home/user/church/android/assets/index.html#ref-gallery'); await p.waitForTimeout(1200); await p.click('article.active .tile'); await p.waitForTimeout(600); await p.keyboard.press('Escape'); await p.goto('file:///home/user/church/android/assets/index.html#ref-texts'); await p.waitForTimeout(800);
  await p.click('#text-heidelberg summary'); await p.click('#text-heidelberg .docacts .txtbtn'); await p.waitForTimeout(400);
  await p.click('#rtocBtn'); await p.waitForTimeout(200);
  const fonts = await p.evaluate(()=>document.fonts.check('16px "Literata"') && document.fonts.check('600 20px "Cormorant Garamond"'));
  await p.screenshot({path:'/tmp/claude-0/-home-user/c3613a6b-5857-5ba0-ac24-06bcaebd3c5b/scratchpad/app-reader.png'});
  console.log('fonts',fonts,'errors',errs,'external',ext.slice(0,5));
  await b.close();
})();
