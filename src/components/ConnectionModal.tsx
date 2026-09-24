/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  EventConnection, 
  TimelineEvent, 
  TerminalTheme, 
  EvidenceType 
} from '../types';
import { THEME_PALETTES } from './TerminalOverlay';
import { soundEngine } from './SoundEngine';
import { 
  X, 
  Trash2, 
  ArrowRight, 
  ArrowLeftRight, 
  Check, 
  FileCheck, 
  HelpCircle, 
  Clock,
  Sparkles
} from 'lucide-react';

interface ConnectionModalProps {
  connection: EventConnection;
  allEvents: TimelineEvent[];
  theme: TerminalTheme;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: EventConnection) => void;
  onDelete: (connId: string) => void;
}

const COMMON_RELATIONSHIPS = [
  'Preceded In Time',
  'Led to',
  'Triggered',
  'Gained Access To',
  'Associated with',
  'Corroborates',
  'Exfiltrated Data To',
  'Covered Escape Route',
  'Seen Fleeing Toward',
  'Subsequent Incident'
];

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  connection,
  allEvents,
  theme,
  isOpen,
  onClose,
  onUpdate,
  onDelete
}) => {
  const palette = THEME_PALETTES[theme];

  const [label, setLabel] = useState(connection.label);
  const [evidenceType, setEvidenceType] = useState<EvidenceType>(connection.evidenceType || 'documented');
  const [color, setColor] = useState(connection.color || palette.primary);
  const [bidirectional, setBidirectional] = useState(connection.bidirectional || false);

  if (!isOpen) return null;

  const sourceEvent = allEvents.find(e => e.id === connection.fromId);
  const targetEvent = allEvents.find(e => e.id === connection.toId);

  const sourceColor = sourceEvent?.color || palette.primary;
  const targetColor = targetEvent?.color || '#38bdf8';

  const handleSave = () => {
    soundEngine.playClick();
    onUpdate({
      ...connection,
      label: label.trim(),
      evidenceType,
      color,
      bidirectional
    });
    onClose();
  };

  const handleDelete = () => {
    soundEngine.playSweep(false);
    onDelete(connection.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
      <div 
        className="relative w-full max-w-lg bg-[#0d1217] border rounded-lg shadow-2xl overflow-hidden text-xs"
        style={{ borderColor: color || palette.primary }}
      >
        {/* Cyber corners */}
        <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2" style={{ borderColor: color || palette.primary }} />
        <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2" style={{ borderColor: color || palette.primary }} />
        <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2" style={{ borderColor: color || palette.primary }} />
        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2" style={{ borderColor: color || palette.primary }} />

        {/* Header */}
        <div className="px-4 py-3 border-b bg-black/60 flex items-center justify-between border-slate-800">
          <div className="flex items-center space-x-2 text-slate-200 font-bold uppercase tracking-wider">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color || palette.primary }} />
            <span>EVENT CONNECTOR // EVIDENCE & RELATIONSHIP</span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 text-slate-300 max-h-[80vh] overflow-y-auto">
          {/* Source and Target Event Info */}
          <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 uppercase font-bold">FROM EVENT:</span>
              <span className="font-bold truncate max-w-[240px]" style={{ color: sourceColor }}>
                {sourceEvent?.title || connection.fromId}
              </span>
            </div>
            <div className="flex items-center justify-center text-slate-600">
              {bidirectional ? <ArrowLeftRight className="w-4 h-4 text-sky-400" /> : <ArrowRight className="w-4 h-4 text-emerald-400" />}
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 uppercase font-bold">TO EVENT:</span>
              <span className="font-bold truncate max-w-[240px]" style={{ color: targetColor }}>
                {targetEvent?.title || connection.toId}
              </span>
            </div>
          </div>

          {/* CRITICAL EVIDENCE TYPE SELECTOR */}
          <div className="space-y-2 bg-[#090d12] p-3 rounded border border-slate-800/90">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                EVIDENCE TYPE & CAUSALITY:
              </label>
              <span className="text-[9px] text-slate-500">Determines line pattern & meaning</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              A line between two events does not automatically mean causality. Select the verified evidence standard:
            </p>

            <div className="space-y-2 pt-1">
              {/* Option 1: Documented (Solid line) */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setEvidenceType('documented');
                }}
                className={`w-full text-left p-2.5 rounded border transition-all cursor-pointer ${
                  evidenceType === 'documented'
                    ? 'border-emerald-400 bg-emerald-950/30 text-white shadow-[0_0_12px_rgba(5,255,161,0.2)]'
                    : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center text-emerald-400">
                    <FileCheck className="w-3.5 h-3.5 mr-1.5" />
                    Documented relationship
                  </span>
                  <span className="text-[10px] font-mono text-emerald-300 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
                    SOLID LINE ────
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Confirmed factual connection, direct causation, physical evidence, or documented forensic logs linking both incidents.
                </p>
                <div className="mt-2 h-1 w-full bg-emerald-400 rounded-full" />
              </button>

              {/* Option 2: Proposed (Dashed line) */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setEvidenceType('proposed');
                }}
                className={`w-full text-left p-2.5 rounded border transition-all cursor-pointer ${
                  evidenceType === 'proposed'
                    ? 'border-amber-400 bg-amber-950/30 text-white shadow-[0_0_12px_rgba(255,176,0,0.2)]'
                    : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center text-amber-400">
                    <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
                    Proposed relationship
                  </span>
                  <span className="text-[10px] font-mono text-amber-300 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800">
                    DASHED LINE ─ ─ ─
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Investigative hypothesis, unconfirmed witness statement, suspect motive, or working theory pending confirmation.
                </p>
                <div 
                  className="mt-2 h-1 w-full rounded-full"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, #ffb000 0, #ffb000 8px, transparent 8px, transparent 14px)'
                  }}
                />
              </button>

              {/* Option 3: Chronological (Dotted alternating color line) */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setEvidenceType('chronological');
                }}
                className={`w-full text-left p-2.5 rounded border transition-all cursor-pointer ${
                  evidenceType === 'chronological'
                    ? 'border-sky-400 bg-sky-950/30 text-white shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                    : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center text-sky-400">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    Chronological association only
                  </span>
                  <span className="text-[10px] font-mono text-sky-300 font-bold bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800">
                    DOTTED ALTERNATING • • • •
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Incidents followed one another in time sequence or timeline order without proof that one caused the other. Colors alternate between source (<span style={{ color: sourceColor }}>{sourceColor}</span>) and target (<span style={{ color: targetColor }}>{targetColor}</span>).
                </p>
                <div 
                  className="mt-2 h-1.5 w-full rounded-full"
                  style={{
                    backgroundImage: `repeating-linear-gradient(90deg, ${sourceColor} 0px, ${sourceColor} 4px, transparent 4px, transparent 8px, ${targetColor} 8px, ${targetColor} 12px, transparent 12px, transparent 16px)`
                  }}
                />
              </button>
            </div>
          </div>

          {/* Relationship Label */}
          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
              RELATIONSHIP LABEL / ANNOTATION:
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Led to, Triggered, Preceded in time..."
              className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-400 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            />
            {/* Quick Relationship Chips */}
            <div className="flex flex-wrap gap-1 mt-2">
              {COMMON_RELATIONSHIPS.map((rel) => (
                <button
                  key={rel}
                  type="button"
                  onClick={() => setLabel(rel)}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[10px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {rel}
                </button>
              ))}
            </div>
          </div>

          {/* Direction toggle */}
          <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded border border-slate-800">
            <span className="text-[11px] text-slate-300">Bidirectional Relationship:</span>
            <button
              type="button"
              onClick={() => setBidirectional(!bidirectional)}
              className={`px-3 py-1 rounded text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer ${
                bidirectional ? 'bg-sky-500 text-black' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {bidirectional ? 'TWO-WAY ⇄' : 'ONE-WAY ➔'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t bg-black/60 flex items-center justify-between border-slate-800">
          <button
            type="button"
            onClick={handleDelete}
            className="px-3 py-1.5 rounded bg-rose-950/40 hover:bg-rose-900 border border-rose-900/60 text-rose-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Link</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded flex items-center space-x-1.5 transition-colors ml-auto cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Connector</span>
          </button>
        </div>
      </div>
    </div>
  );
};
