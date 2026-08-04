'use client'

import { useEffect, useRef, useState } from 'react'
import { loadReadme } from '@/lib/github'
import { formatMonth, formatRelative, languageHue } from '@/lib/format'
import type { Project } from '@/lib/types'
import { CloseIcon, GitHubIcon, LinkIcon } from './Icons'

/**
 * GitHub already sanitises the HTML it renders, but this runs it through the
 * browser's parser once more and drops anything executable before it is
 * inserted. Cheap, and it means a compromised upstream response cannot run.
 *
 * Images are also defused: readmes embed badges and screenshots hosted on
 * githubusercontent.com, and loading those automatically would contact a third
 * party the visitor never asked about. The URL is parked in `data-src` and only
 * becomes a real request when the visitor asks for it.
 */
function sanitise(html: string, repo: string): { withImages: string; withoutImages: string; images: number } {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('script, style, iframe, object, embed, form, link, meta').forEach((el) =>
    el.remove(),
  )
  // GitHub injects a permalink anchor into every heading; it renders as a
  // stray link glyph outside of GitHub's own stylesheet.
  doc.querySelectorAll('a.anchor, svg.octicon-link').forEach((el) => el.remove())

  // Readmes reference sibling files by relative path. GitHub leaves those
  // alone, so they would resolve against this domain and 404.
  const RAW = `https://raw.githubusercontent.com/arn-c0de/${repo}/HEAD/`
  const BLOB = `https://github.com/arn-c0de/${repo}/blob/HEAD/`
  const isAbsolute = (url: string) => /^(https?:|data:|mailto:|#)/i.test(url)

  doc.querySelectorAll('*').forEach((el) => {
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase()
      if (name.startsWith('on')) el.removeAttribute(attr.name)
      if ((name === 'href' || name === 'src') && attr.value.trim().toLowerCase().startsWith('javascript:')) {
        el.removeAttribute(attr.name)
      }
    }
    if (el.tagName === 'A') {
      const href = el.getAttribute('href')
      if (href && !isAbsolute(href)) el.setAttribute('href', BLOB + href.replace(/^\.?\//, ''))
      el.setAttribute('target', '_blank')
      el.setAttribute('rel', 'noopener noreferrer')
    }
    if (el.tagName === 'IMG') {
      const src = el.getAttribute('src')
      if (src && !isAbsolute(src)) el.setAttribute('src', RAW + src.replace(/^\.?\//, ''))
      el.removeAttribute('srcset')
      el.setAttribute('loading', 'lazy')
    }
  })

  const images = doc.querySelectorAll('img')
  const withImages = doc.body.innerHTML

  // Second pass: park every image URL so nothing is requested until asked for.
  images.forEach((img) => {
    img.setAttribute('data-src', img.getAttribute('src') ?? '')
    img.removeAttribute('src')
  })

  return { withImages, withoutImages: doc.body.innerHTML, images: images.length }
}

export default function ProjectPanel({
  project,
  onClose,
}: {
  project: Project
  onClose: () => void
}) {
  const [readme, setReadme] = useState<{ withImages: string; withoutImages: string; images: number } | null>(null)
  const [readmeState, setReadmeState] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [imagesShown, setImagesShown] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    setReadmeState('loading')
    setReadme(null)
    setImagesShown(false)
    loadReadme(project.name, controller.signal).then((html) => {
      if (controller.signal.aborted) return
      if (html) {
        setReadme(sanitise(html, project.name))
        setReadmeState('ready')
      } else {
        setReadmeState('missing')
      }
    })
    return () => controller.abort()
  }, [project.name])

  // Escape closes; focus moves into the panel so keyboard users land here.
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  const links = [
    { label: 'Repository', href: project.html_url, icon: <GitHubIcon size={14} /> },
    ...(project.homepage
      ? [{ label: 'Homepage', href: project.homepage, icon: <LinkIcon /> }]
      : []),
    ...project.links.map((l) => ({ ...l, icon: <LinkIcon /> })),
  ]

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside
        className="panel"
        role="dialog"
        aria-modal="true"
        aria-label={`${project.title} details`}
      >
        <header className="panel__head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="panel__title">{project.title}</h2>
            <p className="panel__sub">
              <span className="mono">{project.full_name || `arn-c0de/${project.name}`}</span>
              {' · '}
              {project.category}
            </p>
          </div>
          <button ref={closeRef} type="button" className="iconbtn" onClick={onClose} aria-label="Close panel">
            <CloseIcon />
          </button>
        </header>

        <div className="panel__body">
          {project.description && (
            <p style={{ marginTop: 0, marginBottom: 20, color: 'var(--text-muted)' }}>
              {project.description}
            </p>
          )}

          <section className="panel__section">
            <div className="panel__actions">
              {links.map((link) => (
                <a
                  key={link.href}
                  className={`btn${link.href === project.html_url ? ' btn--primary' : ''}`}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.icon}
                  {link.label}
                </a>
              ))}
            </div>
          </section>

          <section className="panel__section">
            <div className="stats">
              <div className="stat">
                <div className="stat__v">{project.stargazers_count}</div>
                <div className="stat__k">stars</div>
              </div>
              <div className="stat">
                <div className="stat__v">{project.forks_count}</div>
                <div className="stat__k">forks</div>
              </div>
              <div className="stat">
                <div className="stat__v" style={{ fontSize: 14 }}>
                  {formatMonth(project.created_at)}
                </div>
                <div className="stat__k">created</div>
              </div>
              <div className="stat">
                <div className="stat__v" style={{ fontSize: 14 }}>
                  {formatRelative(project.pushed_at)}
                </div>
                <div className="stat__k">last push</div>
              </div>
            </div>
          </section>

          <section className="panel__section">
            <p className="panel__label">Details</p>
            <dl className="deflist">
              {project.language && (
                <>
                  <dt>Language</dt>
                  <dd>
                    <span
                      className="lang"
                      style={{ '--hue': languageHue(project.language) } as React.CSSProperties}
                    >
                      <span className="lang__dot" />
                      {project.language}
                    </span>
                  </dd>
                </>
              )}
              <dt>License</dt>
              {/* GitHub reports NOASSERTION for licences it cannot identify. */}
              <dd>
                {!project.license || project.license === 'NOASSERTION'
                  ? 'see repository'
                  : project.license}
              </dd>
              {project.topics.length > 0 && (
                <>
                  <dt>Topics</dt>
                  <dd>
                    <span className="tagrow">
                      {project.topics.map((t) => (
                        <span key={t} className="tag">
                          {t}
                        </span>
                      ))}
                    </span>
                  </dd>
                </>
              )}
            </dl>
          </section>

          <section className="panel__section">
            <p className="panel__label">Readme</p>
            {readmeState === 'loading' && (
              <div className="skeleton" style={{ height: 160 }} aria-label="Loading readme" />
            )}
            {readmeState === 'missing' && (
              <p style={{ color: 'var(--text-faint)', fontSize: 13.5, margin: 0 }}>
                Readme could not be loaded — open the repository on GitHub instead.
              </p>
            )}
            {readmeState === 'ready' && readme && (
              <>
                {readme.images > 0 && !imagesShown && (
                  <div className="callout" style={{ marginBottom: 14 }}>
                    This readme embeds{' '}
                    <strong>
                      {readme.images} image{readme.images === 1 ? '' : 's'}
                    </strong>{' '}
                    hosted by GitHub. They stay blocked until you ask for them, so nothing is
                    requested from a third party without your say-so.
                    <div style={{ marginTop: 10 }}>
                      <button type="button" className="btn" onClick={() => setImagesShown(true)}>
                        Load images
                      </button>
                    </div>
                  </div>
                )}
                <div
                  className={`readme${imagesShown ? '' : ' readme--noimg'}`}
                  dangerouslySetInnerHTML={{
                    __html: imagesShown ? readme.withImages : readme.withoutImages,
                  }}
                />
              </>
            )}
          </section>
        </div>
      </aside>
    </>
  )
}
