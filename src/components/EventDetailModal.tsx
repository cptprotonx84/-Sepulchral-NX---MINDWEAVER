/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TimelineEvent, EventConnection, EventStatus, TerminalTheme, EvidenceType, ProjectFolder, NUMBER_KEY_COLORS } from '../types';
import { AVAILABLE_ICONS, renderEventIcon } from './iconRegistry';
import { THEME_PALETTES } from './TerminalOverlay';
import { soundEngine } from './SoundEngine';
import { 
  X, 
  Trash2, 
  Copy, 
  Link, 
  MapPin, 
  Clock, 
  User, 
  Tag, 
  Unlink, 
  Sparkles,
  Check,
  Palette,
  FileCheck,
  HelpCircle,
  Folder,
  Bot,
  FileText
} from 'lucide-react';

interface EventDetailModalProps {
  event: TimelineEvent;
  allEvents: TimelineEvent[];
  connections: EventConnection[];
  theme: TerminalTheme;
  isOpen: boolean;
  folders?: ProjectFolder[];
  onClose: () => void;
  onUpdate: (updated: TimelineEvent) => void;
  onDelete: (eventId: string) => void;
  onDuplicate: (event: TimelineEvent) => void;
  onAddConnection: (fromId: string, toId: string, label?: string, evidenceType?: EvidenceType) => void;
  onDeleteConnection: (connId: string) => void;
}

const COLOR_PRESETS = [
  ...NUMBER_KEY_COLORS.map(k => ({
    key: k.key,
    name: `[KEY ${k.key}] ${k.name}`,
    hex: k.hex,
    label: `Key ${k.key}: ${k.description}`
  })),
  { key: 'W', name: 'Ghost White', hex: '#f8fafc', label: 'Archival Dossier / Neutral Timestamp' },
];

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  allEvents,
  connections,
  theme,
  isOpen,
  folders,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate,
  onAddConnection,
  onDeleteConnection
}) => {
  const palette = THEME_PALETTES[theme];

  // Editable form state
  const [title, setTitle] = useState(event.title);
  const [time, setTime] = useState(event.time);
  const [description, setDescription] = useState(event.description);
  const [icon, setIcon] = useState(event.icon);
  const [color, setColor] = useState(event.color);
  const [status, setStatus] = useState<EventStatus>(event.status);
  const [location, setLocation] = useState(event.location || '');
  const [suspectRef, setSuspectRef] = useState(event.suspectRef || '');
  const [folderId, setFolderId] = useState(event.folderId || '');
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState<string[]>(event.tags || []);
  
  // Icon selector tab/popover
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Connection selector with Evidence Type
  const [targetEventToConnect, setTargetEventToConnect] = useState('');
  const [connectionLabel, setConnectionLabel] = useState('Led to');
  const [connectionEvidenceType, setConnectionEvidenceType] = useState<EvidenceType>('documented');

  // Sync state whenever opened event changes
  useEffect(() => {
    setTitle(event.title);
    setTime(event.time);
    setDescription(event.description);
    setIcon(event.icon);
    setColor(event.color);
    setStatus(event.status);
    setLocation(event.location || '');
    setSuspectRef(event.suspectRef || '');
    setFolderId(event.folderId || '');
    setTags(event.tags || []);
    setShowIconPicker(false);
  }, [event.id]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Immediate save on edit
  const triggerUpdate = (updatedFields: Partial<TimelineEvent>) => {
    const updated: TimelineEvent = {
      ...event,
      title,
      time,
      description,
      icon,
      color,
      status,
      location,
      suspectRef,
      tags,
      ...updatedFields
    };
    onUpdate(updated);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    triggerUpdate({ title: val });
  };

  const handleTimeChange = (val: string) => {
    setTime(val);
    triggerUpdate({ time: val });
  };

  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    triggerUpdate({ description: val });
  };

  const handleStatusChange = (val: EventStatus) => {
    soundEngine.playClick();
    setStatus(val);
    triggerUpdate({ status: val });
  };

  const handleColorChange = (hex: string) => {
    soundEngine.playClick();
    setColor(hex);
    triggerUpdate({ color: hex });
  };

  const handleIconSelect = (iconName: string) => {
    soundEngine.playSwitch();
    setIcon(iconName);
    setShowIconPicker(false);
    triggerUpdate({ icon: iconName });
  };

  const handleAddTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTag.trim()) return;
    if (!tags.includes(newTag.trim())) {
      const nextTags = [...tags, newTag.trim()];
      setTags(nextTags);
      triggerUpdate({ tags: nextTags });
      soundEngine.playClick();
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const nextTags = tags.filter(t => t !== tagToRemove);
    setTags(nextTags);
    triggerUpdate({ tags: nextTags });
    soundEngine.playClick();
  };

  const handleCreateConnection = () => {
    if (!targetEventToConnect) return;
    soundEngine.playSweep(true);
    onAddConnection(
      event.id, 
      targetEventToConnect, 
      connectionLabel.trim() || 'Connected to',
      connectionEvidenceType
    );
    setTargetEventToConnect('');
  };

  // Find incoming & outgoing connections
  const connectedOut = connections.filter(c => c.fromId === event.id);
  const connectedIn = connections.filter(c => c.toId === event.id);

  // Available other events to connect
  const otherEvents = allEvents.filter(e => e.id !== event.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
      {/* Outer Modal Container with Cyber Corners */}
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#0d1217] border rounded-lg shadow-2xl overflow-hidden"
        style={{ 
          borderColor: color || palette.primary,
          boxShadow: `0 10px 40px rgba(0,0,0,0.9), 0 0 25px ${(color || palette.primary)}20`
        }}
      >
        {/* Cyber corner brackets */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: color || palette.primary }} />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: color || palette.primary }} />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: color || palette.primary }} />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: color || palette.primary }} />

        {/* Modal Header */}
        <div 
          className="px-5 py-3.5 border-b bg-black/60 flex items-center justify-between shrink-0"
          style={{ borderBottomColor: (color || palette.primary) + '40' }}
        >
          <div className="flex items-center space-x-3 min-w-0">
            {/* Clickable Icon Button to open Icon Picker */}
            <button
              onClick={() => {
                soundEngine.playSwitch();
                setShowIconPicker(!showIconPicker);
              }}
              title="Click to change event icon"
              className="relative p-2.5 rounded border transition-all cursor-pointer group shrink-0"
              style={{ 
                borderColor: color || palette.primary,
                backgroundColor: (color || palette.primary) + '15'
              }}
            >
              <div style={{ color: color || palette.primary }}>
                {renderEventIcon(icon, 'w-6 h-6')}
              </div>
              <span className="absolute -bottom-1 -right-1 text-[8px] bg-black px-1 border rounded text-slate-400 opacity-80 group-hover:opacity-100">
                EDIT
              </span>
            </button>

            <div className="min-w-0">
              <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                <span className="font-bold tracking-wider uppercase text-slate-400">EVENT ID: {event.id}</span>
                <span>•</span>
                <span className="text-slate-400">GRID POS: [{event.gridX + 1}, {event.gridY + 1}]</span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter Event Title..."
                className="w-full text-base sm:text-lg font-bold text-slate-100 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-emerald-400 focus:outline-none transition-colors truncate"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Duplicate button */}
            <button
              onClick={() => {
                soundEngine.playClick();
                onDuplicate(event);
                onClose();
              }}
              className="p-1.5 rounded border border-slate-800 hover:border-slate-600 bg-slate-900/60 text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
              title="Duplicate Event"
            >
              <Copy className="w-4 h-4" />
            </button>

            {/* Delete button */}
            <button
              onClick={() => {
                soundEngine.playSweep(false);
                if (window.confirm('Delete this event node and its connections?')) {
                  onDelete(event.id);
                  onClose();
                }
              }}
              className="p-1.5 rounded border border-rose-900/50 hover:border-rose-500 bg-rose-950/20 text-rose-400 hover:text-rose-200 text-xs transition-colors cursor-pointer"
              title="Delete Event"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="p-1.5 rounded border border-slate-800 hover:border-slate-600 bg-slate-900/60 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
              title="Close [ESC]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Icon Picker Popover */}
        {showIconPicker && (
          <div className="p-4 bg-slate-950 border-b border-slate-800 shrink-0 max-h-56 overflow-y-auto">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center">
                <Palette className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                SELECT EVENT ICON CLUSTER:
              </span>
              <button
                onClick={() => setShowIconPicker(false)}
                className="text-slate-500 hover:text-slate-300 text-[11px]"
              >
                Close Picker
              </button>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
              {AVAILABLE_ICONS.map((item) => {
                const IconCmp = item.component;
                const isSelected = icon === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleIconSelect(item.name)}
                    className={`p-2.5 rounded border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-emerald-400 bg-emerald-950/40 text-emerald-300 shadow-[0_0_10px_rgba(5,255,161,0.3)]' 
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    }`}
                    title={item.label}
                  >
                    <IconCmp className="w-5 h-5 mb-1" />
                    <span className="text-[9px] truncate w-full">{item.label.split('/')[0].trim()}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-300">
          
          {/* Row 1: Time marker, Status, Color */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Timestamp field */}
            <div className="bg-slate-950/70 p-3 rounded border border-slate-800/80">
              <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5 flex items-center">
                <Clock className="w-3 h-3 mr-1 text-slate-400" />
                TIMELINE TIMESTAMP / TIME:
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => handleTimeChange(e.target.value)}
                placeholder="e.g. 02:14:00 AM or T+01:30"
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-400 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            {/* Status selector */}
            <div className="bg-slate-950/70 p-3 rounded border border-slate-800/80">
              <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5 block">
                VERIFICATION STATUS:
              </label>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as EventStatus)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-400 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="confirmed">Confirmed Evidence</option>
                <option value="critical">Critical Incident</option>
                <option value="lead">Investigative Lead</option>
                <option value="unverified">Unverified Report</option>
                <option value="redacted">Classified / Redacted</option>
              </select>
            </div>

            {/* Accent Color picker with legend context */}
            <div className="bg-slate-950/70 p-3 rounded border border-slate-800/80">
              <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5 block">
                CYBER GLOW COLOR (MEANING):
              </label>
              <div className="flex items-center space-x-1.5 pt-0.5 overflow-x-auto pb-1">
                {COLOR_PRESETS.map((p) => (
                  <button
                    key={p.hex}
                    onClick={() => handleColorChange(p.hex)}
                    style={{ backgroundColor: p.hex }}
                    className={`w-6 h-6 rounded-full border transition-all cursor-pointer shrink-0 flex items-center justify-center text-[9px] font-mono font-black text-black ${
                      color === p.hex ? 'scale-125 border-white ring-2 ring-white/30 shadow-md' : 'border-black/60 opacity-85 hover:opacity-100'
                    }`}
                    title={`${p.name}: ${p.label}`}
                  >
                    {p.key}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Location, Suspect Reference, and Project Folder */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-950/70 p-3 rounded border border-slate-800/80">
              <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5 flex items-center">
                <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                LOCATION / CRIME SCENE:
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  triggerUpdate({ location: e.target.value });
                }}
                placeholder="e.g. Sub-Level 3 Server Room, North Gate..."
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-400 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div className="bg-slate-950/70 p-3 rounded border border-slate-800/80">
              <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5 flex items-center">
                <User className="w-3 h-3 mr-1 text-slate-400" />
                SUSPECT / ENTITY ASSOCIATED:
              </label>
              <input
                type="text"
                value={suspectRef}
                onChange={(e) => {
                  setSuspectRef(e.target.value);
                  triggerUpdate({ suspectRef: e.target.value });
                }}
                placeholder="e.g. Operative 'Ghost', Dr. Thorne..."
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-400 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div className="bg-slate-950/70 p-3 rounded border border-slate-800/80">
              <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5 flex items-center">
                <Folder className="w-3 h-3 mr-1 text-sky-400" />
                PROJECT FOLDER / CLUSTER:
              </label>
              <select
                value={folderId}
                onChange={(e) => {
                  const val = e.target.value;
                  setFolderId(val);
                  triggerUpdate({ folderId: val || undefined });
                  soundEngine.playClick();
                }}
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-400 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="">[Unassigned / Root Case]</option>
                {folders?.map(f => (
                  <option key={f.id} value={f.id}>📁 {f.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* MAIN TYPEABLE DESCRIPTION / CASE NOTES TEXTAREA */}
          <div className="bg-slate-950/80 p-4 rounded border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-ping" />
                EVENT CASE NOTES & FORENSIC DESCRIPTION (TYPE FREELY):
              </label>
              <span className="text-[10px] text-slate-500">
                {description.length} chars • Autosaved
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              rows={6}
              placeholder="Type detailed notes about this event here... What happened? Who was spotted? What telemetry, forensic evidence, witness statements, or cyber logs connect to this incident?"
              className="w-full bg-[#0a0f14] border border-slate-800 focus:border-emerald-400 rounded p-3 text-xs leading-relaxed text-slate-200 font-mono focus:outline-none resize-y placeholder:text-slate-600 shadow-inner"
            />
            <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
              <span>TIP: Click any placeable icon on the board to review and type notes at any time.</span>
              <span className="text-emerald-500/80 font-bold">READY TO CONNECT</span>
            </div>
          </div>

          {/* LOCAL SOURCE DOSSIER / ORIGINAL PASTED TEXT (Preserved locally) */}
          {event.sourceExcerpt && (
            <div className="bg-slate-950/80 p-3.5 rounded border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
                  <Bot className="w-3.5 h-3.5" />
                  <span>PRESERVED SOURCE DOSSIER // ORIGINAL PASTED TEXT</span>
                </div>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.5 rounded font-mono">
                  LOCAL OLLAMA EXTRACT
                </span>
              </div>
              <div className="p-2.5 rounded bg-black/90 border border-slate-800 text-[10px] text-slate-300 font-mono max-h-36 overflow-y-auto whitespace-pre-wrap select-text leading-relaxed">
                {event.sourceExcerpt}
              </div>
              <p className="text-[9px] text-slate-500">
                Preserved locally on this card's record. Never transmitted to external services.
              </p>
            </div>
          )}

          {/* Tags Section */}
          <div className="bg-slate-950/70 p-3 rounded border border-slate-800/80">
            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2 flex items-center">
              <Tag className="w-3 h-3 mr-1 text-slate-400" />
              INVESTIGATION TAGS:
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {tags.map((tag) => (
                <span 
                  key={tag} 
                  className="bg-slate-900 border border-slate-700 text-slate-300 px-2 py-0.5 rounded text-[11px] flex items-center space-x-1"
                >
                  <span>#{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-400 text-slate-500 ml-1 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
              {tags.length === 0 && (
                <span className="text-slate-600 text-[11px] italic">No tags added yet.</span>
              )}
            </div>
            <form onSubmit={handleAddTag} className="flex items-center space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag (e.g. SIGINT, Wiretap, Sub-Level 3)..."
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-400 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-bold transition-colors cursor-pointer"
              >
                Add
              </button>
            </form>
          </div>

          {/* Event Connections Section */}
          <div className="bg-slate-950/80 p-4 rounded border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center">
                <Link className="w-3.5 h-3.5 mr-1.5 text-sky-400" />
                TIMELINE LINE CONNECTORS ({connectedOut.length + connectedIn.length}):
              </label>
              <span className="text-[10px] text-slate-500">Connections link event timeline sequences</span>
            </div>

            {/* List of active connections */}
            <div className="space-y-2">
              {connectedOut.map((conn) => {
                const target = allEvents.find(e => e.id === conn.toId);
                const evType = conn.evidenceType || 'documented';
                return (
                  <div key={conn.id} className="flex items-center justify-between bg-slate-900/70 border border-slate-800 px-3 py-1.5 rounded text-xs">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="text-emerald-400 font-bold">OUTGOING ➔</span>
                      <span className="text-slate-400 italic">"{conn.label}"</span>
                      <span className="text-slate-500">➔</span>
                      <span className="text-slate-200 font-semibold truncate">{target?.title || conn.toId}</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-black border border-slate-700 text-slate-400">
                        {evType === 'documented' ? 'Solid' : evType === 'proposed' ? 'Dashed' : 'Dotted Alt'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        soundEngine.playClick();
                        onDeleteConnection(conn.id);
                      }}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      title="Remove connection link"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {connectedIn.map((conn) => {
                const source = allEvents.find(e => e.id === conn.fromId);
                const evType = conn.evidenceType || 'documented';
                return (
                  <div key={conn.id} className="flex items-center justify-between bg-slate-900/70 border border-slate-800 px-3 py-1.5 rounded text-xs">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="text-sky-400 font-bold">INCOMING ➔</span>
                      <span className="text-slate-200 font-semibold truncate">{source?.title || conn.fromId}</span>
                      <span className="text-slate-500">➔</span>
                      <span className="text-slate-400 italic">"{conn.label}"</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-black border border-slate-700 text-slate-400">
                        {evType === 'documented' ? 'Solid' : evType === 'proposed' ? 'Dashed' : 'Dotted Alt'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        soundEngine.playClick();
                        onDeleteConnection(conn.id);
                      }}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      title="Remove connection link"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {connectedOut.length === 0 && connectedIn.length === 0 && (
                <div className="text-slate-600 text-xs py-2 italic text-center border border-dashed border-slate-800 rounded">
                  No line connections linked to this event yet. Use the connector tool below or drag connection handles on the grid canvas!
                </div>
              )}
            </div>

            {/* Quick Connect to Another Event Form with Evidence Type Selection */}
            {otherEvents.length > 0 && (
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  LINK TO ANOTHER EVENT WITH EVIDENCE TYPE:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={targetEventToConnect}
                    onChange={(e) => setTargetEventToConnect(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-400 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="">-- Select Target Event --</option>
                    {otherEvents.map((oe) => (
                      <option key={oe.id} value={oe.id}>
                        [{oe.time}] {oe.title}
                      </option>
                    ))}
                  </select>

                  <select
                    value={connectionEvidenceType}
                    onChange={(e) => setConnectionEvidenceType(e.target.value as EvidenceType)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-400 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="documented">Solid line: Documented relationship</option>
                    <option value="proposed">Dashed line: Proposed relationship</option>
                    <option value="chronological">Dotted line: Chronological association only</option>
                  </select>

                  <div className="flex items-center space-x-1.5">
                    <input
                      type="text"
                      value={connectionLabel}
                      onChange={(e) => setConnectionLabel(e.target.value)}
                      placeholder="Label (e.g. Preceded, Led to)..."
                      className="flex-1 min-w-0 bg-slate-900 border border-slate-800 focus:border-emerald-400 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                    />

                    <button
                      type="button"
                      disabled={!targetEventToConnect}
                      onClick={handleCreateConnection}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded text-xs transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Link
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div 
          className="px-5 py-3 border-t bg-black/60 flex items-center justify-between shrink-0 text-xs"
          style={{ borderTopColor: (color || palette.primary) + '30' }}
        >
          <div className="text-slate-500 text-[11px] hidden sm:block">
            Auto-sync active • Changes save instantly to case timeline
          </div>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded text-xs transition-colors cursor-pointer ml-auto flex items-center space-x-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Done & Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};
