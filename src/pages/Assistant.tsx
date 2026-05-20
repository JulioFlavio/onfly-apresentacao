// src/pages/Assistant.tsx
// Tela de chat com o Copilot. É a "estrela" da demo: aqui o colaborador
// conversa com a IA e vê a personalização entrar em cena.
//
// A página delega toda a lógica de chat para o hook useChat (histórico,
// loading, envio) e cuida apenas de UI: layout, scroll automático,
// digitação, sugestões e estado do campo de input.

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { contexto } from '../data/mockData';
import type { Mensagem } from '../types';

// Mensagem de abertura que o usuário vê ao entrar na tela. Fica FORA do
// histórico do hook de propósito: ela não é enviada de volta para a API
// como turno do assistente — é só uma instrução visual de boas-vindas.
const MENSAGEM_BOAS_VINDAS: Mensagem = {
  role: 'assistant',
  content:
    'Olá, Júlio! 👋 Sou o Copilot do seu Azulzinho. Pode me perguntar sobre seu saldo, limites da política da empresa ou qualquer dúvida sobre suas despesas.',
};

// Três pontos de partida sugeridos quando o chat ainda está vazio.
// Constante no topo do módulo para evitar recriar o array a cada render.
const SUGESTOES = [
  'Qual é meu saldo disponível hoje?',
  'Por que minha última compra foi bloqueada?',
  'Posso jantar num restaurante esta noite?',
];

const Assistant = () => {
  const navigate = useNavigate();

  // Toda a máquina de estado do chat vem do hook — esta página não
  // toca em useState para mensagens/loading/erro.
  const { mensagens, carregando, enviarMensagem } = useChat();

  // Estado local: apenas o texto digitado no campo. É local à página
  // porque não interessa pra mais ninguém (não é compartilhado entre
  // componentes), então não vale subir para um hook ou contexto.
  const [inputTexto, setInputTexto] = useState<string>('');

  // useRef devolve um objeto mutável { current: T | null } que sobrevive
  // a re-renders sem causá-los. Usamos para guardar uma REFERÊNCIA ao
  // elemento DOM no fim da lista, e disparar scrollIntoView imperativo.
  // (Se usássemos useState para guardar esse elemento, cada render
  //  geraria um novo objeto e poderíamos entrar em loops; refs existem
  //  exatamente para esse tipo de "valor mutável sem render".)
  const fimDaListaRef = useRef<HTMLDivElement | null>(null);

  // Ref do textarea — precisamos dela para resetar style.height ao limpar
  // o input após o envio. Sem isso, o textarea ficaria "alto e vazio"
  // até o usuário começar a digitar de novo.
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // useEffect com dependência [mensagens] dispara DEPOIS de cada render
  // em que o array de mensagens mudou. É o gancho certo pra mexer no DOM
  // (scrollIntoView é uma operação imperativa sobre o elemento real,
  // que só existe APÓS o React ter comitado as mudanças na tela).
  //
  // Quando o usuário envia uma mensagem, mensagens cresce → este efeito
  // roda e rola até o fim. Quando a IA responde, idem. O carregando NÃO
  // está nas dependências porque o setMensagens já dispara a rolagem
  // junto da renderização dos pontinhos (ambas as atualizações de estado
  // são lotadas no mesmo render pelo React 18).
  useEffect(() => {
    fimDaListaRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  /**
   * Envia o conteúdo do textarea (ou um texto vindo de uma sugestão).
   *
   * O parâmetro textoOverride é OPCIONAL (a interrogação `?` no nome).
   * Quando o usuário clica em uma sugestão, passamos a string direto e
   * ignoramos o que estiver no input. Quando o usuário aperta Enter ou
   * clica em Enviar, chamamos sem argumento e usamos inputTexto.
   *
   * O operador ?? (nullish coalescing) escolhe o lado esquerdo a menos
   * que ele seja null/undefined — perfeito para "use o override se foi
   * passado, senão caia no input". Diferente do || tradicional, ?? NÃO
   * cai no fallback quando o valor é '' ou 0, o que pode importar em
   * outros contextos (aqui o trim() seguinte trata strings vazias).
   */
  function handleEnviar(textoOverride?: string): void {
    const texto = (textoOverride ?? inputTexto).trim();

    // Guard clause: nada a fazer se o texto está vazio ou se ainda há
    // uma chamada em curso (evita disparar duas requisições em paralelo).
    if (!texto || carregando) return;

    // Limpa o input ANTES de chamar — UX otimista: o usuário vê o campo
    // esvaziar imediatamente, antes de a rede responder.
    setInputTexto('');

    // Reseta a altura do textarea para o estado inicial. O auto-grow
    // (no onChange) deixa style.height fixo num valor maior quando o
    // texto ocupa várias linhas; sem este reset, o campo continuaria
    // expandido visualmente mesmo após esvaziar.
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Fire-and-forget: o hook lida com erros internamente, então não
    // precisamos await nem .catch aqui. A UI reage via estados expostos.
    enviarMensagem(texto, contexto);
  }

  /**
   * Trata o atalho Enter no textarea.
   * Enter sozinho envia. Shift+Enter quebra linha (comportamento padrão
   * do textarea), porque a checagem !e.shiftKey impede o preventDefault
   * nesse caso. onKeyDown é o evento correto: onKeyPress está depreciado
   * desde 2020 e o React desencoraja seu uso.
   */
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  }

  // Lista completa exibida na área de mensagens: a boas-vindas hardcoded
  // SEMPRE no topo, depois o histórico real do hook. Concatenar aqui evita
  // duplicar o JSX de renderização do balão.
  const mensagensExibidas: Mensagem[] = [MENSAGEM_BOAS_VINDAS, ...mensagens];

  // O chat só mostra sugestões quando a conversa ainda não começou,
  // ou seja, quando o histórico do HOOK está vazio (a boas-vindas não conta).
  const mostrarSugestoes = mensagens.length === 0 && !carregando;

  return (
    // h-screen + flex coluna isolam a página em três faixas verticais
    // (header / mensagens / input). O bg-dark vem do tema.
    <div className="h-screen flex flex-col bg-dark">

      {/* ====== 1. HEADER ====== */}
      {/* flex-shrink-0 garante que o header NÃO seja comprimido quando
          o conteúdo do meio crescer (a lista de mensagens pode ser longa). */}
      <header className="flex-shrink-0 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
        {/* Botão voltar — usa navigate('/') para retornar ao Dashboard.
            type="button" evita que o botão dispare submit caso esteja
            dentro de um <form> no futuro. */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-text-main p-2 rounded hover:bg-border/40 transition-colors"
          aria-label="Voltar ao Dashboard"
        >
          ←
        </button>

        {/* Título central. flex-1 + text-center centraliza visualmente
            entre o botão à esquerda e o status à direita. */}
        <h1 className="flex-1 text-center text-text-main font-bold">
          Copilot
        </h1>

        {/* Indicador de status. O ponto verde + texto "Online" reforça
            que o assistente está vivo, sem ocupar espaço demais. */}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-success rounded-full" aria-hidden="true" />
          <span className="text-success text-xs font-medium">Online</span>
        </div>
      </header>

      {/* ====== 2. ÁREA DE MENSAGENS (scroll) ====== */}
      {/* flex-1 absorve toda a altura sobrando. overflow-y-auto isola o
          scroll nesta região — header e input permanecem fixos. p-4 = 16px. */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* space-y-3 (= 12px) dá respiro vertical entre balões e demais blocos. */}
        <div className="space-y-3">
          {mensagensExibidas.map((msg, idx) => {
            // Lógica de roteamento entre dois layouts de balão.
            // O usuário pode ver isso como "duas variantes do mesmo
            // componente", e abstrair em <Balao role=... /> mais tarde.
            const ehUsuario = msg.role === 'user';

            return (
              // key={idx}: usamos o índice porque (1) a lista é APPEND-ONLY
              // — mensagens nunca são removidas ou reordenadas no chat;
              // (2) cada balão não tem estado interno (foco, edição) que
              // precise ser preservado entre renders. Nesses dois cenários,
              // index-as-key é seguro e até preferível, já que não há um
              // id natural na mensagem.
              <div
                key={idx}
                className={`flex items-end gap-2 ${ehUsuario ? 'justify-end' : 'justify-start'}`}
                // Animação de entrada: fade + slide de 8px de baixo pra cima.
                // Aplicada inline porque (1) usa @keyframes custom definido em
                // index.css, (2) só dispara no mount do elemento — itens já
                // existentes não re-animam quando o array de mensagens cresce.
                style={{ animation: 'messageIn 200ms ease-out' }}
              >
                {/* Avatar da IA — só para mensagens do assistant. */}
                {!ehUsuario && (
                  <div
                    className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-sm shrink-0"
                    aria-hidden="true"
                  >
                    🤖
                  </div>
                )}

                {/* Balão da mensagem.
                    - rounded-2xl arredonda os 4 cantos, e zeramos o canto
                      do "ponto de origem" do balão (tl pra IA, tr pro user)
                      criando aquele visual clássico de chat com "rabicho".
                    - whitespace-pre-wrap preserva quebras de linha vindas
                      da IA (parágrafos) e do Shift+Enter no input.
                    - max-w-[80%] impede que um balão muito longo ocupe
                      a largura inteira; força a leitura em coluna. */}
                <div
                  className={[
                    'rounded-2xl px-4 py-3 text-sm max-w-[80%] whitespace-pre-wrap',
                    ehUsuario
                      ? 'bg-primary text-white rounded-tr-none'
                      : 'bg-surface border border-border text-text-main rounded-tl-none',
                  ].join(' ')}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}

          {/* ====== INDICADOR DE "DIGITANDO..." ====== */}
          {/* Aparece como um balão da IA com três bolinhas pulando
              em sequência. Renderizado APÓS o map para ficar sempre no
              final visual da lista. */}
          {carregando && (
            <div className="flex items-end gap-2 justify-start" role="status" aria-label="Copilot digitando">
              <div
                className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-sm shrink-0"
                aria-hidden="true"
              >
                🤖
              </div>
              <div className="bg-surface border border-border rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full bg-text-muted animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-text-muted animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-text-muted animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          )}

          {/* ====== SUGESTÕES (chat vazio) ====== */}
          {/* Só aparecem quando o histórico do hook está vazio E não há
              chamada em curso. Servem como "rampa de entrada" para o
              usuário que abre o chat e não sabe o que perguntar. */}
          {mostrarSugestoes && (
            <div className="pt-2 flex flex-col gap-2">
              {SUGESTOES.map((sugestao) => (
                <button
                  key={sugestao}
                  type="button"
                  onClick={() => handleEnviar(sugestao)}
                  className="bg-surface border border-border rounded-xl px-3.5 py-2.5 text-text-muted text-sm text-left hover:border-primary/50 hover:text-text-main transition-colors"
                >
                  {sugestao}
                </button>
              ))}
            </div>
          )}

          {/* Sentinela do scroll automático. Não renderiza nada visual —
              só serve como alvo para scrollIntoView() no useEffect acima. */}
          <div ref={fimDaListaRef} />
        </div>
      </div>

      {/* ====== 4. INPUT FIXO NO RODAPÉ ====== */}
      <form
        // O <form> wrapper permite que o submit funcione tanto via Enter
        // (no campo) quanto via clique no botão. Prevenimos o reload
        // padrão e delegamos ao handleEnviar.
        onSubmit={(e) => {
          e.preventDefault();
          handleEnviar();
        }}
        className="flex-shrink-0 bg-surface border-t border-border px-4 py-3 flex gap-2"
      >
        <textarea
          // rows={1} arranca o textarea no tamanho de uma linha. O resize-none
          // bloqueia a "alça" de arrastar manualmente; o crescimento é feito
          // programaticamente no onChange. max-h-32 (= 128px) limita o teto e
          // overflow-y-auto faz aparecer scroll interno se passar disso —
          // evita um textarea gigante engolindo a tela em mensagens longas.
          ref={textareaRef}
          rows={1}
          value={inputTexto}
          onChange={(e) => {
            setInputTexto(e.target.value);
            // Auto-grow: zeramos a altura para que o browser RE-MEDIR o
            // conteúdo (sem o reset, scrollHeight só cresceria, nunca
            // encolheria). Em seguida aplicamos scrollHeight como altura
            // — é o tamanho exato que o conteúdo precisa para caber.
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={handleKeyDown}
          disabled={carregando}
          placeholder="Pergunte sobre seu cartão..."
          className={`flex-1 bg-dark border border-border rounded-xl px-3.5 py-2.5 text-text-main text-sm resize-none outline-none focus:border-primary/60 transition-colors max-h-32 overflow-y-auto ${
            carregando ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />

        <button
          // type="submit" garante que Enter no <textarea> dispare o submit
          // (no caso quando o textarea estiver com foco e usuário acertar
          // o atalho — embora o nosso onKeyDown já trate isso explicitamente).
          type="submit"
          disabled={carregando}
          className={`bg-primary text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity ${
            carregando ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Enviar
        </button>
      </form>
    </div>
  );
};

export default Assistant;
