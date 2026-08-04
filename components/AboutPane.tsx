'use client'

import type { Project } from '@/lib/types'
import { GitHubIcon } from './Icons'

const PRINCIPLES = [
  {
    title: 'Local first',
    body: 'Language models, capture tooling and key management run on the machine in front of you. No account, no upload, no third party in the loop.',
  },
  {
    title: 'Fail closed',
    body: 'Security tooling aborts instead of degrading quietly. A verification step that cannot prove its guarantee stops the operation rather than assuming the best.',
  },
  {
    title: 'Hardware to interface',
    body: 'Projects usually span the whole path: firmware on the microcontroller, the transport in between, and a desktop or mobile client that makes the data readable.',
  },
  {
    title: 'Readable over clever',
    body: 'Small dependency trees, documented setup, licence stated up front. Every repository should be auditable by the person who has to trust it.',
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
          I build <strong>embedded systems, AI agents and network security tooling</strong> — ESP32
          and Arduino firmware, retrieval-augmented assistants that run against local models, live
          traffic and threat analysis, and Android apps in Kotlin.
        </p>
        <p>
          Most of it starts as a problem I actually had: a mesh link that needed encryption, a
          research question no search engine answered well, a server whose SSH logins I wanted to
          see in real time. The projects stay published because the next person with that problem
          should not have to start from zero.
        </p>
        <p>
          Everything on this page is public and open for inspection. Where a project touches
          credentials, capture data or personal information, it is built to keep that data on the
          device it was created on.
        </p>
      </div>

      <section className="section">
        <h2 className="section__title">How I work</h2>
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
        <h2 className="section__title">Working languages</h2>
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
