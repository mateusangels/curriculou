import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import CurriculouEditor from './components/editor/CurriculouEditor';
import Landing from './components/Landing';
import SitePages from './components/SitePages';
import type { SitePagina } from './components/SiteShell';
import { verificarPago } from './lib/pagamento';
import { baixarCurriculoSalvo } from './lib/baixarSalvo';
import './cvzap.css';

const DARK_KEY = 'cvzap:dark';
const FONTS_HREF = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Lora:wght@500;600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap';

type View = 'landing' | 'editor' | SitePagina;

export default function CurriculouPage() {
  const [view, setView] = useState<View>('landing');
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem(DARK_KEY);
    if (saved !== null) return saved === '1';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    if (document.getElementById('cvzap-fonts')) return;
    const l = document.createElement('link');
    l.id = 'cvzap-fonts'; l.rel = 'stylesheet'; l.href = FONTS_HREF;
    document.head.appendChild(l);
  }, []);

  useEffect(() => {
    const root = document.getElementById('cvzap-root');
    if (root) root.classList.toggle('dark', dark);
    localStorage.setItem(DARK_KEY, dark ? '1' : '0');
  }, [dark]);

  // rola pro topo ao trocar de página
  useEffect(() => { window.scrollTo({ top: 0 }); }, [view]);

  // retorno do Mercado Pago: ?pago=<id> -> confere e baixa o PDF
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('pago');
    const limparUrl = () => window.history.replaceState({}, '', window.location.pathname);
    if (!id) {
      if (params.get('falhou')) { toast.error('Pagamento não concluído. Você pode tentar de novo.'); setView('editor'); limparUrl(); }
      return;
    }
    setView('editor');
    let tentativas = 0;
    const tid = window.setInterval(async () => {
      tentativas++;
      const pago = await verificarPago(id);
      if (pago) {
        clearInterval(tid);
        limparUrl();
        toast.success('Pagamento aprovado! Baixando seu currículo. 🎉');
        setTimeout(() => baixarCurriculoSalvo(), 600);
      } else if (tentativas >= 8) {
        clearInterval(tid);
        limparUrl();
        toast('Pagamento em processamento. Assim que confirmar, é só clicar em Baixar. 🙂');
      }
    }, 1500);
    return () => clearInterval(tid);
  }, []);

  const toggleDark = () => setDark((v) => !v);
  const irEditor = () => setView('editor');
  const irHome = () => setView('landing');
  const navegar = (p: SitePagina) => setView(p);

  return (
    <div id="cvzap-root" className={dark ? 'dark' : ''}>
      {view === 'editor' ? (
        <CurriculouEditor onVoltar={irHome} dark={dark} onToggleDark={toggleDark} />
      ) : view === 'landing' ? (
        <Landing onIniciar={irEditor} onNavegar={navegar} dark={dark} onToggleDark={toggleDark} />
      ) : (
        <SitePages pagina={view} onIniciar={irEditor} onHome={irHome} onNavegar={navegar} dark={dark} onToggleDark={toggleDark} />
      )}
    </div>
  );
}
