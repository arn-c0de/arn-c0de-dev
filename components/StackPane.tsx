'use client'

import { useMemo, useState } from 'react'
import { languageShare, monthlyActivity, projectSpans } from '@/lib/stats'
import type { Project } from '@/lib/types'
import Metric from './Metric'
import { ActivityChart, LanguageRing, SpanChart } from './Charts'
import { LanguageIcon } from './Icons'

/**
 * Everything here is aggregated from the live repo data — no hand-maintained
 * list to drift out of date. Push a repo in a new language and it shows up.
 *
 * The charts and the lists are two readings of the same numbers, so they are
 * wired together: hovering either side of the language section highlights the
 * other, and picking a language, a topic or a lane carries on into the rest of
 * the site rather than dead-ending on this tab.
 */
export default function StackPane({
  projects,
  onTopicSelect,
  onLanguageSelect,
  onOpenProject,
}: {
  projects: Project[]
  onTopicSelect: (topic: string) => void
  onLanguageSelect: (language: string) => void
  onOpenProject: (name: string) => void
}) {
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null)

  const stats = useMemo(() => {
    const topics = new Map<string, number>()
    const categories = new Map<string, number>()
    let stars = 0

    for (const p of projects) {
      stars += p.stargazers_count
      categories.set(p.category, (categories.get(p.category) ?? 0) + 1)
      for (const t of p.topics) topics.set(t, (topics.get(t) ?? 0) + 1)
    }

    const sortDesc = (m: Map<string, number>) =>
      [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

    const languages = languageShare(projects)
    const months = monthlyActivity(projects)

    return {
      stars,
      languages,
      months,
      spans: projectSpans(projects),
      peak: Math.max(0, ...months.map((m) => m.active)),
      categories: sortDesc(categories),
      topics: sortDesc(topics).filter(([, n]) => n > 1),
      max: Math.max(1, ...languages.map((l) => l.count)),
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

      <div className="metrics" data-reveal>
        <Metric value={projects.length} label="Projects" />
        <Metric value={stats.stars} label="Stars" />
        <Metric value={stats.languages.length} label="Languages" />
        <Metric value={stats.peak} label="Peak at once" />
      </div>

      <section className="section">
        <h2 className="section__title">Languages</h2>
        <p className="section__hint">
          Share of the repositories that name each language. Pick one to open the projects filtered
          to it.
        </p>

        <div className="langs">
          <div className="langs__ring" data-reveal>
            <LanguageRing
              slices={stats.languages}
              active={activeLanguage}
              onActive={setActiveLanguage}
              onSelect={onLanguageSelect}
            />
          </div>

          {/* The fill width is a custom property rather than a plain width:
              the bar sits at zero until its row scrolls into view, then runs
              out to --w. Without JS the CSS falls straight through to --w. */}
          <div className="bars">
            {stats.languages.map((slice, i) => (
              <button
                key={slice.name}
                type="button"
                className="bar__row"
                data-reveal
                data-dim={activeLanguage !== null && activeLanguage !== slice.name}
                onPointerEnter={() => setActiveLanguage(slice.name)}
                onPointerLeave={() => setActiveLanguage(null)}
                onFocus={() => setActiveLanguage(slice.name)}
                onBlur={() => setActiveLanguage(null)}
                onClick={() => onLanguageSelect(slice.name)}
                title={`Show ${slice.name} projects`}
                style={
                  {
                    '--hue': slice.hue,
                    '--w': `${(slice.count / stats.max) * 100}%`,
                    '--i': i,
                  } as React.CSSProperties
                }
              >
                <span className="bar__meta">
                  <span className="bar__name">
                    <LanguageIcon language={slice.name} />
                    {slice.name}
                  </span>
                  <span className="bar__n">
                    {slice.count} repo{slice.count === 1 ? '' : 's'} · {Math.round(slice.share * 100)}%
                  </span>
                </span>
                <span className="bar__track">
                  <span className="bar__fill" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section__title">Activity</h2>
        <p className="section__hint">
          How many projects were between their first commit and their last push in a given month,
          and how many started in it.
        </p>
        <ActivityChart months={stats.months} />
      </section>

      <section className="section">
        <h2 className="section__title">Project timeline</h2>
        <p className="section__hint">
          Every repository from its first commit to its most recent push, coloured by language —
          pick a lane to open it.
        </p>
        <SpanChart spans={stats.spans} months={stats.months} onOpen={onOpenProject} />
      </section>

      <section className="section">
        <h2 className="section__title">Domains</h2>
        <div className="domain-grid">
          {stats.categories.map(([name, count], i) => (
            <div
              key={name}
              className="domain-card"
              data-reveal
              style={{ '--i': i } as React.CSSProperties}
            >
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
          {stats.topics.map(([topic, count], i) => (
            <button
              key={topic}
              type="button"
              className="cloud__tag"
              data-reveal
              style={{ '--i': i } as React.CSSProperties}
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
