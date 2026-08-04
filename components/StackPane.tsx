'use client'

import { useMemo } from 'react'
import { languageHue } from '@/lib/format'
import type { Project } from '@/lib/types'
import { LanguageIcon } from './Icons'

/**
 * Everything here is aggregated from the live repo data — no hand-maintained
 * list to drift out of date. Push a repo in a new language and it shows up.
 */
export default function StackPane({
  projects,
  onTopicSelect,
}: {
  projects: Project[]
  onTopicSelect: (topic: string) => void
}) {
  const stats = useMemo(() => {
    const languages = new Map<string, number>()
    const topics = new Map<string, number>()
    const categories = new Map<string, number>()
    let stars = 0

    for (const p of projects) {
      stars += p.stargazers_count
      if (p.language) languages.set(p.language, (languages.get(p.language) ?? 0) + 1)
      categories.set(p.category, (categories.get(p.category) ?? 0) + 1)
      for (const t of p.topics) topics.set(t, (topics.get(t) ?? 0) + 1)
    }

    const sortDesc = (m: Map<string, number>) =>
      [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

    return {
      stars,
      languages: sortDesc(languages),
      categories: sortDesc(categories),
      topics: sortDesc(topics).filter(([, n]) => n > 1),
      max: Math.max(1, ...languages.values()),
    }
  }, [projects])

  return (
    <div className="pane stack-pane">
      <div className="pane__head">
        <h1 className="pane__title">Stack</h1>
        <p className="pane__lede">
          A quick look at what I actually use — pulled from the repositories instead of a list I
          wrote once and forgot to update.
        </p>
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="metric__v">{projects.length}</div>
          <div className="metric__k">Projects</div>
        </div>
        <div className="metric">
          <div className="metric__v">{stats.stars}</div>
          <div className="metric__k">Stars</div>
        </div>
        <div className="metric">
          <div className="metric__v">{stats.languages.length}</div>
          <div className="metric__k">Languages</div>
        </div>
        <div className="metric">
          <div className="metric__v">{stats.topics.length}</div>
          <div className="metric__k">Shared topics</div>
        </div>
      </div>

      <section className="section">
        <h2 className="section__title">Languages</h2>
        <div className="bars">
          {stats.languages.map(([name, count]) => (
            <div
              key={name}
              className="bar__row"
              style={{ '--hue': languageHue(name) } as React.CSSProperties}
            >
              <div className="bar__meta">
                <span className="bar__name">
                  <LanguageIcon language={name} />
                  {name}
                </span>
                <span className="bar__n">
                  {count} repo{count === 1 ? '' : 's'}
                </span>
              </div>
              <span className="bar__track">
                <span
                  className="bar__fill"
                  style={{ width: `${(count / stats.max) * 100}%` }}
                />
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section__title">Domains</h2>
        <div className="domain-grid">
          {stats.categories.map(([name, count]) => (
            <div key={name} className="domain-card">
              <span className="domain-card__name">{name}</span>
              <span className="domain-card__count" title={`${count} project${count === 1 ? '' : 's'}`}>
                {count}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section__title">Topics used more than once</h2>
        <div className="cloud">
          {stats.topics.map(([topic, count]) => (
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
      </section>
    </div>
  )
}
