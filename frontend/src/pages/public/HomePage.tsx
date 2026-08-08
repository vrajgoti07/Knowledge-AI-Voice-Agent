// ============================================================
// Page 1 — Landing Page (HomePage)
// Upgraded with 4 New Animated Voice AI Sections:
// 1. "How it Works" (Scroll-Triggered Neon Pipeline Flow)
// 2. "Use Cases" (3D Tilt Cards with Hover Audio Waveform)
// 3. "Pricing & Voice FAQ" (Spotlight Border Sweep + Spring Accordions)
// 4. "Under the Hood" (Terminal Typewriter Mission + Floating Tech Badges)
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, AnimatePresence, type Variants } from 'framer-motion'
import {
  Play, Database, MessageSquare, Users, CheckCircle2,
  Search, ArrowRight, ShieldCheck, Zap, ChevronDown,
  Hexagon, Triangle, Circle, Square, Layers, Box, Cpu, Globe,
  Mic, Volume2, Activity, FileText, Sparkles, Terminal, Code2, Check
} from 'lucide-react'
import { Button, Card, Badge, Modal } from '@/components/ui'
import { BrainNetworkMotif } from '@/components/common/BrainNetworkMotif'
import { TopographicalGrid } from '@/components/home/TopographicalGrid'
import { ROUTES } from '@/constants'

// ── TRUSTED BY ORGANIZATIONS DATA ────────────────────────────────
const TRUSTED_LOGOS = [
  { name: 'Acme Corp', icon: Hexagon },
  { name: 'Nexus AI', icon: Triangle },
  { name: 'Veritas Lab', icon: Circle },
  { name: 'Aether Research', icon: Square },
  { name: 'Quantum Labs', icon: Layers },
  { name: 'Apex Engineering', icon: Box },
  { name: 'Cybernet X', icon: Cpu },
  { name: 'Global Data', icon: Globe },
]

// ── FREQUENTLY ASKED QUESTIONS DATA ─────────────────────────────
const FAQ_ITEMS = [
  {
    id: 1,
    question: 'How secure is my enterprise data?',
    answer: 'We use SOC2 Type II compliant encryption. Your data is never used to train public models.',
  },
  {
    id: 2,
    question: 'What file types do you support?',
    answer: 'We support PDFs, DOCX, TXT, Markdown, and direct integrations with Google Drive and Notion.',
  },
  {
    id: 3,
    question: 'Can I integrate this with my own app?',
    answer: 'Yes, our Enterprise plan includes full API access to our RAG engine.',
  },
]

// ── TECH STACK BADGES ───────────────────────────────────────────
const TECH_STACK_BADGES = [
  {
    name: 'React.js & Vite',
    category: 'Frontend',
    icon: Code2,
    description: 'Powers the responsive, real-time user interface.',
    animationClass: 'float-badge-a',
  },
  {
    name: 'Python FastAPI',
    category: 'Backend',
    icon: Terminal,
    description: 'Handles high-concurrency requests and AI routing.',
    animationClass: 'float-badge-b',
  },
  {
    name: 'Qdrant Vector DB',
    category: 'Storage',
    icon: Database,
    description: 'Stores high-dimensional vectors for lightning-fast retrieval.',
    animationClass: 'float-badge-c',
  },
  {
    name: 'Gemini 2.5 Flash',
    category: 'AI Model',
    icon: Cpu,
    description: 'Provides the core reasoning and synthesis engine.',
    animationClass: 'float-badge-a',
  },
  {
    name: 'WebRTC Audio Engine',
    category: 'Voice Stream',
    icon: Mic,
    description: 'Enables ultra-low latency, bi-directional audio streaming.',
    animationClass: 'float-badge-b',
  },
  {
    name: 'HNSW Graph Index',
    category: 'Vector Search',
    icon: Layers,
    description: 'Ensures scalable, sub-millisecond similarity search.',
    animationClass: 'float-badge-c',
  },
]

// ── CUSTOM NUMBER COUNT-UP COMPONENT ─────────────────────────────
function CountUpNumber({ end, decimals = 0, duration = 1.5, suffix = '' }: { end: number; decimals?: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement | null>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  useEffect(() => {
    if (!isInView) return

    let startTime: number | null = null
    let animationFrameId: number

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      setCount(easedProgress * end)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step)
      }
    }

    animationFrameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationFrameId)
  }, [isInView, end, duration])

  return (
    <span ref={ref} className="font-mono font-semibold">
      {count.toFixed(decimals)}
      {suffix}
    </span>
  )
}

// ── CUSTOM TYPEWRITER CHARACTER REVEAL COMPONENT ─────────────────
function TypewriterText({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement | null>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  const sentenceVariants: Variants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.012,
      },
    },
  }

  const letterVariants: Variants = {
    hidden: { opacity: 0, y: 2 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <p ref={ref} className="text-xs text-[#94A3B8] leading-relaxed min-h-[48px]">
      {isInView ? (
        <motion.span variants={sentenceVariants} initial="hidden" animate="visible">
          {text.split('').map((char, index) => (
            <motion.span key={index} variants={letterVariants}>
              {char}
            </motion.span>
          ))}
        </motion.span>
      ) : (
        <span className="opacity-0">{text}</span>
      )}
    </p>
  )
}

// ── TERMINAL TYPEWRITER EFFECT FOR TECH CARDS ───────────────────
function TerminalTypewriter({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    let index = 0
    setDisplayedText('')
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1))
        index++
      } else {
        clearInterval(timer)
      }
    }, 18)
    return () => clearInterval(timer)
  }, [text])

  return <span>{displayedText}</span>
}

function TerminalCard({ badge, idx }: { badge: typeof TECH_STACK_BADGES[number]; idx: number }) {
  const [isHovered, setIsHovered] = useState(false)
  const IconComp = badge.icon

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`h-[195px] rounded-2xl border transition-all duration-300 relative overflow-hidden cursor-pointer ${badge.animationClass} ${isHovered
          ? 'bg-[#030712] border-[#38BDF8] shadow-[0_0_30px_rgba(56,189,248,0.4),inset_0_0_20px_rgba(56,189,248,0.12)]'
          : 'bg-[#121A2C] border-[#1E293B]'
        }`}
    >
      {/* Layer 1: Front / Default (Icon, Title, Subtitle Centered) */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 transition-all duration-150 ease-out ${isHovered ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100 pointer-events-auto'
          }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-[#16213A] border border-[#1E293B] flex items-center justify-center text-[#38BDF8] shadow-md">
          <IconComp className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-base sm:text-lg font-bold text-[#F1F5F9] leading-snug">{badge.name}</h4>
          <p className="text-xs sm:text-sm font-mono text-[#64748B] mt-0.5">{badge.category}</p>
        </div>
      </div>

      {/* Layer 2: Terminal Execution Screen */}
      <div
        className={`absolute inset-0 p-5 font-mono text-xs flex flex-col justify-center space-y-2.5 text-left transition-opacity duration-200 ${isHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
      >
        {/* Terminal Header Bar */}
        <div className="flex items-center gap-1.5 pb-2 border-b border-[#1E293B] text-[10px] text-[#64748B]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
          <span className="ml-2 font-mono text-[#38BDF8]">bash ~ {badge.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}</span>
        </div>

        {/* Terminal Command Output Lines */}
        <div className="space-y-1.5 pt-1 text-[11px] sm:text-xs">
          <p className="flex items-center gap-1.5 text-[#38BDF8]">
            <span className="text-[#22C55E] font-bold">&gt;</span>
            <span className="text-[#94A3B8]">init:</span>
            <span className="text-[#F1F5F9]">{badge.category.toLowerCase()}_module</span>
          </p>
          <p className="flex items-center gap-1.5 text-[#22C55E]">
            <span className="font-bold">&gt;</span>
            <span className="text-[#94A3B8]">status:</span>
            <span className="text-[#22C55E]">200_ONLINE</span>
          </p>
          <p className="text-[#F1F5F9] leading-relaxed pt-1.5 border-t border-[#1E293B]/60 text-[11px] sm:text-xs">
            <span className="text-[#38BDF8] font-bold">&gt; output: </span>
            {isHovered ? <TerminalTypewriter text={badge.description} /> : null}
            <span className="inline-block w-2 h-3.5 bg-[#38BDF8] ml-1 animate-pulse align-middle" />
          </p>
        </div>
      </div>
    </div>
  )
}

// ── MOUSE-TRACKING SPOTLIGHT GLOW FEATURE CARD ──────────────────
function SpotlightFeatureCard({
  icon: IconComp,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative h-full rounded-2xl bg-[#121A2C] border border-[#1E293B] p-6 space-y-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(56,189,248,0.22)] overflow-hidden cursor-pointer"
    >
      {/* Dynamic Cursor-Tracking Soft Radial Background Glow */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(500px circle at ${mousePos.x}px ${mousePos.y}px, rgba(56, 189, 248, 0.15), transparent 80%)`,
        }}
      />

      {/* Dynamic Cursor-Tracking Border Edge Illumination */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(56, 189, 248, 0.75), rgba(96, 165, 250, 0.3) 45%, transparent 80%)`,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          padding: '1px',
        }}
      />

      {/* Card Content (Fixed Structure & Text) */}
      <div className="relative z-10 space-y-4">
        <div className="w-12 h-12 rounded-xl bg-[#16213A] border border-[#1E293B] flex items-center justify-center text-[#60A5FA] group-hover:border-[#38BDF8]/50 group-hover:text-[#38BDF8] transition-colors shadow-sm">
          <IconComp className="w-6 h-6" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-[#F1F5F9] leading-snug">{title}</h3>
        <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [demoOpen, setDemoOpen] = useState(false)
  const [openFaqId, setOpenFaqId] = useState<number | null>(1)
  const [hoveredUseCase, setHoveredUseCase] = useState<number | null>(null)

  // Section 1: Workflow Scroll-Trigger Ref
  const workflowRef = useRef<HTMLDivElement | null>(null)
  const isWorkflowInView = useInView(workflowRef, { once: true, margin: '-100px' })

  // Cascade Reveal Stagger Variants for 3 Feature Cards
  const gridContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  }

  const gridCardVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 20,
      },
    },
  }

  return (
    <div className="relative min-w-0 space-y-24 pb-20 bg-transparent text-[#F1F5F9]">
      {/* Embedded CSS Animations for Floating Badges & Waveform Playing */}
      <style>{`
        .float-badge-a { animation: badgeFloatA 3.4s ease-in-out infinite alternate; }
        .float-badge-b { animation: badgeFloatB 4.0s ease-in-out 0.5s infinite alternate; }
        .float-badge-c { animation: badgeFloatC 3.7s ease-in-out 0.9s infinite alternate; }

        @keyframes badgeFloatA { 0% { transform: translateY(0px); } 100% { transform: translateY(-7px); } }
        @keyframes badgeFloatB { 0% { transform: translateY(0px); } 100% { transform: translateY(-9px); } }
        @keyframes badgeFloatC { 0% { transform: translateY(0px); } 100% { transform: translateY(-5px); } }

        .waveform-bar {
          animation: waveBar 0.8s ease-in-out infinite alternate;
        }
        @keyframes waveBar {
          0% { height: 4px; }
          100% { height: 26px; }
        }

        .spotlight-pro-border {
          position: relative;
          border-radius: 1.25rem;
          background: #121A2C;
        }
        .spotlight-pro-border::before {
          content: '';
          position: absolute;
          inset: -1.5px;
          border-radius: 1.35rem;
          padding: 1.5px;
          background: linear-gradient(90deg, #38BDF8, #22C55E, #3B82F6, #38BDF8);
          background-size: 300% 300%;
          animation: spotlightSweep 4s linear infinite;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        @keyframes spotlightSweep {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
      `}</style>

      {/* ── 3D TOPOGRAPHICAL DATA GRID GLOBAL BACKGROUND (FIXED Z-0) ──────── */}
      <TopographicalGrid />

      {/* ── 1. CENTERED HERO SECTION ───────────────────────────────────── */}
      <section className="pt-20 lg:pt-28 max-w-7xl mx-auto w-full px-6 lg:px-8 text-center space-y-8 relative z-10">
        {/* Eyebrow Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center justify-center"
        >
          <Badge variant="primary" size="md" className="py-1.5 px-4 font-semibold text-xs border border-[#3B82F6]/30 shadow-sm backdrop-blur-md bg-[#121A2C]/80">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse mr-2" />
            Gemini 2.5 Flash & Hybrid RAG Engine
          </Badge>
        </motion.div>

        {/* Main Title H1 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-4"
        >
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#F1F5F9] leading-tight max-w-4xl mx-auto">
            Knowledge AI: Find Answers{' '}
            <span className="text-[#60A5FA] bg-clip-text text-transparent bg-gradient-to-r from-[#60A5FA] to-[#93C5FD]">
              Instantly.
            </span>{' '}
            Build Understanding.
          </h1>

          <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed max-w-2xl mx-auto">
            Unified access to all your team's knowledge, documents, and data. Instantly searchable, understandable, and collaborative.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-4 pt-2"
        >
          <Link to={ROUTES.REGISTER}>
            <Button size="lg" variant="primary" pill rightIcon={<ArrowRight className="w-4 h-4" />}>
              Start Free Trial
            </Button>
          </Link>

          <Button size="lg" variant="ghost" pill leftIcon={<Play className="w-4 h-4 text-[#60A5FA]" />} onClick={() => setDemoOpen(true)}>
            Watch Demo
          </Button>
        </motion.div>
      </section>

      {/* ── 2. CENTERED HERO INTERACTIVE SHOWCASE CARD (Neural Pulse) ─── */}
      <section className="max-w-7xl mx-auto w-full px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="p-6 sm:p-8 space-y-6 overflow-hidden border-[#1E293B] shadow-2xl bg-[#121A2C]/90 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-4 text-xs text-[#94A3B8]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-pulse" />
                <span className="font-semibold text-[#F1F5F9]">Live Knowledge Assistant</span>
              </div>
              <span className="font-mono text-[11px] text-[#60A5FA] px-2.5 py-0.5 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/20">
                Gemini 2.5 Flash
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Chat Mock Left (7 cols) */}
              <div className="md:col-span-7 space-y-3.5 text-xs">
                {/* User Question Bubble */}
                <div className="p-3.5 rounded-xl bg-[#16213A] text-[#F1F5F9] border border-[#1E293B]">
                  <span className="font-semibold text-[#60A5FA] block text-[11px] mb-1">USER QUERY</span>
                  What is Machine Learning (ML)?
                </div>

                {/* AI Response Bubble */}
                <div className="p-4 rounded-xl bg-[#0A0E1A] border border-[#1E293B] text-[#94A3B8] space-y-2.5">
                  <div className="flex items-center justify-between text-[#60A5FA] font-semibold text-[11px]">
                    <span>AI SYNTHESIS RESPONSE</span>
                    <span className="text-[#22C55E] text-[10px] font-mono">1.8s Grounded</span>
                  </div>
                  <p className="leading-relaxed text-[#F1F5F9]">
                    Machine Learning (ML) is a branch of artificial intelligence focused on building algorithms that learn patterns from data to make predictions or decisions without being explicitly programmed [1]. Key paradigms include supervised, unsupervised, and reinforcement learning [2].
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="px-2.5 py-1 rounded-lg bg-[#16213A] text-[#60A5FA] text-[10px] font-mono border border-[#1E293B]">
                      [1] Machine_Learning_Fundamentals.pdf (p.3)
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#16213A] text-[#60A5FA] text-[10px] font-mono border border-[#1E293B]">
                      [2] AI_Paradigms_Overview.docx (p.8)
                    </span>
                  </div>
                </div>
              </div>

              {/* Brain/Network Motif Right (5 cols) — NEURAL PULSE BREATHING & INWARD DASHFLOW */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-4 rounded-xl bg-[#0A0E1A]/50 border border-[#1E293B]/50 text-center">
                <BrainNetworkMotif size={250} />
                <span className="text-[11px] text-[#64748B] font-mono mt-2">100+ Connected Knowledge Nodes</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* ── 3. TRUSTED BY ORGANIZATIONS SECTION (INFINITE MARQUEE) ────── */}
      <section className="max-w-7xl mx-auto w-full px-6 lg:px-8 relative z-10">
        <div className="space-y-6">
          <p className="text-slate-400 text-xs sm:text-sm font-semibold uppercase tracking-wider text-center">
            Empowering research teams at innovative organizations
          </p>

          {/* Marquee Wrapper with Edge Mask */}
          <div
            className="overflow-hidden py-4"
            style={{
              maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            }}
          >
            <motion.div
              className="flex items-center gap-12 w-max"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 25, ease: 'linear', repeat: Infinity }}
            >
              {[...TRUSTED_LOGOS, ...TRUSTED_LOGOS].map((logo, idx) => {
                const IconComponent = logo.icon
                return (
                  <div
                    key={`${logo.name}-${idx}`}
                    className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#121A2C]/60 border border-[#1E293B]/80 text-[#94A3B8] hover:text-[#F1F5F9] transition-colors shrink-0"
                  >
                    <IconComponent className="w-5 h-5 text-[#60A5FA]" />
                    <span className="font-semibold text-sm tracking-wide text-[#F1F5F9]">{logo.name}</span>
                  </div>
                )
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECTION 1: "HOW IT WORKS" (SCROLL-TRIGGERED NEON PIPELINE) ──── */}
      <section ref={workflowRef} id="features" className="max-w-7xl mx-auto w-full px-6 lg:px-8 relative z-10">
        <div className="text-center space-y-3 mb-12">
          <Badge variant="primary" size="md" className="py-1 px-3">
            3-Step Voice Workflow
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#F1F5F9] tracking-tight">
            How It Works
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] max-w-lg mx-auto">
            From raw data ingestion to instant human-like audio synthesis in 3 seamless steps.
          </p>
        </div>

        <div className="relative pt-6">
          {/* Glowing Connecting Neon Line */}
          <div className="hidden md:block absolute top-[52px] left-[15%] right-[15%] h-1 bg-[#1E293B] rounded-full overflow-hidden z-0">
            <motion.div
              className="h-full bg-gradient-to-r from-[#38BDF8] via-[#60A5FA] to-[#22C55E] shadow-[0_0_15px_#38BDF8]"
              initial={{ width: '0%' }}
              animate={isWorkflowInView ? { width: '100%' } : { width: '0%' }}
              transition={{ duration: 1.8, ease: 'easeInOut' }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {/* Step 1: Connect Data */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isWorkflowInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center text-center space-y-4"
            >
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-700 border ${isWorkflowInView
                    ? 'bg-[#121A2C] border-[#22C55E] text-[#22C55E] shadow-[0_0_25px_rgba(34,197,94,0.4)] scale-105'
                    : 'bg-[#121A2C] border-[#1E293B] text-[#60A5FA]'
                  }`}
              >
                <Database className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-mono text-[#38BDF8] uppercase tracking-wider">STEP 01</span>
                <h3 className="text-lg font-bold text-[#F1F5F9]">Connect Data</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed max-w-xs">
                  Upload PDFs, DOCX, notes, or connect live databases to your enterprise neural index.
                </p>
              </div>
            </motion.div>

            {/* Step 2: Ask Out Loud */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isWorkflowInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-col items-center text-center space-y-4"
            >
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-700 border ${isWorkflowInView
                    ? 'bg-[#121A2C] border-[#22C55E] text-[#22C55E] shadow-[0_0_25px_rgba(34,197,94,0.4)] scale-105'
                    : 'bg-[#121A2C] border-[#1E293B] text-[#60A5FA]'
                  }`}
              >
                <Mic className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-mono text-[#38BDF8] uppercase tracking-wider">STEP 02</span>
                <h3 className="text-lg font-bold text-[#F1F5F9]">Ask Out Loud</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed max-w-xs">
                  Speak natural queries directly to your voice assistant without typing a single word.
                </p>
              </div>
            </motion.div>

            {/* Step 3: Hear Answers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isWorkflowInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 1.0 }}
              className="flex flex-col items-center text-center space-y-4"
            >
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-700 border ${isWorkflowInView
                    ? 'bg-[#121A2C] border-[#22C55E] text-[#22C55E] shadow-[0_0_25px_rgba(34,197,94,0.4)] scale-105'
                    : 'bg-[#121A2C] border-[#1E293B] text-[#60A5FA]'
                  }`}
              >
                <Activity className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-mono text-[#38BDF8] uppercase tracking-wider">STEP 03</span>
                <h3 className="text-lg font-bold text-[#F1F5F9]">Hear Answers</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed max-w-xs">
                  Listen to crystal-clear voice synthesis backed by exact page-level source citations.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 4. CASCADE REVEAL FEATURES GRID (FULL-WIDTH 3 COLS WITH SPOTLIGHT GLOW) ── */}
      <section className="max-w-7xl mx-auto w-full px-6 lg:px-8 relative z-10">
        <motion.div
          variants={gridContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <motion.div variants={gridCardVariants} className="h-full">
            <SpotlightFeatureCard
              icon={Database}
              title="Unified Knowledge"
              description="Connect PDFs, Google Drive, wikis, databases — we index everything for seamless access."
            />
          </motion.div>

          <motion.div variants={gridCardVariants} className="h-full">
            <SpotlightFeatureCard
              icon={MessageSquare}
              title="Instant Answers"
              description="Ask in plain English, get cited responses — no more endless manual searching."
            />
          </motion.div>

          <motion.div variants={gridCardVariants} className="h-full">
            <SpotlightFeatureCard
              icon={Users}
              title="Team Collaboration"
              description="Share insights, collections, and citations with your team — keep everyone aligned and productive."
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ── SECTION 2: "USE CASES" (3D TILT CARDS & HOVER WAVEFORM) ──────── */}
      <section className="max-w-7xl mx-auto w-full px-6 lg:px-8 relative z-10">
        <div className="text-center space-y-3 mb-10">
          <Badge variant="primary" size="md" className="py-1 px-3">
            Voice AI Applications
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#F1F5F9] tracking-tight">
            Tailored Voice Use Cases
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] max-w-lg mx-auto">
            Designed for high-speed workflows where traditional typing is too slow or impossible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Hands-Free Troubleshooting */}
          <motion.div
            onMouseEnter={() => setHoveredUseCase(1)}
            onMouseLeave={() => setHoveredUseCase(null)}
            whileHover={{ scale: 1.025, rotateX: 2, rotateY: -2 }}
            transition={{ duration: 0.25 }}
            className={`p-6 sm:p-8 rounded-2xl bg-[#121A2C] border transition-all duration-300 flex flex-col justify-between space-y-6 cursor-pointer ${hoveredUseCase === 1
                ? 'border-[#38BDF8] shadow-[0_0_30px_rgba(56,189,248,0.4)]'
                : 'border-[#1E293B]'
              }`}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#16213A] border border-[#1E293B] flex items-center justify-center text-[#38BDF8]">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#F1F5F9]">Hands-Free Troubleshooting</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Diagnose complex engineering issues while keeping your hands on the machinery. Query technical manuals verbally in real time.
              </p>
            </div>

            {/* Audio Waveform Graphic */}
            <div className="flex items-center gap-1.5 h-8 pt-2 border-t border-[#1E293B]">
              <span className="text-[11px] font-mono text-[#60A5FA] mr-2">AUDIO STATE:</span>
              {[0.2, 0.5, 0.8, 0.3, 0.7, 0.4, 0.9, 0.2].map((delay, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full bg-[#38BDF8] ${hoveredUseCase === 1 ? 'waveform-bar' : 'h-1.5 opacity-40'
                    }`}
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
            </div>
          </motion.div>

          {/* Card 2: Audio Study Guides */}
          <motion.div
            onMouseEnter={() => setHoveredUseCase(2)}
            onMouseLeave={() => setHoveredUseCase(null)}
            whileHover={{ scale: 1.025, rotateX: 2, rotateY: 0 }}
            transition={{ duration: 0.25 }}
            className={`p-6 sm:p-8 rounded-2xl bg-[#121A2C] border transition-all duration-300 flex flex-col justify-between space-y-6 cursor-pointer ${hoveredUseCase === 2
                ? 'border-[#38BDF8] shadow-[0_0_30px_rgba(56,189,248,0.4)]'
                : 'border-[#1E293B]'
              }`}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#16213A] border border-[#1E293B] flex items-center justify-center text-[#38BDF8]">
                <Volume2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#F1F5F9]">Audio Study Guides</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Convert lengthy research papers and textbooks into interactive voice Q&A sessions. Test your retention with verbal quizzes.
              </p>
            </div>

            {/* Audio Waveform Graphic */}
            <div className="flex items-center gap-1.5 h-8 pt-2 border-t border-[#1E293B]">
              <span className="text-[11px] font-mono text-[#60A5FA] mr-2">AUDIO STATE:</span>
              {[0.4, 0.7, 0.2, 0.9, 0.3, 0.6, 0.5, 0.8].map((delay, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full bg-[#38BDF8] ${hoveredUseCase === 2 ? 'waveform-bar' : 'h-1.5 opacity-40'
                    }`}
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
            </div>
          </motion.div>

          {/* Card 3: On-the-Go Retrieval */}
          <motion.div
            onMouseEnter={() => setHoveredUseCase(3)}
            onMouseLeave={() => setHoveredUseCase(null)}
            whileHover={{ scale: 1.025, rotateX: 2, rotateY: 2 }}
            transition={{ duration: 0.25 }}
            className={`p-6 sm:p-8 rounded-2xl bg-[#121A2C] border transition-all duration-300 flex flex-col justify-between space-y-6 cursor-pointer ${hoveredUseCase === 3
                ? 'border-[#38BDF8] shadow-[0_0_30px_rgba(56,189,248,0.4)]'
                : 'border-[#1E293B]'
              }`}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#16213A] border border-[#1E293B] flex items-center justify-center text-[#38BDF8]">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#F1F5F9]">On-the-Go Retrieval</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Query your enterprise Knowledge Base while commuting or walking between meetings. Receive concise voice summaries instantly.
              </p>
            </div>

            {/* Audio Waveform Graphic */}
            <div className="flex items-center gap-1.5 h-8 pt-2 border-t border-[#1E293B]">
              <span className="text-[11px] font-mono text-[#60A5FA] mr-2">AUDIO STATE:</span>
              {[0.3, 0.8, 0.4, 0.6, 0.2, 0.9, 0.7, 0.5].map((delay, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full bg-[#38BDF8] ${hoveredUseCase === 3 ? 'waveform-bar' : 'h-1.5 opacity-40'
                    }`}
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 5. PERFORMANCE CARD (LATENCY TYPEWRITER & NUMBER COUNT-UP) ─ */}
      <section id="solutions" className="max-w-7xl mx-auto w-full px-6 lg:px-8 relative z-10">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F1F5F9]">
            Simplified Highlight Overview
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] max-w-lg mx-auto">
            Everything your team needs to accelerate research and eliminate information silos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left Column: Vector Search & Speed Performance Card (Typewriter & Count-Up) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="h-full flex flex-col"
          >
            <Card className="p-6 sm:p-8 space-y-6 border-[#1E293B] bg-[#121A2C] flex flex-col justify-between h-full">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 text-sm font-semibold text-[#60A5FA]">
                  <div className="p-2 rounded-lg bg-[#16213A] border border-[#1E293B]">
                    <Search className="w-4 h-4" />
                  </div>
                  <span>Instant Vector Search & Retrieval</span>
                </div>

                <h3 className="text-xl font-semibold text-[#F1F5F9]">
                  Sub-2 Second Hybrid Search Latency
                </h3>

                {/* Staggered Typewriter Character Reveal */}
                <TypewriterText text="Hybrid BM25 keyword matching combined with HNSW graph vector indexing processes over 100+ enterprise documents with precision citations." />
              </div>

              {/* Number Count-Up Metrics (0 -> 420 ms & 0.0 -> 98.4 %) */}
              <div className="space-y-3 pt-4 border-t border-[#1E293B]">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0A0E1A] border border-[#1E293B] text-xs">
                  <span className="text-[#94A3B8] flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#60A5FA]" /> Indexing Latency:
                  </span>
                  <span className="text-[#22C55E]">
                    &lt; <CountUpNumber end={420} duration={1.5} suffix=" ms" />
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0A0E1A] border border-[#1E293B] text-xs">
                  <span className="text-[#94A3B8] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#60A5FA]" /> Citation Precision:
                  </span>
                  <span className="text-[#F1F5F9]">
                    <CountUpNumber end={98.4} decimals={1} duration={1.5} suffix="% Top-k Recall" />
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Right Column: The Smarter Way to Learn & CTA Card */}
          <div className="space-y-6 flex flex-col justify-between">
            {/* 2x2 Checklist Grid */}
            <Card className="p-6 space-y-4 border-[#1E293B] bg-[#121A2C]">
              <h3 className="text-base font-semibold text-[#F1F5F9]">
                The Smarter Way to Learn
              </h3>

              <div className="grid grid-cols-2 gap-3 pt-1 text-xs font-medium text-[#F1F5F9]">
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0A0E1A] border border-[#1E293B]">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
                  <span>Save Time</span>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0A0E1A] border border-[#1E293B]">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
                  <span>Reduce Search</span>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0A0E1A] border border-[#1E293B]">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
                  <span>Faster Onboarding</span>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0A0E1A] border border-[#1E293B]">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
                  <span>Verified Sources</span>
                </div>
              </div>
            </Card>

            {/* High-Impact CTA Card */}
            <Card className="p-6 space-y-4 text-center border-[#3B82F6]/50 bg-gradient-to-b from-[#121A2C] to-[#16213A]">
              <div className="w-10 h-10 rounded-full bg-[#3B82F6]/20 text-[#60A5FA] flex items-center justify-center mx-auto">
                <Zap className="w-5 h-5" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[#F1F5F9]">
                  Ready to Unlock Your Team's Intelligence?
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Knowledge AI is free to start. Setup takes under 2 minutes.
                </p>
              </div>

              <Link to={ROUTES.REGISTER} className="block pt-2">
                <Button variant="primary" pill fullWidth>
                  Create Your Free Account
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: PRICING & VOICE FAQ ───────────────────────────── */}
      <section id="pricing" className="max-w-7xl mx-auto w-full px-6 lg:px-8 relative z-10 space-y-16">
        {/* Pricing Sub-Section */}
        <div className="space-y-10">
          <div className="text-center space-y-3">
            <Badge variant="primary" size="md" className="py-1 px-3">
              Simple & Transparent Pricing
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#F1F5F9] tracking-tight">
              Choose Your Knowledge Tier
            </h2>
            <p className="text-xs sm:text-sm text-[#94A3B8] max-w-lg mx-auto">
              Start free and scale effortlessly as your team's voice query volume grows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* 1. Free Tier Card */}
            <div className="p-8 rounded-2xl bg-[#121A2C] border border-[#1E293B] hover:border-[#38BDF8]/40 transition-all space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#F1F5F9]">Free Tier</h3>
                  <Badge variant="neutral" size="sm">Starter</Badge>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#F1F5F9]">$0</span>
                  <span className="text-xs text-[#94A3B8]">/ month forever</span>
                </div>
                <p className="text-xs text-[#94A3B8]">Ideal for individual researchers testing voice RAG capability.</p>

                <ul className="space-y-3 pt-4 text-xs text-[#F1F5F9]">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#22C55E]" />
                    <span>Up to 100 voice queries / month</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#22C55E]" />
                    <span>5 Document uploads (PDF, DOCX)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#22C55E]" />
                    <span>Standard vector search indexing</span>
                  </li>
                </ul>
              </div>

              <Link to={ROUTES.REGISTER}>
                <Button variant="ghost" fullWidth pill>
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* 2. Pro Tier Card (Continuous Spotlight Sweep Border Animation) */}
            <div className="spotlight-pro-border p-8 space-y-6 flex flex-col justify-between shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#F1F5F9]">Pro Tier</h3>
                  <span className="px-3 py-1 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/40 text-[#38BDF8] text-xs font-semibold">
                    Most Popular
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#F1F5F9]">$29</span>
                  <span className="text-xs text-[#94A3B8]">/ month per user</span>
                </div>
                <p className="text-xs text-[#94A3B8]">Built for growing research teams needing instant, high-speed voice answers.</p>

                <ul className="space-y-3 pt-4 text-xs text-[#F1F5F9]">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#38BDF8]" />
                    <span className="font-semibold">Unlimited Voice AI Queries</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#38BDF8]" />
                    <span>Unlimited Document Uploads & Collections</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#38BDF8]" />
                    <span>Priority Gemini 2.5 Flash RAG Engine</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#38BDF8]" />
                    <span>SOC2 Type II Compliant Security</span>
                  </li>
                </ul>
              </div>

              <Link to={ROUTES.REGISTER}>
                <Button variant="primary" fullWidth pill>
                  Upgrade to Pro Tier
                </Button>
              </Link>
            </div>

            {/* 3. Enterprise Tier Card */}
            <div className="p-8 rounded-2xl bg-[#121A2C] border border-[#1E293B] hover:border-[#38BDF8]/40 transition-all space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#F1F5F9]">Enterprise</h3>
                  <span className="px-3 py-1 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/40 text-[#22C55E] text-xs font-semibold">
                    Dedicated
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#F1F5F9]">$99</span>
                  <span className="text-xs text-[#94A3B8]">/ month per org</span>
                </div>
                <p className="text-xs text-[#94A3B8]">For large organizations requiring dedicated vector clusters & custom SLAs.</p>

                <ul className="space-y-3 pt-4 text-xs text-[#F1F5F9]">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#22C55E]" />
                    <span className="font-semibold">Everything in Pro Tier</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#22C55E]" />
                    <span>Dedicated Qdrant Vector Cluster</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#22C55E]" />
                    <span>Custom Webhook & REST API Access</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#22C55E]" />
                    <span>24/7 Dedicated SLA & Support</span>
                  </li>
                </ul>
              </div>

              <Link to={ROUTES.REGISTER}>
                <Button variant="outline" fullWidth pill>
                  Get Enterprise
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: "UNDER THE HOOD" (TECH STACK & ABOUT MISSION) ────── */}
      <section id="about" className="max-w-7xl mx-auto w-full px-6 lg:px-8 relative z-10 space-y-12">
        {/* 1. Header Section (Centered Above Grid) */}
        <div className="text-center space-y-4 max-w-[800px] mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-xs text-[#38BDF8] font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>UNDER THE HOOD</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold text-[#F1F5F9] tracking-tight leading-tight">
            Built with Passion as a College AI Capstone
          </h2>

          <TypewriterText text="Knowledge AI began as an ambitious college project to solve information discovery bottlenecks in complex research environments. We combined cutting-edge hybrid RAG vector search with real-time neural voice synthesis to deliver immediate, cited answers out loud." />

          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs font-mono text-[#94A3B8]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
              <span>100% Open Architecture</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" />
              <span>Sub-300ms Audio Latency</span>
            </div>
          </div>
        </div>

        {/* 2. Independent Floating Grid Cards (Centered 3x2 Grid - Terminal Execution Screen) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-[1200px] mx-auto">
          {TECH_STACK_BADGES.map((badge, idx) => (
            <TerminalCard key={idx} badge={badge} idx={idx} />
          ))}
        </div>
      </section>

      {/* ── 6. FREQUENTLY ASKED QUESTIONS (GENERAL FAQ) SECTION ────────── */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto w-full px-6 lg:px-8 relative z-10 space-y-8"
      >
        <div className="max-w-[800px] mx-auto space-y-8">
          {/* Left-Aligned Header */}
          <div className="text-left">
            <h1 className="text-7xl sm:text-7xl font-extrabold text-white tracking-tighter">
              FAQ
            </h1>
          </div>

          {/* Vertical Stacked Accordion Container */}
          <div className="space-y-4">
            {FAQ_ITEMS.map((faq) => {
              const isOpen = openFaqId === faq.id
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl bg-[#121A2C] border border-[#1E293B] p-5 hover:border-[#38BDF8]/40 transition-colors shadow-lg"
                >
                  {/* Header Question Bar */}
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full flex items-center justify-between text-left gap-4 cursor-pointer outline-none"
                  >
                    <span
                      className={`text-sm sm:text-base font-semibold transition-colors duration-300 ${isOpen ? 'text-[#38BDF8]' : 'text-[#F1F5F9]'
                        }`}
                    >
                      {faq.question}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 15 }}
                      className="w-8 h-8 rounded-full bg-[#16213A] border border-[#1E293B] flex items-center justify-center text-[#60A5FA] shrink-0"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </button>

                  {/* Expandable Accordion Body */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                        className="overflow-hidden"
                      >
                        <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed pt-3.5 border-t border-[#1E293B] mt-3.5">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>
      </motion.section>

      {/* Video Demo Modal */}
      <Modal open={demoOpen} onOpenChange={setDemoOpen} title="Knowledge AI Product Walkthrough" maxWidth="lg">
        <div className="space-y-4 text-xs text-[#94A3B8]">
          <div className="aspect-video rounded-xl bg-[#0A0E1A] border border-[#1E293B] flex flex-col items-center justify-center p-6 text-center space-y-3">
            <BrainNetworkMotif size={140} />
            <p className="text-[#F1F5F9] font-medium text-sm">Interactive RAG Engine Demo Playing...</p>
            <p className="text-xs text-[#64748B]">Query 100+ indexed documents with cited source footnotes in real time.</p>
          </div>
          <Button variant="ghost" fullWidth onClick={() => setDemoOpen(false)}>
            Close Video Walkthrough
          </Button>
        </div>
      </Modal>
    </div>
  )
}
