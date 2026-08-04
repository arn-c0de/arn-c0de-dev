/**
 * Path prefix the site is served under — "/arn-c0de-dev" on GitHub Pages,
 * empty on a custom domain. Set in next.config.mjs.
 *
 * Next rewrites its own generated URLs using `basePath`, but plain strings in
 * `href`, `src` or metadata are left untouched. Wrap those in `asset()`.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/** `asset('/icon.svg')` → `/arn-c0de-dev/icon.svg` */
export function asset(path: string): string {
  return `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`
}

/** Absolute origin + base path, for sitemap and robots entries. */
export const SITE_URL = `https://arn-c0de.github.io${BASE_PATH}`
