// netlify/edge-functions/anthropic.ts
// Edge Function que substitui em PRODUCAO o proxy do Vite (vite.config.ts).
//
// Por que existe:
//   - O proxy do Vite so roda no dev server (npm run dev). Em producao o
//     site e um bundle estatico servido pela Netlify e nao ha um Node
//     intermediando as chamadas a Anthropic.
//   - Sem este hop server-side teriamos dois problemas: (1) CORS, porque
//     api.anthropic.com nao autoriza requisicoes a partir do browser, e
//     (2) vazamento da chave, ja que qualquer chave embarcada no bundle
//     fica visivel pra quem abrir o DevTools.
//
// Como funciona:
//   - A Netlify roteia /api/anthropic/v1/messages para esta funcao (ver
//     netlify.toml). A funcao roda em um runtime Deno na borda (perto do
//     usuario), le ANTHROPIC_API_KEY do ambiente, e repassa o body cru
//     para https://api.anthropic.com/v1/messages com os headers exigidos.
//   - O frontend continua chamando /api/anthropic/v1/messages — o mesmo
//     path do dev — entao nada muda no codigo cliente.

import type { Context } from 'https://edge.netlify.com'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

export default async (request: Request, _context: Context): Promise<Response> => {
  // Aceitamos apenas POST. Outros metodos retornam 405 explicito para
  // facilitar debug se algum cliente chamar errado.
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // Netlify.env.get e o jeito recomendado de ler env vars em Edge Functions.
  // A chave e configurada no painel da Netlify (Site settings -> Env vars)
  // e NUNCA vai pro bundle do cliente.
  const apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY nao configurada no ambiente da Netlify' }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    )
  }

  // Repassamos o body como stream (request.body) sem desserializar:
  // assim suportamos respostas grandes e eventual streaming sem custo
  // adicional de parse/stringify.
  const upstream = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: request.body,
  })

  // Devolvemos a resposta da Anthropic praticamente como veio. Copiamos
  // status e headers relevantes para o cliente — o content-type ja vem
  // correto (application/json ou text/event-stream em modo streaming).
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'application/json',
    },
  })
}

// config.path diz a Netlify quais URLs do site disparam esta funcao.
// Equivale ao bloco [[edge_functions]] do netlify.toml; mantemos os dois
// (toml + export) por redundancia e clareza.
export const config = {
  path: '/api/anthropic/v1/messages',
}
