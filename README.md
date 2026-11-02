# The Daily Stoic — reader PWA

A reading web app for daily Stoic passages and classic self-improvement notes, built as an
installable **PWA** and deployed automatically to **GitHub Pages**.

> ⚠️ **Content note:** the book text in this repository is personal study material and is not
> intended for redistribution. See [Notes](#notes).

## Stack

| Layer | Choice |
| --- | --- |
| UI | React 19 + Vite |
| Styling | Tailwind CSS 4 |
| PWA | `vite-plugin-pwa` (installable, offline cache) |
| Deploy | GitHub Actions → GitHub Pages |
| Content pipeline | Python scripts in `scripts/` build the JSON from text sources |

## Features

- Daily entries with a persistent reading position (`useReadingProgress`)
- Book shelf / menu drawer, per-book metadata
- Markdown rendering for long-form text
- Works offline after first load
- Auto-deploy on push to `main`

## Run locally

```bash
cd webapp
npm ci
npm run dev      # http://localhost:5173
npm run build    # production build -> webapp/dist
npm run lint
```

Live site: https://korawitp.github.io/daily-stoic/

## Layout

```
webapp/            React app (src/components: ReaderView, BookShelfModal, MenuDrawer, Header)
webapp/src/data/   generated JSON content
scripts/           Python builders for the content JSON
data/              source text and metadata
.github/workflows/ deploy.yml (build -> upload-pages-artifact -> deploy-pages)
```

## Notes

- This is a personal reading project; the text sources are included for private study only.
- Do not reuse the book content commercially.

## License

Code is MIT — see [LICENSE](LICENSE). Book texts are **not** covered by this license.
