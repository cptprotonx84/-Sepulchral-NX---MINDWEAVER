import React, {useRef, useState} from 'react';
import {Clock3, Pencil, Plus, Trash2} from 'lucide-react';
import {FloatingTimeTag} from '../types';

interface Props {
  tags: FloatingTimeTag[];
  zoom: number;
  pan: {x: number; y: number};
  accent: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onAdd: (tag: FloatingTimeTag) => void;
  onUpdate: (id: string, changes: Partial<FloatingTimeTag>) => void;
  onDelete: (id: string) => void;
}

type TagDraft = Pick<FloatingTimeTag, 'kind' | 'text' | 'color'>;
type ResizeEdge = 'left' | 'right' | 'top' | 'bottom';
const MIN_TAG_SIZE = 8;
const MAX_TAG_SIZE = 48;
const DEFAULT_TAG_SIZE = 16;
const resizeEdges: {edge: ResizeEdge; className: string}[] = [
  {edge: 'left', className: 'left-0 top-1/2 h-4 w-2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize'},
  {edge: 'right', className: 'right-0 top-1/2 h-4 w-2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize'},
  {edge: 'top', className: 'left-1/2 top-0 h-2 w-4 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize'},
  {edge: 'bottom', className: 'bottom-0 left-1/2 h-2 w-4 -translate-x-1/2 translate-y-1/2 cursor-ns-resize'},
];

function tagSize(tag: FloatingTimeTag) {
  return Number.isFinite(tag.fontSizePx) ? Math.min(MAX_TAG_SIZE, Math.max(MIN_TAG_SIZE, tag.fontSizePx!)) : DEFAULT_TAG_SIZE;
}

export function FloatingTimeTags({tags, zoom, pan, accent, containerRef, onAdd, onUpdate, onDelete}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TagDraft>({kind: 'timestamp', text: '10:35 AM', color: accent});
  const [dragPreview, setDragPreview] = useState<{id: string; x: number; y: number} | null>(null);
  const [resizePreview, setResizePreview] = useState<{id: string; fontSizePx: number} | null>(null);
  const dragRef = useRef<{id: string; pointerId: number; clientX: number; clientY: number; x: number; y: number} | null>(null);
  const resizeRef = useRef<{
    id: string; pointerId: number; edge: ResizeEdge; clientX: number; clientY: number;
    fontSizePx: number; width: number; height: number;
  } | null>(null);

  const addTag = () => {
    const board = containerRef.current;
    if (!board) return;
    const tag: FloatingTimeTag = {
      id: `time_tag_${crypto.randomUUID()}`,
      kind: 'timestamp', text: '10:35 AM', color: accent,
      x: (board.clientWidth * 0.5 - pan.x) / zoom,
      y: (board.clientHeight * 0.42 - pan.y) / zoom,
      fontSizePx: DEFAULT_TAG_SIZE,
    };
    onAdd(tag);
    setDraft({kind: tag.kind, text: tag.text, color: tag.color});
    setEditingId(tag.id);
  };

  const startDrag = (event: React.PointerEvent<HTMLDivElement>, tag: FloatingTimeTag) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button, input, select')) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      id: tag.id, pointerId: event.pointerId,
      clientX: event.clientX, clientY: event.clientY, x: tag.x, y: tag.y,
    };
  };

  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    setDragPreview({
      id: drag.id,
      x: drag.x + (event.clientX - drag.clientX) / zoom,
      y: drag.y + (event.clientY - drag.clientY) / zoom,
    });
  };

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const x = drag.x + (event.clientX - drag.clientX) / zoom;
    const y = drag.y + (event.clientY - drag.clientY) / zoom;
    if (Math.hypot(event.clientX - drag.clientX, event.clientY - drag.clientY) > 2) {
      onUpdate(drag.id, {x, y});
    }
    dragRef.current = null;
    setDragPreview(null);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const resizedSize = (event: React.PointerEvent<HTMLButtonElement>) => {
    const resize = resizeRef.current!;
    const horizontal = resize.edge === 'left' || resize.edge === 'right';
    const sign = resize.edge === 'left' || resize.edge === 'top' ? -1 : 1;
    const distance = sign * ((horizontal ? event.clientX : event.clientY) - (horizontal ? resize.clientX : resize.clientY));
    const dimension = horizontal ? resize.width : resize.height;
    return Math.round(Math.min(MAX_TAG_SIZE, Math.max(MIN_TAG_SIZE, resize.fontSizePx * (1 + 2 * distance / dimension))));
  };

  const startResize = (event: React.PointerEvent<HTMLButtonElement>, tag: FloatingTimeTag, edge: ResizeEdge) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const bounds = event.currentTarget.parentElement!.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeRef.current = {
      id: tag.id, pointerId: event.pointerId, edge, clientX: event.clientX, clientY: event.clientY,
      fontSizePx: tagSize(tag), width: bounds.width, height: bounds.height,
    };
  };

  const moveResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    const resize = resizeRef.current;
    if (!resize || resize.pointerId !== event.pointerId) return;
    event.stopPropagation();
    setResizePreview({id: resize.id, fontSizePx: resizedSize(event)});
  };

  const finishResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    const resize = resizeRef.current;
    if (!resize || resize.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const fontSizePx = resizedSize(event);
    if (fontSizePx !== resize.fontSizePx) onUpdate(resize.id, {fontSizePx});
    resizeRef.current = null;
    setResizePreview(null);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return <>
    <button type="button" onClick={addTag} title="Add floating timestamp tag"
      className="absolute top-4 left-4 z-30 flex items-center gap-1.5 rounded border bg-black/90 px-2.5 py-1.5 text-xs font-bold hover:bg-slate-900"
      style={{borderColor: `${accent}88`, color: accent}}>
      <Plus className="h-3.5 w-3.5" /> TIME TAG
    </button>
    <div className="absolute inset-0 z-20 pointer-events-none" data-testid="floating-time-tag-layer">
      {tags.map(tag => {
        const point = dragPreview?.id === tag.id ? dragPreview : tag;
        const editing = editingId === tag.id;
        const fontSizePx = resizePreview?.id === tag.id ? resizePreview.fontSizePx : tagSize(tag);
        return <div key={tag.id} data-testid="floating-time-tag"
          className="group absolute pointer-events-auto select-none rounded border bg-[#05080d]/95 shadow-lg"
          style={{
            left: pan.x + point.x * zoom,
            top: pan.y + point.y * zoom,
            transform: 'translate(-50%, -50%)',
            borderColor: tag.color,
            color: tag.color,
            boxShadow: `0 0 12px ${tag.color}44`,
            touchAction: 'none',
          }}
          title="Drag to move; grab an edge to resize. This tag does not change any event."
          onMouseDown={event => event.stopPropagation()}
          onPointerDown={event => startDrag(event, tag)}
          onPointerMove={moveDrag}
          onPointerUp={finishDrag}
          onPointerCancel={() => {dragRef.current = null; setDragPreview(null);}}>
          <div className="flex cursor-grab items-center active:cursor-grabbing"
            style={{fontSize: fontSizePx, gap: '0.45em', padding: '0.35em 0.55em'}}>
            <Clock3 className="shrink-0" style={{width: '1em', height: '1em'}} />
            <span className="whitespace-nowrap font-sans font-bold tabular-nums">{tag.text}</span>
            <button type="button" title="Edit timestamp tag" aria-label={`Edit timestamp tag ${tag.text}`}
              className="ml-1 rounded p-0.5 text-slate-300 hover:bg-slate-700 hover:text-white"
              onClick={event => {
                event.stopPropagation();
                setDraft({kind: tag.kind, text: tag.text, color: tag.color});
                setEditingId(editing ? null : tag.id);
              }}><Pencil style={{width: '0.8em', height: '0.8em'}} /></button>
          </div>
          {resizeEdges.map(({edge, className}) => <button key={edge} type="button"
            aria-label={`Resize timestamp tag from ${edge} edge`}
            title={`Drag to resize ${edge} edge`}
            className={`absolute z-10 rounded-sm border bg-[#080b10] opacity-0 transition-opacity group-hover:opacity-90 focus:opacity-100 ${className}`}
            style={{borderColor: tag.color, touchAction: 'none'}}
            onPointerDown={event => startResize(event, tag, edge)}
            onPointerMove={moveResize}
            onPointerUp={finishResize}
            onPointerCancel={() => {resizeRef.current = null; setResizePreview(null);}}
          />)}
          {editing && <form className="absolute left-1/2 top-full z-40 mt-2 flex w-56 -translate-x-1/2 flex-col gap-2 rounded border border-slate-600 bg-[#080b10] p-3 text-xs text-slate-200 shadow-2xl"
            onPointerDown={event => event.stopPropagation()}
            onMouseDown={event => event.stopPropagation()}
            onSubmit={event => {
              event.preventDefault();
              const text = draft.text.trim();
              if (!text) return;
              onUpdate(tag.id, {...draft, text});
              setEditingId(null);
            }}>
            <label className="flex flex-col gap-1">Type
              <select aria-label="Timestamp tag type" value={draft.kind}
                onChange={event => setDraft({...draft, kind: event.target.value as FloatingTimeTag['kind']})}
                className="rounded border border-slate-600 bg-slate-900 p-1">
                <option value="timestamp">Timestamp</option><option value="range">Time range</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">Label
              <input aria-label="Timestamp tag label" value={draft.text} maxLength={60} required
                onChange={event => setDraft({...draft, text: event.target.value})}
                placeholder={draft.kind === 'range' ? '10:00–11:30 AM' : '10:35 AM'}
                className="rounded border border-slate-600 bg-slate-900 p-1 text-white" />
            </label>
            <label className="flex items-center justify-between gap-2">Color
              <input aria-label="Timestamp tag color" type="color" value={draft.color}
                onChange={event => setDraft({...draft, color: event.target.value})}
                className="h-7 w-10 cursor-pointer bg-transparent" />
            </label>
            <div className="flex justify-between gap-2">
              <button type="button" title="Delete timestamp tag" onClick={() => {onDelete(tag.id); setEditingId(null);}}
                className="flex items-center gap-1 rounded border border-rose-800 px-2 py-1 text-rose-300"><Trash2 className="h-3 w-3" /> Delete</button>
              <button type="submit" className="rounded border px-2 py-1 font-bold" style={{borderColor: tag.color, color: tag.color}}>Save tag</button>
            </div>
          </form>}
        </div>;
      })}
    </div>
  </>;
}
