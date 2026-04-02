# Bing Wallpapers Archive

A multilingual Bing wallpaper archive built with Next.js, TypeScript, and an external DB repository.

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
- Build-time JSON sync from external DB repository

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
  Build-time external DB sync

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

If you want to move [`db/`](./db/) into a separate repository, this project now supports pulling the data at build time.

Set these environment variables in GitHub Actions or your deployment environment:

```bash
DB_SYNC_ENABLED=true
DB_SYNC_JSON_URL=https://api.github.com/repos/<owner>/<db-repo>/contents/db/media_contents.json?ref=<branch>
```

If the DB repository is private, also set:

```bash
DB_SYNC_BEARER_TOKEN=<token>
```

Notes:

- `DB_SYNC_JSON_URL` is required because the site reads [`db/media_contents.json`](./db/media_contents.json) directly at build/runtime.
- For GitHub private repositories, prefer the GitHub Contents API URLs above instead of `raw.githubusercontent.com`; they work more reliably with `Bearer` tokens.
- `npm run dev`, `npm run preview`, and `npm run deploy` all sync the DB before starting.

### Migration steps

1. Create a dedicated DB repository and keep these files there:

```text
db/media_contents.json
```

2. In this repository, stop tracking the old DB artifacts:

```bash
git rm --cached db/media_contents.json
git commit -m "Stop tracking local DB artifacts"
```

3. In the main repository GitHub Actions settings, add:

```bash
DB_SYNC_ENABLED=true
DB_SYNC_JSON_URL=https://api.github.com/repos/<owner>/<db-repo>/contents/db/media_contents.json?ref=<branch>
```

4. If the DB repository is private, also add:

```bash
DB_SYNC_BEARER_TOKEN=<token>
```

5. Trigger one deploy to verify the remote DB can be downloaded before deleting local copies anywhere else.

## Trigger Deploy From DB Updates

The DB repository should trigger the main repository's deploy workflow through the GitHub Actions API.

Store a fine-grained GitHub token in the DB repository as:

```bash
TARGET_REPO_WORKFLOW_TOKEN=<token>
```

The token should be allowed to dispatch workflows in the main repository.

Example workflow in the DB repository:

```yaml
name: Notify site deploy

on:
  push:
    branches:
      - main
    paths:
      - "db/**"
  workflow_dispatch:

jobs:
  trigger-deploy-workflow:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger target repository workflow
        run: |
          curl --fail --request POST \
            --url "https://api.github.com/repos/<owner>/<site-repo>/actions/workflows/deploy-on-db-update.yml/dispatches" \
            --header "Accept: application/vnd.github+json" \
            --header "Authorization: Bearer ${TARGET_REPO_WORKFLOW_TOKEN}" \
            --header "X-GitHub-Api-Version: 2022-11-28" \
            --data @- <<JSON
          {
            "ref": "main",
            "inputs": {
              "source_repo": "${GITHUB_REPOSITORY}",
              "source_sha": "${GITHUB_SHA}"
            }
          }
          JSON
        env:
          TARGET_REPO_WORKFLOW_TOKEN: ${{ secrets.TARGET_REPO_WORKFLOW_TOKEN }}
```

Suggested DB repository layout:

```text
.
├── .github/
│   └── workflows/
│       └── notify-pages.yml
└── db/
    └── media_contents.json
```

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
