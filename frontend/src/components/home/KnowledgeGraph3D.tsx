// ============================================================
// KnowledgeGraph3D — "Isometric Vector Core"
// Highly professional, enterprise-grade data visualization.
// Represents a vector database processing structured documents.
// ============================================================

import React, { useEffect, useRef } from 'react';

/* ── Document Positions — perfect hexagon, r=100 from center (150,150) */
const DOC_PANELS = [
  { label: 'PDF',  cx: 150, cy: 50,  delay: 0 },     // top
  { label: 'JSON', cx: 237, cy: 100, delay: 1.1 },    // top-right
  { label: 'CSV',  cx: 237, cy: 200, delay: 0.8 },    // bottom-right
  { label: 'TXT',  cx: 150, cy: 250, delay: 2.2 },    // bottom
  { label: 'DOCX', cx: 63,  cy: 200, delay: 1.5 },    // bottom-left
  { label: 'MD',   cx: 63,  cy: 100, delay: 2.7 },    // top-left
];

interface KnowledgeGraph3DProps {
  size?: number;
  className?: string;
}

export function KnowledgeGraph3D({ size = 320, className = '' }: KnowledgeGraph3DProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  /* Subtle mouse-driven parallax for depth */
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
      el.style.setProperty('--rx', `${-y}deg`);
      el.style.setProperty('--ry', `${x}deg`);
    };
    const handleLeave = () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };
    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  return (
    <div
      ref={canvasRef}
      className={`kg3d-root ${className}`}
      style={{ width: size, height: size, '--rx': '0deg', '--ry': '0deg' } as React.CSSProperties}
    >
      <style>{`
        .kg3d-root {
          position: relative;
          perspective: 1200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .kg3d-scene {
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transform: rotateX(calc(var(--rx) + 5deg)) rotateY(var(--ry));
          transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        /* ── Cube Animations ───────────────────────────────── */
        @keyframes kg3d-pulse-core {
          0%, 100% { filter: drop-shadow(0 0 15px rgba(34,211,238,0.4)); transform: translateY(0px); }
          50%      { filter: drop-shadow(0 0 30px rgba(34,211,238,0.8)); transform: translateY(-4px); }
        }

        /* Perfectly bound scanning line animation (70px is the exact height of the cube face) */
        @keyframes kg3d-scan-line {
          0%   { opacity: 0; transform: translateY(0px); }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(70px); }
        }

        /* ── Document Hover Animations ─────────────────────── */
        .kg3d-doc-panel {
          position: absolute;
          animation: kg3d-doc-hover 4s ease-in-out infinite;
          animation-delay: var(--doc-delay);
          z-index: 10;
          transform-style: preserve-3d;
          perspective: 400px;
        }

        @keyframes kg3d-doc-hover {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
          50%      { transform: translate(-50%, -50%) translateY(-8px); }
        }

        /* ── 3D Isometric Document Card ────────────────────── */
        .kg3d-doc-glass {
          width: 36px;
          height: 46px;
          position: relative;
          transform-style: preserve-3d;
          transform: rotateX(8deg) rotateY(-5deg);
          transition: transform 0.3s ease, filter 0.3s ease;
        }

        .kg3d-doc-glass:hover {
          transform: rotateX(4deg) rotateY(-2deg) scale(1.1);
          filter: drop-shadow(0 0 12px rgba(34,211,238,0.5));
        }

        /* Front face */
        .kg3d-doc-front {
          position: absolute;
          inset: 0;
          background: linear-gradient(145deg, rgba(30,58,95,0.9) 0%, rgba(10,14,26,0.95) 100%);
          border: 1px solid rgba(59,130,246,0.5);
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          box-shadow: inset 0 1px 0 rgba(96,165,250,0.2), inset 0 0 10px rgba(34,211,238,0.08);
          z-index: 2;
        }

        /* Right depth edge */
        .kg3d-doc-edge-right {
          position: absolute;
          top: 2px;
          right: -4px;
          width: 4px;
          height: calc(100% - 2px);
          background: linear-gradient(180deg, rgba(59,130,246,0.4) 0%, rgba(30,64,175,0.2) 100%);
          border-radius: 0 3px 3px 0;
          border: 1px solid rgba(59,130,246,0.3);
          border-left: none;
          transform: skewY(-6deg);
          transform-origin: top left;
          z-index: 1;
        }

        /* Bottom depth edge */
        .kg3d-doc-edge-bottom {
          position: absolute;
          bottom: -4px;
          left: 2px;
          width: calc(100% - 2px);
          height: 4px;
          background: linear-gradient(90deg, rgba(34,211,238,0.3) 0%, rgba(14,165,233,0.15) 100%);
          border-radius: 0 0 3px 3px;
          border: 1px solid rgba(34,211,238,0.25);
          border-top: none;
          transform: skewX(-8deg);
          transform-origin: top left;
          z-index: 1;
        }

        .kg3d-doc-icon {
          width: 14px;
          height: 16px;
          border: 1px solid rgba(96,165,250,0.7);
          border-radius: 2px;
          position: relative;
          background: linear-gradient(180deg, rgba(59,130,246,0.1) 0%, transparent 100%);
        }
        .kg3d-doc-icon::after {
          content: '';
          position: absolute;
          top: 4px; left: 2px; right: 2px;
          height: 1px;
          background: rgba(96,165,250,0.7);
          box-shadow: 0 3px 0 rgba(96,165,250,0.5), 0 6px 0 rgba(96,165,250,0.3);
        }

        .kg3d-doc-label {
          font-size: 7px;
          font-weight: 800;
          letter-spacing: 0.6px;
          color: #93c5fd;
          font-family: 'Inter', sans-serif;
          text-shadow: 0 0 6px rgba(59,130,246,0.4);
        }

        /* ── Volumetric ambient glow ───────────────────────── */
        .kg3d-ambient {
          position: absolute;
          top: 50%; left: 50%;
          width: 80%;
          height: 80%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(34,211,238,0.1) 0%, rgba(59,130,246,0.03) 40%, transparent 70%);
          pointer-events: none;
        }
      `}</style>

      {/* Volumetric ambient glow */}
      <div className="kg3d-ambient" />

      {/* 3D scene container */}
      <div className="kg3d-scene" style={{ position: 'absolute', inset: 0 }}>
        
        {/* ── ISOMETRIC VECTOR CORE ───────────────────────── */}
        <svg viewBox="0 0 300 300" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
          <defs>
            <linearGradient id="top-face" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="left-face" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#1e40af" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="right-face" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.1" />
            </linearGradient>
            <filter id="cube-glow">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <clipPath id="cube-bounds">
              <polygon points="150,70 210,105 210,175 150,210 90,175 90,105" />
            </clipPath>
          </defs>

          {/* Group wrapper for the floating cube animation */}
          <g style={{ transformOrigin: '150px 150px', animation: 'kg3d-pulse-core 4s ease-in-out infinite' }}>
            
            {/* Top Face */}
            <polygon 
              points="150,70 210,105 150,140 90,105" 
              fill="url(#top-face)" stroke="#60a5fa" strokeWidth="1.5" 
            />
            {/* Top Face Inner Grid */}
            <polyline points="120,87.5 180,122.5" fill="none" stroke="#93c5fd" strokeWidth="0.5" opacity="0.5" />
            <polyline points="180,87.5 120,122.5" fill="none" stroke="#93c5fd" strokeWidth="0.5" opacity="0.5" />

            {/* Left Face */}
            <polygon 
              points="90,105 150,140 150,210 90,175" 
              fill="url(#left-face)" stroke="#3b82f6" strokeWidth="1.5" 
            />
            {/* Left Face Inner Grid */}
            <polyline points="120,122.5 120,192.5" fill="none" stroke="#60a5fa" strokeWidth="0.5" opacity="0.5" />
            <polyline points="90,140 150,175" fill="none" stroke="#60a5fa" strokeWidth="0.5" opacity="0.5" />

            {/* Right Face */}
            <polygon 
              points="150,140 210,105 210,175 150,210" 
              fill="url(#right-face)" stroke="#22d3ee" strokeWidth="1.5" 
            />
            {/* Right Face Inner Grid */}
            <polyline points="180,122.5 180,192.5" fill="none" stroke="#38bdf8" strokeWidth="0.5" opacity="0.5" />
            <polyline points="150,175 210,140" fill="none" stroke="#38bdf8" strokeWidth="0.5" opacity="0.5" />

            {/* AI Scanning Line (Clipped strictly to cube bounds) */}
            <g clipPath="url(#cube-bounds)">
              <polygon 
                points="150,70 210,105 150,140 90,105" 
                fill="rgba(255,255,255,0.15)" stroke="#ffffff" strokeWidth="2" filter="url(#cube-glow)"
                style={{ animation: 'kg3d-scan-line 3s linear infinite' }}
              />
            </g>
            
            {/* Central Bright Node */}
            <circle cx="150" cy="140" r="4" fill="#ffffff" filter="url(#cube-glow)" />
          </g>

          {/* Dynamic Connection Lines to Documents */}
          <g opacity="0.5">
            {DOC_PANELS.map((doc, i) => (
              <polyline 
                key={`line-${i}`} 
                points={`150,140 ${doc.cx},${doc.cy}`} 
                fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 4" 
              />
            ))}
          </g>
        </svg>

        {/* ── 3D ISOMETRIC DOCUMENT PANELS ─────────────────── */}
        {DOC_PANELS.map((doc, i) => (
          <div
            key={`doc-${i}`}
            className="kg3d-doc-panel"
            style={{
              top: `${(doc.cy / 300) * 100}%`,
              left: `${(doc.cx / 300) * 100}%`,
              '--doc-delay': `${doc.delay}s`,
            } as React.CSSProperties}
          >
            <div className="kg3d-doc-glass">
              {/* Front face */}
              <div className="kg3d-doc-front">
                <div className="kg3d-doc-icon" />
                <span className="kg3d-doc-label">{doc.label}</span>
              </div>
              {/* 3D depth edges */}
              <div className="kg3d-doc-edge-right" />
              <div className="kg3d-doc-edge-bottom" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}