import type { PlayerLook } from '../data/demoPlayers'

export type StaffMove = 'whistle-clap' | 'laugh' | 'cheer'
export type StaffOutfit = 'coach' | 'volunteer'

export type StaffMember = {
  id: string
  name: string
  role: string
  note?: string
  email?: string
  phone?: string
  emoji: string
  outfit: StaffOutfit
  move: StaffMove
  moveLabel: string
  look: PlayerLook
}

export type PloegMeta = {
  slug?: string
  name?: string
  category?: string
  season?: string
  homeBlurb?: string
  highlightTitle?: string
  highlightText?: string
  hallName?: string
  hallAddress?: string
  contactEmail?: string
  vblCalendarUrl?: string
  aanwezigheidUrl?: string
  externalSite?: string
  tagline?: string
}

export type WeeklyTraining = {
  day: string
  active: boolean
  start: string
  end: string
  location: string
  focus: string
}

export type DatedTraining = {
  id: string
  dateIso: string
  day: string
  time: string
  location: string
  focus: string
  status: 'ja' | 'nee'
  note?: string
}

export type TeamEventItem = {
  id: string
  slug: string
  title: string
  date: string
  time: string
  endDate?: string
  endTime?: string
  place: string
  description: string
  emoji: string
  rsvpOpen: boolean
  visible: boolean
}

export type InfoItem = {
  kind: string
  title: string
  text: string
  link?: string
  order: number
}

export type MatchAfspraken = {
  title: string
  bullets: string[]
  draaischema: {
    title: string
    bullets: string[]
  }
}

export type HerfststageInfo = {
  title: string
  tariff: string
  iban: string
  mededeling: string
  notes: string[]
  formUrl: string
} | null
