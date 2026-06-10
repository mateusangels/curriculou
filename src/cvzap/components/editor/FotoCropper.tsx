import { useEffect, useRef, useState } from 'react';
import { X, Check, ZoomIn } from 'lucide-react';

interface Props {
  src: string; // dataURL da imagem original
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}

const BOX = 280; // tamanho do visor (px)
const OUT = 440; // tamanho de saída (px)

export default function FotoCropper({ src, onConfirm, onCancel }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const baseRef = useRef(1);
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  useEffect(() => {
    const i = new Image();
    i.onload = () => {
      const base = Math.max(BOX / i.naturalWidth, BOX / i.naturalHeight);
      baseRef.current = base;
      setImg(i);
      setScale(1);
      // centraliza
      const dw = i.naturalWidth * base;
      const dh = i.naturalHeight * base;
      setPos({ x: (BOX - dw) / 2, y: (BOX - dh) / 2 });
    };
    i.src = src;
  }, [src]);

  const dispW = img ? img.naturalWidth * baseRef.current * scale : 0;
  const dispH = img ? img.naturalHeight * baseRef.current * scale : 0;

  const clamp = (x: number, y: number) => ({
    x: Math.min(0, Math.max(BOX - dispW, x)),
    y: Math.min(0, Math.max(BOX - dispH, y)),
  });

  const onDown = (e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const nx = dragRef.current.px + (e.clientX - dragRef.current.x);
    const ny = dragRef.current.py + (e.clientY - dragRef.current.y);
    setPos(clamp(nx, ny));
  };
  const onUp = () => { dragRef.current = null; };

  // recentraliza ao mudar o zoom
  useEffect(() => { setPos((p) => clamp(p.x, p.y)); /* eslint-disable-next-line */ }, [scale]);

  const confirmar = () => {
    if (!img) return;
    const ratio = OUT / BOX;
    const cv = document.createElement('canvas');
    cv.width = OUT; cv.height = OUT;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, OUT, OUT);
    ctx.drawImage(img, pos.x * ratio, pos.y * ratio, dispW * ratio, dispH * ratio);
    onConfirm(cv.toDataURL('image/jpeg', 0.85));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Ajustar foto</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>

        <div className="mx-auto overflow-hidden rounded-full bg-slate-100 ring-4 ring-indigo-500/20"
          style={{ width: BOX, height: BOX, position: 'relative', cursor: 'grab', touchAction: 'none' }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
          {img && (
            <img src={src} alt="" draggable={false}
              style={{ position: 'absolute', left: pos.x, top: pos.y, width: dispW, height: dispH, maxWidth: 'none', userSelect: 'none' }} />
          )}
          <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-black/10" />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <ZoomIn className="h-4 w-4 text-slate-400" />
          <input type="range" min={1} max={3} step={0.01} value={scale}
            onChange={(e) => setScale(+e.target.value)} className="flex-1 accent-indigo-600" />
        </div>
        <p className="mt-1 text-center text-xs text-slate-400">Arraste para posicionar • use a barra para dar zoom</p>

        <div className="mt-4 flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancelar</button>
          <button onClick={confirmar} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            <Check className="h-4 w-4" /> Usar foto
          </button>
        </div>
      </div>
    </div>
  );
}
