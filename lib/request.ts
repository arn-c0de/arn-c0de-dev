import type { Project } from './types'

/**
 * Where inquiries go. Deliberately separate from the secure-contact address on
 * the Contact tab, so ordinary mail never lands in the disclosure channel.
 */
export const INQUIRY_EMAIL = 'info.arn-c0de@protonmail.com'

/** Most mail clients choke on very long mailto URLs; Outlook is the strictest. */
export const MAILTO_LIMIT = 1900

/**
 * Neutral wording on purpose: this is a way to get in touch about the work,
 * not a price list. No "commissioned", no rates, no budget field.
 */
export const INQUIRY_TYPES = [
  { id: 'question', label: 'Question about a project' },
  { id: 'build', label: 'Something you would like built' },
  { id: 'collaboration', label: 'Collaboration' },
  { id: 'issue', label: 'Bug or feature request' },
  { id: 'other', label: 'Something else' },
] as const

export type InquiryTypeId = (typeof INQUIRY_TYPES)[number]['id']

/** Topic areas, describing what the repositories actually cover. */
export const SERVICE_AREAS = [
  {
    id: 'embedded',
    title: 'Embedded & firmware',
    blurb: 'ESP32 and Arduino firmware, LoRa mesh links, sensors, USB HID devices.',
  },
  {
    id: 'security',
    title: 'Network & security tooling',
    blurb: 'Traffic capture and analysis, intrusion and flood detection, key management.',
  },
  {
    id: 'ai',
    title: 'Local AI & RAG',
    blurb: 'Assistants that answer from your own documents, running on your hardware.',
  },
  {
    id: 'android',
    title: 'Android apps',
    blurb: 'Kotlin and Jetpack Compose, offline-capable, with local encrypted storage.',
  },
  {
    id: 'unsure',
    title: 'Not sure yet',
    blurb: 'Describe the problem and we work out what it needs.',
  },
] as const

export type ServiceAreaId = (typeof SERVICE_AREAS)[number]['id']

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
  type: InquiryTypeId
  areas: ServiceAreaId[]
  timeline: (typeof TIMELINES)[number]
  message: string
  projects: Project[]
}

export function typeOf(id: InquiryTypeId) {
  return INQUIRY_TYPES.find((t) => t.id === id) ?? INQUIRY_TYPES[0]
}

export function areaTitles(ids: readonly ServiceAreaId[]): string[] {
  return SERVICE_AREAS.filter((a) => ids.includes(a.id)).map((a) => a.title)
}

function pad(label: string): string {
  return (label + ':').padEnd(11, ' ')
}

/** A label plus continuation lines aligned under it. */
function block(label: string, values: string[]): string[] {
  return values.map((v, i) => (i === 0 ? pad(label) : ' '.repeat(11)) + v)
}

export function buildSubject(draft: RequestDraft): string {
  const type = typeOf(draft.type).label
  const projects = draft.projects.map((p) => p.title)
  const areas = areaTitles(draft.areas).filter((t) => t !== 'Not sure yet')

  const focus = projects.length ? projects : areas
  if (focus.length === 1) return `${type} — ${focus[0]}`
  if (focus.length > 1) return `${type} — ${focus[0]} +${focus.length - 1} more`
  return type
}

/**
 * A plain-text email the visitor only has to send. Everything is assembled in
 * the browser; nothing is transmitted until their own mail client sends it.
 */
export function buildBody(draft: RequestDraft): string {
  const lines: string[] = ['Hello arn-c0de,', '']

  lines.push(draft.message.trim() || '(no message)', '')

  lines.push('— Request —')
  lines.push(pad('Type') + typeOf(draft.type).label)

  const areas = areaTitles(draft.areas)
  if (areas.length) lines.push(...block('Areas', areas))

  if (draft.projects.length) {
    lines.push(...block('Projects', draft.projects.map((p) => `${p.title} — ${p.html_url}`)))
  }

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
