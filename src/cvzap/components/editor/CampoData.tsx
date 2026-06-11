import { useEffect, useRef, useState } from 'react';
import { Calendar } from 'lucide-react';
import { normalizarData } from '../../engine/normalize';

const MESES_CURTO = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MESES_LONGO = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const pad = (n: number) => String(n).padStart(2, '0');

// ── máscaras ao vivo (digitando) ──────────────────────────────────────────────
function maskMesAno(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 6);
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
}
function maskCompleto(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

type Modo = 'mesAno' | 'completo';
interface Parsed { dia?: number; mes?: number; ano?: number }
function parse(v: string, modo: Modo): Parsed {
  if (modo === 'completo') {
    const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return m ? { dia: +m[1], mes: +m[2], ano: +m[3] } : {};
  }
  const m = v.match(/^(\d{1,2})\/(\d{4})$/);
  if (m) return { mes: +m[1], ano: +m[2] };
  const so = v.match(/^(\d{4})$/);
  return so ? { ano: +so[1] } : {};
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  modo: Modo;
  ph?: string;
  disabled?: boolean;
  width?: number;
}

/** Campo de data: digita (com a barra "/" automática) OU abre um calendário pra escolher. */
export default function CampoData({ value, onChange, modo, ph, disabled, width }: Props) {
  const [open, setOpen] = useState(false);
  const [vendoAnos, setVendoAnos] = useState(false); // lista de anos pra escolher direto
  const blurT = useRef<number>();
  const anoSelRef = useRef<HTMLButtonElement>(null);
  const hoje = new Date();
  const parsed = parse(value, modo);
  const [navAno, setNavAno] = useState(parsed.ano ?? hoje.getFullYear());
  const [navMes, setNavMes] = useState((parsed.mes ?? hoje.getMonth() + 1) - 1);

  // lista de anos (mais recente no topo, rolável)
  const anos: number[] = [];
  for (let y = hoje.getFullYear(); y >= 1960; y--) anos.push(y);

  // ao abrir, sincroniza a navegação com o valor digitado
  useEffect(() => {
    if (!open) { setVendoAnos(false); return; }
    const p = parse(value, modo);
    setNavAno(p.ano ?? hoje.getFullYear());
    setNavMes((p.mes ?? hoje.getMonth() + 1) - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ao abrir a lista de anos, rola até o ano selecionado
  useEffect(() => { if (vendoAnos) anoSelRef.current?.scrollIntoView({ block: 'center' }); }, [vendoAnos]);

  const mask = modo === 'completo' ? maskCompleto : maskMesAno;

  const fecharNorm = () => {
    setOpen(false);
    if (value) { const f = normalizarData(value).valor; if (f && f !== value) onChange(f); }
  };
  const escolherMes = (mi: number) => { onChange(`${pad(mi + 1)}/${navAno}`); setOpen(false); };
  const escolherDia = (dia: number) => { onChange(`${pad(dia)}/${pad(navMes + 1)}/${navAno}`); setOpen(false); };

  const primeiroDiaSemana = new Date(navAno, navMes, 1).getDay();
  const diasNoMes = new Date(navAno, navMes + 1, 0).getDate();

  return (
    <span className="cvcal" style={{ width: width ?? (modo === 'completo' ? 124 : 96), display: 'inline-block', position: 'relative' }}>
      <input
        className="cv-edit cvcal-inp" value={value} placeholder={ph} disabled={disabled} inputMode="numeric"
        onChange={(e) => onChange(mask(e.target.value))}
        onFocus={() => clearTimeout(blurT.current)}
        onBlur={() => { blurT.current = window.setTimeout(fecharNorm, 160); }}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
      />
      {!disabled && (
        <button type="button" className="cvcal-btn" title="Abrir calendário"
          onMouseDown={(e) => { e.preventDefault(); clearTimeout(blurT.current); setOpen((o) => !o); }}>
          <Calendar className="h-3.5 w-3.5" />
        </button>
      )}
      {open && !disabled && (
        <div className="cvcal-pop" onMouseDown={(e) => { e.preventDefault(); clearTimeout(blurT.current); }}>
          {vendoAnos ? (
            <>
              <div className="cvcal-head">
                <button type="button" onClick={() => setVendoAnos(false)}>‹</button>
                <span>Selecione o ano</span>
                <span style={{ width: 24 }} />
              </div>
              <div className="cvcal-anos">
                {anos.map((y) => (
                  <button type="button" key={y} ref={y === navAno ? anoSelRef : undefined}
                    className={y === navAno ? 'on' : ''}
                    onClick={() => { setNavAno(y); setVendoAnos(false); }}>{y}</button>
                ))}
              </div>
            </>
          ) : modo === 'mesAno' ? (
            <>
              <div className="cvcal-head">
                <button type="button" onClick={() => setNavAno((a) => a - 1)}>‹</button>
                <button type="button" className="cvcal-ano" onClick={() => setVendoAnos(true)}>{navAno} ▾</button>
                <button type="button" onClick={() => setNavAno((a) => a + 1)}>›</button>
              </div>
              <div className="cvcal-meses">
                {MESES_CURTO.map((m, i) => (
                  <button type="button" key={m}
                    className={parsed.mes === i + 1 && parsed.ano === navAno ? 'on' : ''}
                    onClick={() => escolherMes(i)}>{m}</button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="cvcal-head">
                <button type="button" onClick={() => { if (navMes === 0) { setNavMes(11); setNavAno((a) => a - 1); } else setNavMes((m) => m - 1); }}>‹</button>
                <button type="button" className="cvcal-ano" onClick={() => setVendoAnos(true)}>{MESES_LONGO[navMes]} {navAno} ▾</button>
                <button type="button" onClick={() => { if (navMes === 11) { setNavMes(0); setNavAno((a) => a + 1); } else setNavMes((m) => m + 1); }}>›</button>
              </div>
              <div className="cvcal-sem">{SEMANA.map((s, i) => <span key={i}>{s}</span>)}</div>
              <div className="cvcal-dias">
                {Array.from({ length: primeiroDiaSemana }).map((_, i) => <span key={`b${i}`} />)}
                {Array.from({ length: diasNoMes }).map((_, i) => {
                  const dia = i + 1;
                  const sel = parsed.dia === dia && parsed.mes === navMes + 1 && parsed.ano === navAno;
                  return <button type="button" key={dia} className={sel ? 'on' : ''} onClick={() => escolherDia(dia)}>{dia}</button>;
                })}
              </div>
            </>
          )}
        </div>
      )}
    </span>
  );
}
