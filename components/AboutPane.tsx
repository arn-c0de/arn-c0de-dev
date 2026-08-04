'use client'

import type { Project } from '@/lib/types'
import { GitHubIcon } from './Icons'

const PRINCIPLES = [
  {
    title: 'Local by default',
    body: 'If something can run on your machine, it should. That means fewer accounts, fewer uploads and less data leaving your hands.',
  },
  {
    title: 'Security that stays honest',
    body: 'When a security check cannot do its job, the tool stops and tells you. Quietly pretending everything is fine is never the fallback.',
  },
  {
    title: 'The whole path',
    body: 'I like building things end to end: from firmware on a microcontroller to the connection in between and the app that makes it useful.',
  },
  {
    title: 'Clear beats clever',
    body: 'I would rather ship readable code, a short dependency list and setup notes that actually help. If you need to trust a tool, you should be able to understand it.',
  },
]

export default function AboutPane({ projects }: { projects: Project[] }) {
  const languages = [...new Set(projects.map((p) => p.language).filter(Boolean))]

  return (
    <div className="pane">
      <div className="pane__head">
        <h1 className="pane__title">About</h1>
      </div>

      <div className="prompt" aria-hidden>
        {'┌─[arn-c0de@parrot]─[~/projects]\n└──╼ $ '}
        <b>whoami</b>
      </div>

      <div className="prose" style={{ marginBottom: 32 }}>
        <p>
          I like building things close to the hardware — and tools that make complicated systems
          easier to understand. Right now, that means <strong>ESP32 and Arduino firmware, local AI
          assistants, network and security tooling, and Android apps in Kotlin</strong>.
        </p>
        <p>
          Most projects start with something I wanted for myself: an encrypted mesh link, a better
          way to dig through research, or a live view of SSH attempts on a server. If the result
          might save someone else a few evenings, I clean it up and put it on GitHub.
        </p>
        <p>
          The code is public, the setup is documented, and sensitive data stays where it belongs:
          on your device. No account or cloud detour unless a project genuinely needs one.
        </p>
      </div>

      <section className="section">
        <h2 className="section__title">A few things I care about</h2>
        <div className="cards">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="infocard">
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section__title">Languages I build with</h2>
        <div className="cloud">
          {languages.map((l) => (
            <span key={l} className="cloud__tag" style={{ cursor: 'default' }}>
              {l}
            </span>
          ))}
        </div>
      </section>

      <section className="section">
        <a className="btn btn--primary" href="https://github.com/arn-c0de" target="_blank" rel="noopener noreferrer">
          <GitHubIcon size={14} />
          github.com/arn-c0de
        </a>
      </section>
    </div>
  )
}
