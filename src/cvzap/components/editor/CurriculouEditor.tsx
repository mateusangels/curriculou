import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { CurriculoData } from '../../types';
import type { DesignConfig, SectionsConfig } from '../../design/types';
import { SECOES_PADRAO } from '../../design/types';
import { DESIGN_PADRAO } from '../../design/presets';
import { useRecruiter } from '../../hooks/useRecruiter';
import { gerarCurriculoPDF } from '../../lib/gerarCurriculoPDF';
import { melhorarCurriculo } from '../../lib/melhorar';
import { salvarCurriculo } from '../../lib/curriculos';
import { track } from '../../lib/track';
import EditorToolbar from './EditorToolbar';
import EditorCanvas from './EditorCanvas';
import FormEditor from './FormEditor';
import DesignPanel from './DesignPanel';
import SectionsPanel from './SectionsPanel';
import ModelosModal from './ModelosModal';
import PaywallModal from './PaywallModal';
import RecuperarModal from './RecuperarModal';
import ChatPanel from '../ChatPanel';

interface Props { onVoltar?: () => void; dark: boolean; onToggleDark: () => void; logado?: boolean; plano?: string; onMeusCurriculos?: () => void; onPrecisaLogin?: () => void }

const K_DESIGN = 'cvzap:design:v2';
const K_SEC = 'cvzap:sections:v2';
const K_FOTO = 'cvzap:foto:v1';
const CUR_ID_KEY = 'curriculou:curriculoId';
const CUR_TITULO_KEY = 'curriculou:curriculoTitulo';

function carregar<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? { ...fallback, ...JSON.parse(r) } : fallback; } catch { return fallback; }
}

export default function CurriculouEditor({ onVoltar, dark, onToggleDark, logado, plano, onMeusCurriculos, onPrecisaLogin }: Props) {
  const { data, messages, typing, iniciado, iniciar, enviar, reiniciar, atualizarDados } = useRecruiter();

  const [design, setDesign] = useState<DesignConfig>(() => carregar(K_DESIGN, DESIGN_PADRAO));
  const [sections, setSections] = useState<SectionsConfig>(() => carregar(K_SEC, SECOES_PADRAO));
  const [foto, setFotoState] = useState<string | undefined>(() => localStorage.getItem(K_FOTO) || undefined);
  const [drawer, setDrawer] = useState<'design' | 'sections' | 'chat' | null>(null);
  const [modelos, setModelos] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [recuperar, setRecuperar] = useState(false);
  const [aba, setAba] = useState<'form' | 'previa'>('form'); // só no mobile

  // ── undo/redo (histórico de data) ─────────────────────────────────────────
  const past = useRef<CurriculoData[]>([]);
  const future = useRef<CurriculoData[]>([]);
  const prev = useRef<CurriculoData>(data);
  const skip = useRef(false);
  const [, force] = useState(0);

  useEffect(() => {
    if (skip.current) { skip.current = false; prev.current = data; return; }
    if (prev.current !== data) {
      past.current.push(prev.current);
      if (past.current.length > 60) past.current.shift();
      future.current = [];
      prev.current = data;
      force((n) => n + 1);
    }
  }, [data]);

  const undo = () => {
    if (!past.current.length) return;
    const anterior = past.current.pop()!;
    future.current.unshift(data);
    skip.current = true;
    atualizarDados(anterior);
    force((n) => n + 1);
  };
  const redo = () => {
    if (!future.current.length) return;
    const prox = future.current.shift()!;
    past.current.push(data);
    skip.current = true;
    atualizarDados(prox);
    force((n) => n + 1);
  };

  // ── persistência design/sections/foto ─────────────────────────────────────
  useEffect(() => { try { localStorage.setItem(K_DESIGN, JSON.stringify(design)); } catch { /* */ } }, [design]);
  useEffect(() => { try { localStorage.setItem(K_SEC, JSON.stringify(sections)); } catch { /* */ } }, [sections]);
  const setFoto = useCallback((f: string | undefined) => {
    setFotoState(f);
    try { if (f) localStorage.setItem(K_FOTO, f); else localStorage.removeItem(K_FOTO); } catch { /* quota */ }
  }, []);

  const ehPro = plano === 'pro';
  const baixar = () => {
    if (ehPro) { track('download', 'pro'); gerarCurriculoPDF(data, design, sections, { foto }); toast.success('Baixando seu PDF (Profissional). 🎉'); }
    else { track('paywall_abrir'); setPaywall(true); }
  };
  const baixarPdf = () => gerarCurriculoPDF(data, design, sections, { foto });
  const baixarGratis = () => gerarCurriculoPDF(data, design, sections, { foto, marca: true });

  const salvarNaConta = async () => {
    const id = localStorage.getItem(CUR_ID_KEY) || undefined;
    const titulo = (localStorage.getItem(CUR_TITULO_KEY) || data.nome || 'Currículo sem título').slice(0, 160);
    try {
      const salvoId = await salvarCurriculo(titulo, { data, design, sections, foto }, id);
      localStorage.setItem(CUR_ID_KEY, salvoId);
      localStorage.setItem(CUR_TITULO_KEY, titulo);
      toast.success('Currículo salvo na sua conta. ✅');
    } catch {
      toast.error('Não foi possível salvar agora.');
    }
  };
  const melhorar = () => { atualizarDados(melhorarCurriculo(data)); toast.success('Currículo melhorado! Revisei os textos pra você. ✨'); };
  const emBreve = (q: string) => toast(`"${q}" chega em breve — vamos plugar a IA depois. 🙂`);

  const fecharDrawer = () => setDrawer(null);

  // fit-to-width: encolhe a folha (794px) para caber na largura da tela (mobile)
  const areaRef = useRef<HTMLDivElement>(null);
  const folhaRef = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(1);
  const [folhaH, setFolhaH] = useState(0);
  useEffect(() => {
    const area = areaRef.current, folha = folhaRef.current;
    if (!area || !folha) return;
    const recalc = () => {
      if (!area.clientWidth) return; // oculto (ex.: aba "Preencher" no mobile)
      const disp = area.clientWidth - 24; // respiro lateral
      setEscala(Math.min(1, disp / 794));
      setFolhaH(folha.offsetHeight);
    };
    const ro = new ResizeObserver(recalc);
    ro.observe(area); ro.observe(folha);
    recalc();
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-slate-200 dark:bg-slate-950">
      <EditorToolbar
        onVoltar={onVoltar} dark={dark} onToggleDark={onToggleDark}
        onModelos={() => setModelos(true)}
        onDesign={() => setDrawer((d) => (d === 'design' ? null : 'design'))}
        onSecoes={() => setDrawer((d) => (d === 'sections' ? null : 'sections'))}
        onBaixar={baixar}
        onSalvar={logado ? salvarNaConta : undefined}
        onMeusCurriculos={logado ? onMeusCurriculos : undefined}
        onMelhorarIA={melhorar}
        onChat={() => setDrawer((d) => (d === 'chat' ? null : 'chat'))}
        onUndo={undo} onRedo={redo} podeUndo={past.current.length > 0} podeRedo={future.current.length > 0}
        emBreve={emBreve}
      />

      <div className="relative flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Abas (apenas mobile): preencher no formulário ou ver a prévia */}
        <div className="flex border-b border-slate-200 bg-white md:hidden dark:border-slate-700 dark:bg-slate-900">
          <button onClick={() => setAba('form')} className={`flex-1 py-3 text-sm font-semibold transition ${aba === 'form' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>Preencher</button>
          <button onClick={() => setAba('previa')} className={`flex-1 py-3 text-sm font-semibold transition ${aba === 'previa' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>Prévia</button>
        </div>

        {/* Formulário (mobile, aba Preencher) */}
        <div className={`min-h-0 flex-1 overflow-auto md:hidden ${aba === 'form' ? 'block' : 'hidden'}`}>
          <FormEditor data={data} onChange={atualizarDados} sections={sections} foto={foto} onFoto={setFoto} onVerPrevia={() => setAba('previa')} />
        </div>

        {/* Folha A4 — desktop sempre; mobile só na aba Prévia. Encolhe pra caber. */}
        <div ref={areaRef} className={`min-h-0 flex-1 overflow-auto p-3 sm:p-8 md:block ${aba === 'previa' ? 'block' : 'hidden'}`}>
          <div style={{ width: 794 * escala, height: folhaH ? folhaH * escala : undefined, margin: '0 auto', position: 'relative' }}>
            <div ref={folhaRef} style={{ width: 794, transform: `scale(${escala})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
              <EditorCanvas data={data} onChange={atualizarDados} design={design} sections={sections} foto={foto} onFoto={setFoto}
                onFotoTamanho={(px) => setDesign((d) => ({ ...d, fotoTamanho: px }))} />
            </div>
          </div>
          <div className="h-8" />
        </div>

        {/* Drawer lateral (design / seções / chat) */}
        {drawer && (
          <>
            <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={fecharDrawer} />
            <aside className={`fixed right-0 top-0 z-50 flex h-full flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 ${drawer === 'chat' ? 'w-full max-w-[420px]' : 'w-full max-w-[360px]'}`}>
              {drawer === 'design' && <DesignPanel design={design} onChange={setDesign} onClose={fecharDrawer} />}
              {drawer === 'sections' && <SectionsPanel sections={sections} onChange={setSections} onClose={fecharDrawer} />}
              {drawer === 'chat' && (
                <ChatPanel
                  messages={messages} typing={typing} iniciado={iniciado} onIniciar={iniciar}
                  onEnviar={enviar} onReiniciar={reiniciar} onClose={fecharDrawer}
                />
              )}
            </aside>
          </>
        )}
      </div>

      {modelos && (
        <ModelosModal
          designAtual={design}
          onEscolher={(d) => { setDesign(d); setModelos(false); toast.success('Modelo aplicado!'); }}
          onClose={() => setModelos(false)}
        />
      )}

      {paywall && (
        <PaywallModal
          comFoto={!!foto}
          onPago={() => { setPaywall(false); track('download', 'pago'); baixarPdf(); toast.success('Compra concluída! Baixando seu PDF. 🎉'); }}
          onBaixarGratis={() => { setPaywall(false); track('download_gratis'); baixarGratis(); toast('Baixando a versão grátis (com marca d\'água). Pague para remover. 🙂'); }}
          onClose={() => setPaywall(false)}
          onJaPaguei={() => { setPaywall(false); setRecuperar(true); }}
          logado={logado}
          onPrecisaLogin={() => { setPaywall(false); onPrecisaLogin?.(); }}
        />
      )}

      {recuperar && <RecuperarModal onClose={() => setRecuperar(false)} />}
    </div>
  );
}
