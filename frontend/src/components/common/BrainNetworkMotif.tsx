// ============================================================
// BrainNetworkMotif.tsx — Hyper-Realistic 3D Anatomical Human Brain
// Volumetric 3D Interlocking Gyri Folds, Specular Top Highlights, Deep Sulci Shadows, Striated 3D Cerebellum, & Pulsing Neural Synapses
// ============================================================

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface BrainNetworkMotifProps {
  size?: number
  className?: string
}

// 7 Document Nodes Cable Coordinates (Start: Document -> End: Brain)
const CABLE_PATHS = [
  { id: 0, startX: 160, startY: 65, endX: 160, endY: 110, side: 'center', pathD: 'M 160 65 L 160 110' },
  { id: 1, startX: 83, startY: 75, endX: 128, endY: 120, side: 'left', pathD: 'M 83 75 C 95 80, 110 94, 128 120' },
  { id: 2, startX: 42, startY: 170, endX: 100, endY: 175, side: 'left', pathD: 'M 42 170 C 60 175, 76 175, 100 175' },
  { id: 3, startX: 68, startY: 262, endX: 114, endY: 220, side: 'left', pathD: 'M 68 262 C 75 250, 90 230, 114 220' },
  { id: 4, startX: 237, startY: 75, endX: 192, endY: 120, side: 'right', pathD: 'M 237 75 C 225 80, 210 94, 192 120' },
  { id: 5, startX: 278, startY: 170, endX: 220, endY: 175, side: 'right', pathD: 'M 278 170 C 260 175, 244 175, 220 175' },
  { id: 6, startX: 252, startY: 262, endX: 206, endY: 220, side: 'right', pathD: 'M 252 262 C 245 250, 230 230, 206 220' },
]

export function BrainNetworkMotif({ size = 260, className }: BrainNetworkMotifProps) {
  const [activeNodeIndex, setActiveNodeIndex] = useState<number | null>(null)
  const [firingPacket, setFiringPacket] = useState<{ id: number; pathD: string; startX: number; startY: number; endX: number; endY: number; side: string } | null>(null)
  const [brainImpactSide, setBrainImpactSide] = useState<'left' | 'right' | 'center' | null>(null)

  // Periodic Polling: Launches a glowing data packet into the brain every 1.8s - 2.5s
  useEffect(() => {
    const triggerFiring = () => {
      const randomIndex = Math.floor(Math.random() * CABLE_PATHS.length)
      const targetCable = CABLE_PATHS[randomIndex]

      setActiveNodeIndex(randomIndex)
      setFiringPacket(targetCable)

      setTimeout(() => {
        setBrainImpactSide(targetCable.side as 'left' | 'right' | 'center')
      }, 320)

      setTimeout(() => {
        setBrainImpactSide(null)
        setActiveNodeIndex(null)
        setFiringPacket(null)
      }, 650)
    }

    const initialTimer = setTimeout(triggerFiring, 800)
    const interval = setInterval(triggerFiring, 2000)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [])

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 320 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* GPU-Optimized Keyframe Animations */}
        <style>{`
          /* 1. Breathing Outer Glow */
          .brain-glow-breathe {
            animation: brainBreatheGlow 3.2s ease-in-out infinite alternate;
            transform-origin: 160px 175px;
            will-change: transform, opacity;
          }
          @keyframes brainBreatheGlow {
            0% { opacity: 0.45; transform: scale(0.96); }
            50% { opacity: 0.75; transform: scale(1.04); }
            100% { opacity: 0.95; transform: scale(1.08); }
          }

          /* 2. Continuous Inward Flowing Dashed Lines (Marching Ants) */
          .dash-flow-line {
            stroke-dasharray: 6 5;
            animation: dashFlowInward 1.4s linear infinite;
            will-change: stroke-dashoffset;
          }
          @keyframes dashFlowInward {
            0% { stroke-dashoffset: 22; }
            100% { stroke-dashoffset: 0; }
          }

          /* 3. Internal Synaptic Firing Nodes */
          .synapse-node-a { animation: synapsePulse 2.4s ease-in-out infinite alternate; }
          .synapse-node-b { animation: synapsePulse 3.1s ease-in-out 0.6s infinite alternate; }
          .synapse-node-c { animation: synapsePulse 2.7s ease-in-out 1.2s infinite alternate; }

          @keyframes synapsePulse {
            0% { opacity: 0.25; transform: scale(0.85); }
            50% { opacity: 0.95; transform: scale(1.35); filter: drop-shadow(0 0 6px #38BDF8); }
            100% { opacity: 0.35; transform: scale(0.95); }
          }

          /* 4. Floating Document Nodes */
          .doc-node {
            transition: transform 0.25s ease-out, filter 0.25s ease-out;
            cursor: pointer;
          }
          .doc-node:hover {
            transform: translateY(-5px);
            filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.85));
          }
          .doc-float-a { animation: floatA 4s ease-in-out infinite; }
          .doc-float-b { animation: floatB 4.2s ease-in-out 0.4s infinite; }
          .doc-float-c { animation: floatC 3.8s ease-in-out 0.8s infinite; }

          @keyframes floatA { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
          @keyframes floatB { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }
          @keyframes floatC { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-3px); } }
        `}</style>

        {/* Ambient Backlight Radial Glow */}
        <radialGradient id="tightBrainGlow" cx="50%" cy="54%" r="50%">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.80" />
          <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.40" />
          <stop offset="85%" stopColor="#1E40AF" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0A0E1A" stopOpacity="0" />
        </radialGradient>

        {/* 3D Left Hemisphere Volumetric Gradient */}
        <radialGradient id="left3DBrainBase" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="35%" stopColor="#38BDF8" />
          <stop offset="70%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </radialGradient>

        {/* 3D Right Hemisphere Volumetric Gradient */}
        <radialGradient id="right3DBrainBase" cx="60%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="35%" stopColor="#60A5FA" />
          <stop offset="70%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#0F172A" />
        </radialGradient>

        {/* 3D Gyrus Ribbon Fill Gradient */}
        <linearGradient id="gyrus3DGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>

        {/* Cerebellum 3D Base Gradient */}
        <linearGradient id="cerebellum3DGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        {/* Brainstem Cylindrical Gradient */}
        <linearGradient id="brainstemGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="40%" stopColor="#60A5FA" />
          <stop offset="70%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        {/* Document Card Gradients */}
        <linearGradient id="tightDocLightGrad" x1="0" y1="0" x2="0" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#DBEAFE" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>

        <linearGradient id="tightDocMedGrad" x1="0" y1="0" x2="0" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>

        {/* Soft Glow Filter */}
        <filter id="tightSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Synaptic Impact Flash Filter */}
        <filter id="synapticFlashGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* 3D Drop Shadow Filter for Gyri Convolutions */}
        <filter id="gyrusShadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#070A14" floodOpacity="0.8" />
        </filter>
      </defs>

      {/* ── 1. AMBIENT PULSING RADIAL GLOW (Soft Breathing Heartbeat) ─────── */}
      <circle cx="160" cy="175" r="120" fill="url(#tightBrainGlow)" className="brain-glow-breathe" />

      {/* ── 2. RADIATING CONNECTING CABLES (Inward Marching Ants) ──────────── */}
      <g stroke="#1E3A8A" strokeWidth="2" opacity="0.4" strokeLinecap="round">
        {CABLE_PATHS.map((c) => (
          <path key={c.id} d={c.pathD} />
        ))}
      </g>

      <g stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" className="dash-flow-line" opacity="0.95">
        {CABLE_PATHS.map((c) => (
          <path key={c.id} d={c.pathD} />
        ))}
      </g>

      {/* ── 3. HIGH-SPEED SYNAPTIC DATA PACKET INWARD TRAVEL ─────────────── */}
      <AnimatePresence>
        {firingPacket && (
          <g>
            <motion.path
              d={firingPacket.pathD}
              stroke="#38BDF8"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0.2 }}
              animate={{ pathLength: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
              filter="url(#tightSoftGlow)"
            />
            <motion.circle
              r="5"
              fill="#7DD3FC"
              filter="url(#tightSoftGlow)"
              initial={{ cx: firingPacket.startX, cy: firingPacket.startY, opacity: 1, scale: 1.4 }}
              animate={{ cx: firingPacket.endX, cy: firingPacket.endY, opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
            />
          </g>
        )}
      </AnimatePresence>

      {/* ── 4. HYPER-REALISTIC 3D ANATOMICAL HUMAN BRAIN MODEL ────────────── */}
      <motion.g
        filter={brainImpactSide ? 'url(#synapticFlashGlow)' : 'url(#tightSoftGlow)'}
        animate={
          brainImpactSide
            ? {
              scale: [1, 1.04, 1],
              filter: [
                'brightness(1)',
                'brightness(1.4) drop-shadow(0 0 24px #38BDF8)',
                'brightness(1)',
              ],
            }
            : {}
        }
        transition={{ duration: 0.28, ease: 'easeInOut' }}
        style={{ transformOrigin: '160px 175px' }}
      >
        {/* ── A. 3D BRAINSTEM BASE (Medulla Oblongata) ──────────────────── */}
        <path
          d="M 152 238 L 152 258 C 152 262, 156 264, 160 264 C 164 264, 168 262, 168 258 L 168 238 Z"
          fill="url(#brainstemGrad)"
          stroke="#38BDF8"
          strokeWidth="1.5"
          filter="url(#gyrusShadow)"
        />
        <line x1="160" y1="238" x2="160" y2="264" stroke="#E0F2FE" strokeWidth="1.2" opacity="0.6" />

        {/* ── B. 3D CEREBELLUM LOBES (Striated Folia Convolutions) ───────── */}
        {/* Left Cerebellum Lobe */}
        <g filter="url(#gyrusShadow)">
          <path
            d="M 116 220 C 104 226, 106 242, 120 246 C 134 250, 154 246, 158 238 L 158 226 Z"
            fill="url(#cerebellum3DGrad)"
            stroke="#38BDF8"
            strokeWidth="1.6"
          />
          {/* 3D Striated Folia Ribbons */}
          <path d="M 118 226 C 130 232, 144 228, 156 233" stroke="#BAE6FD" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
          <path d="M 122 233 C 134 238, 146 235, 156 239" stroke="#BAE6FD" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
          <path d="M 126 240 C 136 244, 148 242, 156 244" stroke="#7DD3FC" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        </g>

        {/* Right Cerebellum Lobe */}
        <g filter="url(#gyrusShadow)">
          <path
            d="M 204 220 C 216 226, 214 242, 200 246 C 186 250, 166 246, 162 238 L 162 226 Z"
            fill="url(#cerebellum3DGrad)"
            stroke="#38BDF8"
            strokeWidth="1.6"
          />
          {/* 3D Striated Folia Ribbons */}
          <path d="M 202 226 C 190 232, 176 228, 164 233" stroke="#BAE6FD" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
          <path d="M 198 233 C 186 238, 174 235, 164 239" stroke="#BAE6FD" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
          <path d="M 194 240 C 184 244, 172 242, 164 244" stroke="#7DD3FC" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        </g>

        {/* ── C. 3D CEREBRAL HEMISPHERES SILHOUETTE BASE ─────────────────── */}
        {/* Left Hemisphere Base */}
        <path
          d="M 160 108
             C 142 103, 118 110, 102 124
             C 86 138, 82 158, 86 178
             C 82 194, 86 210, 96 222
             C 106 232, 120 238, 136 238
             C 146 238, 154 234, 158 226 Z"
          fill="url(#left3DBrainBase)"
          stroke={brainImpactSide === 'left' ? '#38BDF8' : '#E0F2FE'}
          strokeWidth={brainImpactSide === 'left' ? 3 : 2}
        />

        {/* Right Hemisphere Base */}
        <path
          d="M 160 108
             C 178 103, 202 110, 218 124
             C 234 138, 238 158, 234 178
             C 238 194, 234 210, 224 222
             C 214 232, 200 238, 184 238
             C 174 238, 166 234, 162 226 Z"
          fill="url(#right3DBrainBase)"
          stroke={brainImpactSide === 'right' ? '#38BDF8' : '#E0F2FE'}
          strokeWidth={brainImpactSide === 'right' ? 3 : 2}
        />

        {/* ── D. INTERLOCKING 3D VOLUMETRIC GYRI FOLDS (Cerebral Ribbons) ─── */}

        {/* LEFT HEMISPHERE 3D GYRI FOLDS */}
        <g filter="url(#gyrusShadow)">
          {/* Superior Frontal Gyrus 3D Ribbon */}
          <path d="M 158 110 C 142 108, 126 114, 114 126 C 128 132, 144 128, 158 134 Z" fill="url(#gyrus3DGrad)" stroke="#090D16" strokeWidth="1.8" />
          <path d="M 154 112 C 140 110, 128 116, 118 125" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />

          {/* Middle Frontal Gyrus 3D Ribbon */}
          <path d="M 114 126 C 104 134, 98 144, 106 150 C 122 144, 138 148, 158 142 Z" fill="url(#gyrus3DGrad)" stroke="#090D16" strokeWidth="1.8" />
          <path d="M 116 128 C 108 134, 102 142, 108 148" stroke="#FFFFFF" strokeWidth="2.0" strokeLinecap="round" opacity="0.75" />

          {/* Precentral & Postcentral Gyri 3D Ribbons */}
          <path d="M 106 150 C 94 156, 88 166, 94 174 C 114 168, 134 178, 158 166 Z" fill="url(#gyrus3DGrad)" stroke="#090D16" strokeWidth="1.8" />
          <path d="M 104 152 C 96 158, 92 166, 96 172" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />

          {/* Superior & Middle Temporal Gyri 3D Ribbons */}
          <path d="M 94 174 C 88 184, 90 196, 100 204 C 118 198, 136 206, 158 194 Z" fill="url(#gyrus3DGrad)" stroke="#090D16" strokeWidth="1.8" />
          <path d="M 94 176 C 90 184, 92 194, 100 200" stroke="#FFFFFF" strokeWidth="2.0" strokeLinecap="round" opacity="0.75" />

          {/* Inferior Temporal & Occipital Gyri 3D Ribbons */}
          <path d="M 100 204 C 108 214, 122 224, 138 226 C 146 226, 154 220, 158 212 C 140 216, 120 212, 100 204 Z" fill="url(#gyrus3DGrad)" stroke="#090D16" strokeWidth="1.8" />
          <path d="M 104 206 C 112 214, 124 222, 136 224" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />
        </g>

        {/* RIGHT HEMISPHERE 3D GYRI FOLDS */}
        <g filter="url(#gyrusShadow)">
          {/* Superior Frontal Gyrus 3D Ribbon */}
          <path d="M 162 110 C 178 108, 194 114, 206 126 C 192 132, 176 128, 162 134 Z" fill="url(#gyrus3DGrad)" stroke="#090D16" strokeWidth="1.8" />
          <path d="M 166 112 C 180 110, 192 116, 202 125" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />

          {/* Middle Frontal Gyrus 3D Ribbon */}
          <path d="M 206 126 C 216 134, 222 144, 214 150 C 198 144, 182 148, 162 142 Z" fill="url(#gyrus3DGrad)" stroke="#090D16" strokeWidth="1.8" />
          <path d="M 204 128 C 212 134, 218 142, 212 148" stroke="#FFFFFF" strokeWidth="2.0" strokeLinecap="round" opacity="0.75" />

          {/* Precentral & Postcentral Gyri 3D Ribbons */}
          <path d="M 214 150 C 226 156, 232 166, 226 174 C 206 168, 186 178, 162 166 Z" fill="url(#gyrus3DGrad)" stroke="#090D16" strokeWidth="1.8" />
          <path d="M 216 152 C 224 158, 228 166, 224 172" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />

          {/* Superior & Middle Temporal Gyri 3D Ribbons */}
          <path d="M 226 174 C 232 184, 230 196, 220 204 C 202 198, 184 206, 162 194 Z" fill="url(#gyrus3DGrad)" stroke="#090D16" strokeWidth="1.8" />
          <path d="M 226 176 C 230 184, 228 194, 220 200" stroke="#FFFFFF" strokeWidth="2.0" strokeLinecap="round" opacity="0.75" />

          {/* Inferior Temporal & Occipital Gyri 3D Ribbons */}
          <path d="M 220 204 C 212 214, 198 224, 182 226 C 174 226, 166 220, 162 212 C 180 216, 200 212, 220 204 Z" fill="url(#gyrus3DGrad)" stroke="#090D16" strokeWidth="1.8" />
          <path d="M 216 206 C 208 214, 196 222, 184 224" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />
        </g>

        {/* Central Longitudinal Fissure (3D Division Line) */}
        <line x1="160" y1="108" x2="160" y2="238" stroke="#FFFFFF" strokeWidth="2.8" opacity="0.95" />

        {/* ── E. ILLUMINATED NEURAL SYNAPTIC NETWORKS INSIDE 3D BRAIN ────── */}
        <g id="synaptic-nodes">
          {/* Left Hemisphere Synapses */}
          <circle cx="130" cy="122" r="3.0" fill="#FFFFFF" className="synapse-node-a" />
          <circle cx="110" cy="144" r="3.4" fill="#7DD3FC" className="synapse-node-b" />
          <circle cx="134" cy="164" r="2.8" fill="#FFFFFF" className="synapse-node-c" />
          <circle cx="112" cy="186" r="3.2" fill="#38BDF8" className="synapse-node-a" />
          <circle cx="136" cy="208" r="2.8" fill="#FFFFFF" className="synapse-node-b" />

          {/* Right Hemisphere Synapses */}
          <circle cx="190" cy="122" r="3.0" fill="#FFFFFF" className="synapse-node-b" />
          <circle cx="210" cy="144" r="3.4" fill="#7DD3FC" className="synapse-node-a" />
          <circle cx="186" cy="164" r="2.8" fill="#FFFFFF" className="synapse-node-c" />
          <circle cx="208" cy="186" r="3.2" fill="#38BDF8" className="synapse-node-b" />
          <circle cx="184" cy="208" r="2.8" fill="#FFFFFF" className="synapse-node-a" />

          {/* Interconnect Neural Threads */}
          <path d="M 130 122 L 134 164 L 136 208" stroke="#BAE6FD" strokeWidth="1.4" strokeDasharray="2 2" opacity="0.75" />
          <path d="M 190 122 L 186 164 L 184 208" stroke="#BAE6FD" strokeWidth="1.4" strokeDasharray="2 2" opacity="0.75" />
        </g>
      </motion.g>

      {/* ── 5. SYNAPTIC IMPACT RIPPLE FLASH ──────────────────────────────── */}
      <AnimatePresence>
        {brainImpactSide && (
          <motion.circle
            cx={brainImpactSide === 'left' ? 128 : brainImpactSide === 'right' ? 192 : 160}
            cy="172"
            r="15"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="2.5"
            initial={{ r: 15, opacity: 0.9 }}
            animate={{ r: 54, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* ── 6. UNTOUCHED DOCUMENT CARDS ──────────────────────────────────── */}
      {/* Top Center Document */}
      <g transform="translate(142, 20)" className="doc-node">
        <motion.g className="doc-float-a" animate={activeNodeIndex === 0 ? { scale: 1.15, filter: 'drop-shadow(0 0 18px #38BDF8)' } : { scale: 1 }}>
          <rect x="0" y="0" width="36" height="44" rx="5" fill="url(#tightDocLightGrad)" stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M 26 0 L 36 10 L 26 10 Z" fill="#3B82F6" />
          <rect x="6" y="10" width="18" height="2.5" rx="1" fill="#1D4ED8" />
          <rect x="6" y="17" width="24" height="2.2" rx="1" fill="#2563EB" />
          <rect x="6" y="23" width="20" height="2.2" rx="1" fill="#2563EB" />
          <rect x="6" y="29" width="24" height="2.2" rx="1" fill="#2563EB" />
        </motion.g>
      </g>

      {/* Top Left Document */}
      <g transform="translate(65, 35)" className="doc-node">
        <motion.g className="doc-float-b" animate={activeNodeIndex === 1 ? { scale: 1.15, filter: 'drop-shadow(0 0 18px #38BDF8)' } : { scale: 1 }}>
          <rect x="0" y="0" width="36" height="44" rx="5" fill="url(#tightDocLightGrad)" stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M 26 0 L 36 10 L 26 10 Z" fill="#3B82F6" />
          <rect x="6" y="10" width="18" height="2.5" rx="1" fill="#1D4ED8" />
          <rect x="6" y="17" width="24" height="2.2" rx="1" fill="#2563EB" />
          <rect x="6" y="23" width="20" height="2.2" rx="1" fill="#2563EB" />
          <rect x="6" y="29" width="24" height="2.2" rx="1" fill="#2563EB" />
        </motion.g>
      </g>

      {/* Mid-Left Document (PSC) */}
      <g transform="translate(22, 145)" className="doc-node">
        <motion.g className="doc-float-c" animate={activeNodeIndex === 2 ? { scale: 1.15, filter: 'drop-shadow(0 0 18px #38BDF8)' } : { scale: 1 }}>
          <rect x="0" y="0" width="38" height="46" rx="5" fill="url(#tightDocMedGrad)" stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M 28 0 L 38 10 L 28 10 Z" fill="#93C5FD" />
          <text x="19" y="28" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">PSC</text>
        </motion.g>
      </g>

      {/* Bottom Left Document */}
      <g transform="translate(50, 245)" className="doc-node">
        <motion.g className="doc-float-a" animate={activeNodeIndex === 3 ? { scale: 1.15, filter: 'drop-shadow(0 0 18px #38BDF8)' } : { scale: 1 }}>
          <rect x="0" y="0" width="36" height="44" rx="5" fill="url(#tightDocLightGrad)" stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M 26 0 L 36 10 L 26 10 Z" fill="#3B82F6" />
          <rect x="6" y="10" width="18" height="2.5" rx="1" fill="#1D4ED8" />
          <rect x="6" y="17" width="24" height="2.2" rx="1" fill="#2563EB" />
          <rect x="6" y="23" width="20" height="2.2" rx="1" fill="#2563EB" />
          <rect x="6" y="29" width="24" height="2.2" rx="1" fill="#2563EB" />
        </motion.g>
      </g>

      {/* Top Right Document (PDF) */}
      <g transform="translate(215, 35)" className="doc-node">
        <motion.g className="doc-float-b" animate={activeNodeIndex === 4 ? { scale: 1.15, filter: 'drop-shadow(0 0 18px #38BDF8)' } : { scale: 1 }}>
          <rect x="0" y="0" width="38" height="46" rx="5" fill="url(#tightDocMedGrad)" stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M 28 0 L 38 10 L 28 10 Z" fill="#93C5FD" />
          <text x="19" y="28" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">PDF</text>
        </motion.g>
      </g>

      {/* Mid Right Document */}
      <g transform="translate(258, 145)" className="doc-node">
        <motion.g className="doc-float-c" animate={activeNodeIndex === 5 ? { scale: 1.15, filter: 'drop-shadow(0 0 18px #38BDF8)' } : { scale: 1 }}>
          <rect x="0" y="0" width="36" height="44" rx="5" fill="url(#tightDocLightGrad)" stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M 26 0 L 36 10 L 26 10 Z" fill="#3B82F6" />
          <rect x="6" y="10" width="18" height="2.5" rx="1" fill="#1D4ED8" />
          <rect x="6" y="17" width="24" height="2.2" rx="1" fill="#2563EB" />
          <rect x="6" y="23" width="20" height="2.2" rx="1" fill="#2563EB" />
          <rect x="6" y="29" width="24" height="2.2" rx="1" fill="#2563EB" />
        </motion.g>
      </g>

      {/* Bottom Right Document */}
      <g transform="translate(230, 245)" className="doc-node">
        <motion.g className="doc-float-a" animate={activeNodeIndex === 6 ? { scale: 1.15, filter: 'drop-shadow(0 0 18px #38BDF8)' } : { scale: 1 }}>
          <rect x="0" y="0" width="36" height="44" rx="5" fill="url(#tightDocLightGrad)" stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M 26 0 L 36 10 L 26 10 Z" fill="#3B82F6" />
          <rect x="6" y="10" width="18" height="2.5" rx="1" fill="#1D4ED8" />
          <rect x="6" y="17" width="24" height="2.2" rx="1" fill="#2563EB" />
          <rect x="6" y="23" width="20" height="2.2" rx="1" fill="#2563EB" />
          <rect x="6" y="29" width="24" height="2.2" rx="1" fill="#2563EB" />
        </motion.g>
      </g>
    </svg>
  )
}
