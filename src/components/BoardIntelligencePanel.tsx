import { useEffect, useRef, useState } from 'react';
import { Bot, Volume2, VolumeX, X } from 'lucide-react';
import { CaseFile, TerminalTheme } from '../types';
import { THEME_PALETTES } from './TerminalOverlay';
import { fetchInstalledOllamaModels } from '../services/ollamaService';
import { askBoardOllama, BoardChatMessage } from '../services/boardIntelligence';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  caseFile: CaseFile;
  theme: TerminalTheme;
  soundEnabled: boolean;
}

export const BoardIntelligencePanel = ({ isOpen, onClose, caseFile, theme, soundEnabled }: Props) => {
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState('');
  const [messages, setMessages] = useState<BoardChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const palette = THEME_PALETTES[theme];

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    fetchInstalledOllamaModels().then(({ models: found }) => {
      if (active) { setModels(found); setModel(current => found.includes(current) ? current : found[0] || ''); setError(found.length ? '' : 'No local Ollama models are installed.'); }
    }).catch(() => { if (active) setError('Local Ollama is offline. Start Ollama to use analysis and chat.'); });
    return () => { active = false; };
  }, [isOpen]);

  useEffect(() => {
    setMessages([]);
    setQuestion('');
    abortRef.current?.abort();
  }, [caseFile.id]);

  useEffect(() => {
    if (!soundEnabled && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }, [soundEnabled]);

  useEffect(() => {
    if (!isOpen) {
      abortRef.current?.abort();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
  }, [isOpen]);

  const submit = async (prompt: string) => {
    if (!model || !prompt.trim() || busy) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError('');
    setQuestion('');
    const previous = messages;
    setMessages([...previous, { role: 'user', content: prompt }]);
    try {
      const answer = await askBoardOllama(caseFile, model, prompt, previous, controller.signal);
      setMessages(current => [...current, { role: 'assistant', content: answer }].slice(-20));
    } catch (caught) {
      if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : 'Analysis failed.');
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  const speak = (content: string) => {
    if (!soundEnabled || !('speechSynthesis' in window)) return;
    const localVoice = window.speechSynthesis.getVoices().find(voice => voice.localService && voice.lang.startsWith('en'));
    if (!localVoice) { setError('No local English text-to-speech voice is available on this PC.'); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(content.slice(0, 4000));
    utterance.voice = localVoice;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  if (!isOpen) return null;
  return <div className="fixed right-3 top-20 z-50 w-[min(440px,calc(100vw-24px))] max-h-[calc(100vh-100px)] flex flex-col rounded border bg-[#080e12] shadow-2xl font-mono text-xs text-slate-200" style={{ borderColor: palette.primary }} data-testid="board-intelligence-panel">
    <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
      <div className="flex items-center gap-2 font-bold" style={{ color: palette.primary }}><Bot className="w-4 h-4" /> LOCAL BOARD INTELLIGENCE</div>
      <button aria-label="Close board intelligence" onClick={onClose}><X className="w-4 h-4" /></button>
    </div>
    <div className="p-4 space-y-3 overflow-y-auto">
      <p className="text-slate-400">Read-only analysis of this board’s events and wires. Images are not sent to the model; only the fact that a node has one is included. Responses are suggestions, not evidence.</p>
      <label className="block">Local Ollama model
        <select aria-label="Analysis model" value={model} onChange={e => setModel(e.target.value)} className="mt-1 w-full bg-black border border-slate-700 rounded p-2">
          {models.length ? models.map(item => <option key={item} value={item}>{item}</option>) : <option value="">No model available</option>}
        </select>
      </label>
      <button disabled={!model || busy || caseFile.events.length === 0} onClick={() => void submit('Analyze the current board for possible convergence among events and connections. Group the strongest patterns, cite exact IDs, separate documented evidence from hypotheses and chronology, and list evidence gaps and alternative explanations.')} className="w-full rounded border border-emerald-500/50 bg-emerald-950/40 px-3 py-2 disabled:opacity-40" data-testid="analyze-convergence">Analyze convergence</button>
      <div className="max-h-[38vh] overflow-y-auto space-y-2" aria-label="Board chat transcript">
        {messages.map((message, index) => <div key={index} className={`rounded border p-2 whitespace-pre-wrap select-text ${message.role === 'assistant' ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-slate-700 bg-slate-900/50'}`}>
          <div className="mb-1 font-bold text-[10px] uppercase">{message.role === 'assistant' ? 'Local AI analysis' : 'Your question'}</div>
          <div>{message.content}</div>
          {message.role === 'assistant' && <button aria-label={`Read response ${index + 1} aloud`} disabled={!soundEnabled} onClick={() => speak(message.content)} className="mt-2 flex items-center gap-1 text-emerald-300 disabled:text-slate-600"><Volume2 className="w-3 h-3" /> Read aloud</button>}
        </div>)}
      </div>
      {error && <p role="alert" className="text-rose-400">{error}</p>}
      <form onSubmit={event => { event.preventDefault(); void submit(question); }} className="flex gap-2">
        <input aria-label="Ask about this board" value={question} onChange={event => setQuestion(event.target.value)} placeholder="Ask about events or connections…" className="min-w-0 flex-1 rounded border border-slate-700 bg-black p-2" />
        <button type="submit" disabled={!model || busy || !question.trim()} className="rounded border border-emerald-500/50 px-3 disabled:opacity-40">Ask</button>
      </form>
      <div className="flex items-center justify-between text-[10px] text-slate-500">
        <span>{busy ? 'Thinking locally…' : 'Chat is session-only; board data stays unchanged.'}</span>
        <button onClick={() => window.speechSynthesis?.cancel()} className="flex items-center gap-1"><VolumeX className="w-3 h-3" /> Stop voice</button>
      </div>
    </div>
  </div>;
};
