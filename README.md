# Bing Wallpapers Archive

A multilingual Bing wallpaper archive built with Next.js, TypeScript, and Cloudflare.

Online preview: [https://bing.xc2f.com](https://bing.xc2f.com)

## Overview

This project reads Bing wallpapers from Cloudflare D1 and presents them in three browsing modes:

- Archive list
- Wallpaper detail
- Waterfall gallery

It supports locale-aware routing, local image proxying, advanced search, and Cloudflare deployment via OpenNext.

## Features

- List, detail, and waterfall views
- Year and month filtering
- Locale-aware UI routing
- Dynamic detail-page ambient background based on wallpaper tones
- Local Bing image proxy to avoid direct hotlink failures
- Cloudflare D1-backed archive reads with local JSON fallback

## Advanced Search

Supported patterns:

- `bird fish`  
  Match the full phrase.
- `bird, fish`  
  Match any comma-separated clause.
- `lake -night`  
  Exclude results containing `night`.
- `title:bird`
- `desc:turtle`
- `copyright:spain`
- `date:2024`
- `ssd:20241229`

Press `?` in the search box to open the built-in search help panel.

## Internationalization

Supported locales:

- `en`
- `zh`
- `es`
- `fr`
- `de`
- `ja`
- `ko`

The default locale is `en`, and the app remembers the user’s selected language.

## Image Proxy

Bing images are served through [`app/api/image/route.ts`](./app/api/image/route.ts), which adds Bing-compatible request headers and avoids direct-image `400` failures.

Related helpers live in [`lib/archive.ts`](./lib/archive.ts).

`next/image` is configured in unoptimized mode so deployed environments can request proxied image URLs directly instead of relying on `/_next/image`.

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- OpenNext Cloudflare

## Project Structure

- [`app/[locale]/page.tsx`](./app/[locale]/page.tsx)  
  Archive list page
- [`app/[locale]/wallpaper/[ssd]/page.tsx`](./app/[locale]/wallpaper/[ssd]/page.tsx)  
  Wallpaper detail page
- [`app/[locale]/waterfall/page.tsx`](./app/[locale]/waterfall/page.tsx)  
  Waterfall gallery
- [`app/api/image/route.ts`](./app/api/image/route.ts)  
  Bing image proxy
- [`bin/sync-db.ts`](./bin/sync-db.ts)  
  Legacy JSON sync fallback utility

## Local Development

Install dependencies:

```bash
npm install
```

Create `.env`:

```bash
BASE_URL=https://www.bing.com
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## External DB Repository

The site now reads wallpaper records from Cloudflare D1 using the `BING_WALLPAPERS_DB` binding. When the binding is unavailable, it falls back to the checked-in [`db/media_contents.json`](./db/media_contents.json) file so local work can still start cleanly.

The companion repository at `/Users/fen/workspace/bing-wallpapers-db` can keep refreshing the source data and push it into the same D1 database on a schedule.

### D1 binding

Bind the D1 database as `BING_WALLPAPERS_DB` in the deployed worker.

If you use Wrangler config, add a `d1_databases` entry similar to:

```bash
{
  "binding": "BING_WALLPAPERS_DB",
  "database_name": "<your-d1-database-name>",
  "database_id": "<your-d1-database-id>"
}
```

The table schema expected by this app is:

```bash
CREATE TABLE IF NOT EXISTS media_contents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  raw_data TEXT,
  ssd TEXT UNIQUE
);
```

## Deploys

Code updates in this repository deploy automatically through [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml).

Because the app reads wallpaper data from D1 at request time, D1 data updates do not need to trigger a rebuild or redeploy. Once the database is updated, subsequent requests will read the latest rows directly.

Recommended split:

- DB repository owns `db/media_contents.json`
- This repository only consumes them during build
- DB repository push -> trigger main repository workflow -> main repository deploys the worker with the latest DB data

## Scripts

- `npm run dev`  
  Start local development
- `npm run build`  
  Production build without DB sync
- `npm run start`  
  Start the production server
- `npm run preview`  
  Sync DB and preview Cloudflare build locally
- `npm run deploy`  
  Sync DB and deploy with OpenNext Cloudflare

## Deployment

This project is deployed as a Cloudflare Worker via OpenNext and GitHub Actions.

Typical flow:

```bash
npm run deploy
```

## Disclaimer

Images are sourced from Microsoft Bing and are used for display purposes only.

All copyrights belong to their respective owners.

This project does not store or redistribute any images.

If there is any infringement, please contact for removal.

## Screenshots

![Archive list](./public/images/bing-xc2f.webp)

![Wallpaper detail](./public/images/bing-xc2f-wallpaper.webp)

![Waterfall view - image only](./public/images/bing-xc2f-waterfall-image.webp)

![Waterfall view - with metadata](./public/images/bing-xc2f-waterfall-meta.webp)
