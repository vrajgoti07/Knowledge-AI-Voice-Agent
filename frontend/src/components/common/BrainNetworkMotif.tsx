// ============================================================
// BrainNetworkMotif — Active Synaptic Firing Animation
// Randomized Polling Node Activation, High-Speed Data Packet Inward Travel, & Brain Impact Ripple
// ============================================================

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface BrainNetworkMotifProps {
  size?: number
  className?: string
}

// 7 Document Nodes Cable Coordinates (Start: Document -> End: Brain)
const CABLE_PATHS = [
  { id: 0, startX: 160, startY: 65, endX: 160, endY: 130, side: 'center', pathD: 'M 160 65 L 160 130' },
  { id: 1, startX: 83, startY: 75, endX: 140, endY: 135, side: 'left', pathD: 'M 83 75 C 95 80, 120 100, 140 135' },
  { id: 2, startX: 42, startY: 170, endX: 115, endY: 175, side: 'left', pathD: 'M 42 170 C 60 175, 80 175, 115 175' },
  { id: 3, startX: 68, startY: 262, endX: 125, endY: 210, side: 'left', pathD: 'M 68 262 C 75 250, 95 230, 125 210' },
  { id: 4, startX: 237, startY: 75, endX: 180, endY: 135, side: 'right', pathD: 'M 237 75 C 225 80, 200 100, 180 135' },
  { id: 5, startX: 278, startY: 170, endX: 205, endY: 175, side: 'right', pathD: 'M 278 170 C 260 175, 240 175, 205 175' },
  { id: 6, startX: 252, startY: 262, endX: 195, endY: 210, side: 'right', pathD: 'M 252 262 C 245 250, 225 230, 195 210' },
]

export function BrainNetworkMotif({ size = 260, className }: BrainNetworkMotifProps) {
  const [activeNodeIndex, setActiveNodeIndex] = useState<number | null>(null)
  const [firingPacket, setFiringPacket] = useState<{ id: number; pathD: string; startX: number; startY: number; endX: number; endY: number; side: string } | null>(null)
  const [brainImpactSide, setBrainImpactSide] = useState<'left' | 'right' | 'center' | null>(null)

  // Randomized Polling: Selects 1 node every 1.5s - 2.5s
  useEffect(() => {
    const triggerFiring = () => {
      const randomIndex = Math.floor(Math.random() * CABLE_PATHS.length)
      const targetCable = CABLE_PATHS[randomIndex]

      // 1. Activate Node
      setActiveNodeIndex(randomIndex)
      setFiringPacket(targetCable)

      // 2. Data Packet Impact at Brain (~350ms after launch)
      setTimeout(() => {
        setBrainImpactSide(targetCable.side as 'left' | 'right' | 'center')
      }, 320)

      // 3. Reset Impact & Active Node
      setTimeout(() => {
        setBrainImpactSide(null)
        setActiveNodeIndex(null)
        setFiringPacket(null)
      }, 650)
    }

    // Initial trigger
    const initialTimer = setTimeout(triggerFiring, 1000)

    const interval = setInterval(() => {
      triggerFiring()
    }, 1800 + Math.random() * 800)

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
        {/* CSS Keyframe Animations */}
        <style>{`
          .brain-glow-breathe {
            animation: brainBreathe 3.5s ease-in-out infinite alternate;
            transform-origin: 160px 175px;
          }
          .dash-flow-line {
            stroke-dasharray: 6 5;
            animation: dashFlowAnim 1.6s linear infinite;
          }
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

          @keyframes brainBreathe {
            0% { opacity: 0.45; transform: scale(1); }
            100% { opacity: 0.85; transform: scale(1.03); }
          }
          @keyframes dashFlowAnim {
            0% { stroke-dashoffset: 22; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes floatA { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
          @keyframes floatB { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }
          @keyframes floatC { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-3px); } }
        `}</style>

        {/* Ambient Backlight Radial Glow */}
        <radialGradient id="tightBrainGlow" cx="50%" cy="54%" r="50%">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.5" />
          <stop offset="65%" stopColor="#3B82F6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0A0E1A" stopOpacity="0" />
        </radialGradient>

        {/* Realistic Brain Shading Gradients */}
        <linearGradient id="tightLeftGrad" x1="115" y1="130" x2="160" y2="220" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="30%" stopColor="#60A5FA" />
          <stop offset="75%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>

        <linearGradient id="tightRightGrad" x1="205" y1="130" x2="160" y2="220" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="30%" stopColor="#54A4E5" />
          <stop offset="75%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1E40AF" />
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

        {/* Intense Synaptic Flash Filter */}
        <filter id="synapticFlashGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Ambient Pulsing Glow Circle */}
      <circle cx="160" cy="175" r="115" fill="url(#tightBrainGlow)" className="brain-glow-breathe" />

      {/* ── 7 RADIATING CONNECTING CABLES ───────────────────────────────── */}
      <g stroke="#3B82F6" strokeWidth="2" opacity="0.35" strokeLinecap="round">
        {CABLE_PATHS.map((c) => (
          <path key={c.id} d={c.pathD} />
        ))}
      </g>

      {/* Animated Flow Cable Lines */}
      <g stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" className="dash-flow-line" opacity="0.9">
        {CABLE_PATHS.map((c) => (
          <path key={c.id} d={c.pathD} />
        ))}
      </g>

      {/* ── HIGH-SPEED SYNAPTIC DATA PACKET SHOOTING INWARD (300ms Travel) ── */}
      <AnimatePresence>
        {firingPacket && (
          <g>
            {/* Glowing Active Cable Line Segment */}
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

            {/* Glowing Synaptic Cyan Dot Data Packet */}
            <motion.circle
              r="4.5"
              fill="#38BDF8"
              filter="url(#tightSoftGlow)"
              initial={{ cx: firingPacket.startX, cy: firingPacket.startY, opacity: 1, scale: 1.4 }}
              animate={{ cx: firingPacket.endX, cy: firingPacket.endY, opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
            />
          </g>
        )}
      </AnimatePresence>

      {/* ── ANATOMICALLY ACCURATE BRAIN (WITH IMPACT RIPPLE FLASH) ─────────── */}
      <motion.g
        filter={brainImpactSide ? 'url(#synapticFlashGlow)' : 'url(#tightSoftGlow)'}
        animate={
          brainImpactSide
            ? {
                scale: [1, 1.04, 1],
                filter: [
                  'brightness(1)',
                  'brightness(1.5) drop-shadow(0 0 20px #38BDF8)',
                  'brightness(1)',
                ],
              }
            : {}
        }
        transition={{ duration: 0.28, ease: 'easeInOut' }}
        style={{ transformOrigin: '160px 175px' }}
      >
        {/* LEFT HEMISPHERE (Highlight on Left Impact) */}
        <motion.path
          d="M 157 126
             C 140 116, 118 122, 107 137
             C 98 149, 96 163, 103 176
             C 95 187, 95 202, 102 214
             C 96 223, 101 237, 114 244
             C 128 251, 150 246, 157 239 Z"
          fill="url(#tightLeftGrad)"
          stroke={brainImpactSide === 'left' ? '#38BDF8' : '#E0F2FE'}
          strokeWidth={brainImpactSide === 'left' ? 3 : 2}
          animate={brainImpactSide === 'left' ? { opacity: [1, 0.7, 1] } : {}}
        />

        {/* LEFT INTERLOCKING GYRI GROOVES */}
        <g stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" opacity="0.38">
          <path d="M 116 142 C 131 149, 146 141, 156 150" />
          <path d="M 104 161 C 121 161, 136 170, 156 166" />
          <path d="M 103 182 C 121 179, 137 190, 156 184" />
          <path d="M 106 203 C 121 199, 138 210, 156 204" />
          <path d="M 116 224 C 129 231, 144 222, 156 226" />
        </g>

        {/* 3D Depth Highlight (Left) */}
        <path d="M 112 142 C 126 135, 145 131, 155 133" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />

        {/* RIGHT HEMISPHERE (Highlight on Right Impact) */}
        <motion.path
          d="M 163 126
             C 180 116, 202 122, 213 137
             C 222 149, 224 163, 217 176
             C 225 187, 225 202, 218 214
             C 224 223, 219 237, 206 244
             C 192 251, 170 246, 163 239 Z"
          fill="url(#tightRightGrad)"
          stroke={brainImpactSide === 'right' ? '#38BDF8' : '#E0F2FE'}
          strokeWidth={brainImpactSide === 'right' ? 3 : 2}
          animate={brainImpactSide === 'right' ? { opacity: [1, 0.7, 1] } : {}}
        />

        {/* RIGHT INTERLOCKING GYRI GROOVES */}
        <g stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" opacity="0.38">
          <path d="M 204 142 C 189 149, 174 141, 164 150" />
          <path d="M 216 161 C 199 161, 184 170, 164 166" />
          <path d="M 217 182 C 199 179, 183 190, 164 184" />
          <path d="M 214 203 C 199 199, 182 210, 164 204" />
          <path d="M 204 224 C 191 231, 176 222, 164 226" />
        </g>

        {/* 3D Depth Highlight (Right) */}
        <path d="M 208 142 C 194 135, 175 131, 165 133" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />

        {/* Central Division Line */}
        <line x1="160" y1="122" x2="160" y2="242" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.95" />
      </motion.g>

      {/* ── IMPACT RIPPLE WAVE (Emits from Brain on Packet Impact) ──────── */}
      <AnimatePresence>
        {brainImpactSide && (
          <motion.circle
            cx={brainImpactSide === 'left' ? 135 : brainImpactSide === 'right' ? 185 : 160}
            cy="175"
            r="15"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="2.5"
            initial={{ r: 15, opacity: 0.9 }}
            animate={{ r: 48, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* ── ALL 7 SEPARATED DOCUMENT CARDS (WITH RANDOMIZED ACTIVE FIRING) ── */}

      {/* 1. Top Center Document (Index 0) */}
      <g transform="translate(142, 20)" className="doc-node">
        <motion.g
          className="doc-float-a"
          animate={
            activeNodeIndex === 0
              ? { scale: 1.15, filter: 'drop-shadow(0 0 18px #38BDF8)' }
              : { scale: 1, filter: 'drop-shadow(0 0 0px transparent)' }
          }
          transition={{ duration: 0.3 }}
          style={{ transformOrigin: '18px 22px' }}
        >
          <rect x="0" y="0" width="36" height="44" rx="5" fill="url(#tightDocLightGrad)" stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M 26 0 L 36 10 L 26 10 Z" fill="#3B82F6" />
          <rect x="6" y="10" width="18" height="2.5" rx="1" fill="#1D4ED8" />
          <rect x="6" y="17" width="24" height="2.2" rx="1" fill="#2563EB" />
          <rect x="6" y="23" width="20" height="2.2" rx="1" fill="#2563EB" />
          <rect x="6" y="29" width="24" height="2.2" rx="1" fill="#2563EB" />
        </motion.g>
      </g>

      {/* 2. Top Left Document (Index 1) */}
      <g transform="translate(65, 35)" className="doc-node">
        <motion.g
          className="doc-float-b"
          animate={
            activeNodeIndex === 1
              ? { scale: 1.15, filter: 'drop-shadow(0 0 18px #38BDF8)' }
              : { scale: 1, filter: 'drop-shadow(0 0 0px transparent)' }
          }
          transition={{ duration: 0.3 }}
          style={{ transformOrigin: '18px 22px' }}
        >
          <rect x="0" y="0" width="36" height="44" rx="5" fill="url(#tightDocLightGrad)" stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M 26 0 L 36 10 L 26 10 Z" fill="#3B82F6" />
          <rect x="6" y="10" width="18" height="2.5" rx="1" fill="#1D4ED8" />
          <rect x="6" y="17" width="24" height="2.2" rx="1" fill="#2563EB" />
          <rect x="6" y="23" width="20" height="2.2" rx="1" fill="#2563EB" />
          <rect x="6" y="29" width="24" height="2.2" rx="1" fill="#2563EB" />
        </motion.g>
      </g>

      {/* 3. Mid-Left Document (PSC) (Index 2) */}
      <g transform="translate(22, 145)" className="doc-node">
        <motion.g
          className="doc-float-c"
          animate={
            activeNodeIndex === 2
              ? { scale: 1.15, filter: 'drop-shadow(0 0 18px #38BDF8)' }
              : { scale: 1, filter: 'drop-shadow(0 0 0px transparent)' }
          }
          transition={{ duration: 0.3 }}
          style={{ transformOrigin: '19px 23px' }}
        >
          <rect x="0" y="0" width="38" height="46" rx="5" fill="url(#tightDocMedGrad)" stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M 28 0 L 38 10 L 28 10 Z" fill="#93C5FD" />
          <text x="19" y="28" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">PSC</text>
        </motion.g>
      </g>

      {/* 4. Bottom Left Document (Index 3) */}
      <g transform="translate(50, 245)" className="doc-node">
        <motion.g
          className="doc-float-a"
          animate={
            activeNodeIndex === 3
              ? { scale: 1.15, filter: 'drop-shadow(0 0 18px #38BDF8)' }
              : { scale: 1, filter: 'drop-shadow(0 0 0px transparent)' }
          }
          transition={{ duration: 0.3 }}
          style={{ transformOrigin: '18px 22px' }}
        >
          <rect x="0" y="0" width="36" height="44" rx="5" fill="url(#tightDocLightGrad)" stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M 26 0 L 36 10 L 26 10 Z" fill="#3B82F6" />
          <rect x="6" y="10" width="18" height="2.5" rx="1" fill="#1D4ED8" />
          <rect x="6" y="17" width="24" height="2.2" rx="1" fill="#2563EB" />
          <rect x="6" y="23" width="20" height="2.2" rx="1" fill="#2563EB" />
          <rect x="6" y="29" width="24" height="2.2" rx="1" fill="#2563EB" />
        </motion.g>
      </g>

      {/* 5. Top Right Document (PDF) (Index 4) */}
      <g transform="translate(215, 35)" className="doc-node">
        <motion.g
          className="doc-float-b"
          animate={
            activeNodeIndex === 4
              ? { scale: 1.15, filter: 'drop-shadow(0 0 18px #38BDF8)' }
              : { scale: 1, filter: 'drop-shadow(0 0 0px transparent)' }
          }
          transition={{ duration: 0.3 }}
          style={{ transformOrigin: '19px 23px' }}
        >
          <rect x="0" y="0" width="38" height="46" rx="5" fill="url(#tightDocMedGrad)" stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M 28 0 L 38 10 L 28 10 Z" fill="#93C5FD" />
          <text x="19" y="28" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">PDF</text>
        </motion.g>
      </g>

      {/* 6. Mid Right Document (Index 5) */}
      <g transform="translate(258, 145)" className="doc-node">
        <motion.g
          className="doc-float-c"
          animate={
            activeNodeIndex === 5
              ? { scale: 1.15, filter: 'drop-shadow(0 0 18px #38BDF8)' }
              : { scale: 1, filter: 'drop-shadow(0 0 0px transparent)' }
          }
          transition={{ duration: 0.3 }}
          style={{ transformOrigin: '18px 22px' }}
        >
          <rect x="0" y="0" width="36" height="44" rx="5" fill="url(#tightDocLightGrad)" stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M 26 0 L 36 10 L 26 10 Z" fill="#3B82F6" />
          <rect x="6" y="10" width="18" height="2.5" rx="1" fill="#1D4ED8" />
          <rect x="6" y="17" width="24" height="2.2" rx="1" fill="#2563EB" />
          <rect x="6" y="23" width="20" height="2.2" rx="1" fill="#2563EB" />
          <rect x="6" y="29" width="24" height="2.2" rx="1" fill="#2563EB" />
        </motion.g>
      </g>

      {/* 7. Bottom Right Document (Index 6) */}
      <g transform="translate(230, 245)" className="doc-node">
        <motion.g
          className="doc-float-a"
          animate={
            activeNodeIndex === 6
              ? { scale: 1.15, filter: 'drop-shadow(0 0 18px #38BDF8)' }
              : { scale: 1, filter: 'drop-shadow(0 0 0px transparent)' }
          }
          transition={{ duration: 0.3 }}
          style={{ transformOrigin: '18px 22px' }}
        >
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
