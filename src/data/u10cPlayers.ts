/** First names + numbers from the official U10 C site (leuvenbears-u10c.be). */
export type U10cPlayerRef = {
  firstName: string
  number: number
}

export const u10cPlayers: U10cPlayerRef[] = [
  { firstName: 'Alfred', number: 1 },
  { firstName: 'Ilya', number: 2 },
  { firstName: 'Elias', number: 3 },
  { firstName: 'Felix', number: 4 },
  { firstName: 'Sam', number: 5 },
  { firstName: 'Bas D', number: 6 },
  { firstName: 'Jarne', number: 7 },
  { firstName: 'Charlie', number: 8 },
  { firstName: 'Jia Le', number: 9 },
  { firstName: 'Bas N', number: 10 },
  { firstName: 'Jacob', number: 11 },
  { firstName: 'Thomas', number: 12 },
]

export const u10cSiteSpelersUrl = 'https://www.leuvenbears-u10c.be/spelers'
