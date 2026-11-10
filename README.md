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

## Adding events from the website (admin page)

Open **https://thorskii92.github.io/faithway-bbc/admin/**. You can do this from a phone too.

1. **Sign in.** Click **Sign In Using Access Token** and paste your GitHub token. You only need to make one token, the first time:
   1. Go to GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token.
   2. Under **Repository access**, choose *Only select repositories* and pick `faithway-bbc`.
   3. Under **Permissions**, set **Contents** to *Read and write*.
2. **Add the event.** Go to **Events → New Event** and fill in the title, category, date, place and summary.
   - **Upcoming event:** upload the **Invitation poster**. It appears under "You're Invited" and stays there until the day passes.
   - **Past event:** add **Photos**. The first one becomes the cover.
3. **Save.** The website updates about 2 minutes later.

**Volunteers:** add each one under the repo's **Settings → Collaborators**. They accept the invite and make their own token the same way.

**Note:** saves only publish while GitHub Actions can run on your account. If GitHub shows a billing lock, events you save in the editor are stored, but they won't appear on the site until it's fixed. Ask Claude to run `npm run build` and push in the meantime.

## Publishing editor saves (while GitHub Actions is locked)

Saves from the admin page are stored on GitHub but don't publish by themselves while GitHub Actions is blocked. To publish them, open a terminal in this folder and run:

```
npm run publish-site
```

It downloads the latest saves, rebuilds the site, and pushes it. The website updates about 1–2 minutes later. If there's nothing new, it says so and changes nothing.

## Adding an event with photos (by hand)

1. Put the photos in a folder under `Gallery/`, for example `Gallery/Youth Camp 2027/`.
2. Make web-size copies. The first file you name becomes the cover photo, and the rest follow:
   ```
   uv run --with pillow python -I scripts/event-photos.py "Gallery/Youth Camp 2027" prototype/img/events/youth-camp-2027 cover-photo.jpg
   ```
3. In `prototype/index.html`, add an entry to the `EVENTS` list:
   ```js
   { id: 'youth-camp-2027', cat: 'camp', title: 'Youth Camp 2027', date: '2027-04-20',
     place: 'Faithway Bible Baptist Church, Puerto Princesa City',
     photos: 'img/events/youth-camp-2027', count: 12,
     sum: 'One or two sentences about the event.' },
   ```
   - `count` is the number of photos.
   - Use `dateLabel: 'April 2027'` when you only know the month.
   - Categories: `cantata`, `anniversary`, `camp`, `family`, `saturation`, `extension-class` and `building`.
4. Run `npm run build`, then commit and push.

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
