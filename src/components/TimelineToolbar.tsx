/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TerminalTheme, 
  GridConfig, 
  TimelineEvent, 
  CaseFile,
  ColorGradingConfig,
  EvidenceType,
  ToolMode,
  ProjectFolder,
  getNumberKeyColor
} from '../types';
import { THEME_PALETTES } from './TerminalOverlay';
import { PROJECT_THEMES } from '../utils/projectPages';
import { renderEventIcon } from './iconRegistry';
import { LegendDropdown } from './LegendDropdown';
import { soundEngine } from './SoundEngine';
import { 
  MousePointer, 
  Hand,
  Plus, 
  Link as LinkIcon, 
  Trash2, 
  Search, 
  Grid, 
  Clock, 
  Volume2, 
  VolumeX, 
  Download, 
  Upload, 
  FolderOpen, 
  Palette, 
  Sparkles,
  ListOrdered,
  Save,
  Folder,
  Sun,
  Sliders,
  Undo2,
  Redo2,
  Bot,
  Mouse
} from 'lucide-react';

interface TimelineToolbarProps {
  theme: TerminalTheme;
  activePageIndex: number;
  pageTitles: string[];
  onSelectPage: (index: number) => void;
  gridConfig: GridConfig;
  setGridConfig: React.Dispatch<React.SetStateAction<GridConfig>>;
  colorConfig: ColorGradingConfig;
  setColorConfig: React.Dispatch<React.SetStateAction<ColorGradingConfig>>;
  acousticFeedback: boolean;
  onToggleSound: () => void;
  activeTool: ToolMode;
  setActiveTool: (tool: ToolMode) => void;
  selectedIconToPlace: string;
  setSelectedIconToPlace: (icon: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (f: string) => void;
  defaultEvidenceType: EvidenceType;
  setDefaultEvidenceType: (t: EvidenceType) => void;
  caseFile: CaseFile;
  setCaseFile: React.Dispatch<React.SetStateAction<CaseFile>>;
  events: TimelineEvent[];
  onSelectEvent: (event: TimelineEvent) => void;
  onLoadPresetCase: () => void;
  onNewBlankCase: () => void;
  onClearBoard?: () => void;
  onOpenClearModal: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  undoCount?: number;
  redoCount?: number;
  onUndo: () => void;
  onRedo: () => void;
  onExportCase: () => void;
  onImportCase: (file: File) => void;
  onExportWorkspace: () => void;
  onImportWorkspace: (file: File) => void;
  saveStatesCount?: number;
  onOpenSaveStatesModal: () => void;
  folders: ProjectFolder[];
  activeFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onOpenProjectFoldersModal: () => void;
  onOpenAiAutofill?: () => void;
  isAiAutofillOpen?: boolean;
  wheelZoomEnabled?: boolean;
  onToggleWheelZoom?: () => void;
}

export const TimelineToolbar: React.FC<TimelineToolbarProps> = ({
  theme,
  activePageIndex,
  pageTitles,
  onSelectPage,
  gridConfig,
  setGridConfig,
  colorConfig,
  setColorConfig,
  acousticFeedback,
  onToggleSound,
  activeTool,
  setActiveTool,
  selectedIconToPlace,
  setSelectedIconToPlace,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  defaultEvidenceType,
  setDefaultEvidenceType,
  caseFile,
  setCaseFile,
  events,
  onSelectEvent,
  onLoadPresetCase,
  onNewBlankCase,
  onClearBoard,
  onOpenClearModal,
  canUndo = false,
  canRedo = false,
  undoCount = 0,
  redoCount = 0,
  onUndo,
  onRedo,
  onExportCase,
  onImportCase,
  onExportWorkspace,
  onImportWorkspace,
  saveStatesCount = 0,
  onOpenSaveStatesModal,
  folders,
  activeFolderId,
  onSelectFolder,
  onOpenProjectFoldersModal,
  onOpenAiAutofill,
  isAiAutofillOpen = false,
  wheelZoomEnabled = true,
  onToggleWheelZoom
}) => {
  const palette = THEME_PALETTES[theme];

  // Drawers & Sub-panels toggles
  const [showGridSettings, setShowGridSettings] = useState(false);
  const [showChronology, setShowChronology] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showCaseMenu, setShowCaseMenu] = useState(false);
  const [showBloomMenu, setShowBloomMenu] = useState(false);

  const handleToolChange = (tool: ToolMode) => {
    soundEngine.playClick();
    setActiveTool(tool);
  };

  const handleIconSelect = (iconName: string) => {
    soundEngine.playSwitch();
    setSelectedIconToPlace(iconName);
    setActiveTool('place');
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const workspaceInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportCase(e.target.files[0]);
    }
  };

  const handleWorkspaceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportWorkspace(e.target.files[0]);
      e.target.value = '';
    }
  };

  // Quick favorite placeable icons for the top bar
  const quickIcons = ['FileText', 'Key', 'Terminal', 'Radio', 'Zap', 'Car', 'AlertTriangle', 'Eye', 'User', 'Skull'];

  return (
    <div className={`relative z-40 bg-[#0a0e12] border-b border-black text-xs shadow-xl select-none transition-all duration-300 ${palette.fontClass}`} style={{ borderBottomColor: palette.primary + '40' }}>
      
      {/* Upper Zone: Main Actions & Case Ident */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-900/80">
        
        {/* Left Section: Case Name & Active Project Page Dossier */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-[13px] font-bold text-slate-100 flex items-center">
              <span className="mr-1.5 font-bold" style={{ color: palette.primary }}>{palette.reticleGlyph}</span>
              <span className="text-white font-black tracking-wider">{palette.projectTitle}</span>
              <span 
                className="ml-2 text-[9px] px-2 py-0.5 uppercase font-bold tracking-widest transition-all"
                style={{ 
                  backgroundColor: `${palette.primary}18`, 
                  color: palette.primary, 
                  border: `1px solid ${palette.primary}50`,
                  boxShadow: `0 0 10px ${palette.primary}20`
                }}
              >
                {palette.projectCode}
              </span>
            </span>
          </div>

          <span className="text-slate-700 hidden lg:inline">|</span>
          <span className="hidden xl:inline text-[9px] text-slate-400 font-mono tracking-widest uppercase">
            {palette.classification}
          </span>

          <span className="text-slate-700 hidden sm:inline">|</span>

          {/* Editable Case Title & Case # */}
          <div className="flex items-center space-x-2 truncate">
            <span className="bg-black border border-slate-800 text-[10px] text-slate-400 px-2 py-0.5 rounded font-mono">
              {caseFile.caseNumber}
            </span>
            <input
              type="text"
              value={caseFile.title}
              onChange={(e) => setCaseFile(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Investigation Case Title..."
              className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-emerald-400 text-xs text-slate-200 font-bold px-1 py-0.5 focus:outline-none transition-colors max-w-[200px] truncate"
              title="Click to rename investigation case"
            />
          </div>
        </div>

        {/* Right Section: Case Actions, Legend Dropdown, Sound, Theme */}
        <div className="flex items-center space-x-2">
          {/* COLOR & LINE LEGEND DROPDOWN */}
          <LegendDropdown theme={theme} />

          {/* 1. INVESTIGATION SAVE STATES BUTTON */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenSaveStatesModal();
            }}
            className="px-2.5 py-1 rounded border border-emerald-500/40 hover:border-emerald-400 bg-emerald-950/40 text-emerald-300 hover:text-emerald-200 flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Investigation Save States // Quick Snapshot Slots"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold">SAVES</span>
            {saveStatesCount > 0 && (
              <span className="text-[9px] bg-emerald-500 text-black font-bold px-1.5 py-0.2 rounded-full tabular-nums">
                {saveStatesCount}
              </span>
            )}
          </button>

          {/* 2. PROJECT FOLDERS BUTTON */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenProjectFoldersModal();
            }}
            className={`px-2.5 py-1 rounded border flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeFolderId 
                ? 'border-sky-400 bg-sky-950/60 text-sky-200 font-bold' 
                : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white'
            }`}
            title="Project Folders // Case Cluster Directory"
          >
            <Folder className="w-3.5 h-3.5 text-sky-400" />
            <span>FOLDERS</span>
            {activeFolderId && (
              <span className="text-[9px] bg-sky-500 text-black font-bold px-1.5 py-0.2 rounded truncate max-w-[80px]">
                {folders.find(f => f.id === activeFolderId)?.name || 'FILTERED'}
              </span>
            )}
          </button>

          {/* 3. AI AUTOFILL BUTTON */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenAiAutofill?.();
            }}
            className={`px-2.5 py-1 rounded border flex items-center space-x-1.5 transition-colors cursor-pointer ${
              isAiAutofillOpen
                ? 'border-emerald-400 bg-emerald-950/80 text-emerald-300 font-bold shadow-[0_0_12px_rgba(5,255,161,0.3)]'
                : 'border-emerald-500/40 hover:border-emerald-400 bg-emerald-950/30 text-emerald-300 hover:text-emerald-100'
            }`}
            title="Local AI Autofill // Extract Incident Chronology with Ollama"
          >
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold">AI AUTOFILL</span>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1 py-0.2 rounded uppercase font-bold">
              LOCAL
            </span>
          </button>

          {/* 4. BLOCK BORDERS BLOOM COLOR CONTROLS */}
          <div className="relative">
            <button
              onClick={() => {
                soundEngine.playClick();
                setShowBloomMenu(!showBloomMenu);
              }}
              className={`px-2.5 py-1 rounded border flex items-center space-x-1.5 transition-colors cursor-pointer ${
                showBloomMenu 
                  ? 'border-emerald-400 bg-emerald-950/50 text-white' 
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white'
              }`}
              title="Block Borders Bloom Color & Luminous Aura Controls"
            >
              <span 
                className="w-3 h-3 rounded-full border border-white/80 shrink-0"
                style={{
                  backgroundColor: (!colorConfig.bloomColor || colorConfig.bloomColor === 'auto') ? palette.primary : colorConfig.bloomColor,
                  boxShadow: `0 0 8px ${(!colorConfig.bloomColor || colorConfig.bloomColor === 'auto') ? palette.primary : colorConfig.bloomColor}`
                }}
              />
              <span className="hidden md:inline font-bold">BLOOM</span>
              <span className="text-[10px] text-emerald-400 font-mono">
                {colorConfig.bloomIntensity ?? 65}%
              </span>
            </button>

            {showBloomMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-80 bg-[#0c1015] border border-slate-700 rounded-lg shadow-2xl p-4 z-50 space-y-3.5 text-xs text-slate-300">
                {/* Bloom Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <Sun className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                      BLOCK BORDERS BLOOM // NEON AURA
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowBloomMenu(false)}
                    className="text-slate-500 hover:text-white text-xs p-1"
                  >
                    ✕
                  </button>
                </div>

                {/* Preset Swatches */}
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">
                    <span>BORDER BLOOM COLOR:</span>
                    <span className="text-emerald-400 font-mono">
                      {(!colorConfig.bloomColor || colorConfig.bloomColor === 'auto') ? 'AUTO (DYNAMIC)' : colorConfig.bloomColor}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => {
                        soundEngine.playSwitch();
                        setColorConfig(prev => ({ ...prev, bloomColor: 'auto' }));
                      }}
                      className={`px-2 py-1.5 rounded border text-[11px] font-mono flex items-center space-x-1.5 text-left transition-colors cursor-pointer ${
                        !colorConfig.bloomColor || colorConfig.bloomColor === 'auto'
                          ? 'border-emerald-400 bg-emerald-950/60 text-white font-bold'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-400 shrink-0" />
                      <span className="truncate">Auto (Dynamic)</span>
                    </button>

                    {[
                      { label: 'Emerald Matrix', color: '#05ffa1' },
                      { label: 'Electric Cyan', color: '#00f0ff' },
                      { label: 'Solar Amber', color: '#ffb000' },
                      { label: 'Red Alert', color: '#ff0055' },
                      { label: 'Synth Violet', color: '#a855f7' },
                      { label: 'Ultra Magenta', color: '#ff00bb' },
                      { label: 'Ghost White', color: '#ffffff' },
                    ].map(p => {
                      const isSelected = colorConfig.bloomColor === p.color;
                      return (
                        <button
                          key={p.color}
                          onClick={() => {
                            soundEngine.playSwitch();
                            setColorConfig(prev => ({ ...prev, bloomColor: p.color }));
                          }}
                          className={`px-2 py-1.5 rounded border text-[11px] font-mono flex items-center space-x-1.5 text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'border-white bg-slate-800 text-white font-bold ring-1 ring-white/30'
                              : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0" 
                            style={{ backgroundColor: p.color, boxShadow: `0 0 6px ${p.color}` }} 
                          />
                          <span className="truncate">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Hex Color Picker */}
                  <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-slate-900">
                    <span className="text-[10px] text-slate-400">CUSTOM HEX:</span>
                    <input
                      type="color"
                      value={(!colorConfig.bloomColor || colorConfig.bloomColor === 'auto') ? '#05ffa1' : colorConfig.bloomColor}
                      onChange={(e) => {
                        setColorConfig(prev => ({ ...prev, bloomColor: e.target.value }));
                      }}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={colorConfig.bloomColor || 'auto'}
                      onChange={(e) => setColorConfig(prev => ({ ...prev, bloomColor: e.target.value }))}
                      placeholder="#05ffa1 or auto"
                      className="bg-black border border-slate-800 rounded px-2 py-0.5 text-slate-200 text-[11px] font-mono w-28 uppercase focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Bloom Intensity Slider */}
                <div className="space-y-1 pt-1 border-t border-slate-800">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="uppercase font-bold tracking-wider">BLOOM INTENSITY:</span>
                    <span className="text-emerald-400 font-bold font-mono">
                      {colorConfig.bloomIntensity ?? 65}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={colorConfig.bloomIntensity ?? 65}
                    onChange={(e) => setColorConfig(prev => ({ ...prev, bloomIntensity: Number(e.target.value) }))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                    <span>0% (CLEAN)</span>
                    <span>50% (CYBER)</span>
                    <span>100% (HYPER-BLOOM)</span>
                  </div>
                </div>

                {/* Bloom Pulse Animation Toggle */}
                <div className="pt-1 border-t border-slate-800 space-y-2">
                  <label className="flex items-center justify-between text-[11px] text-slate-300 cursor-pointer">
                    <span className="flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Breathing Bloom Pulse</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={colorConfig.bloomPulse ?? true}
                      onChange={(e) => setColorConfig(prev => ({ ...prev, bloomPulse: e.target.checked }))}
                      className="accent-emerald-400"
                    />
                  </label>

                  {/* Block Border Style */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>BORDER STYLE:</span>
                    <div className="flex items-center space-x-1">
                      {(['cyber', 'solid', 'double'] as const).map(style => (
                        <button
                          key={style}
                          onClick={() => {
                            soundEngine.playClick();
                            setColorConfig(prev => ({ ...prev, blockBorderStyle: style }));
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-colors cursor-pointer ${
                            (colorConfig.blockBorderStyle || 'cyber') === style
                              ? 'bg-emerald-500 text-black'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Interactive Live Card Preview */}
                <div className="p-2.5 rounded bg-black/80 border border-slate-800 flex items-center justify-between">
                  <div 
                    className="p-2 rounded border text-[10px] w-full flex items-center justify-between transition-all"
                    style={{
                      borderColor: (!colorConfig.bloomColor || colorConfig.bloomColor === 'auto') ? '#05ffa1' : colorConfig.bloomColor,
                      boxShadow: `0 0 ${Math.round(8 * ((colorConfig.bloomIntensity ?? 65) / 100))}px ${(!colorConfig.bloomColor || colorConfig.bloomColor === 'auto') ? '#05ffa1' : colorConfig.bloomColor}bb`
                    }}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: (!colorConfig.bloomColor || colorConfig.bloomColor === 'auto') ? '#05ffa1' : colorConfig.bloomColor }} />
                      <span className="font-bold text-white text-[10px]">LIVE BLOCK BORDER PREVIEW</span>
                    </div>
                    <span className="text-[9px] text-emerald-400 font-mono">ACTIVE</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Case File dropdown button */}
          <div className="relative">
            <button
              onClick={() => {
                soundEngine.playClick();
                setShowCaseMenu(!showCaseMenu);
              }}
              className="px-2.5 py-1 rounded border border-slate-800 hover:border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>CASES</span>
            </button>

            {showCaseMenu && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-slate-950 border border-slate-800 rounded shadow-2xl p-2 z-50 space-y-1">
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    onLoadPresetCase();
                    setShowCaseMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-900 text-slate-300 hover:text-emerald-400 text-[11px] transition-colors cursor-pointer flex items-center space-x-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Load Preset: Operation Nightfall</span>
                </button>
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    onNewBlankCase();
                    setShowCaseMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-900 text-slate-300 hover:text-white text-[11px] transition-colors cursor-pointer flex items-center space-x-2"
                >
                  <Plus className="w-3.5 h-3.5 text-sky-400" />
                  <span>New Blank Investigation</span>
                </button>
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    onOpenClearModal();
                    setShowCaseMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded hover:bg-rose-950/50 text-rose-300 hover:text-rose-200 text-[11px] transition-colors cursor-pointer flex items-center space-x-2"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Clear Board (Purge Canvas)</span>
                </button>
                <div className="border-t border-slate-900 my-1" />
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    onExportCase();
                    setShowCaseMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-900 text-slate-300 hover:text-white text-[11px] transition-colors cursor-pointer flex items-center space-x-2"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Export Case (JSON)</span>
                </button>
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    fileInputRef.current?.click();
                    setShowCaseMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-900 text-slate-300 hover:text-white text-[11px] transition-colors cursor-pointer flex items-center space-x-2"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>Import Case (JSON)</span>
                </button>
                <div className="border-t border-slate-900 my-1" />
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    onExportWorkspace();
                    setShowCaseMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded hover:bg-emerald-950/40 text-emerald-300 hover:text-emerald-200 text-[11px] transition-colors cursor-pointer flex items-center space-x-2"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export Full Workspace Backup</span>
                </button>
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    workspaceInputRef.current?.click();
                    setShowCaseMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded hover:bg-emerald-950/40 text-emerald-300 hover:text-emerald-200 text-[11px] transition-colors cursor-pointer flex items-center space-x-2"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Restore Full Workspace Backup</span>
                </button>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />
          <input
            type="file"
            ref={workspaceInputRef}
            onChange={handleWorkspaceUpload}
            accept=".json"
            className="hidden"
          />

          {/* Chronological Timeline drawer toggle */}
          <button
            onClick={() => {
              soundEngine.playClick();
              setShowChronology(!showChronology);
            }}
            className={`px-2.5 py-1 rounded border flex items-center space-x-1.5 transition-colors cursor-pointer ${
              showChronology
                ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="View chronological event list"
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CHRONO</span>
            <span className="text-[9px] bg-black px-1 rounded text-slate-500">
              {events.length}
            </span>
          </button>

          {/* Grid Layout settings toggle */}
          <button
            onClick={() => {
              soundEngine.playClick();
              setShowGridSettings(!showGridSettings);
            }}
            className={`px-2.5 py-1 rounded border flex items-center space-x-1.5 transition-colors cursor-pointer ${
              showGridSettings
                ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Adjust grid columns, rows, snap"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">GRID</span>
          </button>

          {/* Theme & Project Operational Page Toggle */}
          <div className="relative">
            <button
              onClick={() => {
                soundEngine.playClick();
                setShowThemePicker(!showThemePicker);
              }}
              className={`px-2.5 py-1 rounded border flex items-center space-x-1.5 transition-all cursor-pointer ${
                showThemePicker 
                  ? 'border-emerald-400 bg-emerald-950/70 text-white shadow-[0_0_12px_rgba(5,255,161,0.3)]' 
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white'
              }`}
              title="Project Pages, Operational Schemes & Screen Optics"
            >
              <Palette className="w-3.5 h-3.5" style={{ color: palette.primary }} />
              <span className="hidden sm:inline font-bold uppercase">{palette.projectCode}</span>
            </button>

            {showThemePicker && (
              <div className="absolute right-0 top-full mt-1.5 w-84 sm:w-96 bg-[#0a0e14] border border-slate-700 rounded-lg shadow-2xl p-3.5 z-50 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div>
                    <span className="block text-[11px] text-white uppercase font-black tracking-wider">
                      PROJECT PAGES // OPERATIONAL SCHEMES
                    </span>
                    <span className="text-[9px] text-slate-500">
                      Ten independent projects. Alt+1–9 and Alt+0 switch pages.
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowThemePicker(false)}
                    className="text-slate-500 hover:text-white text-xs p-1"
                  >
                    ✕
                  </button>
                </div>

                {/* Ten independent project pages, each with its own appearance and data. */}
                <div className="space-y-2 max-h-[min(60vh,620px)] overflow-y-auto pr-1">
                  {PROJECT_THEMES.map((t, idx) => {
                    const p = THEME_PALETTES[t];
                    const isSelected = activePageIndex === idx;
                    const altCmd = `Alt+${idx === 9 ? 0 : idx + 1}`;

                    return (
                      <button
                        key={t}
                        onClick={() => {
                          soundEngine.playSwitch();
                          onSelectPage(idx);
                          setShowThemePicker(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col space-y-1.5 ${
                          isSelected
                            ? 'bg-slate-900/90 border-emerald-400/90 shadow-[0_0_15px_rgba(5,255,161,0.2)]'
                            : 'bg-black/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/50'
                        }`}
                        title={`Switch to ${p.projectTitle} (Quick Command: ${altCmd})`}
                      >
                        {/* Header: Glyph, Title, Code Badge, Alt Command & Active status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span 
                              className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold shrink-0" 
                              style={{ backgroundColor: `${p.primary}25`, color: p.primary, border: `1px solid ${p.primary}60` }}
                            >
                              {p.reticleGlyph}
                            </span>
                            <span className="text-white text-xs font-black tracking-wider uppercase">
                              {p.projectTitle}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <span 
                              className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase font-mono"
                              style={{ color: p.primary, backgroundColor: `${p.primary}15` }}
                            >
                              {p.projectCode}
                            </span>
                            <span className="text-[9px] bg-slate-800 text-slate-300 font-mono font-bold px-1.5 py-0.2 rounded border border-slate-700">
                              {altCmd}
                            </span>
                            {isSelected && (
                              <span className="text-[8px] bg-emerald-500 text-black font-extrabold px-1.5 py-0.2 rounded">
                                ACTIVE
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Mission & Classification */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="truncate pr-2">{pageTitles[idx] || p.subtitle}</span>
                          <span className="text-[9px] text-slate-500 shrink-0 font-mono">{p.classification.split('//')[0].trim()}</span>
                        </div>

                        {/* Typography & Button Preview Bar */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-900/80 text-[10px]">
                          <span className={`${p.fontClass} text-slate-300 font-bold text-[11px]`}>
                            Aa 0123 • {p.fontFamilyName.split('(')[0].trim()}
                          </span>

                          <span 
                            className={`px-2 py-0.5 text-[9px] font-bold ${p.btnClass}`}
                            style={{ pointerEvents: 'none' }}
                          >
                            SAMPLE BUTTON
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* CRT Glass & Screen Optics Section */}
                <div className="border-t border-slate-800/80 pt-2 space-y-2">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    SCREEN OPTICS & CRT ATMOSPHERE:
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer bg-black/60 p-1.5 rounded border border-slate-800">
                      <input
                        type="checkbox"
                        checked={colorConfig.crtScanlines}
                        onChange={(e) => setColorConfig(prev => ({ ...prev, crtScanlines: e.target.checked }))}
                        className="accent-emerald-400"
                      />
                      <span>Scanlines</span>
                    </label>
                    <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer bg-black/60 p-1.5 rounded border border-slate-800">
                      <input
                        type="checkbox"
                        checked={colorConfig.vignette}
                        onChange={(e) => setColorConfig(prev => ({ ...prev, vignette: e.target.checked }))}
                        className="accent-emerald-400"
                      />
                      <span>Vignette</span>
                    </label>
                    <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer bg-black/60 p-1.5 rounded border border-slate-800">
                      <input
                        type="checkbox"
                        checked={colorConfig.chromaticAberration}
                        onChange={(e) => setColorConfig(prev => ({ ...prev, chromaticAberration: e.target.checked }))}
                        className="accent-emerald-400"
                      />
                      <span>Aberration</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`px-2 py-1 rounded border transition-colors flex items-center space-x-1.5 cursor-pointer ${
              acousticFeedback 
                ? 'bg-black border-emerald-500 text-emerald-400' 
                : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle all sounds and reactor hum"
          >
            {acousticFeedback ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Middle Zone: Mode Switcher, Evidence Type Selector & Quick Placeable Icons Bar */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-3 bg-black/40">
        
        {/* Undo & Redo and Clear Board Action Buttons */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded border border-slate-800">
          <button
            onClick={() => {
              if (canUndo) onUndo();
            }}
            disabled={!canUndo}
            className={`px-2.5 py-1 rounded flex items-center space-x-1.5 transition-colors ${
              canUndo
                ? 'text-slate-200 hover:text-white hover:bg-slate-850 bg-slate-900/60 border border-slate-700/60 cursor-pointer shadow-sm'
                : 'text-slate-600 opacity-40 cursor-not-allowed border border-transparent'
            }`}
            title={`Undo last action (Ctrl+Z)${undoCount ? ` • ${undoCount} action${undoCount > 1 ? 's' : ''} in stack` : ''}`}
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="font-bold">UNDO</span>
            {undoCount > 0 && (
              <span className="text-[9px] bg-emerald-950 border border-emerald-700/60 text-emerald-400 font-mono px-1 rounded tabular-nums">
                {undoCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              if (canRedo) onRedo();
            }}
            disabled={!canRedo}
            className={`px-2.5 py-1 rounded flex items-center space-x-1.5 transition-colors ${
              canRedo
                ? 'text-slate-200 hover:text-white hover:bg-slate-850 bg-slate-900/60 border border-slate-700/60 cursor-pointer shadow-sm'
                : 'text-slate-600 opacity-40 cursor-not-allowed border border-transparent'
            }`}
            title={`Redo last undone action (Ctrl+Y or Ctrl+Shift+Z)${redoCount ? ` • ${redoCount} action${redoCount > 1 ? 's' : ''} in stack` : ''}`}
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span className="font-bold">REDO</span>
            {redoCount > 0 && (
              <span className="text-[9px] bg-sky-950 border border-sky-700/60 text-sky-400 font-mono px-1 rounded tabular-nums">
                {redoCount}
              </span>
            )}
          </button>

          <div className="h-4 w-px bg-slate-800 mx-0.5" />

          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenClearModal();
            }}
            className="px-2.5 py-1 rounded flex items-center space-x-1.5 transition-colors cursor-pointer border border-rose-900/60 hover:border-rose-500 bg-rose-950/30 hover:bg-rose-950/70 text-rose-300 hover:text-rose-100"
            title="Clear entire board (Purge all events and wiring with confirmation)"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-bold">CLEAR BOARD</span>
          </button>
        </div>

        {/* Active Tool Modes with dedicated DRAG PAN mode - Adapt to Project Page Styling */}
        <div 
          className={`flex items-center space-x-1 bg-slate-950/90 p-1 ${palette.btnRadius} border`}
          style={{ borderColor: `${palette.primary}35` }}
        >
          <button
            onClick={() => handleToolChange('select')}
            className={`px-3 py-1 ${palette.btnRadius} flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTool === 'select'
                ? palette.activeToolBtnStyle
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Inspect / Edit: Click any event to open notes, drag empty board to navigate"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>INSPECT</span>
          </button>

          <button
            onClick={() => handleToolChange('pan')}
            className={`px-3 py-1 ${palette.btnRadius} flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTool === 'pan'
                ? palette.activeToolBtnStyle
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Navigate / Pan Board: Click and drag anywhere to navigate around the investigation board"
          >
            <Hand className="w-3.5 h-3.5" />
            <span>DRAG BOARD</span>
          </button>

          <button
            onClick={() => handleToolChange('place')}
            className={`px-3 py-1 ${palette.btnRadius} flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTool === 'place'
                ? palette.activeToolBtnStyle
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Place Event Mode: Click grid cell to place an icon"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>PLACE EVENT</span>
          </button>

          <button
            onClick={() => handleToolChange('connect')}
            className={`px-3 py-1 ${palette.btnRadius} flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTool === 'connect'
                ? 'bg-sky-500 text-black font-bold shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Connect Lines Mode: Click event A then event B to draw line connector"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>CONNECT</span>
          </button>

          <button
            onClick={() => handleToolChange('erase')}
            className={`px-3 py-1 ${palette.btnRadius} flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTool === 'erase'
                ? 'bg-rose-500 text-black font-bold shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                : 'text-slate-400 hover:text-rose-400 hover:bg-slate-900'
            }`}
            title="Erase Mode: Click any event or line connector to delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>ERASE</span>
          </button>
        </div>

        {/* EVIDENCE TYPE SELECTOR FOR CONNECTING */}
        <div className="flex items-center space-x-2 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
            WIRE TYPE:
          </span>
          <select
            value={defaultEvidenceType}
            onChange={(e) => {
              soundEngine.playClick();
              setDefaultEvidenceType(e.target.value as EvidenceType);
            }}
            className="bg-black border border-slate-800 focus:border-emerald-400 rounded px-2 py-0.5 text-[11px] text-slate-200 focus:outline-none cursor-pointer"
            title="Select evidence type for new line connectors"
          >
            <option value="documented">Solid: Documented relationship</option>
            <option value="proposed">Dashed: Proposed relationship</option>
            <option value="chronological">Dotted: Chronological association only</option>
          </select>
        </div>

        {/* Placeable Icon Quick Picker */}
        <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mr-1 hidden lg:inline">
            ICONS:
          </span>
          {quickIcons.map((ic) => {
            const isSelected = selectedIconToPlace === ic && activeTool === 'place';
            return (
              <button
                key={ic}
                onClick={() => handleIconSelect(ic)}
                className={`p-1.5 rounded border transition-all cursor-pointer flex items-center justify-center ${
                  isSelected
                    ? 'border-emerald-400 bg-emerald-950/40 text-emerald-300 scale-110 shadow-[0_0_10px_rgba(5,255,161,0.4)]'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
                title={`Place ${ic} on grid`}
              >
                {renderEventIcon(ic, 'w-4 h-4')}
              </button>
            );
          })}
        </div>

        {/* Search & Status & Folder Filter */}
        <div className="flex items-center space-x-2">
          {/* Quick Folder Switcher */}
          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded px-2 py-1">
            <Folder className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <select
              value={activeFolderId || ''}
              onChange={(e) => {
                soundEngine.playClick();
                onSelectFolder(e.target.value ? e.target.value : null);
              }}
              className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer max-w-[120px] truncate"
              title="Quick Filter by Project Folder"
            >
              <option value="" className="bg-slate-950 text-slate-300">All Folders</option>
              {folders.map(f => (
                <option key={f.id} value={f.id} className="bg-slate-950 text-slate-300">
                  📁 {f.name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 text-xs focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="critical">Critical</option>
            <option value="lead">Leads</option>
            <option value="unverified">Unverified</option>
            <option value="redacted">Redacted</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="bg-slate-950 border border-slate-800 rounded pl-8 pr-2.5 py-1 text-xs text-slate-200 focus:border-emerald-400 focus:outline-none w-28 sm:w-36 placeholder:text-slate-600"
            />
          </div>
        </div>
      </div>

      {/* Grid Settings Bar (When expanded) */}
      {showGridSettings && (
        <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800/80 flex flex-wrap items-center gap-6 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-bold text-slate-500">Columns ({gridConfig.columns}):</span>
            <input
              type="range"
              min={6}
              max={16}
              value={gridConfig.columns}
              onChange={(e) => setGridConfig(prev => ({ ...prev, columns: Number(e.target.value) }))}
              className="accent-emerald-500 cursor-pointer w-24"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-bold text-slate-500">Rows ({gridConfig.rows}):</span>
            <input
              type="range"
              min={4}
              max={12}
              value={gridConfig.rows}
              onChange={(e) => setGridConfig(prev => ({ ...prev, rows: Number(e.target.value) }))}
              className="accent-emerald-500 cursor-pointer w-24"
            />
          </div>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={gridConfig.snapToGrid}
              onChange={(e) => setGridConfig(prev => ({ ...prev, snapToGrid: e.target.checked }))}
              className="accent-emerald-500"
            />
            <span>Snap to Grid</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={gridConfig.showGridLines}
              onChange={(e) => setGridConfig(prev => ({ ...prev, showGridLines: e.target.checked }))}
              className="accent-emerald-500"
            />
            <span>Show Grid Cells</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={gridConfig.showCoordinates}
              onChange={(e) => setGridConfig(prev => ({ ...prev, showCoordinates: e.target.checked }))}
              className="accent-emerald-500"
            />
            <span>Coordinate Headers</span>
          </label>

          {/* Mouse Wheel Zoom Toggle Option */}
          <div className="flex items-center space-x-2 border-l border-slate-800 pl-4">
            <button
              type="button"
              onClick={() => {
                soundEngine.playSwitch();
                onToggleWheelZoom?.();
              }}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded border text-[11px] font-mono cursor-pointer transition-colors ${
                wheelZoomEnabled
                  ? 'border-emerald-400 bg-emerald-950/60 text-emerald-300 font-bold shadow-[0_0_8px_rgba(5,255,161,0.2)]'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle mouse wheel zooming in and out on the board"
            >
              <Mouse className={`w-3.5 h-3.5 ${wheelZoomEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>Mouse Wheel Zoom:</span>
              <span className={wheelZoomEnabled ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {wheelZoomEnabled ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>

          <button
            onClick={() => setShowGridSettings(false)}
            className="ml-auto text-slate-500 hover:text-white text-[11px]"
          >
            Hide
          </button>
        </div>
      )}

      {/* Chronological Flow Drawer (When expanded) */}
      {showChronology && (
        <div className="px-4 py-2.5 bg-black/90 border-t border-slate-800/80 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              CHRONOLOGICAL EVENT SEQUENCE ({events.length} TOTAL):
            </span>
            <span className="text-[10px] text-slate-500">Click any event to open description notes</span>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {events.length === 0 && (
              <span className="text-slate-600 text-xs italic">No events on board yet. Click "Place Event" to add your first timeline node.</span>
            )}
            {events.map((evt, idx) => (
              <div
                key={evt.id}
                onClick={() => {
                  soundEngine.playClick();
                  onSelectEvent(evt);
                }}
                className="bg-slate-900 border border-slate-800 hover:border-emerald-400 p-2 rounded shrink-0 w-52 cursor-pointer transition-all hover:bg-slate-800/60"
              >
                <div className="flex items-center justify-between text-[9px] text-slate-400 mb-1">
                  <div className="flex items-center space-x-1.5">
                    {idx < 10 && (
                      <span 
                        className="font-mono font-black text-[9px] px-1.5 py-0.2 rounded border shadow-sm"
                        style={{
                          borderColor: evt.color || getNumberKeyColor(idx),
                          backgroundColor: `${evt.color || getNumberKeyColor(idx)}22`,
                          color: evt.color || getNumberKeyColor(idx)
                        }}
                        title={`Press key '${idx === 9 ? '0' : `${idx + 1}`}' to quick-center`}
                      >
                        KEY [{idx === 9 ? '0' : `${idx + 1}`}]
                      </span>
                    )}
                    <span className="font-bold text-slate-400">#0{idx + 1}</span>
                  </div>
                  <span className="truncate max-w-[95px]">{evt.time || 'TIME UNSET'}</span>
                </div>
                <div className="flex items-center space-x-1.5 mb-1">
                  <div style={{ color: evt.color || palette.primary }}>
                    {renderEventIcon(evt.icon, 'w-3.5 h-3.5')}
                  </div>
                  <h5 className="text-[11px] font-bold text-slate-200 truncate">{evt.title}</h5>
                </div>
                <p className="text-[9px] text-slate-500 line-clamp-1 italic">{evt.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
