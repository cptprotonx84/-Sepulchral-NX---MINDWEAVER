/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SaveState, CaseFile, TerminalTheme } from '../types';
import { THEME_PALETTES } from './TerminalOverlay';
import { soundEngine } from './SoundEngine';
import { 
  X, 
  Save, 
  RotateCcw, 
  Trash2, 
  Clock, 
  Layers, 
  Check, 
  AlertCircle,
  FileText
} from 'lucide-react';

interface SaveStatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCase: CaseFile;
  saveStates: SaveState[];
  onSaveToSlot: (slotNumber: number, name: string) => void;
  onLoadFromSlot: (slot: SaveState) => void;
  onDeleteSlot: (slotId: string) => void;
  theme: TerminalTheme;
}

const TOTAL_SLOTS = 5;

export const SaveStatesModal: React.FC<SaveStatesModalProps> = ({
  isOpen,
  onClose,
  currentCase,
  saveStates,
  onSaveToSlot,
  onLoadFromSlot,
  onDeleteSlot,
  theme
}) => {
  const palette = THEME_PALETTES[theme];
  const [editingSlotName, setEditingSlotName] = useState<Record<number, string>>({});

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
      <div 
        className="relative w-full max-w-2xl bg-[#0c1015] border rounded-lg shadow-2xl overflow-hidden text-xs"
        style={{ borderColor: palette.primary, boxShadow: `0 10px 40px rgba(0,0,0,0.9), 0 0 25px ${palette.primary}25` }}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b bg-black/60 flex items-center justify-between border-slate-800">
          <div className="flex items-center space-x-2.5">
            <Save className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                INVESTIGATION SAVE STATES // QUICK SNAPSHOT SLOTS
              </h3>
              <p className="text-[10px] text-slate-400">
                Instantly snapshot or restore entire board layouts, event nodes, and timeline connections.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Slots */}
        <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
          {Array.from({ length: TOTAL_SLOTS }).map((_, index) => {
            const slotNum = index + 1;
            const existing = saveStates.find(s => s.slotNumber === slotNum);
            const currentSlotNameInput = editingSlotName[slotNum] !== undefined 
              ? editingSlotName[slotNum] 
              : existing ? existing.name : `${currentCase.title.slice(0, 24)} - Snapshot`;

            return (
              <div 
                key={slotNum}
                className={`p-3.5 rounded border transition-all ${
                  existing 
                    ? 'border-slate-800 bg-[#0e141b] hover:border-slate-700' 
                    : 'border-dashed border-slate-900 bg-slate-950/40 text-slate-500'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3 min-w-0 flex-1">
                    <div className={`w-8 h-8 rounded border flex items-center justify-center font-bold text-xs shrink-0 ${
                      existing 
                        ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-400' 
                        : 'border-slate-800 bg-slate-900/40 text-slate-600'
                    }`}>
                      0{slotNum}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={currentSlotNameInput}
                          onChange={(e) => setEditingSlotName({ ...editingSlotName, [slotNum]: e.target.value })}
                          placeholder={`Save State Slot ${slotNum}`}
                          className="bg-transparent font-bold text-slate-200 text-xs border-b border-transparent hover:border-slate-700 focus:border-emerald-400 focus:outline-none w-full max-w-sm truncate"
                        />
                      </div>

                      {existing ? (
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-slate-400">
                          <span className="flex items-center text-slate-500">
                            <Clock className="w-3 h-3 mr-1" />
                            {existing.timestamp}
                          </span>
                          <span>•</span>
                          <span className="text-emerald-400 font-semibold">
                            {existing.caseFile.events.length} Events
                          </span>
                          <span>•</span>
                          <span className="text-amber-400 font-semibold">
                            {existing.caseFile.connections.length} Connections
                          </span>
                          <span>•</span>
                          <span className="text-slate-400 truncate max-w-[150px]">
                            {existing.caseFile.caseNumber}
                          </span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-600 italic mt-0.5">
                          Empty slot • Ready for immediate board snapshot
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions for this slot */}
                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                    {/* Save / Overwrite Button */}
                    <button
                      onClick={() => {
                        soundEngine.playSwitch();
                        onSaveToSlot(slotNum, currentSlotNameInput);
                      }}
                      className="px-3 py-1.5 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300 font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                      title={existing ? 'Overwrite this save state' : 'Save current board to this slot'}
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{existing ? 'OVERWRITE' : 'SAVE STATE'}</span>
                    </button>

                    {/* Restore / Load Button */}
                    {existing && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Restore save state "${existing.name}"? Current unsaved adjustments will be replaced.`)) {
                            soundEngine.playSweep(true);
                            onLoadFromSlot(existing);
                            onClose();
                          }
                        }}
                        className="px-3 py-1.5 rounded bg-sky-950/60 hover:bg-sky-900 border border-sky-500/60 text-sky-300 font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                        title="Load and restore this state"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>RESTORE</span>
                      </button>
                    )}

                    {/* Delete Slot Button */}
                    {existing && (
                      <button
                        onClick={() => {
                          soundEngine.playClick();
                          onDeleteSlot(existing.id);
                        }}
                        className="p-1.5 rounded hover:bg-rose-950/60 border border-transparent hover:border-rose-800 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-black/60 flex items-center justify-between border-slate-800 text-slate-500 text-[10px]">
          <span>Save states are automatically stored in browser persistent memory.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
