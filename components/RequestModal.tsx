'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  INQUIRY_EMAIL,
  INQUIRY_TYPES,
  MAILTO_LIMIT,
  SERVICE_AREAS,
  TIMELINES,
  buildBody,
  buildMailto,
  buildSubject,
  looksLikeEmail,
  type InquiryTypeId,
  type RequestDraft,
  type ServiceAreaId,
} from '@/lib/request'
import type { Project } from '@/lib/types'
import { CheckIcon, CloseIcon, CopyIcon, SearchIcon } from './Icons'

/** One labelled row. Every control in the form sits in one of these. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="frow">
      <span className="frow__label">{label}</span>
      <div className="frow__field">{children}</div>
    </div>
  )
}

export default function RequestModal({
  projects,
  selected,
  onSelectedChange,
  onClose,
}: {
  projects: Project[]
  selected: string[]
  onSelectedChange: (names: string[]) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [type, setType] = useState<InquiryTypeId>('question')
  const [areas, setAreas] = useState<ServiceAreaId[]>([])
  const [areaQuery, setAreaQuery] = useState('')
  const [timeline, setTimeline] = useState<RequestDraft['timeline']>(TIMELINES[0])
  const [message, setMessage] = useState('')
  const [touched, setTouched] = useState(false)
  const [copied, setCopied] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  const chosen = useMemo(
    () => selected.map((n) => projects.find((p) => p.name === n)).filter(Boolean) as Project[],
    [selected, projects],
  )

  /** Selected areas stay pinned at the top so a search never hides a choice. */
  const visibleAreas = useMemo(() => {
    const q = areaQuery.trim().toLowerCase()
    const matches = q
      ? SERVICE_AREAS.filter(
          (a) => a.title.toLowerCase().includes(q) || a.keywords.includes(q),
        )
      : SERVICE_AREAS
    const picked = SERVICE_AREAS.filter((a) => areas.includes(a.id))
    return [...picked, ...matches.filter((a) => !areas.includes(a.id))]
  }, [areaQuery, areas])

  const draft: RequestDraft = { name, email, type, areas, timeline, message, projects: chosen }
  const subject = buildSubject(draft)
  const body = buildBody(draft)
  const mailto = buildMailto(draft)

  const missing: string[] = []
  if (!name.trim()) missing.push('name')
  if (!looksLikeEmail(email)) missing.push('email')
  if (!message.trim()) missing.push('message')
  const ready = missing.length === 0

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  function toggleArea(id: ServiceAreaId) {
    setAreas((c) => (c.includes(id) ? c.filter((a) => a !== id) : [...c, id]))
  }

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(`To: ${INQUIRY_EMAIL}\nSubject: ${subject}\n\n${body}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* Clipboard blocked — the preview is selectable. */
    }
  }

  return (
    <>
      <div className="scrim" style={{ zIndex: 55 }} onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true" aria-label="Start a request">
        <header className="modal__head">
          <div>
            <h2 className="modal__title">Start a request</h2>
            <p className="modal__sub">
              Pick what it is about — you get a finished email to send yourself.
            </p>
          </div>
          <button ref={closeRef} type="button" className="iconbtn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </header>

        <div className="modal__cols">
          <div className="modal__form">
            <Row label="Type">
              <div className="chips chips--tight">
                {INQUIRY_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="chip chip--sm"
                    aria-pressed={type === t.id}
                    onClick={() => setType(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </Row>

            <Row label={areas.length ? `Areas (${areas.length})` : 'Areas'}>
              <div className="search search--sm">
                <span className="search__icon">
                  <SearchIcon />
                </span>
                <input
                  type="search"
                  value={areaQuery}
                  onChange={(e) => setAreaQuery(e.target.value)}
                  placeholder="Search areas — lora, pcap, kotlin…"
                  aria-label="Search areas"
                />
              </div>
              <div className="arealist">
                {visibleAreas.length === 0 ? (
                  <p className="arealist__empty">No area matches “{areaQuery}”.</p>
                ) : (
                  visibleAreas.map((area) => {
                    const on = areas.includes(area.id)
                    return (
                      <button
                        key={area.id}
                        type="button"
                        className="areaitem"
                        aria-pressed={on}
                        onClick={() => toggleArea(area.id)}
                      >
                        <span className="pick__box" aria-hidden>
                          {on && <CheckIcon />}
                        </span>
                        {area.title}
                      </button>
                    )
                  })
                )}
              </div>
            </Row>

            <Row label="Projects">
              {chosen.length > 0 && (
                <div className="chips chips--tight" style={{ marginBottom: 5 }}>
                  {chosen.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      className="chip chip--sm"
                      aria-pressed="true"
                      onClick={() => onSelectedChange(selected.filter((n) => n !== p.name))}
                      title={`Remove ${p.title}`}
                    >
                      {p.title}
                      <CloseIcon />
                    </button>
                  ))}
                </div>
              )}
              <select
                className="select select--wide select--sm"
                value=""
                onChange={(e) => e.target.value && onSelectedChange([...selected, e.target.value])}
                aria-label="Add a project to this request"
              >
                <option value="">{chosen.length ? 'Add another…' : 'Add a project (optional)…'}</option>
                {projects
                  .filter((p) => !selected.includes(p.name))
                  .map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.title}
                    </option>
                  ))}
              </select>
            </Row>

            <Row label="Name">
              <input
                className="input input--sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="Jane Doe"
                autoComplete="name"
              />
            </Row>

            <Row label="Email">
              <input
                className="input input--sm"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="jane@example.com"
                autoComplete="email"
              />
            </Row>

            <Row label="When">
              <select
                className="select select--wide select--sm"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value as RequestDraft['timeline'])}
                aria-label="Timeline"
              >
                {TIMELINES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Row>

            <Row label="Message">
              <textarea
                className="input input--area input--sm"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onBlur={() => setTouched(true)}
                rows={4}
                placeholder="What are you trying to build, and where do you need help?"
              />
            </Row>
          </div>

          <aside className="modal__preview">
            <span className="fset__label">Preview</span>
            <div className="draft draft--tight">
              <div className="draft__head">
                <span>
                  <span className="draft__key">To</span>
                  <span className="mono">{INQUIRY_EMAIL}</span>
                </span>
                <span>
                  <span className="draft__key">Subject</span>
                  {subject}
                </span>
              </div>
              <pre className="draft__body">{body}</pre>
            </div>
          </aside>
        </div>

        <footer className="modal__foot">
          <span className="modal__hint">
            {touched && !ready ? (
              <span className="modal__hint--warn">Still needed: {missing.join(', ')}</span>
            ) : mailto.length > MAILTO_LIMIT ? (
              'Long message — use Copy draft, some mail apps truncate links.'
            ) : (
              'Nothing is sent from here. You send it from your own mail app.'
            )}
          </span>
          <div className="modal__actions">
            <button type="button" className="btn" onClick={copyDraft}>
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? 'Copied' : 'Copy draft'}
            </button>
            <a
              className={`btn btn--primary${ready ? '' : ' btn--disabled'}`}
              href={ready ? mailto : undefined}
              aria-disabled={!ready}
              onClick={(e) => {
                if (!ready) {
                  e.preventDefault()
                  setTouched(true)
                }
              }}
            >
              Open in email app
            </a>
          </div>
        </footer>
      </div>
    </>
  )
}
