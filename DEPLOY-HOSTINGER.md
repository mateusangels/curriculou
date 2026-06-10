# Deploy do Curriculou na Hostinger (app ÚNICO)

Um único app Node serve **o site + a API de pagamento**, usando o **MySQL da Hostinger**.
Você sobe **uma coisa só**: opção **Adicionar site → Web app Node.js**.

---

## Passo 1 — Criar o banco MySQL (hPanel)
1. hPanel → **Bancos de Dados MySQL**.
2. Crie um banco e um usuário (anote **nome do banco, usuário e senha**).
3. Dê todos os privilégios do usuário sobre o banco.
4. A tabela `pedidos` é criada sozinha quando o app sobe.

## Passo 2 — Subir o app Node
1. **Adicionar site → Web app Node.js** e conecte o repositório GitHub `curriculou`
   (ou faça upload dos arquivos).
2. **Arquivo de inicialização (startup file):** `server.js`
3. A Hostinger roda `npm install` e depois `npm start`.
   - O site já vai junto: o `dist/` (build do front) está **versionado no repositório**,
     então **não precisa buildar no servidor**.
   - (Se você alterar o front, rode `npm run build` no seu PC e dê commit do `dist/` de novo.)

## Passo 3 — Variáveis de ambiente
No painel do app Node (Environment Variables), preencha:

| Variável | Valor |
|---|---|
| `MP_ACCESS_TOKEN` | Access Token de **produção** do Mercado Pago |
| `FRONTEND_URL` | `https://seudominio.com` |
| `BACKEND_URL` | `https://seudominio.com` |
| `DB_HOST` | host do MySQL (geralmente `localhost`) |
| `DB_USER` | usuário do banco |
| `DB_PASS` | senha do banco |
| `DB_NAME` | nome do banco |

## Passo 4 — Webhook do Mercado Pago
No painel do MP → Webhooks, aponte para:
```
https://seudominio.com/api/webhook
```

## Pronto
- Site: `https://seudominio.com`
- API: `https://seudominio.com/api/...` (mesmo domínio)
- Essa URL (`https://seudominio.com`) é a que vai no campo **"Site (obrigatório)"**
  do cadastro de credenciais do Mercado Pago (Setor: Serviços de TI).

---

## Ligar o pagamento real (quando estiver tudo no ar)
O front já chama a API no **mesmo domínio** (não precisa configurar URL).
Falta só trocar o botão de pagar (hoje em modo demo) para usar o Checkout Pro:
em `src/cvzap/components/editor/PaywallModal.tsx`, usar `iniciarCheckout(comFoto, promo)`
de `src/cvzap/lib/pagamento.ts`. Me chame que eu faço essa troca.

## Rodar local
```bash
npm install
npm run build   # gera o dist/
npm start       # serve em http://localhost:3333  (sem DB = usa memória)
# ou, só o front em dev:
npm run dev     # http://localhost:5180
```
