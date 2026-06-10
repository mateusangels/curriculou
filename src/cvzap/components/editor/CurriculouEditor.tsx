import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { CurriculoData } from '../../types';
import type { DesignConfig, SectionsConfig } from '../../design/types';
import { SECOES_PADRAO } from '../../design/types';
import { DESIGN_PADRAO } from '../../design/presets';
import { useRecruiter } from '../../hooks/useRecruiter';
import { gerarCurriculoPDF } from '../../lib/gerarCurriculoPDF';
import { melhorarCurriculo } from '../../lib/melhorar';
import EditorToolbar from './EditorToolbar';
import EditorCanvas from './EditorCanvas';
import DesignPanel from './DesignPanel';
import SectionsPanel from './SectionsPanel';
import ModelosModal from './ModelosModal';
import PaywallModal from './PaywallModal';
import ChatPanel from '../ChatPanel';

interface Props { onVoltar?: () => void; dark: boolean; onToggleDark: () => void }

const K_DESIGN = 'cvzap:design:v2';
const K_SEC = 'cvzap:sections:v2';
const K_FOTO = 'cvzap:foto:v1';

function carregar<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? { ...fallback, ...JSON.parse(r) } : fallback; } catch { return fallback; }
}

export default function CurriculouEditor({ onVoltar, dark, onToggleDark }: Props) {
  const { data, messages, typing, iniciado, iniciar, enviar, reiniciar, atualizarDados } = useRecruiter();

  const [design, setDesign] = useState<DesignConfig>(() => carregar(K_DESIGN, DESIGN_PADRAO));
  const [sections, setSections] = useState<SectionsConfig>(() => carregar(K_SEC, SECOES_PADRAO));
  const [foto, setFotoState] = useState<string | undefined>(() => localStorage.getItem(K_FOTO) || undefined);
  const [drawer, setDrawer] = useState<'design' | 'sections' | 'chat' | null>(null);
  const [modelos, setModelos] = useState(false);
  const [paywall, setPaywall] = useState(false);

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

  const baixar = () => setPaywall(true);
  const baixarPdf = () => gerarCurriculoPDF(data, design, sections, { foto });
  const melhorar = () => { atualizarDados(melhorarCurriculo(data)); toast.success('Currículo melhorado! Revisei os textos pra você. ✨'); };
  const emBreve = (q: string) => toast(`"${q}" chega em breve — vamos plugar a IA depois. 🙂`);

  const fecharDrawer = () => setDrawer(null);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-slate-200 dark:bg-slate-950">
      <EditorToolbar
        onVoltar={onVoltar} dark={dark} onToggleDark={onToggleDark}
        onModelos={() => setModelos(true)}
        onDesign={() => setDrawer((d) => (d === 'design' ? null : 'design'))}
        onSecoes={() => setDrawer((d) => (d === 'sections' ? null : 'sections'))}
        onBaixar={baixar}
        onMelhorarIA={melhorar}
        onChat={() => setDrawer((d) => (d === 'chat' ? null : 'chat'))}
        onUndo={undo} onRedo={redo} podeUndo={past.current.length > 0} podeRedo={future.current.length > 0}
        emBreve={emBreve}
      />

      <div className="relative flex min-h-0 flex-1">
        {/* Área do canvas */}
        <div className="flex-1 overflow-auto p-4 sm:p-8">
          <EditorCanvas data={data} onChange={atualizarDados} design={design} sections={sections} foto={foto} onFoto={setFoto} />
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
          onPago={() => { setPaywall(false); baixarPdf(); toast.success('Compra concluída! Baixando seu PDF. 🎉'); }}
          onClose={() => setPaywall(false)}
        />
      )}
    </div>
  );
}
