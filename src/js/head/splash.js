(function(){
  var d = document.documentElement, show = false;
  try{
    var standalone = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
    show = (!!window.HCCApp || standalone) && !sessionStorage.getItem("hcc.splash");
    if(show) sessionStorage.setItem("hcc.splash", "1");
  }catch(e){ show = false; }
  if(!show) return;
  d.classList.add("booting");
  var t0 = Date.now(), gone = false, MIN = 700, MAX = 5000;
  function leave(now){
    if(gone) return; gone = true;
    setTimeout(function(){
      d.classList.add("sp-out");
      setTimeout(function(){ d.classList.remove("booting", "sp-out", "sp-slow"); var e = document.getElementById("splash"); if(e) e.remove(); }, 520);
    }, now ? 0 : Math.max(0, MIN - (Date.now() - t0)));
  }
  var slow = setTimeout(function(){ if(!gone) d.classList.add("sp-slow"); }, 1100);
  setTimeout(function(){ leave(true); }, MAX);   /* never trap the reader behind the splash */
  document.addEventListener("pointerdown", function(e){ if(e.target.closest && e.target.closest("#splash")) leave(true); }, true);
  document.addEventListener("keydown", function(){ leave(true); }, {once:true});
  function ready(){
    var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([fonts, new Promise(function(r){ setTimeout(r, 900); })]).then(function(){
      /* let the first route render (it runs a moment after the scripts) before revealing it */
      setTimeout(function(){ requestAnimationFrame(function(){ clearTimeout(slow); leave(false); }); }, 140);
    });
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready); else ready();
})();