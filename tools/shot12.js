const { chromium } = require('playwright');
const S='/tmp/claude-0/-home-user/c3613a6b-5857-5ba0-ac24-06bcaebd3c5b/scratchpad/';
(async () => {
  const b = await chromium.launch(); const errs=[];
  const go = async (name, vp, hash, theme, fn, opts={}) => {
    const ph = vp.width<500 || opts.touch;
    const p = await b.newPage({viewport:vp, deviceScaleFactor:1, hasTouch: ph, isMobile: vp.width<500});
    await p.addInitScript((o)=>{ try{ if(!o.onb) localStorage.setItem('hcc.onb','1'); if(o.theme==='light') localStorage.setItem('theme','"light"'); }catch(e){} }, {onb: !!opts.onb, theme});
    p.on('pageerror', e=>errs.push(name+': '+e.message)); p.on('console', m=>{if(m.type()==='error')errs.push(name+': '+m.text())});
    await p.goto('file:///home/user/church/site/index.html'+hash); await p.waitForTimeout(opts.wait||1600);
    try{ if(fn) await fn(p); }catch(e){ errs.push(name+' TEST: '+e.message.split('\n')[0]); }
    await p.screenshot({path:S+'q-'+name+'.png'});
    const ow = await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    console.log(name,'overflow',ow); await p.close();
  };
  const P={width:390,height:844}, D={width:1366,height:900}, T={width:1180,height:820};
  const Tx = (p,s) => p.evaluate(s=>{const e=document.querySelector(s);return e?e.innerText.slice(0,240).replace(/\n/g,' / '):'(none)'},s);
  const tap = (p,s) => p.evaluate(s=>document.querySelector(s).click(), s);
  const tool = async (p, a) => { await tap(p,'#bibBar [data-more]'); await p.waitForTimeout(200); await tap(p,'#bibTools [data-act="'+a+'"]'); await p.waitForTimeout(1500); };
  const L = [
   ['fdate',D,'#bible~kjv~JOH~1~1','light', async p=>{ await tap(p,'.bv[data-v="1"]'); await p.waitForTimeout(400); await tap(p,'.bib-act [data-a="study"]'); await p.waitForTimeout(600); await tap(p,'.vs-tabs [data-tab="comm"]'); await p.waitForTimeout(2200); console.log(await p.evaluate(()=>[...document.querySelectorAll('.fa-h')].slice(0,6).map(x=>x.innerText.replace(/\n/g,' ')).join(' || '))); }],
   ['topics',P,'#bible','dark', async p=>{ await tool(p,'topics'); console.log(await Tx(p,'#bibView')); await tap(p,'[data-tp="Grace"]'); await p.waitForTimeout(1800); console.log(await Tx(p,'#tvList')); }],
   ['names',P,'#bible','dark', async p=>{ await tool(p,'names'); console.log(await Tx(p,'#nmList')); await tap(p,'#nmList [data-nid]'); await p.waitForTimeout(600); console.log(await Tx(p,'.nm-h'), '|', await Tx(p,'.nm-fam')); }],
   ['place',P,'#bible','light', async p=>{ await tool(p,'names'); await tap(p,'[data-nk="l"]'); await p.waitForTimeout(300); await p.fill('#nmQ','Bethel'); await p.waitForTimeout(300); await tap(p,'#nmList [data-nid]'); await p.waitForTimeout(600); console.log(await Tx(p,'.nm-h'), '|', await Tx(p,'.nm-map figcaption')); }],
   ['vnames',P,'#bible~kjv~GEN~12~1','dark', async p=>{ await tap(p,'.bv[data-v="8"]'); await p.waitForTimeout(300); await tap(p,'.bib-act [data-a="study"]'); await p.waitForTimeout(500); await tap(p,'.vs-tabs [data-tab="links"]'); await p.waitForTimeout(2200); console.log(await Tx(p,'.vs-names')); }],
   ['red',P,'#bible~web~JOH~3~1','light', async p=>{ await tap(p,'#bibBar [data-more]'); await p.waitForTimeout(200); await tap(p,'#bibTools [data-red]'); await p.waitForTimeout(1200); console.log('red spans', await p.evaluate(()=>document.querySelectorAll('.bib-text .wj').length), await p.evaluate(()=>document.querySelector('.wj')?.textContent.slice(0,60))); await p.evaluate(()=>document.querySelector('.bv[data-v="3"]').scrollIntoView({block:'start'})); await p.evaluate(()=>window.scrollBy(0,-130)); await p.waitForTimeout(300); }],
   ['red-kjv',D,'#bible~kjv~MAT~5~1','dark', async p=>{ await tap(p,'#bibTools [data-red]'); await p.waitForTimeout(1200); console.log('red spans', await p.evaluate(()=>document.querySelectorAll('.bib-text .wj').length)); }],
   ['harm',P,'#bible','dark', async p=>{ await tool(p,'harmony'); console.log(await Tx(p,'#bibView')); await tap(p,'[data-hi="11"]'); await p.waitForTimeout(1800); console.log(await Tx(p,'#hgCols')); }],
   ['harm-d',D,'#bible','light', async p=>{ await tool(p,'harmony'); await tap(p,'[data-hi="43"]'); await p.waitForTimeout(1800); console.log('cols', await p.evaluate(()=>document.querySelectorAll('.hg-col').length), 'marks', await p.evaluate(()=>document.querySelectorAll('mark.hg-u').length)); }],
   ['psalter',P,'#bible','dark', async p=>{ await tool(p,'psalter'); console.log(await Tx(p,'#bibView')); }],
   ['lect-c',P,'#bible','dark', async p=>{ await tool(p,'today'); await tap(p,'[data-lt="cath"]'); await p.waitForTimeout(1500); console.log(await Tx(p,'.lc-card')); }],
   ['lect-o',P,'#bible','light', async p=>{ await tool(p,'today'); await tap(p,'[data-lt="orth"]'); await p.waitForTimeout(1500); console.log(await Tx(p,'.lc-card'));
      for(const d of [[2026,4,12],[2026,12,25],[2027,1,6],[2026,11,21],[2026,8,15],[2026,5,31],[2027,5,2]]){ const r = await p.evaluate(d=>new Promise(res=>window.HCCOrthodoxDay(d[0],d[1],d[2],o=>res((o.titles[0]||o.feasts[0]||'')+' :: '+o.rows.map(r=>r[3]+' '+r[5]).join(' | ')))), d); console.log(d.join('-'), r.slice(0,260)); } }],
   ['lect-a',P,'#bible','dark', async p=>{ await tool(p,'today'); await tap(p,'[data-lt="bcp"]'); await p.waitForTimeout(1500); console.log(await Tx(p,'.lc-tabs'), '|', await Tx(p,'.lc-card').then(s=>s.slice(0,100))); }],
   ['why',P,'#iv-6','dark', async p=>{ await p.evaluate(()=>document.querySelector('article.active .why').scrollIntoView({block:'center'})); await p.waitForTimeout(400); console.log(await Tx(p,'article.active .why')); }],
   ['src',P,'#iv-6','dark', async p=>{ console.log('fab', await p.evaluate(()=>!document.querySelector('.src-fab').hidden)); await tap(p,'.src-fab'); await p.waitForTimeout(600); console.log(await Tx(p,'#srcBody')); }],
   ['tl',P,'#ref-zoom','dark', async p=>{ await p.waitForTimeout(800); console.log('items', await p.evaluate(()=>document.querySelectorAll('.tl-it').length)); await tap(p,'[data-tr="100,800"]'); await p.waitForTimeout(400); await p.evaluate(()=>{ const it=[...document.querySelectorAll('.tl-it.l-co')].find(x=>x.getBoundingClientRect().left>0); it.click(); }); await p.waitForTimeout(300); console.log(await Tx(p,'.tl-card')); }],
   ['tl-d',D,'#ref-zoom','light', async p=>{ await p.waitForTimeout(800); await tap(p,'[data-tr="1480,1700"]'); await p.waitForTimeout(500); }],
   ['onb',P,'#home','dark', async p=>{ await p.waitForTimeout(600); console.log('onb shown', await p.evaluate(()=>!!document.querySelector('.onb'))); await p.screenshot({path:S+'q-onb0.png'}); await tap(p,'.onb [data-ob="1"]'); await p.waitForTimeout(300); await tap(p,'.onb [data-trad="orthodox"]'); await p.screenshot({path:S+'q-onb1.png'}); await tap(p,'.onb [data-ob="1"]'); await p.waitForTimeout(300); await tap(p,'.onb [data-acc="blue"]'); await tap(p,'.onb [data-oth="light"]'); await p.screenshot({path:S+'q-onb2.png'}); await tap(p,'.onb [data-ob="1"]'); await p.waitForTimeout(300); await tap(p,'.onb [data-ob="1"]'); await p.waitForTimeout(500); console.log('after', await p.evaluate(()=>[document.documentElement.dataset.theme, document.documentElement.dataset.accent, localStorage.getItem('hcc.bible'), !!document.querySelector('.onb')].join(' '))); }, {onb:true, wait:2200}],
   ['acc',P,'#bible~web~JOH~3~16','dark', async p=>{ await tap(p,'#rsBtn'); await p.waitForTimeout(300); await tap(p,'.rs-acc [data-acc="green"]'); await p.waitForTimeout(300); console.log('accent', await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--accent'))); }],
   ['tab-b',T,'#bible~kjv~JOH~1~1','dark', async p=>{ console.log('sidebar hidden', await p.evaluate(()=>getComputedStyle(document.querySelector('.sidebar')).transform!=='none'), 'tabbar', await p.evaluate(()=>getComputedStyle(document.querySelector('.tb2')).display), 'cols', await p.evaluate(()=>getComputedStyle(document.querySelector('.bib-text')).columnCount)); }, {touch:true}],
   ['tab-s',T,'#bible~kjv~JOH~1~1','light', async p=>{ await tap(p,'#bibBar [data-study="1"]'); await p.waitForTimeout(1500); console.log('docked', await p.evaluate(()=>document.querySelector('.vsheet').classList.contains('docked'))); }, {touch:true}],
  ];
  const f = process.argv[2];
  for (const l of L) if(!f || l[0].startsWith(f)) await go(...l);
  console.log(errs.join('\n')); await b.close();
})();
