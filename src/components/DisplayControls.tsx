import React, {useEffect, useState} from 'react';
import {Maximize, Monitor} from 'lucide-react';

interface DesktopDisplayBridge {
  setSize: (width: number, height: number) => Promise<boolean>;
  maximize: () => Promise<boolean>;
  toggleFullscreen: () => Promise<boolean>;
  isFullscreen: () => Promise<boolean>;
}

declare global {
  interface Window { mindweaverDisplay?: DesktopDisplayBridge; }
}

export function DisplayControls() {
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [readableText, setReadableText] = useState(() => localStorage.getItem('sepulchral_nx_readable_text_v1') !== 'false');
  const desktop = Boolean(window.mindweaverDisplay);

  useEffect(() => {
    document.documentElement.classList.toggle('readable-ui', readableText);
    localStorage.setItem('sepulchral_nx_readable_text_v1', String(readableText));
    return () => document.documentElement.classList.remove('readable-ui');
  }, [readableText]);

  const toggleFullscreen = async () => {
    try {
      if (window.mindweaverDisplay) {
        setFullscreen(await window.mindweaverDisplay.toggleFullscreen());
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
        setFullscreen(false);
      } else {
        await document.documentElement.requestFullscreen();
        setFullscreen(true);
      }
    } catch { window.alert('Fullscreen is not available in this browser or window.'); }
    setOpen(false);
  };

  return (
    <div className="relative">
      <button type="button" title="Display size and fullscreen" onClick={async () => {
        if (!open) setFullscreen(window.mindweaverDisplay
          ? await window.mindweaverDisplay.isFullscreen()
          : Boolean(document.fullscreenElement));
        setOpen(!open);
      }}
        className="flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-[10px] text-slate-200 hover:bg-slate-800">
        <Monitor className="w-3.5 h-3.5" /> <span>DISPLAY</span>
      </button>
      {open && <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded border border-slate-600 bg-[#080b10] p-2 shadow-2xl flex flex-col gap-1 text-[11px]">
        <button type="button" onClick={() => setReadableText(!readableText)}
          className="rounded px-2 py-1 text-left hover:bg-slate-800">Readable text: {readableText ? 'ON' : 'OFF'}</button>
        <span className="px-2 py-1 text-slate-400">WINDOW SIZE</span>
        {desktop && <>
          {([[1280, 800], [1600, 900], [1920, 1080]] as const).map(([width, height]) =>
            <button key={width} type="button" onClick={async () => { await window.mindweaverDisplay?.setSize(width, height); setOpen(false); }}
              className="rounded px-2 py-1 text-left hover:bg-slate-800">{width} × {height}</button>)}
          <button type="button" onClick={async () => { await window.mindweaverDisplay?.maximize(); setOpen(false); }}
            className="rounded px-2 py-1 text-left hover:bg-slate-800">Maximize window</button>
        </>}
        <button type="button" onClick={toggleFullscreen}
          className="flex items-center gap-2 rounded px-2 py-1 text-left hover:bg-slate-800">
          <Maximize className="w-3.5 h-3.5" /> {fullscreen ? 'Exit fullscreen' : 'True fullscreen (F11)'}
        </button>
        <span className="border-t border-slate-800 px-2 pt-2 text-[9px] text-slate-500">Use 100% board zoom for full-size lettering.</span>
      </div>}
    </div>
  );
}
