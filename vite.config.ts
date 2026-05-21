// vite.config.ts
// Configuracao do Vite - o bundler/dev server que serve a aplicacao em desenvolvimento
// e gera o build de producao. O plugin React habilita JSX/TSX e Fast Refresh
// (hot reload preservando estado do componente).
//
// Aqui tambem configuramos um PROXY que intercepta chamadas a /api/anthropic
// e as repassa para https://api.anthropic.com com a API key injetada
// server-side. Isso resolve dois problemas de uma vez:
//   1. CORS — o browser nao deixa o front chamar api.anthropic.com diretamente.
//   2. Vazamento de chave — a chave fica no servidor, nunca no bundle.
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// defineConfig pode receber uma FUNCAO que recebe o modo de build
// ('development' | 'production'). Usamos essa forma porque precisamos
// chamar loadEnv para ler o arquivo .env neste contexto Node.
export default defineConfig(({ mode }) => {
  // loadEnv le .env, .env.local, .env.{mode} e .env.{mode}.local da raiz.
  // O 3o argumento '' significa "nao filtre por prefixo" — pegamos as
  // VITE_* mesmo aqui no servidor, sem expor pro browser.
  //
  // Importante: Vite NAO injeta valores de .env em process.env
  // automaticamente no contexto do config (so faz isso em import.meta.env
  // do codigo do app). Por isso usamos loadEnv e guardamos o valor numa
  // variavel local — equivale a "ler de process.env" depois que essa
  // variavel for populada.
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.ANTHROPIC_API_KEY ?? ''

  return {
    plugins: [react()],
    server: {
      port: 5173,
      open: true,
      // server.proxy mapeia prefixos de URL para destinos remotos. Cada
      // chave e um path que, quando casado no inicio da request, sera
      // repassada pelo Vite atuando como proxy reverso (http-proxy por baixo).
      proxy: {
        '/api/anthropic': {
          // target: para onde a requisicao sera reenviada (host:porta + protocolo).
          target: 'https://api.anthropic.com',
          // changeOrigin: reescreve o header "Host" para casar com o target.
          // Essencial para HTTPS — sem isso, o servidor remoto recusaria
          // o handshake TLS por incompatibilidade de Host.
          changeOrigin: true,
          // rewrite: funcao que transforma o path antes de enviar.
          // Tiramos o prefixo /api/anthropic para que
          //   /api/anthropic/v1/messages -> /v1/messages
          // chegando assim em https://api.anthropic.com/v1/messages.
          rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
          // configure: callback que recebe a instancia interna do http-proxy.
          // Usamos o evento 'proxyReq' para injetar os headers obrigatorios
          // a CADA requisicao que sai daqui em direcao a Anthropic.
          // Esses headers nunca tocam o browser — eles existem so neste
          // hop entre Vite e Anthropic.
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('x-api-key', apiKey)
              proxyReq.setHeader('anthropic-version', '2023-06-01')
              proxyReq.setHeader('content-type', 'application/json')
            })
          },
        },
      },
    },
  }
})
