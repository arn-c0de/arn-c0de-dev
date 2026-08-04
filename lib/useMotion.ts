'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Motion helpers shared by the panes. Everything here degrades to "no motion,
 * final state" — either because the OS asks for it, or because the browser
 * lacks the API the effect is built on.
 */

/** Follows the OS setting live, so switching it does not need a reload. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  return reduced
}

/**
 * One observer for the whole app: every element carrying `data-reveal` gets
 * `is-in` the first time it scrolls into view, and the CSS takes it from
 * there. A MutationObserver picks up whatever the next tab, panel or modal
 * adds, so panes do not each need their own wiring.
 *
 * The hidden starting state lives behind `:root[data-reveal='on']`, which is
 * set here — without JS the markup stays fully visible.
 */
export function useRevealRoot<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return

    const mark = (el: Element) => el.classList.add('is-in')
    const pending = () => root.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)')

    if (!('IntersectionObserver' in window)) {
      pending().forEach(mark)
      return
    }

    document.documentElement.dataset.reveal = 'on'

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          mark(entry.target)
          io.unobserve(entry.target)
        }
      },
      // Fires a touch before the element is fully on screen, so the motion is
      // already underway by the time it is worth looking at.
      { rootMargin: '0px 0px -6% 0px', threshold: 0.06 },
    )

    // Observing the same element twice is a no-op, so re-scanning is cheap.
    const scan = () => pending().forEach((el) => io.observe(el))
    scan()

    // Only childList: adding `is-in` is an attribute change and must not
    // feed back into this.
    const mo = new MutationObserver(scan)
    mo.observe(root, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
      delete document.documentElement.dataset.reveal
    }
  }, [])

  return ref
}

/**
 * Counts from zero up to `value` on mount, and animates every later change
 * from where it left off — the projects count jumping when the live API
 * answers reads as the number arriving rather than as a flicker.
 */
export function useCountUp(value: number, duration = 750): number {
  const reduced = usePrefersReducedMotion()
  // Starts at the real value so the hydrated markup matches the server's.
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      from.current = 0
    }

    const start = from.current
    if (reduced || start === value) {
      from.current = value
      setShown(value)
      return
    }

    let frame = 0
    let began = 0

    const step = (now: number) => {
      began ||= now
      const t = Math.min(1, (now - began) / duration)
      // Decelerating, so the last digits settle instead of snapping.
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(Math.round(start + (value - start) * eased))
      if (t < 1) frame = requestAnimationFrame(step)
      else from.current = value
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [value, duration, reduced])

  return shown
}
