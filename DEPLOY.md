# Guia de Deploy no Cloudflare Pages

O aplicativo está 100% pronto e otimizado para ser hospedado no **Cloudflare Pages** como uma aplicação Vite SPA (Single Page Application) com suporte a PWA.

## Como resolver o erro de deploy no Cloudflare:

O erro ocorre quando o Cloudflare tenta executar o comando incorreto (`wrangler deploy` em vez de build estático do Pages). Siga estes passos na dashboard do Cloudflare Pages:

1. Acesse o **Cloudflare Dashboard** > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git** (ou selecione seu repositório).
2. Configure as seguintes opções de Build:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build` (ou `bun run build`)
   - **Build output directory**: `dist`
   - **Root directory**: *(deixe em branco)*
3. **Importante**: **NÃO** preencha nenhum "Deploy command" customizado nas configurações avançadas do Cloudflare Pages. O Cloudflare fará o deploy automático dos arquivos estáticos gerados na pasta `dist`.

## Recursos inclusos:
- **PWA Instalável**: Funciona offline e pode ser instalado na tela inicial do celular ou desktop.
- **Interface Mobile Otimizada**: Painéis retráteis para garantir visualização máxima do mapa em dispositivos móveis.
