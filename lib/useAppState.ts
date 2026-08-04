'use client'

import { useCallback, useEffect, useState } from 'react'

export const TABS = ['projects', 'stack', 'about', 'contact'] as const
export type Tab = (typeof TABS)[number]

export interface AppState {
  tab: Tab
  /** Repo name of the open detail panel, or null when nothing is open. */
  project: string | null
}

function parse(search: string): AppState {
  const params = new URLSearchParams(search)
  const tab = params.get('tab') as Tab | null
  return {
    tab: tab && TABS.includes(tab) ? tab : 'projects',
    project: params.get('p'),
  }
}

function serialise(state: AppState): string {
  const params = new URLSearchParams()
  if (state.tab !== 'projects') params.set('tab', state.tab)
  if (state.project) params.set('p', state.project)
  const query = params.toString()
  return query ? `?${query}` : location.pathname
}

/**
 * Tab and detail-panel state kept in the URL query string, so every view is
 * linkable and the browser's back button behaves the way it does in an app.
 * Query params rather than routes — a static host has no server to resolve
 * deep paths on a hard refresh.
 */
export function useAppState(): [AppState, (next: Partial<AppState>) => void] {
  const [state, setState] = useState<AppState>({ tab: 'projects', project: null })

  // Read the URL after mount; the server-rendered HTML has no query string.
  useEffect(() => {
    setState(parse(location.search))
    const onPop = () => setState(parse(location.search))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((next: Partial<AppState>) => {
    setState((current) => {
      const merged = { ...current, ...next }
      history.pushState(null, '', serialise(merged))
      return merged
    })
  }, [])

  return [state, navigate]
}
