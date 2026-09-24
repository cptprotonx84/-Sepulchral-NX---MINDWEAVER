/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  TerminalTheme, 
  TimelineEvent, 
  EventConnection, 
  GridConfig, 
  AutofillCategory,
  DatePrecision,
  DateType,
  EvidenceBasis,
  AutofillRelationship,
  ExtractedEventItem,
  ExtractedConnectionItem,
  ExtractedAutofillResult
} from '../types';
import { THEME_PALETTES } from './TerminalOverlay';
import { soundEngine } from './SoundEngine';
import { 
  fetchInstalledOllamaModels, 
  extractEventsWithOllama, 
  DEFAULT_OLLAMA_HOST 
} from '../services/ollamaService';
import { 
  Bot, 
  X, 
  Cpu, 
  Play, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Clock, 
  ShieldCheck, 
  Radio, 
  FileText, 
  Zap, 
  Link as LinkIcon, 
  Trash2, 
  Undo2, 
  Layers, 
  Code, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  Sparkles,
  Info,
  Server
} from 'lucide-react';

interface AiAutofillPanelProps {
  isOpen: boolean;
  onClose: () => void;
  theme: TerminalTheme;
  gridConfig: GridConfig;
  setGridConfig: React.Dispatch<React.SetStateAction<GridConfig>>;
  existingEvents: TimelineEvent[];
  existingConnections: EventConnection[];
  onPlaceEvents: (newEvents: TimelineEvent[], newConnections: EventConnection[], batchId: string) => void;
  onUndoBatch: (batchId: string) => void;
  lastImportedBatchId: string | null;
  activeFolderId: string | null;
}

// Sample incident text for quick local testing without typing from scratch
const SAMPLE_INCIDENT_TEXT = `INCIDENT REPORT: SolarFlux Infiltration Chronology
Case ID: IR-2026-0924-CORP
Source: Mandiant Threat Intelligence & Internal SecOps SIEM

CHRONOLOGY OF EVENTS:
1. 2026-09-18 03:14:02 UTC [TELEMETRY] - Initial access established via compromised VPN gateway credentials belonging to contractor account j.harlan. Origin IP: 198.51.100.44.
2. 2026-09-18 04:22:10 UTC [TELEMETRY] - Actor executed PowerShell encoded payload (mimikatz.ps1) dumping LSASS memory on domain controller DC-01. Named Actor: UNC3892.
3. 2026-09-19 11:00:00 UTC [DETECTION] - CrowdStrike Falcon sensor flagged suspicious LSASS memory read alert on DC-01. Severity: Critical.
4. 2026-09-19 11:35:00 UTC [RESPONSE] - Incident response team isolated DC-01 from network and revoked contractor j.harlan credentials.
5. 2026-09-20 [HYPOTHESIS] - Threat intelligence analysts suspect UNC3892 was acting under orders from Shadow Syndicate, though telemetry has not proven command structure.
6. 2026-09-22 14:00:00 UTC [DISCLOSURE] - Corporate communications issued SEC 8-K disclosure notifying shareholders of unauthorized lateral access.
7. UNKNOWN DATE [POLICY] - Corporate Access Control Standard AC-4 requires mandatory multi-factor authentication on all external VPN gateways.`;

// Map category to accent color & icon
export const CATEGORY_META: Record<AutofillCategory, { label: string; color: string; icon: string; bg: string; border: string }> = {
  EVENT: {
    label: 'Incident Event',
    color: '#38bdf8', // Cyan
    icon: 'Zap',
    bg: 'bg-sky-950/40',
    border: 'border-sky-500/50'
  },
  DETECTION: {
    label: 'Detection / Sensor',
    color: '#ffb000', // Amber
    icon: 'Radio',
    bg: 'bg-amber-950/40',
    border: 'border-amber-500/50'
  },
  RESPONSE: {
    label: 'Response Action',
    color: '#05ffa1', // Emerald
    icon: 'ShieldCheck',
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-500/50'
  },
  DISCLOSURE: {
    label: 'Disclosure / Public',
    color: '#fb923c', // Solar Orange
    icon: 'FileText',
    bg: 'bg-orange-950/40',
    border: 'border-orange-500/50'
  },
  POLICY: {
    label: 'Policy / Rule',
    color: '#f8fafc', // Ghost White
    icon: 'FileText',
    bg: 'bg-slate-900/60',
    border: 'border-slate-500/50'
  },
  HYPOTHESIS: {
    label: 'Hypothesis / Theory',
    color: '#c084fc', // Violet
    icon: 'AlertTriangle',
    bg: 'bg-purple-950/40',
    border: 'border-purple-500/50'
  }
};

export const AiAutofillPanel: React.FC<AiAutofillPanelProps> = ({
  isOpen,
  onClose,
  theme,
  gridConfig,
  setGridConfig,
  existingEvents,
  existingConnections,
  onPlaceEvents,
  onUndoBatch,
  lastImportedBatchId,
  activeFolderId
}) => {
  const palette = THEME_PALETTES[theme];

  // Inputs
  const [sourceText, setSourceText] = useState('');
  const [ollamaHost, setOllamaHost] = useState(DEFAULT_OLLAMA_HOST);
  const [showHostSettings, setShowHostSettings] = useState(false);
  const [installedModels, setInstalledModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [ollamaError, setOllamaError] = useState<string | null>(null);

  // Extraction State
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState<string>('');
  const [extractedResult, setExtractedResult] = useState<ExtractedAutofillResult | null>(null);
  const [rawJsonOpen, setRawJsonOpen] = useState(false);
  const [sourceViewerOpen, setSourceViewerOpen] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  // Editable preview records
  const [previewEvents, setPreviewEvents] = useState<ExtractedEventItem[]>([]);
  const [previewConnections, setPreviewConnections] = useState<ExtractedConnectionItem[]>([]);
  
  // Placement arrangement preference
  const [arrangementMode, setArrangementMode] = useState<'lanes' | 'timeline'>('lanes');

  // Abort controller ref
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initial load: probe local Ollama instance for models
  const checkOllama = async (customHost?: string) => {
    setIsLoadingModels(true);
    setOllamaStatus('checking');
    setOllamaError(null);

    try {
      const { models } = await fetchInstalledOllamaModels(customHost || ollamaHost);
      setInstalledModels(models);
      setOllamaStatus('online');
      if (models.length > 0) {
        if (!selectedModel || !models.includes(selectedModel)) {
          setSelectedModel(models[0]);
        }
      } else {
        setSelectedModel('llama3.2');
      }
    } catch (err: any) {
      setOllamaStatus('offline');
      setOllamaError(err.message || 'Cannot connect to Ollama');
      if (!selectedModel) {
        setSelectedModel('llama3.2');
      }
    } finally {
      setIsLoadingModels(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkOllama();
    }
  }, [isOpen]);

  // Handle Extraction Trigger
  const handleExtractEvents = async () => {
    if (!sourceText.trim()) {
      setExtractionError('Please paste an incident chronology or notes first.');
      return;
    }

    if (!selectedModel.trim()) {
      setExtractionError('Please select or specify a local Ollama model.');
      return;
    }

    soundEngine.playSweep(true);
    setIsExtracting(true);
    setExtractionError(null);
    setExtractionProgress('Initializing local request...');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await extractEventsWithOllama({
        text: sourceText,
        model: selectedModel,
        host: ollamaHost,
        onProgress: (msg) => setExtractionProgress(msg),
        signal: controller.signal
      });

      soundEngine.playSwitch();
      setExtractedResult(result);
      setPreviewEvents(result.events);
      setPreviewConnections(result.connections);
    } catch (err: any) {
      soundEngine.playDenied();
      setExtractionError(err.message || 'Extraction failed');
    } finally {
      setIsExtracting(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelExtraction = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsExtracting(false);
  };

  // Preview Event updates
  const handleUpdatePreviewEvent = (id: string, updates: Partial<ExtractedEventItem>) => {
    setPreviewEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const handleDeletePreviewEvent = (id: string, index: number) => {
    soundEngine.playClick();
    setPreviewEvents(prev => prev.filter(e => e.id !== id));
    // Remove or adjust connections pointing to this index
    setPreviewConnections(prev => 
      prev
        .filter(c => c.sourceIndex !== index && c.targetIndex !== index)
        .map(c => ({
          ...c,
          sourceIndex: c.sourceIndex > index ? c.sourceIndex - 1 : c.sourceIndex,
          targetIndex: c.targetIndex > index ? c.targetIndex - 1 : c.targetIndex,
        }))
    );
  };

  // Preview Connection updates
  const handleToggleConnection = (id: string) => {
    soundEngine.playClick();
    setPreviewConnections(prev => prev.filter(c => c.id !== id));
  };

  const handleChangeConnectionRel = (id: string, relationship: AutofillRelationship) => {
    setPreviewConnections(prev => prev.map(c => c.id === id ? { ...c, relationship } : c));
  };

  /**
   * Deterministic Card Placement Logic
   * Groups by category lane or timeline interval, ensuring NO cards are overwritten or falsely shifted.
   */
  const handlePlaceOnBoard = () => {
    if (previewEvents.length === 0) return;

    soundEngine.playPlacement();
    const batchId = `autofill_batch_${Date.now()}`;
    const generatedEvents: TimelineEvent[] = [];
    const generatedConnections: EventConnection[] = [];

    // Map existing occupied slots
    const occupied = new Set<string>();
    let maxGridX = 0;
    let maxGridY = 0;

    for (const evt of existingEvents) {
      occupied.add(`${evt.gridX},${evt.gridY}`);
      if (evt.gridX > maxGridX) maxGridX = evt.gridX;
      if (evt.gridY > maxGridY) maxGridY = evt.gridY;
    }

    // Determine starting anchor row or column
    const hasExisting = existingEvents.length > 0;
    const startRow = hasExisting ? maxGridY + 1 : 0;

    // Lane definitions for Category-based grouping
    const CATEGORY_LANES: Record<AutofillCategory, number> = {
      EVENT: 0,
      DETECTION: 1,
      RESPONSE: 2,
      DISCLOSURE: 3,
      POLICY: 4,
      HYPOTHESIS: 5
    };

    // Track column placement per lane to prevent overlap
    const laneColTrackers: Record<number, number> = {};

    let placedHighestX = maxGridX;
    let placedHighestY = maxGridY;

    // Helper to find next non-occupied cell
    const getNextSlot = (targetX: number, targetY: number): { x: number; y: number } => {
      let x = targetX;
      let y = targetY;
      while (occupied.has(`${x},${y}`)) {
        x += 1;
      }
      occupied.add(`${x},${y}`);
      return { x, y };
    };

    const eventIdMap: Record<number, string> = {};

    // Sort events deterministically: Known dates first, then unknown/hypothesized
    const sortedIndexedEvents = previewEvents.map((evt, idx) => ({ evt, originalIdx: idx }));
    sortedIndexedEvents.sort((a, b) => {
      if (a.evt.date !== 'UNKNOWN' && b.evt.date !== 'UNKNOWN') {
        return a.evt.date.localeCompare(b.evt.date);
      }
      if (a.evt.date !== 'UNKNOWN') return -1;
      if (b.evt.date !== 'UNKNOWN') return 1;
      return a.originalIdx - b.originalIdx;
    });

    sortedIndexedEvents.forEach(({ evt, originalIdx }) => {
      let col = 0;
      let row = startRow;

      if (arrangementMode === 'lanes') {
        const laneOffset = CATEGORY_LANES[evt.category] || 0;
        row = startRow + laneOffset;
        col = laneColTrackers[row] || 0;
        
        const slot = getNextSlot(col, row);
        col = slot.x;
        row = slot.y;
        laneColTrackers[row] = col + 1;
      } else {
        // Timeline sequential placement
        const lastCol = placedHighestX + 1;
        const slot = getNextSlot(lastCol, startRow);
        col = slot.x;
        row = slot.y;
      }

      if (col > placedHighestX) placedHighestX = col;
      if (row > placedHighestY) placedHighestY = row;

      const meta = CATEGORY_META[evt.category];
      const newId = `evt_${Date.now()}_${originalIdx}`;
      eventIdMap[originalIdx] = newId;

      // Status derivation
      let mappedStatus: TimelineEvent['status'] = 'unverified';
      if (evt.evidenceBasis === 'TELEMETRY' || evt.category === 'RESPONSE') {
        mappedStatus = 'confirmed';
      } else if (evt.category === 'DETECTION') {
        mappedStatus = 'critical';
      } else if (evt.category === 'HYPOTHESIS' || evt.category === 'DISCLOSURE') {
        mappedStatus = 'lead';
      }

      const timelineEvt: TimelineEvent = {
        id: newId,
        title: evt.title,
        time: evt.date !== 'UNKNOWN' ? evt.date : `[UNKNOWN - ${evt.dateType}]`,
        description: `${evt.description}\n\n[Forensic Metadata]\n• Category: ${evt.category}\n• Evidence Basis: ${evt.evidenceBasis}${evt.claimAttribution ? `\n• Claim Attribution: ${evt.claimAttribution}` : ''}${evt.namedActors.length ? `\n• Actors: ${evt.namedActors.join(', ')}` : ''}${evt.organizations.length ? `\n• Organizations: ${evt.organizations.join(', ')}` : ''}${evt.sourceReferences.length ? `\n• Sources: ${evt.sourceReferences.join(', ')}` : ''}`,
        icon: meta.icon,
        color: meta.color,
        status: mappedStatus,
        gridX: col,
        gridY: row,
        tags: [
          evt.category,
          evt.evidenceBasis,
          evt.datePrecision,
          ...evt.namedActors.map(a => `actor:${a.toLowerCase().replace(/\s+/g, '-')}`),
          ...evt.organizations.map(o => `org:${o.toLowerCase().replace(/\s+/g, '-')}`)
        ],
        location: evt.sourceReferences[0] || undefined,
        folderId: activeFolderId || undefined,
        sourceExcerpt: sourceText,
        importBatchId: batchId,
        categoryType: evt.category
      };

      generatedEvents.push(timelineEvt);
    });

    // Generate connections
    previewConnections.forEach((conn, cIdx) => {
      const sourceId = eventIdMap[conn.sourceIndex];
      const targetId = eventIdMap[conn.targetIndex];

      if (sourceId && targetId && sourceId !== targetId) {
        let evidenceType: 'documented' | 'proposed' | 'chronological' = 'documented';
        if (conn.relationship === 'CHRONOLOGICAL') {
          evidenceType = 'chronological';
        } else if (conn.relationship === 'HYPOTHESIZED') {
          evidenceType = 'proposed';
        }

        generatedConnections.push({
          id: `conn_${Date.now()}_${cIdx}`,
          fromId: sourceId,
          toId: targetId,
          label: conn.label || 'Relates to',
          evidenceType,
          bidirectional: false
        });
      }
    });

    // Ensure grid expands if needed to display all placed cards comfortably
    const neededColumns = Math.max(gridConfig.columns, placedHighestX + 2);
    const neededRows = Math.max(gridConfig.rows, placedHighestY + 2);
    if (neededColumns > gridConfig.columns || neededRows > gridConfig.rows) {
      setGridConfig(prev => ({
        ...prev,
        columns: Math.max(prev.columns, neededColumns),
        rows: Math.max(prev.rows, neededRows)
      }));
    }

    // Call state handler in App.tsx
    onPlaceEvents(generatedEvents, generatedConnections, batchId);
  };

  const handleResetPreview = () => {
    soundEngine.playClick();
    setExtractedResult(null);
    setPreviewEvents([]);
    setPreviewConnections([]);
    setExtractionError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] md:w-[560px] bg-[#090d12]/95 backdrop-blur-md border-l border-emerald-500/40 shadow-2xl flex flex-col font-mono text-slate-300 animate-slide-left">
      {/* Top Cyber Reticle Header */}
      <div 
        className="px-4 py-3 border-b bg-black/80 flex items-center justify-between shrink-0"
        style={{ borderBottomColor: palette.primary + '40' }}
      >
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded border border-emerald-400/40 bg-emerald-950/40 text-emerald-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                LOCAL AI AUTOFILL // OLLAMA
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                100% LOCAL
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Extract incident chronologies & forensic links via local LLM
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="p-1.5 rounded border border-slate-800 hover:border-slate-600 bg-slate-900/60 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Close Panel [ESC]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        
        {/* SECTION 1: LOCAL OLLAMA CONNECTION & MODEL SELECTOR */}
        <div className="bg-black/60 p-3 rounded-lg border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center">
              <Cpu className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              LOCAL RUNTIME ENGINE:
            </span>

            {/* Ollama status badge */}
            <div className="flex items-center space-x-1.5">
              {isLoadingModels ? (
                <span className="text-[10px] text-amber-400 flex items-center">
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  PROBING OLLAMA...
                </span>
              ) : ollamaStatus === 'online' ? (
                <span className="text-[10px] text-emerald-400 font-bold flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 shadow-[0_0_6px_#05ffa1]" />
                  ONLINE ({installedModels.length} models)
                </span>
              ) : (
                <span className="text-[10px] text-rose-400 font-bold flex items-center">
                  <span className="w-2 h-2 rounded-full bg-rose-500 mr-1.5" />
                  OFFLINE / UNREACHABLE
                </span>
              )}

              <button
                onClick={() => checkOllama()}
                disabled={isLoadingModels}
                className="p-1 hover:text-white text-slate-400 rounded hover:bg-slate-800"
                title="Refresh Installed Models"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingModels ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Model picker row */}
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              {installedModels.length > 0 ? (
                <select
                  value={selectedModel}
                  onChange={(e) => {
                    soundEngine.playSwitch();
                    setSelectedModel(e.target.value);
                  }}
                  className="w-full bg-[#0a0f14] border border-slate-800 focus:border-emerald-400 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
                >
                  {installedModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  placeholder="e.g. llama3.2, mistral, qwen2.5"
                  className="w-full bg-[#0a0f14] border border-slate-800 focus:border-emerald-400 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none font-mono"
                />
              )}
            </div>

            <button
              onClick={() => setShowHostSettings(!showHostSettings)}
              className={`p-1.5 rounded border text-xs cursor-pointer ${
                showHostSettings 
                  ? 'border-emerald-400 bg-emerald-950/40 text-emerald-300' 
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
              title="Ollama Host Configuration"
            >
              <Server className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Host Endpoint Config (Collapsible) */}
          {showHostSettings && (
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800 space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-bold block">
                OLLAMA HOST URL:
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={ollamaHost}
                  onChange={(e) => setOllamaHost(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="flex-1 bg-black border border-slate-800 focus:border-emerald-400 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                />
                <button
                  onClick={() => checkOllama(ollamaHost)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-bold"
                >
                  Test
                </button>
              </div>
              <p className="text-[9px] text-slate-500">
                Default: http://localhost:11434 (Stream: false, JSON Schema format, Temp: 0.1)
              </p>
            </div>
          )}

          {/* Offline Diagnostic Alert */}
          {ollamaStatus === 'offline' && (
            <div className="p-3 bg-rose-950/30 border border-rose-500/40 rounded text-rose-300 text-[11px] space-y-1.5 leading-relaxed">
              <div className="flex items-center space-x-1.5 font-bold text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Ollama is not reachable at {ollamaHost}</span>
              </div>
              <p className="text-slate-400 text-[10px]">
                To use local AI extraction without sending data to external servers:
              </p>
              <ol className="list-decimal list-inside text-[10px] text-slate-300 space-y-0.5">
                <li>Install Ollama from <strong className="text-white">ollama.com</strong></li>
                <li>Launch Ollama or run <code className="bg-black px-1 rounded text-emerald-400">ollama serve</code> in terminal</li>
                <li>Pull a model: <code className="bg-black px-1 rounded text-emerald-400">ollama pull llama3.2</code> (or mistral, qwen2.5)</li>
                <li>If using strict browser origins: <code className="bg-black px-1 rounded text-amber-400">OLLAMA_ORIGINS="*" ollama serve</code></li>
              </ol>
            </div>
          )}
        </div>

        {/* SECTION 2: INPUT TEXTAREA */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center">
              <FileText className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              INCIDENT CHRONOLOGY / REPORT EXCERPT:
            </label>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  soundEngine.playSwitch();
                  setSourceText(SAMPLE_INCIDENT_TEXT);
                }}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
              >
                Paste Sample Report
              </button>
              {sourceText && (
                <button
                  onClick={() => setSourceText('')}
                  className="text-[10px] text-slate-500 hover:text-rose-400"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            rows={7}
            placeholder="Paste raw telemetry logs, incident report chronologies, security advisories, or CISA alerts here...&#10;&#10;The local model will strictly categorize EVENT, DETECTION, RESPONSE, DISCLOSURE, POLICY, and HYPOTHESIS without hallucinating dates or links."
            className="w-full bg-[#070b0f] border border-slate-800 focus:border-emerald-400 rounded-lg p-3 text-xs leading-relaxed text-slate-200 font-mono focus:outline-none resize-y placeholder:text-slate-600 shadow-inner"
          />

          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>{sourceText.length} characters</span>
            <span className="text-emerald-500/80">Never sent to cloud or external APIs</span>
          </div>
        </div>

        {/* SECTION 3: EXTRACTION TRIGGER BUTTON & PROGRESS */}
        <div className="space-y-2">
          {!isExtracting ? (
            <button
              onClick={handleExtractEvents}
              disabled={!sourceText.trim()}
              className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg ${
                sourceText.trim()
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Extract Events with Local Ollama</span>
            </button>
          ) : (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-400 font-bold flex items-center">
                  <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin text-emerald-400" />
                  {extractionProgress || 'Running local extraction...'}
                </span>
                <button
                  onClick={handleCancelExtraction}
                  className="px-2 py-0.5 rounded border border-rose-500/40 bg-rose-950/40 text-rose-300 text-[10px] hover:text-white"
                >
                  Cancel
                </button>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full w-2/3 animate-pulse" />
              </div>
            </div>
          )}

          {extractionError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded text-rose-300 text-xs flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-rose-300">Extraction Failed</div>
                <div className="text-[11px] text-rose-200/90 whitespace-pre-wrap">{extractionError}</div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: EDITABLE PREVIEW OF EXTRACTED EVENTS & CONNECTIONS */}
        {extractedResult && (
          <div className="space-y-4 pt-2 border-t border-slate-800">
            {/* Preview Summary Bar */}
            <div className="flex items-center justify-between bg-black/60 p-2.5 rounded-lg border border-slate-800">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white text-xs">
                  EXTRACTED PREVIEW: {previewEvents.length} Events • {previewConnections.length} Links
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setRawJsonOpen(!rawJsonOpen)}
                  className="text-[10px] text-slate-400 hover:text-emerald-400 flex items-center space-x-1"
                  title="Inspect raw model JSON response"
                >
                  <Code className="w-3 h-3" />
                  <span>{rawJsonOpen ? 'Hide JSON' : 'Raw JSON'}</span>
                </button>
                <button
                  onClick={handleResetPreview}
                  className="text-[10px] text-slate-500 hover:text-rose-400"
                  title="Discard preview"
                >
                  Discard
                </button>
              </div>
            </div>

            {/* Raw JSON Debugging Drawer */}
            {rawJsonOpen && extractedResult.rawResponse && (
              <div className="p-2.5 bg-black rounded border border-slate-800 max-h-48 overflow-y-auto text-[10px] font-mono text-emerald-300/90">
                <div className="text-slate-500 mb-1">Model: {extractedResult.modelUsed} • Schema Validated with Zod</div>
                <pre className="whitespace-pre-wrap">{extractedResult.rawResponse}</pre>
              </div>
            )}

            {/* Extracted Events List */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                EXTRACTED EVENT CARDS (REVIEW & EDIT):
              </span>

              {previewEvents.map((evt, idx) => {
                const meta = CATEGORY_META[evt.category];
                const isDateUnknown = evt.date === 'UNKNOWN' || evt.datePrecision === 'UNKNOWN';
                const hasAmbiguousActors = evt.namedActors.length === 0 && evt.organizations.length === 0;

                return (
                  <div 
                    key={evt.id} 
                    className={`p-3 rounded-lg border bg-slate-950/80 space-y-2 transition-all ${meta.border}`}
                  >
                    {/* Event Header: Category, Index, Delete */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span 
                          className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-black flex items-center space-x-1"
                          style={{ backgroundColor: meta.color }}
                        >
                          <span>{meta.label}</span>
                        </span>

                        <span className="text-[10px] text-slate-500 font-mono">
                          #{idx + 1}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        {/* Warning Badges */}
                        {isDateUnknown && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 font-bold">
                            MISSING DATE
                          </span>
                        )}
                        {hasAmbiguousActors && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                            UNNAMED ACTOR
                          </span>
                        )}
                        {evt.evidenceBasis === 'REPORT_CLAIM' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-950/60 border border-sky-500/40 text-sky-300">
                            CLAIM
                          </span>
                        )}
                        {evt.category === 'HYPOTHESIS' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-500/40 text-purple-300">
                            THEORY
                          </span>
                        )}

                        <button
                          onClick={() => handleDeletePreviewEvent(evt.id, idx)}
                          className="p-1 hover:text-rose-400 text-slate-500 ml-1"
                          title="Exclude this event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Editable Title */}
                    <div>
                      <input
                        type="text"
                        value={evt.title}
                        onChange={(e) => handleUpdatePreviewEvent(evt.id, { title: e.target.value })}
                        className="w-full bg-[#0a0f14] border border-slate-800 focus:border-emerald-400 rounded px-2 py-1 text-xs text-white font-bold focus:outline-none"
                        placeholder="Event Title"
                      />
                    </div>

                    {/* Date & Date Type */}
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <label className="text-slate-500 uppercase block mb-0.5">DATE / TIME:</label>
                        <input
                          type="text"
                          value={evt.date}
                          onChange={(e) => handleUpdatePreviewEvent(evt.id, { date: e.target.value })}
                          className={`w-full bg-[#0a0f14] border rounded px-2 py-1 text-xs focus:outline-none ${
                            isDateUnknown ? 'border-amber-500/50 text-amber-300' : 'border-slate-800 text-slate-200'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="text-slate-500 uppercase block mb-0.5">DATE TYPE:</label>
                        <select
                          value={evt.dateType}
                          onChange={(e) => handleUpdatePreviewEvent(evt.id, { dateType: e.target.value as DateType })}
                          className="w-full bg-[#0a0f14] border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
                        >
                          <option value="INCIDENT">INCIDENT (Occurred)</option>
                          <option value="DISCOVERY">DISCOVERY (Found)</option>
                          <option value="DISCLOSURE">DISCLOSURE (Public)</option>
                          <option value="UNKNOWN">UNKNOWN</option>
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <textarea
                        value={evt.description}
                        onChange={(e) => handleUpdatePreviewEvent(evt.id, { description: e.target.value })}
                        rows={2}
                        className="w-full bg-[#070b0f] border border-slate-800 focus:border-emerald-400 rounded p-2 text-[11px] text-slate-300 focus:outline-none resize-none"
                      />
                    </div>

                    {/* Actors / Organizations / Sources metadata tags */}
                    <div className="flex flex-wrap gap-1 pt-1 text-[9px]">
                      {evt.namedActors.map(actor => (
                        <span key={actor} className="bg-sky-950/60 border border-sky-800 text-sky-300 px-1.5 py-0.2 rounded">
                          Actor: {actor}
                        </span>
                      ))}
                      {evt.organizations.map(org => (
                        <span key={org} className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 px-1.5 py-0.2 rounded">
                          Org: {org}
                        </span>
                      ))}
                      {evt.sourceReferences.map(src => (
                        <span key={src} className="bg-slate-900 border border-slate-700 text-slate-400 px-1.5 py-0.2 rounded">
                          Ref: {src}
                        </span>
                      ))}
                      {evt.claimAttribution && (
                        <span className="bg-amber-950/60 border border-amber-800 text-amber-300 px-1.5 py-0.2 rounded">
                          Claimant: {evt.claimAttribution}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Extracted Connections List */}
            {previewConnections.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  PROPOSED WIRE CONNECTIONS:
                </span>

                <div className="space-y-1.5">
                  {previewConnections.map((conn) => {
                    const srcEvt = previewEvents[conn.sourceIndex];
                    const tgtEvt = previewEvents[conn.targetIndex];

                    return (
                      <div 
                        key={conn.id}
                        className="p-2 rounded bg-black/80 border border-slate-800 flex items-center justify-between text-[11px]"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <LinkIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-bold text-white truncate max-w-[120px]">
                            {srcEvt ? srcEvt.title : `Event #${conn.sourceIndex + 1}`}
                          </span>
                          <span className="text-slate-500">➔</span>
                          <span className="font-bold text-white truncate max-w-[120px]">
                            {tgtEvt ? tgtEvt.title : `Event #${conn.targetIndex + 1}`}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <select
                            value={conn.relationship}
                            onChange={(e) => handleChangeConnectionRel(conn.id, e.target.value as AutofillRelationship)}
                            className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none"
                          >
                            <option value="DOCUMENTED">Documented (Solid)</option>
                            <option value="CHRONOLOGICAL">Chronological (Dotted)</option>
                            <option value="HYPOTHESIZED">Hypothesized (Dashed)</option>
                          </select>

                          <button
                            onClick={() => handleToggleConnection(conn.id)}
                            className="p-1 text-slate-500 hover:text-rose-400"
                            title="Remove connection"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Placement Layout Preferences */}
            <div className="p-3 bg-black/60 rounded-lg border border-slate-800 space-y-2">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                DETERMINISTIC BOARD ARRANGEMENT:
              </label>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setArrangementMode('lanes')}
                  className={`p-2 rounded border text-left cursor-pointer transition-colors ${
                    arrangementMode === 'lanes'
                      ? 'border-emerald-400 bg-emerald-950/50 text-white font-bold'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 mb-1">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Category Lanes</span>
                  </div>
                  <p className="text-[9px] text-slate-500">
                    Groups events by functional role (Event, Detection, Response, etc.)
                  </p>
                </button>

                <button
                  onClick={() => setArrangementMode('timeline')}
                  className={`p-2 rounded border text-left cursor-pointer transition-colors ${
                    arrangementMode === 'timeline'
                      ? 'border-emerald-400 bg-emerald-950/50 text-white font-bold'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span>Time Progression</span>
                  </div>
                  <p className="text-[9px] text-slate-500">
                    Places events left-to-right along chronological intervals
                  </p>
                </button>
              </div>

              <div className="text-[9px] text-slate-500 flex items-center space-x-1">
                <Info className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Deterministic placement never modifies, shifts, or overwrites existing cards.</span>
              </div>
            </div>

            {/* BOTTOM ACTION BAR: PLACE ON BOARD / CANCEL / UNDO */}
            <div className="p-3 bg-black/90 border border-emerald-500/40 rounded-lg space-y-2 shrink-0">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePlaceOnBoard}
                  className="flex-1 py-2.5 px-4 rounded font-bold text-xs uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4 fill-current" />
                  <span>Place {previewEvents.length} Cards on Board</span>
                </button>

                <button
                  onClick={handleResetPreview}
                  className="py-2.5 px-3 rounded font-bold text-xs uppercase border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {lastImportedBatchId && (
                <button
                  onClick={() => onUndoBatch(lastImportedBatchId)}
                  className="w-full py-1.5 rounded border border-amber-500/30 bg-amber-950/30 hover:bg-amber-950/60 text-amber-300 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  title="Undo last imported batch"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Undo Last AI Import</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-3 border-t border-slate-900 bg-black/90 text-[10px] text-slate-500 flex items-center justify-between shrink-0 font-mono">
        <span>OLLAMA LOCAL FORENSICS</span>
        <span>NO EXTERNAL TRANSMISSION</span>
      </div>
    </div>
  );
};
