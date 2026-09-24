/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { TerminalTheme } from '../types';
import { THEME_PALETTES } from './TerminalOverlay';
import { soundEngine } from './SoundEngine';
import { AlertTriangle, Trash2, X, RotateCcw, ShieldAlert } from 'lucide-react';

interface ClearBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmClear: () => void;
  eventCount: number;
  connectionCount: number;
  theme: TerminalTheme;
}

export const ClearBoardModal: React.FC<ClearBoardModalProps> = ({
  isOpen,
  onClose,
  onConfirmClear,
  eventCount,
  connectionCount,
  theme
}) => {
  const palette = THEME_PALETTES[theme];

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        soundEngine.playClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
      <div 
        className="w-full max-w-md bg-[#0b0e14] border-2 border-rose-500/80 rounded-lg shadow-[0_0_50px_rgba(244,63,94,0.3)] overflow-hidden relative text-xs text-slate-200"
      >
        {/* Top Warning Strip */}
        <div className="bg-rose-950/70 border-b border-rose-500/40 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
            <span className="font-bold text-rose-300 tracking-wider text-[11px] uppercase">
              CONFIRM BOARD PURGE // CLEAR CANVAS
            </span>
          </div>
          <button 
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5"
            title="Cancel (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/40 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-rose-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-white">
                Clear all investigation nodes & connections?
              </h3>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                This will wipe the active storyboard grid, removing all current event blocks and relational wiring.
              </p>
            </div>
          </div>

          {/* Impact Stats */}
          <div className="bg-black/60 border border-slate-800 rounded p-3 grid grid-cols-2 gap-3 text-center">
            <div className="border-r border-slate-800/80 pr-2">
              <span className="block text-[10px] text-slate-500 uppercase font-bold">Events to purge</span>
              <span className="text-rose-400 text-lg font-bold tabular-nums font-mono">{eventCount}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 uppercase font-bold">Wires to purge</span>
              <span className="text-amber-400 text-lg font-bold tabular-nums font-mono">{connectionCount}</span>
            </div>
          </div>

          {/* Undo Safety Notice */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded p-2.5 flex items-start space-x-2">
            <RotateCcw className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-emerald-300/90 leading-tight">
              <strong className="text-emerald-300 font-bold">Undo Protection Active:</strong> If you clear by mistake, you can instantly reverse this action using the <span className="underline font-bold">UNDO</span> button or <kbd className="bg-black/60 px-1 py-0.5 rounded border border-emerald-500/40 text-white font-mono text-[9px]">Ctrl+Z</kbd>.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-900">
            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="px-4 py-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-bold"
            >
              ABORT (KEEP BOARD)
            </button>
            <button
              onClick={() => {
                onConfirmClear();
              }}
              className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 border border-rose-400 text-white font-bold transition-all shadow-[0_0_15px_rgba(244,63,94,0.4)] flex items-center space-x-1.5 cursor-pointer text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>CONFIRM CLEAR BOARD</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
