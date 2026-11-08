# Spec: Faithway Bible Baptist Church Website

> Status: **DRAFT — awaiting approval**
> Owner: church web volunteer · Last updated: 2026-11-08

## Objective

Build an elegant, single-scroll static website for **Palawan Faithway Bible Baptist Church, Inc.** (est. 2013, *"Passion for God. Compassion to People."*), hosted on GitHub Pages.

**Who it's for**
- **Members & visitors**: see the latest church updates, open event details and invitations, and read the covenant, mission and vision.
- **Supporters of missions**: browse the missionaries the church supports on an interactive world map and read their prayer letters.
- **The site maintainer** (one volunteer, not necessarily a developer): adds events, missionaries and letters by dropping in a Markdown file and an image. No code changes needed.

**User stories**
1. As a visitor, I scroll one long home page with a hero, latest updates, invitations, mission/vision, covenant, a missions preview and service info/contact.
2. As a visitor, I click an update card (cantata, anniversary, camp, family event, saturation, extension class, …) and get a details page with the date, place, description, photos and invitation image (if there is one).
3. As a visitor, I open the Missions Board: a world map with a scrollable wall of missionary photos beside it. When I hover over a photo, it grows and an animated **bow line** (a curved arc in one bright accent colour) draws from the photo to the missionary's field on the map, and that country lights up.
4. As a visitor, I click a missionary photo and get their page: name, photo, field (country/city), short bio and a list of their mission letters, which I can read on the page (text, image scans or PDF).
5. As the maintainer, I add a new event or missionary by creating one Markdown file plus images. When I push to GitHub, the site rebuilds and deploys automatically.

## Capability Map

The site has four parts that can each be tested on their own, and they all share one page shell.

| Module id | Responsibility | Depends on |
|---|---|---|
| `site-shell` | Layout, header/nav, footer, design tokens, fonts, scroll animations, home page frame, build + deploy pipeline | — |
| `about` | Mission/vision, church covenant, service times & contact sections | `site-shell` |
| `events` | Event content model, "Latest Updates" section, category filter, event detail pages, invitations | `site-shell` |
| `missions` | Missionary + letter content model, build-time world map, missions board with hover/rainbow-line interaction, missionary detail pages, letter reader | `site-shell` |

**Build order:** `site-shell` → `about`, `events` → `missions`

The map lives in this one file (the site is small). Each module's requirements are below.

## Assumptions (correct any of these)

1. **Eleventy (11ty) static site generator.** Content lives in Markdown/YAML, and the build outputs plain HTML/CSS/JS. There's no backend, database or CMS.
2. **GitHub Pages via GitHub Actions.** The site is served at `https://<user>.github.io/<repo>/` until a custom domain is added, so all URLs must respect a path prefix.
3. **English only** for now. Tagalog can be added later.
4. **Modern browsers only** (last 2 versions of Chrome, Edge, Safari and Firefox, plus mobile Safari/Chrome).
5. **No forms or user accounts.** Contact is through links (Facebook page, email, phone, Google Maps).
6. **Missionary info is public.** The user confirmed this: name, field, photo and letters.
7. **Mission letters** can be Markdown text, image scans (JPG/PNG) or PDF. The page renders text and images inline and embeds PDFs, with a download link as a fallback.
8. **Maintainer edits files directly in the repo** (VS Code or GitHub web editor). A visual CMS is out of scope for v1.

## Design Direction

- **Feel:** elegant, calm and reverent. There's lots of whitespace, a few large photos, and soft fade/slide-in animations as sections scroll into view. Nothing should look flashy or template-like.
- **Palette** (from the user's swatch, sampled exactly):

  | Token | Hex | Use |
  |---|---|---|
  | `--c-deep` | `#086288` | Primary: headings, nav, buttons, footer background |
  | `--c-mid` | `#4D8DBA` | Accents, borders, map land highlight, large text only (fails AA for small text on white) |
  | `--c-sky` | `#97D7FF` | Soft backgrounds, hover states, map water tint |
  | `--c-cream` | `#FFEFC4` | Warm section backgrounds, cards, letter paper |
  | `--c-ink` | `#13293D` | Body text (derived from the palette for contrast) |
  | `--c-paper` | `#FFFCF5` | Page background |

  | `--home` | `#F3C463` | The Philippines on the missions map (home field highlight) |
  | `--bow` | `#FFA81E` | The missions-board hover arc only: one bright warm accent against the blue map |
- **Type:** an elegant serif for display (Cormorant Garamond) and a clean geometric sans for body and UI (Montserrat, which matches the logo's "FAITHWAY" lettering). Both come from Google Fonts with `font-display: swap`.
- **Logo:** `assets/brand/logo-full.jpg`, as provided. A transparent PNG/SVG version would look better on coloured backgrounds; see Open Questions.

## Requirements by Module

### `site-shell`
- Sticky, minimal header with the logo mark and nav links that jump to home sections (Updates, About, Missions, Visit). It collapses to a menu button below 768px.
- Hero: church name, tagline, est. 2013, a background photo with a deep-blue overlay, and a "See latest updates" scroll cue.
- Each section fades in on scroll with `IntersectionObserver`. Everything is fully visible right away when `prefers-reduced-motion` is set or JS is off.
- Footer: address, service times, social links, © year.
- Design tokens live only in `src/assets/css/tokens.css`. No hex colours anywhere else.
- A GitHub Actions workflow builds and deploys to Pages on every push to `main`.

### `about`
- Mission and vision on the home page.
- **Church covenant**: full text, styled like a printed document (serif type on cream "paper"), shown on the home page or on its own `/covenant/` page (Open Question 3).
- Content comes from `src/content/about/*.md`, so the text is editable without touching templates.

### `events`
- Front matter for each event:
  ```yaml
  title: "Christmas Cantata 2026"
  date: 2026-12-20          # event date (required)
  endDate: 2026-12-20       # optional
  category: cantata         # cantata | anniversary | camp | family | saturation | extension-class | other
  location: "FBBC Main Sanctuary, Puerto Princesa"
  cover: ./cover.jpg        # required, in the event's folder
  invitation: ./invite.jpg  # optional, shown prominently + downloadable
  summary: "One-sentence teaser for the card."
  gallery: [./1.jpg, ./2.jpg]   # optional
  ```
- **Latest Updates** on the home page shows the 6 most recent events (upcoming first, then the latest past ones) as image cards, with a "View all" link to `/events/`.
- `/events/` lists every event. Category filter chips work without a page reload, and the list still works with JS off.
- The event detail page has the cover image, date, location, Markdown body, invitation (if any) and a gallery lightbox.
- **Invitations:** any upcoming event with an `invitation` image also appears in an "You're Invited" strip on the home page.

### `missions`
- Front matter for each missionary (`src/content/missionaries/<slug>/index.md`):
  ```yaml
  name: "Rev. & Mrs. Juan Dela Cruz"
  photo: ./photo.jpg        # required
  country: PH               # ISO 3166-1 alpha-2 (required)
  place: "Mindanao"         # optional label
  coords: [7.07, 125.61]    # optional [lat, lng]; otherwise the country centroid is used
  since: 2018               # optional
  ```
  Letters live in `src/content/missionaries/<slug>/letters/*.md`, each with `title`, `date` and an optional `file` (PDF/image). The body is the letter text.
- **World map:** an SVG generated **at build time** from Natural Earth data (`world-atlas` 50m + `d3-geo`), so the browser downloads no map library. Countries that have missionaries get a subtle tint, and every missionary gets a small marker at their point.
  - **Pacific-centered:** the projection is rotated to 146°E (`geoNaturalEarth1().rotate([-146, 0])`), so the Philippines sits near the middle. The map's edge falls in the Atlantic at 34°W, so every continent stays whole except a sliver of Greenland. Centering exactly on 122°E would cut South America in two.
  - **Home highlight:** the Philippines is filled with `--home` (soft gold) and outlined in deep blue, and Palawan has a pulsing "home church" marker. The legend labels it "Philippines · Faithway, Palawan".
- **Missions board layout (wide screens):** the map sits in the center of the board, framed by circular missionary photos: full rows above it, columns on both sides, and extra rows below. Search and a region filter sit above the board. It has to work smoothly with **300+ missionaries**: lazy-loaded WebP thumbnails, and no layout jank.
- **Symmetric photo placement, for any number of missionaries:**
  - The side columns fill in mirrored left/right pairs, hugging the map.
  - Only complete rows go above the map.
  - Rows below the map are full except the last, which is exactly centered. The grid uses half-width sub-columns so odd counts can center too.
  - Placement is recomputed on resize and whenever search or filters change.
- **Hover interaction (pointer devices):**
  - The photo scales up to about 1.45× with a ring and shadow. The other photos dim slightly.
  - An SVG overlay draws an animated curved bow line (quadratic Bézier, about 600ms) in `--bow` from the photo's edge to the missionary's map point.
  - The destination country highlights and its marker pulses. A small label shows the name and field.
  - Keyboard focus does exactly the same thing, so the board works without a mouse.
  - Reduced motion shows the line right away, with no draw animation.
- **Touch / small screens (<1024px):** the map sits on top and the photo grid scrolls below it. A first tap highlights the missionary and draws the line, then a "View profile" button appears. A second tap or the button opens the page.
- **Missionary detail page:** large photo, name, field with a small locator map, bio, and letters newest first. Each letter opens in an elegant reader: cream paper, serif type, prev/next navigation, and an inline image or embedded PDF with a download link.
- The home page gets a Missions preview: a mini map, a count ("Supporting N missionaries in M countries"), and a link to the full board.

## Tech Stack

| Concern | Choice |
|---|---|
| Generator | Eleventy 3.x (ESM config) |
| Templates | Nunjucks |
| Styles | Plain modern CSS (custom properties, grid, `clamp()`), no framework |
| JS | Vanilla ES modules, no framework; small enhancements only |
| Images | `@11ty/eleventy-img` → responsive WebP/JPEG |
| Map | `d3-geo` + `topojson-client` + `world-atlas`, **build-time only** |
| Country lookup | `i18n-iso-countries` (alpha-2 → numeric id + name) |
| Tests | Playwright (e2e/visual behaviour), a content-schema validator script, `html-validate`, `@axe-core/playwright` |
| Hosting | GitHub Pages via `actions/deploy-pages` |
| Runtime | Node 24 (installed locally) |

## Commands

```
Install:        npm ci
Dev server:     npm run dev            # eleventy --serve, http://localhost:8080
Build:          npm run build          # eleventy → _site/
Validate data:  npm run check:content  # schema-checks every event/missionary/letter
Lint HTML:      npm run lint:html      # html-validate on _site/
Test:           npm test               # build + Playwright e2e + axe a11y checks
Preview build:  npm run preview        # serve _site/ with the GitHub Pages path prefix
```

## Project Structure

```
.github/workflows/deploy.yml   → build + test + deploy to Pages
assets/brand/                  → original brand files (logo, palette) — source only
src/
  _data/site.json              → church name, address, service times, socials
  _includes/layouts/           → base.njk, page.njk, event.njk, missionary.njk, letter.njk
  _includes/partials/          → header, footer, cards, map, photo-wall
  assets/css/                  → tokens.css, base.css, sections/*.css
  assets/js/                   → reveal.js, nav.js, events-filter.js, missions-board.js, lightbox.js
  content/
    about/                     → mission.md, vision.md, covenant.md
    events/<yyyy-mm-slug>/     → index.md + images
    missionaries/<slug>/       → index.md, photo.jpg, letters/*.md (+ pdf/jpg)
  index.njk                    → the single-scroll home page
  events.njk, missions.njk     → listing pages
lib/                           → build-time helpers (map generation, schema)
scripts/check-content.mjs      → content validator
tests/e2e/                     → Playwright specs
eleventy.config.js
SPEC.md
```

## Code Style

- 2-space indent, ES modules, `const` by default, no semicolon-free style (use semicolons). Prettier defaults.
- CSS: BEM-ish class names (`.mission-board__photo`, `.is-active`), only token variables for colour and spacing, mobile-first media queries.
- JS should progressively enhance the server-rendered HTML. It never builds the main content.
- Content file names: kebab-case. Event folders are prefixed `yyyy-mm-`.

```js
// src/assets/js/missions-board.js
const board = document.querySelector('[data-missions-board]');
if (board) {
  const overlay = board.querySelector('[data-line-overlay]');

  board.addEventListener('pointerover', (event) => {
    const photo = event.target.closest('[data-missionary]');
    if (photo) showConnection(photo, overlay);
  });
  board.addEventListener('focusin', (event) => {
    const photo = event.target.closest('[data-missionary]');
    if (photo) showConnection(photo, overlay);
  });
}
```

## Testing Strategy

| Level | Tool | What it covers |
|---|---|---|
| Content | `scripts/check-content.mjs` | Required fields, valid `category`, valid ISO country, image files exist, dates parse. It runs before every build so a bad content file fails CI with a clear message. |
| Markup | `html-validate` | Valid HTML, no duplicate ids, images have `alt`. |
| E2E | Playwright (Chromium + WebKit, desktop + mobile viewport) | Home sections render in order. An event card opens its detail page. The category filter works. Hovering or focusing a missionary photo draws the line and highlights the right country. For several missionary counts (1, odd, even, one full ring, 300+), photo rows are centered and nothing overlaps the map or another photo. Clicking opens the profile, and a letter opens in the reader. Touch flow on mobile. |
| Accessibility | `@axe-core/playwright` | Zero serious/critical violations on home, event, missions and missionary pages. |
| Performance | Lighthouse (manual before launch) | Targets in Success Criteria. |

The test fixtures are a small set of sample events and missionaries in `tests/fixtures/`. Placeholder content is clearly marked so it's never confused with real data.

## Boundaries

- **Always:** run `npm test` before committing. Keep colours in `tokens.css` only. Give every image meaningful `alt` text (fall back to the missionary's name or event title). Respect `prefers-reduced-motion`. Keep URLs path-prefix-safe for GitHub Pages.
- **Ask first:** adding any npm dependency not listed above, adding third-party scripts (analytics, embeds, chat widgets), changing the content front-matter schema, changing the deploy workflow, adding a custom domain, and publishing real photos/names before the maintainer has supplied them.
- **Never:** publish or commit any missionary marked `hidden` in `MISSION/missionaries.csv`. That means missionaries to RAN/CRAN (restricted or creative-access) nations, China and India: no name, photo, pin, country count or file of theirs in the site, the artifact or the repo. Only `data.mjs` reads the raw list, and it drops hidden rows. `MISSION/` is git-ignored. Also never commit secrets or personal phone numbers or emails that weren't provided for publication, invent real-looking missionary names or letters and present them as real (placeholders must be obviously placeholders), load a JS framework or map library in the browser, or delete or skip failing tests to get to green.

## Success Criteria

1. `npm run build` and `npm test` pass locally and in GitHub Actions, and the site is live on GitHub Pages.
2. The home page scrolls through: Hero → Latest Updates → You're Invited → Mission & Vision → Covenant → Missions preview → Visit Us → Footer.
3. Adding a new event folder with `index.md` + `cover.jpg` and pushing makes it appear in Latest Updates with no other changes.
4. Adding a new missionary folder makes them appear on the board with a working hover line to the correct country, plus a profile page.
5. With 300 generated test missionaries, the missions board stays smooth: hover-to-line under 100ms and no long tasks over 200ms in a Chrome performance trace.
6. Lighthouse (mobile) on the home page: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95. LCP < 2.5s, CLS < 0.1.
7. Works at 360px wide with no horizontal scroll, and the whole site is usable with only a keyboard.

## Open Questions

1. **Repo name / URL:** what should the GitHub repo be called (e.g. `fbbc-palawan`)? Will you add a custom domain later?
2. **Logo file:** do you have the logo as a transparent PNG or SVG? The JPG has a white background, which limits where it can go. I can trace a clean SVG of the mark if not.
3. **Covenant placement:** should the full covenant be shown on the home page, or as a short teaser that links to a `/covenant/` page? (I'd go with the teaser because the covenant is long.)
4. **Site details:** address, service schedule, Facebook page and contact email/phone for the footer and Visit Us section.
5. **Missionary grouping:** should the board filter by region (Asia, Africa, …), by sending agency, or just by country?
6. **Real content:** until you send photos and text, I'll use clearly labelled placeholders (gray silhouettes, "Sample Event"). Is that okay?
