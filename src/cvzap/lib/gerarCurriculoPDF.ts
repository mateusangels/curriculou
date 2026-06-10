// ── Geração de currículo em PDF via janela de impressão do navegador ─────────
import type { CurriculoData } from '../types';
import type { DesignConfig, SectionsConfig } from '../design/types';
import { documentoHTML, RenderOpts } from '../design/render';

export function gerarCurriculoPDF(data: CurriculoData, design: DesignConfig, sections: SectionsConfig, opts?: RenderOpts) {
  const html = documentoHTML(data, design, sections, opts);
  const w = window.open('', '_blank', 'width=900,height=900');
  if (!w) {
    alert('Permita pop-ups neste site para gerar o PDF do currículo.');
    return;
  }
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 500);
}
