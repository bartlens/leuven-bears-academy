import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react'
import {
  AGE_SCALE,
  isTinyKid,
  type AcademyPlayer,
} from '../data/demoPlayers'
import { playHihiGiggle, unlockAudio } from '../audio/playerClickSound'
import { PlayerFigure } from './PlayerFigure'

/** Fun modes: cheer, Mexican wave, dribble-across, human-stair dunk. */
type Mode = 'party' | 'wave' | 'dribble' | 'dunk'

type DunkRoles = {
  stairs: AcademyPlayer[]
  climber: AcademyPlayer
  crowd: AcademyPlayer[]
}

type Burst = {
  key: number
  mode: Mode
  cast: AcademyPlayer[]
  laughingIds: Set<string>
  fallingIds: Set<string>
  reduced: boolean
  dribbleRtl: boolean
  dunk?: DunkRoles
}

const DEBOUNCE_MS = 900
const BURST_DURATION_MS = 3800
const WELCOME_DELAY_MS = 3000
const WAVE_MIN = 8
const DUNK_MIN = 6

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

function byAgeAsc(a: AcademyPlayer, b: AcademyPlayer): number {
  return (AGE_SCALE[a.ageGroup] ?? 1) - (AGE_SCALE[b.ageGroup] ?? 1)
}

function pickCast(mode: Mode, roster: AcademyPlayer[]): AcademyPlayer[] {
  const shuffled = shuffle(roster)
  if (mode === 'party') {
    const n = Math.max(8, shuffled.length - Math.floor(Math.random() * 3))
    return shuffled.slice(0, Math.min(n, shuffled.length))
  }
  if (mode === 'wave') return shuffled.slice(0, Math.min(shuffled.length, 24))
  if (mode === 'dribble') {
    const n = Math.min(shuffled.length, 6 + Math.floor(Math.random() * 6))
    return shuffled.slice(0, Math.max(4, n))
  }
  // dunk: use most of roster for stairs + climber + crowd
  return shuffled.slice(0, Math.min(shuffled.length, 18))
}

function assignDunkRoles(cast: AcademyPlayer[]): DunkRoles {
  const sorted = [...cast].sort(byAgeAsc)
  // Prefer a tiny kid as climber; else smallest
  const tinyIdx = sorted.findIndex((p) => isTinyKid(p.ageGroup))
  const climber = tinyIdx >= 0 ? sorted[tinyIdx]! : sorted[0]!
  const rest = sorted.filter((p) => p.id !== climber.id)
  const stairCount = Math.min(4, Math.max(3, rest.length - 2))
  const stairs = rest.slice(0, stairCount) // small → larger already
  const crowd = rest.slice(stairCount)
  return { stairs, climber, crowd }
}

function pickLaughers(cast: AcademyPlayer[]): Set<string> {
  const ids = new Set<string>()
  for (const p of cast) {
    if (Math.random() < 0.55) ids.add(p.id)
  }
  if (ids.size === 0 && cast[0]) ids.add(cast[0].id)
  return ids
}

function pickFallers(cast: AcademyPlayer[], mode: Mode): Set<string> {
  const ids = new Set<string>()
  // Dunk: skip falls on stairs/climber; occasional on crowd only
  const chance =
    mode === 'wave' ? 0.18 : mode === 'dunk' ? 0.22 : 0.38
  for (const p of cast) {
    if (isTinyKid(p.ageGroup) && Math.random() < chance) ids.add(p.id)
  }
  return ids
}

/** Cycle: party → wave? → dribble → dunk? → party… */
function nextClickMode(prev: Mode | null, rosterSize: number): Mode {
  const canWave = rosterSize >= WAVE_MIN
  const canDunk = rosterSize >= DUNK_MIN
  const order: Mode[] = ['party', 'wave', 'dribble', 'dunk']
  const start = prev ? order.indexOf(prev) + 1 : 0
  for (let i = 0; i < order.length; i++) {
    const m = order[(start + i) % order.length]!
    if (m === 'wave' && !canWave) continue
    if (m === 'dunk' && !canDunk) continue
    return m
  }
  return 'party'
}

function partySlots(count: number) {
  /* Tight cluster around the title — close together, still a lively blob */
  const base: { left: number; top: number; scale: number }[] = [
    { left: 34, top: 50, scale: 0.96 },
    { left: 42, top: 30, scale: 0.9 },
    { left: 50, top: 56, scale: 1 },
    { left: 50, top: 22, scale: 0.92 },
    { left: 58, top: 52, scale: 0.97 },
    { left: 66, top: 32, scale: 0.9 },
    { left: 68, top: 50, scale: 0.94 },
    { left: 38, top: 68, scale: 0.86 },
    { left: 50, top: 72, scale: 0.88 },
    { left: 62, top: 68, scale: 0.86 },
    { left: 42, top: 42, scale: 0.84 },
    { left: 58, top: 40, scale: 0.84 },
  ]
  const slots = [...base]
  for (let i = base.length; i < count; i++) {
    const angle = ((i * 137.508) % 360) * (Math.PI / 180)
    const ring = 12 + (i % 4) * 5
    slots.push({
      left: Math.max(28, Math.min(72, 50 + Math.cos(angle) * ring)),
      top: Math.max(18, Math.min(76, 50 + Math.sin(angle) * ring * 0.7)),
      scale: 0.78 + (i % 5) * 0.035,
    })
  }
  return slots.slice(0, count).map((s, i) => ({
    left: `${s.left}%`,
    top: `${s.top}%`,
    delay: `${i * 0.035}s`,
    scale: s.scale,
  }))
}

function waveSlots(count: number) {
  const rows = count >= 16 ? 3 : 2
  const perRow = Math.ceil(count / rows)
  const rowTops = rows === 3 ? [22, 52, 82] : [28, 72]
  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / perRow)
    const col = i % perRow
    const left = 6 + (col / Math.max(1, perRow - 1)) * 88
    const top = rowTops[Math.min(row, rowTops.length - 1)]! + (col % 2) * 3
    return {
      left: `${left}%`,
      top: `${top}%`,
      delay: `${col * 0.12 + row * 0.04}s`,
      scale: 0.78 + row * 0.06,
    }
  })
}

function dribbleSlots(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    top: `${18 + (i % 5) * 16}%`,
    delay: `${i * 0.18}s`,
    scale: 0.85 + (i % 3) * 0.05,
  }))
}

/** Side/¾ stair: small→large rising left→right, climber starts left. */
function dunkStairSlots(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const t = count <= 1 ? 0 : i / (count - 1)
    return {
      left: `${28 + t * 32}%`,
      top: `${78 - t * 28}%`,
      delay: `${0.05 + i * 0.06}s`,
      scale: 0.85 + t * 0.12,
      z: i + 1,
    }
  })
}

function dunkCrowdSlots(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    left: `${8 + (i % 6) * 15}%`,
    top: `${12 + Math.floor(i / 6) * 22 + (i % 2) * 6}%`,
    delay: `${0.9 + i * 0.05}s`,
    scale: 0.75 + (i % 3) * 0.05,
  }))
}

const CONFETTI = ['🐻', '🏀', '🧡', '⭐', '🎉']

type Props = {
  name: string
  category: string
  players: AcademyPlayer[]
  autoWelcome?: boolean
  className?: string
}

export function HeroTitlePeek({
  name,
  category,
  players,
  autoWelcome = true,
  className = '',
}: Props) {
  const [burst, setBurst] = useState<Burst | null>(null)
  const lastAt = useRef(0)
  const hasSeenFirst = useRef(false)
  const lastClickMode = useRef<Mode | null>(null)
  const dribbleRtl = useRef(false)
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const giggleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const burstKey = useRef(0)
  const labelId = useId()
  const rosterRef = useRef(players)
  rosterRef.current = players

  useEffect(() => {
    return () => {
      if (clearTimer.current) clearTimeout(clearTimer.current)
      if (giggleTimer.current) clearTimeout(giggleTimer.current)
    }
  }, [])

  const runBurst = useCallback(
    (mode: Mode, cast: AcademyPlayer[], opts?: { giggleChance?: number }) => {
      if (cast.length === 0) return
      const reduced = prefersReducedMotion()
      const dunk = mode === 'dunk' ? assignDunkRoles(cast) : undefined
      let fallingIds = pickFallers(cast, mode)
      // Never tumble the stair bodies or climber mid-dunk
      if (dunk) {
        const protect = new Set([dunk.climber.id, ...dunk.stairs.map((p) => p.id)])
        fallingIds = new Set([...fallingIds].filter((id) => !protect.has(id)))
      }
      if (mode === 'dribble') dribbleRtl.current = !dribbleRtl.current

      burstKey.current += 1
      const next: Burst = {
        key: burstKey.current,
        mode,
        cast,
        laughingIds: pickLaughers(cast),
        fallingIds,
        reduced,
        dribbleRtl: dribbleRtl.current,
        dunk,
      }

      if (clearTimer.current) clearTimeout(clearTimer.current)
      if (giggleTimer.current) clearTimeout(giggleTimer.current)
      setBurst(next)
      void unlockAudio()

      const giggleChance = opts?.giggleChance ?? 0.45
      if (Math.random() < giggleChance) {
        const seed =
          cast.reduce((a, p) => a + p.number * 13, 0) + burstKey.current * 7
        giggleTimer.current = setTimeout(() => playHihiGiggle(seed), 180 + Math.floor(Math.random() * 220))
      }

      const dur = reduced ? 500 : BURST_DURATION_MS
      clearTimer.current = setTimeout(() => {
        setBurst((cur) => (cur?.key === next.key ? null : cur))
      }, dur)
    },
    [],
  )

  const trigger = useCallback(() => {
    const roster = rosterRef.current
    if (roster.length === 0) return
    const now = performance.now()
    if (now - lastAt.current < DEBOUNCE_MS) return
    lastAt.current = now
    hasSeenFirst.current = true
    const mode = nextClickMode(lastClickMode.current, roster.length)
    lastClickMode.current = mode
    runBurst(mode, pickCast(mode, roster))
  }, [runBurst])

  useEffect(() => {
    if (!autoWelcome) return
    if (prefersReducedMotion()) return
    if (rosterRef.current.length === 0) return
    const welcome = setTimeout(() => {
      if (hasSeenFirst.current) return
      hasSeenFirst.current = true
      lastAt.current = performance.now()
      lastClickMode.current = 'party'
      runBurst('party', [...rosterRef.current], { giggleChance: 0.7 })
    }, WELCOME_DELAY_MS)
    return () => clearTimeout(welcome)
  }, [runBurst, autoWelcome])

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      trigger()
    }
  }

  const partyPos = burst?.mode === 'party' ? partySlots(burst.cast.length) : []
  const wavePos = burst?.mode === 'wave' ? waveSlots(burst.cast.length) : []
  const dribblePos = burst?.mode === 'dribble' ? dribbleSlots(burst.cast.length) : []
  const stairPos =
    burst?.mode === 'dunk' && burst.dunk
      ? dunkStairSlots(burst.dunk.stairs.length)
      : []
  const crowdPos =
    burst?.mode === 'dunk' && burst.dunk
      ? dunkCrowdSlots(burst.dunk.crowd.length)
      : []

  const figClass = (player: AcademyPlayer, base: string, reduced: boolean) => {
    const laugh = burst?.laughingIds.has(player.id) ? ' is-laughing' : ''
    const fall = burst?.fallingIds.has(player.id) ? ' is-falling' : ''
    const red = reduced ? ' is-reduced' : ''
    return `hero-title-peek__fig ${base}${laugh}${fall}${red}`
  }

  const titleClass =
    className ||
    'hero-title-peek font-display text-4xl font-black leading-[1.05] tracking-tight text-cream break-words sm:text-5xl lg:text-6xl'

  return (
    <h1 id={labelId} className={titleClass}>
      <span
        role="button"
        tabIndex={0}
        aria-label="Laat de beren juichen, golven, dribbelen of dunken"
        aria-describedby={labelId}
        onClick={trigger}
        onKeyDown={onKeyDown}
        className="hero-title-peek__hit relative inline-block cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-hoop focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
      >
        {burst && !burst.reduced && (
          <span
            className={`hero-title-peek__stage hero-title-peek__stage--${burst.mode} pointer-events-none absolute z-0 overflow-visible`}
            aria-hidden="true"
          >
            {burst.mode === 'party' &&
              burst.cast.map((player, i) => {
                const slot = partyPos[i]!
                const figScale = slot.scale * (AGE_SCALE[player.ageGroup] ?? 1)
                return (
                  <span
                    key={`${burst.key}-${player.id}`}
                    className={figClass(player, 'hero-title-peek__fig--party', burst.reduced)}
                    style={
                      {
                        left: slot.left,
                        top: slot.top,
                        animationDelay: slot.delay,
                        '--fig-scale': String(figScale),
                      } as CSSProperties
                    }
                  >
                    <PlayerFigure player={player} className="hero-title-peek__svg" />
                  </span>
                )
              })}

            {burst.mode === 'wave' &&
              burst.cast.map((player, i) => {
                const slot = wavePos[i]!
                const figScale = slot.scale * (AGE_SCALE[player.ageGroup] ?? 1)
                return (
                  <span
                    key={`${burst.key}-${player.id}`}
                    className={figClass(player, 'hero-title-peek__fig--wave', burst.reduced)}
                    style={
                      {
                        left: slot.left,
                        top: slot.top,
                        animationDelay: slot.delay,
                        '--fig-scale': String(figScale),
                      } as CSSProperties
                    }
                  >
                    <PlayerFigure player={player} className="hero-title-peek__svg" />
                  </span>
                )
              })}

            {burst.mode === 'dribble' &&
              burst.cast.map((player, i) => {
                const slot = dribblePos[i]!
                const figScale = slot.scale * (AGE_SCALE[player.ageGroup] ?? 1)
                const dir = burst.dribbleRtl
                  ? 'hero-title-peek__fig--dribble-rtl'
                  : 'hero-title-peek__fig--dribble-ltr'
                return (
                  <span
                    key={`${burst.key}-${player.id}`}
                    className={figClass(
                      player,
                      `hero-title-peek__fig--dribble ${dir}`,
                      burst.reduced,
                    )}
                    style={
                      {
                        top: slot.top,
                        animationDelay: slot.delay,
                        '--fig-scale': String(figScale),
                      } as CSSProperties
                    }
                  >
                    <PlayerFigure player={player} className="hero-title-peek__svg" />
                  </span>
                )
              })}

            {burst.mode === 'dunk' && burst.dunk && (
              <>
                {burst.dunk.stairs.map((player, i) => {
                  const slot = stairPos[i]!
                  const figScale = slot.scale * (AGE_SCALE[player.ageGroup] ?? 1)
                  return (
                    <span
                      key={`${burst.key}-stair-${player.id}`}
                      className={figClass(
                        player,
                        'hero-title-peek__fig--dunk-stair',
                        burst.reduced,
                      )}
                      style={
                        {
                          left: slot.left,
                          top: slot.top,
                          animationDelay: slot.delay,
                          zIndex: slot.z,
                          '--fig-scale': String(figScale),
                        } as CSSProperties
                      }
                    >
                      <PlayerFigure player={player} className="hero-title-peek__svg" />
                    </span>
                  )
                })}
                {/* Climber starts at first stair, CSS climb anim handles dunk + look */}
                <span
                  key={`${burst.key}-climber-${burst.dunk.climber.id}`}
                  className={figClass(
                    burst.dunk.climber,
                    'hero-title-peek__fig--dunk-climber',
                    burst.reduced,
                  )}
                  style={
                    {
                      animationDelay: '0.15s',
                      zIndex: 10,
                      '--fig-scale': String(
                        0.95 * (AGE_SCALE[burst.dunk.climber.ageGroup] ?? 1),
                      ),
                    } as CSSProperties
                  }
                >
                  <PlayerFigure
                    player={burst.dunk.climber}
                    className="hero-title-peek__svg"
                  />
                </span>
                {burst.dunk.crowd.map((player, i) => {
                  const slot = crowdPos[i]!
                  const figScale = slot.scale * (AGE_SCALE[player.ageGroup] ?? 1)
                  return (
                    <span
                      key={`${burst.key}-crowd-${player.id}`}
                      className={figClass(
                        player,
                        'hero-title-peek__fig--dunk-crowd',
                        burst.reduced,
                      )}
                      style={
                        {
                          left: slot.left,
                          top: slot.top,
                          animationDelay: slot.delay,
                          '--fig-scale': String(figScale),
                        } as CSSProperties
                      }
                    >
                      <PlayerFigure player={player} className="hero-title-peek__svg" />
                    </span>
                  )
                })}
                {CONFETTI.map((emoji, i) => (
                  <span
                    key={`dc-${burst.key}-${i}`}
                    className="hero-title-peek__confetti"
                    style={{
                      left: `${55 + i * 8}%`,
                      top: '8%',
                      animationDelay: `${1.8 + i * 0.08}s`,
                    }}
                  >
                    {emoji}
                  </span>
                ))}
              </>
            )}

            {burst.mode === 'party' &&
              CONFETTI.map((emoji, i) => (
                <span
                  key={`c-${burst.key}-${i}`}
                  className="hero-title-peek__confetti"
                  style={{
                    left: `${12 + i * 18}%`,
                    animationDelay: `${0.1 + i * 0.08}s`,
                  }}
                >
                  {emoji}
                </span>
              ))}
          </span>
        )}

        <span className="relative z-10">{name} </span>
        <span className="hero-title-peek__cat relative z-10 inline-block overflow-visible">
          <span className="relative z-10 bg-gradient-to-r from-hoop via-hoop-bright to-warm bg-clip-text text-transparent">
            {category}
          </span>
        </span>
      </span>
    </h1>
  )
}
