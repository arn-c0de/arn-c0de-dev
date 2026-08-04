# arn-c0de-dev

Project console for [github.com/arn-c0de](https://github.com/arn-c0de) — a single-page app with
tabs for projects, stack, about and secure contact.
Live at **https://arn-c0de.github.io/arn-c0de-dev/**. Repository data comes from the GitHub API at
runtime; a committed snapshot keeps the site working when the API is rate-limited or unreachable.

## Stack

Next.js 15 with the App Router, statically exported (`output: 'export'`) to plain files. No CSS
framework, no icon package, no analytics. Fonts are bundled from `@fontsource`, so the only
outbound request a visitor's browser makes is to `api.github.com`.

## Changing what the site shows

Everything editorial lives in **`projects.config.ts`**. Commit a change there and the deploy
workflow publishes it.

```ts
featured: ['Crawllama', 'GPG-Meister', …]   // shown first, in this exact order
hidden: ['arn-c0de']                        // never appears
showForks: false                            // forks are hidden unless true
showAllByDefault: false                     // false → rest sits behind "show all"
```

Per-repo text is overridden by name — useful when a GitHub description reads poorly or is missing:

```ts
overrides: {
  'ESP-SATDUMP': {
    title: 'SatDump',                       // replaces the repo name
    description: 'ESP32 satellite …',       // replaces the GitHub blurb
    category: 'Embedded',                   // skips category inference
    topics: ['esp32', 'sdr'],               // replaces the topic list
    links: [{ label: 'Docs', href: '…' }],  // extra buttons in the detail panel
    hidden: true,                           // same as listing it in `hidden`
  },
}
```

Categories are inferred from topics and language via the `categories` array — first match wins,
`fallbackCategory` catches the rest. The Stack tab needs no maintenance at all: it counts
languages, domains and topics from whatever the API returns.

### Refreshing the offline snapshot

`data/repos.json` is the fallback shown when the API is unavailable. Regenerate it whenever the
repositories change meaningfully:

```bash
curl -s "https://api.github.com/users/arn-c0de/repos?per_page=100&sort=updated" \
  | jq '[.[] | {name, full_name, description, html_url, homepage, language,
                stargazers_count, forks_count, topics, fork, archived,
                pushed_at, created_at, license: .license.spdx_id}]' \
  > data/repos.json
```

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck
npm run build      # static output in out/
npm run preview    # build without the sub-path and serve it at localhost root
```

The service worker is skipped over plain HTTP, so `npm run dev` never serves stale cached assets.

### The base path

This is a *project* repo, so Pages serves it from `/arn-c0de-dev/` rather than a domain root.
`next.config.mjs` sets `basePath` accordingly, and `lib/basePath.ts` exposes `asset()` for the
handful of raw URL strings Next does not rewrite itself (manifest, icons, service worker, the
`.asc` download). Change it in one place when the hosting changes:

```bash
PAGES_BASE_PATH=""             # custom domain, or the arn-c0de.github.io user-site repo
PAGES_BASE_PATH="/other-name"  # a differently named project repo
```

Add a `public/CNAME` file containing the hostname if you point a custom domain here, and set
`PAGES_BASE_PATH=""` in the workflow at the same time.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`: typecheck → build → publish `out/` to
GitHub Pages.

**Settings → Pages → Source must stay on "GitHub Actions".** If it is ever switched to "Deploy
from a branch", GitHub's legacy Jekyll builder takes over, publishes the repository root instead
of the exported `out/` directory, and the site turns into a rendered copy of this README. That is
the failure mode to recognise: a page titled `arn-c0de-dev` showing this text. Fixing it means
setting the source back to GitHub Actions and re-running the workflow — the API equivalent is:

```bash
gh api -X DELETE repos/arn-c0de/arn-c0de-dev/pages
gh api -X POST   repos/arn-c0de/arn-c0de-dev/pages -f build_type=workflow
gh workflow run deploy.yml --ref main
```

The repository must be public for Pages to publish on a free account.

## Contact and keys

`public/arn-c0de.asc` is the PGP public key rendered on the contact tab. Its fingerprint is
`93A7 8377 0EEA FFA4 3B24  22F1 A0F9 A2E7 0D64 2ADC`. If the key is ever rotated, replace that
file and update the matching constants in `components/ContactPane.tsx` and `lib/pgpKey.ts`.

## Privacy

No cookies, no tracking, no analytics, no external fonts. The only automatic outbound request is
to `api.github.com`; opening a project additionally fetches that repository's readme.

Readme HTML is passed through a sanitising step in `components/ProjectPanel.tsx` that strips
scripts, event handlers and `javascript:` URLs, rewrites relative paths to `raw.githubusercontent`,
and **parks every image URL in `data-src`** so badges and screenshots hosted by GitHub are only
requested after the visitor presses *Load images*. The expandable privacy note in the footer
states all of this to the visitor.
