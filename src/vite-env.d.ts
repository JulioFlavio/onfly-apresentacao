/// <reference types="vite/client" />

// Tipa as variaveis de ambiente acessiveis via import.meta.env.
// Toda env exposta ao front pelo Vite precisa do prefixo VITE_.
interface ImportMetaEnv {
  readonly VITE_ANTHROPIC_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
