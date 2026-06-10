# Curriculou — by NEXOR

Editor de currículo online: monte na tela (WYSIWYG) ou pelo chat com a assistente Camila, escolha o modelo, personalize o design e baixe em PDF.

## Recursos
- ✏️ Editor visual (folha A4 editável, clica e digita)
- 💬 Assistente por chat (preenche o currículo conversando)
- 🎨 Modelos + painel de Design (cores, fontes, colunas, seções)
- 🧠 Normalização automática (nome, telefone, datas, e-mail, correções)
- 🖼️ Foto com recorte/zoom
- 📄 Exportação em PDF
- 💳 Paywall com Mercado Pago (modo demo; backend em `cvzap-backend/`)

## Rodar local
```bash
npm install
npm run dev
```
Abra http://localhost:5180

## Build
```bash
npm run build   # gera dist/
```

## Deploy
Veja **DEPLOY-HOSTINGER.md** (frontend estático + backend Node de pagamento).

## Estrutura
- `src/cvzap/` — app (editor, chat, modelos, design, normalização, pagamento)
- `cvzap-backend/` — backend de pagamento (Mercado Pago)
