# Deploy do CVZap na Hostinger

São duas partes: **frontend** (o app) e **backend** (pagamento Mercado Pago).
Dá pra subir só o frontend primeiro (já libera a URL que o Mercado Pago exige) e o backend depois.

---

## Parte 1 — Frontend (o app)

> Opção da Hostinger: **Adicionar site → Site PHP/HTML personalizado**

1. No seu PC, gere o build:
   ```
   npm install
   npm run build
   ```
   Isso cria a pasta **`dist/`**.

2. Na Hostinger, em "Site PHP/HTML personalizado", faça **upload de TODO o conteúdo de `dist/`** para a pasta pública do site (`public_html`).
   - O arquivo **`.htaccess`** já vai junto (faz a rota `/cvzap` funcionar).

3. Pronto. Acesse: `https://seudominio.com/cvzap`

> ✅ Essa URL (`https://seudominio.com`) é a que você coloca no campo **"Site (obrigatório)"** do Mercado Pago.
> Observação: o app inteiro sobe junto; o produto CVZap fica em **/cvzap**. Se quiser o CVZap na raiz do domínio, me avise que eu separo num build próprio.

---

## Parte 2 — Backend de pagamento (Mercado Pago)

> Opção da Hostinger: **Adicionar site → Web app Node.js**

1. Suba a pasta **`cvzap-backend/`** (via GitHub ou upload dos arquivos).
2. A Hostinger roda `npm install` e `npm start` automaticamente.
3. Configure as **variáveis de ambiente** (no painel do app Node, ou num arquivo `.env`):
   - `MP_ACCESS_TOKEN` → seu **Access Token de produção** do Mercado Pago
     (Mercado Pago → Suas integrações → sua aplicação → Credenciais de produção)
   - `FRONTEND_URL` → `https://seudominio.com`
   - `BACKEND_URL` → a URL pública deste backend (ex.: `https://api.seudominio.com`)
4. Anote a URL pública do backend.

### Configurar o webhook no Mercado Pago
No painel do MP, em **Webhooks/Notificações**, aponte para:
```
https://SEU-BACKEND/api/webhook
```

---

## Parte 3 — Ligar o pagamento real no frontend

Hoje o pagamento está em **modo demonstração** (sempre aprova) para funcionar local.
Para usar o Mercado Pago de verdade:

1. Crie um arquivo **`.env`** na raiz do frontend com:
   ```
   VITE_API_URL=https://SEU-BACKEND
   ```
2. No componente `src/cvzap/components/editor/PaywallModal.tsx`, troque a função `pagar()`
   para usar `iniciarCheckout(comFoto, promo)` (de `lib/pagamento.ts`) em vez do `cobrar()` mock.
   - `iniciarCheckout` redireciona para o Checkout Pro do Mercado Pago.
   - Ao voltar, o app confere o pagamento com `verificarPago(id)` e libera o download.
3. `npm run build` de novo e suba o `dist/` atualizado.

> Me chame que eu faço essa troca (passo 2) quando o backend estiver no ar.

---

## Checklist rápido
- [ ] `npm run build` e subir `dist/` (Site PHP/HTML) → pega a URL
- [ ] Cadastrar credenciais de produção no MP usando essa URL (Setor: Serviços de TI)
- [ ] Subir `cvzap-backend/` (Web app Node.js) + variáveis de ambiente
- [ ] Configurar webhook `/api/webhook` no MP
- [ ] Criar `.env` do frontend com `VITE_API_URL` e ligar o checkout real
