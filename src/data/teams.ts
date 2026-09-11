export type TeamGroup =
  | 'future'
  | 'u10'
  | 'u12'
  | 'u14'
  | 'u16'
  | 'u18'
  | 'u21'
  | 'seniors'
  | 'wheelchair'
  | 'fun'

export type TeamCoach = {
  name: string
  role?: string
}

export type TeamTraining = {
  day: string
  time?: string
  location?: string
  raw?: string
}

export type Team = {
  slug: string
  name: string
  category: string
  group: TeamGroup
  note?: string
  /** Coaches/staff scraped from the live Academy site (empty if not published). */
  coaches?: TeamCoach[]
  /** Training slots scraped from the live Academy site (empty if not published). */
  trainings?: TeamTraining[]
  /** Training / home hall if published on the old site. */
  location?: string
  /** Honest note when schedule/coaches are missing on the source site. */
  trainingNote?: string
}

export const groupLabels: Record<TeamGroup, string> = {
  future: 'Future Bears (U06–U08)',
  u10: 'U10',
  u12: 'U12',
  u14: 'U14',
  u16: 'U16',
  u18: 'U18',
  u21: 'U21',
  seniors: 'Seniors & Masters',
  wheelchair: 'Rolstoelbasket (JBOW / LBOW)',
  fun: 'BB4FUN',
}

export const groupOrder: TeamGroup[] = [
  'future',
  'u10',
  'u12',
  'u14',
  'u16',
  'u18',
  'u21',
  'seniors',
  'wheelchair',
  'fun',
]


export const teams: Team[] = [
  { slug: "u06", name: "U06", category: "Future Bears", group: "future",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "u07-a", name: "U07 A", category: "Future Bears", group: "future",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "u07-b", name: "U07 B", category: "Future Bears", group: "future",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "u08-a", name: "U08 A", category: "Future Bears", group: "future",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "u08-b", name: "U08 B", category: "Future Bears", group: "future",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "u10-a", name: "U10 A", category: "U10", group: "u10",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "u10-b", name: "U10 B", category: "U10", group: "u10",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "u10-c", name: "U10 C", category: "U10", group: "u10",
    note: "Jeugdbasket van de Leuven Bears: dribbels, dunk-dromen en high-fives. #WEBEARS — ouders juichen, kids scoren (of bijna).",
    location: "Campus Redingenhof",
    coaches: [
      { name: "Jonathan Degros", role: "Coach" },
      { name: "Rafa Gálvez Vizcaíno", role: "Coach" },
      { name: "Els", role: "Ploegafgevaardigde" },
    ],
    trainings: [
      { day: "Maandag", time: "17:30–19:00", location: "Heilig-Hart Heverlee" },
      { day: "Donderdag", time: "17:30–19:00", location: "Campus Redingenhof (Leuven)" },
    ],
  },
  { slug: "u10-d", name: "U10 D", category: "U10", group: "u10",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "u12-a", name: "U12 A", category: "U12", group: "u12",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "u12-b", name: "U12 B", category: "U12", group: "u12",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "u12-c", name: "U12 C", category: "U12", group: "u12",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "u12-d", name: "U12 D", category: "U12", group: "u12",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "u14-a", name: "U14 A", category: "U14", group: "u14",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "u14-b", name: "U14 B", category: "U14", group: "u14",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "u14-c", name: "U14 C", category: "U14", group: "u14",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "u14-d", name: "U14 D", category: "U14", group: "u14",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "u16-a", name: "U16 A", category: "U16", group: "u16",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "u16-b", name: "U16 B", category: "U16", group: "u16",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "u16-c", name: "U16 C", category: "U16", group: "u16",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "u16-d", name: "U16 D", category: "U16", group: "u16",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "u18-a", name: "U18 A", category: "U18", group: "u18",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "u18-b", name: "U18 B", category: "U18", group: "u18",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "u18-c", name: "U18 C", category: "U18", group: "u18",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "u18-d", name: "U18 D", category: "U18", group: "u18",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "u21-a", name: "U21 A", category: "U21", group: "u21",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "u21-b", name: "U21 B", category: "U21", group: "u21",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "u21-c", name: "U21 C", category: "U21", group: "u21",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "hse-a", name: "HSE A", category: "Heren Seniors", group: "seniors",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "hse-b", name: "HSE B", category: "Heren Seniors", group: "seniors",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "hse-c", name: "HSE C", category: "Heren Seniors", group: "seniors",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "hse-d", name: "HSE D", category: "Heren Seniors", group: "seniors",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "hse-e", name: "HSE E", category: "Heren Seniors", group: "seniors",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "hse-r", name: "HSE R", category: "Heren Seniors", group: "seniors",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "dse-a", name: "DSE A", category: "Dames Seniors", group: "seniors",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "m19-a", name: "M19 A", category: "Masters 35+", group: "seniors",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "jbow", name: "JBOW", category: "Jeugd rolstoelbasket", group: "wheelchair",
    note: "Jeugd rolstoelbasketbal — onderdeel van LBOW / inclusie.",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "lbow-a", name: "LBOW A", category: "Leuven Bears On Wheels", group: "wheelchair",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "lbow-b", name: "LBOW B", category: "Leuven Bears On Wheels", group: "wheelchair",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "lbow-c", name: "LBOW C", category: "Leuven Bears On Wheels", group: "wheelchair",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "lbow-ini", name: "LBOW INI", category: "Leuven Bears On Wheels — initiatie", group: "wheelchair",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "bb4fun-14", name: "BB4FUN -14", category: "BB4FUN", group: "fun",
    note: "Recreatief basket voor jongeren tot 14 jaar.",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
  { slug: "bb4fun-plus-14", name: "BB4FUN +14", category: "BB4FUN", group: "fun",
    note: "Recreatief >14 (U16/U18/U21/Seniors): beperkt wedstrijden, geen mutaties.",
    trainingNote: "Nog geen trainingsinfo op de oude site" },
]

export function getTeamBySlug(slug: string): Team | undefined {
  return teams.find((t) => t.slug === slug)
}

export function teamsByGroup(group: TeamGroup): Team[] {
  return teams.filter((t) => t.group === group)
}
