/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  TimelineEvent, 
  EventConnection, 
  GridConfig, 
  TerminalTheme,
  ToolMode,
  ColorGradingConfig,
  ProjectFolder,
  NUMBER_KEY_COLORS,
  getNumberKeyColor,
  getStartingNodes
} from '../types';
import { THEME_PALETTES } from './TerminalOverlay';
import { renderEventIcon } from './iconRegistry';
import { soundEngine } from './SoundEngine';
import { 
  Plus, 
  Link as LinkIcon, 
  Clock, 
  MapPin, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Trash2,
  Move,
  Folder,
  Mouse,
  Undo2,
  Redo2
} from 'lucide-react';

interface EventGridCanvasProps {
  theme: TerminalTheme;
  gridConfig: GridConfig;
  colorConfig: ColorGradingConfig;
  events: TimelineEvent[];
  connections: EventConnection[];
  activeTool: ToolMode;
  selectedIconToPlace: string;
  searchQuery: string;
  statusFilter: string;
  activeFolderId?: string | null;
  folders?: ProjectFolder[];
  onSelectEvent: (event: TimelineEvent) => void;
  onSelectConnection: (conn: EventConnection) => void;
  onMoveEvent: (eventId: string, newGridX: number, newGridY: number) => void;
  onPlaceEvent: (gridX: number, gridY: number, iconName: string) => void;
  onAddConnection: (fromId: string, toId: string) => void;
  onDeleteEvent: (eventId: string) => void;
  onDeleteConnection: (connId: string) => void;
  wheelZoomEnabled?: boolean;
  onToggleWheelZoom?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  undoCount?: number;
  redoCount?: number;
  onUndo?: () => void;
  onRedo?: () => void;
  onOpenClearModal?: () => void;
}

export const EventGridCanvas: React.FC<EventGridCanvasProps> = ({
  theme,
  gridConfig,
  colorConfig,
  events,
  connections,
  activeTool,
  selectedIconToPlace,
  searchQuery,
  statusFilter,
  activeFolderId,
  folders,
  onSelectEvent,
  onSelectConnection,
  onMoveEvent,
  onPlaceEvent,
  onAddConnection,
  onDeleteEvent,
  onDeleteConnection,
  wheelZoomEnabled: externalWheelZoomEnabled,
  onToggleWheelZoom,
  canUndo = false,
  canRedo = false,
  undoCount = 0,
  redoCount = 0,
  onUndo,
  onRedo,
  onOpenClearModal
}) => {
  const palette = THEME_PALETTES[theme];
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom & Pan navigation state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hasMovedPan, setHasMovedPan] = useState(false);

  // Direct synchronization refs to avoid React render delay or lost mouseup events
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panRef = useRef<{ x: number; y: number }>(pan);
  panRef.current = pan;

  // Dragging event node state
  const [draggingEventId, setDraggingEventId] = useState<string | null>(null);
  const [dragHoverCell, setDragHoverCell] = useState<{ x: number; y: number } | null>(null);

  // Wire connecting state (dragging connector line)
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [connectionDragPos, setConnectionDragPos] = useState<{ x: number; y: number } | null>(null);

  // Mouse Right Click Pull & Push Zoom state
  const [isRightClickZooming, setIsRightClickZooming] = useState(false);
  const [rightClickHUDPos, setRightClickHUDPos] = useState<{ x: number; y: number } | null>(null);
  const [zoomDirection, setZoomDirection] = useState<'neutral' | 'in' | 'out'>('neutral');

  const rightClickZoomRef = useRef<{
    startX: number;
    startY: number;
    startZoom: number;
    startPan: { x: number; y: number };
    cursorX: number;
    cursorY: number;
    worldX: number;
    worldY: number;
    hasMoved: boolean;
  } | null>(null);

  // Hovered cell in place mode
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);

  // Quick Center on Starting Nodes (Keys 1-0) state
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
  const [centerToast, setCenterToast] = useState<{ key: string; slot: number; title: string; color: string; time: string; colorName: string } | null>(null);
  const [isSmoothCentering, setIsSmoothCentering] = useState(false);

  // Compute starting nodes list (up to 10 nodes for keys 1-0)
  const startingNodes = useMemo(() => {
    return getStartingNodes(events, connections);
  }, [events, connections]);

  // Center canvas directly on an event node
  const centerOnEvent = useCallback((targetEvent: TimelineEvent, keyLabel?: string, slotNumber?: number) => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    const nodeCenterX = 50 + targetEvent.gridX * (CELL_WIDTH + GAP) + CELL_WIDTH / 2;
    const nodeCenterY = 40 + targetEvent.gridY * (CELL_HEIGHT + GAP) + CELL_HEIGHT / 2;

    const targetZoom = Math.min(Math.max(zoom, 0.95), 1.35);
    setZoom(targetZoom);

    const targetPanX = containerWidth / 2 - nodeCenterX * targetZoom;
    const targetPanY = containerHeight / 2 - nodeCenterY * targetZoom;

    setIsSmoothCentering(true);
    setPan({ x: targetPanX, y: targetPanY });
    setHighlightedEventId(targetEvent.id);
    soundEngine.playSwitch();

    if (keyLabel && slotNumber !== undefined) {
      const keyItem = NUMBER_KEY_COLORS[slotNumber - 1];
      const color = targetEvent.color || keyItem?.hex || getNumberKeyColor(slotNumber - 1);
      setCenterToast({
        key: keyLabel,
        slot: slotNumber,
        title: targetEvent.title,
        color,
        time: targetEvent.time,
        colorName: keyItem?.name || 'Defined Color'
      });
      setTimeout(() => setCenterToast(null), 2000);
    }

    setTimeout(() => {
      setIsSmoothCentering(false);
    }, 450);

    setTimeout(() => {
      setHighlightedEventId(null);
    }, 1800);
  }, [zoom]);

  // Global Keyboard Shortcuts for Number Keys 1-9 and 0
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Never intercept when user is typing into text fields or textareas
      const activeEl = document.activeElement;
      if (
        activeEl && 
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      // Do not conflict with browser shortcuts (Ctrl, Alt, Meta)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const keyIndexMap: Record<string, number> = {
        '1': 0,
        '2': 1,
        '3': 2,
        '4': 3,
        '5': 4,
        '6': 5,
        '7': 6,
        '8': 7,
        '9': 8,
        '0': 9,
      };

      if (e.key in keyIndexMap) {
        const slotIdx = keyIndexMap[e.key];
        const targetNode = startingNodes[slotIdx];
        if (targetNode) {
          e.preventDefault();
          centerOnEvent(targetNode, e.key, slotIdx + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startingNodes, centerOnEvent]);

  // Cell dimensions in pixels
  const CELL_WIDTH = 190;
  const CELL_HEIGHT = 140;
  const GAP = 12;

  // Total canvas dimensions
  const totalWidth = gridConfig.columns * (CELL_WIDTH + GAP) + 80;
  const totalHeight = gridConfig.rows * (CELL_HEIGHT + GAP) + 80;

  // Filtered events
  const isEventMatching = (evt: TimelineEvent) => {
    if (activeFolderId && evt.folderId && evt.folderId !== activeFolderId) return false;
    if (statusFilter !== 'all' && evt.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      evt.title.toLowerCase().includes(q) ||
      evt.description.toLowerCase().includes(q) ||
      evt.time.toLowerCase().includes(q) ||
      (evt.location && evt.location.toLowerCase().includes(q)) ||
      (evt.suspectRef && evt.suspectRef.toLowerCase().includes(q)) ||
      evt.tags.some(t => t.toLowerCase().includes(q))
    );
  };

  // Convert grid coordinates to pixel centers
  const getEventCenter = (gridX: number, gridY: number) => {
    const x = 50 + gridX * (CELL_WIDTH + GAP) + CELL_WIDTH / 2;
    const y = 40 + gridY * (CELL_HEIGHT + GAP) + CELL_HEIGHT / 2;
    return { x, y };
  };

  // Fallback internal wheel zoom state if not controlled externally
  const [internalWheelZoom, setInternalWheelZoom] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sepulchral_nx_wheel_zoom_enabled');
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return true;
  });

  const wheelZoomEnabled = externalWheelZoomEnabled !== undefined ? externalWheelZoomEnabled : internalWheelZoom;

  const handleToggleWheelZoomInternal = () => {
    soundEngine.playSwitch();
    if (onToggleWheelZoom) {
      onToggleWheelZoom();
    } else {
      setInternalWheelZoom(prev => {
        const next = !prev;
        try {
          localStorage.setItem('sepulchral_nx_wheel_zoom_enabled', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }
  };

  // Mouse wheel zoom in/out with cursor anchoring (controlled via toggle option button)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Prevent browser default page scroll
      e.preventDefault();

      if (!wheelZoomEnabled) {
        return;
      }

      // Smooth cursor-anchored zoom
      const rect = el.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      const worldX = (cursorX - pan.x) / zoom;
      const worldY = (cursorY - pan.y) / zoom;

      // Delta: e.deltaY < 0 is Zoom In, e.deltaY > 0 is Zoom Out
      const zoomFactor = e.deltaY < 0 ? 1.09 : 0.91;
      const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.40), 2.50);

      // Keep world point anchored under cursor
      const newPanX = cursorX - worldX * newZoom;
      const newPanY = cursorY - worldY * newZoom;

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [wheelZoomEnabled, zoom, pan.x, pan.y]);

  // Board dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // 1. Right click (button === 2): Push and Pull to Zoom In & Out
    if (e.button === 2) {
      e.preventDefault();
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      const worldX = (cursorX - pan.x) / zoom;
      const worldY = (cursorY - pan.y) / zoom;

      rightClickZoomRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startZoom: zoom,
        startPan: { ...pan },
        cursorX,
        cursorY,
        worldX,
        worldY,
        hasMoved: false
      };

      setIsRightClickZooming(true);
      setZoomDirection('neutral');
      setRightClickHUDPos({ x: e.clientX, y: e.clientY });
      return;
    }

    // 2. Pan mode, Middle click, Alt+click, or in Select mode clicking board surface/background
    if (e.button === 1 || (e.button === 0 && (activeTool === 'pan' || e.altKey || activeTool === 'select'))) {
      const target = e.target as HTMLElement;
      // Do not initiate board panning if the user clicked an interactive control or button
      if (target.closest('button') || target.closest('input') || target.closest('textarea')) {
        return;
      }
      isPanningRef.current = true;
      setIsPanning(true);
      setHasMovedPan(false);
      const start = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      panStartRef.current = start;
      setPanStart(start);
    }
  };

  // Global window tracking for Right Click Pull & Push Zoom
  useEffect(() => {
    if (!isRightClickZooming) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const state = rightClickZoomRef.current;
      if (!state) return;

      // Pull & Push logic:
      // Pushing mouse forward/upwards: e.clientY < state.startY => dy > 0 => Zoom In
      // Pulling mouse backward/downwards: e.clientY > state.startY => dy < 0 => Zoom Out
      const dy = state.startY - e.clientY;
      const dx = e.clientX - state.startX;
      // Primary vertical motion with slight horizontal diagonal gesture support
      const delta = dy + dx * 0.25;

      if (Math.abs(delta) > 3) {
        state.hasMoved = true;
      }

      // Smooth multiplicative zoom scaling
      const zoomFactor = Math.pow(2, delta * 0.0055);
      const newZoom = Math.min(Math.max(state.startZoom * zoomFactor, 0.40), 2.50);

      // Keep world point anchored under cursor
      const newPanX = state.cursorX - state.worldX * newZoom;
      const newPanY = state.cursorY - state.worldY * newZoom;

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });

      if (delta > 5) {
        setZoomDirection('in');
      } else if (delta < -5) {
        setZoomDirection('out');
      } else {
        setZoomDirection('neutral');
      }
    };

    const handleWindowMouseUp = (e: MouseEvent) => {
      if (e.button === 2 || rightClickZoomRef.current) {
        const state = rightClickZoomRef.current;
        if (state?.hasMoved) {
          soundEngine.playClick();
          setHasMovedPan(true);
          setTimeout(() => setHasMovedPan(false), 120);
        }
        rightClickZoomRef.current = null;
        setIsRightClickZooming(false);
        setZoomDirection('neutral');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isRightClickZooming]);

  // Permanent global window tracking for Board Grab / Panning:
  // Guarantees grab is released as soon as mouse button is lifted anywhere
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!isPanningRef.current) return;
      // If mouse button was released outside the window or without a mouseup event
      if (e.buttons === 0) {
        isPanningRef.current = false;
        setIsPanning(false);
        return;
      }
      const newX = e.clientX - panStartRef.current.x;
      const newY = e.clientY - panStartRef.current.y;
      if (Math.abs(newX - panRef.current.x) > 3 || Math.abs(newY - panRef.current.y) > 3) {
        setHasMovedPan(true);
      }
      setPan({ x: newX, y: newY });
    };

    const handleRelease = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        setIsPanning(false);
        setTimeout(() => setHasMovedPan(false), 80);
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleRelease);
    window.addEventListener('pointerup', handleRelease);
    window.addEventListener('blur', handleRelease);
    window.addEventListener('dragend', handleRelease);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleRelease);
      window.removeEventListener('pointerup', handleRelease);
      window.removeEventListener('blur', handleRelease);
      window.removeEventListener('dragend', handleRelease);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (connectingSourceId && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - pan.x) / zoom;
      const rawY = (e.clientY - rect.top - pan.y) / zoom;
      setConnectionDragPos({ x: rawX, y: rawY });
    }
  };

  const handleMouseUp = () => {
    isPanningRef.current = false;
    setIsPanning(false);
    if (connectingSourceId) {
      setConnectingSourceId(null);
      setConnectionDragPos(null);
    }
  };

  // Touch handlers for mobile / tablet drag navigation
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStartRef.current = { x: t.clientX - pan.x, y: t.clientY - pan.y };
      isPanningRef.current = true;
      setIsPanning(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPanning && touchStartRef.current && e.touches.length === 1) {
      const t = e.touches[0];
      setPan({
        x: t.clientX - touchStartRef.current.x,
        y: t.clientY - touchStartRef.current.y
      });
    }
  };

  const handleTouchEnd = () => {
    isPanningRef.current = false;
    setIsPanning(false);
    touchStartRef.current = null;
  };

  // Click on empty cell
  const handleCellClick = (colIdx: number, rowIdx: number) => {
    isPanningRef.current = false;
    setIsPanning(false);
    // If user was dragging/panning the board, do not place or trigger click
    if (hasMovedPan) return;

    const existing = events.find(e => e.gridX === colIdx && e.gridY === rowIdx);
    if (existing) return;

    if (activeTool === 'place') {
      soundEngine.playSwitch();
      onPlaceEvent(colIdx, rowIdx, selectedIconToPlace);
    }
  };

  // Handle click on an event card
  const handleEventClick = (e: React.MouseEvent, evt: TimelineEvent) => {
    e.stopPropagation();
    isPanningRef.current = false;
    setIsPanning(false);
    if (hasMovedPan) return;

    if (activeTool === 'erase') {
      soundEngine.playSweep(false);
      onDeleteEvent(evt.id);
      return;
    }

    if (activeTool === 'connect') {
      if (!connectingSourceId) {
        soundEngine.playClick();
        setConnectingSourceId(evt.id);
      } else if (connectingSourceId !== evt.id) {
        soundEngine.playSweep(true);
        onAddConnection(connectingSourceId, evt.id);
        setConnectingSourceId(null);
        setConnectionDragPos(null);
      } else {
        setConnectingSourceId(null);
      }
      return;
    }

    // Default select / inspect mode: open the popup detail description box
    soundEngine.playClick();
    onSelectEvent(evt);
  };

  // Drag-and-drop event movement across the grid
  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    isPanningRef.current = false;
    setIsPanning(false);
    e.dataTransfer.setData('text/plain', eventId);
    setDraggingEventId(eventId);
  };

  const handleDragOverCell = (e: React.DragEvent, colIdx: number, rowIdx: number) => {
    e.preventDefault();
    if (dragHoverCell?.x !== colIdx || dragHoverCell?.y !== rowIdx) {
      setDragHoverCell({ x: colIdx, y: rowIdx });
    }
  };

  const handleDropOnCell = (e: React.DragEvent, colIdx: number, rowIdx: number) => {
    e.preventDefault();
    isPanningRef.current = false;
    setIsPanning(false);
    const eventId = e.dataTransfer.getData('text/plain') || draggingEventId;
    if (eventId) {
      soundEngine.playClick();
      onMoveEvent(eventId, colIdx, rowIdx);
    }
    setDraggingEventId(null);
    setDragHoverCell(null);
  };

  // Start dragging connection wire from node handle
  const handleStartWireDrag = (e: React.MouseEvent, sourceId: string) => {
    e.stopPropagation();
    setIsPanning(false);
    soundEngine.playClick();
    setConnectingSourceId(sourceId);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - pan.x) / zoom;
      const rawY = (e.clientY - rect.top - pan.y) / zoom;
      setConnectionDragPos({ x: rawX, y: rawY });
    }
  };

  // Finish dragging wire onto target node
  const handleDropWireOnNode = (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    if (connectingSourceId && connectingSourceId !== targetId) {
      soundEngine.playSweep(true);
      onAddConnection(connectingSourceId, targetId);
    }
    setConnectingSourceId(null);
    setConnectionDragPos(null);
  };

  // Column headers
  const colLabels = Array.from({ length: gridConfig.columns }, (_, i) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return letters[i] || `C${i + 1}`;
  });

  // Dynamic cursor style based on active tool and dragging state
  const canvasCursor = isRightClickZooming
    ? 'cursor-ns-resize'
    : isPanning
    ? 'cursor-grabbing'
    : activeTool === 'pan'
    ? 'cursor-grab'
    : activeTool === 'place'
    ? 'cursor-crosshair'
    : activeTool === 'connect'
    ? 'cursor-crosshair'
    : activeTool === 'erase'
    ? 'cursor-pointer'
    : 'cursor-default';

  return (
    <div 
      className={`relative flex-1 w-full h-full min-h-[550px] bg-[#070b0e] overflow-hidden select-none font-mono ${canvasCursor}`}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 0. CYBERPUNK RIGHT-CLICK PULL & PUSH ZOOM HUD */}
      {isRightClickZooming && rightClickHUDPos && (
        <div 
          className="fixed pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center select-none"
          style={{ left: `${rightClickHUDPos.x}px`, top: `${rightClickHUDPos.y}px` }}
        >
          {/* Holographic Aim Reticle */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Outer dotted tech ring */}
            <div 
              className={`absolute inset-0 rounded-full border border-dashed transition-all duration-100 ${
                zoomDirection === 'in' 
                  ? 'border-emerald-400 scale-110 shadow-[0_0_20px_rgba(5,255,161,0.6)]' 
                  : zoomDirection === 'out'
                  ? 'border-sky-400 scale-90 shadow-[0_0_20px_rgba(56,189,248,0.6)]'
                  : 'border-emerald-500/40 scale-100'
              }`} 
            />

            {/* Crosshair ticks */}
            <div className="absolute top-0 w-0.5 h-3 bg-emerald-400/80" />
            <div className="absolute bottom-0 w-0.5 h-3 bg-emerald-400/80" />
            <div className="absolute left-0 w-3 h-0.5 bg-emerald-400/80" />
            <div className="absolute right-0 w-3 h-0.5 bg-emerald-400/80" />

            {/* Dynamic Push indicator */}
            <div className={`absolute -top-7 text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded transition-all flex items-center space-x-1 ${
              zoomDirection === 'in' 
                ? 'bg-emerald-950 border border-emerald-500 text-emerald-300 scale-105 shadow-lg' 
                : 'bg-black/60 text-slate-500 border border-transparent'
            }`}>
              <span>▲ PUSH // ZOOM IN</span>
            </div>

            {/* Central Zoom Badge */}
            <div className="bg-black/90 backdrop-blur-md border border-emerald-500/80 rounded-lg px-3 py-1.5 text-center shadow-2xl">
              <div className="text-[8px] text-emerald-400/80 font-mono tracking-widest uppercase">OPTICAL ZOOM</div>
              <div className="text-base font-black text-white font-mono tabular-nums leading-tight">
                {Math.round(zoom * 100)}%
              </div>
            </div>

            {/* Dynamic Pull indicator */}
            <div className={`absolute -bottom-7 text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded transition-all flex items-center space-x-1 ${
              zoomDirection === 'out' 
                ? 'bg-sky-950 border border-sky-500 text-sky-300 scale-105 shadow-lg' 
                : 'bg-black/60 text-slate-500 border border-transparent'
            }`}>
              <span>▼ PULL // ZOOM OUT</span>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Background Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle, ${palette.primary} 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          backgroundPosition: `${pan.x}px ${pan.y}px`
        }}
      />

      {/* Floating Canvas View Controls (Zoom / Pan / Reset / Mouse Wheel Toggle) */}
      <div className="absolute top-4 right-4 z-30 flex items-center space-x-1.5 bg-black/85 backdrop-blur-md p-1.5 rounded-lg border border-slate-800 shadow-2xl text-xs">
        {/* Mouse Wheel Zoom Toggle Option Button */}
        <button
          onClick={handleToggleWheelZoomInternal}
          className={`flex items-center space-x-1 px-2 py-1 rounded border text-[10px] font-mono transition-all cursor-pointer ${
            wheelZoomEnabled
              ? 'border-emerald-400 bg-emerald-950/80 text-emerald-300 font-bold shadow-[0_0_8px_rgba(5,255,161,0.3)]'
              : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 text-slate-400 hover:text-slate-200'
          }`}
          title={wheelZoomEnabled ? 'Mouse Wheel Zoom: ENABLED. Click to disable.' : 'Mouse Wheel Zoom: DISABLED. Click to enable.'}
        >
          <Mouse className={`w-3.5 h-3.5 ${wheelZoomEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span className="hidden sm:inline">WHEEL ZOOM:</span>
          <span className={wheelZoomEnabled ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
            {wheelZoomEnabled ? 'ON' : 'OFF'}
          </span>
        </button>

        <div className="h-4 w-px bg-slate-800" />

        <div className="hidden sm:flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400 font-mono">
          <span className="text-emerald-400 font-bold">RMB</span>
          <span>PUSH/PULL</span>
        </div>

        <button
          onClick={() => setZoom(prev => Math.min(prev + 0.15, 2.5))}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Zoom In (or Right-Click & Push / Mouse Wheel)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] text-slate-300 px-1 font-mono tabular-nums font-bold">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.40))}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Zoom Out (or Right-Click & Pull / Mouse Wheel)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            soundEngine.playClick();
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Reset Zoom & Pan to Center"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Board Section: Undo, Redo & Clear Board Buttons */}
        <div className="h-4 w-px bg-slate-800" />

        {onUndo && (
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex items-center space-x-1 px-2 py-1 ${palette.btnRadius} text-[10px] font-mono transition-all ${
              canUndo
                ? 'hover:bg-slate-800 text-slate-200 hover:text-white cursor-pointer border border-slate-700/60 bg-slate-900/60'
                : 'text-slate-600 opacity-40 cursor-not-allowed border border-transparent'
            }`}
            title={`Undo last action (Ctrl+Z)${undoCount ? ` • ${undoCount} action${undoCount > 1 ? 's' : ''} in stack` : ''}`}
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-bold">UNDO</span>
            {undoCount > 0 && (
              <span className="text-[9px] bg-emerald-950 border border-emerald-700/60 text-emerald-400 font-mono px-1 rounded tabular-nums">
                {undoCount}
              </span>
            )}
          </button>
        )}

        {onRedo && (
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`flex items-center space-x-1 px-2 py-1 ${palette.btnRadius} text-[10px] font-mono transition-all ${
              canRedo
                ? 'hover:bg-slate-800 text-slate-200 hover:text-white cursor-pointer border border-slate-700/60 bg-slate-900/60'
                : 'text-slate-600 opacity-40 cursor-not-allowed border border-transparent'
            }`}
            title={`Redo last undone action (Ctrl+Y or Ctrl+Shift+Z)${redoCount ? ` • ${redoCount} action${redoCount > 1 ? 's' : ''} in stack` : ''}`}
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-bold">REDO</span>
            {redoCount > 0 && (
              <span className="text-[9px] bg-sky-950 border border-sky-700/60 text-sky-400 font-mono px-1 rounded tabular-nums">
                {redoCount}
              </span>
            )}
          </button>
        )}

        {onOpenClearModal && (
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenClearModal();
            }}
            className={`flex items-center space-x-1 px-2 py-1 ${palette.btnRadius} text-[10px] font-mono transition-all border border-rose-900/70 hover:border-rose-500 bg-rose-950/40 hover:bg-rose-950/80 text-rose-300 hover:text-rose-100 cursor-pointer shadow-sm`}
            title="Clear Entire Board (Purge all events and wiring with confirmation)"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-bold">CLEAR</span>
          </button>
        )}
      </div>

      {/* Active Navigation Hint Toast */}
      {activeTool === 'pan' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-emerald-950/90 border border-emerald-500/60 px-4 py-1.5 rounded-full text-xs text-emerald-300 shadow-2xl flex items-center space-x-2">
          <Move className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Click & drag anywhere to pan • Right-click pull & push to zoom in & out</span>
        </div>
      )}
      {activeTool === 'place' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-emerald-950/90 border border-emerald-500/60 px-4 py-1.5 rounded-full text-xs text-emerald-300 shadow-2xl flex items-center space-x-2 animate-bounce">
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span>Click any grid cell to place "{selectedIconToPlace}" and open description notes!</span>
        </div>
      )}
      {activeTool === 'connect' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-sky-950/90 border border-sky-500/60 px-4 py-1.5 rounded-full text-xs text-sky-300 shadow-2xl flex items-center space-x-2">
          <LinkIcon className="w-3.5 h-3.5 text-sky-400 animate-spin" />
          <span>{connectingSourceId ? 'Now click target event to complete line connector' : 'Click first event to begin wire connection'}</span>
        </div>
      )}
      {activeTool === 'erase' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-rose-950/90 border border-rose-500/60 px-4 py-1.5 rounded-full text-xs text-rose-300 shadow-2xl flex items-center space-x-2">
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span>Click any event icon or connection line on the grid to delete it</span>
        </div>
      )}

      {/* Starting Node Quick Centered Toast */}
      {centerToast && (
        <div 
          className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-black/95 backdrop-blur-md border px-4 py-2.5 rounded-lg shadow-2xl flex items-center space-x-3 pointer-events-none transition-all animate-in fade-in zoom-in-95 duration-200"
          style={{ borderColor: centerToast.color, boxShadow: `0 0 25px ${centerToast.color}40` }}
        >
          <div 
            className="w-8 h-8 rounded flex items-center justify-center font-mono font-black text-sm text-black shadow-inner"
            style={{ backgroundColor: centerToast.color }}
          >
            {centerToast.key}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">
                STARTING NODE CENTERED // [KEY {centerToast.key}]
              </span>
              <span 
                className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border"
                style={{ borderColor: centerToast.color, color: centerToast.color, backgroundColor: `${centerToast.color}15` }}
              >
                {centerToast.colorName}
              </span>
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-xs font-bold text-white max-w-sm truncate">
                {centerToast.title}
              </span>
              {centerToast.time && (
                <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1 py-0.2 rounded">
                  {centerToast.time}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Center Starting Nodes [1-0] Dock */}
      {startingNodes.length > 0 && (
        <div className="absolute bottom-4 left-4 z-30 hidden sm:flex items-center space-x-1.5 bg-black/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800 shadow-2xl">
          <div className="text-[9px] font-mono uppercase font-bold text-slate-400 mr-1 flex items-center">
            <span className="text-emerald-400 mr-1">⌨</span>
            <span>NODES [1-0]:</span>
          </div>
          <div className="flex items-center space-x-1">
            {startingNodes.map((node, sIdx) => {
              const keyItem = NUMBER_KEY_COLORS[sIdx];
              const isSelected = highlightedEventId === node.id;
              const nodeColor = node.color || keyItem?.hex || getNumberKeyColor(sIdx);
              return (
                <button
                  key={node.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    centerOnEvent(node, keyItem.key, sIdx + 1);
                  }}
                  className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                    isSelected ? 'scale-110 shadow-lg ring-1 ring-white' : 'hover:scale-105'
                  }`}
                  style={{
                    borderColor: nodeColor,
                    backgroundColor: isSelected ? nodeColor : `${nodeColor}18`,
                    color: isSelected ? '#000000' : nodeColor,
                    boxShadow: isSelected ? `0 0 15px ${nodeColor}` : undefined
                  }}
                  title={`[Key ${keyItem.key}] Quick center: "${node.title}" (${keyItem.name})`}
                >
                  <span>{keyItem.key}</span>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isSelected ? '#000000' : nodeColor }} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Transformable Canvas Surface */}
      <div 
        className="absolute top-0 left-0 origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transition: isSmoothCentering ? 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
          width: totalWidth,
          height: totalHeight
        }}
      >
        {/* 1. COLUMN COORDINATE HEADERS */}
        {gridConfig.showCoordinates && (
          <div className="absolute top-1 left-12 flex space-x-[12px] pointer-events-none">
            {colLabels.map((lbl) => (
              <div 
                key={lbl} 
                className="w-[190px] text-center text-[10px] font-bold tracking-widest text-slate-600 uppercase"
              >
                SECTOR // {lbl}
              </div>
            ))}
          </div>
        )}

        {/* 2. ROW COORDINATE HEADERS */}
        {gridConfig.showCoordinates && (
          <div className="absolute top-10 left-1 flex flex-col space-y-[12px] pointer-events-none">
            {Array.from({ length: gridConfig.rows }, (_, r) => (
              <div 
                key={r} 
                className="h-[140px] flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase tracking-wider"
              >
                0{r + 1}
              </div>
            ))}
          </div>
        )}

        {/* 3. GRID CELL MATRIX */}
        <div 
          className="absolute top-10 left-12 grid"
          style={{
            gridTemplateColumns: `repeat(${gridConfig.columns}, ${CELL_WIDTH}px)`,
            gridTemplateRows: `repeat(${gridConfig.rows}, ${CELL_HEIGHT}px)`,
            gap: `${GAP}px`
          }}
        >
          {Array.from({ length: gridConfig.rows }).map((_, rowIdx) => (
            Array.from({ length: gridConfig.columns }).map((__, colIdx) => {
              const hasEvent = events.some(e => e.gridX === colIdx && e.gridY === rowIdx);
              const isDragHover = dragHoverCell?.x === colIdx && dragHoverCell?.y === rowIdx;
              const isHover = hoveredCell?.x === colIdx && hoveredCell?.y === rowIdx;

              return (
                <div
                  key={`${colIdx}-${rowIdx}`}
                  onClick={() => handleCellClick(colIdx, rowIdx)}
                  onMouseEnter={() => setHoveredCell({ x: colIdx, y: rowIdx })}
                  onMouseLeave={() => setHoveredCell(null)}
                  onDragOver={(e) => handleDragOverCell(e, colIdx, rowIdx)}
                  onDrop={(e) => handleDropOnCell(e, colIdx, rowIdx)}
                  className={`relative rounded border transition-all ${
                    hasEvent
                      ? 'border-transparent'
                      : isDragHover
                      ? 'border-emerald-400 bg-emerald-950/20'
                      : isHover && activeTool === 'place'
                      ? 'border-emerald-500/60 bg-emerald-950/15 cursor-crosshair'
                      : gridConfig.showGridLines
                      ? 'border-slate-800/40 hover:border-slate-700/60 bg-[#090d12]/40'
                      : 'border-transparent hover:border-slate-800/30'
                  }`}
                  style={{ width: `${CELL_WIDTH}px`, height: `${CELL_HEIGHT}px` }}
                >
                  <span className="absolute top-1 right-1.5 text-[8px] text-slate-700 font-mono pointer-events-none">
                    {colLabels[colIdx]}{rowIdx + 1}
                  </span>

                  <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-slate-700/30 pointer-events-none" />
                  <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-slate-700/30 pointer-events-none" />

                  {!hasEvent && isHover && activeTool === 'place' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-emerald-400/50">
                      <div className="w-8 h-8 rounded border border-dashed border-emerald-400/50 flex items-center justify-center mb-1">
                        {renderEventIcon(selectedIconToPlace, 'w-4 h-4')}
                      </div>
                      <span className="text-[9px] uppercase font-bold tracking-wider">CLICK TO PLACE</span>
                    </div>
                  )}
                </div>
              );
            })
          ))}
        </div>

        {/* 4. SVG CONNECTION LINES LAYER WITH EVIDENCE TYPES */}
        <svg 
          className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
          style={{ width: totalWidth, height: totalHeight }}
        >
          <defs>
            {/* Arrow Marker Definitions */}
            <marker
              id="arrow-emerald"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#05ffa1" />
            </marker>
            <marker
              id="arrow-amber"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#ffb000" />
            </marker>
            <marker
              id="arrow-red"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
            </marker>
            <marker
              id="arrow-sky"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
            </marker>
            <marker
              id="arrow-purple"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#c084fc" />
            </marker>

            {/* Glowing filter */}
            <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Intense blink pulse filter */}
            <filter id="hyper-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Render All Established Connection Lines */}
          {connections.map((conn) => {
            const src = events.find(e => e.id === conn.fromId);
            const tgt = events.find(e => e.id === conn.toId);
            if (!src || !tgt) return null;

            const p1 = getEventCenter(src.gridX, src.gridY);
            const p2 = getEventCenter(tgt.gridX, tgt.gridY);

            // Compute curved Bezier control points
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const cx1 = p1.x + dx * 0.5;
            const cy1 = p1.y;
            const cx2 = p1.x + dx * 0.5;
            const cy2 = p2.y;
            const pathData = `M ${p1.x} ${p1.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p2.x} ${p2.y}`;

            // Midpoint coordinates for relationship badge
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;

            const evidenceType = conn.evidenceType || 'documented';
            const srcColor = src.color || palette.primary;
            const tgtColor = tgt.color || '#38bdf8';
            const baseColor = conn.color || srcColor;

            // Pick arrow marker color
            let markerId = 'arrow-emerald';
            if (baseColor.includes('ffb000') || baseColor.includes('amber')) markerId = 'arrow-amber';
            else if (baseColor.includes('ef4444') || baseColor.includes('red')) markerId = 'arrow-red';
            else if (baseColor.includes('38bdf8') || baseColor.includes('sky')) markerId = 'arrow-sky';
            else if (baseColor.includes('c084fc') || baseColor.includes('purple')) markerId = 'arrow-purple';

            const linearGradId = `grad_flow_${conn.id}`;

            return (
              <g key={conn.id} className="group">
                <defs>
                  <linearGradient id={linearGradId} gradientUnits="userSpaceOnUse" x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}>
                    <stop offset="0%" stopColor={srcColor} />
                    <stop offset="50%" stopColor={tgtColor} />
                    <stop offset="100%" stopColor={srcColor} />
                  </linearGradient>
                </defs>

                {/* Wide invisible stroke for easy clicking/editing */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="24"
                  className="pointer-events-auto cursor-pointer"
                  onClick={() => {
                    if (hasMovedPan) return;
                    if (activeTool === 'erase') {
                      soundEngine.playSweep(false);
                      onDeleteConnection(conn.id);
                    } else {
                      soundEngine.playClick();
                      onSelectConnection(conn);
                    }
                  }}
                />

                {/* 1. DOCUMENTED RELATIONSHIP: Solid line with flowing blinking pulses */}
                {evidenceType === 'documented' && (
                  <>
                    <path
                      d={pathData}
                      fill="none"
                      stroke={baseColor}
                      strokeWidth="6"
                      strokeOpacity="0.25"
                      filter="url(#neon-glow)"
                    />
                    <path
                      d={pathData}
                      fill="none"
                      stroke={baseColor}
                      strokeWidth="2.5"
                      markerEnd={`url(#${markerId})`}
                    />
                    <path
                      d={pathData}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="3"
                      strokeDasharray="20,120"
                      strokeLinecap="round"
                      className="wire-dash-animated opacity-90"
                      filter="url(#hyper-glow)"
                    />
                    <circle r="4.5" fill={srcColor} filter="url(#hyper-glow)">
                      <animateMotion path={pathData} dur="2.4s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="1;0.2;1" dur="0.4s" repeatCount="indefinite" />
                      <animate attributeName="r" values="3.5;5.5;3.5" dur="0.4s" repeatCount="indefinite" />
                    </circle>
                    <circle r="3.5" fill="#ffffff" filter="url(#neon-glow)">
                      <animateMotion path={pathData} dur="2.4s" repeatCount="indefinite" />
                    </circle>
                    <circle r="4" fill={tgtColor} filter="url(#hyper-glow)">
                      <animateMotion path={pathData} dur="2.4s" begin="1.2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.3;1;0.3" dur="0.5s" repeatCount="indefinite" />
                    </circle>
                  </>
                )}

                {/* 2. PROPOSED RELATIONSHIP: Dashed line with dashing flow and blinking pulse */}
                {evidenceType === 'proposed' && (
                  <>
                    <path
                      d={pathData}
                      fill="none"
                      stroke={baseColor}
                      strokeWidth="5"
                      strokeOpacity="0.2"
                      strokeDasharray="9,5"
                      filter="url(#neon-glow)"
                    />
                    <path
                      d={pathData}
                      fill="none"
                      stroke={baseColor}
                      strokeWidth="2.5"
                      strokeDasharray="10,6"
                      markerEnd={`url(#${markerId})`}
                      className="wire-dash-animated"
                    />
                    <circle r="4.5" fill="#ffb000" filter="url(#hyper-glow)">
                      <animateMotion path={pathData} dur="3s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="1;0.1;1" dur="0.35s" repeatCount="indefinite" />
                      <animate attributeName="r" values="3;6;3" dur="0.35s" repeatCount="indefinite" />
                    </circle>
                    <circle r="2.5" fill="#ffffff">
                      <animateMotion path={pathData} dur="3s" repeatCount="indefinite" />
                    </circle>
                  </>
                )}

                {/* 3. CHRONOLOGICAL ASSOCIATION ONLY: Dotted alternating colors blinking in motion down the line */}
                {evidenceType === 'chronological' && (
                  <>
                    <path
                      d={pathData}
                      fill="none"
                      stroke={`url(#${linearGradId})`}
                      strokeWidth="5"
                      strokeOpacity="0.2"
                      strokeDasharray="4,8"
                      filter="url(#neon-glow)"
                    />
                    <path
                      d={pathData}
                      fill="none"
                      stroke={srcColor}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray="4,16"
                      className="wire-dotted-animated"
                      filter="url(#neon-glow)"
                    />
                    <path
                      d={pathData}
                      fill="none"
                      stroke={tgtColor}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray="4,16"
                      strokeDashoffset="10"
                      markerEnd={`url(#${markerId})`}
                      className="wire-dotted-animated"
                      filter="url(#neon-glow)"
                    />
                    <circle r="4.5" fill={srcColor} filter="url(#hyper-glow)">
                      <animateMotion path={pathData} dur="3.2s" repeatCount="indefinite" />
                      <animate attributeName="fill" values={`${srcColor};${tgtColor};#ffffff;${srcColor}`} dur="0.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="1;0.2;1" dur="0.25s" repeatCount="indefinite" />
                    </circle>
                    <circle r="3.5" fill={tgtColor} filter="url(#hyper-glow)">
                      <animateMotion path={pathData} dur="3.2s" begin="1.6s" repeatCount="indefinite" />
                      <animate attributeName="fill" values={`${tgtColor};${srcColor};#ffffff;${tgtColor}`} dur="0.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.2;1;0.2" dur="0.25s" repeatCount="indefinite" />
                    </circle>
                  </>
                )}

                {/* Midpoint Interactive Relationship Label Badge */}
                {conn.label && (
                  <g 
                    transform={`translate(${midX}, ${midY})`}
                    className="pointer-events-auto cursor-pointer"
                    onClick={() => {
                      if (hasMovedPan) return;
                      if (activeTool === 'erase') {
                        onDeleteConnection(conn.id);
                      } else {
                        onSelectConnection(conn);
                      }
                    }}
                  >
                    <rect
                      x="-65"
                      y="-11"
                      width="130"
                      height="22"
                      rx="4"
                      fill="#0b0f14"
                      stroke={evidenceType === 'chronological' ? tgtColor : baseColor}
                      strokeWidth="1.2"
                      strokeDasharray={evidenceType === 'proposed' ? '4,2' : undefined}
                      strokeOpacity="0.9"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#e2e8f0"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      letterSpacing="0.05em"
                    >
                      {conn.label.length > 18 ? conn.label.substring(0, 17) + '…' : conn.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Active Connection Line being dragged */}
          {connectingSourceId && connectionDragPos && (() => {
            const src = events.find(e => e.id === connectingSourceId);
            if (!src) return null;
            const p1 = getEventCenter(src.gridX, src.gridY);
            const p2 = connectionDragPos;
            return (
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={palette.primary}
                strokeWidth="2.5"
                strokeDasharray="4,3"
                className="animate-pulse"
              />
            );
          })()}
        </svg>

        {/* 5. PLACED EVENT NODES ON THE GRID */}
        <div className="absolute top-10 left-12 pointer-events-none z-20">
          {events.map((evt) => {
            const isMatch = isEventMatching(evt);
            const isConnectingSource = connectingSourceId === evt.id;
            const left = evt.gridX * (CELL_WIDTH + GAP);
            const top = evt.gridY * (CELL_HEIGHT + GAP);
            const startingNodeIdx = startingNodes.findIndex(sn => sn.id === evt.id);
            const numberKeyItem = startingNodeIdx >= 0 ? NUMBER_KEY_COLORS[startingNodeIdx] : null;
            const nodeKeyColor = numberKeyItem ? numberKeyItem.hex : null;
            const eventColor = evt.color || nodeKeyColor || palette.primary;
            const isTargetHighlighted = highlightedEventId === evt.id;

            // Block borders bloom color calculations
            const isAutoBloom = !colorConfig?.bloomColor || colorConfig.bloomColor === 'auto';
            const bloomColor = isAutoBloom ? eventColor : colorConfig.bloomColor;
            const intensity = (colorConfig?.bloomIntensity ?? 65) / 100;
            const isPulse = colorConfig?.bloomPulse ?? false;

            const glow1 = Math.round(4 + 8 * intensity);
            const glow2 = Math.round(12 + 18 * intensity);
            const glow3 = Math.round(24 + 32 * intensity);
            const insetGlow = Math.round(3 + 8 * intensity);

            // Compute block border bloom box-shadow with multiple radiant layers
            const bloomShadow = intensity > 0.05
              ? `0 6px 20px rgba(0,0,0,0.85), 0 0 ${glow1}px ${bloomColor}bb, 0 0 ${glow2}px ${bloomColor}55, 0 0 ${glow3}px ${bloomColor}25, inset 0 0 ${insetGlow}px ${bloomColor}30`
              : `0 6px 20px rgba(0,0,0,0.85)`;

            const borderStyle = colorConfig?.blockBorderStyle || 'cyber';
            const eventFolder = folders?.find(f => f.id === evt.folderId);

            // Theme-specific card geometry styling
            const cardRadiusClass = 
              theme === 'nephila' 
                ? 'rounded-2xl' 
                : theme === 'mire' || theme === 'sepulchre' 
                ? 'rounded-none' 
                : theme === 'sepulchral_nx' 
                ? 'rounded-sm' 
                : 'rounded-lg';

            return (
              <div
                key={evt.id}
                draggable={activeTool === 'select'}
                onMouseDown={(e) => {
                  // Never trigger board pan when interacting with or starting to drag an event card
                  if (e.button === 0 && activeTool !== 'pan') {
                    e.stopPropagation();
                    isPanningRef.current = false;
                    setIsPanning(false);
                  }
                }}
                onDragStart={(e) => {
                  isPanningRef.current = false;
                  setIsPanning(false);
                  handleDragStart(e, evt.id);
                }}
                onDragEnd={() => {
                  isPanningRef.current = false;
                  setIsPanning(false);
                  setDraggingEventId(null);
                  setDragHoverCell(null);
                }}
                onClick={(e) => handleEventClick(e, evt)}
                onMouseUp={(e) => {
                  isPanningRef.current = false;
                  setIsPanning(false);
                  handleDropWireOnNode(e, evt.id);
                }}
                className={`absolute pointer-events-auto ${cardRadiusClass} ${palette.fontClass} border transition-all duration-150 flex flex-col justify-between p-2.5 shadow-2xl cursor-pointer group select-none ${
                  !isMatch ? 'opacity-20 grayscale' : 'opacity-100'
                } ${
                  isConnectingSource 
                    ? 'ring-2 ring-emerald-400 scale-105 shadow-[0_0_25px_rgba(5,255,161,0.5)]' 
                    : 'hover:scale-[1.02]'
                } ${isPulse && intensity > 0.1 ? 'bloom-pulse-active' : ''}`}
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${CELL_WIDTH}px`,
                  height: `${CELL_HEIGHT}px`,
                  backgroundColor: theme === 'sepulchre' ? '#08080a' : theme === 'mire' ? '#120d08' : '#0c1015',
                  borderColor: isConnectingSource ? '#05ffa1' : bloomColor,
                  boxShadow: bloomShadow,
                  borderWidth: borderStyle === 'double' || theme === 'mire' ? '2.5px' : '1px'
                }}
              >
                {/* Target Lock Highlight Pulse (Quick Center) */}
                {isTargetHighlighted && (
                  <div 
                    className={`absolute -inset-2.5 ${cardRadiusClass} border-2 pointer-events-none animate-ping z-40`}
                    style={{ borderColor: numberKeyItem?.hex || eventColor }} 
                  />
                )}
                {isTargetHighlighted && (
                  <div 
                    className={`absolute -inset-1 ${cardRadiusClass} border-2 pointer-events-none z-40`}
                    style={{ 
                      borderColor: numberKeyItem?.hex || eventColor,
                      boxShadow: `0 0 25px ${numberKeyItem?.hex || eventColor}`
                    }} 
                  />
                )}

                {/* Theme-specific corner markers */}
                {theme === 'mire' ? (
                  <>
                    <div className="absolute top-1 left-1.5 text-[8px] font-bold select-none opacity-60" style={{ color: bloomColor }}>●</div>
                    <div className="absolute top-1 right-1.5 text-[8px] font-bold select-none opacity-60" style={{ color: bloomColor }}>●</div>
                    <div className="absolute bottom-1 left-1.5 text-[8px] font-bold select-none opacity-60" style={{ color: bloomColor }}>●</div>
                    <div className="absolute bottom-1 right-1.5 text-[8px] font-bold select-none opacity-60" style={{ color: bloomColor }}>●</div>
                  </>
                ) : theme === 'nephila' ? (
                  <>
                    <div className="absolute top-1 left-1.5 text-[9px] font-bold select-none opacity-70" style={{ color: bloomColor }}>◈</div>
                    <div className="absolute top-1 right-1.5 text-[9px] font-bold select-none opacity-70" style={{ color: bloomColor }}>◈</div>
                  </>
                ) : theme === 'sepulchre' ? (
                  <>
                    <div className="absolute top-0.5 left-1 text-[9px] font-mono font-bold select-none opacity-80" style={{ color: bloomColor }}>+</div>
                    <div className="absolute top-0.5 right-1 text-[9px] font-mono font-bold select-none opacity-80" style={{ color: bloomColor }}>+</div>
                  </>
                ) : theme === 'sepulchral_nx' ? (
                  <>
                    <div className="absolute top-0.5 right-1 text-[9px] font-bold select-none opacity-80" style={{ color: bloomColor }}>»</div>
                    <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2" style={{ borderColor: bloomColor }} />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2" style={{ borderColor: bloomColor }} />
                  </>
                ) : (
                  <>
                    {/* Default Nightfly Cyber HUD brackets */}
                    <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2" style={{ borderColor: bloomColor, filter: intensity > 0.2 ? `drop-shadow(0 0 3px ${bloomColor})` : undefined }} />
                    <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2" style={{ borderColor: bloomColor, filter: intensity > 0.2 ? `drop-shadow(0 0 3px ${bloomColor})` : undefined }} />
                    <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2" style={{ borderColor: bloomColor, filter: intensity > 0.2 ? `drop-shadow(0 0 3px ${bloomColor})` : undefined }} />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2" style={{ borderColor: bloomColor, filter: intensity > 0.2 ? `drop-shadow(0 0 3px ${bloomColor})` : undefined }} />
                  </>
                )}

                {/* Wire connector handle (Bottom Edge Dot) */}
                <button
                  onMouseDown={(e) => {
                    if (e.button === 0) handleStartWireDrag(e, evt.id);
                  }}
                  title="Drag wire to connect another event"
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border bg-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30 cursor-crosshair hover:scale-125"
                  style={{ borderColor: bloomColor }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: bloomColor }} />
                </button>

                {/* Wire connector handle (Right Edge Dot) */}
                <button
                  onMouseDown={(e) => {
                    if (e.button === 0) handleStartWireDrag(e, evt.id);
                  }}
                  title="Drag wire to connect another event"
                  className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border bg-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30 cursor-crosshair hover:scale-125"
                  style={{ borderColor: bloomColor }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: bloomColor }} />
                </button>

                {/* Top Row: Icon + Key Badge + Time Badge + Folder Tag */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    {numberKeyItem && (
                      <span 
                        className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded border truncate flex items-center shrink-0 tracking-wider shadow-sm"
                        style={{ 
                          borderColor: numberKeyItem.hex, 
                          color: numberKeyItem.hex, 
                          backgroundColor: `${numberKeyItem.hex}25`,
                          boxShadow: `0 0 8px ${numberKeyItem.hex}44`
                        }}
                        title={`Starting Node #${numberKeyItem.slot} (${numberKeyItem.name}) - Quick Center: Press [${numberKeyItem.key}]`}
                      >
                        [{numberKeyItem.key}]
                      </span>
                    )}
                    <div 
                      className="p-1.5 rounded border flex items-center justify-center shrink-0"
                      style={{ 
                        borderColor: eventColor,
                        backgroundColor: `${eventColor}18`,
                        color: eventColor 
                      }}
                    >
                      {renderEventIcon(evt.icon, 'w-4 h-4')}
                    </div>
                    {eventFolder && (
                      <span 
                        className="text-[8px] font-mono px-1 py-0.5 rounded border truncate max-w-[65px] flex items-center"
                        style={{ borderColor: eventFolder.color, color: eventFolder.color, backgroundColor: `${eventFolder.color}15` }}
                        title={`Folder: ${eventFolder.name}`}
                      >
                        <Folder className="w-2 h-2 mr-0.5 shrink-0" />
                        <span className="truncate">{eventFolder.name}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 text-[9px] text-slate-400 font-bold bg-black/60 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                    <Clock className="w-2.5 h-2.5 text-slate-500" />
                    <span className="truncate max-w-[70px]">{evt.time || 'TIME UNSET'}</span>
                  </div>
                </div>

                {/* Middle: Event Title */}
                <div className="my-1 min-w-0">
                  <h4 
                    className="text-xs font-bold text-slate-100 leading-snug line-clamp-2 group-hover:text-white transition-colors"
                    title={evt.title}
                  >
                    {evt.title || 'Untitled Event'}
                  </h4>
                </div>

                {/* Description 1-line preview */}
                <p className="text-[10px] text-slate-400 line-clamp-1 italic">
                  {evt.description || 'Click to type notes...'}
                </p>

                {/* Bottom Row: Status Indicator + Location tag */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[8px]">
                  <span 
                    className="font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{
                      color: eventColor,
                      backgroundColor: `${eventColor}15`
                    }}
                  >
                    {evt.status.toUpperCase()}
                  </span>

                  {evt.location ? (
                    <span className="text-slate-500 truncate max-w-[85px] flex items-center">
                      <MapPin className="w-2.5 h-2.5 mr-0.5" />
                      {evt.location}
                    </span>
                  ) : (
                    <span className="text-slate-600 font-mono">
                      POS: {colLabels[evt.gridX]}{evt.gridY + 1}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 6. EMPTY BOARD GUIDANCE OVERLAY */}
        {events.length === 0 && (
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 flex flex-col items-center justify-center p-6 rounded-lg bg-black/80 border border-slate-800 shadow-2xl text-center max-w-sm"
          >
            <div className="w-10 h-10 rounded border border-dashed border-emerald-500/40 flex items-center justify-center mb-2.5 text-emerald-400">
              <Plus className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest mb-1">
              // BOARD EMPTY //
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
              Select <span className="text-emerald-400 font-bold">PLACE EVENT</span> or click any sector grid cell to plot your first case node.
            </p>
            <div className="text-[10px] text-emerald-400/90 font-mono bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 rounded">
              Ctrl+Z will undo & restore cleared canvas
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
