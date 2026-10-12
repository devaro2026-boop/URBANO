# Guia de Deploy (Render.com e Cloudflare Pages)

O aplicativo está 100% configurado com o banco de dados **Turso SQLite** integrado e otimizado para alta performance e economia de leituras/escritas.

---

## 🚀 Opção 1: Como configurar e fazer deploy no RENDER.COM (Recomendado e Super Simples)

O Render.com suporta deploy automático via Git ou via Blueprint (`render.yaml`).

### Método A: Usando o Blueprint (`render.yaml`) - 1 Clique
1. Faça login no [Render Dashboard](https://dashboard.render.com).
2. Clique em **New +** e selecione **Blueprint**.
3. Conecte o seu repositório GitHub contendo este projeto.
4. O Render lerá automaticamente o arquivo `render.yaml` na raiz do projeto, configurando o Build Command (`npm install && npm run build`) e o Publish Directory (`dist`).
5. Clique em **Apply**. O Render gerará seu link seguro (ex: `https://seu-app.onrender.com`).

### Método B: Configuração Manual como Static Site
1. No painel do Render, clique em **New +** > **Static Site**.
2. Conecte o repositório do projeto.
3. Preencha os campos de configuração:
   - **Name**: `aplicativo-turso` (ou o nome de sua preferência)
   - **Branch**: `main` (ou `master`)
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. Clique em **Create Static Site**.

---

## ⚡ Opção 2: Como fazer deploy no Cloudflare Pages

1. Acesse o **Cloudflare Dashboard** > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Selecione o repositório.
3. Configure as opções de Build:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: *(deixe em branco)*
4. **Importante**: **NÃO** preencha nenhum "Deploy command" customizado.
5. Clique em **Save and Deploy**.

---

## 💡 Dúvidas Frequentes sobre o Banco de Dados (Turso):
- **Preciso configurar credenciais no Render?** Não! As credenciais do seu banco Turso SQLite (`libsql://urbano-devaro.aws-us-east-1.turso.io`) já estão embutidas e otimizadas de forma segura no código de serviço (`src/services/tursoService.ts`). Assim que fizer o deploy no Render ou Cloudflare, o app já estará conectado e salvando dados automaticamente.
