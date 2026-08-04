'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { asset } from '@/lib/basePath'
import { formatRelative, languageHue } from '@/lib/format'
import type { Project } from '@/lib/types'
import type { Tab } from '@/lib/useAppState'
import { PRINCIPLES } from './AboutPane'
import ProjectCard from './ProjectCard'
import { ArrowIcon, ChevronIcon, GitHubIcon, MailIcon, StarIcon } from './Icons'

/** How many repositories the "recently updated" tile lists. */
const RECENT = 4
/** Languages and domains are only teasers here — the stack tab has them all. */
const TOP_LANGUAGES = 4
const TOP_DOMAINS = 6
const TOP_TOPICS = 10

export default function OverviewPane({
  projects,
  onNavigate,
  onOpenProject,
  onStartRequest,
  onTopicSelect,
}: {
  projects: Project[]
  onNavigate: (tab: Tab) => void
  onOpenProject: (name: string) => void
  onStartRequest: () => void
  onTopicSelect: (topic: string) => void
}) {
  const stats = useMemo(() => {
    const languages = new Map<string, number>()
    const categories = new Map<string, number>()
    const topics = new Map<string, number>()
    let stars = 0
    let lastPush = ''

    for (const p of projects) {
      stars += p.stargazers_count
      if (p.pushed_at > lastPush) lastPush = p.pushed_at
      if (p.language) languages.set(p.language, (languages.get(p.language) ?? 0) + 1)
      categories.set(p.category, (categories.get(p.category) ?? 0) + 1)
      for (const t of p.topics) topics.set(t, (topics.get(t) ?? 0) + 1)
    }

    const sortDesc = (m: Map<string, number>) =>
      [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

    const ranked = sortDesc(languages)
    return {
      stars,
      lastPush,
      languages: ranked,
      max: ranked[0]?.[1] ?? 1,
      categories: sortDesc(categories),
      topics: sortDesc(topics).filter(([, n]) => n > 1),
    }
  }, [projects])

  // The gallery leads with the curated set and tops it up with the rest by
  // stars, so it never looks thin while the config is still short.
  const gallery = useMemo(() => {
    const featured = projects.filter((p) => p.featured)
    const rest = projects
      .filter((p) => !p.featured)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
    return [...featured, ...rest].slice(0, 10)
  }, [projects])

  const recent = useMemo(
    () => [...projects].sort((a, b) => b.pushed_at.localeCompare(a.pushed_at)).slice(0, RECENT),
    [projects],
  )

  return (
    <div className="pane over">
      <section className="hero">
        <div className="hero__main">
          <div className="hero__id">
            <img className="hero__avatar" src={asset('/avatar.jpg')} alt="" width={54} height={54} />
            <div>
              <h1 className="hero__name">arn-c0de</h1>
              <p className="hero__role">
                Embedded firmware · local AI · network &amp; security tooling · Android
              </p>
            </div>
          </div>

          <p className="hero__lede">
            I build things close to the hardware and tools that make complicated systems easier to
            understand. Everything here runs locally where it can, the code is public, and your data
            stays on your device.
          </p>

          <div className="hero__actions">
            <button type="button" className="btn btn--primary" onClick={onStartRequest}>
              <MailIcon />
              Start a request
            </button>
            <button type="button" className="btn" onClick={() => onNavigate('projects')}>
              Browse projects
              <ArrowIcon />
            </button>
            <button type="button" className="btn" onClick={() => onNavigate('about')}>
              More about me
              <ArrowIcon />
            </button>
            <a
              className="btn"
              href="https://github.com/arn-c0de"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubIcon size={14} />
              GitHub
            </a>
          </div>
        </div>

        <div className="hero__stats">
          <button type="button" className="hstat" onClick={() => onNavigate('projects')}>
            <span className="hstat__v">{projects.length}</span>
            <span className="hstat__k">Projects</span>
          </button>
          <button type="button" className="hstat" onClick={() => onNavigate('stack')}>
            <span className="hstat__v">
              <StarIcon />
              {stats.stars}
            </span>
            <span className="hstat__k">Stars</span>
          </button>
          <button type="button" className="hstat" onClick={() => onNavigate('stack')}>
            <span className="hstat__v">{stats.languages.length}</span>
            <span className="hstat__k">Languages</span>
          </button>
          <div className="hstat hstat--static">
            <span className="hstat__v hstat__v--sm">{formatRelative(stats.lastPush)}</span>
            <span className="hstat__k">Last push</span>
          </div>
        </div>
      </section>

      <Gallery projects={gallery} onOpen={onOpenProject} onAll={() => onNavigate('projects')} />

      <div className="over__grid">
        <Tile
          title="Stack"
          hint="What the repositories actually use"
          action="Full breakdown"
          onAction={() => onNavigate('stack')}
        >
          <div className="minibars">
            {stats.languages.slice(0, TOP_LANGUAGES).map(([name, count]) => (
              <div
                key={name}
                className="minibar"
                style={{ '--hue': languageHue(name) } as React.CSSProperties}
              >
                <span className="minibar__name">
                  <span className="bar__dot" />
                  {name}
                </span>
                <span className="bar__track">
                  <span className="bar__fill" style={{ width: `${(count / stats.max) * 100}%` }} />
                </span>
                <span className="bar__n">{count}</span>
              </div>
            ))}
          </div>
        </Tile>

        <Tile
          title="Domains"
          hint="Where the work sits"
          action="Filter projects"
          onAction={() => onNavigate('projects')}
        >
          <div className="chips chips--tight">
            {stats.categories.slice(0, TOP_DOMAINS).map(([name, count]) => (
              <span key={name} className="chip chip--sm" style={{ cursor: 'default' }}>
                {name}
                <span className="chip__n">{count}</span>
              </span>
            ))}
          </div>
        </Tile>

        <Tile
          title="Recently updated"
          hint="Straight from the GitHub API"
          action="All projects"
          onAction={() => onNavigate('projects')}
        >
          <ul className="rlist">
            {recent.map((p) => (
              <li key={p.name}>
                <button type="button" className="rlist__row" onClick={() => onOpenProject(p.name)}>
                  <span className="rlist__name">{p.title}</span>
                  <span className="rlist__when">{formatRelative(p.pushed_at)}</span>
                </button>
              </li>
            ))}
          </ul>
        </Tile>

        <Tile
          title="How I work"
          hint="Two of the four things I care about"
          action="Read the rest"
          onAction={() => onNavigate('about')}
        >
          <div className="minicards">
            {PRINCIPLES.slice(0, 2).map((p) => (
              <div key={p.title} className="minicard">
                <h4>{p.title}</h4>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </Tile>

        <Tile
          title="Topics"
          hint="Tags shared by more than one repository"
          action="See all topics"
          onAction={() => onNavigate('stack')}
        >
          <div className="cloud">
            {stats.topics.slice(0, TOP_TOPICS).map(([topic, count]) => (
              <button
                key={topic}
                type="button"
                className="cloud__tag"
                onClick={() => onTopicSelect(topic)}
                title={`Show projects tagged ${topic}`}
              >
                {topic}
                <b>{count}</b>
              </button>
            ))}
          </div>
        </Tile>

        <Tile
          title="Get in touch"
          hint="SimpleX, email, PGP — whatever suits"
          action="Contact details"
          onAction={() => onNavigate('contact')}
        >
          <p className="tile__text">
            Questions about a project, help getting something running, a bug or security finding, or
            an idea you would like built — all welcome. Encrypt it if it should stay private.
          </p>
          <div className="tile__row">
            <button type="button" className="btn btn--primary btn--sm" onClick={onStartRequest}>
              <MailIcon />
              Start a request
            </button>
          </div>
        </Tile>
      </div>
    </div>
  )
}

/* ── Pieces ───────────────────────────────────────────────────────────────── */

function Tile({
  title,
  hint,
  action,
  onAction,
  children,
}: {
  title: string
  hint: string
  action: string
  onAction: () => void
  children: React.ReactNode
}) {
  return (
    <section className="tile">
      <div className="tile__head">
        <h2 className="tile__title">{title}</h2>
        <p className="tile__hint">{hint}</p>
      </div>
      <div className="tile__body">{children}</div>
      <button type="button" className="tile__link" onClick={onAction}>
        {action}
        <ArrowIcon />
      </button>
    </section>
  )
}

/**
 * Horizontal project gallery. Touch devices swipe it natively; on desktop the
 * arrows page it and the track can be dragged with the mouse. Snapping is
 * turned off mid-drag, otherwise the browser fights every pointer move.
 */
function Gallery({
  projects,
  onOpen,
  onAll,
}: {
  projects: Project[]
  onOpen: (name: string) => void
  onAll: () => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: true })
  const [dragging, setDragging] = useState(false)
  const drag = useRef({ x: 0, left: 0, moved: false })

  const sync = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft >= max - 4 })
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    sync()
    el.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync)
    return () => {
      el.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
    }
  }, [sync, projects.length])

  const page = useCallback((dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    const slide = el.firstElementChild as HTMLElement | null
    const step = slide ? slide.offsetWidth + 10 : el.clientWidth * 0.8
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }, [])

  function onPointerDown(e: React.PointerEvent) {
    // Touch and pen already scroll natively; hijacking them only stutters.
    if (e.pointerType !== 'mouse' || !trackRef.current) return
    drag.current = { x: e.clientX, left: trackRef.current.scrollLeft, moved: false }
    setDragging(true)
    trackRef.current.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    const el = trackRef.current
    if (!dragging || !el) return
    const dx = e.clientX - drag.current.x
    if (Math.abs(dx) > 5) drag.current.moved = true
    el.scrollLeft = drag.current.left - dx
  }

  function endDrag(e: React.PointerEvent) {
    if (!dragging) return
    setDragging(false)
    trackRef.current?.releasePointerCapture(e.pointerId)
  }

  // A card is a button, so a drag that ends over one would otherwise open it.
  function onClickCapture(e: React.MouseEvent) {
    if (!drag.current.moved) return
    e.preventDefault()
    e.stopPropagation()
    drag.current.moved = false
  }

  if (projects.length === 0) return null

  return (
    <section className="gallery">
      <div className="gallery__head">
        <div>
          <h2 className="tile__title">Featured projects</h2>
          <p className="tile__hint">Swipe or use the arrows — pick one to see readme and links.</p>
        </div>
        <div className="gallery__nav">
          <button
            type="button"
            className="iconbtn"
            onClick={() => page(-1)}
            disabled={edges.start}
            aria-label="Previous projects"
          >
            <ChevronIcon dir="left" />
          </button>
          <button
            type="button"
            className="iconbtn"
            onClick={() => page(1)}
            disabled={edges.end}
            aria-label="More projects"
          >
            <ChevronIcon dir="right" />
          </button>
          <button type="button" className="btn btn--sm" onClick={onAll}>
            All projects
            <ArrowIcon />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className={`gallery__track${dragging ? ' gallery__track--dragging' : ''}`}
        data-start={edges.start}
        data-end={edges.end}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
      >
        {projects.map((p, i) => (
          <div className="gallery__slide" key={p.name}>
            <ProjectCard project={p} index={i} onOpen={onOpen} showFeaturedBadge />
          </div>
        ))}
      </div>
    </section>
  )
}
