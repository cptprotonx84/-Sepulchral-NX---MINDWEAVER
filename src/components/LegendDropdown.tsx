/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TerminalTheme, EventStatus } from '../types';
import { THEME_PALETTES } from './TerminalOverlay';
import { soundEngine } from './SoundEngine';
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Radio, 
  Layers,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';

interface LegendDropdownProps {
  theme: TerminalTheme;
}

export interface LegendItem {
  color: string;
  name: string;
  label: string;
  description: string;
  category: 'status' | 'category';
}

export const COLOR_LEGEND_DATA: LegendItem[] = [
  {
    color: '#05ffa1',
    name: 'Emerald Green',
    label: 'Confirmed Evidence / Verified Active',
    description: 'Direct physical evidence, confirmed eyewitness reports, active forensic verification, or verified security bypasses.',
    category: 'status'
  },
  {
    color: '#ffb000',
    name: 'Amber Yellow',
    label: 'Warning / Proposed Caution / Critical Access',
    description: 'High-security zone alerts, stolen credentials, access card overrides, or events requiring urgent follow-up investigation.',
    category: 'status'
  },
  {
    color: '#ef4444',
    name: 'Crimson Red',
    label: 'Critical Incident / Core Breach / Hazard',
    description: 'Major infrastructure failure, core database zero-day compromise, arson/EMP detonations, or life-safety emergencies.',
    category: 'status'
  },
  {
    color: '#c084fc',
    name: 'Cyber Violet',
    label: 'SIGINT / AI Anomaly / Encrypted Comms',
    description: 'Satellite burst transmissions, intercepted RF communications, neural AI irregularities, or classified wiretaps.',
    category: 'category'
  },
  {
    color: '#38bdf8',
    name: 'Cyan Blue',
    label: 'Transit / Tech / Investigative Leads',
    description: 'Vehicle movements, traffic camera intercepts, flight radar anomalies, transit routes, or active suspect chase corridors.',
    category: 'category'
  },
  {
    color: '#f8fafc',
    name: 'Ghost White',
    label: 'Archival Dossier / Neutral Timestamp',
    description: 'Historical records, reference documents, background dossiers, and neutral timeline anchor points.',
    category: 'category'
  }
];

export const CONNECTION_EVIDENCE_LEGEND = [
  {
    type: 'documented',
    title: 'Solid line ──────',
    label: 'Documented relationship',
    meaning: 'Direct confirmed link, proven causation, forensic match, or official audit trail connecting event A directly to event B.'
  },
  {
    type: 'proposed',
    title: 'Dashed line ─ ─ ─ ─',
    label: 'Proposed relationship',
    meaning: 'Investigative working theory, suspected motive, uncorroborated lead, or hypothetical causation awaiting evidence.'
  },
  {
    type: 'chronological',
    title: 'Dotted alternating color • • • •',
    label: 'Chronological association only',
    meaning: 'Events occurred sequentially in time, but neither event is proven to have caused or triggered the other. Alternates source & target event colors.'
  }
];

export const LegendDropdown: React.FC<LegendDropdownProps> = ({ theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const palette = THEME_PALETTES[theme];

  const toggle = () => {
    soundEngine.playClick();
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className={`px-2.5 py-1 rounded border flex items-center space-x-1.5 transition-all text-xs font-mono cursor-pointer ${
          isOpen
            ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(5,255,161,0.25)]'
            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
        }`}
        title="View Detective Storyboard Color Legend & Line Types"
      >
        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-bold tracking-wider">COLOR & LINE LEGEND</span>
        {isOpen ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#0c1015] border rounded-lg shadow-2xl z-50 p-4 font-mono text-xs text-slate-300 space-y-4 animate-fade-in"
          style={{ 
            borderColor: palette.primary,
            boxShadow: `0 15px 40px rgba(0,0,0,0.95), 0 0 20px ${palette.primary}20` 
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: palette.primary }} />
              <h4 className="font-bold text-white uppercase tracking-wider text-xs">
                INVESTIGATION STORYBOARD LEGEND
              </h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-white text-[11px] p-0.5"
            >
              ✕
            </button>
          </div>

          {/* Section 1: Color Meanings */}
          <div>
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center">
              <Layers className="w-3 h-3 mr-1 text-emerald-400" />
              EVENT NODE COLORS // PURPOSE & MEANING:
            </div>
            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {COLOR_LEGEND_DATA.map((item) => (
                <div key={item.color} className="flex items-start space-x-2.5 p-1.5 rounded hover:bg-slate-900/60 border border-transparent hover:border-slate-800 transition-colors">
                  <div 
                    className="w-3.5 h-3.5 rounded-full mt-0.5 shrink-0 border border-black shadow-[0_0_8px_currentColor]"
                    style={{ backgroundColor: item.color, color: item.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px]" style={{ color: item.color }}>
                        {item.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Connection Line Evidence Types */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-2 flex items-center">
              <LinkIcon className="w-3 h-3 mr-1 text-sky-400" />
              CONNECTOR WIRES // EVIDENCE STANDARDS:
            </div>
            <div className="space-y-2">
              {/* Solid */}
              <div className="p-2 rounded bg-slate-950/80 border border-emerald-950/70">
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400 mb-0.5">
                  <span>Solid Line ────</span>
                  <span className="text-[9px] uppercase tracking-wider bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/80">Documented relationship</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Confirmed factual connection, direct causation, physical evidence, or documented forensic logs linking both incidents.
                </p>
              </div>

              {/* Dashed */}
              <div className="p-2 rounded bg-slate-950/80 border border-amber-950/70">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 mb-0.5">
                  <span>Dashed Line ─ ─ ─</span>
                  <span className="text-[9px] uppercase tracking-wider bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800/80">Proposed relationship</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Investigative working theory, suspected motive, uncorroborated lead, or hypothetical causation awaiting evidence.
                </p>
              </div>

              {/* Dotted Alternating */}
              <div className="p-2 rounded bg-slate-950/80 border border-sky-950/70">
                <div className="flex items-center justify-between text-[11px] font-bold text-sky-400 mb-0.5">
                  <span>Dotted Alternating • • • •</span>
                  <span className="text-[9px] uppercase tracking-wider bg-sky-950 px-1.5 py-0.5 rounded border border-sky-800/80">Chronological only</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Chronological association only. Incidents occurred in timeline sequence, but neither is proven to have caused the other. Alternates colors between both linked events.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-1 text-[9px] text-slate-500 text-center italic">
            Click any event or connection line on the board to customize details or change evidence type.
          </div>
        </div>
      )}
    </div>
  );
};
