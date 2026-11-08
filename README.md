# Faithway Bible Baptist Church Website

The website of **Palawan Faithway Bible Baptist Church, Inc.**, Purok Matapat, San Jose, Puerto Princesa City.
It's a single-page static site with no server code and no database, hosted free on GitHub Pages.

- **Live site:** https://thorskii92.github.io/faithway-bbc/
- **Plan and decisions:** [SPEC.md](SPEC.md)

## Run it on your computer

### Quickest way

Open `docs/index.html` in your browser (double-click it). Everything works this way, including the missions board and the missionary cards. You don't need to install anything.

### With a local web server (recommended while editing)

This serves the site the way GitHub Pages does.

1. Install [Node.js](https://nodejs.org) 20 or newer, if you don't have it.
2. Open a terminal in this folder and install the tools (first time only):
   ```
   npm install
   ```
3. Start the site:
   ```
   npm start
   ```
4. Open **http://localhost:4173** in your browser. Press `Ctrl + C` in the terminal to stop it.

If port 4173 is busy, `serve` picks another port and prints the address. Use the one it shows.

## How the folders fit together

| Folder | What it holds | On GitHub? |
|---|---|---|
| `prototype/` | **The working copy.** Edit the page here. `index.html` is also the private Claude preview. | No |
| `docs/` | **The live site.** GitHub Pages serves this folder. It's generated, so don't edit it by hand. | Yes |
| `scripts/` | Build scripts for the map, the missionary data, the photos and the live site. | Yes |
| `MISSION/` | The raw missionary cards and the full list (`missionaries.csv`). | **No, private** |
| `Gallery/` | Original church photos. The site uses resized copies in `img/`. | No |
| `assets/brand/` | The logo and color palette. | Yes |

## Making a change

1. Edit `prototype/index.html`. For example, update an event in the `EVENTS` list or change the schedule.
2. Check it locally:
   ```
   npm run preview
   ```
   Then open http://localhost:4174.
3. Build the live copy:
   ```
   npm run build
   ```
4. Publish it:
   ```
   git add -A
   git commit -m "Describe your change"
   git push
   ```
   GitHub Pages updates about a minute later.

## Updating the missionaries

The missionary list comes from `MISSION/missionaries.csv`, one row per card. The photos are cropped from the card images in `MISSION/cards/`, exported from Canva as `1.png`, `2.png` and so on.

1. Add or fix rows in `missionaries.csv`, and export the new card PNGs into `MISSION/cards/`.
2. Rebuild the data and the photos, then the live site:
   ```
   npm run data
   npm run photos
   npm run build
   ```
   `npm run photos` needs [uv](https://docs.astral.sh/uv/) installed.
3. Commit and push as above.

### Privacy: read this before adding missionaries

Missionaries serving in **restricted or creative-access nations** must never appear on the site. That includes cards marked **RAN** or **CRAN**, plus **China** and **India**. Their names, photos, map pins and counts all stay off.

- In `missionaries.csv`, set the `visibility` column to `hidden: <reason>` for each of them.
- `npm run data` drops hidden rows and blanks out their names wherever they're quoted in another card's review note.
- `npm run build` only copies photos of visible missionaries into `docs/`.
- The whole `MISSION/` folder is git-ignored, so the raw cards and the full list never go to GitHub.

Before pushing, search `docs/` for the name of anyone you've hidden. The search should find nothing.

## Other commands

| Command | What it does |
|---|---|
| `npm run map` | Regenerates the world map (`prototype/map.js`), centered on the Pacific with the Philippines near the middle. Only needed if the map design changes. |
| `npm run data` | Rebuilds `prototype/missionaries.js` from `MISSION/missionaries.csv`. |
| `npm run photos` | Crops each visible missionary's photo from their card, and rebuilds the round thumbnails (`thumbs.jpg`). |
| `npm run build` | Generates the live site in `docs/` from `prototype/`. |

## Search engines

While the site is under review, it asks search engines not to list it, using a `noindex` tag and `docs/robots.txt`. Anyone with the link can still open it.

When the church is ready to go public:
- Remove the `noindex` line in `scripts/build-docs.mjs`.
- Delete `docs/robots.txt`.
- Run `npm run build` and push.
