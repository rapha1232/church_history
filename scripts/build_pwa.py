"""Build the installable, offline-capable web app (PWA) from site/:  python3 scripts/build_pwa.py [outdir]"""
import json, os, re, shutil, hashlib
from PIL import Image
import sys
R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')) + '/'
OUT = (sys.argv[1].rstrip('/') + '/') if len(sys.argv) > 1 else R + 'pwa/'
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT)
sys.path.insert(0, R + 'scripts')
from build_site import build
s = build()  # the page, built from src/
s = re.sub(r'<link rel="preconnect"[^>]*>', '', s)
s = re.sub(r'<link href="https://fonts\.googleapis\.com/css2[^"]*" rel="stylesheet">', '<link href="fonts.css" rel="stylesheet">', s)
s = s.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
assert 'fonts.googleapis' not in s
for d in ('img', 'bible'): shutil.copytree(R + 'site/' + d, OUT + d)
shutil.copytree(R + 'android/assets/fonts', OUT + 'fonts'); shutil.copy(R + 'android/assets/fonts.css', OUT + 'fonts.css')
# icons
src = Image.open(R + 'android/icon512.png').convert('RGBA')
os.makedirs(OUT + 'icons')
for n in (180, 192, 512):
    src.resize((n, n), Image.LANCZOS).save(OUT + 'icons/icon-%d.png' % n)
# maskable: full-bleed, glyph inside the 80% safe circle; apple-touch: full-bleed square (iOS rounds the corners itself)
Image.open(R + 'android/icon-maskable512.png').convert('RGBA').save(OUT + 'icons/maskable-512.png')
Image.open(R + 'android/icon-full512.png').convert('RGB').resize((180, 180), Image.LANCZOS).save(OUT + 'icons/apple-touch-icon.png')
manifest = {'name': 'History of the Christian Church', 'short_name': 'Church History', 'id': './', 'start_url': './#home', 'scope': './', 'display': 'standalone',
            'background_color': '#0b0c10', 'theme_color': '#0b0c10', 'description': 'The story of the Church in seasons and episodes, with the whole Bible in nine editions.',
            'icons': [{'src': 'icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png'}, {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png'},
                      {'src': 'icons/maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}]}
json.dump(manifest, open(OUT + 'manifest.webmanifest', 'w'), indent=1)
# file list for the "save everything for offline" button
files, total = [], 0
for root, _, fs in os.walk(OUT):
    for f in fs:
        p = os.path.relpath(os.path.join(root, f), OUT).replace(os.sep, '/')
        if p.startswith(('img/', 'bible/', 'fonts/')): files.append(p); total += os.path.getsize(os.path.join(root, f))
files.sort()
ver = hashlib.sha1((s + ''.join(files)).encode()).hexdigest()[:10]
shell = ['./', 'index.html', 'fonts.css', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'] + [f for f in files if f.startswith('fonts/')]
sw = r'''/* Church History offline support */
const SHELL = "hcc-shell-%(ver)s", DATA = "hcc-data-v1";
const SHELL_FILES = %(shell)s;
self.addEventListener("install", e => { e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("hcc-shell-") && k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  if (req.mode === "navigate") {   /* the page itself: network first so updates arrive, cache when offline */
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(SHELL).then(c => c.put("index.html", cp)); return r; }).catch(() => caches.match("index.html")));
    return;
  }
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req).then(r => {
    if (r.ok && /\/(img|bible|fonts|icons)\//.test(url.pathname)) { const cp = r.clone(); caches.open(DATA).then(c => c.put(req, cp)); }
    return r;
  })));
});
self.addEventListener("message", e => {
  if (!e.data || e.data.type !== "saveAll") return;
  const list = e.data.files, port = e.ports[0]; let done = 0, failed = 0;
  caches.open(DATA).then(async c => {
    for (let i = 0; i < list.length; i += 6) {
      await Promise.all(list.slice(i, i + 6).map(async f => {
        try { if (!(await c.match(f))) { const r = await fetch(f); if (r.ok) await c.put(f, r); else failed++; } } catch (err) { failed++; }
        done++;
      }));
      port.postMessage({done, total: list.length, failed});
    }
    port.postMessage({done: list.length, total: list.length, failed, end: true});
  });
});
''' % {'ver': ver, 'shell': json.dumps(shell)}
open(OUT + 'sw.js', 'w').write(sw)
head = ('<link rel="manifest" href="manifest.webmanifest"><meta name="theme-color" content="#0b0c10">'
        '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">'
        '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="Church History">'
        '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">')
s = s.replace('</head>', head + '</head>', 1)
css = ('<style>.pwa-card{margin:0 0 30px;padding:18px 20px;border-radius:14px;background:var(--panel);border:1px solid var(--rule)}.pwa-card h3{margin:0 0 6px;font-size:1.15rem}.pwa-card h3::before{display:none}'
       '.pwa-card p{margin:0 0 8px;font:14px/1.55 var(--font-ui)}.pwa-card ol{margin:0 0 10px;padding-left:20px;font:14px/1.6 var(--font-ui)}.pwa-bar{height:6px;border-radius:3px;background:var(--rule);overflow:hidden;margin:8px 0}'
       '.pwa-bar i{display:block;height:100%;width:0;background:var(--rubric);transition:width .3s}.pwa-share{display:inline-block;width:16px;height:16px;vertical-align:-3px}</style>')
js = r'''<script>(function(){
var FILES = %(files)s, MB = %(mb)d;
if("serviceWorker" in navigator) addEventListener("load", function(){ navigator.serviceWorker.register("sw.js").catch(function(){}); });
var standalone = window.navigator.standalone === true || matchMedia("(display-mode: standalone)").matches;
var ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
function card(){
  var sh = document.querySelector(".shelves"); if(!sh || document.querySelector(".pwa-card")) return;
  var box = document.createElement("section"); box.className = "pwa-card"; box.setAttribute("aria-label", "Install and offline");
  var saved = false; try{ saved = localStorage.getItem("hcc.offline") === "1"; }catch(e){}
  var html = "";
  if(!standalone && ios) html += '<h3>Put this on your home screen</h3><p>It then opens full-screen like an app and works offline.</p><ol><li>Tap the <b>Share</b> button <svg class="pwa-share" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3v13M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg> in Safari.</li><li>Choose <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>.</li></ol>';
  else if(!standalone) html += '<h3>Install the app</h3><p>Use your browser’s “Install app” or “Add to Home Screen” option to open it full-screen and offline.</p>';
  html += '<h3>'+(saved ? "Saved for offline" : "Save everything for offline")+'</h3><p>'+(saved ? "All episodes, images and Bible texts are stored on this device. Tap again to check for missing files." : "Pages you open are kept automatically. To have every image and all nine Bibles with the original languages and commentary available without a connection, save everything now (about "+MB+" MB).")+'</p><button type="button" class="btn-sm" id="pwaSave">'+(saved ? "Check offline files" : "Save everything")+'</button><div class="pwa-bar" hidden><i></i></div><p class="pwa-st" aria-live="polite" style="color:var(--muted);font-size:13px"></p>';
  box.innerHTML = html; sh.insertBefore(box, sh.firstChild);
  box.querySelector("#pwaSave").addEventListener("click", function(){
    var b = this, bar = box.querySelector(".pwa-bar"), st = box.querySelector(".pwa-st");
    if(!navigator.serviceWorker || !navigator.serviceWorker.controller){ st.textContent = "Offline saving starts after the app has loaded once. Reload and try again."; return; }
    b.disabled = true; bar.hidden = false; st.textContent = "Saving…";
    if(navigator.storage && navigator.storage.persist) navigator.storage.persist();
    var ch = new MessageChannel();
    ch.port1.onmessage = function(e){ var d = e.data; bar.firstChild.style.width = (d.done / d.total * 100).toFixed(1) + "%%"; st.textContent = d.done + " of " + d.total + " files";
      if(d.end){ b.disabled = false; st.textContent = d.failed ? d.failed + " files could not be saved; try again on a better connection." : "Done. Everything works offline."; if(!d.failed){ try{ localStorage.setItem("hcc.offline", "1"); }catch(err){} } } };
    navigator.serviceWorker.controller.postMessage({type: "saveAll", files: FILES}, [ch.port2]);
  });
}
setTimeout(card, 500); addEventListener("hashchange", function(){ setTimeout(card, 100); });
})();</script>''' % {'files': json.dumps(files), 'mb': round(total / 1e6)}
k = s.rindex('</body>'); s = s[:k] + css + js + s[k:]
open(OUT + 'index.html', 'w', encoding='utf-8').write(s)
open(OUT + '_headers', 'w').write('/sw.js\n  Cache-Control: no-cache\n/index.html\n  Cache-Control: no-cache\n')
open(OUT + '.nojekyll', 'w').write('')
n = sum(len(fs) for _, _, fs in os.walk(OUT)); size = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(OUT) for f in fs)
print('pwa files', n, 'MB', round(size / 1e6), 'offline list', len(files), 'version', ver)
