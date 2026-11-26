# src/: the web app's source

`site/index.html` is built from this folder and is not stored in git. Build it with

```bash
python3 scripts/build_site.py
```

The result is still a single self-contained `index.html`. The Android app opens it from `file://`, where
ES modules and `fetch()` of local files don't work, so everything the page needs at start is inlined. The large
libraries (`site/bible/`, `site/img/`) are separate files, loaded on demand with `<script>` and `<img>` tags.

| Path | What it holds |
|---|---|
| `index.html` | The template: `<head>`, the cascade order of every stylesheet and the run order of every script. Start here. |
| `pages/` | One file per page: a single `<article id="…">` element. The id is the route (`#iv-6`), and the file name must match it. Seasons are in `pages/seasons/NN-x/`, reference pages in `pages/reference/`, and so on. |
| `pages/order.txt` | The order of the pages in the document. |
| `partials/` | Large static markup: header and sidebar (`chrome.html`), overlays, the SVG sprite and map paths. |
| `css/` | Stylesheets. All of them go into `<head>`, in the order the template lists them. |
| `js/` | Scripts, each run in its own `<script>` element in the order the template lists them. `js/head/` runs before the page is drawn (theme, launch screen). |
| `data/` | JSON published as globals: `data/X.json` becomes `window.__X__`. Pretty-printed in the source and minified in the page. |

The build fails if a file in `css/`, `js/`, `data/`, `partials/` or `pages/` is never used, or is used twice,
or if a page's id doesn't match its file name. Nothing can be forgotten or included twice.

## Common changes

**Edit a page's text.** Open its file in `pages/` (search for the id from the address bar, for example `iv-6.html`).

**Add a page.**
1. Create `pages/<group>/<id>.html` containing `<article id="<id>" data-title="…" …>…</article>`. Copy the
   attributes from a similar page: `data-kind`, `data-vol` and `data-topics` decide where it is listed.
2. Add its path to `pages/order.txt`.
3. If it belongs in the sidebar contents, add a link to it in `partials/chrome.html`.

**Add a feature.** Create `css/<feature>.css` and/or `js/<feature>.js` and list them in `index.html`. Put the
stylesheet before `design.css` unless it must override the design layer, and the script after anything it
uses (for example after `js/bible.js` if it calls `window.HCCBible`). Follow the existing features:
wrap the script in `(function(){ "use strict"; … })();`, expose only what other scripts need on `window.HCC…`,
and read `DESIGN.md` before choosing colours, type or components.

**Change data.** Edit the JSON in `data/`. If the data comes from a generator in `tools/`, change the
generator instead and run it again.

## Checking a change

```bash
bash tests/build_check.sh                                        # builds, and checks generated data
python3 scripts/build_site.py && node tests/smoke.js             # opens every main route in Chromium
```

The **Checks** workflow runs both on every pull request.
