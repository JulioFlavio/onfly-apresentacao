// src/services/anthropic.ts
// Camada de integração com a API da Anthropic.
// Toda a comunicação com a IA passa por este arquivo — o resto do app
// (hook useChat, páginas) não sabe que existe um fetch acontecendo. Esse
// isolamento facilita trocar a implementação no futuro (ex.: passar a falar
// com um backend da Onfly em vez da API direta) sem mexer no resto do código.

import type { Mensagem, ContextoCartao, Transacao } from '../types';

// Endpoint LOCAL — apontamos para o proxy configurado em vite.config.ts.
// O Vite intercepta esse path, injeta os headers de autenticação
// (x-api-key, anthropic-version) server-side e repassa para
// https://api.anthropic.com/v1/messages. Vantagens:
//   - Não há header de Authorization no front (a chave nunca aparece no bundle).
//   - Sem dor de cabeça com CORS (a chamada sai da mesma origem do app).
const ANTHROPIC_URL = '/api/anthropic/v1/messages';

// Modelo escolhido. claude-sonnet-4 é o melhor custo/benefício para chat
// com contexto longo — barato o suficiente para uma demo e inteligente o
// suficiente para responder com nuance sobre política de despesas.
const MODEL = 'claude-sonnet-4-20250514';

// Teto de tokens da resposta. ~1000 tokens dá folga para 2–3 parágrafos
// em português sem deixar a IA escrever um ensaio.
const MAX_TOKENS = 1000;

// Formatter de moeda brasileira reutilizado nas interpolações.
// Criar uma vez e reutilizar é mais rápido que instanciar Intl.NumberFormat
// dentro de cada interpolação (é um objeto razoavelmente pesado).
const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/**
 * Converte um array de transações na lista textual que vai dentro do
 * system prompt. Mantida privada (sem export) porque é detalhe de
 * implementação do prompt — ninguém de fora precisa conhecê-la.
 *
 * Saída de exemplo:
 *   - 2026-05-19 12:30 — Restaurante Central — R$ 67,50 — aprovada
 *   - 2026-05-18 23:15 — Bar Noturno — R$ 95,00 — bloqueada (motivo: ...)
 */
function formatarTransacoes(transacoes: Transacao[]): string {
  // .slice(0, 5) pega as 5 mais recentes assumindo que o array já vem
  // em ordem decrescente de data (como em mockData.ts).
  return transacoes
    .slice(0, 5)
    .map((t) => {
      // Para transações bloqueadas anexamos o motivo entre parênteses para
      // que a IA tenha contexto na hora de explicar/sugerir alternativa.
      const sufixoMotivo = t.status === 'bloqueada' && t.motivo
        ? ` (motivo: ${t.motivo})`
        : '';
      return `- ${t.data} — ${t.descricao} — ${brl.format(t.valor)} — ${t.status}${sufixoMotivo}`;
    })
    .join('\n');
}

/**
 * Monta o system prompt completo a partir do contexto do cartão.
 * Extraído em função separada para deixar enviarMensagemParaIA enxuta
 * e facilitar testar/ajustar o prompt isoladamente.
 */
function montarSystemPrompt(contexto: ContextoCartao): string {
  const { colaborador, politica, transacoes } = contexto;

  // Template literal multilinha. Cada bloco é separado por uma linha em
  // branco para o modelo distinguir visualmente as seções.
  return `Você é o Copilot do Azulzinho, assistente de cartão corporativo da Onfly.
Você ajuda colaboradores a entenderem suas despesas, limites e a política de gastos da empresa.

DADOS DO COLABORADOR:
- Nome: ${colaborador.nome}
- Empresa: ${colaborador.empresa}
- Saldo disponível: ${brl.format(colaborador.saldo)}
- Limite total do ciclo: ${brl.format(colaborador.limite)}

POLÍTICA DE DESPESAS DA EMPRESA:
- Horário permitido: ${politica.horarioPermitido}
- Categorias cobertas: ${politica.categorias.join(', ')}
- Limite diário: ${brl.format(politica.limiteDiario)}
- Limite por refeição: ${brl.format(politica.limiteRefeicao)}
- Limite de hospedagem: ${brl.format(politica.limiteHospedagem)}
- Observações: ${politica.observacoes}

ÚLTIMAS TRANSAÇÕES:
${formatarTransacoes(transacoes)}

REGRAS DE COMPORTAMENTO:
- Responda sempre em português brasileiro.
- Trate o colaborador pelo primeiro nome (${colaborador.nome.split(' ')[0]}).
- Seja direto: comece com "Sim" ou "Não" antes de explicar.
- Se uma compra violar a política, explique o motivo e sugira uma alternativa concreta.
- Nunca invente dados que não estejam no contexto acima — se algo não for conhecido, diga isso.
- Mantenha as respostas curtas: no máximo 3 parágrafos.`;
}

/**
 * Envia uma mensagem do colaborador para a IA, junto com todo o histórico
 * da conversa e o contexto do cartão, e devolve o texto da resposta.
 *
 * Promise<string> = "esta função é assíncrona e, em algum momento no futuro,
 * vai resolver com uma string" (ou rejeitar com um erro). Usamos async/await
 * para escrever isso de forma linear, como se fosse código síncrono.
 */
export async function enviarMensagemParaIA(
  mensagem: string,
  historico: Mensagem[],
  contexto: ContextoCartao,
): Promise<string> {
  try {
    // 1) Monta o system prompt injetando os dados do cartão. Isso é refeito
    //    a cada chamada porque o contexto pode mudar (novo saldo, nova
    //    transação) entre uma pergunta e outra.
    const systemPrompt = montarSystemPrompt(contexto);

    // 2) Dispara a requisição POST. O fetch é o cliente HTTP nativo do
    //    browser — não precisa de axios pra algo tão simples.
    //
    //    Não enviamos x-api-key nem anthropic-version daqui: o proxy
    //    do Vite (vite.config.ts) injeta esses headers no hop entre
    //    servidor e Anthropic, mantendo a chave fora do browser.
    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,                  // Qual modelo da Anthropic responde
        max_tokens: MAX_TOKENS,        // Teto de tokens da resposta
        system: systemPrompt,          // Instruções e contexto (separado das mensagens)
        messages: [
          ...historico,                // Toda a conversa anterior, em ordem
          { role: 'user', content: mensagem }, // A pergunta nova que acabou de chegar
        ],
      }),
    });

    // 3) Se a API respondeu com status fora da faixa 2xx, fetch NÃO joga
    //    erro sozinho — precisamos checar response.ok manualmente.
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ao chamar a Anthropic`);
    }

    // 4) Parse do corpo JSON. data.content vem como ARRAY de blocos —
    //    cada bloco tem um type ("text", "tool_use", etc.). Filtramos
    //    pelo bloco de texto e pegamos o campo .text dele.
    const data = await response.json();
    const blocoTexto = (data.content as Array<{ type: string; text?: string }>)
      .find((bloco) => bloco.type === 'text');

    // Defesa contra resposta sem nenhum bloco de texto (improvável, mas
    // a IA poderia teoricamente retornar só tool_use, por exemplo).
    if (!blocoTexto || !blocoTexto.text) {
      throw new Error('Resposta da Anthropic sem bloco de texto');
    }

    return blocoTexto.text;
  } catch (erro) {
    // Logamos no console para debugar durante a apresentação, mas o
    // usuário recebe uma mensagem amigável — nunca um stack trace.
    console.error('[anthropic] falha ao enviar mensagem:', erro);
    return 'Desculpe, não consegui me conectar agora. Tente novamente em instantes.';
  }
}
