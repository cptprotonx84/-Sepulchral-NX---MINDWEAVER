/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';
import { 
  AutofillCategory, 
  DatePrecision, 
  DateType, 
  EvidenceBasis, 
  AutofillRelationship, 
  ExtractedEventItem, 
  ExtractedConnectionItem, 
  ExtractedAutofillResult 
} from '../types';

export const DEFAULT_OLLAMA_HOST = 'http://localhost:11434';
export const PROXY_OLLAMA_HOST = '/api/ollama';

// Zod Schema for validation of raw model output
export const RawExtractedEventSchema = z.object({
  category: z.enum(['EVENT', 'DETECTION', 'RESPONSE', 'DISCLOSURE', 'POLICY', 'HYPOTHESIS']),
  title: z.string().min(1, 'Title cannot be empty'),
  description: z.string().default(''),
  date: z.string().default('UNKNOWN'),
  datePrecision: z.enum(['EXACT', 'DAY', 'MONTH', 'YEAR', 'APPROXIMATE', 'UNKNOWN']).default('UNKNOWN'),
  dateType: z.enum(['INCIDENT', 'DISCOVERY', 'DISCLOSURE', 'UNKNOWN']).default('UNKNOWN'),
  namedActors: z.array(z.string()).default([]),
  organizations: z.array(z.string()).default([]),
  sourceReferences: z.array(z.string()).default([]),
  claimAttribution: z.string().nullable().optional(),
  evidenceBasis: z.enum(['TELEMETRY', 'REPORT_CLAIM', 'ANALYST_HYPOTHESIS']).default('REPORT_CLAIM'),
});

export const RawExtractedConnectionSchema = z.object({
  sourceIndex: z.number().int().nonnegative(),
  targetIndex: z.number().int().nonnegative(),
  relationship: z.enum(['DOCUMENTED', 'CHRONOLOGICAL', 'HYPOTHESIZED']),
  label: z.string().default('Relates to'),
  basis: z.string().default(''),
});

export const RawAutofillPayloadSchema = z.object({
  events: z.array(RawExtractedEventSchema).default([]),
  connections: z.array(RawExtractedConnectionSchema).default([]),
});

export type RawAutofillPayload = z.infer<typeof RawAutofillPayloadSchema>;

// Explicit JSON schema passed directly to Ollama's `format` parameter
export const OLLAMA_JSON_FORMAT_SCHEMA = {
  type: 'object',
  properties: {
    events: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['EVENT', 'DETECTION', 'RESPONSE', 'DISCLOSURE', 'POLICY', 'HYPOTHESIS'],
            description: 'Strict event classification category'
          },
          title: { type: 'string', description: 'Concise title for the event node' },
          description: { type: 'string', description: 'Factual details directly stated in text' },
          date: { type: 'string', description: 'ISO date, timestamp, or UNKNOWN if not provided' },
          datePrecision: {
            type: 'string',
            enum: ['EXACT', 'DAY', 'MONTH', 'YEAR', 'APPROXIMATE', 'UNKNOWN']
          },
          dateType: {
            type: 'string',
            enum: ['INCIDENT', 'DISCOVERY', 'DISCLOSURE', 'UNKNOWN'],
            description: 'Distinguish incident occurrence date from discovery or public disclosure dates'
          },
          namedActors: {
            type: 'array',
            items: { type: 'string' },
            description: 'Individual persons, aliases, or handles explicitly named in text'
          },
          organizations: {
            type: 'array',
            items: { type: 'string' },
            description: 'Companies, agencies, or threat groups explicitly named in text'
          },
          sourceReferences: {
            type: 'array',
            items: { type: 'string' },
            description: 'Exact log files, audit IDs, telemetry artifacts, or citations explicitly provided in source text'
          },
          claimAttribution: {
            type: ['string', 'null'],
            description: 'Who reported or claimed this, if based on an external claim rather than direct telemetry'
          },
          evidenceBasis: {
            type: 'string',
            enum: ['TELEMETRY', 'REPORT_CLAIM', 'ANALYST_HYPOTHESIS']
          }
        },
        required: [
          'category',
          'title',
          'description',
          'date',
          'datePrecision',
          'dateType',
          'namedActors',
          'organizations',
          'sourceReferences',
          'evidenceBasis'
        ]
      }
    },
    connections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          sourceIndex: { type: 'integer', description: '0-based index of source event in events array' },
          targetIndex: { type: 'integer', description: '0-based index of target event in events array' },
          relationship: {
            type: 'string',
            enum: ['DOCUMENTED', 'CHRONOLOGICAL', 'HYPOTHESIZED'],
            description: 'DOCUMENTED for proven causation/audit link; CHRONOLOGICAL for sequential occurrence without causal proof; HYPOTHESIZED for theories'
          },
          label: { type: 'string', description: 'Short relationship label e.g. Triggered, Logged, Disclosed' },
          basis: { type: 'string', description: 'Specific evidence or quote from text supporting this link' }
        },
        required: ['sourceIndex', 'targetIndex', 'relationship', 'label', 'basis']
      }
    }
  },
  required: ['events', 'connections']
};

export const OLLAMA_EXTRACTION_SYSTEM_PROMPT = `You are a forensic cyber intelligence extractor for the Sepulchral{NX} Cyber Event Connector board.
Your duty is to extract structured timeline events and evidentiary relationships from user-supplied incident chronologies, threat reports, or operational logs.

STRICT EXTRACTION RULES (MANDATORY):
1. SEPARATE CATEGORIES:
   - EVENT: Operational incidents, intrusions, actions, telemetry breaches, lateral movements.
   - DETECTION: Alerts raised, sensor triggers, EDR hits, SIEM queries, anomaly alerts.
   - RESPONSE: Countermeasures, firewall rules, containment, account revokes, patches applied.
   - DISCLOSURE: Public advisories, customer notifications, SEC 8-K filings, press releases.
   - POLICY: Compliance rules, access control standards, operational guidelines referenced.
   - HYPOTHESIS: Uncorroborated theories, working assumptions, or investigative conjectures.

2. NEVER INVENT INFORMATION:
   - Never invent timestamps, hours, or dates. If missing from the text, write "UNKNOWN" and set datePrecision to "UNKNOWN".
   - Distinguish INCIDENT date from DISCOVERY date and DISCLOSURE date.
   - Never invent source URLs, CVEs, IP addresses, causal links, or actor identities.
   - Missing information must remain UNKNOWN.
   - Do NOT use external pre-training knowledge. Extract ONLY what is explicitly stated in the provided text.

3. CAUSALITY vs CHRONOLOGY vs HYPOTHESIS:
   - "DOCUMENTED": Use ONLY when the text explicitly asserts proven causality, forensic proof, or direct execution link.
   - "CHRONOLOGICAL": Use when events simply occurred sequentially in time, but the text does NOT prove event A caused event B. Sequence is NEVER assumed to be causation!
   - "HYPOTHESIZED": Use when the relationship is speculative, suspected, or claimed as a theory.

4. ATTRIBUTION & EVIDENCE BASIS:
   - A news report or third-party claim stating an event occurred is "REPORT_CLAIM", NOT raw "TELEMETRY".
   - If an event is an attributed claim, populate "claimAttribution" with the claimant (e.g., "Reported by CISA" or "Alleged by anonymous insider").

Respond ONLY with valid JSON strictly adhering to the JSON schema.`;

/**
 * Checks connection and retrieves installed models from local Ollama instance.
 * Automatically attempts direct fetch to http://localhost:11434 and falls back to /api/ollama proxy if blocked by CORS.
 */
export async function fetchInstalledOllamaModels(customHost?: string): Promise<{ models: string[]; effectiveHost: string }> {
  const host = customHost?.trim() || DEFAULT_OLLAMA_HOST;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  // Attempt direct fetch first
  try {
    const res = await fetch(`${host}/api/tags`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const models = (data.models || []).map((m: any) => m.name || m.model).filter(Boolean);
      return { models, effectiveHost: host };
    }
  } catch (directErr) {
    // If direct fails (e.g. CORS restriction from browser iframe/origin to localhost), try local proxy
    try {
      const proxyRes = await fetch(`${PROXY_OLLAMA_HOST}/tags`);
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        const models = (data.models || []).map((m: any) => m.name || m.model).filter(Boolean);
        return { models, effectiveHost: PROXY_OLLAMA_HOST };
      }
    } catch (proxyErr) {
      // Both failed
    }
  }

  throw new Error(`Ollama is unreachable at ${host}`);
}

export interface ExtractEventsOptions {
  text: string;
  model: string;
  host?: string;
  onProgress?: (status: string) => void;
  signal?: AbortSignal;
}

/**
 * Sends source text to local Ollama chat API with stream:false, JSON schema format, and temperature:0.1.
 * Validates output using Zod before returning clean ExtractedAutofillResult.
 */
export async function extractEventsWithOllama(options: ExtractEventsOptions): Promise<ExtractedAutofillResult> {
  const { text, model, host = DEFAULT_OLLAMA_HOST, onProgress, signal } = options;

  if (!text.trim()) {
    throw new Error('Pasted source text cannot be empty.');
  }

  if (!model.trim()) {
    throw new Error('No local Ollama model selected.');
  }

  onProgress?.('Preparing extraction schema & local prompt...');

  const requestBody = {
    model: model.trim(),
    stream: false,
    format: OLLAMA_JSON_FORMAT_SCHEMA,
    options: {
      temperature: 0.1, // low temperature as specified
      top_p: 0.9,
    },
    messages: [
      {
        role: 'system',
        content: OLLAMA_EXTRACTION_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: `SOURCE INCIDENT TEXT TO EXTRACT:\n"""\n${text}\n"""\n\nExtract all distinct events, detections, responses, disclosures, policies, hypotheses, and relationships according to the strict rules. Do not hallucinate.`
      }
    ]
  };

  onProgress?.(`Contacting Ollama at ${host} using model ${model}...`);

  let responseData: any = null;
  let rawResponseText = '';

  // Helper to make request
  const makeRequest = async (targetEndpoint: string) => {
    const res = await fetch(targetEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`Ollama HTTP ${res.status}: ${errText}`);
    }

    return await res.json();
  };

  try {
    // Try direct endpoint first
    responseData = await makeRequest(`${host}/api/chat`);
  } catch (err: any) {
    if (signal?.aborted) {
      throw new Error('Extraction cancelled by user.');
    }
    // If direct failed and host is localhost, try local proxy route
    if (host === DEFAULT_OLLAMA_HOST) {
      onProgress?.('Direct access restricted by browser; trying local server proxy...');
      try {
        responseData = await makeRequest(`${PROXY_OLLAMA_HOST}/chat`);
      } catch (proxyErr: any) {
        throw new Error(
          `Failed to connect to Ollama. Make sure Ollama is running at ${host} and model '${model}' is installed.\nDetails: ${err.message || err}`
        );
      }
    } else {
      throw err;
    }
  }

  onProgress?.('Parsing and validating model output against forensic schema...');

  // Extract message content
  const messageContent = responseData?.message?.content;
  if (!messageContent) {
    throw new Error('Ollama returned empty response content.');
  }

  rawResponseText = typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent);

  // Parse JSON
  let parsedJson: any;
  try {
    parsedJson = JSON.parse(rawResponseText);
  } catch (parseErr: any) {
    // Sometimes models wrap json in markdown code fences
    const jsonMatch = rawResponseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        parsedJson = JSON.parse(jsonMatch[1]);
      } catch (e) {
        throw new Error(`Malformed JSON output from model: ${parseErr.message}`);
      }
    } else {
      throw new Error(`Malformed JSON output from model: ${parseErr.message}`);
    }
  }

  // Runtime Zod schema validation
  const validationResult = RawAutofillPayloadSchema.safeParse(parsedJson);
  if (!validationResult.success) {
    const issues = validationResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`Validation Error: Model output violated schema constraints: ${issues}`);
  }

  const validatedData = validationResult.data;

  // Transform validated records into preview items
  const extractedEvents: ExtractedEventItem[] = validatedData.events.map((evt, idx) => ({
    id: `ext_evt_${Date.now()}_${idx}`,
    category: evt.category as AutofillCategory,
    title: evt.title.trim() || `Event #${idx + 1}`,
    description: evt.description.trim(),
    date: evt.date.trim() || 'UNKNOWN',
    datePrecision: evt.datePrecision as DatePrecision,
    dateType: evt.dateType as DateType,
    namedActors: Array.isArray(evt.namedActors) ? evt.namedActors.filter(Boolean) : [],
    organizations: Array.isArray(evt.organizations) ? evt.organizations.filter(Boolean) : [],
    sourceReferences: Array.isArray(evt.sourceReferences) ? evt.sourceReferences.filter(Boolean) : [],
    claimAttribution: evt.claimAttribution || null,
    evidenceBasis: evt.evidenceBasis as EvidenceBasis,
  }));

  const extractedConnections: ExtractedConnectionItem[] = validatedData.connections
    .filter(conn => 
      conn.sourceIndex >= 0 && 
      conn.sourceIndex < extractedEvents.length && 
      conn.targetIndex >= 0 && 
      conn.targetIndex < extractedEvents.length &&
      conn.sourceIndex !== conn.targetIndex
    )
    .map((conn, idx) => ({
      id: `ext_conn_${Date.now()}_${idx}`,
      sourceIndex: conn.sourceIndex,
      targetIndex: conn.targetIndex,
      relationship: conn.relationship as AutofillRelationship,
      label: conn.label.trim() || 'Relates to',
      basis: conn.basis.trim()
    }));

  return {
    events: extractedEvents,
    connections: extractedConnections,
    originalText: text,
    modelUsed: model,
    timestamp: new Date().toISOString(),
    rawResponse: rawResponseText
  };
}
