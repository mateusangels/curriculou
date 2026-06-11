import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import CurriculouEditor from './components/editor/CurriculouEditor';
import Landing from './components/Landing';
import SitePages from './components/SitePages';
import AuthView from './components/AuthView';
import MeusCurriculos from './components/MeusCurriculos';
import Admin from './components/Admin';
import type { SitePagina } from './components/SiteShell';
import { buscarPedido, ULTIMO_PEDIDO_KEY } from './lib/pagamento';
import { baixarCurriculoSalvo } from './lib/baixarSalvo';
import { baixarDeSnapshot, aplicarSnapshot, type CvSnapshot } from './lib/snapshot';
import { me, logout, type Usuario } from './lib/auth';
import { track } from './lib/track';
import './cvzap.css';

const DARK_KEY = 'cvzap:dark';
const CUR_ID_KEY = 'curriculou:curriculoId';
const CUR_TITULO_KEY = 'curriculou:curriculoTitulo';
const FONTS_HREF = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Lora:wght@500;600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap';

type View = 'landing' | 'editor' | 'login' | 'curriculos' | 'admin' | SitePagina;

export default function CurriculouPage() {
  const [view, setView] = useState<View>('landing');
  const [usuario, setUsuario] = useState<Usuario | null>(null);
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

  // rastreia a navegação (analytics)
  useEffect(() => { track('pageview', view); }, [view]);

  // carrega o usuário logado (se houver token válido)
  useEffect(() => { me().then((u) => { if (u) setUsuario(u); }); }, []);

  // retorno da assinatura do Mercado Pago: ?assinado=1 -> aguarda o webhook ativar o plano
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get('assinado')) return;
    window.history.replaceState({}, '', window.location.pathname);
    toast.success('Assinatura recebida! Ativando seu Profissional...');
    let n = 0;
    const tid = window.setInterval(async () => {
      n++;
      const u = await me();
      if (u) setUsuario(u);
      if (u?.plano === 'pro') {
        clearInterval(tid);
        toast.success('Profissional ativo! Agora você baixa sem marca d\'água. 🎉', { duration: 9000 });
        setView('editor');
      } else if (n >= 6) {
        clearInterval(tid);
        toast('Assinatura em processamento — em instantes o Profissional será ativado.', { duration: 9000 });
      }
    }, 2000);
    return () => clearInterval(tid);
  }, []);

  // retorno do Mercado Pago: ?pago=<id> -> confere e baixa o PDF
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('pago');
    const limparUrl = () => window.history.replaceState({}, '', window.location.pathname);
    if (!id) {
      if (params.get('falhou')) { toast.error('Pagamento não concluído. Você pode tentar de novo.'); setView('editor'); limparUrl(); }
      return;
    }
    // guarda o código para o cliente conseguir recuperar depois
    try { localStorage.setItem(ULTIMO_PEDIDO_KEY, id); } catch { /* quota */ }
    setView('editor');
    let tentativas = 0;
    const tid = window.setInterval(async () => {
      tentativas++;
      const { pago, snapshot } = await buscarPedido(id);
      if (pago) {
        clearInterval(tid);
        limparUrl();
        toast.success('Pagamento aprovado! Baixando seu currículo. 🎉');
        // prefere o currículo guardado no servidor (vale em qualquer aparelho);
        // se por algum motivo não houver, cai para o que está salvo no navegador.
        setTimeout(() => { if (snapshot) baixarDeSnapshot(snapshot); else baixarCurriculoSalvo(); }, 600);
        setTimeout(() => toast(`Guarde seu código: ${id} — com ele você baixa de novo quando quiser.`, { duration: 12000 }), 1600);
      } else if (tentativas >= 8) {
        clearInterval(tid);
        limparUrl();
        toast(`Pagamento em processamento. Assim que confirmar, use o código ${id} em "Já paguei" para baixar. 🙂`, { duration: 12000 });
      }
    }, 1500);
    return () => clearInterval(tid);
  }, []);

  const toggleDark = () => setDark((v) => !v);
  const irEditor = () => setView('editor');
  const irHome = () => setView('landing');
  const navegar = (p: SitePagina) => setView(p);
  const irLogin = () => setView('login');
  const aoLogar = (u: Usuario) => { setUsuario(u); setView('curriculos'); };
  const sair = () => { logout(); setUsuario(null); toast('Você saiu da conta.'); };
  const irMeusCurriculos = () => setView(usuario ? 'curriculos' : 'login');
  const abrirCurriculo = (snap: CvSnapshot, id: string, titulo: string) => {
    aplicarSnapshot(snap);
    try { localStorage.setItem(CUR_ID_KEY, id); localStorage.setItem(CUR_TITULO_KEY, titulo); } catch { /* */ }
    setView('editor');
  };
  const novoCurriculo = () => {
    try {
      localStorage.removeItem(CUR_ID_KEY); localStorage.removeItem(CUR_TITULO_KEY);
      localStorage.removeItem('cvzap:estado:v1'); localStorage.removeItem('cvzap:foto:v1');
    } catch { /* */ }
    setView('editor');
  };

  const irAdmin = () => setView('admin');
  const propsSite = { usuario, onEntrar: irLogin, onSair: sair, onMeusCurriculos: irMeusCurriculos, onAdmin: irAdmin };

  return (
    <div id="cvzap-root" className={dark ? 'dark' : ''}>
      {view === 'login' ? (
        <AuthView onLogado={aoLogar} onVoltar={irHome} />
      ) : view === 'curriculos' ? (
        <MeusCurriculos onAbrir={abrirCurriculo} onNovo={novoCurriculo} onVoltar={irHome} />
      ) : view === 'admin' ? (
        <Admin onVoltar={irHome} />
      ) : view === 'editor' ? (
        <CurriculouEditor onVoltar={irHome} dark={dark} onToggleDark={toggleDark} logado={!!usuario} plano={usuario?.plano} onMeusCurriculos={irMeusCurriculos} onPrecisaLogin={irLogin} />
      ) : view === 'landing' ? (
        <Landing onIniciar={irEditor} onNavegar={navegar} dark={dark} onToggleDark={toggleDark} {...propsSite} />
      ) : (
        <SitePages pagina={view} onIniciar={irEditor} onHome={irHome} onNavegar={navegar} dark={dark} onToggleDark={toggleDark} {...propsSite} />
      )}
    </div>
  );
}
