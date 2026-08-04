'use client'

import { useMemo, useState } from 'react'
import {
  BUDGETS,
  INQUIRY_EMAIL,
  INQUIRY_TYPES,
  MAILTO_LIMIT,
  TIMELINES,
  buildBody,
  buildMailto,
  buildSubject,
  looksLikeEmail,
  type RequestDraft,
} from '@/lib/request'
import type { Project } from '@/lib/types'
import { CheckIcon, CloseIcon, CopyIcon } from './Icons'

export default function RequestPane({
  projects,
  selected,
  onSelectedChange,
}: {
  projects: Project[]
  /** Repo names carried in the URL, so a request link can be shared. */
  selected: string[]
  onSelectedChange: (names: string[]) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [type, setType] = useState<RequestDraft['type']>(INQUIRY_TYPES[0])
  const [budget, setBudget] = useState<RequestDraft['budget']>(BUDGETS[0])
  const [timeline, setTimeline] = useState<RequestDraft['timeline']>(TIMELINES[0])
  const [message, setMessage] = useState('')
  const [touched, setTouched] = useState(false)
  const [copied, setCopied] = useState(false)

  const chosen = useMemo(
    () => selected.map((n) => projects.find((p) => p.name === n)).filter(Boolean) as Project[],
    [selected, projects],
  )

  const draft: RequestDraft = { name, email, type, budget, timeline, message, projects: chosen }
  const subject = buildSubject(draft)
  const body = buildBody(draft)
  const mailto = buildMailto(draft)

  const missing: string[] = []
  if (!name.trim()) missing.push('your name')
  if (!looksLikeEmail(email)) missing.push('a valid email address')
  if (!message.trim()) missing.push('a short message')
  const ready = missing.length === 0
  const tooLongForMailto = mailto.length > MAILTO_LIMIT

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(`To: ${INQUIRY_EMAIL}\nSubject: ${subject}\n\n${body}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* Clipboard blocked — the preview below is selectable. */
    }
  }

  return (
    <div className="pane">
      <div className="pane__head">
        <h1 className="pane__title">Start a request</h1>
        <p className="pane__lede">
          Tell me what you have in mind and this builds the email for you — project links and all.
          Nothing is sent from here: you get a finished draft, check it, and send it from your own
          mail app.
        </p>
      </div>

      <div className="form">
        <section className="form__section">
          <h2 className="section__title">Projects this is about</h2>
          {chosen.length > 0 && (
            <div className="chips" style={{ marginBottom: 10 }}>
              {chosen.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  className="chip"
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
            className="select select--wide"
            value=""
            onChange={(e) => {
              if (e.target.value) onSelectedChange([...selected, e.target.value])
            }}
            aria-label="Add a project to this request"
          >
            <option value="">
              {chosen.length ? 'Add another project…' : 'Pick a project (optional)…'}
            </option>
            {projects
              .filter((p) => !selected.includes(p.name))
              .map((p) => (
                <option key={p.name} value={p.name}>
                  {p.title}
                </option>
              ))}
          </select>
        </section>

        <section className="form__section">
          <h2 className="section__title">What do you need?</h2>
          <div className="form__row">
            <label className="field">
              <span className="field__label">Type of request</span>
              <select
                className="select select--wide"
                value={type}
                onChange={(e) => setType(e.target.value as RequestDraft['type'])}
              >
                {INQUIRY_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">Budget</span>
              <select
                className="select select--wide"
                value={budget}
                onChange={(e) => setBudget(e.target.value as RequestDraft['budget'])}
              >
                {BUDGETS.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">Timeline</span>
              <select
                className="select select--wide"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value as RequestDraft['timeline'])}
              >
                {TIMELINES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="form__section">
          <h2 className="section__title">How can I reach you?</h2>
          <div className="form__row">
            <label className="field">
              <span className="field__label">Name</span>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="Jane Doe"
                autoComplete="name"
              />
            </label>
            <label className="field">
              <span className="field__label">Email</span>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="jane@example.com"
                autoComplete="email"
              />
            </label>
          </div>
          <label className="field" style={{ marginTop: 12 }}>
            <span className="field__label">Message</span>
            <textarea
              className="input input--area"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onBlur={() => setTouched(true)}
              rows={6}
              placeholder="What are you trying to build, and where do you need help?"
            />
          </label>
        </section>

        <section className="form__section">
          <h2 className="section__title">Your draft</h2>

          {touched && !ready && (
            <div className="callout callout--warn" style={{ marginBottom: 12 }}>
              Still needed: {missing.join(', ')}.
            </div>
          )}

          <div className="draft">
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

          {tooLongForMailto && (
            <div className="callout" style={{ marginTop: 12 }}>
              This message is long enough that some mail apps truncate it when opened by link. Use{' '}
              <strong>Copy draft</strong> and paste it instead.
            </div>
          )}

          <div className="panel__actions" style={{ marginTop: 14 }}>
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
            <button type="button" className="btn" onClick={copyDraft}>
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? 'Copied' : 'Copy draft'}
            </button>
          </div>

          <p className="form__note">
            This page has no backend. Everything above is assembled in your browser and stays there
            until you press send in your own mail app. For vulnerability reports or anything
            confidential, use the encrypted channel on the Contact tab instead.
          </p>
        </section>
      </div>
    </div>
  )
}
