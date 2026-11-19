(function(){
"use strict";
/* Edition 18: widgets on the home screen and the lock screen. Adds "Customize" and "Add" to the
   Notifications and widgets panels of the quote and verse cards (Android app only). */
var $ = function(s,r){return (r||document).querySelector(s)};
var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var APP = window.HCCApp && window.HCCApp.isApp && window.HCCApp.openWidgets ? window.HCCApp : null;
if(!APP) return;
function haptic(){ try{ APP.haptic("tick"); }catch(e){} }
function can(){ try{ return !!APP.canPinWidgets(); }catch(e){ return false; } }
function mount(){
  [[".qotd", "quote", "Quote"], [".votd", "verse", "Verse"]].forEach(function(c){
    var card = $(c[0]); if(!card) return;
    var host = $(".card-set", card) || card; if($(".wset", host)) return;
    var box = document.createElement("div"); box.className = "wset";
    box.innerHTML = '<div class="setrow"><span>Widgets<small>Home screen and lock screen: themes, text size, Greek or Hebrew</small></span>'+
      '<span class="wset-b">'+(can() ? '<button type="button" class="btn-sm" data-w="'+c[1]+'">Add '+c[2]+'</button><button type="button" class="btn-sm" data-w="today">Add Today</button>' : '')+
      '<button type="button" class="btn-sm pri" data-w="edit">Customize</button></span></div>';
    host.appendChild(box);
    box.addEventListener("click", function(e){
      var b = e.target.closest("[data-w]"); if(!b) return; haptic();
      try{ if(b.dataset.w === "edit") APP.openWidgets(); else APP.pinWidget(b.dataset.w); }catch(err){}
    });
  });
}
var css = document.createElement("style");
css.textContent = ".wset .setrow{flex-wrap:wrap}.wset .setrow>span:first-child{display:flex;flex-direction:column;gap:2px;flex:1 1 180px}"+
  ".wset small{font:12.5px/1.45 var(--font-ui);color:var(--muted)}.wset-b{display:flex;flex-wrap:wrap;gap:8px}.wset-b .btn-sm{min-height:40px}";
document.head.appendChild(css);
[400, 1400, 2600].forEach(function(t){ setTimeout(mount, t); });
addEventListener("hashchange", function(){ setTimeout(mount, 450); });
})();
