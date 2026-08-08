// ============================================================
// TopographicalGrid — 3D Undulating Wireframe Data Mesh
// Features Sine-Wave Terrain Rolling, Sky-Blue Peak Data Spikes, & Bottom Fade Gradient
// ============================================================

import { useEffect, useRef } from 'react'

export function TopographicalGrid() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let time = 0

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    // Grid Dimensions
    const cols = 36
    const rows = 36
    const gridSpacing = 42

    // Main 3D Undulation Render Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height)
      time += 0.015

      const centerX = width / 2
      const centerY = height * 0.35

      // Calculate 3D projected vertices
      const grid: { x: number; y: number; z: number }[][] = []

      for (let i = 0; i < cols; i++) {
        grid[i] = []
        for (let j = 0; j < rows; j++) {
          const xOffset = (i - cols / 2) * gridSpacing
          const yOffset = (j - rows / 2) * gridSpacing

          // Sine-wave topographical wave height
          const wave1 = Math.sin(i * 0.22 + time) * Math.cos(j * 0.22 + time) * 28
          const wave2 = Math.sin((i + j) * 0.15 + time * 0.8) * 16
          const z = wave1 + wave2

          // 3D Isometric projection math (60 deg tilt)
          const isoX = centerX + (xOffset - yOffset) * 0.866
          const isoY = centerY + (xOffset + yOffset) * 0.5 - z

          grid[i][j] = { x: isoX, y: isoY, z }
        }
      }

      // Render Wireframe Connecting Lines
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const p1 = grid[i][j]

          // Connect to Right neighbor (i + 1, j)
          if (i < cols - 1) {
            const p2 = grid[i + 1][j]
            drawLineSegment(ctx, p1, p2)
          }

          // Connect to Bottom neighbor (i, j + 1)
          if (j < rows - 1) {
            const p2 = grid[i][j + 1]
            drawLineSegment(ctx, p1, p2)
          }
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    // Helper to draw segment with Peak Data Spike Sky-Blue Glow
    function drawLineSegment(
      context: CanvasRenderingContext2D,
      p1: { x: number; y: number; z: number },
      p2: { x: number; y: number; z: number }
    ) {
      const avgZ = (p1.z + p2.z) / 2

      context.beginPath()
      context.moveTo(p1.x, p1.y)
      context.lineTo(p2.x, p2.y)

      if (avgZ > 12) {
        // High Peak — Glowing Sky Blue Data Spike
        const glowFactor = Math.min((avgZ - 12) / 25, 1)
        context.strokeStyle = `rgba(56, 189, 248, ${0.15 + glowFactor * 0.5})`
        context.lineWidth = 1 + glowFactor * 0.8
      } else {
        // Normal Terrain Grid Line — Faint Slate
        context.strokeStyle = 'rgba(255, 255, 255, 0.05)'
        context.lineWidth = 1
      }

      context.stroke()
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#0A0E1A]"
      style={{
        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 95%)',
        WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 95%)',
      }}
    >
      {/* Subtle Ambient Backlight Radial Glow */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-gradient-to-br from-[#38BDF8]/15 via-[#6366F1]/10 to-transparent blur-[120px] pointer-events-none" />

      {/* 3D Undulating Wireframe Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
    </div>
  )
}
