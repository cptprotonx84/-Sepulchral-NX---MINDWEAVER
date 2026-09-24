/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CaseFile } from '../types';

export const PRESET_CASE_SYNDICATE: CaseFile = {
  id: 'case_synthetix_0088',
  title: 'OPERATION NIGHTFALL // CORP EXFILTRATION',
  caseNumber: 'NX-CASE #0088-DELTA',
  leadInvestigator: 'DET. V. CHEN (CYBER-CRIME DIVISION)',
  description: 'Chronological reconstruction of the midnight intrusion at Synthetix Bio-Cybernetics Vault 4.',
  events: [
    {
      id: 'evt_1',
      title: 'Perimeter Drone Feed Looped',
      time: '01:14:22 AM',
      description: 'North perimeter surveillance drone #04 was hijacked using a high-gain microwave transmitter. The live camera feed was replaced with a pre-recorded 15-minute static loop of the empty courtyard. Guard patrol saw no anomalies during their 01:15 checkpoint.',
      icon: 'Eye',
      color: '#05ffa1', // Key 1: Neon Emerald
      status: 'confirmed',
      gridX: 1,
      gridY: 1,
      tags: ['Surveillance', 'Infiltration', 'Perimeter'],
      location: 'Sector 4 North Gate',
      suspectRef: 'Operative "Ghost"'
    },
    {
      id: 'evt_2',
      title: 'Sub-Level 3 Biometric Override',
      time: '01:28:45 AM',
      description: 'Stolen RFID cryptographic keycard belonging to Dr. Aris Thorne swiped at secure elevator airlock. Biometric retinal scanner was spoofed using high-resolution infrared projector projection.',
      icon: 'Key',
      color: '#38bdf8', // Key 2: Sky Cyan
      status: 'critical',
      gridX: 3,
      gridY: 1,
      tags: ['Access Breach', 'Sub-Level 3', 'Keycard'],
      location: 'Elevator Shaft C',
      suspectRef: 'Inside Asset or Cloned ID'
    },
    {
      id: 'evt_3',
      title: 'Deep Core Data Vault Exfiltration',
      time: '01:42:10 AM',
      description: 'Direct physical cable tapped into the Cold Vault optical bus. 4.2 Terabytes of encrypted synthetic neural architectures cloned onto an insulated solid-state cryo-drive. Intrusion signature matches BlackCipher zero-day exploit.',
      icon: 'Terminal',
      color: '#ffb000', // Key 3: Amber Gold
      status: 'critical',
      gridX: 2,
      gridY: 3,
      tags: ['Data Theft', 'Neural Core', 'Zero-Day'],
      location: 'Vault 4 Server Rack 12',
      suspectRef: 'Lead Infiltrator'
    },
    {
      id: 'evt_4',
      title: 'Encrypted Burst Signal Intercepted',
      time: '01:51:03 AM',
      description: 'SIGINT sensors picked up an ultra-tight burst transmission on military frequency 442.85 MHz beamed upward toward low-earth orbit comm relay SAT-9. Message payload appears steganographically hidden in weather telemetry.',
      icon: 'Radio',
      color: '#f43f5e', // Key 4: Rose Pink
      status: 'unverified',
      gridX: 5,
      gridY: 1,
      tags: ['SIGINT', 'Satellite', 'Comms'],
      location: 'Rooftop Array',
      suspectRef: 'Offshore Handler'
    },
    {
      id: 'evt_5',
      title: 'Substation EMP Surge / Blackout',
      time: '02:04:18 AM',
      description: 'A localized flux-compression magnetic pulse was triggered in Substation Sub-Alpha. All secondary grid lighting and perimeter infrared lasers failed simultaneously, creating a 180-second total darkness escape corridor.',
      icon: 'Zap',
      color: '#c084fc', // Key 5: Cyber Orchid
      status: 'confirmed',
      gridX: 4,
      gridY: 3,
      tags: ['EMP', 'Blackout', 'Sabotage'],
      location: 'Substation 09',
      suspectRef: 'Demolitions Specialist'
    },
    {
      id: 'evt_6',
      title: 'Armored Aerodyne Getaway',
      time: '02:18:55 AM',
      description: 'Unmarked matte-black hover transport vehicle spotted accelerating east along Lower Expressway 7 without flight beacon transponder. Traffic camera at Junction 12 snapped a partial chassis plate before traffic cam crashed.',
      icon: 'Car',
      color: '#2dd4bf', // Key 6: Aquamarine
      status: 'lead',
      gridX: 6,
      gridY: 3,
      tags: ['Getaway', 'Transit', 'Junction 12'],
      location: 'Lower Expressway 7',
      suspectRef: 'Getaway Pilot'
    }
  ],
  connections: [
    {
      id: 'conn_1_2',
      fromId: 'evt_1',
      toId: 'evt_2',
      label: 'Bypassed Exterior To Reach',
      evidenceType: 'documented',
      color: '#05ffa1'
    },
    {
      id: 'conn_2_3',
      fromId: 'evt_2',
      toId: 'evt_3',
      label: 'Granted Physical Access To',
      evidenceType: 'documented',
      color: '#ffb000'
    },
    {
      id: 'conn_3_4',
      fromId: 'evt_3',
      toId: 'evt_4',
      label: 'Exfiltrated Key Payload',
      evidenceType: 'proposed',
      color: '#c084fc'
    },
    {
      id: 'conn_3_5',
      fromId: 'evt_3',
      toId: 'evt_5',
      label: 'Chronological Follow-up',
      evidenceType: 'chronological',
      color: '#ef4444'
    },
    {
      id: 'conn_5_6',
      fromId: 'evt_5',
      toId: 'evt_6',
      label: 'Covered Escape Route',
      evidenceType: 'proposed',
      color: '#38bdf8'
    }
  ]
};

export const BLANK_CASE: CaseFile = {
  id: 'case_new',
  title: 'UNTITLED TIMELINE INVESTIGATION',
  caseNumber: 'NX-CASE #0001-ALPHA',
  leadInvestigator: 'INVESTIGATOR ON DUTY',
  description: 'Place events on the grid and draw line connectors between them to map out the sequence of events.',
  events: [],
  connections: []
};
