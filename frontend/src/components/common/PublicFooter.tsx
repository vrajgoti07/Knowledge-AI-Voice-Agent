// ============================================================
// PublicFooter — Compact Marketing & Auth Pages Footer
// Lean 2-Row Design (~50% Height Reduction), Single Animated Status Pill (Option A), & Clean Flat Dark Mode (#0A0E1A)
// ============================================================

import React from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME, ROUTES } from '@/constants'
import { AppLogo } from '@/components/common/AppLogo'

// Inline Social Icon Components
function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  )
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

export function PublicFooter() {
  return (
    <footer className="bg-[#0A0E1A] text-[#94A3B8] relative border-t border-[#1E293B] pt-10 pb-6 text-xs select-none">
      {/* ── OPTION A: GPU-Friendly Status Pill Pulse Animation + Prefers Reduced Motion ── */}
      <style>{`
        .status-pulse-dot {
          animation: statusPulse 2s ease-in-out infinite alternate;
          will-change: transform, opacity, box-shadow;
        }
        @keyframes statusPulse {
          0% {
            transform: scale(0.92);
            opacity: 0.75;
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.3);
          }
          100% {
            transform: scale(1.12);
            opacity: 1;
            box-shadow: 0 0 8px 2px rgba(34, 197, 94, 0.7);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .status-pulse-dot {
            animation: none !important;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-8">

        {/* ── ROW 1: BRAND COLUMN + 4 LINK COLUMNS (Compact & Scannable) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 pb-8 border-b border-[#1E293B]">

          {/* Brand Column (Left 4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <Link to={ROUTES.HOME} className="inline-flex items-center gap-2 group">
              <AppLogo className="w-6 h-6 text-[#60A5FA] group-hover:scale-105 transition-transform" />
              <span className="text-base font-bold tracking-tight text-[#F1F5F9] group-hover:text-white transition-colors">
                {APP_NAME}
              </span>
            </Link>

            <p className="text-[#94A3B8] leading-relaxed max-w-sm text-xs">
              Turn complex PDF repositories into an intelligent, real-time voice and chat knowledge base.
            </p>

            {/* Option A: Single Live Operational Status Pill */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#121A2C] border border-[#1E293B] text-[11px] font-mono text-[#94A3B8]">
              <span className="h-2 w-2 rounded-full bg-[#22C55E] status-pulse-dot" />
              <span>Vector DB & Voice Agent: <strong className="text-[#F1F5F9] font-normal">Operational</strong></span>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-2 pt-1">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-[#16213A]/50 border border-[#1E293B] text-[#94A3B8] hover:text-[#60A5FA] hover:border-[#3B82F6]/30 transition-all">
                <GithubIcon className="w-3.5 h-3.5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-[#16213A]/50 border border-[#1E293B] text-[#94A3B8] hover:text-[#60A5FA] hover:border-[#3B82F6]/30 transition-all">
                <TwitterIcon className="w-3.5 h-3.5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-[#16213A]/50 border border-[#1E293B] text-[#94A3B8] hover:text-[#60A5FA] hover:border-[#3B82F6]/30 transition-all">
                <LinkedinIcon className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Right 8 cols: 4 Functional Link Columns */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-6">

            {/* Column 1: Platform */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-mono font-semibold text-[#60A5FA] tracking-wider uppercase">
                Platform
              </h4>
              <ul className="space-y-2">
                <li><Link to={ROUTES.CHAT} className="hover:text-[#F1F5F9] transition-colors block">Chat Workspace</Link></li>
                <li><Link to={ROUTES.VOICE} className="hover:text-[#F1F5F9] transition-colors block">Voice Assistant</Link></li>
                <li><Link to={ROUTES.DASHBOARD} className="hover:text-[#F1F5F9] transition-colors block">My Dashboard</Link></li>
                <li><Link to={ROUTES.PERSONAL_LIBRARY} className="hover:text-[#F1F5F9] transition-colors block">Personal Library</Link></li>
              </ul>
            </div>

            {/* Column 2: RAG Engine */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-mono font-semibold text-[#60A5FA] tracking-wider uppercase">
                RAG Engine
              </h4>
              <ul className="space-y-2">
                <li><a href="#vector-store" className="hover:text-[#F1F5F9] transition-colors block">Qdrant Vector Search</a></li>
                <li><a href="#chunking" className="hover:text-[#F1F5F9] transition-colors block">Hybrid Chunking</a></li>
                <li><a href="#retrieval" className="hover:text-[#F1F5F9] transition-colors block">Contextual Retrieval</a></li>
                <li><a href="#fallback" className="hover:text-[#F1F5F9] transition-colors block">Offline Fallback Engine</a></li>
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-mono font-semibold text-[#60A5FA] tracking-wider uppercase">
                Resources
              </h4>
              <ul className="space-y-2">
                <li><a href="#docs" className="hover:text-[#F1F5F9] transition-colors block">API Documentation</a></li>
                <li><a href="#benchmarks" className="hover:text-[#F1F5F9] transition-colors block">System Benchmarks</a></li>
                <li><a href="#security" className="hover:text-[#F1F5F9] transition-colors block">Enterprise Security</a></li>
                <li><a href="#status" className="hover:text-[#F1F5F9] transition-colors block">System Health</a></li>
              </ul>
            </div>

            {/* Column 4: Company */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-mono font-semibold text-[#60A5FA] tracking-wider uppercase">
                Company
              </h4>
              <ul className="space-y-2">
                <li><a href="#about" className="hover:text-[#F1F5F9] transition-colors block">About Knowledge AI</a></li>
                <li><a href="#blog" className="hover:text-[#F1F5F9] transition-colors block">Research Blog</a></li>
                <li><a href="#contact" className="hover:text-[#F1F5F9] transition-colors block">Contact Sales</a></li>
                <li><a href="#careers" className="hover:text-[#F1F5F9] transition-colors block">Careers</a></li>
              </ul>
            </div>

          </div>
        </div>

        {/* ── ROW 2: MINIMAL BOTTOM BAR STRIP ───────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B]">
          <p>© 2026 {APP_NAME} Inc. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <a href="#terms" className="hover:text-[#94A3B8] transition-colors">Terms of Service</a>
            <span className="text-[#1E293B]">|</span>
            <a href="#privacy" className="hover:text-[#94A3B8] transition-colors">Privacy Policy</a>
          </div>
        </div>

      </div>
    </footer>
  )
}
