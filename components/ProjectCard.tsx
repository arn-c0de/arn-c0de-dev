'use client'

import type { Project } from '@/lib/types'
import { formatRelative, languageHue } from '@/lib/format'
import { ForkIcon, StarIcon } from './Icons'

const MAX_TAGS = 3

export default function ProjectCard({
  project,
  onOpen,
  showFeaturedBadge = false,
  index = 0,
}: {
  project: Project
  onOpen: (name: string) => void
  /** Only meaningful when the grid mixes featured and non-featured projects. */
  showFeaturedBadge?: boolean
  /** Position in the grid; drives the staggered entrance animation. */
  index?: number
}) {
  const extra = project.topics.length - MAX_TAGS
  const badge = showFeaturedBadge && project.featured

  return (
    <button
      type="button"
      className={`card${badge ? ' card--featured' : ''}`}
      style={{ '--i': index } as React.CSSProperties}
      onClick={() => onOpen(project.name)}
      aria-label={`Open details for ${project.title}`}
    >
      {badge && <span className="card__badge">featured</span>}

      <div className="card__top">
        <h3 className="card__title">{project.title}</h3>
        <span className="card__stars">
          <StarIcon />
          {project.stargazers_count}
        </span>
      </div>

      {project.description && <p className="card__desc">{project.description}</p>}

      {project.topics.length > 0 && (
        <div className="tagrow">
          {project.topics.slice(0, MAX_TAGS).map((topic) => (
            <span key={topic} className="tag">
              {topic}
            </span>
          ))}
          {extra > 0 && <span className="tag tag--more">+{extra}</span>}
        </div>
      )}

      <div className="card__foot">
        {project.language && (
          <span
            className="lang"
            style={{ '--hue': languageHue(project.language) } as React.CSSProperties}
          >
            <span className="lang__dot" />
            {project.language}
          </span>
        )}
        {project.forks_count > 0 && (
          <span className="lang">
            <ForkIcon />
            {project.forks_count}
          </span>
        )}
        <span style={{ marginLeft: 'auto' }}>{formatRelative(project.pushed_at)}</span>
      </div>
    </button>
  )
}
