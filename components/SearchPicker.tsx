'use client'

import { useMemo, useState } from 'react'
import { CheckIcon, SearchIcon } from './Icons'

export interface PickerItem {
  id: string
  title: string
  /** Extra text the search matches on but never displays. */
  keywords?: string
  /** Small right-aligned annotation, e.g. a star count or language. */
  meta?: string
}

/**
 * Search box over a scrollable multi-select list. Used for both the topic
 * areas and the project list in the request modal, so the two behave
 * identically instead of one being a dropdown and the other a grid.
 *
 * Selected entries are pinned to the top, which means a search can never hide
 * something the visitor already chose.
 */
export default function SearchPicker({
  selected,
  items,
  onToggle,
  placeholder,
  label,
}: {
  selected: readonly string[]
  items: readonly PickerItem[]
  onToggle: (id: string) => void
  placeholder: string
  /** Used for the accessible name of the search field. */
  label: string
}) {
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = q
      ? items.filter(
          (i) =>
            i.title.toLowerCase().includes(q) || (i.keywords ?? '').toLowerCase().includes(q),
        )
      : items
    const picked = items.filter((i) => selected.includes(i.id))
    return [...picked, ...matches.filter((i) => !selected.includes(i.id))]
  }, [items, query, selected])

  return (
    <>
      <div className="search search--sm">
        <span className="search__icon">
          <SearchIcon />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label={label}
        />
      </div>
      <div className="arealist">
        {visible.length === 0 ? (
          <p className="arealist__empty">Nothing matches “{query}”.</p>
        ) : (
          visible.map((item) => {
            const on = selected.includes(item.id)
            return (
              <button
                key={item.id}
                type="button"
                className="areaitem"
                aria-pressed={on}
                onClick={() => onToggle(item.id)}
                title={item.title}
              >
                <span className="pick__box" aria-hidden>
                  {on && <CheckIcon />}
                </span>
                <span className="areaitem__title">{item.title}</span>
                {item.meta && <span className="areaitem__meta">{item.meta}</span>}
              </button>
            )
          })
        )}
      </div>
    </>
  )
}
