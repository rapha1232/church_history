# DESIGN.md: History of the Christian Church

This file is the design contract for the app. Read it before changing anything in `site/index.html`
or adding a new CSS/JS layer in `tools/`. It has three parts:

1. **What the app is**: an audit of the pages, elements and layout as they stand (Edition 19).
2. **What we believe**: the design direction, the research behind it and the patterns we ban.
3. **What we use**: tokens, type, colour, components, motion and a checklist for every change.

The rules here are implemented by the **Edition 20 design layer** (`tools/v20.css`, `tools/v20.js`,
applied to the built page by `tools/v20.py`).

---

## 1. Audit of the app (Edition 19)

### 1.1 What it is

A single-page, offline-first reading app (5.5 MB `index.html`, 344 images, a Bible library in
`site/bible/`). It ships unchanged as a web page, an installable iPhone/iPad web app and an Android
WebView app. Routing is hash based (`#home`, `#iv-6`, `#bible~kjv~JOH~1~1`, `#ref-people`). Every page is an
`<article>` inside one `<main>`, and only the active one is shown.

Content is long-form history: 15 **seasons** (`vol-i` … `vol-xv`), about 120 **episodes**
(`i-1` … `xv-8`), 2 study parts (`vol-p3`, `vol-p4`) and about 30 **reference** pages.

### 1.2 Page inventory

| Group | Pages | Pattern |
|---|---|---|
| Home | `#home` | Billboard carousel of seasons, greeting, "continue" cards, verse/quote of the day, on-this-day, shelves of seasons and episodes |
| Season | `#vol-i` … `#vol-xv` | Full-bleed image hero with a Roman numeral, synopsis, Play / All seasons, episode poster grid |
| Episode | `#i-1` … `#xv-8` | Cold-open hero (image + title + synopsis), "Starring" cast row, body with drop cap, footnotes, glossary pop-ups, evidence badges, primary-source boxes, "Why it matters", takeaways, "Up next" |
| Bible | `#bible~ed~BOOK~ch~v` | Sticky pill bar (book, edition, Read/Study, more), tool chips, large chapter numeral, verse text, verse action sheet, study sheet (lexicon, Fathers, cross-references), picker sheet, prev/next |
| Reference: lists | People, Glossary, Councils table, Churches, Documents, Bibliography, Register, Controversies, Myths | Title, lede, filters (chips + selects + search field), list of cards or table rows |
| Reference: visual | Timeline (`ref-zoom`), Interactive timeline, Atlas, Council map, Church tree, Gallery (masonry), Image atlas, Bible maps, Canon, Arcs | Filter bar + a large SVG or canvas surface + info panel |
| Reference: personal | Notebook, Plans, On this day, Settings | Cards with actions, progress bars, native selects, file buttons |
| Shell | Top bar, sidebar (Contents / Eras / Topics / Bookmarks), search results popover, bottom tab bar (phones, tablets), reading-settings sheet, onboarding, lightbox, sources drawer, year "trail", back-to-top | |

### 1.3 Layout

- **Desktop (≥ 961 px):** fixed 56 px top bar; fixed 304 px left sidebar with the contents tree;
  content column centred in the remaining space (episodes about 720 px, `.wide` reference pages fill
  the column). Heroes bleed edge to edge inside `main`.
- **Phone and touch tablet:** top bar with logo, search, bookmark and type settings; a 5-item bottom tab
  bar (Home, Bible, Search, Library, Saved); the sidebar becomes an off-canvas drawer. Chrome hides
  on scroll down (`body.chrome-off`).
- **Themes:** Night (default), Light, Sepia; six accent colours; reader text size and leading.

### 1.4 How it is built

Twenty "editions" of CSS stacked in one `<style>` block (177 KB) plus JS layers that inject more.
Each edition overrides the last. Tokens were redefined three times (Editions 1, 5, 14), so the cascade
is long but tokens (`--paper`, `--panel`, `--elev`, `--ink`, `--muted`, `--rule`, `--accent`,
`--lapis`, `--gold`, `--font-*`, `--radius`) are used consistently. That lets a final layer re-theme
the app without touching earlier editions.

### 1.5 What works

- Content is specific and serious: real dates, sources, evidence labels, named people. No filler.
- Strong reading foundation: Literata for body text, adjustable size and leading, sepia theme.
- Clear information architecture: seasons, episodes and reference, with good cross-linking.
- Roman numerals in the contents, a rubricated drop cap and season colours tie the UI to the subject.
- Accessibility basics are in place: skip link, focus outlines, `aria-*` on tabs, reduced-motion rules.

### 1.6 Problems found

**Template and "AI-default" tells**

| # | Issue | Where |
|---|---|---|
| A1 | **Inter** for all UI text, **Fraunces** for display. Both are among the most common defaults in generated UI, and Inter's neo-grotesque shapes clash with Literata's old-style warmth. | Global |
| A2 | Accent palette taken straight from Tailwind defaults (`#c2410c` orange-700, `#15803d` green-700, `#7c3aed` violet-600, `#be185d` pink-700…). | Accents, onboarding |
| A3 | **Glassmorphism** everywhere: `backdrop-filter: blur()` on the top bar, tab bar, Bible bar, floating buttons, sources button, trail, onboarding scrim. | Shell |
| A4 | Decorative **radial-gradient glows** on cards (verse of the day, quote of the day, "Why it matters"). | Home, episodes |
| A5 | Everything is a pill: buttons, chips, inputs, selects, badges, search, tabs, even static date badges (`.fa-d`). Cards use soft 14–22 px radii with lift-on-hover (`translateY(-2px)`). | Global |
| A6 | Near-pure-black night theme (`#0a0a0c`) with near-white text gives harsh contrast ("halation") for long reading. | Night theme |
| A7 | The active tab uses the stock Material 3 tinted-pill indicator. | Tab bar |

**Defects and polish**

| # | Issue | Where |
|---|---|---|
| B1 | HTML entities shown literally: "Rus&#x27;, Moscow…", "Historians&#x27; views". | Timeline, shelves, up-next |
| B2 | The back-to-top control is an unstyled, underlined blue "↑" link, visible at the top of every page and sitting over content and above the tab bar. | Global |
| B3 | The floating year trail ("318 / 381") sits over the episode hero image on desktop. | Episodes |
| B4 | The drop-cap colour (`::first-letter`) is applied to every page lede, so "148 figures" renders a coloured "1" and "108 terms" a coloured "1". | Reference pages |
| B5 | Eyebrows expose internal codes: "Reference · C", "Reference · F2", "Reference · G". The brand subtitle reads "Edition 15 · The Series", which is build jargon. | Reference pages, top bar |
| B6 | Lone "→" links after summaries are underlined, add noise and give screen readers no link text. | People, Glossary, On this day |
| B7 | Some ledes run full width (about 120 characters per line on the Councils page), far beyond a readable measure. | Wide reference pages |
| B8 | Native `<select>`s keep platform chrome and do not match the other controls. Input borders are too faint for the 3:1 non-text contrast rule. | Settings, People, filters |
| B9 | The Sources button overlaps the hero image caption on desktop. | Episodes |
| B10 | Headings break badly ("The World / before / Christianity"); there is no `text-wrap: balance`. | Heroes, titles |

---

## 2. Direction

### 2.1 The idea: a scriptorium, used with restraint

The subject is two thousand years of manuscripts, councils, icons and printed books. The design
borrows the **working practices of the codex**, not its ornament:

- **Vellum and iron-gall ink.** Warm paper, warm near-black ink. At night, a dim **candlelit**
  room: warm charcoal surfaces and parchment-coloured text, never blue-black glass.
- **Rubrication.** Medieval scribes used red sparingly to mark what to find: initials, headings,
  numerals, the start of a section. Our accent does the same job and nothing more: the
  drop cap, Roman numerals, eyebrows, the current item, focus. It is never used for large fills.
- **Real pigments.** Accent colours are named after historical pigments: vermilion, lapis,
  verdigris, orpiment/ochre, madder and Tyrian purple. Their values are tuned for contrast,
  not taken from a framework palette.
- **Ruled lines, not floating cards.** Scribes ruled their pages. Structure comes from hairline rules,
  alignment and whitespace. Borders come first, shadows only for things that truly float
  (sheets, popovers, menus).
- **One family of letters.** A single serif superfamily for both headings and reading, as a printed
  book would use, and a humanist sans for interface labels.

### 2.2 Principles

1. **The text is the interface.** Most screen time is reading. Measure, leading and contrast come
   before chrome. Every decision is judged by "does this help someone read a chapter?"
2. **Decoration must carry meaning.** A colour, rule or glyph earns its place by marking something
   (a new section, the current item, a type of evidence). If it marks nothing, it is deleted.
3. **Specific over generic.** Real images, real dates, Roman numerals and named sources do the
   brand work. A swap test applies: if the layout would work for a SaaS dashboard, it is wrong.
4. **Quiet chrome, loud content.** Bars and controls recede (opaque, flat, muted) so images and
   text lead.
5. **Same rules in every theme.** Night, Light and Sepia share one token set. No component
   hard-codes a colour.

### 2.3 Research basis

| Topic | Finding | Applied as |
|---|---|---|
| Generic "AI look" | It comes from unexamined defaults: Inter everywhere, purple/blue gradients, glassmorphism, rounded cards with soft shadows, gradient text, glowing dark mode, one-sided thick card borders. Fix it with exact tokens, a real reference outside the algorithm and explicit bans. [Creative Bloq], [DEV], [Impeccable], [UX Planet], [Noqta], [Venngage] | §2.4 ban list; §3 exact tokens; manuscript reference |
| Line length | 50–75 characters per line, about 66 ideal; 30–50 on phones. `max-width: 66ch` is a good start. [UXPin], [Oregon State], [Designer Daily] | `--measure: 66ch` for prose, `62ch` for ledes |
| Line height | About 1.5 baseline, 1.6–1.7 for long measures; unitless values. [Chrome typography guide], [UXPin] | Body 1.7, Bible 1.8, UI 1.45 |
| Wrapping | `text-wrap: pretty` for paragraphs; balance for headings. [Chrome typography guide] | Headings `balance`, prose `pretty` |
| Justification | Avoid without hyphenation (rivers). [Designer Daily] | Left-aligned; hyphenation only on phones |
| Dark mode | Avoid pure black (`#121212`-ish dark grey, Material); soften white text; show elevation by lighter surfaces, not shadows; desaturate accents; give users a toggle. [LogRocket], [Toptal], [UXcel], [UX Planet] | Warm charcoal `#15130f`, text `#ede6d8`, three surface steps, lighter accent tints |
| Bible and reading apps | The best-reviewed readers (NeuBible and others) win on typography, calm, night modes and user control of type; pure black divides users. [Dwell], [App Store listings] | Keep size/leading controls; candlelit night theme; Sepia kept |
| Targets | WCAG 2.2 AA 2.5.8: 24×24 px minimum; 44×44 px recommended (AAA 2.5.5). [W3C], [Deque] | All icon buttons ≥ 40 px, tab items ≥ 48 px tall, chips ≥ 36 px |
| Contrast | 4.5:1 for text, 3:1 for component boundaries. [WCAG 2.2] | Verified per token (§3.2); `--rule-strong` for inputs |
| Colour systems | Semantic tokens switched per theme; derive tints with `color-mix()`; low chroma for neutrals, chroma only for accents. [web.dev], [Flavio Copes], [LogRocket] | Semantic tokens; `color-mix()` for washes |
| Museum and collection sites | The V&A, Met, Brooklyn and National Gallery use understated chrome, neutral palettes, plain-text labels over icons, and a prominent search. [V&A], [Brooklyn], [DesignRush], [Numiko] | Neutral chrome, text labels, search kept central |
| Timelines | Predictable path, user-controlled exploration, short labels, keyboard access. [Fiveable], [Shorthand], [MS Research] | Muted lanes, accent only for the selection |
| Anti-slop rules | No glass without a high-contrast border and opaque fallback; no decorative pills on static metadata; delete decoration, not structure. [VectorLab anti-slop] | §2.4 |

### 2.4 Banned patterns (the slop list)

Do not add any of these. If you find one, remove it.

- `backdrop-filter` on bars, buttons, panels or scrims. Use opaque surfaces with a 1 px border.
- Radial or multi-hue gradients on cards and buttons. The only gradients allowed are image
  scrims (dark to transparent, for legibility of text on photos).
- Gradient text, glow shadows, coloured shadows.
- Pill shapes on static text (dates, counts, metadata). Pills are only for **toggle chips** and the
  segmented control.
- Hover "lift" (`translateY`) on cards. Hover changes the border colour or underline instead.
- Thick coloured left border on a rounded card as a "callout" style. Use a rubric mark or a
  hairline rule instead.
- Inter, Fraunces, Poppins, Montserrat or another default UI font, or a third typeface.
- Framework default colours (Tailwind, Material baseline) as brand colours.
- Emoji or cartoon illustrations as UI. Empty states use one sentence and an action.
- Meaningless link text ("→", "click here"). Arrow-only links need an `aria-label`.
- Internal codes in user-facing text (edition numbers, section letters such as "C" or "F2").
- More than one animated flourish per screen. Motion is for state changes, not decoration.

---

## 3. Tokens

All tokens live on `:root` and are redefined for `[data-theme="dark"]`, `prefers-color-scheme: dark`
(when no theme is set) and `[data-theme="sepia"]`. Components use only tokens.

### 3.1 Type

| Token | Value | Use |
|---|---|---|
| `--font-display` | `"Literata", "Iowan Old Style", Georgia, serif` | Headings, titles, numerals (optical size 48–72) |
| `--font-body` | `"Literata", "Iowan Old Style", Georgia, serif` | Reading text (optical size 12–18) |
| `--font-ui` | `"Source Sans 3", "Segoe UI", system-ui, sans-serif` | Labels, buttons, metadata, tables |

Literata was designed for long-form e-reading (Google Play Books). It has an optical-size axis
(7–72), so one family covers 12 px footnotes and 100 px chapter numerals, and it includes Greek.
Source Sans 3 is a humanist sans, so it shares Literata's calligraphic stress and reads well at
11–14 px. It also covers Greek.

**Scale** (1.25 ratio, rem based, fluid at display sizes):

| Step | Size | Line height | Weight | Use |
|---|---|---|---|---|
| `display` | `clamp(2.2rem, 1.5rem + 3.2vw, 4rem)` | 1.04 | 600 | Hero titles |
| `h1` | `clamp(2rem, 1.5rem + 2.2vw, 3rem)` | 1.08 | 600 | Page titles |
| `h2` | 1.6rem | 1.2 | 600 | Section heads |
| `h3` | 1.3rem | 1.25 | 600 | Sub-heads, card titles |
| `lede` | 1.15rem | 1.6 | 400 | Page intro, muted, max 62ch |
| `body` | 1.0625rem (17 px) × user scale | 1.7 | 400 | Prose, max 66ch |
| `ui` | 0.875rem (14 px) | 1.45 | 500/600 | Buttons, labels |
| `meta` | 0.8125rem (13 px) | 1.45 | 400 | Dates, captions |
| `eyebrow` | 0.75rem (12 px), +0.14em tracking, uppercase | 1.3 | 600 | Section label, rubricated |

Rules: at most two weights per screen region (400 and 600). Use tabular numerals
(`font-variant-numeric: tabular-nums`) in tables, dates and counters, and old-style numerals in prose.
Headings get `text-wrap: balance`; paragraphs `text-wrap: pretty`. Prose is left-aligned and is
hyphenated only below 600 px.

### 3.2 Colour

Contrast ratios are measured against `--paper` (all pass WCAG AA 4.5:1).

**Vellum (light)**

| Token | Value | Ratio | Role |
|---|---|---|---|
| `--paper` | `#f5f1e8` | | Page |
| `--panel` | `#fbf8f2` | | Cards, bars |
| `--elev` | `#fffdf8` | | Sheets, popovers, inputs |
| `--ink` | `#1e1b16` | 15.2 | Text (iron-gall) |
| `--muted` | `#655d52` | 5.8 | Secondary text |
| `--rule` | `#e0d8c8` | | Hairlines (decorative) |
| `--rule-strong` | `#8c8272` | 3.4 | Input and control borders (3:1) |
| `--accent` / `--rubric` | `#b3361d` vermilion | 5.4 | Rubrication, current, focus |
| `--lapis` | `#24448f` | 8.1 | Links |
| `--gold` | `#835e10` ochre | 5.2 | Highlights, events |
| `--verdigris` | `#2c6a59` | 5.6 | Documented / success |

**Candlelight (night)**: warm charcoal, never `#000`.

| Token | Value | Ratio |
|---|---|---|
| `--paper` | `#15130f` | |
| `--panel` | `#1c1a16` | |
| `--elev` | `#24211c` | |
| `--ink` | `#ede6d8` | 14.9 |
| `--muted` | `#a99f90` | 7.1 |
| `--rule` | `#312c25` | |
| `--rule-strong` | `#6e6557` | 3.2 |
| `--accent` | `#ea7d5f` | 6.7 |
| `--lapis` | `#9fb5ec` | 9.1 |
| `--gold` | `#d8b068` | 9.1 |
| `--verdigris` | `#7dc0ac` | 8.8 |

**Sepia** keeps its Edition 10 values, with the vermilion accent.

**Pigment accents** (Settings → accent; the stored keys stay the same for compatibility):

| Key | Pigment | Light | Night |
|---|---|---|---|
| `orange` (default) | Vermilion | `#b3361d` | `#ea7d5f` |
| `blue` | Lapis lazuli | `#24448f` | `#9fb5ec` |
| `green` | Verdigris | `#2c6a59` | `#7dc0ac` |
| `gold` | Orpiment / ochre | `#835e10` | `#d8b068` |
| `rose` | Madder | `#a02f4e` | `#e79aae` |
| `purple` | Tyrian | `#6c2f72` | `#cfa3d4` |

**60-30-10:** about 60% paper, 30% ink and muted text and rules, at most 10% accent. The accent is
never a background fill larger than a button.

### 3.3 Space, shape, depth

- **Spacing:** 4 px base: `4, 8, 12, 16, 24, 32, 48, 64`. Phone gutter 16 px, desktop 24–32 px.
- **Radii:** `--r-sm: 6px` (badges, inputs), `--r-md: 10px` (buttons, cards, tiles),
  `--r-lg: 16px` (sheets, dialogs, large media), `999px` only for toggle chips and segmented
  controls. Images inside cards follow the card radius.
- **Depth:** level 0 paper; level 1 panel with a 1 px `--rule` border; level 2 elev with a border
  plus `--shadow-1` (`0 1px 2px` + `0 8px 24px` at low alpha), only for things that float. In
  night mode depth comes from the lighter surface; shadows are nearly invisible by design.

### 3.4 Motion

- Durations: `--t-fast: 120ms` (hover, press), `--t-med: 220ms` (sheets, fades),
  `--t-slow: 360ms` (page enter). Easing `cubic-bezier(.2,.7,.2,1)`.
- Animate only `opacity`, `transform` and `color`/`background-color`. Never layout.
- One signature moment: the page enter fade. Remove hover lifts and decorative loops.
- `prefers-reduced-motion: reduce`: all transitions and animations at most 1 ms, no smooth scroll,
  carousel stays put.

---

## 4. Components

| Component | Rules |
|---|---|
| **Navigation model** (Edition 21) | Five sections, everywhere the same: **Home · Series · Bible · Studies · Library**. Wide screens show them as a text menu in the top bar; phones and touch tablets show them in the bottom bar. Search stays in the top bar. **Settings** is its own gear button (it is never reached through the Aa reading panel, which holds only reading options). Every section is a real page with its own URL, never a drawer. |
| **Top bar** | Opaque `--paper`, hairline bottom rule once scrolled. Order: brand · menu · search · Aa · Settings. Brand: mark + "History of the Christian Church" + subtitle "A story in fifteen seasons" (subtitle, then title, drop out as the window narrows). Menu items: UI 15 px, muted; current = ink + 2 px rubric underline. Icon buttons 40 px. No bookmark, theme or "All" buttons in the bar: those live in the page, the Aa panel and the Series page. |
| **Sidebar** | Only while reading the Series (seasons and episodes); every other section uses the full width. On phones the same tree opens as a drawer from Series → All chapters, or by tapping Series again. Paper background, hairline right rule. Roman numerals rubricated in display face, tabular. Current item: ink text, 2 px rubric bar at the left, no fill pill. Tabs: underline style (text + 2 px rubric underline), not filled pills. |
| **Tab bar** | Opaque panel, hairline top rule. Items 48 px+ tall. Active: ink label + accent icon + 2 px accent bar at the top edge. No tinted pill. Tapping the current tab scrolls to the top. |
| **Page actions** | Actions that belong to a page sit in the page: **Bookmark** and **Add to study** in an episode's hero actions, Bookmark under the title of reference pages. Bookmarks are listed in Library. |
| **Buttons** | `--r-md`, 40 px min height (44 on touch). Primary: solid `--ink` on `--paper` (or paper on ink in heroes). Secondary: transparent with `--rule-strong` border. Press: `scale(.98)`. No gradients. |
| **Chips (filters)** | Pill, 36 px, `--rule` border, `--panel` fill. Selected: ink fill, paper text. Only interactive toggles are chips. |
| **Inputs and selects** | `--r-sm`, 44 px, `--elev` fill, `--rule-strong` border, custom chevron on selects, accent focus ring. Visible labels; placeholders only for hints. |
| **Cards** | `--r-md`, `--panel`, 1 px `--rule`. No hover lift: hover darkens the border. Titles in display face. |
| **Eyebrows** | `eyebrow` step, rubricated, plain words only ("Reference", "Calendar"). |
| **Drop cap** | Episodes only: rubricated initial, about 3 lines tall, display face. Never on reference ledes. |
| **Callouts** ("Why it matters", key boxes) | Flat panel, hairline border, a short 24 × 2 px rubric rule above the label. No glow gradients. |
| **Evidence badges** | `--r-sm` tag, small caps UI text, tinted with its evidence colour (`color-mix` 12%). |
| **Links** | Lapis, underline offset 3 px, thickness 1 px; on hover the colour changes to the accent. Arrow-only "go" links: no underline, muted, with `aria-label`. |
| **Heroes** | Image + bottom-weighted dark scrim (single hue). Title balanced; synopsis max 60ch. Floating UI (trail, sources) must not overlap the hero. |
| **Tables** | UI font, tabular numerals, header row in eyebrow style, hairline rows, no zebra fills. |
| **Floating buttons** (Bible prev/next, Sources, back-to-top) | Opaque `--elev`, 1 px border, `--shadow-1`, 44 px. Back-to-top only appears after scrolling. |
| **Sheets and dialogs** | `--elev`, `--r-lg` top corners, `--shadow-2`, opaque scrim `rgba(0,0,0,.5)`. |

## 5. Page guidance

- **Home:** the billboard is the one cinematic moment. Below it, a calm, ruled list layout: verse and
  quote cards are flat panels with display-face quotations; the "continue" row uses tiles with no lift.
- **Season and episode:** keep heroes; let the image do the work. Body column 66ch. Footnotes and
  glossary terms use the dotted underline in `--muted`. The year trail shows only once the hero has
  scrolled away.
- **Bible:** chapter numeral in the display face at optical size 72; verse numbers in the UI font, muted,
  superscript; Words of Christ in a vermilion that passes contrast in each theme. The bar is opaque.
- **Reference lists:** title, lede (62ch), filters, then results. Filters: chips for one dimension,
  selects for the rest, a count aligned right in tabular numerals.
- **Timeline, maps, trees:** chrome muted, the accent only for the current selection; lanes in
  low-chroma washes.
- **Settings:** grouped cards, label + description + control; buttons named with verbs ("Save to a
  file").
- **Series:** a grid of the fifteen seasons (image with the rubricated Roman numeral, season and dates,
  title, episodes and minutes, progress), then the study companions. Actions: Continue / Start, All
  chapters, Method and sources.
- **Library:** ruled lists, two columns on wide screens: "Yours" (Studies, notebook, plans, Settings,
  bookmarks) first, then the reference tools grouped by kind (Time, People and places, Councils and
  doctrine, Texts and sources, Pictures, Bible companions). Each row is a title and the page's own
  first sentence.
- **Studies:** a list of studies, then one study per page (`#studies~<id>`): editable title, an
  overview/conclusion field, and two positions (default **For** and **Against**, renamable) side by side,
  as tabs on phones. Position headers carry a 2 px rule (lapis and porphyry: two neutral pigments, so
  neither side reads as "right"). Evidence is a flat card: kind label (Scripture, Church Father,
  Document, Episode, Note, Link) in eyebrow style, the source as a link, the quotation in the body face
  with a hairline rule, the reader's note under a hairline, and quiet text actions (Edit, Move, ↑ ↓,
  Delete with Undo). Verses are stored by reference and shown in the reader's edition. Adding uses one
  dialog (a bottom sheet on phones) from the study, the Bible verse bar, the verse study sheet and each
  Fathers excerpt, the texts library and episodes. Deleting a whole study asks for a named
  confirmation. Studies are saved under `hcc.studies` (so they are in the backup file) and can be
  exported as Markdown or shared as a `.study.json` file that another reader can import.

## 6. Accessibility

- Contrast: text ≥ 4.5:1, large text and control boundaries ≥ 3:1 (checked in §3.2).
- Targets: ≥ 24 px everywhere, ≥ 44 px for primary touch controls.
- Focus: `2px solid var(--accent)`, `outline-offset: 2px` on every interactive element; never removed.
- Respect `prefers-reduced-motion`, `prefers-color-scheme` and user font scaling (rem units).
- Never rely on colour alone: evidence badges carry text, and the selected chip changes fill **and**
  weight.

## 7. Checklist for every change

- [ ] Uses tokens only: no new hex values in components.
- [ ] No item from the ban list (§2.4).
- [ ] Looks right in Night, Light and Sepia, at 375 px and 1280 px, with no horizontal scroll.
- [ ] Prose ≤ 66ch, ledes ≤ 62ch, headings balanced.
- [ ] Touch targets ≥ 44 px on phones; focus ring visible.
- [ ] Reduced motion honoured.
- [ ] User-facing text is plain words, with no internal codes or edition numbers.

## Sources

- Creative Bloq, "Everything looks the same. Now what?": https://www.creativebloq.com/ai/everything-looks-the-same-now-what
- DEV, "How to fix the AI-generated look in your frontend": https://dev.to/alanwest/how-to-fix-the-ai-generated-look-in-your-frontend-1ahh
- Impeccable, anti-patterns: https://www.mintlify.com/pbakaus/impeccable/concepts/anti-patterns
- UX Planet, "I tried to make Claude Code stop producing AI slop": https://uxplanet.org/i-tried-to-make-claude-code-stop-producing-ai-slop-fa594f6b5981
- Noqta, "AI design slop: overused UI patterns": https://noqta.tn/en/blog/ai-design-slop-overused-ui-patterns-fix-2026
- Venngage, "AI slop in design": https://venngage.com/blog/ai-slop-in-design/
- Anti AI slop ban list: https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list
- Chrome, modern web typography guidance: https://developer.chrome.com/docs/modern-web-guidance/guides/visual-design/typography
- UXPin, optimal line length: https://www.uxpin.com/studio/blog/optimal-line-length-for-readability/
- Oregon State, line width for accessibility: https://blogs.oregonstate.edu/calverta/line-width-in-digital-typography-for-accessibility-and-comprehension/
- Designer Daily, typography for long-form reading: https://www.designer-daily.com/typography-for-long-form-reading-designing-pages-people-actually-finish-213373
- LogRocket, dark mode UI best practices: https://blog.logrocket.com/ux-design/dark-mode-ui-design-best-practices-and-examples/
- Toptal, dark UI design: https://www.toptal.com/designers/ui/dark-ui-design
- UXcel, 12 principles of dark mode design: https://uxcel.com/blog/12-principles-of-dark-mode-design-627
- UX Planet, 8 tips for dark theme design: https://uxplanet.org/8-tips-for-dark-theme-design-8dfc2f8f7ab6
- Dwell, "Sacred Space: an exploration in modern Bible design": https://www.dwell.com/article/sacred-space-an-exploration-in-modern-bible-design-01720d47
- NeuBible (App Store): https://apps.apple.com/us/app/neubible/id961857426
- W3C, What's new in WCAG 2.2: https://w3.org/WAI/standards-guidelines/wcag/new-in-22/
- Deque, WCAG 2.2 target size: https://dequeuniversity.com/resources/wcag-2.2
- web.dev, colour themes with Baseline CSS: https://web.dev/articles/baseline-in-action-color-theme
- Flavio Copes, oklch() and color-mix(): https://flaviocopes.com/css-oklch-color-mix/
- LogRocket, OKLCH palettes: https://blog.logrocket.com/oklch-css-consistent-accessible-color-palettes
- V&A, reimagining Explore the Collections: https://www.vam.ac.uk/blog/digital/reimagining-the-vas-explore-the-collections-designing-a-more-inspiring-way-in
- Sanctuary Computer, Brooklyn Museum: https://sanctuary.computer/work/brooklyn-museum
- DesignRush, the Met: https://www.designrush.com/best-designs/websites/the-metropolitan-museum-of-art-website-design
- Numiko, best museum and gallery websites 2026: https://numiko.com/insights/best-museum-and-gallery-websites-2026
- Fiveable, interactive timelines: https://library.fiveable.me/digital-art-history-and-cultural-heritage/unit-7/interactive-timelines/study-guide/2pjLf4vjBYBvxB7k
- Shorthand, visual timeline examples: https://shorthand.com/the-craft/best-visual-timeline-examples-on-the-web/

[Creative Bloq]: https://www.creativebloq.com/ai/everything-looks-the-same-now-what
[DEV]: https://dev.to/alanwest/how-to-fix-the-ai-generated-look-in-your-frontend-1ahh
[Impeccable]: https://www.mintlify.com/pbakaus/impeccable/concepts/anti-patterns
[UX Planet]: https://uxplanet.org/i-tried-to-make-claude-code-stop-producing-ai-slop-fa594f6b5981
[Noqta]: https://noqta.tn/en/blog/ai-design-slop-overused-ui-patterns-fix-2026
[Venngage]: https://venngage.com/blog/ai-slop-in-design/
[UXPin]: https://www.uxpin.com/studio/blog/optimal-line-length-for-readability/
[Oregon State]: https://blogs.oregonstate.edu/calverta/line-width-in-digital-typography-for-accessibility-and-comprehension/
[Designer Daily]: https://www.designer-daily.com/typography-for-long-form-reading-designing-pages-people-actually-finish-213373
[Chrome typography guide]: https://developer.chrome.com/docs/modern-web-guidance/guides/visual-design/typography
[LogRocket]: https://blog.logrocket.com/ux-design/dark-mode-ui-design-best-practices-and-examples/
[Toptal]: https://www.toptal.com/designers/ui/dark-ui-design
[UXcel]: https://uxcel.com/blog/12-principles-of-dark-mode-design-627
[Dwell]: https://www.dwell.com/article/sacred-space-an-exploration-in-modern-bible-design-01720d47
[App Store listings]: https://apps.apple.com/us/app/neubible/id961857426
[W3C]: https://w3.org/WAI/standards-guidelines/wcag/new-in-22/
[Deque]: https://dequeuniversity.com/resources/wcag-2.2
[WCAG 2.2]: https://w3.org/WAI/standards-guidelines/wcag/new-in-22/
[web.dev]: https://web.dev/articles/baseline-in-action-color-theme
[Flavio Copes]: https://flaviocopes.com/css-oklch-color-mix/
[V&A]: https://www.vam.ac.uk/blog/digital/reimagining-the-vas-explore-the-collections-designing-a-more-inspiring-way-in
[Brooklyn]: https://sanctuary.computer/work/brooklyn-museum
[DesignRush]: https://www.designrush.com/best-designs/websites/the-metropolitan-museum-of-art-website-design
[Numiko]: https://numiko.com/insights/best-museum-and-gallery-websites-2026
[Fiveable]: https://library.fiveable.me/digital-art-history-and-cultural-heritage/unit-7/interactive-timelines/study-guide/2pjLf4vjBYBvxB7k
[Shorthand]: https://shorthand.com/the-craft/best-visual-timeline-examples-on-the-web/
[MS Research]: https://www.microsoft.com/en-us/research/wp-json/wp/v2/msr-research-item/305816
[VectorLab anti-slop]: #24-banned-patterns-the-slop-list
