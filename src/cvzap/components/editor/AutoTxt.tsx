import { useRef, useState } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  ph?: string;
  cls?: string;
  style?: React.CSSProperties;
  live?: (v: string) => string;
  fmt?: (v: string) => string;
}

/** Input com lista de sugestões (datalist-like) que aparece ao digitar/focar. */
export default function AutoTxt({ value, onChange, options, ph, cls = '', style, live, fmt }: Props) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(0);
  const blurT = useRef<number>();

  const q = value.trim().toLowerCase();
  const filtradas = options.filter((o) => o.toLowerCase() !== q && (!q || o.toLowerCase().includes(q))).slice(0, 8);

  const escolher = (o: string) => { onChange(o); setOpen(false); };

  return (
    <span style={{ position: 'relative', display: 'block', width: style?.width ?? '100%' }}>
      <input
        className={`cv-edit ${cls}`} style={style} value={value} placeholder={ph}
        onChange={(e) => { onChange(live ? live(e.target.value) : e.target.value); setOpen(true); setHover(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => { blurT.current = window.setTimeout(() => setOpen(false), 160); if (fmt) { const f = fmt(value); if (f !== value) onChange(f); } }}
        onKeyDown={(e) => {
          if (!open || !filtradas.length) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setHover((h) => Math.min(filtradas.length - 1, h + 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setHover((h) => Math.max(0, h - 1)); }
          else if (e.key === 'Enter') { e.preventDefault(); escolher(filtradas[hover]); }
          else if (e.key === 'Escape') setOpen(false);
        }}
      />
      {open && filtradas.length > 0 && (
        <div className="cv-suggest">
          {filtradas.map((o, i) => (
            <button key={o} type="button"
              className={i === hover ? 'on' : ''}
              onMouseEnter={() => setHover(i)}
              onMouseDown={(e) => { e.preventDefault(); clearTimeout(blurT.current); escolher(o); }}>
              {o}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
