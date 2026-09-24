/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  FileText,
  AlertTriangle,
  User,
  MapPin,
  Clock,
  Terminal,
  ShieldAlert,
  Radio,
  Phone,
  Key,
  Database,
  Car,
  CreditCard,
  Eye,
  Camera,
  Skull,
  Flame,
  Zap,
  Lock,
  Cpu,
  Crosshair,
  Briefcase,
  Search,
  Fingerprint,
  HardDrive,
  Layers,
  LucideIcon
} from 'lucide-react';

export interface IconDefinition {
  name: string;
  label: string;
  category: 'evidence' | 'threat' | 'entity' | 'tech' | 'action';
  component: LucideIcon;
}

export const AVAILABLE_ICONS: IconDefinition[] = [
  { name: 'FileText', label: 'Document / Dossier', category: 'evidence', component: FileText },
  { name: 'Fingerprint', label: 'Biometrics / Forensic', category: 'evidence', component: Fingerprint },
  { name: 'Camera', label: 'Photo Evidence', category: 'evidence', component: Camera },
  { name: 'Search', label: 'Investigation Lead', category: 'evidence', component: Search },
  { name: 'AlertTriangle', label: 'Security Alert', category: 'threat', component: AlertTriangle },
  { name: 'ShieldAlert', label: 'Breach Detected', category: 'threat', component: ShieldAlert },
  { name: 'Skull', label: 'Casualty / Critical', category: 'threat', component: Skull },
  { name: 'Flame', label: 'Arson / Hazard', category: 'threat', component: Flame },
  { name: 'Zap', label: 'Power / EMP Surge', category: 'threat', component: Zap },
  { name: 'Crosshair', label: 'Target Intercept', category: 'threat', component: Crosshair },
  { name: 'User', label: 'Suspect / Operative', category: 'entity', component: User },
  { name: 'MapPin', label: 'Crime Scene / Location', category: 'entity', component: MapPin },
  { name: 'Briefcase', label: 'Corporate Syndicate', category: 'entity', component: Briefcase },
  { name: 'Car', label: 'Transit / Getaway', category: 'entity', component: Car },
  { name: 'Clock', label: 'Timestamp Marker', category: 'action', component: Clock },
  { name: 'Phone', label: 'Wiretap / Comm Call', category: 'action', component: Phone },
  { name: 'Radio', label: 'Intercepted Signal', category: 'action', component: Radio },
  { name: 'CreditCard', label: 'Financial Trail', category: 'action', component: CreditCard },
  { name: 'Key', label: 'Stolen Credential', category: 'action', component: Key },
  { name: 'Lock', label: 'Vault Lockdown', category: 'action', component: Lock },
  { name: 'Terminal', label: 'Cyber Terminal / Exploit', category: 'tech', component: Terminal },
  { name: 'Database', label: 'Data Exfiltration', category: 'tech', component: Database },
  { name: 'HardDrive', label: 'Physical Storage', category: 'tech', component: HardDrive },
  { name: 'Eye', label: 'CCTV Surveillance', category: 'tech', component: Eye },
  { name: 'Cpu', label: 'AI Anomaly', category: 'tech', component: Cpu },
];

export const ICON_MAP: Record<string, LucideIcon> = AVAILABLE_ICONS.reduce((acc, curr) => {
  acc[curr.name] = curr.component;
  return acc;
}, {} as Record<string, LucideIcon>);

export const renderEventIcon = (name: string, className = 'w-5 h-5') => {
  const Comp = ICON_MAP[name] || FileText;
  return <Comp className={className} />;
};
