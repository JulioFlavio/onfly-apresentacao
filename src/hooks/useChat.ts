// src/hooks/useChat.ts
// Custom hook que encapsula TODO o estado e a lógica de conversa com o Copilot.
// A página Assistant.tsx só vai consumir os valores expostos aqui — nada de
// fetch ou useState soltos lá. Isso mantém a página focada em JSX/UI e deixa
// a lógica de chat reutilizável e testável de forma isolada.

import { useState } from 'react';
import { enviarMensagemParaIA } from '../services/anthropic';
import type { Mensagem, ContextoCartao } from '../types';

/**
 * Hook de chat. Gerencia histórico de mensagens, estado de carregamento,
 * estado de erro e expõe duas ações: enviar mensagem e limpar conversa.
 *
 * Uso:
 *   const { mensagens, carregando, erro, enviarMensagem, limparConversa } = useChat();
 */
export function useChat() {
  // Histórico completo da conversa, na ordem cronológica.
  // Começa vazio — a mensagem de boas-vindas (PROMPT 8) é renderizada
  // fora do histórico, então não conta como turno do array.
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);

  // True enquanto aguardamos a resposta da IA. A UI usa esse flag para
  // mostrar o "indicador de digitação" e desabilitar o input.
  const [carregando, setCarregando] = useState<boolean>(false);

  // Mensagem de erro de fluxo inesperado. O service de Anthropic já trata
  // falhas de rede e devolve um fallback amigável como texto da IA — esse
  // estado aqui é a rede de segurança para erros que escaparem ao service
  // (ex.: bug de código, exceção síncrona).
  const [erro, setErro] = useState<string | null>(null);

  /**
   * Envia uma mensagem do colaborador e aguarda a resposta da IA.
   *
   * IMPORTANTE: a mensagem do usuário é adicionada ao histórico ANTES
   * de chamar a API (UX otimista — a pessoa vê o que digitou aparecendo
   * imediatamente, sem esperar a rede).
   *
   * O histórico passado para o service é o estado ANTERIOR à mensagem
   * nova, porque enviarMensagemParaIA já anexa { role: 'user', content }
   * internamente. Se mandássemos o histórico já atualizado, a última
   * mensagem do usuário iria duplicada no array enviado à Anthropic.
   */
  async function enviarMensagem(texto: string, contexto: ContextoCartao): Promise<void> {
    // 1) Captura o histórico atual em uma const local. O closure desta
    //    função "fotografa" o valor de `mensagens` neste render — é
    //    exatamente o que precisamos como "histórico anterior".
    const historicoAnterior = mensagens;

    // 2) Monta o objeto da mensagem do usuário no formato esperado pela API.
    const mensagemUsuario: Mensagem = { role: 'user', content: texto };

    // 3) Acrescenta a mensagem do usuário ao estado IMEDIATAMENTE.
    //    Usamos o "functional updater" (prev => ...) em vez de espalhar
    //    `mensagens` direto, porque pode haver atualizações em fila e o
    //    React garante que `prev` sempre será o estado mais recente.
    setMensagens((prev) => [...prev, mensagemUsuario]);

    // 4) Liga o estado de carregando e zera qualquer erro anterior, para
    //    que a UI esconda mensagens de falha antigas durante a nova chamada.
    setCarregando(true);
    setErro(null);

    try {
      // 5) Chama o service. Note que o segundo argumento é o histórico
      //    ANTERIOR — sem a mensagem do usuário que acabamos de adicionar.
      const resposta = await enviarMensagemParaIA(texto, historicoAnterior, contexto);

      // 6) Monta o objeto da resposta da IA e anexa ao histórico, de novo
      //    via functional updater para evitar race com outras atualizações.
      const mensagemIA: Mensagem = { role: 'assistant', content: resposta };
      setMensagens((prev) => [...prev, mensagemIA]);
    } catch (e) {
      // 7) Se algo inesperado escapou do service, normalizamos o erro
      //    para string e expomos para a UI poder renderizar um aviso.
      const mensagemErro = e instanceof Error ? e.message : 'Erro desconhecido ao falar com o Copilot.';
      setErro(mensagemErro);
    } finally {
      // 8) Em sucesso OU falha, sempre desliga o estado de carregando.
      //    Usar finally evita esquecer esse passo em algum branch do try.
      setCarregando(false);
    }
  }

  /**
   * Reseta o chat para o estado inicial. Útil para um botão "Nova conversa"
   * ou para limpar contexto entre sessões.
   */
  function limparConversa(): void {
    setMensagens([]);
    setErro(null);
  }

  // Retornamos um objeto literal nomeado em vez de um array (como faz o
  // useState). Objetos permitem desestruturação parcial e reordenação:
  //   const { mensagens, enviarMensagem } = useChat();
  return {
    mensagens,
    carregando,
    erro,
    enviarMensagem,
    limparConversa,
  };
}
