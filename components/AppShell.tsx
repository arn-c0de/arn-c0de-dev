'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { asset } from '@/lib/basePath'
import { loadProjects, snapshotProjects } from '@/lib/github'
import type { DataSource, Project } from '@/lib/types'
import { TABS, useAppState, type Tab } from '@/lib/useAppState'
import AboutPane from './AboutPane'
import ContactPane from './ContactPane'
import OverviewPane from './OverviewPane'
import ProjectPanel from './ProjectPanel'
import ProjectsPane from './ProjectsPane'
import RequestModal from './RequestModal'
import StackPane from './StackPane'
import ThemeToggle from './ThemeToggle'
import TopSearch from './TopSearch'
import { GitHubIcon, MailIcon } from './Icons'

const TAB_LABELS: Record<Tab, string> = {
  overview: 'Overview',
  projects: 'Projects',
  stack: 'Stack',
  about: 'About',
  contact: 'Contact',
}

export default function AppShell() {
  const [{ tab, project: openProject, request, requestFor }, navigate] = useAppState()
  // Start from the committed snapshot so the first paint already has content,
  // then swap in live data when the API answers.
  const [projects, setProjects] = useState<Project[]>(snapshotProjects)
  const [source, setSource] = useState<DataSource>('snapshot')
  const [query, setQuery] = useState('')
  const tabsRef = useRef<HTMLElement>(null)
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null)

  // The active-tab underline is one shared element that glides between tabs,
  // so its position has to be measured from the DOM.
  useLayoutEffect(() => {
    const nav = tabsRef.current
    if (!nav) return
    const measure = () => {
      const active = nav.querySelector<HTMLElement>('[aria-selected="true"]')
      if (!active) return
      setIndicator({ left: active.offsetLeft + 10, width: active.offsetWidth - 20 })
    }
    measure()
    // Font loading and viewport changes both shift tab widths.
    document.fonts?.ready.then(measure)
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [tab, projects.length])

  useEffect(() => {
    const controller = new AbortController()
    loadProjects(controller.signal).then((result) => {
      if (controller.signal.aborted || result.source !== 'live') return
      setProjects(result.projects)
      setSource('live')
    })
    return () => controller.abort()
  }, [])

  // Offline shell. Registered after load so it never competes with first paint.
  useEffect(() => {
    if (!('serviceWorker' in navigator) || location.protocol === 'http:') return
    const register = () =>
      navigator.serviceWorker
        .register(asset('/sw.js'), { scope: asset('/') })
        .catch(() => {})
    if (document.readyState === 'complete') register()
    else {
      window.addEventListener('load', register, { once: true })
      return () => window.removeEventListener('load', register)
    }
  }, [])

  const selected = useMemo(
    () => projects.find((p) => p.name === openProject) ?? null,
    [projects, openProject],
  )

  // The panel is an overlay, so opening one keeps you where you were — the
  // overview gallery and the topbar search both slide it out in place.
  const openDetail = useCallback((name: string) => navigate({ project: name }), [navigate])
  const closeDetail = useCallback(() => navigate({ project: null }), [navigate])

  // From the detail panel: close it, open the request modal over the page and
  // keep the project attached (without adding it twice).
  const startRequest = useCallback(
    (repo?: string) =>
      navigate({
        project: null,
        request: true,
        requestFor: !repo || requestFor.includes(repo) ? requestFor : [...requestFor, repo],
      }),
    [navigate, requestFor],
  )

  const showTopic = useCallback(
    (topic: string) => {
      setQuery(topic)
      navigate({ tab: 'projects', project: null })
    },
    [navigate],
  )

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar__row">
          <button type="button" className="brand" onClick={() => navigate({ tab: 'overview', project: null })}>
            {/* Served from this domain, not from GitHub's avatar CDN. */}
            <img className="brand__mark" src={asset('/avatar.jpg')} alt="" width={26} height={26} />
            arn-c0de
          </button>

          <span className="topbar__spacer" />

          <TopSearch
            projects={projects}
            onNavigate={(t) => navigate({ tab: t, project: null })}
            onOpenProject={openDetail}
            onStartRequest={() => startRequest()}
          />

          <button type="button" className="btn btn--primary btn--sm" onClick={() => startRequest()}>
            <MailIcon />
            Request
          </button>

          <a
            className="iconbtn"
            href="https://github.com/arn-c0de"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub profile"
          >
            <GitHubIcon size={15} />
          </a>

          <ThemeToggle />
        </div>

        <nav className="tabs" role="tablist" aria-label="Sections" ref={tabsRef}>
          {indicator && (
            <span
              className="tabs__indicator"
              aria-hidden
              style={{ width: indicator.width, transform: `translateX(${indicator.left}px)` }}
            />
          )}
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              className="tab"
              role="tab"
              aria-selected={tab === t}
              onClick={() => navigate({ tab: t, project: null })}
            >
              {TAB_LABELS[t]}
              {t === 'projects' && <span className="tab__count">{projects.length}</span>}
            </button>
          ))}
        </nav>
      </header>

      <main className="main">
        {tab === 'overview' && (
          <OverviewPane
            projects={projects}
            onNavigate={(t) => navigate({ tab: t, project: null })}
            onOpenProject={openDetail}
            onStartRequest={() => startRequest()}
          />
        )}
        {tab === 'projects' && (
          <ProjectsPane
            projects={projects}
            query={query}
            onQueryChange={setQuery}
            onOpen={openDetail}
          />
        )}
        {tab === 'stack' && <StackPane projects={projects} onTopicSelect={showTopic} />}
        {tab === 'about' && <AboutPane projects={projects} />}
        {tab === 'contact' && <ContactPane />}
      </main>

      <footer className="footer">
        <div className="footer__row">
          <span>
            <span className={`dot dot--${source}`} />
            {source === 'live' ? 'Live from the GitHub API' : 'Showing committed snapshot'}
          </span>
          <span>No tracking, no cookies, no analytics.</span>
          <span style={{ marginLeft: 'auto' }}>
            <a href="https://github.com/arn-c0de" target="_blank" rel="noopener noreferrer">
              github.com/arn-c0de
            </a>
          </span>
        </div>

        <details className="privacy">
          <summary>Privacy</summary>
          <div className="privacy__body">
            <p>
              This site sets no cookies and runs no analytics or tracking of any kind. Fonts,
              icons and styles are served from this domain — there is no CDN and no third-party
              script. The only things kept in your browser are your chosen colour theme and an
              offline copy of the page assets, both of which clearing site data removes.
            </p>
            <p>
              The one request made automatically is to <span className="mono">api.github.com</span>{' '}
              to read the public repository list. Opening a project additionally requests that
              repository&apos;s readme. Images embedded in readmes are hosted by GitHub and stay
              blocked until you press <em>Load images</em>.
            </p>
            <p>
              Hosting is GitHub Pages. Like any web server, GitHub receives your IP address and
              request metadata when the page is delivered; that happens on their infrastructure
              under their privacy policy and is outside my control. I neither receive nor keep
              those logs.
            </p>
          </div>
        </details>
      </footer>

      {selected && (
        <ProjectPanel project={selected} onClose={closeDetail} onRequest={startRequest} />
      )}

      {request && (
        <RequestModal
          projects={projects}
          selected={requestFor}
          onSelectedChange={(names) => navigate({ requestFor: names })}
          onClose={() => navigate({ request: false })}
        />
      )}
    </div>
  )
}
