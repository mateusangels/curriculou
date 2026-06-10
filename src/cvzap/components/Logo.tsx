// ── Marca Curriculou ─────────────────────────────────────────────────────────
// Assets recortados de src/logo.png (fundo transparente).
// LogoIcon  -> só o ícone (combina com qualquer fundo, claro ou escuro)
// LogoFull  -> ícone + palavra "Curriculou" (a palavra é azul-marinho, use em
//              fundo claro; em fundos escuros prefira LogoMarca abaixo).
import logoIcon from '../assets/logo-icon.png';
import logoFull from '../assets/logo-full.png';

export function LogoIcon({ className = 'h-9 w-9' }: { className?: string }) {
  return <img src={logoIcon} alt="Curriculou" className={`${className} object-contain`} draggable={false} />;
}

export function LogoFull({ className = 'h-9' }: { className?: string }) {
  return <img src={logoFull} alt="Curriculou" className={`${className} w-auto object-contain`} draggable={false} />;
}

/** Ícone + texto "Curriculou" — o texto acompanha o tema (claro/escuro). */
export function LogoMarca({ icon = 'h-9 w-9', text = 'text-xl' }: { icon?: string; text?: string }) {
  return (
    <span className="flex items-center gap-2">
      <LogoIcon className={icon} />
      <span className={`${text} font-extrabold tracking-tight text-[#11296b] dark:text-white`}>Curriculou</span>
    </span>
  );
}
