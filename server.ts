import express from 'express';
import path from 'path';
import {execFile} from 'child_process';
import {createServer as createViteServer} from 'vite';

const OLLAMA_ORIGIN = 'http://127.0.0.1:11434';
const DEFAULT_PORT = 3000;

function resolvePort(): number {
  const configuredPort = Number.parseInt(process.env.PORT || '', 10);
  return Number.isInteger(configuredPort) && configuredPort > 0 && configuredPort <= 65535
    ? configuredPort
    : DEFAULT_PORT;
}

async function forwardOllamaResponse(ollamaResponse: Response, res: express.Response) {
  const contentType = ollamaResponse.headers.get('content-type') || 'application/json';
  const body = await ollamaResponse.text();
  res.status(ollamaResponse.status).type(contentType).send(body);
}

function openBrowser(url: string) {
  if (process.platform !== 'win32' || process.env.MINDWEAVER_OPEN_BROWSER !== '1') return;
  execFile('rundll32.exe', ['url.dll,FileProtocolHandler', url], {windowsHide: true}, (error) => {
    if (error) console.warn(`Open ${url} manually in your browser.`);
  });
}

async function startServer() {
  const app = express();
  const port = resolvePort();

  app.disable('x-powered-by');
  app.use(express.json({limit: '10mb'}));

  // Mindweaver is local-first. These routes only proxy to the Ollama service
  // on this PC so the browser never needs relaxed cross-origin settings.
  app.get('/api/ollama/tags', async (_req, res) => {
    try {
      const ollamaResponse = await fetch(`${OLLAMA_ORIGIN}/api/tags`);
      await forwardOllamaResponse(ollamaResponse, res);
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      res.status(503).json({
        error: `Ollama is not reachable at ${OLLAMA_ORIGIN}`,
        details,
      });
    }
  });

  app.post('/api/ollama/chat', async (req, res) => {
    try {
      const ollamaResponse = await fetch(`${OLLAMA_ORIGIN}/api/chat`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(req.body),
      });
      await forwardOllamaResponse(ollamaResponse, res);
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      res.status(503).json({
        error: `Ollama is not reachable at ${OLLAMA_ORIGIN}`,
        details,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  await new Promise<void>((resolve, reject) => {
    const server = app.listen(port, '127.0.0.1', () => {
      const url = `http://localhost:${port}`;
      console.log(`Mindweaver is running locally at ${url}`);
      console.log('Keep this window open while using Mindweaver. Press Ctrl+C to stop.');
      openBrowser(url);
      resolve();
    });
    server.once('error', reject);
  });
}

startServer().catch((error) => {
  console.error('Mindweaver could not start:', error);
  process.exitCode = 1;
});
