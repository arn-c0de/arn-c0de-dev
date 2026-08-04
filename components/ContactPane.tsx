'use client'

import { useState } from 'react'
import { asset } from '@/lib/basePath'
import { PGP_PUBLIC_KEY } from '@/lib/pgpKey'
import { CheckIcon, CopyIcon } from './Icons'

const SIMPLEX_LINK =
  'https://smp19.simplex.im/a#12EFYcsND4k7C7Gz1wUT7mKrt5-u84PqnHTBUZXw0eg'
const EMAIL = 'arn-c0de@protonmail.com'
const FINGERPRINT = '93A7 8377 0EEA FFA4 3B24  22F1 A0F9 A2E7 0D64 2ADC'

const SUITABLE_FOR = [
  'vulnerability reports',
  'responsible disclosure',
  'whistleblowing',
  'other security-critical or confidential matters',
]

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* Clipboard blocked — the value is selectable on screen anyway. */
    }
  }

  return (
    <button type="button" className="btn" onClick={copy}>
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? 'Copied' : label}
    </button>
  )
}

export default function ContactPane() {
  return (
    <div className="pane">
      <div className="pane__head">
        <h1 className="pane__title">Secure contact</h1>
        <p className="pane__lede">
          If you need to contact me about sensitive topics, you are welcome to use secure or
          confidential channels — encrypted email using the PGP public key below, or private chat
          via SimpleX where appropriate.
        </p>
      </div>

      <section className="section">
        <h2 className="section__title">This channel is intended for</h2>
        <div className="cloud">
          {SUITABLE_FOR.map((item) => (
            <span key={item} className="cloud__tag" style={{ cursor: 'default' }}>
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section__title">Contact methods</h2>
        <div className="cards">
          <div className="infocard">
            <h3>SimpleX Chat</h3>
            <p style={{ marginBottom: 12 }}>
              For confidential first contact or lower-friction coordination.
            </p>
            <div className="panel__actions">
              <a className="btn btn--primary" href={SIMPLEX_LINK} target="_blank" rel="noopener noreferrer">
                Open SimpleX invite
              </a>
              <CopyButton value={SIMPLEX_LINK} label="Copy link" />
            </div>
          </div>

          <div className="infocard">
            <h3>Email</h3>
            <p style={{ marginBottom: 12 }}>
              <span className="mono">{EMAIL}</span> — encrypted email is preferred for messages
              containing highly sensitive technical details. Please use the PGP key below.
            </p>
            <div className="panel__actions">
              <a className="btn btn--primary" href={`mailto:${EMAIL}`}>
                Write email
              </a>
              <CopyButton value={EMAIL} label="Copy address" />
            </div>
          </div>

          <div className="infocard">
            <h3>Matrix</h3>
            <p>Currently unavailable.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section__title">PGP public key</h2>

        <div className="callout callout--warn">
          <strong>Verify before you trust this page.</strong> Confirm the fingerprint through a
          second, independent channel before sending anything sensitive — do not rely on this page
          alone.
        </div>

        <dl className="deflist" style={{ marginBottom: 16 }}>
          <dt>Fingerprint</dt>
          <dd>{FINGERPRINT}</dd>
          <dt>Key ID</dt>
          <dd>A0F9A2E70D642ADC</dd>
          <dt>Algorithm</dt>
          <dd>ed25519 (signing) · cv25519 (encryption)</dd>
          <dt>Created</dt>
          <dd>2026-05-13</dd>
          <dt>Expires</dt>
          <dd>2028-05-12</dd>
          <dt>User ID</dt>
          <dd>arn-c0de &lt;{EMAIL}&gt;</dd>
        </dl>

        <div className="copyrow">
          <a className="btn" href={asset('/arn-c0de.asc')} download="arn-c0de.asc">
            Download .asc
          </a>
          <CopyButton value={PGP_PUBLIC_KEY} label="Copy key block" />
        </div>

        <pre className="keyblock">{PGP_PUBLIC_KEY}</pre>
      </section>

      <section className="section">
        <h2 className="section__title">Note</h2>
        <div className="callout">
          If your message contains sensitive technical details, affected systems, internal material,
          or information that should not be sent in plain text, please use an appropriate secure
          channel. Encrypted email should be preferred for the most sensitive reports and
          disclosures.
        </div>
      </section>
    </div>
  )
}
