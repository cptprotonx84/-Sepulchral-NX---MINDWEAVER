import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to safely synthesize a mock sci-fi module locally when API is unavailable or fails
  function generateFallbackModule(idea: string, currentWidgets: any[], gridColumns: number, gridRows: number) {
    const normalized = idea.toLowerCase();
    
    let type: 'telemetry' | 'radar' | 'terminal' | 'audio_spectrum' = 'telemetry';
    let allowedIcons = ['Activity', 'Zap', 'Cpu', 'BatteryCharging', 'Flame'];
    
    if (
      normalized.includes('radar') || 
      normalized.includes('scan') || 
      normalized.includes('track') || 
      normalized.includes('orbit') || 
      normalized.includes('target') || 
      normalized.includes('def') || 
      normalized.includes('sector') || 
      normalized.includes('coord') || 
      normalized.includes('sonar') || 
      normalized.includes('satellite') ||
      normalized.includes('map') ||
      normalized.includes('proximity')
    ) {
      type = 'radar';
      allowedIcons = ['Compass', 'Eye', 'Radio', 'AlertTriangle', 'ShieldCheck'];
    } else if (
      normalized.includes('terminal') || 
      normalized.includes('log') || 
      normalized.includes('console') || 
      normalized.includes('warn') || 
      normalized.includes('compile') || 
      normalized.includes('error') || 
      normalized.includes('database') || 
      normalized.includes('node') || 
      normalized.includes('file') || 
      normalized.includes('shell') || 
      normalized.includes('instance') || 
      normalized.includes('trace') || 
      normalized.includes('memory') || 
      normalized.includes('buffer')
    ) {
      type = 'terminal';
      allowedIcons = ['Terminal', 'Database', 'Cpu', 'Settings', 'ShieldCheck'];
    } else if (
      normalized.includes('audio') || 
      normalized.includes('spectrum') || 
      normalized.includes('vocal') || 
      normalized.includes('acoustic') || 
      normalized.includes('music') || 
      normalized.includes('frequency') || 
      normalized.includes('sound') || 
      normalized.includes('hum') || 
      normalized.includes('comm') || 
      normalized.includes('wave') || 
      normalized.includes('signal') || 
      normalized.includes('resonator')
    ) {
      type = 'audio_spectrum';
      allowedIcons = ['Radio', 'Volume2', 'Tv', 'BarChart2', 'Atom'];
    } else {
      type = 'telemetry';
      allowedIcons = ['Activity', 'Zap', 'Cpu', 'BatteryCharging', 'Flame', 'Atom'];
    }

    let w = 2;
    let h = 2;
    if (type === 'telemetry') {
      w = 4;
      h = 2;
    } else if (type === 'radar') {
      w = 2;
      h = 2;
    } else if (type === 'terminal') {
      w = 4;
      h = 3;
    } else if (type === 'audio_spectrum') {
      w = 3;
      h = 2;
    }

    if (w > gridColumns) w = gridColumns;
    if (h > gridRows) h = gridRows;

    let x = 1;
    let y = 1;
    let found = false;

    for (let r = 1; r <= gridRows - h + 1; r++) {
      for (let c = 1; c <= gridColumns - w + 1; c++) {
        let overlap = false;
        for (const widget of currentWidgets) {
          const wx = widget.x || 1;
          const wy = widget.y || 1;
          const ww = widget.w || 2;
          const wh = widget.h || 2;

          const isOverlapping = !(
            (c + w - 1) < wx ||
            c > (wx + ww - 1) ||
            (r + h - 1) < wy ||
            r > (wy + wh - 1)
          );

          if (isOverlapping) {
            overlap = true;
            break;
          }
        }

        if (!overlap) {
          x = c;
          y = r;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      x = Math.max(1, Math.min(gridColumns - w + 1, 1));
      y = Math.max(1, Math.min(gridRows - h + 1, 1));
    }

    const icon = allowedIcons[Math.floor(Math.random() * allowedIcons.length)] || 'Activity';

    let glowColor = '#3b82f6';
    const colors = ['#05ffa1', '#3b82f6', '#f43f5e', '#eab308', '#a855f7'];
    if (
      normalized.includes('error') || 
      normalized.includes('warning') || 
      normalized.includes('danger') || 
      normalized.includes('hostile') || 
      normalized.includes('hazard') || 
      normalized.includes('critical') || 
      normalized.includes('alert')
    ) {
      glowColor = '#f43f5e';
    } else if (
      normalized.includes('stable') || 
      normalized.includes('safe') || 
      normalized.includes('emerald') || 
      normalized.includes('green') || 
      normalized.includes('stabilizer') ||
      normalized.includes('normal')
    ) {
      glowColor = '#05ffa1';
    } else if (
      normalized.includes('warn') || 
      normalized.includes('amber') || 
      normalized.includes('gold') || 
      normalized.includes('yellow') || 
      normalized.includes('fusion') ||
      normalized.includes('solar')
    ) {
      glowColor = '#eab308';
    } else if (
      normalized.includes('purple') || 
      normalized.includes('gravity') || 
      normalized.includes('quantum') || 
      normalized.includes('psionic') || 
      normalized.includes('exotic')
    ) {
      glowColor = '#a855f7';
    } else {
      let hash = 0;
      for (let i = 0; i < idea.length; i++) {
        hash = idea.charCodeAt(i) + ((hash << 5) - hash);
      }
      glowColor = colors[Math.abs(hash) % colors.length];
    }

    let rawName = idea
      .toUpperCase()
      .replace(/[^A-Z0-9\s_]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    
    if (!rawName || rawName.length < 3) {
      rawName = `${type.toUpperCase()}_INSTANCE_${Math.floor(Math.random() * 9000 + 1000)}`;
    } else {
      if (rawName.length > 25) {
        rawName = rawName.substring(0, 25);
      }
    }

    const name = rawName;
    const explanation = `[Local Fallback active: GEMINI_API_KEY is not set] Locally resolved hardware ${type} module '${name}' to align with your concept: "${idea}" without requiring remote services.`;

    return {
      name,
      type,
      x,
      y,
      w,
      h,
      icon,
      glowColor,
      explanation
    };
  }

  // Proxy routes for local Ollama to bypass browser iframe / CORS restrictions seamlessly
  app.get('/api/ollama/tags', async (_req, res) => {
    try {
      const ollamaRes = await fetch('http://localhost:11434/api/tags');
      const data = await ollamaRes.json();
      res.json(data);
    } catch (err: any) {
      res.status(503).json({ error: 'Ollama not reachable at http://localhost:11434', details: err.message });
    }
  });

  app.post('/api/ollama/chat', async (req, res) => {
    try {
      const ollamaRes = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      const data = await ollamaRes.json();
      res.status(ollamaRes.status).json(data);
    } catch (err: any) {
      res.status(503).json({ error: 'Ollama not reachable at http://localhost:11434', details: err.message });
    }
  });

  // API Route for AI Module Designer
  app.post('/api/generate-module', async (req, res) => {
    try {
      const { idea, currentWidgets = [], gridColumns = 8, gridRows = 6 } = req.body;

      if (!idea) {
        return res.status(400).json({ error: 'No idea provided' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn('GEMINI_API_KEY environment variable is not configured. Utilizing local sci-fi fallback module synthesizer.');
        const fallbackData = generateFallbackModule(idea, currentWidgets, gridColumns, gridRows);
        return res.json(fallbackData);
      }

      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const systemInstruction = `You are a Sci-Fi Interface Synthesizer operating under strict hardware constraints for the Sepulchral NX Labs system.
Your job is to translate a user's verbal module idea into a single, fully compatible modular widget configuration that can be rendered inside our system.

Available Capabilities and Hardware Limitations:
- You can ONLY produce modules of the following 4 types:
  1. 'telemetry': Displays a real-time glowing vector sinewave. Perfect for sensors, frequencies, wavelengths, core stabilizers, and environmental flux trackers.
  2. 'radar': Displays a sweep conic radar reticle with target tracking. Perfect for scanning, defenses, proximity tracking, celestial coordinates, or orbital vectors.
  3. 'terminal': Displays a simulated scrolling compiler log, status warnings, and file log info. Perfect for logs, databases, system nodes, shell instances, error trace files, and active session telemetry.
  4. 'audio_spectrum': Displays interactive live vertical frequency bars. Perfect for communications, vocal feeds, acoustics, music reactors, energy outputs, or engine hum monitoring.

- Grid Constraints:
  - Total grid size is ${gridColumns} columns by ${gridRows} rows.
  - Position coordinates are x (columns 1 to ${gridColumns}) and y (rows 1 to ${gridRows}).
  - Widget width (w) and height (h) must be integers that fit inside the grid. Typically w is between 2 and 4, h is between 1 and 3.
  - Do NOT overlap with current existing widgets if possible. Find a suitable, empty x, y coordinate block. The existing widgets are currently: ${JSON.stringify(currentWidgets)}.
  - Make sure the generated widget fits within the bounds (i.e. x + w - 1 <= ${gridColumns} and y + h - 1 <= ${gridRows}).

- Available Lucide Icon Names (Only select from this list):
  ['Cpu', 'Terminal', 'Activity', 'Clock', 'Settings', 'ShieldCheck', 'Volume2', 'Database', 'Network', 'Radio', 'Tv', 'Zap', 'BarChart2', 'Flame', 'Eye', 'Compass', 'Sliders', 'LayoutGrid', 'AlertTriangle', 'Wifi', 'BatteryCharging', 'Atom']

- Glow Colors (Choose one suitable for the idea's vibe):
  - '#05ffa1' (Stable Emerald / Cyan)
  - '#3b82f6' (Deep Blue / Nightfly)
  - '#f43f5e' (Hostile Rose / Coral Red)
  - '#eab308' (Warn Amber / Gold)
  - '#a855f7' (Psionic Purple / Nephila)

IMPORTANT rule: You MUST NOT invent any other widget types or visual elements beyond 'telemetry', 'radar', 'terminal', and 'audio_spectrum'. You must output EXACTLY the JSON schema requested.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: `Translate this module request into a physical grid configuration: "${idea}"`,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: 'Name of the module. Capitalized, alphanumeric and underscores only, e.g. CORE_HARMONIC'
                },
                type: {
                  type: Type.STRING,
                  description: 'Must be exactly one of: telemetry, radar, terminal, audio_spectrum'
                },
                x: {
                  type: Type.INTEGER,
                  description: '1-indexed starting column coordinate'
                },
                y: {
                  type: Type.INTEGER,
                  description: '1-indexed starting row coordinate'
                },
                w: {
                  type: Type.INTEGER,
                  description: 'width span of cells (1 to 4)'
                },
                h: {
                  type: Type.INTEGER,
                  description: 'height span of cells (1 to 3)'
                },
                icon: {
                  type: Type.STRING,
                  description: 'Lucide icon name from the allowed list'
                },
                glowColor: {
                  type: Type.STRING,
                  description: 'Glow hex color code matching the vibe'
                },
                explanation: {
                  type: Type.STRING,
                  description: "Short 1-2 sentence explanation of why this configuration perfectly manifests the user's idea."
                }
              },
              required: ['name', 'type', 'x', 'y', 'w', 'h', 'icon', 'glowColor', 'explanation']
            }
          }
        });

        const responseText = response.text;
        if (!responseText) {
          throw new Error('Empty response from model synthesizer.');
        }

        const moduleData = JSON.parse(responseText.trim());
        res.json(moduleData);
      } catch (geminiErr: any) {
        console.warn('Gemini model generation failed, falling back to local synthesizer:', geminiErr);
        const fallbackData = generateFallbackModule(idea, currentWidgets, gridColumns, gridRows);
        res.json(fallbackData);
      }
    } catch (err: any) {
      console.error('Error in generate-module route:', err);
      res.status(500).json({ error: err.message || 'Synthesizer compilation failed.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
