// ============================================================
// AcousticRadarBackground — Dedicated 360° Acoustic Radar & Sonar Sweep
// Specifically crafted for Forgot Password ("Acoustic Voiceprint Recovery")
// Features:
// 1. 360° Rotating Acoustic Radar Sweep Beam with sweeping radial gradient.
// 2. Concentric expanding sonar wave ripple rings.
// 3. Cryptographic coordinate reticle & security target grid.
// 4. Acoustic frequency jitter/distortion reacting to user typing velocity.
// Strict Palette: Deep Space Black #050811, Neural Cyan #00F2FE, Electric Blue #0088FF
// ============================================================

import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface AcousticRadarBackgroundProps {
  activityLevel?: number
}

export function AcousticRadarBackground({ activityLevel = 0 }: AcousticRadarBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const activityRef = useRef(activityLevel)

  useEffect(() => {
    activityRef.current = activityLevel
  }, [activityLevel])

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
    }

    window.addEventListener('resize', handleResize)

    let angle = 0
    let smoothedActivity = 0
    const rings = [
      { r: 80, speed: 0.8, alpha: 0.4 },
      { r: 160, speed: 0.6, alpha: 0.3 },
      { r: 260, speed: 0.5, alpha: 0.25 },
      { r: 380, speed: 0.4, alpha: 0.18 },
      { r: 520, speed: 0.3, alpha: 0.12 },
    ]

    const render = () => {
      smoothedActivity += (activityRef.current - smoothedActivity) * 0.08
      const speedMultiplier = 1 + smoothedActivity * 2.0
      angle += 0.015 * speedMultiplier

      ctx.clearRect(0, 0, width, height)

      const cx = width / 2
      const cy = height / 2

      // ── 1. DRAW CONCENTRIC RADAR RINGS & TICK MARKS ─────────────────
      rings.forEach((ring, idx) => {
        const dynamicRadius = ring.r + Math.sin(angle * ring.speed + idx) * (6 * (1 + smoothedActivity))

        ctx.beginPath()
        ctx.arc(cx, cy, dynamicRadius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(0, 242, 254, ${ring.alpha + smoothedActivity * 0.15})`
        ctx.lineWidth = 1
        ctx.stroke()

        // Cardinal Tick Marks on Rings
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          const tx1 = cx + Math.cos(a) * (dynamicRadius - 4)
          const ty1 = cy + Math.sin(a) * (dynamicRadius - 4)
          const tx2 = cx + Math.cos(a) * (dynamicRadius + 4)
          const ty2 = cy + Math.sin(a) * (dynamicRadius + 4)

          ctx.beginPath()
          ctx.moveTo(tx1, ty1)
          ctx.lineTo(tx2, ty2)
          ctx.strokeStyle = 'rgba(0, 136, 255, 0.35)'
          ctx.lineWidth = 1
          ctx.stroke()
        }
      })

      // Crosshair Target Axis Lines
      ctx.beginPath()
      ctx.moveTo(cx - 320, cy)
      ctx.lineTo(cx + 320, cy)
      ctx.moveTo(cx, cy - 320)
      ctx.lineTo(cx, cy + 320)
      ctx.strokeStyle = 'rgba(0, 136, 255, 0.15)'
      ctx.setLineDash([4, 6])
      ctx.stroke()
      ctx.setLineDash([])

      // ── 2. DRAW 360° ROTATING ACOUSTIC RADAR SWEEP BEAM ─────────────
      const sweepLength = 480
      const sweepSegments = 40
      const sweepArc = Math.PI * 0.35

      for (let i = 0; i < sweepSegments; i++) {
        const segAngle = angle - (i / sweepSegments) * sweepArc
        const alpha = (1 - i / sweepSegments) * (0.28 + smoothedActivity * 0.2)

        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, sweepLength, segAngle, segAngle + sweepArc / sweepSegments)
        ctx.closePath()
        ctx.fillStyle = `rgba(0, 242, 254, ${alpha * 0.35})`
        ctx.fill()
      }

      // Leading Radar Beam Line
      const lx = cx + Math.cos(angle) * sweepLength
      const ly = cy + Math.sin(angle) * sweepLength
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(lx, ly)
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.75)'
      ctx.lineWidth = 1.5
      ctx.shadowColor = '#00F2FE'
      ctx.shadowBlur = 10
      ctx.stroke()
      ctx.shadowBlur = 0

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
      transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none bg-[#050811]"
    >
      {/* ── 1. CRYPTOGRAPHIC POLAR TARGET GRID ────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `
            radial-gradient(circle at center, rgba(0, 242, 254, 0.12) 0%, transparent 60%),
            linear-gradient(to right, rgba(0, 136, 255, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 136, 255, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 60px 60px, 60px 60px',
        }}
      />

      {/* ── 2. AMBIENT RADAR EMERALD & CYAN GLOWS ─────────────────────── */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none opacity-30 animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(0, 242, 254, 0.20) 0%, rgba(0, 136, 255, 0.08) 50%, transparent 75%)',
          filter: 'blur(90px)',
          animationDuration: '6s',
        }}
      />

      {/* ── 3. RADAR CANVAS ───────────────────────────────────────────── */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* ── 4. DEEP SPACE VIGNETTE ────────────────────────────────────── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(5,8,17,0.88)_100%)] pointer-events-none" />
    </motion.div>
  )
}
