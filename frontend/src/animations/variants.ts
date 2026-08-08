// ============================================================
// Framer Motion Animation Variants — Khnowlge AI
// ============================================================

import type { Variants, Transition } from 'framer-motion'

// ── Transitions ───────────────────────────────────────────
export const transitions = {
  spring:     { type: 'spring', stiffness: 400, damping: 28 } as Transition,
  springSlow: { type: 'spring', stiffness: 200, damping: 24 } as Transition,
  smooth:     { duration: 0.3, ease: [0.4, 0, 0.2, 1] }     as Transition,
  fast:       { duration: 0.15, ease: [0.4, 0, 0.2, 1] }     as Transition,
  slow:       { duration: 0.6, ease: [0.16, 1, 0.3, 1] }     as Transition,
  expo:       { duration: 0.5, ease: [0.16, 1, 0.3, 1] }     as Transition,
  bounce:     { type: 'spring', stiffness: 500, damping: 30 } as Transition,
}

// ── Page Transitions ──────────────────────────────────────
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: transitions.expo },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
}

export const pageSlideVariants: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: transitions.expo },
  exit:    { opacity: 0, x: 20, transition: { duration: 0.2 } },
}

// ── Fade Variants ─────────────────────────────────────────
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: transitions.smooth },
  exit:    { opacity: 0, transition: transitions.fast },
}

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0,  transition: transitions.expo },
  exit:    { opacity: 0, y: -10, transition: transitions.fast },
}

export const fadeDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0,   transition: transitions.expo },
  exit:    { opacity: 0, y: 10,  transition: transitions.fast },
}

export const fadeLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0,  transition: transitions.expo },
  exit:    { opacity: 0, x: -10, transition: transitions.fast },
}

export const fadeRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: transitions.expo },
  exit:    { opacity: 0, x: 10, transition: transitions.fast },
}

// ── Scale Variants ────────────────────────────────────────
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: transitions.spring },
  exit:    { opacity: 0, scale: 0.95, transition: transitions.fast },
}

export const scaleUp: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: transitions.springSlow },
  exit:    { opacity: 0, scale: 0.9, transition: transitions.fast },
}

// ── Slide Variants ────────────────────────────────────────
export const slideInLeft: Variants = {
  initial: { x: '-100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: transitions.expo },
  exit:    { x: '-100%', opacity: 0, transition: transitions.smooth },
}

export const slideInRight: Variants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: transitions.expo },
  exit:    { x: '100%', opacity: 0, transition: transitions.smooth },
}

export const slideInBottom: Variants = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1, transition: transitions.expo },
  exit:    { y: '100%', opacity: 0, transition: transitions.smooth },
}

// ── Stagger Container ─────────────────────────────────────
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren:   0.1,
    },
  },
}

export const staggerContainerFast: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren:   0.05,
    },
  },
}

export const staggerContainerSlow: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.12,
      delayChildren:   0.15,
    },
  },
}

// ── Stagger Child ─────────────────────────────────────────
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: transitions.expo },
}

export const staggerItemLeft: Variants = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0, transition: transitions.expo },
}

// ── Sidebar ───────────────────────────────────────────────
export const sidebarVariants: Variants = {
  open:     { width: 260, transition: { ...transitions.spring, stiffness: 300, damping: 30 } },
  collapsed:{ width: 68,  transition: { ...transitions.spring, stiffness: 300, damping: 30 } },
}

export const sidebarLabelVariants: Variants = {
  open:     { opacity: 1, x: 0,    transition: { delay: 0.1, ...transitions.smooth } },
  collapsed:{ opacity: 0, x: -8,   transition: transitions.fast },
}

// ── Modal / Dialog ────────────────────────────────────────
export const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
}

export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: { opacity: 1, scale: 1,    y: 0, transition: transitions.spring },
  exit:    { opacity: 0, scale: 0.96, y: 4, transition: transitions.fast },
}

export const sheetVariants: Variants = {
  initial: { x: '100%' },
  animate: { x: 0,      transition: transitions.expo },
  exit:    { x: '100%', transition: transitions.smooth },
}

// ── Tooltip / Popover ─────────────────────────────────────
export const tooltipVariants: Variants = {
  initial: { opacity: 0, scale: 0.92, y: 4 },
  animate: { opacity: 1, scale: 1,    y: 0, transition: transitions.spring },
  exit:    { opacity: 0, scale: 0.92, y: 2, transition: transitions.fast },
}

// ── Dropdown ──────────────────────────────────────────────
export const dropdownVariants: Variants = {
  initial: { opacity: 0, scale: 0.96, y: -8 },
  animate: { opacity: 1, scale: 1,    y: 0,  transition: transitions.spring },
  exit:    { opacity: 0, scale: 0.96, y: -4, transition: transitions.fast },
}

// ── Card Hover ────────────────────────────────────────────
export const cardHoverVariants = {
  initial: { y: 0, boxShadow: 'var(--shadow-card)' },
  hover:   {
    y: -4,
    boxShadow: 'var(--shadow-card-hover)',
    transition: transitions.spring,
  },
}

// ── Button ────────────────────────────────────────────────
export const buttonVariants = {
  tap: { scale: 0.97, transition: transitions.bounce },
}

// ── Float Animation ───────────────────────────────────────
export const floatAnimation = {
  animate: {
    y: [-6, 6, -6],
    transition: {
      duration: 6,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
}

export const floatSlowAnimation = {
  animate: {
    y: [-8, 8, -8],
    rotate: [-1, 1, -1],
    transition: {
      duration: 8,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
}

// ── Pulse ─────────────────────────────────────────────────
export const pulseVariants = {
  animate: {
    opacity: [1, 0.6, 1],
    scale:   [1, 1.02, 1],
    transition: {
      duration: 2.5,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
}

// ── Text Reveal ───────────────────────────────────────────
export const textRevealContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.015 } },
}

export const textRevealChar: Variants = {
  initial: { opacity: 0, y: 20, rotateX: -30 },
  animate: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
}

// ── Number Counter ────────────────────────────────────────
export const counterVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

// ── Gradient Glow ─────────────────────────────────────────
export const glowAnimation = {
  animate: {
    opacity: [0.4, 0.7, 0.4],
    scale:   [1, 1.05, 1],
    transition: {
      duration: 4,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
}

// ── Helper — create stagger with custom delay ─────────────
export function makeStagger(stagger = 0.08, delay = 0.1): Variants {
  return {
    initial: {},
    animate: {
      transition: { staggerChildren: stagger, delayChildren: delay },
    },
  }
}
