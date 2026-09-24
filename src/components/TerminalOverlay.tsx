/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TerminalTheme } from '../types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TerminalOverlayProps {
  theme: TerminalTheme;
  crtScanlines: boolean;
  chromaticAberration: boolean;
  vignette: boolean;
  noiseLevel: number;
}

export interface ThemePalette {
  id: TerminalTheme;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  subtitle: string;
  classification: string;
  mission: string;
  fontFamilyName: string;
  fontClass: string;
  btnClass: string;
  btnRadius: string;
  cardRadius: string;
  activeToolBtnStyle: string;
  accentBadgeBg: string;
  hudFrameStyle: 'cyber' | 'industrial' | 'neural' | 'archival' | 'tactical';
  primary: string;
  glow: string;
  glowLight: string;
  bg: string;
  text: string;
  border: string;
  borderActive: string;
  title: string;
  accent: string;
  radialGradient: string;
  reticleGlyph: string;
  bracketStyle: string;
  activeBadge: string;
  headerTag: string;
}

export const THEME_PALETTES: Record<TerminalTheme, ThemePalette> = {
  nightfly: {
    id: 'nightfly',
    projectId: 'PROJECT_01',
    projectCode: 'PRJ-01: NIGHTFLY',
    projectTitle: 'OPERATION NIGHTFLY',
    subtitle: 'ORBITAL RELAY & DATA INTERCEPT',
    classification: 'TOP SECRET // NOFORN // ORBITAL',
    mission: 'Orbital signal intercepts, satellite telemetry nodes, and classified vector routing.',
    fontFamilyName: 'Share Tech Mono (Cyber Monospace)',
    fontClass: 'theme-font-nightfly',
    btnClass: 'theme-btn-nightfly',
    btnRadius: 'rounded-md',
    cardRadius: 'rounded-lg',
    activeToolBtnStyle: 'bg-emerald-500 text-black font-bold shadow-[0_0_12px_rgba(5,255,161,0.5)]',
    accentBadgeBg: 'bg-emerald-950/60 border-emerald-800 text-emerald-400',
    hudFrameStyle: 'cyber',
    primary: '#05ffa1',
    glow: 'rgba(5, 255, 161, 0.4)',
    glowLight: 'rgba(5, 255, 161, 0.15)',
    bg: '#080d10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    borderActive: 'border-emerald-400',
    title: 'NIGHTFLY // ACTIVE_VECTOR',
    accent: '#05ffa1',
    radialGradient: 'radial-gradient(circle, rgba(5,255,161,0.08) 0%, rgba(8,13,16,1) 90%)',
    reticleGlyph: '°∆',
    bracketStyle: '[·]',
    activeBadge: 'ORBITAL // ACTIVE',
    headerTag: 'ORBITAL TERMINAL'
  },
  mire: {
    id: 'mire',
    projectId: 'PROJECT_02',
    projectCode: 'PRJ-02: M.I.R.E.',
    projectTitle: 'THE M.I.R.E. BIOSITE',
    subtitle: 'SUBTERRANEAN SCADA LOG & BIO-FACILITY',
    classification: 'RESTRICTED ACCESS // SCADA-07',
    mission: 'Industrial SCADA compromises, biochemical telemetry, and unarchived subterranean records.',
    fontFamilyName: 'VT323 (CRT Amber Phosphor)',
    fontClass: 'theme-font-mire',
    btnClass: 'theme-btn-mire',
    btnRadius: 'rounded-none',
    cardRadius: 'rounded-none',
    activeToolBtnStyle: 'bg-amber-500 text-black font-black uppercase shadow-[2px_2px_0px_#78350f] border border-amber-400',
    accentBadgeBg: 'bg-amber-950/80 border-amber-600 text-amber-400',
    hudFrameStyle: 'industrial',
    primary: '#ffb000',
    glow: 'rgba(255, 176, 0, 0.45)',
    glowLight: 'rgba(255, 176, 0, 0.15)',
    bg: '#110c08',
    text: 'text-amber-500',
    border: 'border-amber-500/30',
    borderActive: 'border-amber-400',
    title: 'THE M.I.R.E. // FORGOTTEN_RECORDS',
    accent: '#f59e0b',
    radialGradient: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, rgba(17,12,8,1) 90%)',
    reticleGlyph: '⚠',
    bracketStyle: '[#]',
    activeBadge: 'HAZARD // SECTOR-07',
    headerTag: 'INDUSTRIAL SCADA'
  },
  nephila: {
    id: 'nephila',
    projectId: 'PROJECT_03',
    projectCode: 'PRJ-03: NEPHILA',
    projectTitle: 'NEPHILA SYNTHETIC NEXUS',
    subtitle: 'NEURAL AI SIGINT & WIRE-GRID ANOMALY',
    classification: 'SPECIAL ACCESS // NEURAL-GRID',
    mission: 'Intercepted satellite RF bursts, darknet syndicate telemetry, and neural AI anomalies.',
    fontFamilyName: 'Space Grotesk & JetBrains Mono',
    fontClass: 'theme-font-nephila',
    btnClass: 'theme-btn-nephila',
    btnRadius: 'rounded-full',
    cardRadius: 'rounded-2xl',
    activeToolBtnStyle: 'bg-purple-500 text-white font-bold shadow-[0_0_15px_rgba(168,85,247,0.6)]',
    accentBadgeBg: 'bg-purple-950/70 border-purple-700 text-purple-300',
    hudFrameStyle: 'neural',
    primary: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.45)',
    glowLight: 'rgba(192, 132, 252, 0.15)',
    bg: '#0a0714',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    borderActive: 'border-purple-400',
    title: 'NEPHILA SYSTEMS // EXTERNAL_INTELLIGENCE',
    accent: '#a855f7',
    radialGradient: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, rgba(10,7,20,1) 90%)',
    reticleGlyph: '◈',
    bracketStyle: '[◈]',
    activeBadge: 'SYNTHETIC // NEURAL',
    headerTag: 'NEURAL SIGINT'
  },
  sepulchre: {
    id: 'sepulchre',
    projectId: 'PROJECT_04',
    projectCode: 'PRJ-04: SEPULCHRE',
    projectTitle: 'THE SEPULCHRE BLACK-SITE',
    subtitle: 'COLD ARCHIVE CRYPT & FORENSIC DOSSIER',
    classification: 'DE-ARCHIVED // REJECTED LOSS',
    mission: 'Stark monochrome cold-storage, forensic coroner dossiers, and neutral archival evidence.',
    fontFamilyName: 'IBM Plex Mono (Typewriter Archival)',
    fontClass: 'theme-font-sepulchre',
    btnClass: 'theme-btn-sepulchre',
    btnRadius: 'rounded-none',
    cardRadius: 'rounded-none',
    activeToolBtnStyle: 'bg-white text-black font-mono font-extrabold uppercase border border-slate-300 shadow-[0_0_8px_rgba(255,255,255,0.4)]',
    accentBadgeBg: 'bg-slate-900 border-slate-600 text-slate-200',
    hudFrameStyle: 'archival',
    primary: '#ffffff',
    glow: 'rgba(255, 255, 255, 0.25)',
    glowLight: 'rgba(255, 255, 255, 0.08)',
    bg: '#08080a',
    text: 'text-slate-200',
    border: 'border-slate-800',
    borderActive: 'border-slate-400',
    title: 'THE SEPULCHRE // REJECTED_LOSS',
    accent: '#cbd5e1',
    radialGradient: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(8,8,10,1) 90%)',
    reticleGlyph: '✚',
    bracketStyle: '[+]',
    activeBadge: 'COLD CRYPT // ARCHIVE',
    headerTag: 'FORENSIC ARCHIVE'
  },
  sepulchral_nx: {
    id: 'sepulchral_nx',
    projectId: 'PROJECT_05',
    projectCode: 'PRJ-05: SEPULCHRAL{NX}',
    projectTitle: 'SEPULCHRAL{NX} REACTOR MATRIX',
    subtitle: 'QUANTUM MACHINE CODE DRIFT & RED-ALERT',
    classification: 'DEFCON 1 // EMERGENCY COUNTER-OPS',
    mission: 'Active zero-day exploitation, machine code mutations, intrusion containment, and red-alert counter-ops.',
    fontFamilyName: 'Oxanium (Tactical Combat Alert)',
    fontClass: 'theme-font-sepulchral_nx',
    btnClass: 'theme-btn-sepulchral_nx',
    btnRadius: 'rounded-sm',
    cardRadius: 'rounded-sm',
    activeToolBtnStyle: 'bg-red-600 text-white font-extrabold uppercase shadow-[0_0_15px_rgba(239,68,68,0.7)] border border-red-400',
    accentBadgeBg: 'bg-red-950/80 border-red-700 text-red-400',
    hudFrameStyle: 'tactical',
    primary: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.45)',
    glowLight: 'rgba(239, 68, 68, 0.15)',
    bg: '#0d0808',
    text: 'text-red-500',
    border: 'border-red-500/30',
    borderActive: 'border-red-400',
    title: 'SEPULCHRAL{NX} // MACHINE_CODE_DRIFT',
    accent: '#ef4444',
    radialGradient: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, rgba(13,8,8,1) 90%)',
    reticleGlyph: '»',
    bracketStyle: '[»]',
    activeBadge: 'DEFCON 1 // ZERO-DAY',
    headerTag: 'TACTICAL COMMAND'
  }
};

export const TerminalOverlay: React.FC<TerminalOverlayProps> = ({
  theme,
  crtScanlines,
  chromaticAberration,
  vignette,
  noiseLevel
}) => {
  const palette = THEME_PALETTES[theme];

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Dynamic scanlines layout */}
      {crtScanlines && (
        <div 
          className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 3px)`,
          }}
        />
      )}

      {/* Retro horizontal scrolling beam scanner */}
      {crtScanlines && (
        <div 
          className="scanline-bar absolute left-0 right-0 h-10 opacity-[0.04] pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, transparent, ${palette.primary}, transparent)`,
            animation: 'scanline 8s linear infinite',
          }}
        />
      )}

      {/* Ambient noise simulation */}
      {noiseLevel > 0 && (
        <div 
          className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)]"
          style={{
            backgroundSize: '3px 3px',
            opacity: noiseLevel / 2000,
          }}
        />
      )}

      {/* Classic Vignette shading frame */}
      {vignette && (
        <div 
          className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.85)]"
          style={{
            boxShadow: `inset 0 0 100px rgba(0,0,0,0.85), inset 0 0 40px ${palette.glowLight}`,
          }}
        />
      )}

      {/* Screen tint & background ambient glow */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          background: `radial-gradient(circle, ${palette.primary} 0%, transparent 70%)`,
        }}
      />

      {/* Chromatic aberration glass tint overlay if enabled */}
      {chromaticAberration && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-screen"
          style={{
            background: `radial-gradient(circle, transparent 40%, rgba(255,0,0,0.4) 80%, rgba(0,0,255,0.4) 100%)`,
          }}
        />
      )}

      <style>{`
        @keyframes scanline {
          0% { top: -10%; }
          100% { top: 110%; }
        }
        .retro-flicker {
          animation: flicker 0.15s infinite;
        }
        @keyframes flicker {
          0% { opacity: 0.98; }
          50% { opacity: 1; }
          100% { opacity: 0.99; }
        }
      `}</style>
    </div>
  );
};

// Cyber Frame helper function for styling custom sci-fi divs with collapse and resize behaviors
export const CyberFrame: React.FC<{
  children: React.ReactNode;
  theme: TerminalTheme;
  title?: string;
  subTitle?: string;
  className?: string;
  onHeaderClick?: () => void;
  id?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  resizable?: boolean;
  defaultHeight?: number;
}> = ({ 
  children, 
  theme, 
  title, 
  subTitle, 
  className = '', 
  onHeaderClick, 
  id,
  collapsible = true,
  defaultCollapsed = false,
  resizable = true,
  defaultHeight
}) => {
  const palette = THEME_PALETTES[theme];
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [height, setHeight] = useState<number | undefined>(defaultHeight);

  const toggleCollapse = () => {
    if (!collapsible) return;
    setIsCollapsed(!isCollapsed);
    if (onHeaderClick) {
      onHeaderClick();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = height || defaultHeight || 250;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(100, startHeight + deltaY);
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const startY = e.touches[0].clientY;
    const startHeight = height || defaultHeight || 250;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      const deltaY = moveEvent.touches[0].clientY - startY;
      const newHeight = Math.max(100, startHeight + deltaY);
      setHeight(newHeight);
    };

    const handleTouchEnd = () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
  };

  return (
    <div 
      id={id}
      className={`relative border bg-[rgba(5,10,15,0.45)] backdrop-blur-md rounded transition-all duration-300 flex flex-col overflow-hidden group ${palette.border} ${className}`}
      style={{
        boxShadow: `0 4px 20px rgba(0, 0, 0, 0.4), inset 0 0 10px ${palette.glowLight}`,
        height: isCollapsed ? '34px' : (height !== undefined ? `${height}px` : undefined),
        minHeight: isCollapsed ? '34px' : undefined,
      }}
    >
      {/* Tech corner notches */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-current opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: palette.primary }}></div>
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: palette.primary }}></div>
      {!isCollapsed && (
        <>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: palette.primary }}></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-current opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: palette.primary }}></div>
        </>
      )}

      {/* Panel header */}
      {(title || subTitle) && (
        <div 
          onClick={toggleCollapse}
          className={`px-3 py-1.5 border-b flex items-center justify-between bg-black/40 ${collapsible ? 'cursor-pointer hover:bg-black/60' : 'cursor-default'} select-none ${palette.border} text-xs font-mono`}
        >
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: palette.primary }}></span>
            <span className="font-semibold tracking-wider uppercase text-slate-300 group-hover:text-white transition-colors">
              {title}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            {subTitle && (
              <span className="text-[10px] opacity-40 font-mono tracking-widest">{subTitle}</span>
            )}
            {collapsible && (
              <button 
                type="button"
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={isCollapsed ? "Expand Panel" : "Collapse Panel"}
              >
                {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid overlay dot background */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)]" style={{ backgroundSize: '16px 16px' }} />

      {/* Inner Content */}
      <div className={`relative p-3 flex-1 flex flex-col overflow-auto ${isCollapsed ? 'hidden' : ''}`}>
        {children}
      </div>

      {/* Resizing Handle */}
      {resizable && !isCollapsed && (
        <div 
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className="absolute bottom-0 left-0 right-0 h-2 bg-slate-950/20 hover:bg-current/10 border-t border-slate-900/40 cursor-ns-resize flex items-center justify-center transition-all group/resize z-10"
          style={{ color: palette.primary }}
          title="Drag to resize panel height"
        >
          <div className="w-8 h-1 flex flex-col items-center justify-between gap-[1px] opacity-30 group-hover/resize:opacity-100 transition-opacity">
            <div className="w-full h-[1px] bg-current" />
            <div className="w-full h-[1px] bg-current" />
          </div>
        </div>
      )}
    </div>
  );
};
