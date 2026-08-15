// ============================================================
// CyberAcousticBackground — Multi-Layered Cyber-Acoustic Environment
// Layer 1: Perspective Coordinate Grid & Floating Neural Constellation
// Layer 2: Continuous Flowing Acoustic Sine Wave Ribbons (HTML5 Canvas)
// Layer 3: Ambient Breathing Audio Spotlights (Cyan #00F2FE, Blue #0088FF)
// Strict Palette: Deep Space Black #050811, Neural Cyan #00F2FE, Electric Blue #0088FF
// ============================================================

import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface CyberAcousticBackgroundProps {
  activityLevel?: number // 0 (idle) to 1 (high typing speed)
}

interface ConstellationNode {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

export function CyberAcousticBackground({ activityLevel = 0 }: CyberAcousticBackgroundProps) {
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
      initNodes()
    }

    window.addEventListener('resize', handleResize)

    let step = 0
    let smoothedActivity = 0

    // ── LAYER 1: NEURAL CONSTELLATION NODES ─────────────────────────
    let nodes: ConstellationNode[] = []
    const initNodes = () => {
      nodes = []
      const count = Math.min(45, Math.floor((width * height) / 32000))
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          radius: Math.random() * 1.5 + 1.0,
        })
      }
    }
    initNodes()

    // ── LAYER 2: MULTI-TRACK ACOUSTIC SINE WAVE RIBBONS ─────────────
    const waveRibbons = [
      {
        colorStart: 'rgba(0, 242, 254, 0.38)',
        colorMid: 'rgba(0, 136, 255, 0.22)',
        colorEnd: 'rgba(5, 8, 17, 0)',
        baseYRatio: 0.53,
        baseAmp: 55,
        freq: 0.0022,
        speed: 0.012,
        phase: 0,
      },
      {
        colorStart: 'rgba(0, 136, 255, 0.34)',
        colorMid: 'rgba(99, 102, 241, 0.18)',
        colorEnd: 'rgba(5, 8, 17, 0)',
        baseYRatio: 0.57,
        baseAmp: 75,
        freq: 0.0016,
        speed: -0.009,
        phase: Math.PI * 0.45,
      },
      {
        colorStart: 'rgba(99, 102, 241, 0.30)',
        colorMid: 'rgba(0, 242, 254, 0.15)',
        colorEnd: 'rgba(5, 8, 17, 0)',
        baseYRatio: 0.49,
        baseAmp: 45,
        freq: 0.0028,
        speed: 0.015,
        phase: Math.PI * 0.9,
      },
    ]

    const render = () => {
      step += 1
      smoothedActivity += (activityRef.current - smoothedActivity) * 0.08

      ctx.clearRect(0, 0, width, height)

      // ── DRAW LAYER 1: CONSTELLATION NODES & MESH ──────────────────
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        a.x += a.vx
        a.y += a.vy

        if (a.x < 0 || a.x > width) a.vx *= -1
        if (a.y < 0 || a.y > height) a.vy *= -1

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.12
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(0, 242, 254, ${alpha})`
            ctx.lineWidth = 0.75
            ctx.stroke()
          }
        }

        ctx.beginPath()
        ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0, 242, 254, 0.4)'
        ctx.fill()
      }

      // ── DRAW LAYER 2: HARMONIC ACOUSTIC SINE WAVES ────────────────
      const activityMultiplier = 1 + smoothedActivity * 1.6
      const speedMultiplier = 1 + smoothedActivity * 1.3

      waveRibbons.forEach((track) => {
        const baseY = height * track.baseYRatio
        const currentAmp = track.baseAmp * activityMultiplier
        const currentPhase = step * track.speed * speedMultiplier + track.phase

        ctx.beginPath()
        ctx.moveTo(0, height)
        ctx.lineTo(0, baseY)

        for (let x = 0; x <= width; x += 6) {
          const y =
            baseY +
            Math.sin(x * track.freq + currentPhase) * currentAmp +
            Math.cos(x * track.freq * 1.5 + currentPhase * 0.85) * (currentAmp * 0.35)
          ctx.lineTo(x, y)
        }

        ctx.lineTo(width, height)
        ctx.closePath()

        const gradient = ctx.createLinearGradient(0, baseY - currentAmp * 1.3, 0, height)
        gradient.addColorStop(0, track.colorStart)
        gradient.addColorStop(0.4, track.colorMid)
        gradient.addColorStop(1, track.colorEnd)

        ctx.fillStyle = gradient
        ctx.fill()
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
      transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none bg-[#050811]"
    >
      {/* ── LAYER 1: 3D PERSPECTIVE SCROLLING COORDINATE GRID ────────── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 242, 254, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 136, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at 50% 50%, black 40%, transparent 80%)',
        }}
      />

      {/* ── LAYER 3: AMBIENT BREATHING AUDIO SPOTLIGHTS ─────────────── */}
      <div
        className="absolute top-1/4 -left-28 w-[650px] h-[650px] rounded-full pointer-events-none opacity-40 animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(0, 242, 254, 0.22) 0%, rgba(0, 136, 255, 0.10) 50%, transparent 75%)',
          filter: 'blur(85px)',
          animationDuration: '8s',
        }}
      />
      <div
        className="absolute top-1/3 -right-28 w-[700px] h-[700px] rounded-full pointer-events-none opacity-35 animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.24) 0%, rgba(0, 136, 255, 0.12) 50%, transparent 75%)',
          filter: 'blur(90px)',
          animationDuration: '10s',
        }}
      />

      {/* ── LAYER 2: FLOWING ACOUSTIC SINE WAVE CANVAS ────────────────── */}
      <div className="absolute inset-0" style={{ filter: 'blur(36px)' }}>
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* ── AMBIENT CENTRAL LIGHT WELL ────────────────────────────────── */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,136,255,0.18)_0%,_transparent_70%)] pointer-events-none" />

      {/* ── DEEP SPACE VIGNETTE ───────────────────────────────────────── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_35%,_rgba(5,8,17,0.85)_100%)] pointer-events-none" />
    </motion.div>
  )
}
