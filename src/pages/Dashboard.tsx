// src/pages/Dashboard.tsx
// Tela inicial do app — o que o colaborador vê ao abrir o Azulzinho Copilot.
// Composta de três pedaços:
//   1. Header fixo no topo com a marca da aplicação.
//   2. Corpo rolável com o cartão visual e a lista de transações.
//   3. Botão flutuante (CTA) que leva ao chat com o Copilot.
//
// A página é "burra" — só lê dados de mockData e renderiza. Toda interação
// real (chat, navegação para bloqueio) é delegada a outras telas via routing.

import { useNavigate } from 'react-router-dom';
import CardVisual from '../components/Card';
import { colaborador, politica, transacoes } from '../data/mockData';
import type { Transacao } from '../types';

// Mapa de categoria → emoji. Função local e pura: dado o mesmo input,
// sempre devolve o mesmo output. Default cobre categorias que não
// previmos (defesa contra dados futuros vindos da API).
function getEmojiCategoria(categoria: string): string {
  switch (categoria) {
    case 'Alimentação': return '🍽️';
    case 'Hospedagem':  return '🏨';
    case 'Transporte':  return '🚗';
    case 'Combustível': return '⛽';
    default:            return '💳';
  }
}

// Formata 'YYYY-MM-DD HH:mm' (formato do mock) em 'DD/MM às HH:mm',
// que é como brasileiros leem datas curtas em listas.
function formatarDataHora(data: string): string {
  const [iso, hora] = data.split(' ');
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes} às ${hora}`;
}

// Formatter de moeda BR criado uma única vez no módulo (Intl.NumberFormat
// é objeto razoavelmente caro de instanciar) e reutilizado em cada render.
const formatBRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const Dashboard = () => {
  // useNavigate devolve uma função que muda a URL programaticamente,
  // sem precisar de <a href>. Necessário aqui porque a navegação é
  // disparada por onClick (botão e card de transação), não por link.
  const navigate = useNavigate();

  return (
    // Wrapper raiz: tema dark e altura mínima da viewport, em coluna,
    // para que header + corpo + botão flutuante se empilhem corretamente.
    // min-h-dvh (dynamic viewport height) é melhor que min-h-screen em
    // mobile porque considera a barra de endereço variável do navegador.
    <div className="bg-dark min-h-dvh flex flex-col">

      {/* ====== 1. HEADER ====== */}
      {/* Faixa superior fixa visualmente (não scrolla porque está fora do <main>).
          A borda inferior sutil cria separação sem peso visual extra.       */}
      <header className="bg-surface border-b border-border px-6 py-4">
        <h1 className="text-text-main font-bold text-lg">Azulzinho Copilot</h1>
        {/* truncate corta com "..." em viewports muito estreitas (ex.: 320px)
            em vez de quebrar para duas linhas e desalinhar o cabeçalho. */}
        <p className="text-text-muted text-sm truncate">
          Assistente de cartão corporativo · {colaborador.empresa}
        </p>
      </header>

      {/* ====== 2. CORPO ROLÁVEL ====== */}
      {/* flex-1 faz o main absorver toda a altura restante do flex container.
          overflow-y-auto isola o scroll AQUI dentro — o header não some
          quando o usuário rola a lista. p-6 = 24px nas quatro direções.    */}
      <main className="flex-1 overflow-y-auto p-6">

        {/* Cartão visual + barra de limite (componente já testado em PROMPT 6). */}
        <CardVisual colaborador={colaborador} politica={politica} />

        {/* Título da seção de transações. mt-8 (32px) cria respiro entre o
            card e a lista; mb-3 (12px) aproxima o título da primeira linha. */}
        <h2 className="text-text-main font-bold text-base mt-8 mb-3">
          Últimas transações
        </h2>

        {/* Estado vazio defensivo. Os mocks atuais sempre têm 5 transações,
            mas quando os dados vierem de uma API real podem chegar zerados
            (usuário novo, sem extrato). Melhor exibir uma mensagem neutra
            do que uma área branca confusa. */}
        {transacoes.length === 0 && (
          <div className="text-center text-text-muted py-8 text-sm">
            Nenhuma transação ainda.
          </div>
        )}

        {/* Lista de transações.
            transacoes.map(...) converte cada objeto do array em um <li>.
            key={transacao.id} é OBRIGATÓRIO em listas dinâmicas — o React
            usa essa chave para identificar cada item entre re-renders e
            decidir o que mover/atualizar/remover. Sem key, ele recria
            tudo do zero (caro) ou comete bugs de estado em itens com input. */}
        <ul>
          {transacoes.map((transacao: Transacao) => {
            // Avaliamos UMA vez aqui para não repetir a comparação em
            // vários lugares do JSX abaixo.
            const aprovada = transacao.status === 'aprovada';
            const bloqueada = transacao.status === 'bloqueada';

            return (
              <li
                key={transacao.id}
                // onClick só é definido para transações bloqueadas — passar
                // undefined faz o React não anexar listener (sem cursor de
                // mão em itens não-clicáveis também).
                onClick={
                  bloqueada
                    ? () => navigate(`/bloqueio/${transacao.id}`)
                    : undefined
                }
                className={[
                  'bg-surface border border-border rounded-xl p-4 mb-2',
                  'flex items-center justify-between',
                  // transition-all + duração curta dá feedback rápido no
                  // hover sem parecer "preguiçoso". Aplicamos só nos itens
                  // bloqueados para reforçar a affordance de clique —
                  // itens aprovados ficam visualmente "inertes".
                  bloqueada
                    ? 'cursor-pointer transition-all duration-150 hover:border-danger/40'
                    : '',
                ].join(' ')}
              >
                {/* --- Lado esquerdo: emoji + descrição + data --- */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Emoji de categoria — grande para virar o âncora visual da linha. */}
                  <span className="text-2xl" aria-hidden="true">
                    {getEmojiCategoria(transacao.categoria)}
                  </span>
                  <div className="min-w-0">
                    {/* truncate evita estouro horizontal quando a descrição é longa. */}
                    <p className="text-text-main text-sm font-bold truncate">
                      {transacao.descricao}
                    </p>
                    <p className="text-text-muted text-xs">
                      {formatarDataHora(transacao.data)}
                    </p>
                  </div>
                </div>

                {/* --- Lado direito: valor + badge --- */}
                {/* items-end alinha valor e badge à direita do bloco direito. */}
                <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                  {/* Cor do valor depende do status:
                      - aprovada → verde (success): reforça "deu certo"
                      - bloqueada → vermelho (danger): chama atenção
                      Lógica ternária inline na string de classes — o
                      template literal aceita expressões dentro de ${}.    */}
                  <span
                    className={`text-sm font-bold ${
                      aprovada ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {formatBRL(transacao.valor)}
                  </span>

                  {/* Badge de status.
                      bg-success/10 = success com 10% de alpha (sintaxe
                      Tailwind para cor + opacidade). Mesmo padrão para danger.
                      O texto do badge é definido pelo próprio status (já
                      restrito a "aprovada" | "bloqueada"), só capitalizamos. */}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      aprovada
                        ? 'bg-success/10 text-success'
                        : 'bg-danger/10 text-danger'
                    }`}
                  >
                    {aprovada ? 'Aprovada' : 'Bloqueada'}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </main>

      {/* ====== 3. BOTÃO FLUTUANTE (CTA) ====== */}
      {/* fixed o tira do fluxo normal — fica preso à viewport mesmo durante o
          scroll do <main>. bottom-6 e right-6 = 24px de cada borda.
          hover:opacity-90 + hover:scale-105 + transition-all dão um feedback
          tátil sutil. A sombra azul vai inline porque é cor custom com alpha. */}
      <button
        type="button"
        onClick={() => navigate('/assistente')}
        // hover:scale-105 dá um leve crescimento ao passar o mouse;
        // active:scale-95 faz o botão "afundar" no clique, dando sensação
        // tátil de pressão. duration-150 controla a velocidade dos dois
        // para que a animação seja perceptível mas não atrapalhe.
        className="fixed bottom-6 right-6 bg-primary text-white rounded-full px-6 py-3 font-medium hover:opacity-90 hover:scale-105 active:scale-95 transition-all duration-150"
        style={{ boxShadow: '0 4px 20px rgba(26, 111, 255, 0.5)' }}
      >
        💬 Falar com o Copilot
      </button>
    </div>
  );
};

export default Dashboard;
