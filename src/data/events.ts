export type ClubEvent = {
  id: string
  title: string
  dateLabel: string
  start?: string
  end?: string
  location?: string
  description: string
  kind: 'season' | 'tournament' | 'fundraiser' | 'fan' | 'match'
}

export const events: ClubEvent[] = [
  {
    id: 'upcoming-home-2026-09-12',
    title: 'Opkomende thuiswedstrijden',
    dateLabel: 'Zaterdag 12/09/2026 · 09:00',
    start: '2026-09-12',
    location: 'Stedelijke Sportzaal Wilsele Centrum',
    description:
      'Thuiswedstrijden in Wilsele Centrum. Check je ploegkalender voor exacte tip-off per team.',
    kind: 'match',
  },
  {
    id: 'fandag-2026',
    title: 'FANDAG 2026',
    dateLabel: 'Zondag 06/09/2026 · 10:00–19:00',
    start: '2026-09-06',
    description: 'Club fandag voor supporters, families en Academy-spelers.',
    kind: 'fan',
  },
  {
    id: 'crelan-masters-2026',
    title: 'CRELAN MASTERS',
    dateLabel: 'Zondag 19/07/2026',
    start: '2026-07-19',
    description: 'Crelan Masters — masters-evenement van de club.',
    kind: 'tournament',
  },
  {
    id: 'camping-c3-2026',
    title: 'Camping C3 Rock Werchter',
    dateLabel: '02/07–05/07/2026',
    start: '2026-07-02',
    end: '2026-07-05',
    description:
      'Camping C3 tijdens Rock Werchter. Opbrengst ten voordele van de club. Medewerkersinfo via de nieuwsberichten.',
    kind: 'fundraiser',
  },
  {
    id: 'fun-on-wheels-2026',
    title: 'FUN ON WHEELS',
    dateLabel: 'Zaterdag 20/06–zondag 21/06/2026',
    start: '2026-06-20',
    end: '2026-06-21',
    location: 'Redingenhof',
    description:
      'Rolstoelbasketbaltoernooi met focus op inclusie. Editie 2026 was een succes met 16 ploegen.',
    kind: 'tournament',
  },
  {
    id: 'seizoen-note-apr-2026',
    title: 'Seizoensnota (apr 2026)',
    dateLabel: '15/04–22/04/2026',
    start: '2026-04-15',
    end: '2026-04-22',
    description:
      'Seizoensperiode / nota zoals aangekondigd op de Academy-site (15–22 april 2026).',
    kind: 'season',
  },
]
