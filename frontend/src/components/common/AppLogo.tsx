// ============================================================
// AppLogo.tsx — Official Knowledge AI Vector Logo Mark
// Transparent SVG (No background container) featuring open circle, center dot, & 3 audio soundwaves
// ============================================================

import React from 'react'

interface AppLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number
  className?: string
}

export function AppLogo({ size = 24, className = 'w-6 h-6 text-[#60A5FA]', ...props }: AppLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Main Open Circle ('C' shape with opening on the right) */}
      <path
        d="M 15.5 7.2 A 7.5 7.5 0 1 0 15.5 16.8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Center Dot */}
      <circle cx="10" cy="12" r="1.4" fill="currentColor" />

      {/* 3 Radiating Audio Soundwave Arcs */}
      {/* Inner Wave Arc */}
      <path
        d="M 17.5 9.5 A 4 4 0 0 1 17.5 14.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Middle Wave Arc */}
      <path
        d="M 19.8 7.5 A 6.5 6.5 0 0 1 19.8 16.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Outer Wave Arc */}
      <path
        d="M 22.2 5.5 A 9 9 0 0 1 22.2 18.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  )
}
