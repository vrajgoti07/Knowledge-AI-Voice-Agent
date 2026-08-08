// ============================================================
// PublicFooter — Marketing & Auth Pages Footer (#0A0E1A BG)
// 3 Columns + Contact + Faint Decorative Diamond Glyph
// ============================================================

import React from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME, ROUTES } from '@/constants'

export function PublicFooter() {
  return (
    <footer className="bg-[#0A0E1A] border-t border-[#1E293B] pt-12 pb-8 text-[#94A3B8] relative overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-[#1E293B]">
          {/* Column 1: Navigation / Platform */}
          <div className="space-y-3">
            <h4 className="caption text-[#F1F5F9] font-semibold text-xs tracking-wider uppercase">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link to={ROUTES.CHAT} className="hover:text-[#60A5FA] transition-colors">Chat Workspace</Link></li>
              <li><Link to={ROUTES.DASHBOARD} className="hover:text-[#60A5FA] transition-colors">My Dashboard</Link></li>
              <li><Link to={ROUTES.VOICE} className="hover:text-[#60A5FA] transition-colors">Voice Assistant</Link></li>
            </ul>
          </div>

          {/* Column 2: Features / Platform */}
          <div className="space-y-3">
            <h4 className="caption text-[#F1F5F9] font-semibold text-xs tracking-wider uppercase">
              Features
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#features" className="hover:text-[#60A5FA] transition-colors">Unified Knowledge</a></li>
              <li><a href="#security" className="hover:text-[#60A5FA] transition-colors">Enterprise Security</a></li>
              <li><a href="#pricing" className="hover:text-[#60A5FA] transition-colors">Pricing Plans</a></li>
              <li><a href="#analytics" className="hover:text-[#60A5FA] transition-colors">Analytics Engine</a></li>
            </ul>
          </div>

          {/* Column 3: Team / Company */}
          <div className="space-y-3">
            <h4 className="caption text-[#F1F5F9] font-semibold text-xs tracking-wider uppercase">
              Team
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#blog" className="hover:text-[#60A5FA] transition-colors">Research Blog</a></li>
              <li><a href="#contact" className="hover:text-[#60A5FA] transition-colors">Contact Sales</a></li>
              <li><a href="#careers" className="hover:text-[#60A5FA] transition-colors">Careers (Hiring)</a></li>
              <li><a href="#press" className="hover:text-[#60A5FA] transition-colors">Press Kit</a></li>
            </ul>
          </div>

          {/* Column 4: Small Contact Column */}
          <div className="space-y-3">
            <h4 className="caption text-[#F1F5F9] font-semibold text-xs tracking-wider uppercase">
              Contact Us
            </h4>
            <div className="space-y-1.5 text-xs text-[#94A3B8]">
              <p className="text-[#F1F5F9] font-medium">Knowledge AI Inc.</p>
              <p>contact@knowledge.ai</p>
              <p className="text-[11px] text-[#64748B]">San Francisco, CA & London, UK</p>
            </div>
          </div>
        </div>

        {/* Bottom Strip: Copyright + Decorative Faint Diamond Glyph */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <p>© 2026 {APP_NAME} Inc. All Rights Reserved.</p>

          <div className="flex items-center gap-6">
            <a href="#terms" className="hover:text-[#94A3B8] transition-colors">Terms of Service</a>
            <a href="#privacy" className="hover:text-[#94A3B8] transition-colors">Privacy Policy</a>
          </div>
        </div>
      </div>

      {/* Faint Decorative Diamond / Sparkle Glyph Bottom Right */}
      <div className="absolute right-6 bottom-4 pointer-events-none opacity-15 text-[#60A5FA]">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
        </svg>
      </div>
    </footer>
  )
}
