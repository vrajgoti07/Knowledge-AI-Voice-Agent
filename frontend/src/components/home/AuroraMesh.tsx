// ============================================================
// AuroraMesh — Vivid Semantic Aurora & Canvas Vector Mesh
// Fixed Background (z-0) with Pointer-Events-None & High Contrast Drifting Particles
// ============================================================

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

export function AuroraMesh() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

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

    // Generate 60 bright, drifting particles for high visibility
    const particleCount = 60
    const particles: Particle[] = []

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 1.8 + 1.2,
      })
    }

    // Main animation render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // Update & Draw Particles
      for (let i = 0; i < particleCount; i++) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy

        // Screen boundary bounce
        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1

        // Draw glowing particle dot
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
        ctx.shadowColor = '#38BDF8'
        ctx.shadowBlur = 6
        ctx.fill()

        // Draw vector network lines to neighboring particles
        for (let j = i + 1; j < particleCount; j++) {
          const p2 = particles[j]
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 170) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            const alpha = (1 - dist / 170) * 0.35
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`
            ctx.lineWidth = 1.2
            ctx.shadowBlur = 0
            ctx.stroke()
          }
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-[#0A0E1A] overflow-hidden">
      {/* ── LAYER 1: VIVID AMBIENT SEMANTIC AURORA (CSS DRIFT) ────── */}
      <style>{`
        @keyframes auroraSlow1 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(140px, -90px) scale(1.15); }
          66% { transform: translate(-80px, 110px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes auroraSlow2 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(-120px, 80px) scale(1.1); }
          66% { transform: translate(100px, -120px) scale(0.85); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes auroraSlow3 {
          0% { transform: translate(0px, 0px) scale(0.9); }
          50% { transform: translate(90px, -100px) scale(1.2); }
          100% { transform: translate(0px, 0px) scale(0.9); }
        }
        .animate-aurora-1 { animation: auroraSlow1 22s ease-in-out infinite; }
        .animate-aurora-2 { animation: auroraSlow2 26s ease-in-out infinite; }
        .animate-aurora-3 { animation: auroraSlow3 20s ease-in-out infinite; }
      `}</style>

      {/* Blob 1: Vibrant Indigo */}
      <div className="absolute top-[-5%] left-[-5%] w-[600px] h-[600px] rounded-full bg-[rgba(99,102,241,0.3)] blur-[100px] animate-aurora-1 pointer-events-none" />

      {/* Blob 2: Vibrant Sky Blue */}
      <div className="absolute bottom-[-5%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[rgba(56,189,248,0.25)] blur-[100px] animate-aurora-2 pointer-events-none" />

      {/* Blob 3: Vibrant Cyan Glow */}
      <div className="absolute top-[30%] left-[25%] w-[500px] h-[500px] rounded-full bg-[rgba(6,182,212,0.2)] blur-[110px] animate-aurora-3 pointer-events-none" />

      {/* ── LAYER 2: HTML5 CANVAS VECTOR MESH ──────────────────────────── */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
    </div>
  )
}
