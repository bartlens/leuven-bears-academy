import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { AcademyPlayer } from '../data/demoPlayers'
import { useTeamSheetDataOptional } from '../sheet/TeamSheetProvider'
import { useIdleFun } from '../fun/IdleFunContext'
import {
  isAudioUnlocked,
  playIdleBallBounce,
  playIdleFootstep,
  playRosterGiggleBurst,
  playStaffClickSound,
  subscribeAudioUnlock,
  unlockAudio,
} from '../audio/playerClickSound'
import { IdleSideFigure } from './IdleSideFigure'
import { StaffFigure } from './StaffFigure'

type Phase = 'ball' | 'peek' | 'walk-in' | 'pickup' | 'walk-out' | 'done'

type Scene = {
  key: number
  player: AcademyPlayer
  /** Ball settle X as % of viewport width */
  ballXPct: number
  enterFrom: 'left' | 'right'
}

const IDLE_FIRST_MS = 10_000
const IDLE_MS = 20_000
const COOLDOWN_MS = 45_000
const PEEK_MS = 1100
const WALK_IN_MS = 1700
const PICKUP_MS = 700
const WALK_OUT_MS = 2000
const LAUGH_MS = 4200
/** On /spelers: Jonathan appears this many ms before pickup */
const COACH_LEAD_MS = 380
/** Hold coach whistle beat before walk-out */
const WHISTLE_MS = 950

/** Floor as fraction of viewport height from top */
const FLOOR_Y = 0.86
const GRAVITY = 2800 // px/s^2
const RESTITUTION = 0.62
const SETTLE_VY = 90

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function pickScene(key: number, roster: AcademyPlayer[]): Scene | null {
  if (roster.length === 0) return null
  const player = roster[Math.floor(Math.random() * roster.length)]!
  return {
    key,
    player,
    ballXPct: 34 + Math.random() * 32,
    enterFrom: Math.random() < 0.5 ? 'left' : 'right',
  }
}

export function IdleBallEasterEgg() {
  const location = useLocation()
  const sheet = useTeamSheetDataOptional()
  const roster = sheet?.players ?? []
  const jonathan =
    sheet?.staff.find((s) => /jonathan/i.test(s.name) || s.id === 'jonathan') ??
    sheet?.staff.find((s) => s.outfit === 'coach') ??
    null
  const { setRosterLaughing } = useIdleFun()
  const enabled = Boolean(sheet && roster.length > 0)
  const [scene, setScene] = useState<Scene | null>(null)
  const [phase, setPhase] = useState<Phase | null>(null)
  const [holding, setHolding] = useState(false)
  const [glance, setGlance] = useState(false)
  const [showCoach, setShowCoach] = useState(false)
  const [coachBlowing, setCoachBlowing] = useState(false)
  const [ballStyle, setBallStyle] = useState<{
    left: number
    top: number
    rot: number
    visible: boolean
  } | null>(null)

  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const phaseTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const lastFinishedAt = useRef(0)
  const running = useRef(false)
  const sceneKey = useRef(0)
  const pathRef = useRef(location.pathname)
  const idlePlayedOnPath = useRef(false)
  const idlePathRef = useRef(location.pathname)
  const rafRef = useRef(0)
  const physics = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    rot: 0,
    alive: false,
    bounces: 0,
  })

  pathRef.current = location.pathname

  const clearPhaseTimers = () => {
    for (const t of phaseTimers.current) clearTimeout(t)
    phaseTimers.current = []
  }

  const clearIdle = () => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current)
      idleTimer.current = null
    }
  }

  const stopPhysics = () => {
    physics.current.alive = false
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
  }

  const scheduleIdle = () => {
    clearIdle()
    if (prefersReducedMotion()) return
    // Browsers block sound until a gesture unlocks AudioContext.
    // Don't start the idle clock until audio is ready — otherwise the
    // animation plays silently on a fresh page load.
    if (!isAudioUnlocked()) return
    const delay = idlePlayedOnPath.current ? IDLE_MS : IDLE_FIRST_MS
    idleTimer.current = setTimeout(() => startScene(), delay)
  }

  const finish = () => {
    running.current = false
    stopPhysics()
    clearPhaseTimers()
    setHolding(false)
    setGlance(false)
    setShowCoach(false)
    setCoachBlowing(false)
    setBallStyle(null)
    setScene(null)
    setPhase(null)
    setRosterLaughing(false)
    lastFinishedAt.current = performance.now()
    scheduleIdle()
  }

  const startWalkerPhases = (_next: Scene, seed: number) => {
    const onSpelers = /^\/team\/[^/]+\/spelers/.test(pathRef.current)
    setPhase('peek')
    setGlance(true)
    setShowCoach(false)
    setCoachBlowing(false)

    const tPeek = PEEK_MS
    const tWalk = tPeek + WALK_IN_MS
    // On Spelers: whistle beat after pickup, then walk back while roster laughs
    const tWhistle = onSpelers ? tWalk + WHISTLE_MS : tWalk + PICKUP_MS
    const tPickDone = onSpelers ? tWhistle : tWalk + PICKUP_MS
    const tOut = tPickDone + WALK_OUT_MS
    const tCoach = Math.max(tPeek + 200, tWalk - COACH_LEAD_MS)

    phaseTimers.current.push(
      setTimeout(() => {
        setPhase('walk-in')
        setGlance(false)
        for (let i = 0; i < 5; i++) {
          phaseTimers.current.push(
            setTimeout(() => playIdleFootstep(seed + 20 + i), i * 320),
          )
        }
      }, tPeek),
    )

    if (onSpelers) {
      // Almost at the ball → Jonathan peeks from the opposite edge + one whistle
      phaseTimers.current.push(
        setTimeout(() => {
          setShowCoach(true)
          setCoachBlowing(true)
          if (jonathan) playStaffClickSound(jonathan)
          phaseTimers.current.push(
            setTimeout(() => setCoachBlowing(false), WHISTLE_MS + 200),
          )
        }, tCoach),
      )
    }

    phaseTimers.current.push(
      setTimeout(() => {
        setPhase('pickup')
        setHolding(true)
        setBallStyle(null)
      }, tWalk),
      setTimeout(() => {
        setPhase('walk-out')
        if (onSpelers) {
          setRosterLaughing(true)
          playRosterGiggleBurst()
          phaseTimers.current.push(
            setTimeout(() => setRosterLaughing(false), LAUGH_MS),
          )
        }
        for (let i = 0; i < 6; i++) {
          phaseTimers.current.push(
            setTimeout(() => playIdleFootstep(seed + 40 + i), i * 300),
          )
        }
        phaseTimers.current.push(
          setTimeout(() => setGlance(true), 400),
          setTimeout(() => setGlance(false), 750),
          setTimeout(() => setGlance(true), 1200),
          setTimeout(() => setGlance(false), 1550),
        )
      }, tPickDone),
      setTimeout(() => finish(), tOut),
    )
  }

  const startBallPhysics = (next: Scene, seed: number) => {
    const w = window.innerWidth
    const h = window.innerHeight
    const floor = h * FLOOR_Y
    const x = (next.ballXPct / 100) * w
    // Start above the viewport
    physics.current = {
      x,
      y: -60,
      vx: (Math.random() - 0.5) * 40,
      vy: 420 + Math.random() * 120,
      rot: 0,
      alive: true,
      bounces: 0,
    }
    setBallStyle({ left: x, top: -60, rot: 0, visible: true })

    let last = performance.now()
    const tick = (now: number) => {
      if (!physics.current.alive) return
      const dt = Math.min(0.032, (now - last) / 1000)
      last = now
      const p = physics.current
      p.vy += GRAVITY * dt
      p.y += p.vy * dt
      p.x += p.vx * dt
      p.rot += p.vx * dt * 0.4 + p.vy * dt * 0.05

      // Soft side walls
      if (p.x < 40) {
        p.x = 40
        p.vx = Math.abs(p.vx) * 0.4
      } else if (p.x > w - 40) {
        p.x = w - 40
        p.vx = -Math.abs(p.vx) * 0.4
      }

      if (p.y >= floor) {
        p.y = floor
        if (Math.abs(p.vy) > SETTLE_VY) {
          p.vy = -Math.abs(p.vy) * RESTITUTION
          p.vx *= 0.92
          p.bounces += 1
          const strength = Math.max(0.15, Math.pow(RESTITUTION, p.bounces - 1))
          playIdleBallBounce(seed + p.bounces, strength)
        } else {
          // Settled
          p.vy = 0
          p.vx *= 0.8
          p.y = floor
          if (Math.abs(p.vx) < 8) {
            p.alive = false
            setBallStyle({ left: p.x, top: p.y, rot: p.rot, visible: true })
            startWalkerPhases(next, seed)
            return
          }
        }
      }

      setBallStyle({ left: p.x, top: p.y, rot: p.rot, visible: true })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const startScene = () => {
    if (running.current) return
    if (prefersReducedMotion()) return
    if (document.hidden) return
    if (!isAudioUnlocked()) {
      scheduleIdle()
      return
    }
    if (performance.now() - lastFinishedAt.current < COOLDOWN_MS && lastFinishedAt.current > 0) {
      scheduleIdle()
      return
    }

    running.current = true
    idlePlayedOnPath.current = true
    clearIdle()
    clearPhaseTimers()
    stopPhysics()
    sceneKey.current += 1
    const next = pickScene(sceneKey.current, roster)
    if (!next) return
    setScene(next)
    setHolding(false)
    setGlance(false)
    setShowCoach(false)
    setCoachBlowing(false)
    setPhase('ball')
    void unlockAudio()

    const seed = next.player.number * 7 + next.key
    phaseTimers.current.push(setTimeout(() => void unlockAudio(), 0))
    startBallPhysics(next, seed)
  }

  const bumpActivity = () => {
    void unlockAudio()
    if (running.current) return
    scheduleIdle()
  }

  useEffect(() => {
    // When audio becomes unlocked (first tap/click), arm the idle timer
    const unsub = subscribeAudioUnlock(() => {
      scheduleIdle()
    })
    if (isAudioUnlocked()) scheduleIdle()

    const opts: AddEventListenerOptions = { passive: true }
    const warm = () => {
      void unlockAudio().then((ok) => {
        if (ok) scheduleIdle()
      })
    }
    for (const ev of ['pointerdown', 'keydown', 'touchstart'] as const) {
      window.addEventListener(ev, warm, opts)
    }
    const events: (keyof WindowEventMap)[] = [
      'pointerdown',
      'keydown',
      'scroll',
      'touchstart',
      'mousemove',
      'wheel',
    ]
    for (const ev of events) window.addEventListener(ev, bumpActivity, opts)
    const onVis = () => {
      if (document.hidden) clearIdle()
      else bumpActivity()
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      unsub()
      clearIdle()
      clearPhaseTimers()
      stopPhysics()
      for (const ev of ['pointerdown', 'keydown', 'touchstart'] as const) {
        window.removeEventListener(ev, warm)
      }
      for (const ev of events) window.removeEventListener(ev, bumpActivity)
      document.removeEventListener('visibilitychange', onVis)
      setRosterLaughing(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (idlePathRef.current !== location.pathname) {
      idlePathRef.current = location.pathname
      idlePlayedOnPath.current = false
    }
    if (!running.current) scheduleIdle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  if (!scene || !phase || phase === 'done') return null

  const showBall =
    ballStyle?.visible &&
    (phase === 'ball' || phase === 'peek' || phase === 'walk-in')
  const showWalker =
    phase === 'peek' ||
    phase === 'walk-in' ||
    phase === 'pickup' ||
    phase === 'walk-out'

  // peek/walk-in: face toward ball; walk-out: face back toward exit
  const facing: 'left' | 'right' =
    phase === 'walk-out'
      ? scene.enterFrom
      : scene.enterFrom === 'left'
        ? 'right'
        : 'left'

    if (!enabled) return null

  return (
    <div className="idle-fun" aria-hidden="true">
      {showBall && ballStyle && (
        <span
          className="idle-fun__ball idle-fun__ball--physics"
          style={{
            left: ballStyle.left,
            top: ballStyle.top,
            transform: `translate(-50%, -50%) rotate(${ballStyle.rot}deg)`,
          }}
        >
          <svg viewBox="0 0 40 40" className="idle-fun__ball-svg">
            <circle cx="20" cy="20" r="17" fill="#f38019" />
            <path
              d="M20 3.5 V36.5 M3.5 20 H36.5 M8 9 Q20 14 32 9 M8 31 Q20 26 32 31"
              fill="none"
              stroke="#1a120e"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </span>
      )}

      {showWalker && (
        <span
          className={`idle-fun__walker idle-fun__walker--${scene.enterFrom} idle-fun__walker--${phase} ${
            holding ? 'is-holding' : ''
          }`}
          style={{ ['--ball-x' as string]: `${scene.ballXPct}%` }}
        >
          <IdleSideFigure
            player={scene.player}
            facing={facing}
            glance={glance || phase === 'peek'}
            holding={holding}
            className="idle-fun__walker-svg"
          />
        </span>
      )}

      {showCoach && jonathan && (
        <span
          className={`idle-fun__coach idle-fun__coach--${
            scene.enterFrom === 'left' ? 'right' : 'left'
          }${coachBlowing ? ' is-blowing' : ''}`}
        >
          <StaffFigure staff={jonathan} className="idle-fun__coach-svg" />
        </span>
      )}
    </div>
  )
}
