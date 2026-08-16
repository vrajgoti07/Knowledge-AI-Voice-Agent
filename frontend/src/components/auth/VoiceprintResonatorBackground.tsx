// ============================================================
// VoiceprintResonatorBackground — Holographic Cyber-Acoustic Frequency Matrix
// Dedicated exclusively for Sign In / Login ("Authorize Voice Session")
// Features:
// 1. Flanking 3D Spectrogram Equalizer Columns on Left & Right Wings.
// 2. Continuous Horizontal Audio Laser Soundwave Ribbons spanning the horizon.
// 3. Ascending Audio Frequency Energy Embers floating in depth.
// 4. Cursor tracking & keystroke energy surges in real-time.
// Strict Palette: Deep Space Black #050811, Neural Cyan #00F2FE, Electric Blue #0088FF
// ============================================================

import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface VoiceprintResonatorBackgroundProps {
  activityLevel?: number
}

interface AscendingParticle {
  x: number
  y: number
  vy: number
  radius: number
  alpha: number
  color: string
}

export function VoiceprintResonatorBackground({ activityLevel = 0 }: VoiceprintResonatorBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null })
  const activityRef = useRef(activityLevel)

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

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
      initParticles()
    }

    window.addEventListener('resize', handleResize)

    let step = 0
    let smoothedActivity = 0

    // ── 1. ASCENDING FREQUENCY PARTICLES ────────────────────────────
    let particles: AscendingParticle[] = []
    const particleColors = ['#00F2FE', '#38BDF8', '#0088FF', '#818CF8']

    const initParticles = () => {
      particles = []
      for (let i = 0; i < 35; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vy: -(Math.random() * 0.8 + 0.3),
          radius: Math.random() * 1.6 + 0.8,
          alpha: Math.random() * 0.5 + 0.2,
          color: particleColors[Math.floor(Math.random() * particleColors.length)],
        })
      }
    }
    initParticles()

    // ── 2. FLANKING SPECTROGRAM COLUMN CONFIG ───────────────────────
    const wingBarsCount = 26

    // ── 3. HORIZONTAL LASER SOUNDWAVES CONFIG ───────────────────────
    const laserWaves = [
      {
        stroke: '#00F2FE',
        glow: 'rgba(0, 242, 254, 0.9)',
        lineWidth: 2.2,
        baseYRatio: 0.50,
        amp: 48,
        freq: 0.0028,
        speed: 0.016,
        phase: 0,
      },
      {
        stroke: '#0088FF',
        glow: 'rgba(0, 136, 255, 0.8)',
        lineWidth: 1.8,
        baseYRatio: 0.55,
        amp: 60,
        freq: 0.0020,
        speed: -0.012,
        phase: Math.PI * 0.5,
      },
      {
        stroke: '#818CF8',
        glow: 'rgba(129, 140, 248, 0.7)',
        lineWidth: 1.4,
        baseYRatio: 0.46,
        amp: 36,
        freq: 0.0035,
        speed: 0.020,
        phase: Math.PI * 0.85,
      },
    ]

    const render = () => {
      step += 1
      smoothedActivity += (activityRef.current - smoothedActivity) * 0.08
      const act = smoothedActivity
      const mouse = mouseRef.current

      ctx.clearRect(0, 0, width, height)

      const centerY = height * 0.50

      // ── DRAW ASCENDING FREQUENCY PARTICLES ──────────────────────────
      particles.forEach((p) => {
        p.y += p.vy * (1 + act * 1.8)
        if (p.y < 0) {
          p.y = height
          p.x = Math.random() * width
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.shadowColor = p.color
        ctx.shadowBlur = 8
        ctx.fill()
        ctx.shadowBlur = 0
      })

      // ── DRAW LEFT FLANK SPECTROGRAM EQUALIZER BARS ─────────────────
      const leftWingWidth = width * 0.32
      const barSpacingLeft = leftWingWidth / wingBarsCount

      for (let i = 0; i < wingBarsCount; i++) {
        const x = 20 + i * barSpacingLeft
        // Harmonic formula: higher energy on edges, tapering towards center
        const harmonic =
          Math.sin(step * 0.05 + i * 0.3) * 45 +
          Math.cos(step * 0.08 + i * 0.6) * 30 +
          Math.sin(step * 0.02 + i * 0.15) * 20 +
          55 +
          act * 85

        const barHeight = Math.max(12, harmonic)
        const yTop = centerY - barHeight / 2
        const yBottom = centerY + barHeight / 2

        // Bar Gradient
        const grad = ctx.createLinearGradient(x, yTop, x, yBottom)
        grad.addColorStop(0, '#00F2FE')
        grad.addColorStop(0.5, '#0088FF')
        grad.addColorStop(1, 'rgba(129, 140, 248, 0.4)')

        ctx.beginPath()
        ctx.moveTo(x, yTop)
        ctx.lineTo(x, yBottom)
        ctx.strokeStyle = grad
        ctx.lineWidth = Math.min(4, barSpacingLeft * 0.65)
        ctx.stroke()

        // Luminous Peak Cap Dot
        ctx.beginPath()
        ctx.arc(x, yTop - 4, 2, 0, Math.PI * 2)
        ctx.fillStyle = '#00F2FE'
        ctx.shadowColor = '#00F2FE'
        ctx.shadowBlur = 8
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // ── DRAW RIGHT FLANK SPECTROGRAM EQUALIZER BARS ────────────────
      const rightWingWidth = width * 0.32
      const barSpacingRight = rightWingWidth / wingBarsCount

      for (let i = 0; i < wingBarsCount; i++) {
        const x = width - 20 - i * barSpacingRight
        const harmonic =
          Math.cos(step * 0.06 + i * 0.35) * 45 +
          Math.sin(step * 0.07 + i * 0.55) * 30 +
          Math.cos(step * 0.025 + i * 0.2) * 20 +
          55 +
          act * 85

        const barHeight = Math.max(12, harmonic)
        const yTop = centerY - barHeight / 2
        const yBottom = centerY + barHeight / 2

        const grad = ctx.createLinearGradient(x, yTop, x, yBottom)
        grad.addColorStop(0, '#00F2FE')
        grad.addColorStop(0.5, '#0088FF')
        grad.addColorStop(1, 'rgba(129, 140, 248, 0.4)')

        ctx.beginPath()
        ctx.moveTo(x, yTop)
        ctx.lineTo(x, yBottom)
        ctx.strokeStyle = grad
        ctx.lineWidth = Math.min(4, barSpacingRight * 0.65)
        ctx.stroke()

        // Luminous Peak Cap Dot
        ctx.beginPath()
        ctx.arc(x, yTop - 4, 2, 0, Math.PI * 2)
        ctx.fillStyle = '#38BDF8'
        ctx.shadowColor = '#38BDF8'
        ctx.shadowBlur = 8
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // ── DRAW HORIZONTAL AUDIO LASER SOUNDWAVE RIBBONS ───────────────
      const activityMultiplier = 1 + act * 1.6
      const speedMultiplier = 1 + act * 1.3

      laserWaves.forEach((w) => {
        const baseY = height * w.baseYRatio
        const amp = w.amp * activityMultiplier
        const phase = step * w.speed * speedMultiplier + w.phase

        ctx.beginPath()
        for (let x = 0; x <= width; x += 4) {
          let mouseFactor = 0
          if (mouse.x !== null && mouse.y !== null) {
            const dist = Math.abs(x - mouse.x)
            if (dist < 220) {
              mouseFactor = (1 - dist / 220) * 24
            }
          }

          const y =
            baseY +
            Math.sin(x * w.freq + phase) * amp +
            Math.cos(x * w.freq * 1.7 + phase * 0.9) * (amp * 0.35) -
            mouseFactor

          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }

        ctx.strokeStyle = w.stroke
        ctx.lineWidth = w.lineWidth
        ctx.shadowColor = w.glow
        ctx.shadowBlur = 14
        ctx.stroke()
        ctx.shadowBlur = 0
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
      {/* ── AMBIENT CYBER LIGHT GLOW SPOTS ────────────────────────────── */}
      <div
        className="absolute top-1/2 left-10 -translate-y-1/2 w-[550px] h-[550px] rounded-full pointer-events-none opacity-30 animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(0, 242, 254, 0.22) 0%, rgba(0, 136, 255, 0.10) 50%, transparent 75%)',
          filter: 'blur(80px)',
          animationDuration: '7s',
        }}
      />
      <div
        className="absolute top-1/2 right-10 -translate-y-1/2 w-[550px] h-[550px] rounded-full pointer-events-none opacity-30 animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.24) 0%, rgba(0, 136, 255, 0.10) 50%, transparent 75%)',
          filter: 'blur(85px)',
          animationDuration: '9s',
        }}
      />

      {/* ── CRISP FULLSCREEN CANVAS ───────────────────────────────────── */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* ── VIGNETTE GRADIENT ─────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_45%,_rgba(5,8,17,0.85)_100%)] pointer-events-none" />
    </motion.div>
  )
}
