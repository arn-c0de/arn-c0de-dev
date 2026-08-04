'use client'

import { useEffect, useState } from 'react'
import { MoonIcon, SunIcon } from './Icons'

type Theme = 'light' | 'dark' | 'system'

/**
 * Three-state toggle: system → light → dark → system. The `data-theme`
 * attribute overrides the media query in globals.css; removing it hands
 * control back to the OS.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') setTheme(stored)
  }, [])

  function cycle() {
    const next: Theme = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'
    setTheme(next)
    if (next === 'system') {
      delete document.documentElement.dataset.theme
      localStorage.removeItem('theme')
    } else {
      document.documentElement.dataset.theme = next
      localStorage.setItem('theme', next)
    }
  }

  const label =
    theme === 'system' ? 'Theme: follows system' : `Theme: ${theme} (click to change)`

  return (
    <button type="button" className="iconbtn" onClick={cycle} aria-label={label} title={label}>
      {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
      {theme === 'system' && (
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>AUTO</span>
      )}
    </button>
  )
}
