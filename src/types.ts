/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TerminalTheme = 'nightfly' | 'mire' | 'nephila' | 'sepulchre' | 'sepulchral_nx';

export type EventStatus = 'lead' | 'unverified' | 'confirmed' | 'critical' | 'redacted';

export type ToolMode = 'select' | 'pan' | 'place' | 'connect' | 'erase';

export interface GridConfig {
  columns: number;
  rows: number;
  snapToGrid: boolean;
  showGridLines: boolean;
  showCoordinates: boolean;
  opacity: number;
}

export interface TimelineEvent {
  id: string;
  title: string;
  time: string; // e.g. "02:14:00 AM", "T+01:30", "2026-09-24 14:30"
  description: string; // Rich typeable description & notes
  icon: string; // Lucide icon name
  color: string; // Accent color hex
  status: EventStatus;
  gridX: number; // 0-indexed column
  gridY: number; // 0-indexed row
  tags: string[];
  location?: string;
  suspectRef?: string;
  folderId?: string; // Optional project folder reference
  sourceExcerpt?: string; // Preserved local original source text / excerpt
  importBatchId?: string; // ID of the local AI import batch
  categoryType?: AutofillCategory; // Event classification type
}

export type AutofillCategory = 'EVENT' | 'DETECTION' | 'RESPONSE' | 'DISCLOSURE' | 'POLICY' | 'HYPOTHESIS';
export type DatePrecision = 'EXACT' | 'DAY' | 'MONTH' | 'YEAR' | 'APPROXIMATE' | 'UNKNOWN';
export type DateType = 'INCIDENT' | 'DISCOVERY' | 'DISCLOSURE' | 'UNKNOWN';
export type EvidenceBasis = 'TELEMETRY' | 'REPORT_CLAIM' | 'ANALYST_HYPOTHESIS';
export type AutofillRelationship = 'DOCUMENTED' | 'CHRONOLOGICAL' | 'HYPOTHESIZED';

export interface ExtractedEventItem {
  id: string; // Local preview ID
  category: AutofillCategory;
  title: string;
  description: string;
  date: string; // e.g. "2026-09-24 14:00" or "UNKNOWN"
  datePrecision: DatePrecision;
  dateType: DateType;
  namedActors: string[];
  organizations: string[];
  sourceReferences: string[];
  claimAttribution?: string | null;
  evidenceBasis: EvidenceBasis;
}

export interface ExtractedConnectionItem {
  id: string;
  sourceIndex: number; // Index in events array
  targetIndex: number; // Index in events array
  relationship: AutofillRelationship;
  label: string;
  basis: string;
}

export interface ExtractedAutofillResult {
  events: ExtractedEventItem[];
  connections: ExtractedConnectionItem[];
  originalText: string;
  modelUsed: string;
  timestamp: string;
  rawResponse?: string;
}

/**
 * Evidence Type for Line Connections:
 * - 'documented': Solid line - Documented relationship (confirmed causality or direct factual link)
 * - 'proposed': Dashed line - Proposed relationship (investigative theory or hypothesis)
 * - 'chronological': Dotted alternating color of each associated event line - Chronological association only (events happened in sequence without verified causation)
 */
export type EvidenceType = 'documented' | 'proposed' | 'chronological';

export interface EventConnection {
  id: string;
  fromId: string;
  toId: string;
  label: string; // e.g. "Triggered", "Led to", "Seen at", "Funded by", "Corroborates"
  evidenceType: EvidenceType;
  color?: string; // Optional custom override color
  bidirectional?: boolean;
}

/**
 * Project Folder to group cases and organize event sub-clusters
 */
export interface ProjectFolder {
  id: string;
  name: string;
  color: string;
  description: string;
  createdAt: string;
}

/**
 * Snapshot / Save State of the investigation board
 */
export interface SaveState {
  id: string;
  name: string;
  slotNumber: number; // 1 to 5
  timestamp: string;
  caseFile: CaseFile;
  thumbnailSummary?: string;
}

export interface CaseFile {
  id: string;
  title: string;
  caseNumber: string;
  leadInvestigator: string;
  description: string;
  folderId?: string; // Project folder assignment
  events: TimelineEvent[];
  connections: EventConnection[];
}

export interface ColorGradingConfig {
  crtScanlines: boolean;
  chromaticAberration: boolean;
  vignette: boolean;
  noiseLevel: number;
  bloomIntensity: number; // 0 (off) to 100 (high glow)
  bloomColor?: string; // 'auto' | hex color string like '#05ffa1', '#00f0ff', etc.
  bloomPulse?: boolean; // Pulsing animated bloom on borders
  blockBorderStyle?: 'cyber' | 'solid' | 'double' | 'bracket'; // Block border style
}

export interface NumberKeyNodeColor {
  key: string;
  slot: number; // 1 to 10
  name: string;
  hex: string;
  description: string;
}

/**
 * 10 Defined Colors for Number Keys 1-0:
 * Key 1: Neon Emerald (#05ffa1)
 * Key 2: Sky Cyan (#38bdf8)
 * Key 3: Amber Gold (#ffb000)
 * Key 4: Rose Pink (#f43f5e)
 * Key 5: Cyber Orchid (#c084fc)
 * Key 6: Aquamarine (#2dd4bf)
 * Key 7: Solar Orange (#fb923c)
 * Key 8: Crimson Hazard (#ef4444)
 * Key 9: Electric Lime (#a3e635)
 * Key 0: Cobalt Flux (#818cf8)
 */
export const NUMBER_KEY_COLORS: NumberKeyNodeColor[] = [
  { key: '1', slot: 1, name: 'Neon Emerald', hex: '#05ffa1', description: 'Primary Vector / Infiltration Entry' },
  { key: '2', slot: 2, name: 'Sky Cyan', hex: '#38bdf8', description: 'Signal Telemetry / Access Point' },
  { key: '3', slot: 3, name: 'Amber Gold', hex: '#ffb000', description: 'Security Bypass / Breached Perimeter' },
  { key: '4', slot: 4, name: 'Rose Pink', hex: '#f43f5e', description: 'Critical Core / Data Exfiltration' },
  { key: '5', slot: 5, name: 'Cyber Orchid', hex: '#c084fc', description: 'SIGINT Intercept / Radio Burst' },
  { key: '6', slot: 6, name: 'Aquamarine', hex: '#2dd4bf', description: 'Grid Disruption / Substation Pulse' },
  { key: '7', slot: 7, name: 'Solar Orange', hex: '#fb923c', description: 'Physical Evacuation / Transit Corridor' },
  { key: '8', slot: 8, name: 'Crimson Hazard', hex: '#ef4444', description: 'Confirmed Casualty / Lethal Breach' },
  { key: '9', slot: 9, name: 'Electric Lime', hex: '#a3e635', description: 'Surveillance Node / Asset Sightings' },
  { key: '0', slot: 10, name: 'Cobalt Flux', hex: '#818cf8', description: 'Exfiltration Vehicle / Terminal Target' },
];

/**
 * Returns the color defined for a starting node slot (0 to 9, mapping to keys '1'-'0')
 */
export const getNumberKeyColor = (index: number): string => {
  const item = NUMBER_KEY_COLORS[index % NUMBER_KEY_COLORS.length];
  return item ? item.hex : '#05ffa1';
};

/**
 * Identifies starting nodes (root nodes with no incoming connections first, followed by downstream nodes in order)
 */
export const getStartingNodes = (events: TimelineEvent[], connections: EventConnection[] = []): TimelineEvent[] => {
  if (!events || events.length === 0) return [];

  // Root origin nodes: events that are NOT the target of any connection wire (in-degree = 0)
  const rootNodes = events.filter(e => !connections.some(c => c.toId === e.id));
  
  // Downstream connected nodes
  const downstreamNodes = events.filter(e => connections.some(c => c.toId === e.id));

  // Combine roots first, then downstream nodes, capped at 10 slots
  return [...rootNodes, ...downstreamNodes].slice(0, 10);
};
