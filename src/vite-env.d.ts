/// <reference types="vite/client" />

// Variaveis de ambiente acessiveis via import.meta.env no frontend.
// NAO declare ANTHROPIC_API_KEY aqui — ela nao tem prefixo VITE_ e
// portanto nao e injetada no bundle. A chave fica exclusivamente no
// servidor (proxy do Vite em dev, Edge Function em producao).
interface ImportMetaEnv {
  // adicione aqui apenas variaveis seguras para o browser (prefixo VITE_)
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
