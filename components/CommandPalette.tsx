'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { searchProjects } from '@/lib/github'
import type { Project } from '@/lib/types'
import type { Tab } from '@/lib/useAppState'
import { StarIcon } from './Icons'

interface Command {
  id: string
  group: 'Navigate' | 'Projects' | 'Links'
  name: string
  hint?: string
  meta?: string
  run: () => void
}

export default function CommandPalette({
  projects,
  onClose,
  onNavigate,
  onOpenProject,
}: {
  projects: Project[]
  onClose: () => void
  onNavigate: (tab: Tab) => void
  onOpenProject: (name: string) => void
}) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const commands = useMemo<Command[]>(() => {
    const tabs: { tab: Tab; label: string; hint: string }[] = [
      { tab: 'projects', label: 'Projects', hint: 'Browse the repository grid' },
      { tab: 'stack', label: 'Stack', hint: 'Languages, domains and topics' },
      { tab: 'about', label: 'About', hint: 'Focus areas and working principles' },
      { tab: 'request', label: 'Request', hint: 'Build an inquiry email to send' },
      { tab: 'contact', label: 'Contact', hint: 'SimpleX, email and PGP key' },
    ]

    const matched = searchProjects(projects, query).slice(0, 8)

    return [
      ...tabs.map<Command>((t) => ({
        id: `tab:${t.tab}`,
        group: 'Navigate',
        name: t.label,
        hint: t.hint,
        run: () => {
          onNavigate(t.tab)
          onClose()
        },
      })),
      ...matched.map<Command>((p) => ({
        id: `project:${p.name}`,
        group: 'Projects',
        name: p.title,
        hint: p.description ?? p.category,
        meta: `★ ${p.stargazers_count}`,
        run: () => {
          onOpenProject(p.name)
          onClose()
        },
      })),
      {
        id: 'link:github',
        group: 'Links',
        name: 'Open GitHub profile',
        hint: 'github.com/arn-c0de',
        run: () => {
          window.open('https://github.com/arn-c0de', '_blank', 'noopener,noreferrer')
          onClose()
        },
      },
    ]
  }, [projects, query, onNavigate, onOpenProject, onClose])

  // Tab entries are filtered by name, project entries are pre-filtered above.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter(
      (c) =>
        c.group === 'Projects' ||
        `${c.name} ${c.hint ?? ''}`.toLowerCase().includes(q),
    )
  }, [commands, query])

  useEffect(() => setActive(0), [query])
  useEffect(() => inputRef.current?.focus(), [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((i) => (i + 1) % Math.max(1, results.length))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((i) => (i - 1 + results.length) % Math.max(1, results.length))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        results[active]?.run()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [results, active, onClose])

  // Keep the highlighted row inside the scroll viewport.
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [active])

  let lastGroup = ''

  return (
    <>
      <div className="scrim" style={{ zIndex: 60 }} onClick={onClose} />
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <input
          ref={inputRef}
          className="palette__input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects or jump to a section…"
          aria-label="Command palette search"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
        />

        {results.length === 0 ? (
          <div className="palette__empty">No matches for “{query}”</div>
        ) : (
          <ul className="palette__list" id="palette-list" ref={listRef} role="listbox">
            {results.map((cmd, i) => {
              const showGroup = cmd.group !== lastGroup
              lastGroup = cmd.group
              return (
                <li key={cmd.id}>
                  {showGroup && <div className="palette__group">{cmd.group}</div>}
                  <button
                    type="button"
                    className="palette__item"
                    data-active={i === active}
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onClick={cmd.run}
                  >
                    <span style={{ minWidth: 0 }}>
                      <span className="palette__item-name">{cmd.name}</span>
                      {cmd.hint && <span className="palette__item-desc"> — {cmd.hint}</span>}
                    </span>
                    {cmd.meta && (
                      <span className="palette__item-meta">
                        <StarIcon /> {cmd.meta.replace('★ ', '')}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <div className="palette__foot">
          <span>
            <span className="kbd">↑↓</span> navigate
          </span>
          <span>
            <span className="kbd">↵</span> open
          </span>
          <span>
            <span className="kbd">esc</span> close
          </span>
        </div>
      </div>
    </>
  )
}
