// ============================================================
// VoiceprintResonatorBackground — "Listening Field"
// A unified background system that idles quietly and visibly
// reacts when the user interacts with auth forms.
// Colors: Uses unified design tokens — voice-active (#22D3EE), accent-primary (#3B82F6), accent-light (#60A5FA)
// ============================================================

import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface VoiceprintResonatorBackgroundProps {
  activityLevel?: number
}

// ── Types ────────────────────────────────────────────────────────
interface ListeningTick {
  x: number
  yOffset: number // irregular vertical offset from center
  targetHeight: number // driven by activity
  currentHeight: number // smoothed display height
  phase: number // per-bar random phase offset
  idleHeight: number // tiny resting height (2-5px)
}

interface DustDot {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  baseAlpha: number
  color: string
}

interface RingPulse {
  birth: number // frame when spawned
  maxRadius: number
  alpha: number
}

// ── Constants ────────────────────────────────────────────────────
const TICK_COUNT_PER_SIDE = 9
const DUST_COUNT = 8
const WAVE_POINTS_STEP = 5 // px between wave sample points
const MAX_MOUSE_DISPLACEMENT = 12
const RING_LIFETIME_FRAMES = 90 // ~1.5s at 60fps

const PALETTE = {
  cyan: '#22D3EE',
  blue: '#3B82F6',
  indigo: '#60A5FA',
  sky: '#93C5FD',
} as const

export function VoiceprintResonatorBackground({ activityLevel = 0 }: VoiceprintResonatorBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null })
  const activityRef = useRef(activityLevel)
  const prevActivityThreshold = useRef(0)

  useEffect(() => {
    activityRef.current = activityLevel
  }, [activityLevel])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    // ── Resize ──────────────────────────────────────────────────
    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
      initTicks()
      initDust()
    }
    window.addEventListener('resize', handleResize)

    // ── State ───────────────────────────────────────────────────
    let frame = 0
    let smoothedActivity = 0

    // ── 1. LISTENING TICKS (left + right flanks) ────────────────
    let leftTicks: ListeningTick[] = []
    let rightTicks: ListeningTick[] = []

    const initTicks = () => {
      const makeTicks = (side: 'left' | 'right'): ListeningTick[] => {
        const ticks: ListeningTick[] = []
        const margin = 30
        const zone = width * 0.22
        for (let i = 0; i < TICK_COUNT_PER_SIDE; i++) {
          // Irregular spacing: base spacing + random jitter
          const baseSpacing = zone / (TICK_COUNT_PER_SIDE + 1)
          const jitter = (Math.random() - 0.5) * baseSpacing * 0.6
          const localX = margin + baseSpacing * (i + 1) + jitter
          const x = side === 'left' ? localX : width - localX
          ticks.push({
            x,
            yOffset: (Math.random() - 0.5) * 30,
            targetHeight: 0,
            currentHeight: 0,
            phase: Math.random() * Math.PI * 2,
            idleHeight: 2 + Math.random() * 3,
          })
        }
        return ticks
      }
      leftTicks = makeTicks('left')
      rightTicks = makeTicks('right')
    }
    initTicks()

    // ── 2. AMBIENT DUST DOTS ────────────────────────────────────
    let dust: DustDot[] = []
    const dustColors = [PALETTE.cyan, PALETTE.sky, PALETTE.blue, PALETTE.indigo]

    const initDust = () => {
      dust = []
      for (let i = 0; i < DUST_COUNT; i++) {
        dust.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          radius: 1 + Math.random() * 1.2,
          baseAlpha: 0.08 + Math.random() * 0.12,
          color: dustColors[Math.floor(Math.random() * dustColors.length)],
        })
      }
    }
    initDust()

    // ── 3. RING PULSES ──────────────────────────────────────────
    let rings: RingPulse[] = []

    // ── Helpers ─────────────────────────────────────────────────
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    // ── Render Loop ─────────────────────────────────────────────
    const render = () => {
      frame += 1
      // Smooth activity with asymmetric attack/decay
      const rawAct = activityRef.current
      const attackRate = 0.15 // ~150ms to reach target at 60fps
      const decayRate = 0.025 // ~600ms to decay
      const rate = rawAct > smoothedActivity ? attackRate : decayRate
      smoothedActivity = lerp(smoothedActivity, rawAct, rate)
      const act = smoothedActivity

      const mouse = mouseRef.current

      ctx.clearRect(0, 0, width, height)

      const centerX = width * 0.5
      const centerY = height * 0.5

      // ── RING PULSE: check threshold crossing ────────────────
      const thresholdStep = 0.25
      const currentThreshold = Math.floor(rawAct / thresholdStep)
      if (currentThreshold > prevActivityThreshold.current && rawAct > 0.2) {
        rings.push({
          birth: frame,
          maxRadius: Math.min(width, height) * 0.4,
          alpha: 0.2 + act * 0.1,
        })
      }
      prevActivityThreshold.current = currentThreshold

      // ── DRAW DUST DOTS ──────────────────────────────────────
      dust.forEach((d) => {
        d.x += d.vx
        d.y += d.vy
        // Wrap around
        if (d.x < 0) d.x = width
        if (d.x > width) d.x = 0
        if (d.y < 0) d.y = height
        if (d.y > height) d.y = 0

        const alpha = d.baseAlpha + act * 0.08
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2)
        ctx.fillStyle = d.color
        ctx.globalAlpha = Math.min(alpha, 0.25)
        ctx.fill()
        ctx.globalAlpha = 1.0
      })

      // ── DRAW WAVE RIBBON PAIR ───────────────────────────────
      // One pair: upper ribbon and lower ribbon, mirrored around center
      const waveBaseAmp = 20 + act * 35 // 20-55px based on activity
      const waveCycleSpeed = 0.0004 + act * 0.0003 // faster with activity
      const waveFreq = 0.003
      const waveOffset = 80 + act * 20 // distance from center (80-100px)
      const wavePhase = frame * waveCycleSpeed * 60 // normalize to ~10-14s idle cycle

      const drawWaveRibbon = (yBase: number, mirror: boolean, color: string, glowColor: string, lineW: number) => {
        ctx.beginPath()
        for (let x = 0; x <= width; x += WAVE_POINTS_STEP) {
          // Mouse ripple displacement (subtle, max 12px)
          let mouseFactor = 0
          if (mouse.x !== null && mouse.y !== null) {
            const dist = Math.hypot(x - mouse.x, yBase - mouse.y)
            if (dist < 250) {
              mouseFactor = (1 - dist / 250) * MAX_MOUSE_DISPLACEMENT * (mirror ? 1 : -1)
            }
          }

          const amp = waveBaseAmp * (mirror ? -1 : 1)
          const y =
            yBase +
            Math.sin(x * waveFreq + wavePhase) * amp +
            Math.sin(x * waveFreq * 2.3 + wavePhase * 0.7) * amp * 0.25 +
            mouseFactor

          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = color
        ctx.lineWidth = lineW
        ctx.shadowColor = glowColor
        ctx.shadowBlur = 10 + act * 6
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      // Upper ribbon (above center)
      drawWaveRibbon(
        centerY - waveOffset,
        false,
        PALETTE.cyan,
        'rgba(0, 242, 254, 0.6)',
        1.5 + act * 0.8
      )
      // Lower ribbon (below center, mirrored)
      drawWaveRibbon(
        centerY + waveOffset,
        true,
        PALETTE.blue,
        'rgba(0, 136, 255, 0.5)',
        1.5 + act * 0.8
      )

      // ── DRAW LISTENING TICKS ────────────────────────────────
      const drawTicks = (ticks: ListeningTick[]) => {
        ticks.forEach((tick, i) => {
          // Compute target height from activity + per-bar variation
          const barVariation = Math.sin(frame * 0.08 + tick.phase) * 0.3 + 0.7
          tick.targetHeight = tick.idleHeight + act * 90 * barVariation

          // Asymmetric smoothing per-bar: fast attack, slow decay
          const barRate = tick.targetHeight > tick.currentHeight ? 0.18 : 0.04
          tick.currentHeight = lerp(tick.currentHeight, tick.targetHeight, barRate)

          const h = tick.currentHeight
          const x = tick.x
          const cy = centerY + tick.yOffset
          const yTop = cy - h / 2
          const yBottom = cy + h / 2

          // Gradient from cyan to indigo
          const grad = ctx.createLinearGradient(x, yTop, x, yBottom)
          grad.addColorStop(0, PALETTE.cyan)
          grad.addColorStop(0.5, PALETTE.blue)
          grad.addColorStop(1, 'rgba(129, 140, 248, 0.35)')

          // Bar opacity: subtle at idle, full at active
          const barAlpha = Math.min(0.3 + act * 0.7, 1.0)
          ctx.globalAlpha = barAlpha

          ctx.beginPath()
          ctx.moveTo(x, yTop)
          ctx.lineTo(x, yBottom)
          ctx.strokeStyle = grad
          ctx.lineWidth = 2.5
          ctx.lineCap = 'round'
          ctx.stroke()

          // Peak cap dot (only visible when tick is tall enough)
          if (h > 8) {
            ctx.beginPath()
            ctx.arc(x, yTop - 3, 1.5, 0, Math.PI * 2)
            ctx.fillStyle = PALETTE.cyan
            ctx.shadowColor = PALETTE.cyan
            ctx.shadowBlur = 6
            ctx.fill()
            ctx.shadowBlur = 0
          }

          ctx.globalAlpha = 1.0
        })
      }

      drawTicks(leftTicks)
      drawTicks(rightTicks)

      // ── DRAW RING PULSES ────────────────────────────────────
      rings = rings.filter((ring) => {
        const age = frame - ring.birth
        if (age > RING_LIFETIME_FRAMES) return false

        const progress = age / RING_LIFETIME_FRAMES
        const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
        const radius = eased * ring.maxRadius
        const alpha = ring.alpha * (1 - progress)

        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.strokeStyle = PALETTE.sky
        ctx.lineWidth = 1.5 * (1 - progress * 0.5)
        ctx.globalAlpha = alpha
        ctx.shadowColor = PALETTE.sky
        ctx.shadowBlur = 12
        ctx.stroke()
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1.0

        return true
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none bg-[#050811]"
    >
      {/* ── AMBIENT RADIAL GLOW BLOBS (toned down) ──────────────────── */}
      <div
        className="absolute top-1/2 left-10 -translate-y-1/2 w-[550px] h-[550px] rounded-full pointer-events-none animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(0, 242, 254, 0.14) 0%, rgba(0, 136, 255, 0.06) 50%, transparent 75%)',
          filter: 'blur(80px)',
          opacity: 0.20,
          animationDuration: '10s',
        }}
      />
      <div
        className="absolute top-1/2 right-10 -translate-y-1/2 w-[550px] h-[550px] rounded-full pointer-events-none animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.16) 0%, rgba(0, 136, 255, 0.06) 50%, transparent 75%)',
          filter: 'blur(85px)',
          opacity: 0.18,
          animationDuration: '13s',
        }}
      />

      {/* ── FULLSCREEN CANVAS ───────────────────────────────────────── */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* ── VIGNETTE GRADIENT ───────────────────────────────────────── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_45%,_rgba(5,8,17,0.85)_100%)] pointer-events-none" />
    </motion.div>
  )
}
