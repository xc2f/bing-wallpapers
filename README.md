# Bing Wallpapers Archive

A multilingual Bing wallpaper archive built with Next.js, TypeScript, and local persistence.

Online preview: [https://bing.xc2f.com](https://bing.xc2f.com)

## Overview

This project archives Bing wallpapers locally and presents them in three browsing modes:

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
- Local persistence with SQLite and JSON

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
- SQLite
- LowDB
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
- [`lib/wallpaper.ts`](./lib/wallpaper.ts)  
  Wallpaper fetching pipeline
- [`lib/db.ts`](./lib/db.ts)  
  SQLite persistence
- [`lib/db_low.ts`](./lib/db_low.ts)  
  JSON persistence

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

## Data Fetching

Fetch the latest wallpapers:

```bash
npm run save
```

This updates local data under [`db/`](./db/).

## Scripts

- `npm run dev`  
  Start local development
- `npm run build`  
  Production build
- `npm run start`  
  Start the production server
- `npm run save`  
  Fetch and persist Bing wallpaper data
- `npm run preview`  
  Preview Cloudflare build locally
- `npm run deploy`  
  Deploy with OpenNext Cloudflare

## Deployment

This project is configured for Cloudflare via OpenNext.

Typical flow:

```bash
npm run build
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
