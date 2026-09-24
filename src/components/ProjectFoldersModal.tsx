/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ProjectFolder, CaseFile, TerminalTheme } from '../types';
import { THEME_PALETTES } from './TerminalOverlay';
import { soundEngine } from './SoundEngine';
import { 
  X, 
  Folder, 
  FolderPlus, 
  Trash2, 
  Edit3, 
  Check, 
  Layers, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface ProjectFoldersModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: ProjectFolder[];
  activeFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (name: string, color: string, description: string) => void;
  onDeleteFolder: (folderId: string) => void;
  currentCase: CaseFile;
  onAssignCaseToFolder: (folderId: string | undefined) => void;
  theme: TerminalTheme;
}

const FOLDER_COLORS = ['#05ffa1', '#38bdf8', '#ffb000', '#c084fc', '#ef4444', '#f8fafc'];

export const ProjectFoldersModal: React.FC<ProjectFoldersModalProps> = ({
  isOpen,
  onClose,
  folders,
  activeFolderId,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
  currentCase,
  onAssignCaseToFolder,
  theme
}) => {
  const palette = THEME_PALETTES[theme];

  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#05ffa1');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    soundEngine.playSwitch();
    onCreateFolder(newFolderName.trim(), newFolderColor, newFolderDesc.trim());
    setNewFolderName('');
    setNewFolderDesc('');
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
      <div 
        className="relative w-full max-w-2xl bg-[#0c1015] border rounded-lg shadow-2xl overflow-hidden text-xs"
        style={{ borderColor: palette.primary, boxShadow: `0 10px 40px rgba(0,0,0,0.9), 0 0 25px ${palette.primary}25` }}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b bg-black/60 flex items-center justify-between border-slate-800">
          <div className="flex items-center space-x-2.5">
            <Folder className="w-4 h-4 text-sky-400" />
            <div>
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                PROJECT FOLDERS // CASE CLUSTER DIRECTORY
              </h3>
              <p className="text-[10px] text-slate-400">
                Organize distinct investigations, branches, operations, and target timelines into folders.
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

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Current Case Assignment */}
          <div className="bg-[#0e141c] p-3 rounded border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                ACTIVE CASE FILE:
              </span>
              <span className="text-white font-bold text-xs">{currentCase.title}</span>
              <span className="text-slate-400 ml-2">({currentCase.caseNumber})</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-slate-400">FOLDER:</span>
              <select
                value={currentCase.folderId || ''}
                onChange={(e) => {
                  soundEngine.playClick();
                  onAssignCaseToFolder(e.target.value ? e.target.value : undefined);
                }}
                className="bg-black border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1 focus:border-emerald-400 focus:outline-none cursor-pointer"
              >
                <option value="">[Root / Unassigned]</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Folder List and Filters */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                FILTER BOARD VIEW BY PROJECT FOLDER:
              </span>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setIsCreating(!isCreating);
                }}
                className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 rounded font-bold text-[11px] flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>NEW FOLDER</span>
              </button>
            </div>

            {/* Create Folder Form */}
            {isCreating && (
              <form onSubmit={handleCreate} className="p-3 bg-black/60 rounded border border-slate-800 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                  <span>CREATE NEW PROJECT FOLDER</span>
                  <button type="button" onClick={() => setIsCreating(false)} className="text-slate-500 hover:text-white">✕</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder Name (e.g. Operation Nightfall, Synthetix Infiltrations)..."
                    className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:border-emerald-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newFolderDesc}
                    onChange={(e) => setNewFolderDesc(e.target.value)}
                    placeholder="Brief description or directive..."
                    className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-500">COLOR TINT:</span>
                    {FOLDER_COLORS.map(c => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setNewFolderColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                          newFolderColor === c ? 'scale-125 border-white ring-2 ring-white/20' : 'border-black opacity-75'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded text-xs transition-colors cursor-pointer"
                  >
                    Create Folder
                  </button>
                </div>
              </form>
            )}

            {/* Folder Items */}
            <div className="space-y-1.5">
              {/* All Items Option */}
              <div
                onClick={() => {
                  soundEngine.playClick();
                  onSelectFolder(null);
                }}
                className={`p-2.5 rounded border transition-all cursor-pointer flex items-center justify-between ${
                  activeFolderId === null
                    ? 'border-emerald-500 bg-emerald-950/30 text-white'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Folder className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-bold text-xs">[SHOW ALL CASES & EVENTS]</span>
                    <p className="text-[10px] text-slate-500">Unfiltered board timeline overview</p>
                  </div>
                </div>
                {activeFolderId === null && <span className="text-[10px] text-emerald-400 font-bold">VIEWING ALL</span>}
              </div>

              {/* Individual Folders */}
              {folders.map(f => {
                const isSelected = activeFolderId === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => {
                      soundEngine.playClick();
                      onSelectFolder(f.id);
                    }}
                    className={`p-2.5 rounded border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-sky-400 bg-sky-950/30 text-white shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Folder className="w-4 h-4 shrink-0" style={{ color: f.color }} />
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs truncate" style={{ color: f.color }}>{f.name}</span>
                          {currentCase.folderId === f.id && (
                            <span className="text-[8px] bg-black px-1.5 py-0.5 rounded border border-slate-700 text-slate-300">
                              CURRENT CASE
                            </span>
                          )}
                        </div>
                        {f.description && <p className="text-[10px] text-slate-500 truncate">{f.description}</p>}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {isSelected && <span className="text-[10px] text-sky-400 font-bold">ACTIVE FILTER</span>}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete folder "${f.name}"? Contained cases will simply become unassigned.`)) {
                            soundEngine.playSweep(false);
                            onDeleteFolder(f.id);
                          }
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete folder"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {folders.length === 0 && (
                <div className="p-4 text-center border border-dashed border-slate-800 rounded text-slate-600 italic">
                  No project folders created yet. Click "NEW FOLDER" above to group your investigation cases.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-black/60 flex items-center justify-between border-slate-800 text-[10px] text-slate-500">
          <span>Project folders help group operations, syndicates, and timelines.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
