/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  TerminalTheme, 
  GridConfig, 
  TimelineEvent, 
  EventConnection, 
  CaseFile, 
  ColorGradingConfig,
  EvidenceType,
  ToolMode,
  SaveState,
  ProjectFolder,
  FloatingTimeTag,
  getNumberKeyColor
} from './types';
import { TerminalOverlay, THEME_PALETTES } from './components/TerminalOverlay';
import { TimelineToolbar } from './components/TimelineToolbar';
import { EventGridCanvas } from './components/EventGridCanvas';
import { EventDetailModal } from './components/EventDetailModal';
import { ConnectionModal } from './components/ConnectionModal';
import { SaveStatesModal } from './components/SaveStatesModal';
import { ProjectFoldersModal } from './components/ProjectFoldersModal';
import { ClearBoardModal } from './components/ClearBoardModal';
import { AiAutofillPanel } from './components/AiAutofillPanel';
import { BoardIntelligencePanel } from './components/BoardIntelligencePanel';
import { PRESET_CASE_SYNDICATE, BLANK_CASE } from './data/presetCases';
import { soundEngine } from './components/SoundEngine';
import { createWorkspaceBackup, parseWorkspaceBackup } from './utils/workspaceBackup';
import { exportImageAssets, importImageAssets, ExportedImageAsset } from './services/imageAssets';
import { ACTIVE_PAGE_STORAGE_KEY, loadActivePageIndex, loadProjectPages, PROJECT_THEMES, ProjectPageData, saveProjectPages } from './utils/projectPages';
import { 
  Clock, 
  Layers, 
  Link as LinkIcon, 
  Volume2, 
  VolumeX, 
  Cpu,
  Shield,
  Folder,
  Save
} from 'lucide-react';

const INITIAL_PAGES = loadProjectPages();
const INITIAL_PAGE_INDEX = loadActivePageIndex();
const imageIdsForCase = (file: CaseFile): string[] => file.events.flatMap(event => event.imageId ? [event.imageId] : []);

export default function App() {
  const activePageIndex = INITIAL_PAGE_INDEX;
  const pagesRef = useRef<ProjectPageData[]>(INITIAL_PAGES);
  const theme = PROJECT_THEMES[activePageIndex];
  const [acousticFeedback, setAcousticFeedback] = useState<boolean>(false);

  // Active Tool Mode (supports drag board navigation)
  const [activeTool, setActiveTool] = useState<ToolMode>('select');
  const [selectedIconToPlace, setSelectedIconToPlace] = useState<string>('FileText');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Project Folders State
  const [folders, setFolders] = useState<ProjectFolder[]>(INITIAL_PAGES[activePageIndex].folders);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [isProjectFoldersModalOpen, setIsProjectFoldersModalOpen] = useState<boolean>(false);

  // Default evidence type for new line connections
  const [defaultEvidenceType, setDefaultEvidenceType] = useState<EvidenceType>('documented');

  // Grid Canvas Layout Configuration
  const [gridConfig, setGridConfig] = useState<GridConfig>(INITIAL_PAGES[activePageIndex].gridConfig);

  // Block Borders Bloom & CRT / Screen Atmosphere grading
  const [colorConfig, setColorConfig] = useState<ColorGradingConfig>(INITIAL_PAGES[activePageIndex].colorConfig);

  // Main Case File Data (Events & Line Connectors)
  const [caseFile, setCaseFile] = useState<CaseFile>(INITIAL_PAGES[activePageIndex].caseFile);

  // Save States (Snapshot slots 1 to 5)
  const [saveStates, setSaveStates] = useState<SaveState[]>(INITIAL_PAGES[activePageIndex].saveStates);
  const [isSaveStatesModalOpen, setIsSaveStatesModalOpen] = useState<boolean>(false);

  // Undo & Redo History Stacks
  const [past, setPast] = useState<CaseFile[]>([]);
  const [future, setFuture] = useState<CaseFile[]>([]);
  const [isClearBoardModalOpen, setIsClearBoardModalOpen] = useState<boolean>(false);
  const [isAiAutofillOpen, setIsAiAutofillOpen] = useState<boolean>(false);
  const [isBoardIntelligenceOpen, setIsBoardIntelligenceOpen] = useState(false);
  const [lastImportedBatchId, setLastImportedBatchId] = useState<string | null>(null);

  // Project page switch HUD toast notification for Alt+1..0 quick commands
  const [themeToast, setThemeToast] = useState<{
    projectTitle: string;
    projectCode: string;
    primary: string;
    reticleGlyph: string;
    shortcut: string;
  } | null>(null);

  // Mouse Wheel Zoom Toggle Option (remembers preference)
  const [wheelZoomEnabled, setWheelZoomEnabled] = useState<boolean>(INITIAL_PAGES[activePageIndex].wheelZoomEnabled);

  const handleToggleWheelZoom = () => {
    setWheelZoomEnabled(prev => !prev);
  };

  // Synchronized refs for stable callbacks & global keyboard shortcuts
  const pastRef = useRef(past);
  pastRef.current = past;

  const futureRef = useRef(future);
  futureRef.current = future;

  const caseFileRef = useRef(caseFile);
  caseFileRef.current = caseFile;

  // Modal State for Popup Detail Description Box (Opened when clicking an icon)
  const [selectedEventForModal, setSelectedEventForModal] = useState<TimelineEvent | null>(null);

  // Modal State for Connection Editor (Opened when clicking a line connector)
  const [selectedConnectionForModal, setSelectedConnectionForModal] = useState<EventConnection | null>(null);

  // Real-time UTC clock
  const [timeStr, setTimeStr] = useState<string>('00:00:00 UTC');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toISOString().substring(11, 19) + ' UTC');
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Snapshot current caseFile state before mutating
  const recordHistory = useCallback((customSnapshot?: CaseFile) => {
    const snapshotToSave = customSnapshot || caseFileRef.current;
    setPast(prev => [...prev.slice(-49), JSON.parse(JSON.stringify(snapshotToSave))]);
    setFuture([]); // clear redo stack on new action
  }, []);

  // Undo action
  const handleUndo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    const current = caseFileRef.current;
    const previousState = pastRef.current[pastRef.current.length - 1];
    const newPast = pastRef.current.slice(0, pastRef.current.length - 1);

    setPast(newPast);
    setFuture(prevFuture => [current, ...prevFuture]);
    setCaseFile(previousState);
    soundEngine.playUndo();

    // Sync open modal selections
    setSelectedEventForModal(prev => prev ? previousState.events.find(e => e.id === prev.id) || null : null);
    setSelectedConnectionForModal(prev => prev ? previousState.connections.find(c => c.id === prev.id) || null : null);
  }, []);

  // Redo action
  const handleRedo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const current = caseFileRef.current;
    const nextState = futureRef.current[0];
    const newFuture = futureRef.current.slice(1);

    setFuture(newFuture);
    setPast(prevPast => [...prevPast.slice(-49), current]);
    setCaseFile(nextState);
    soundEngine.playRedo();

    // Sync open modal selections
    setSelectedEventForModal(prev => prev ? nextState.events.find(e => e.id === prev.id) || null : null);
    setSelectedConnectionForModal(prev => prev ? nextState.connections.find(c => c.id === prev.id) || null : null);
  }, []);

  // Clear Board action also removes presentation annotations; undo restores all three layers.
  const handleClearBoard = useCallback(() => {
    recordHistory();
    setCaseFile(prev => ({
      ...prev,
      events: [],
      connections: [],
      timeTags: []
    }));
    soundEngine.playClear();
    setIsClearBoardModalOpen(false);
    setSelectedEventForModal(null);
    setSelectedConnectionForModal(null);
  }, [recordHistory]);

  const currentPageData = useCallback((): ProjectPageData => ({
    caseFile, saveStates, folders, colorConfig, gridConfig, wheelZoomEnabled,
  }), [caseFile, saveStates, folders, colorConfig, gridConfig, wheelZoomEnabled]);

  const persistCurrentPage = useCallback((): boolean => {
    try {
      pagesRef.current[activePageIndex] = currentPageData();
      saveProjectPages(pagesRef.current);
      return true;
    } catch (error) {
      console.error('Mindweaver could not save this project page', error);
      return false;
    }
  }, [activePageIndex, currentPageData]);

  const switchProjectPage = useCallback((targetIndex: number) => {
    if (targetIndex === activePageIndex || targetIndex < 0 || targetIndex > 9) return;
    if (!persistCurrentPage()) {
      window.alert('This project page could not be saved. Switching was cancelled to protect your work.');
      return;
    }
    try {
      localStorage.setItem(ACTIVE_PAGE_STORAGE_KEY, String(targetIndex));
      soundEngine.playSwitch();
      window.location.reload();
    } catch {
      window.alert('Mindweaver could not open the next project page. Your current page is still open.');
    }
  }, [activePageIndex, persistCurrentPage]);

  // Global Keyboard Shortcuts for Undo & Redo and Alt+1..0 Project Pages
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+1 through Alt+9, then Alt+0 for page 10.
      const pageNumber = /^[0-9]$/.test(e.key) ? (e.key === '0' ? 10 : Number(e.key)) : 0;
      if (e.altKey && !e.ctrlKey && !e.metaKey && pageNumber > 0) {
        e.preventDefault();
        switchProjectPage(pageNumber - 1);
        return;
      }

      // Keep editing shortcuts native in text fields, but page switching above
      // remains available even when the project title or a tag editor has focus.
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, switchProjectPage]);

  // Keep the active project current, including its grid and visual preferences.
  useEffect(() => { persistCurrentPage(); }, [persistCurrentPage]);

  // Save State operations
  const handleSaveToSlot = (slotNumber: number, name: string) => {
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    const newSaveState: SaveState = {
      id: `save_slot_${slotNumber}_${Date.now()}`,
      name: name || `Snapshot 0${slotNumber}`,
      slotNumber,
      timestamp,
      caseFile: JSON.parse(JSON.stringify(caseFile)),
      thumbnailSummary: `${caseFile.events.length} Events • ${caseFile.connections.length} Connections`
    };

    setSaveStates(prev => {
      const filtered = prev.filter(s => s.slotNumber !== slotNumber);
      return [...filtered, newSaveState].sort((a, b) => a.slotNumber - b.slotNumber);
    });
  };

  const handleLoadFromSlot = (slot: SaveState) => {
    recordHistory();
    setCaseFile(JSON.parse(JSON.stringify(slot.caseFile)));
    soundEngine.playSweep(true);
  };

  const handleDeleteSlot = (slotId: string) => {
    setSaveStates(prev => prev.filter(s => s.id !== slotId));
  };

  // Project Folder operations
  const handleCreateFolder = (name: string, color: string, description: string) => {
    const newFolder: ProjectFolder = {
      id: `fld_${Date.now().toString(36)}`,
      name,
      color,
      description,
      createdAt: new Date().toISOString().substring(0, 10)
    };
    setFolders(prev => [...prev, newFolder]);
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders(prev => prev.filter(f => f.id !== folderId));
    if (activeFolderId === folderId) setActiveFolderId(null);
    if (caseFile.folderId === folderId) {
      setCaseFile(prev => ({ ...prev, folderId: undefined }));
    }
  };

  const handleAssignCaseToFolder = (folderId: string | undefined) => {
    recordHistory();
    setCaseFile(prev => ({ ...prev, folderId }));
  };

  const palette = THEME_PALETTES[theme];

  // Keep page-level and panel scrollbars synchronized with the active project theme.
  useEffect(() => {
    document.documentElement.style.setProperty('--scrollbar-accent', palette.primary);
  }, [palette.primary]);

  // One master toggle controls both the ambient hum and every action cue.
  const toggleSound = () => {
    const val = !acousticFeedback;
    setAcousticFeedback(val);
    soundEngine.setEnabled(val);
    if (!val && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    if (val) {
      soundEngine.playSwitch();
    }
  };

  // Place a new event icon on the grid
  const handlePlaceEvent = (gridX: number, gridY: number, iconName: string) => {
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newId = `evt_${Date.now().toString(36)}`;
    const assignedColor = getNumberKeyColor(caseFile.events.length);
    const newEvent: TimelineEvent = {
      id: newId,
      title: `Event #${caseFile.events.length + 1} - ${iconName}`,
      time: timeFormatted,
      description: '',
      icon: iconName,
      color: assignedColor,
      status: 'unverified',
      gridX,
      gridY,
      tags: ['New Evidence'],
      location: `Sector [${gridX + 1}, ${gridY + 1}]`,
      folderId: activeFolderId || caseFile.folderId || undefined
    };

    recordHistory();
    setCaseFile(prev => ({
      ...prev,
      events: [...prev.events, newEvent]
    }));

    // Immediately open the popup detail description box so user can type into it
    setSelectedEventForModal(newEvent);
  };

  // Update an event's details
  const handleUpdateEvent = (updated: TimelineEvent) => {
    recordHistory();
    setCaseFile(prev => ({
      ...prev,
      events: prev.events.map(e => e.id === updated.id ? updated : e)
    }));
    setSelectedEventForModal(prev => (prev && prev.id === updated.id ? updated : prev));
  };

  // Delete an event and any connections linking to it
  const handleDeleteEvent = (eventId: string) => {
    recordHistory();
    setCaseFile(prev => ({
      ...prev,
      events: prev.events.filter(e => e.id !== eventId),
      connections: prev.connections.filter(c => c.fromId !== eventId && c.toId !== eventId)
    }));
    if (selectedEventForModal?.id === eventId) {
      setSelectedEventForModal(null);
    }
  };

  // Move an event on the grid
  const handleMoveEvent = (eventId: string, newGridX: number, newGridY: number) => {
    const targetOccupied = caseFile.events.find(e => e.id !== eventId && e.gridX === newGridX && e.gridY === newGridY);
    recordHistory();
    if (targetOccupied) {
      setCaseFile(prev => ({
        ...prev,
        events: prev.events.map(e => {
          if (e.id === eventId) return { ...e, gridX: newGridX, gridY: newGridY };
          if (e.id === targetOccupied.id) {
            const moving = prev.events.find(m => m.id === eventId);
            return { ...e, gridX: moving?.gridX ?? 0, gridY: moving?.gridY ?? 0 };
          }
          return e;
        })
      }));
      return;
    }

    setCaseFile(prev => ({
      ...prev,
      events: prev.events.map(e => e.id === eventId ? { ...e, gridX: newGridX, gridY: newGridY } : e)
    }));
  };

  const handleAddTimeTag = (tag: FloatingTimeTag) => {
    recordHistory();
    setCaseFile(prev => ({...prev, timeTags: [...(prev.timeTags ?? []), tag]}));
  };

  const handleUpdateTimeTag = (id: string, changes: Partial<FloatingTimeTag>) => {
    if (!(caseFile.timeTags ?? []).some(tag => tag.id === id)) return;
    recordHistory();
    setCaseFile(prev => ({
      ...prev,
      timeTags: (prev.timeTags ?? []).map(tag => tag.id === id ? {...tag, ...changes, id} : tag),
    }));
  };

  const handleDeleteTimeTag = (id: string) => {
    if (!(caseFile.timeTags ?? []).some(tag => tag.id === id)) return;
    recordHistory();
    setCaseFile(prev => ({...prev, timeTags: (prev.timeTags ?? []).filter(tag => tag.id !== id)}));
  };

  // Duplicate an event
  const handleDuplicateEvent = (evt: TimelineEvent) => {
    const newId = `evt_${Date.now().toString(36)}`;
    let targetX = evt.gridX + 1;
    let targetY = evt.gridY;
    if (targetX >= gridConfig.columns) {
      targetX = 0;
      targetY = (targetY + 1) % gridConfig.rows;
    }

    const cloned: TimelineEvent = {
      ...evt,
      id: newId,
      title: `${evt.title} (Copy)`,
      gridX: targetX,
      gridY: targetY
    };

    recordHistory();
    setCaseFile(prev => ({
      ...prev,
      events: [...prev.events, cloned]
    }));
    setSelectedEventForModal(cloned);
  };

  // Add a line connector between two events with evidence type
  const handleAddConnection = (
    fromId: string, 
    toId: string, 
    label = 'Led to', 
    evidenceType: EvidenceType = defaultEvidenceType
  ) => {
    if (fromId === toId) return;

    // Check if connection already exists
    const exists = caseFile.connections.some(c => (c.fromId === fromId && c.toId === toId) || (c.fromId === toId && c.toId === fromId));
    if (exists) return;

    const sourceEvent = caseFile.events.find(e => e.id === fromId);
    const newConn: EventConnection = {
      id: `conn_${Date.now().toString(36)}`,
      fromId,
      toId,
      label,
      evidenceType,
      color: sourceEvent?.color || palette.primary
    };

    recordHistory();
    setCaseFile(prev => ({
      ...prev,
      connections: [...prev.connections, newConn]
    }));
  };

  // Update a connection line
  const handleUpdateConnection = (updated: EventConnection) => {
    recordHistory();
    setCaseFile(prev => ({
      ...prev,
      connections: prev.connections.map(c => c.id === updated.id ? updated : c)
    }));
  };

  // Delete a connection line
  const handleDeleteConnection = (connId: string) => {
    recordHistory();
    setCaseFile(prev => ({
      ...prev,
      connections: prev.connections.filter(c => c.id !== connId)
    }));
    if (selectedConnectionForModal?.id === connId) {
      setSelectedConnectionForModal(null);
    }
  };

  // Local AI Autofill Operations
  const handlePlaceAutofillEvents = (newEvents: TimelineEvent[], newConnections: EventConnection[], batchId: string) => {
    recordHistory();
    setCaseFile(prev => ({
      ...prev,
      events: [...prev.events, ...newEvents],
      connections: [...prev.connections, ...newConnections]
    }));
    setLastImportedBatchId(batchId);
    soundEngine.playPlacement();
  };

  const handleUndoBatch = (batchId: string) => {
    recordHistory();
    setCaseFile(prev => {
      const removedEventIds = new Set(prev.events.filter(e => e.importBatchId === batchId).map(e => e.id));
      return {
        ...prev,
        events: prev.events.filter(e => e.importBatchId !== batchId),
        connections: prev.connections.filter(c => !removedEventIds.has(c.fromId) && !removedEventIds.has(c.toId))
      };
    });
    setLastImportedBatchId(null);
    soundEngine.playUndo();
  };

  // Case File operations
  const handleLoadPresetCase = () => {
    recordHistory();
    setCaseFile(PRESET_CASE_SYNDICATE);
    soundEngine.playSweep(true);
  };

  const handleNewBlankCase = () => {
    recordHistory();
    setCaseFile({
      ...BLANK_CASE,
      id: `case_${Date.now().toString(36)}`,
      caseNumber: `NX-CASE #${Math.floor(1000 + Math.random() * 9000)}-ALPHA`
    });
    soundEngine.playSwitch();
  };

  const downloadJson = (data: unknown, filename: string) => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const handleExportCase = async () => {
    try {
      const imageAssets = await exportImageAssets(imageIdsForCase(caseFile));
      downloadJson({ ...caseFile, imageAssets }, `${caseFile.caseNumber.replace(/[^a-zA-Z0-9]/g, '_')}_timeline.json`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Case export failed.');
    }
  };

  const handleExportWorkspace = async () => {
    if (!persistCurrentPage()) {
      window.alert('The active project could not be saved, so the workspace backup was cancelled.');
      return;
    }
    try {
      const ids = pagesRef.current.flatMap(page => [
        ...imageIdsForCase(page.caseFile),
        ...page.saveStates.flatMap(slot => imageIdsForCase(slot.caseFile)),
      ]);
      const backup = createWorkspaceBackup({
        activePage: activePageIndex,
        pages: pagesRef.current,
        imageAssets: await exportImageAssets(ids),
      });
      downloadJson(backup, `Mindweaver_workspace_backup_${new Date().toISOString().substring(0, 10)}.json`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Workspace backup failed.');
    }
  };

  const handleImportWorkspace = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backup = parseWorkspaceBackup(event.target?.result as string);
        if (!window.confirm('Restore this Mindweaver backup? It will replace all ten local project pages, their save slots, folders, and visual settings. Older one-page backups restore into page 1.')) {
          return;
        }
        await importImageAssets(backup.data.imageAssets);
        saveProjectPages(backup.data.pages);
        localStorage.setItem(ACTIVE_PAGE_STORAGE_KEY, String(backup.data.activePage));
        window.location.reload();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'The workspace backup could not be restored.';
        window.alert(message);
      }
    };
    reader.readAsText(file);
  };

  const handleImportCase = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.events && Array.isArray(parsed.events)) {
          const imageAssets: ExportedImageAsset[] = Array.isArray(parsed.imageAssets) ? parsed.imageAssets : [];
          const requiredIds = imageIdsForCase(parsed as CaseFile);
          if (requiredIds.some(id => !imageAssets.some(asset => asset.id === id))) {
            throw new Error('This case export is missing an attached image. Import was cancelled.');
          }
          await importImageAssets(imageAssets);
          delete parsed.imageAssets;
          parsed.timeTags = Array.isArray(parsed.timeTags) ? parsed.timeTags : [];
          // Normalize legacy connections
          if (parsed.connections) {
            parsed.connections = parsed.connections.map((c: any) => ({
              ...c,
              evidenceType: c.evidenceType || (c.style === 'dashed' ? 'proposed' : 'documented')
            }));
          }
          recordHistory();
          setCaseFile(parsed);
          soundEngine.playSweep(true);
        }
      } catch (err) {
        window.alert(err instanceof Error ? err.message : 'Case import failed.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div 
      className={`min-h-screen flex flex-col ${palette.fontClass} text-slate-300 relative select-none overflow-hidden`}
      style={{ 
        backgroundColor: palette.bg,
        backgroundImage: palette.radialGradient,
        transition: 'background-color 0.5s ease, background-image 0.5s ease'
      }}
    >
      {/* 1. Immersive CRT Glass Screen Overlay */}
      <TerminalOverlay 
        theme={theme}
        crtScanlines={colorConfig.crtScanlines}
        chromaticAberration={colorConfig.chromaticAberration}
        vignette={colorConfig.vignette}
        noiseLevel={colorConfig.noiseLevel}
      />

      {/* 2. UPPER TERMINAL STATUS HEADER BAR - DYNAMIC PROJECT PAGE */}
      <header 
        className="relative border-b-2 border-black bg-[#0b0e12]/95 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xl backdrop-blur-sm"
        style={{ borderBottomColor: palette.primary + '35' }}
      >
        <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-slate-600 opacity-40" />
        <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-slate-600 opacity-40" />

        {/* Brand identity - Dynamically reflects the selected Project Page */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div 
              className={`w-8 h-8 ${palette.btnRadius} border border-dashed flex items-center justify-center animate-spin`}
              style={{ borderColor: palette.primary, animationDuration: '16s' }}
            >
              <Cpu className="w-4 h-4" style={{ color: palette.primary }} />
            </div>
            <span 
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-ping" 
              style={{ backgroundColor: palette.primary }} 
            />
            <span 
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" 
              style={{ backgroundColor: palette.primary }} 
            />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-wider text-sm text-white flex items-center">
                <span className="mr-1.5 font-bold" style={{ color: palette.primary }}>{palette.reticleGlyph}</span>
                <span>{palette.projectTitle}</span>
              </span>
              <span 
                className={`text-[9px] font-bold px-1.5 py-0.5 ${palette.btnRadius} uppercase tracking-wider border`}
                style={{ 
                  color: palette.primary, 
                  backgroundColor: `${palette.primary}18`,
                  borderColor: `${palette.primary}45`
                }}
              >
                {palette.projectCode}
              </span>
              <span 
                className={`hidden md:inline-block text-[8px] font-bold px-1.5 py-0.2 ${palette.btnRadius} uppercase`}
                style={{ backgroundColor: palette.primary, color: '#000000' }}
              >
                {palette.activeBadge}
              </span>
            </div>
            <p className="text-[9px] text-slate-400 tracking-wider truncate max-w-[340px] sm:max-w-none">
              <span className="font-bold" style={{ color: palette.accent }}>{palette.headerTag}</span> // {palette.subtitle}
            </p>
          </div>
        </div>

        {/* Real-time Status Counters */}
        <div 
          className={`flex items-center space-x-4 bg-slate-950/85 px-3 py-1.5 border ${palette.btnRadius} text-[11px] overflow-x-auto`}
          style={{ borderColor: `${palette.primary}30` }}
        >
          {/* UTC Clock */}
          <div className="flex items-center space-x-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5" style={{ color: palette.primary }} />
            <span className="font-bold text-slate-200 tabular-nums">{timeStr}</span>
          </div>

          {/* Events Count */}
          <div className="flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-500 text-[10px]">EVENTS:</span>
            <span className="font-bold tabular-nums" style={{ color: palette.primary }}>{caseFile.events.length}</span>
          </div>

          {/* Connections Count */}
          <div className="flex items-center space-x-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-500 text-[10px]">WIRES:</span>
            <span className="text-amber-400 font-bold tabular-nums">{caseFile.connections.length}</span>
          </div>

          {/* Active Folder Filter Status */}
          <button 
            onClick={() => setIsProjectFoldersModalOpen(true)}
            className={`flex items-center space-x-1.5 hover:text-white transition-colors cursor-pointer ${palette.btnRadius} px-1.5 py-0.5 hover:bg-slate-900/60`}
            title="Active Project Folder"
          >
            <Folder className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-500 text-[10px]">FOLDER:</span>
            <span className="text-sky-300 font-bold max-w-[120px] truncate">
              {activeFolderId ? folders.find(f => f.id === activeFolderId)?.name || 'Filtered' : 'ALL'}
            </span>
          </button>

          {/* Save States Count */}
          <button 
            onClick={() => setIsSaveStatesModalOpen(true)}
            className={`flex items-center space-x-1.5 hover:text-white transition-colors cursor-pointer ${palette.btnRadius} px-1.5 py-0.5 hover:bg-slate-900/60`}
            title="Snapshots in memory"
          >
            <Save className="w-3.5 h-3.5" style={{ color: palette.primary }} />
            <span className="text-slate-500 text-[10px]">SAVES:</span>
            <span className="font-bold tabular-nums" style={{ color: palette.primary }}>{saveStates.length}/5</span>
          </button>
        </div>

        {/* Master sound toggle */}
        <div className="flex items-center space-x-2">
          <button onClick={() => { setIsAiAutofillOpen(false); setIsBoardIntelligenceOpen(value => !value); }} className="flex items-center gap-1.5 rounded border border-emerald-500/40 bg-emerald-950/30 px-2 py-1 text-[10px] text-emerald-300 hover:border-emerald-400" title="Analyze board and chat with local Ollama"><Cpu className="w-3.5 h-3.5" /> ANALYZE / CHAT</button>
          <button
            onClick={toggleSound}
            className={`px-2.5 py-1 ${palette.btnRadius} border transition-all flex items-center space-x-1.5 text-[10px] uppercase font-bold tracking-wider cursor-pointer ${
              acousticFeedback 
                ? 'bg-black text-white shadow-sm' 
                : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            style={{ 
              borderColor: acousticFeedback ? palette.primary : undefined,
              color: acousticFeedback ? palette.primary : undefined
            }}
          >
            {acousticFeedback ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{acousticFeedback ? 'SOUND ON' : 'SOUND OFF'}</span>
          </button>
        </div>
      </header>

      {/* 3. TIMELINE & GRID WORKSPACE TOOLBAR WITH LEGEND DROPDOWN & BLOOM CONTROLS */}
      <TimelineToolbar 
        theme={theme}
        activePageIndex={activePageIndex}
        pageTitles={pagesRef.current.map(page => page.caseFile.title)}
        onSelectPage={switchProjectPage}
        gridConfig={gridConfig}
        setGridConfig={setGridConfig}
        colorConfig={colorConfig}
        setColorConfig={setColorConfig}
        acousticFeedback={acousticFeedback}
        onToggleSound={toggleSound}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        selectedIconToPlace={selectedIconToPlace}
        setSelectedIconToPlace={setSelectedIconToPlace}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        defaultEvidenceType={defaultEvidenceType}
        setDefaultEvidenceType={setDefaultEvidenceType}
        caseFile={caseFile}
        setCaseFile={setCaseFile}
        events={caseFile.events}
        onSelectEvent={(evt) => setSelectedEventForModal(evt)}
        onLoadPresetCase={handleLoadPresetCase}
        onNewBlankCase={handleNewBlankCase}
        onExportCase={handleExportCase}
        onImportCase={handleImportCase}
        onExportWorkspace={handleExportWorkspace}
        onImportWorkspace={handleImportWorkspace}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        undoCount={past.length}
        redoCount={future.length}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenClearModal={() => setIsClearBoardModalOpen(true)}
        onClearBoard={handleClearBoard}
        saveStatesCount={saveStates.length}
        onOpenSaveStatesModal={() => setIsSaveStatesModalOpen(true)}
        folders={folders}
        activeFolderId={activeFolderId}
        onSelectFolder={setActiveFolderId}
        onOpenProjectFoldersModal={() => setIsProjectFoldersModalOpen(true)}
        onOpenAiAutofill={() => setIsAiAutofillOpen(prev => !prev)}
        isAiAutofillOpen={isAiAutofillOpen}
        wheelZoomEnabled={wheelZoomEnabled}
        onToggleWheelZoom={handleToggleWheelZoom}
      />

      {/* 4. MAIN INTERACTIVE GRID CANVAS WITH CONNECTORS & PLACED ICONS */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        <EventGridCanvas 
          theme={theme}
          gridConfig={gridConfig}
          colorConfig={colorConfig}
          events={caseFile.events}
          connections={caseFile.connections}
          timeTags={caseFile.timeTags ?? []}
          activeTool={activeTool}
          selectedIconToPlace={selectedIconToPlace}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          activeFolderId={activeFolderId}
          folders={folders}
          onSelectEvent={(evt) => setSelectedEventForModal(evt)}
          onSelectConnection={(conn) => setSelectedConnectionForModal(conn)}
          onMoveEvent={handleMoveEvent}
          onPlaceEvent={handlePlaceEvent}
          onAddConnection={handleAddConnection}
          onDeleteEvent={handleDeleteEvent}
          onDeleteConnection={handleDeleteConnection}
          onAddTimeTag={handleAddTimeTag}
          onUpdateTimeTag={handleUpdateTimeTag}
          onDeleteTimeTag={handleDeleteTimeTag}
          wheelZoomEnabled={wheelZoomEnabled}
          onToggleWheelZoom={handleToggleWheelZoom}
          canUndo={past.length > 0}
          canRedo={future.length > 0}
          undoCount={past.length}
          redoCount={future.length}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onOpenClearModal={() => setIsClearBoardModalOpen(true)}
        />
      </main>

      {/* Dynamic Alt+1..5 Project Page Switch Toast */}
      {themeToast && (
        <div 
          className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2.5 px-4 py-2 rounded-lg bg-black/95 border shadow-[0_0_30px_rgba(0,0,0,0.9)] animate-fade-in font-mono"
          style={{ borderColor: themeToast.primary }}
        >
          <span className="text-base font-bold" style={{ color: themeToast.primary }}>
            {themeToast.reticleGlyph}
          </span>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase text-white tracking-wider">
                {themeToast.projectTitle}
              </span>
              <span 
                className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase"
                style={{ backgroundColor: `${themeToast.primary}25`, color: themeToast.primary }}
              >
                {themeToast.shortcut}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              SWITCHED TO {themeToast.projectCode}
            </span>
          </div>
        </div>
      )}

      {/* 5. POPUP DETAIL DESCRIPTION BOX (WHEN YOU CLICK ON AN EVENT) */}
      {selectedEventForModal && (
        <EventDetailModal 
          event={selectedEventForModal}
          allEvents={caseFile.events}
          connections={caseFile.connections}
          theme={theme}
          isOpen={true}
          folders={folders}
          onClose={() => setSelectedEventForModal(null)}
          onUpdate={handleUpdateEvent}
          onDelete={handleDeleteEvent}
          onDuplicate={handleDuplicateEvent}
          onAddConnection={handleAddConnection}
          onDeleteConnection={handleDeleteConnection}
        />
      )}

      {/* 6. POPUP LINE CONNECTOR EDITOR MODAL WITH EVIDENCE TYPE */}
      {selectedConnectionForModal && (
        <ConnectionModal 
          connection={selectedConnectionForModal}
          allEvents={caseFile.events}
          theme={theme}
          isOpen={true}
          onClose={() => setSelectedConnectionForModal(null)}
          onUpdate={handleUpdateConnection}
          onDelete={handleDeleteConnection}
        />
      )}

      {/* 7. INVESTIGATION SAVE STATES MODAL */}
      <SaveStatesModal 
        isOpen={isSaveStatesModalOpen}
        onClose={() => setIsSaveStatesModalOpen(false)}
        currentCase={caseFile}
        saveStates={saveStates}
        onSaveToSlot={handleSaveToSlot}
        onLoadFromSlot={handleLoadFromSlot}
        onDeleteSlot={handleDeleteSlot}
        theme={theme}
      />

      {/* 8. PROJECT FOLDERS / CASE CLUSTER DIRECTORY MODAL */}
      <ProjectFoldersModal 
        isOpen={isProjectFoldersModalOpen}
        onClose={() => setIsProjectFoldersModalOpen(false)}
        folders={folders}
        activeFolderId={activeFolderId}
        onSelectFolder={setActiveFolderId}
        onCreateFolder={handleCreateFolder}
        onDeleteFolder={handleDeleteFolder}
        currentCase={caseFile}
        onAssignCaseToFolder={handleAssignCaseToFolder}
        theme={theme}
      />

      {/* 9. CLEAR BOARD CONFIRMATION MODAL */}
      <ClearBoardModal 
        isOpen={isClearBoardModalOpen}
        onClose={() => setIsClearBoardModalOpen(false)}
        onConfirmClear={handleClearBoard}
        eventCount={caseFile.events.length}
        connectionCount={caseFile.connections.length}
        theme={theme}
      />

      {/* 10. LOCAL AI OLLAMA AUTOFILL PANEL */}
      <AiAutofillPanel 
        isOpen={isAiAutofillOpen}
        onClose={() => setIsAiAutofillOpen(false)}
        theme={theme}
        gridConfig={gridConfig}
        setGridConfig={setGridConfig}
        existingEvents={caseFile.events}
        existingConnections={caseFile.connections}
        onPlaceEvents={handlePlaceAutofillEvents}
        onUndoBatch={handleUndoBatch}
        lastImportedBatchId={lastImportedBatchId}
        activeFolderId={activeFolderId}
      />

      <BoardIntelligencePanel isOpen={isBoardIntelligenceOpen} onClose={() => setIsBoardIntelligenceOpen(false)} caseFile={caseFile} theme={theme} soundEnabled={acousticFeedback} />

      {/* 11. CLEAN STATUS FOOTER */}
      <footer className="border-t border-slate-900 bg-black/95 px-4 py-1.5 text-center text-[10px] text-slate-500 flex flex-wrap items-center justify-between font-mono shrink-0">
        <span className="text-slate-400">
          SEPULCHRAL LABS // TIMELINE STORYBOARD // CASE #{caseFile.caseNumber}
        </span>
        <span className="text-slate-500">
          BLOOM: <strong className="text-emerald-400 font-normal">{colorConfig.bloomColor === 'auto' ? 'Auto (Native)' : colorConfig.bloomColor}</strong> ({colorConfig.bloomIntensity}%) • LINE TYPES: <strong className="text-emerald-400 font-normal">Solid</strong> (Documented) • <strong className="text-amber-400 font-normal">Dashed</strong> (Proposed) • <strong className="text-sky-400 font-normal">Dotted Alt</strong> (Chronological)
        </span>
      </footer>
    </div>
  );
}
