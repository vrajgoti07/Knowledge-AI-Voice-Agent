import React, { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'

// ============================================================================
// Types & Voice State Machine
// ============================================================================
export type VoiceBackgroundState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'error'

export interface HolographicIntelligenceBackgroundProps {
  activityLevel?: number
  voiceState?: VoiceBackgroundState
  isSuccess?: boolean
  className?: string
}

interface GlassFragmentConfig {
  id: string
  shape: 'diamond' | 'shard' | 'capsule' | 'polygon' | 'plane'
  desktopPos: { left?: string; right?: string; top?: string; bottom?: string }
  size: { w: number; h: number }
  rotation: number
  depth: number // 1: Far, 2: Mid, 3: Near
  floatDuration: number
  floatDistance: { x: number; y: number }
  reflectionDuration: number
  waypointPulseDelay: number
}

// 7 deliberate floating glass waypoints positioned strictly around card perimeter
const FRAGMENTS: GlassFragmentConfig[] = [
  // 1. Upper-Left: Soft diamond shard
  {
    id: 'frag-ul-1',
    shape: 'diamond',
    desktopPos: { left: '11%', top: '16%' },
    size: { w: 115, h: 78 },
    rotation: 14,
    depth: 2,
    floatDuration: 22,
    floatDistance: { x: 12, y: -16 },
    reflectionDuration: 7.5,
    waypointPulseDelay: 0.2,
  },
  // 2. Upper-Right: Slender vertical glass prism
  {
    id: 'frag-ur-1',
    shape: 'shard',
    desktopPos: { right: '13%', top: '13%' },
    size: { w: 70, h: 136 },
    rotation: -8,
    depth: 3,
    floatDuration: 26,
    floatDistance: { x: -14, y: 18 },
    reflectionDuration: 8.5,
    waypointPulseDelay: 0.5,
  },
  // 3. Upper-Right Secondary: Soft capsule fragment
  {
    id: 'frag-ur-2',
    shape: 'capsule',
    desktopPos: { right: '6%', top: '30%' },
    size: { w: 88, h: 50 },
    rotation: 28,
    depth: 1,
    floatDuration: 20,
    floatDistance: { x: 10, y: -12 },
    reflectionDuration: 9.0,
    waypointPulseDelay: 8.5,
  },
  // 4. Mid-Left: Translucent glass polygon
  {
    id: 'frag-ml-1',
    shape: 'polygon',
    desktopPos: { left: '7%', top: '48%' },
    size: { w: 102, h: 102 },
    rotation: -6,
    depth: 2,
    floatDuration: 24,
    floatDistance: { x: 15, y: 15 },
    reflectionDuration: 8.0,
    waypointPulseDelay: 2.8,
  },
  // 5. Mid-Right: Subtle angled glass plane
  {
    id: 'frag-mr-1',
    shape: 'plane',
    desktopPos: { right: '7%', top: '53%' },
    size: { w: 118, h: 72 },
    rotation: -14,
    depth: 2,
    floatDuration: 28,
    floatDistance: { x: -12, y: -14 },
    reflectionDuration: 8.2,
    waypointPulseDelay: 3.6,
  },
  // 6. Lower-Left: Soft horizontal glass shard
  {
    id: 'frag-ll-1',
    shape: 'shard',
    desktopPos: { left: '12%', bottom: '13%' },
    size: { w: 128, h: 60 },
    rotation: 8,
    depth: 3,
    floatDuration: 25,
    floatDistance: { x: -16, y: -18 },
    reflectionDuration: 7.8,
    waypointPulseDelay: 5.6,
  },
  // 7. Lower-Right: Rounded capsule fragment
  {
    id: 'frag-lr-1',
    shape: 'capsule',
    desktopPos: { right: '11%', bottom: '12%' },
    size: { w: 98, h: 52 },
    rotation: -22,
    depth: 2,
    floatDuration: 21,
    floatDistance: { x: 14, y: 12 },
    reflectionDuration: 8.8,
    waypointPulseDelay: 6.8,
  },
]

export function HolographicIntelligenceBackground({
  activityLevel = 0,
  voiceState = 'idle',
  isSuccess = false,
  className = '',
}: HolographicIntelligenceBackgroundProps) {
  const shouldReduceMotion = useReducedMotion()
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  )

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Framer Motion mouse parallax
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { damping: 28, stiffness: 85, mass: 0.8 }
  const smoothMouseX = useSpring(mouseX, springConfig)
  const smoothMouseY = useSpring(mouseY, springConfig)

  const bgParallaxX = useTransform(smoothMouseX, [-1, 1], [-8, 8])
  const bgParallaxY = useTransform(smoothMouseY, [-1, 1], [-8, 8])

  const midParallaxX = useTransform(smoothMouseX, [-1, 1], [-20, 20])
  const midParallaxY = useTransform(smoothMouseY, [-1, 1], [-20, 20])

  const fgParallaxX = useTransform(smoothMouseX, [-1, 1], [-36, 36])
  const fgParallaxY = useTransform(smoothMouseY, [-1, 1], [-36, 36])

  useEffect(() => {
    if (shouldReduceMotion) return

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window
      const normX = (e.clientX / innerWidth) * 2 - 1
      const normY = (e.clientY / innerHeight) * 2 - 1
      mouseX.set(normX)
      mouseY.set(normY)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY, shouldReduceMotion])

  // Responsive fragment count: Desktop (7) | Tablet (5) | Mobile (3)
  const visibleFragments =
    viewportWidth < 640
      ? FRAGMENTS.slice(0, 3)
      : viewportWidth < 1024
      ? FRAGMENTS.slice(0, 5)
      : FRAGMENTS

  const isErrorState = voiceState === 'error'

  // Refs for physics engine
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const fragmentRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({})

  // ==========================================================================
  // PHYSICS CONTROLLER: SINGLE BOUNCING KNOWLEDGE BALL
  // ==========================================================================
  useEffect(() => {
    if (shouldReduceMotion) return

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

    // Ball sizing: Ball 1 (standard ~7px desktop) & Ball 2 (smaller ~5px desktop)
    const isMobile = width < 640

    interface BallPhysicsState {
      id: string
      x: number
      y: number
      vx: number
      vy: number
      radius: number
      baseSpeed: number
      currentSpeed: number
      speedMultiplier: number
      lastHitBoxId: string | null
      cooldown: number
      targetBoxId: string | null
      trail: { x: number; y: number; alpha: number }[]
      maxTrail: number
      coreColor: string
      glowColor: string
      haloColor: string
    }

    // Two distinct Knowledge Balls with proper straight-line momentum & reflection physics
    const balls: BallPhysicsState[] = [
      // Ball 1: Primary cyan data ball (~7px desktop, ~5px mobile)
      {
        id: 'ball-1',
        x: isMobile ? width * 0.15 : width * 0.18,
        y: height * 0.28,
        vx: 2.2,
        vy: 1.6,
        radius: isMobile ? 2.5 : 3.5,
        baseSpeed: isMobile ? 2.0 : 2.7,
        currentSpeed: isMobile ? 2.0 : 2.7,
        speedMultiplier: 1.0,
        lastHitBoxId: null,
        cooldown: 0,
        targetBoxId: null,
        trail: [],
        maxTrail: isMobile ? 8 : 12,
        coreColor: '#ffffff',
        glowColor: 'rgba(34, 211, 238, 0.85)',
        haloColor: 'rgba(59, 130, 246, 0.45)',
      },
      // Ball 2: Secondary agile small ball (~5px desktop, ~4px mobile)
      {
        id: 'ball-2',
        x: isMobile ? width * 0.82 : width * 0.85,
        y: height * 0.72,
        vx: -2.0,
        vy: -1.8,
        radius: isMobile ? 1.8 : 2.4,
        baseSpeed: isMobile ? 2.3 : 3.1,
        currentSpeed: isMobile ? 2.3 : 3.1,
        speedMultiplier: 1.0,
        lastHitBoxId: null,
        cooldown: 0,
        targetBoxId: null,
        trail: [],
        maxTrail: isMobile ? 6 : 10,
        coreColor: '#ffffff',
        glowColor: 'rgba(56, 189, 248, 0.90)',
        haloColor: 'rgba(96, 165, 250, 0.50)',
      },
    ]

    // Contact flash list: tiny sparkle/ring at contact point (150-250ms)
    interface ContactFlash {
      x: number
      y: number
      nx: number
      ny: number
      birth: number
      duration: number
    }
    const flashes: ContactFlash[] = []

    let lastTime = performance.now()

    const animate = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05)
      lastTime = currentTime

      // 1. Clear frame
      ctx.clearRect(0, 0, width, height)

      // 2. Measure Auth Card obstacle
      const authCardEl =
        document.querySelector('.auth-portal-card') || document.querySelector('#auth-card')
      const cardRect = authCardEl ? authCardEl.getBoundingClientRect() : null
      const cardMargin = 22 // Safe boundary buffer

      // 3. Measure Glass Box obstacles
      interface GlassObstacle {
        id: string
        left: number
        top: number
        right: number
        bottom: number
        width: number
        height: number
        radius: number
        el: HTMLDivElement | null
      }
      const obstacles: GlassObstacle[] = []

      visibleFragments.forEach((frag) => {
        const el = fragmentRefs.current[frag.id]
        if (el) {
          const rect = el.getBoundingClientRect()
          obstacles.push({
            id: frag.id,
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
            radius: frag.shape === 'capsule' ? rect.height / 2 : 14,
            el,
          })
        }
      })

      // Viewport safety borders
      const topSafeZone = 74 // Keeps balls below Back to Home & Acoustic Core controls
      const botSafeZone = height - 20
      const leftSafeZone = 20
      const rightSafeZone = width - 20

      // 4. Update each Knowledge Ball with PROPER STRAIGHT-LINE PHYSICS (No artificial orbital curving)
      balls.forEach((ball) => {
        // Cooldown & Speed Recovery
        if (ball.cooldown > 0) {
          ball.cooldown -= dt
        }
        if (ball.speedMultiplier < 1.0) {
          ball.speedMultiplier = Math.min(1.0, ball.speedMultiplier + dt * 2.5)
        }
        ball.currentSpeed = ball.baseSpeed * ball.speedMultiplier

        // Re-normalize velocity vector to maintain exact speed without curving
        const currentVLen = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy)
        if (currentVLen > 0.0001) {
          ball.vx = (ball.vx / currentVLen) * ball.currentSpeed
          ball.vy = (ball.vy / currentVLen) * ball.currentSpeed
        }

        // True Newtonian Momentum: straight-line motion (constant velocity)
        ball.x += ball.vx * (dt * 60)
        ball.y += ball.vy * (dt * 60)

        // Collision Detection with Glass Boxes (TOUCH OUTER EDGE & CLEAN SPECULAR BOUNCE)
        for (const obs of obstacles) {
          const cornerR = obs.radius
          const innerMinX = obs.left + cornerR
          const innerMaxX = obs.right - cornerR
          const innerMinY = obs.top + cornerR
          const innerMaxY = obs.bottom - cornerR

          const clampX = Math.max(innerMinX, Math.min(innerMaxX, ball.x))
          const clampY = Math.max(innerMinY, Math.min(innerMaxY, ball.y))

          const diffX = ball.x - clampX
          const diffY = ball.y - clampY
          const distToCore = Math.sqrt(diffX * diffX + diffY * diffY)
          const distToSurface = distToCore - cornerR

          // Only collide if ball outer edge reaches surface AND ball is moving toward the surface
          if (distToSurface <= ball.radius && ball.cooldown <= 0) {
            let nx = 0
            let ny = 0
            if (distToCore > 0.0001) {
              nx = diffX / distToCore
              ny = diffY / distToCore
            } else {
              const obsCenterX = obs.left + obs.width / 2
              const obsCenterY = obs.top + obs.height / 2
              const dCenterX = ball.x - obsCenterX
              const dCenterY = ball.y - obsCenterY
              const dCenterLen = Math.sqrt(dCenterX * dCenterX + dCenterY * dCenterY) || 1
              nx = dCenterX / dCenterLen
              ny = dCenterY / dCenterLen
            }

            // Dot product check: strictly only reflect if moving INTO the surface
            const dot = ball.vx * nx + ball.vy * ny
            if (dot < 0) {
              const contactX = clampX + nx * cornerR
              const contactY = clampY + ny * cornerR

              // Prevent penetration: place ball center strictly outside at contact surface + 1px
              ball.x = contactX + nx * (ball.radius + 1.0)
              ball.y = contactY + ny * (ball.radius + 1.0)

              // Proper Specular Reflection: v' = v - 2(v . n)n
              let refVx = ball.vx - 2 * dot * nx
              let refVy = ball.vy - 2 * dot * ny

              // Minor controlled deflection tweak (+/- 1-3 degrees) so it never gets locked in a 1D loop
              const angleVariance = (Math.random() - 0.5) * 0.05
              const cosVar = Math.cos(angleVariance)
              const sinVar = Math.sin(angleVariance)
              const variedVx = refVx * cosVar - refVy * sinVar
              const variedVy = refVx * sinVar + refVy * cosVar

              const refLen = Math.sqrt(variedVx * variedVx + variedVy * variedVy) || 1
              ball.vx = (variedVx / refLen) * ball.currentSpeed
              ball.vy = (variedVy / refLen) * ball.currentSpeed

              ball.speedMultiplier = 0.65
              ball.cooldown = 0.15
              ball.lastHitBoxId = obs.id

              // Trigger contact flash effect
              flashes.push({
                x: contactX,
                y: contactY,
                nx,
                ny,
                birth: currentTime,
                duration: 250,
              })

              // Trigger subtle glass border highlight response
              if (obs.el) {
                obs.el.classList.add('glass-box-impact')
                setTimeout(() => {
                  obs.el?.classList.remove('glass-box-impact')
                }, 300)
              }
            }
            break
          }
        }

        // Auth Card Obstacle Deflection with Proper Normal Reflection
        if (cardRect) {
          const cardBoxLeft = cardRect.left - cardMargin
          const cardBoxRight = cardRect.right + cardMargin
          const cardBoxTop = cardRect.top - cardMargin
          const cardBoxBottom = cardRect.bottom + cardMargin
          const cardR = 24

          const innerCardMinX = cardBoxLeft + cardR
          const innerCardMaxX = cardBoxRight - cardR
          const innerCardMinY = cardBoxTop + cardR
          const innerCardMaxY = cardBoxBottom - cardR

          const clampCardX = Math.max(innerCardMinX, Math.min(innerCardMaxX, ball.x))
          const clampCardY = Math.max(innerCardMinY, Math.min(innerCardMaxY, ball.y))

          const cDiffX = ball.x - clampCardX
          const cDiffY = ball.y - clampCardY
          const cDist = Math.sqrt(cDiffX * cDiffX + cDiffY * cDiffY)

          if (cDist <= cardR + ball.radius) {
            let cnx = 0
            let cny = 0
            if (cDist > 0.0001) {
              cnx = cDiffX / cDist
              cny = cDiffY / cDist
            } else {
              const cardMidX = (cardBoxLeft + cardBoxRight) / 2
              const cardMidY = (cardBoxTop + cardBoxBottom) / 2
              const dMidX = ball.x - cardMidX
              const dMidY = ball.y - cardMidY
              const dMidLen = Math.sqrt(dMidX * dMidX + dMidY * dMidY) || 1
              cnx = dMidX / dMidLen
              cny = dMidY / dMidLen
            }

            // Immediately resolve position outside card boundary
            ball.x = clampCardX + cnx * (cardR + ball.radius + 1.2)
            ball.y = clampCardY + cny * (cardR + ball.radius + 1.2)

            const cardDot = ball.vx * cnx + ball.vy * cny
            if (cardDot < 0) {
              // Specular bounce off card perimeter
              const refVx = ball.vx - 2 * cardDot * cnx
              const refVy = ball.vy - 2 * cardDot * cny
              const refLen = Math.sqrt(refVx * refVx + refVy * refVy) || 1
              ball.vx = (refVx / refLen) * ball.currentSpeed
              ball.vy = (refVy / refLen) * ball.currentSpeed
            }
          }
        }

        // Viewport Bounds Clean Specular Collision
        if (ball.x < leftSafeZone) {
          ball.x = leftSafeZone + 1
          ball.vx = Math.abs(ball.vx)
        } else if (ball.x > rightSafeZone) {
          ball.x = rightSafeZone - 1
          ball.vx = -Math.abs(ball.vx)
        }

        if (ball.y < topSafeZone) {
          ball.y = topSafeZone + 1
          ball.vy = Math.abs(ball.vy)
        } else if (ball.y > botSafeZone) {
          ball.y = botSafeZone - 1
          ball.vy = -Math.abs(ball.vy)
        }

        // Update Ball Trail
        ball.trail.unshift({ x: ball.x, y: ball.y, alpha: 0.65 })
        if (ball.trail.length > ball.maxTrail) {
          ball.trail.pop()
        }
      })

      // 5. Inter-Ball Deflection (if the two balls ever touch in open space)
      if (balls.length >= 2) {
        const b1 = balls[0]
        const b2 = balls[1]
        const dbx = b2.x - b1.x
        const dby = b2.y - b1.y
        const distBalls = Math.sqrt(dbx * dbx + dby * dby)
        const minDistBalls = b1.radius + b2.radius + 1

        if (distBalls < minDistBalls && distBalls > 0.001) {
          const bnx = dbx / distBalls
          const bny = dby / distBalls

          // Separate
          const overlap = (minDistBalls - distBalls) / 2
          b1.x -= bnx * overlap
          b1.y -= bny * overlap
          b2.x += bnx * overlap
          b2.y += bny * overlap

          // Elastic bounce
          const kx = b1.vx - b2.vx
          const ky = b1.vy - b2.vy
          const p = 2 * (bnx * kx + bny * ky) / 2
          b1.vx -= p * bnx
          b1.vy -= p * bny
          b2.vx += p * bnx
          b2.vy += p * bny

          flashes.push({
            x: (b1.x + b2.x) / 2,
            y: (b1.y + b2.y) / 2,
            nx: bnx,
            ny: bny,
            birth: currentTime,
            duration: 200,
          })
        }
      }

      // 6. Render Trails for both balls (· · · · ●, short fading dots, no continuous line)
      balls.forEach((ball) => {
        for (let i = 1; i < ball.trail.length; i++) {
          const point = ball.trail[i]
          const progress = 1 - i / ball.trail.length
          const dotRadius = Math.max(1, ball.radius * 0.75 * progress)
          const dotAlpha = 0.45 * progress * progress

          ctx.beginPath()
          ctx.arc(point.x, point.y, dotRadius, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(34, 211, 238, ${dotAlpha})`
          ctx.shadowColor = 'rgba(59, 130, 246, 0.4)'
          ctx.shadowBlur = 4
          ctx.fill()
        }
      })

      // 7. Render Contact Flashes (✦ and tiny cyan expanding ring at contact point)
      for (let i = flashes.length - 1; i >= 0; i--) {
        const flash = flashes[i]
        const age = currentTime - flash.birth
        if (age >= flash.duration) {
          flashes.splice(i, 1)
          continue
        }

        const t = age / flash.duration
        const ringRadius = 2 + t * 12
        const ringAlpha = (1 - t) * 0.85

        // Micro glow ring
        ctx.save()
        ctx.beginPath()
        ctx.arc(flash.x, flash.y, ringRadius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(34, 211, 238, ${ringAlpha})`
        ctx.lineWidth = 1.2
        ctx.shadowColor = 'rgba(34, 211, 238, 0.9)'
        ctx.shadowBlur = 8
        ctx.stroke()

        // Micro core sparkle at moment of contact
        if (t < 0.45) {
          const coreAlpha = (1 - t / 0.45) * 0.95
          ctx.beginPath()
          ctx.arc(flash.x, flash.y, 2, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${coreAlpha})`
          ctx.shadowColor = '#22D3EE'
          ctx.shadowBlur = 12
          ctx.fill()
        }
        ctx.restore()
      }

      // 8. Render Both Glowing Knowledge Balls
      balls.forEach((ball) => {
        ctx.save()
        // Outer soft halo
        const glowGrad = ctx.createRadialGradient(
          ball.x,
          ball.y,
          0,
          ball.x,
          ball.y,
          ball.radius * 3.8
        )
        glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
        glowGrad.addColorStop(0.28, ball.glowColor)
        glowGrad.addColorStop(0.65, ball.haloColor)
        glowGrad.addColorStop(1, 'rgba(5, 8, 17, 0)')

        ctx.beginPath()
        ctx.arc(ball.x, ball.y, ball.radius * 3.8, 0, Math.PI * 2)
        ctx.fillStyle = glowGrad
        ctx.fill()

        // High-intensity white core
        ctx.beginPath()
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
        ctx.fillStyle = ball.coreColor
        ctx.shadowColor = '#22D3EE'
        ctx.shadowBlur = 10
        ctx.fill()
        ctx.restore()
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
    }
  }, [shouldReduceMotion, visibleFragments])

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none overflow-hidden select-none z-0 bg-[#050811] ${className}`}
    >
      <style>{`
        .glass-box-impact {
          border-color: rgba(34, 211, 238, 0.78) !important;
          box-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.25), inset 0 0 22px rgba(34, 211, 238, 0.25), 0 0 24px -4px rgba(34, 211, 238, 0.42) !important;
          transition: border-color 0.15s ease-out, box-shadow 0.15s ease-out !important;
        }
      `}</style>

      {/* ── 1. LAYER 0: CENTRAL INTELLIGENCE LIGHT FIELD & AMBIENT ATMOSPHERE ──── */}
      <motion.div
        style={{
          x: shouldReduceMotion ? 0 : bgParallaxX,
          y: shouldReduceMotion ? 0 : bgParallaxY,
        }}
        animate={
          shouldReduceMotion
            ? {}
            : {
                opacity: [0.92, 1.0, 0.94, 0.98, 0.92],
              }
        }
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 pointer-events-none"
      >
        {/* Upper-Left Cyan Light Atmosphere */}
        <div
          className="absolute -top-[10%] -left-[5%] w-[45vw] h-[45vw] max-w-[620px] max-h-[620px] rounded-full blur-[110px] pointer-events-none transition-opacity duration-700"
          style={{
            background: isErrorState
              ? 'radial-gradient(circle, rgba(239, 68, 68, 0.09) 0%, rgba(5, 8, 17, 0) 70%)'
              : `radial-gradient(circle, rgba(34, 211, 238, ${
                  0.09 + activityLevel * 0.03 + (isSuccess ? 0.07 : 0)
                }) 0%, rgba(5, 8, 17, 0) 70%)`,
          }}
        />

        {/* Lower-Right Electric-Blue Light Atmosphere */}
        <div
          className="absolute -bottom-[12%] -right-[8%] w-[50vw] h-[50vw] max-w-[680px] max-h-[680px] rounded-full blur-[120px] pointer-events-none transition-opacity duration-700"
          style={{
            background: isErrorState
              ? 'radial-gradient(circle, rgba(239, 68, 68, 0.08) 0%, rgba(5, 8, 17, 0) 70%)'
              : `radial-gradient(circle, rgba(59, 130, 246, ${
                  0.09 + activityLevel * 0.02 + (isSuccess ? 0.07 : 0)
                }) 0%, rgba(5, 8, 17, 0) 70%)`,
          }}
        />

        {/* Central Behind-Card Intelligence Halo (Muted, not an orb) */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[44vw] h-[44vw] max-w-[560px] max-h-[560px] rounded-full blur-[90px] pointer-events-none transition-opacity duration-700"
          style={{
            background: isErrorState
              ? 'radial-gradient(circle, rgba(239, 68, 68, 0.07) 0%, rgba(5, 8, 17, 0) 75%)'
              : `radial-gradient(circle, rgba(34, 211, 238, ${
                  0.05 + activityLevel * 0.03 + (isSuccess ? 0.09 : 0)
                }) 0%, rgba(59, 130, 246, 0.03) 45%, rgba(5, 8, 17, 0) 75%)`,
          }}
        />
      </motion.div>

      {/* ── 2. LAYER 1: FLOATING "KNOWLEDGE GLASS" BOUNCE SURFACES ──────── */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {visibleFragments.map((frag) => {
          const parallaxX =
            frag.depth === 1 ? bgParallaxX : frag.depth === 2 ? midParallaxX : fgParallaxX
          const parallaxY =
            frag.depth === 1 ? bgParallaxY : frag.depth === 2 ? midParallaxY : fgParallaxY

          return (
            <motion.div
              key={frag.id}
              style={{
                ...frag.desktopPos,
                width: frag.size.w,
                height: frag.size.h,
                x: shouldReduceMotion ? 0 : parallaxX,
                y: shouldReduceMotion ? 0 : parallaxY,
              }}
              className="absolute pointer-events-none"
            >
              {/* Floating Drift & Rotation Container */}
              <motion.div
                animate={
                  shouldReduceMotion
                    ? {}
                    : {
                        x: [0, frag.floatDistance.x, 0],
                        y: [0, frag.floatDistance.y, 0],
                        rotate: [frag.rotation, frag.rotation + 3.5, frag.rotation],
                        scale: [1, 1.02, 1],
                      }
                }
                transition={{
                  duration: frag.floatDuration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-full h-full relative"
              >
                {/* High-Clarity Translucent Glass Bounce Platform Body */}
                <div
                  ref={(el) => {
                    fragmentRefs.current[frag.id] = el
                  }}
                  className={`w-full h-full relative overflow-hidden backdrop-blur-lg transition-all duration-300 ${
                    frag.shape === 'capsule'
                      ? 'rounded-full'
                      : frag.shape === 'polygon'
                      ? 'rounded-2xl'
                      : 'rounded-xl'
                  }`}
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(20, 32, 58, 0.58) 0%, rgba(10, 18, 36, 0.40) 100%)',
                    border: '1px solid rgba(34, 211, 238, 0.28)',
                    borderTopColor: 'rgba(96, 165, 250, 0.55)',
                    borderLeftColor: 'rgba(34, 211, 238, 0.42)',
                    boxShadow:
                      'inset 0 1px 1px 0 rgba(255, 255, 255, 0.14), inset 0 0 16px rgba(34, 211, 238, 0.08), 0 16px 40px -8px rgba(0, 0, 0, 0.6)',
                    opacity: 0.92 + activityLevel * 0.08 + (isSuccess ? 0.15 : 0),
                  }}
                >
                  {/* Glass Top Specular Rim */}
                  <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />

                  {/* ── 3. INTERNAL LIGHT REFLECTION SWEEP ── */}
                  {!shouldReduceMotion && (
                    <motion.div
                      animate={{
                        x: ['-150%', '240%'],
                      }}
                      transition={{
                        duration: frag.reflectionDuration,
                        repeat: Infinity,
                        repeatDelay: 2 + (activityLevel > 0.3 ? 1 : 3),
                        ease: [0.4, 0, 0.2, 1],
                      }}
                      className="absolute inset-0 -skew-x-12 pointer-events-none"
                      style={{
                        background:
                          'linear-gradient(105deg, transparent 15%, rgba(34, 211, 238, 0.16) 45%, rgba(147, 197, 253, 0.32) 50%, rgba(34, 211, 238, 0.16) 55%, transparent 85%)',
                        width: '70%',
                      }}
                    />
                  )}
                  {/* The ball never enters inside the glass */}
                </div>
              </motion.div>
            </motion.div>
          )
        })}
      </div>

      {/* ── 4. KNOWLEDGE BALLS: DUAL BOUNCING PHYSICS ENGINE ───────────── */}
      {/* 
          - Two distinct glowing balls (primary 7px + secondary agile small 5px)
          - Bounce off the OUTER EDGE of the glass boxes
          - Resolve penetration immediately along collision normal
          - Create tiny contact sparkle + ripple on impact
          - Deflect away toward other glass boxes
          - Short fading trails (· · · · ●)
          - Inter-ball elastic collision if they cross paths
          - NEVER enter the glass
          - NEVER enter the authentication card
      */}
      {!shouldReduceMotion ? (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-15"
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        /* Reduced Motion Fallback: Two static soft lights parked at safe positions */
        <>
          <div
            className="absolute top-[25vh] left-[18vw] w-[6px] h-[6px] rounded-full pointer-events-none z-15"
            style={{
              background: '#ffffff',
              boxShadow:
                '0 0 10px 3px rgba(34, 211, 238, 0.9), 0 0 20px 4px rgba(59, 130, 246, 0.5)',
            }}
          />
          <div
            className="absolute top-[36vh] right-[16vw] w-[4.5px] h-[4.5px] rounded-full pointer-events-none z-15"
            style={{
              background: '#ffffff',
              boxShadow:
                '0 0 8px 2px rgba(56, 189, 248, 0.85), 0 0 16px 3px rgba(96, 165, 250, 0.45)',
            }}
          />
        </>
      )}

      {/* ── 5. SUBTLE ENVIRONMENTAL VIGNETTE ────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(5, 8, 17, 0.65) 100%)',
        }}
      />
    </div>
  )
}

