# Azulzinho Copilot

Assistente de IA conversacional para o cartão corporativo Azulzinho da Onfly.

## O problema

O colaborador que usa o Azulzinho enfrenta dois momentos críticos de atrito:
- **Antes de gastar** — não sabe se a compra será aprovada pela política da empresa
- **Depois de um bloqueio** — recebe uma mensagem fria e não entende o motivo nem o que fazer

## A solução

Uma interface web onde o colaborador conversa com uma IA que conhece seu saldo, seus limites e a política da empresa — e responde em linguagem humana.

## Funcionalidades

- **Dashboard** — cartão, saldo, limite e histórico de transações
- **Bloqueio explicado** — motivo em linguagem clara e próximos passos
- **Copilot** — chat com IA contextualizada ao cartão do colaborador

## Stack

| Tecnologia | Motivo |
|---|---|
| React 18 + TypeScript | Interface tipada e componentizada |
| Vite | Build moderno com HMR |
| Tailwind CSS | Design system com tokens customizados |
| Anthropic API (Claude Sonnet 4) | IA com system prompt contextualizado |
| Netlify + Edge Functions | Deploy com proxy server-side para proteger a API key |

## Como rodar localmente

```bash
git clone https://github.com/JulioFlavio/onfly-apresentacao
cd onfly-apresentacao
npm install
cp .env.example .env
# Adicione sua VITE_ANTHROPIC_API_KEY no .env
npm run dev
```

## Deploy

https://onfly-copilot.netlify.app

---

Desenvolvido por Júlio Flávio Lages de Oliveira Júnior · ADS · PUC Minas
