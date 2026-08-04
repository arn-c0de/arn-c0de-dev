import type { Project } from './types'

/**
 * Where inquiries go. Deliberately separate from the secure-contact address on
 * the Contact tab, so business mail never lands in the disclosure channel.
 */
export const INQUIRY_EMAIL = 'info.arn-c0de@protonmail.com'

/** Most mail clients choke on very long mailto URLs; Outlook is the strictest. */
export const MAILTO_LIMIT = 1900

export const INQUIRY_TYPES = [
  'Commissioned work',
  'Consulting or review',
  'Licensing',
  'Collaboration',
  'Something else',
] as const

export const BUDGETS = [
  'Not decided yet',
  'Under 1,000 €',
  '1,000 – 5,000 €',
  '5,000 – 15,000 €',
  'Over 15,000 €',
  'Prefer to discuss',
] as const

export const TIMELINES = [
  'No fixed date',
  'As soon as possible',
  'Within a month',
  'Within three months',
  'Later this year',
] as const

export interface RequestDraft {
  name: string
  email: string
  type: (typeof INQUIRY_TYPES)[number]
  budget: (typeof BUDGETS)[number]
  timeline: (typeof TIMELINES)[number]
  message: string
  projects: Project[]
}

function pad(label: string): string {
  return (label + ':').padEnd(11, ' ')
}

export function buildSubject(draft: RequestDraft): string {
  const names = draft.projects.map((p) => p.title)
  if (names.length === 1) return `${draft.type} — ${names[0]}`
  if (names.length > 1) return `${draft.type} — ${names[0]} +${names.length - 1} more`
  return draft.type
}

/**
 * A plain-text email the visitor only has to send. Everything is assembled in
 * the browser; nothing is transmitted until their own mail client sends it.
 */
export function buildBody(draft: RequestDraft): string {
  const lines: string[] = ['Hello arn-c0de,', '']

  lines.push(draft.message.trim() || '(no message)', '')

  lines.push('— Request —')
  lines.push(pad('Type') + draft.type)
  if (draft.projects.length) {
    draft.projects.forEach((p, i) => {
      const label = i === 0 ? pad('Projects') : ' '.repeat(11)
      lines.push(`${label}${p.title} — ${p.html_url}`)
    })
  }
  lines.push(pad('Budget') + draft.budget)
  lines.push(pad('Timeline') + draft.timeline)
  lines.push('')

  lines.push('— Contact —')
  lines.push(pad('Name') + (draft.name.trim() || '(not given)'))
  lines.push(pad('Email') + (draft.email.trim() || '(not given)'))
  lines.push('')

  lines.push('Composed on arn-c0de.github.io')
  return lines.join('\n')
}

export function buildMailto(draft: RequestDraft): string {
  const params = new URLSearchParams({
    subject: buildSubject(draft),
    body: buildBody(draft),
  })
  // URLSearchParams encodes spaces as "+", which mail clients show literally.
  return `mailto:${INQUIRY_EMAIL}?${params.toString().replace(/\+/g, '%20')}`
}

/** Rough check — a full RFC 5322 validation is not worth the false negatives. */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}
