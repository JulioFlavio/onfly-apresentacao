// src/pages/BlockDetail.tsx
// Tela que substitui a notificação fria "Transação negada" por uma
// explicação humana do bloqueio. É o ponto de virada da demo: mostra
// como a Onfly pode transformar um momento de frustração em informação útil.
//
// A página é stateless — ela apenas lê o :id da URL, busca a transação
// correspondente nos mocks e renderiza um layout fixo de quatro blocos.

import { useParams, useNavigate } from 'react-router-dom';
import { transacoes } from '../data/mockData';

// Formatter de moeda BR criado uma única vez no módulo.
const formatBRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Sugestões de ação. Constante de módulo para evitar recriar o array em
// cada render e deixar fácil mexer no roteiro em um lugar só.
const ACOES = [
  {
    titulo: 'Solicitar exceção ao gestor',
    descricao: 'Entre em contato com o financeiro da sua empresa para liberar esta compra.',
  },
  {
    titulo: 'Usar cartão pessoal e pedir reembolso',
    descricao: 'Pague com seu cartão pessoal e registre a despesa no app da Onfly.',
  },
  {
    titulo: 'Falar com o Copilot',
    descricao: 'Tire dúvidas sobre a política da empresa ou entenda melhor o bloqueio.',
  },
];

const BlockDetail = () => {
  // useParams lê os parâmetros dinâmicos da rota atual. A rota declarada
  // como "/bloqueio/:id" expõe o segmento depois de "/bloqueio/" sob a chave
  // "id". O generic <{ id: string }> tipa o objeto retornado — note que
  // o React Router devolve `id: string | undefined` mesmo assim (a URL
  // PODE não ter o parâmetro em alguns casos), então tratamos esse caso.
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // .find() percorre o array e devolve o PRIMEIRO item que satisfaz o
  // predicado, ou undefined se nenhum casar.
  //
  // Number(id) é necessário porque a URL sempre devolve strings. Sem a
  // conversão, "3" === 3 seria false (=== exige tipos iguais). Number(undefined)
  // dá NaN, que não vai casar com nada — o find devolve undefined e
  // caímos no estado vazio abaixo. Defesa em profundidade.
  const transacao = transacoes.find((t) => t.id === Number(id));

  // ====== Early return: estado vazio ======
  // Padrão muito comum em React: tratar primeiro os casos "ruins" e sair
  // cedo. O resto do componente fica num "happy path" mais limpo e o
  // TypeScript ATÉ narrowa o tipo: após este `if`, `transacao` é
  // garantidamente definida e `status === 'bloqueada'`.
  //
  // Por que cobrir os dois casos no mesmo if:
  //  - !transacao  → id da URL inválido (digitado errado, item removido, etc.)
  //  - status !== 'bloqueada' → tentaram acessar esta tela com uma
  //    transação aprovada, o que não faz sentido (essa tela só existe
  //    para explicar bloqueios).
  if (!transacao || transacao.status !== 'bloqueada') {
    return (
      <div className="min-h-dvh bg-dark flex flex-col items-center justify-center px-6 text-center">
        <span className="text-5xl" aria-hidden="true">🔍</span>
        <h1 className="text-text-main text-lg font-bold mt-4">
          Transação não encontrada
        </h1>
        <p className="text-text-muted text-sm mt-1 max-w-xs">
          Não localizamos esta transação ou ela não está bloqueada.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-6 bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  // A partir daqui o TS sabe que `transacao` existe e está bloqueada.
  // O campo `motivo` ainda é opcional pela interface (poderíamos refinar
  // com discriminated union no futuro), então usamos optional chaining
  // + fallback ao exibir, garantindo que nunca renderizamos `undefined`
  // como texto.

  return (
    <div className="min-h-dvh bg-dark flex flex-col">

      {/* ====== HEADER ====== */}
      {/* Mesmo padrão do Assistant.tsx: faixa fina com botão voltar,
          título centralizado e flex-shrink-0 para não comprimir. */}
      <header className="flex-shrink-0 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-text-main p-2 rounded hover:bg-border/40 transition-colors"
          aria-label="Voltar ao Dashboard"
        >
          ←
        </button>
        <h1 className="flex-1 text-center text-text-main font-bold">
          Detalhe do Bloqueio
        </h1>
        {/* Spacer invisível do tamanho do botão volta para manter o título
            visualmente centralizado (o flex-1 sozinho centraliza dentro do
            espaço entre os irmãos — sem o spacer, deslocaria à direita). */}
        <span className="w-9" aria-hidden="true" />
      </header>

      {/* ====== CORPO ROLÁVEL ======
          max-w-[480px] mx-auto centraliza o conteúdo em telas largas
          (em mobile fica fluido com w-full). A leitura em coluna estreita
          é proposital — textos explicativos rendem melhor assim. */}
      <main className="flex-1 overflow-y-auto p-6 max-w-[480px] mx-auto w-full">

        {/* ====== BLOCO 1 — CABEÇALHO DO BLOQUEIO ======
            Círculo grande com ícone + título grande. O peso visual do
            vermelho aqui sinaliza imediatamente "atenção, algo importante",
            mas a tipografia segura (sem caps lock, sem ponto de exclamação)
            mantém o tom calmo — é exatamente o oposto da notificação fria
            que substituímos. */}
        <section className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-danger/10 border border-danger/30 flex items-center justify-center">
            <span className="text-2xl" aria-hidden="true">🚫</span>
          </div>
          <h2 className="text-danger text-xl font-bold mt-4">
            Transação Bloqueada
          </h2>
          <p className="text-text-muted text-sm mt-1">
            Esta compra não foi autorizada pelo Spend Control
          </p>
        </section>

        {/* ====== BLOCO 2 — DADOS DA TRANSAÇÃO ======
            Card neutro com 4 linhas em formato "label : valor". O título
            em uppercase + tracking-wider é um padrão clássico de seção
            secundária (legível, mas hierarquicamente abaixo do bloco 1). */}
        <section className="mt-6 bg-surface border border-border rounded-2xl p-5">
          <h3 className="text-text-muted text-xs uppercase tracking-wider mb-4">
            Detalhes da Compra
          </h3>
          <dl className="space-y-3">
            {/* <dl>/<dt>/<dd> é a semântica HTML para "lista de definições"
                — o leitor de tela anuncia "Estabelecimento, Restaurante
                Central; Valor, R$ 95,00..." em vez de tratar como texto solto. */}
            <div className="flex items-center justify-between gap-4">
              <dt className="text-text-muted text-sm">Estabelecimento</dt>
              <dd className="text-text-main text-sm font-medium text-right">
                {transacao.descricao}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-text-muted text-sm">Valor</dt>
              <dd className="text-text-main text-sm font-medium text-right">
                {formatBRL(transacao.valor)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-text-muted text-sm">Categoria</dt>
              <dd className="text-text-main text-sm font-medium text-right">
                {transacao.categoria}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-text-muted text-sm">Data e hora</dt>
              <dd className="text-text-main text-sm font-medium text-right">
                {transacao.data}
              </dd>
            </div>
          </dl>
        </section>

        {/* ====== BLOCO 3 — MOTIVO DO BLOQUEIO ======
            Card com tinta vermelha bem suave para chamar atenção sem
            agredir. É o coração da tela: substitui "Transação negada"
            por uma frase humana e específica que a IA da empresa
            poderia perfeitamente ter escrito. */}
        <section className="mt-4 bg-danger/5 border border-danger/20 rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <span aria-hidden="true">⚠️</span>
            <h3 className="text-danger text-sm font-semibold">
              Por que foi bloqueada?
            </h3>
          </div>
          <p className="text-text-main text-sm leading-relaxed mt-2.5">
            {/* Optional chaining + fallback: se por algum motivo o motivo
                não existir no objeto, exibimos texto neutro em vez de
                "undefined" na UI. */}
            {transacao.motivo ?? 'Motivo não informado.'}
          </p>
        </section>

        {/* ====== BLOCO 4 — O QUE FAZER AGORA ======
            Alternativas concretas. Mostrar caminho claro é o que separa
            uma boa UX de bloqueio de uma frustrante: o colaborador sai
            da tela sabendo exatamente o próximo passo. */}
        <section className="mt-4 bg-surface border border-border rounded-2xl p-5">
          <h3 className="text-text-main text-sm font-semibold mb-3.5">
            O que você pode fazer agora
          </h3>
          <ol className="flex flex-col gap-3">
            {ACOES.map((acao, idx) => (
              <li key={acao.titulo} className="flex items-start gap-3">
                {/* Círculo numerado. shrink-0 evita que o círculo encolha
                    quando o texto ao lado for longo (sem ele, ficaria
                    achatado em duas linhas). */}
                <span className="w-6 h-6 bg-primary/10 border border-primary/30 rounded-full flex items-center justify-center text-primary text-xs font-bold shrink-0">
                  {idx + 1}
                </span>
                <div>
                  <p className="text-text-main text-sm font-medium">
                    {acao.titulo}
                  </p>
                  <p className="text-text-muted text-xs mt-0.5">
                    {acao.descricao}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>

      {/* ====== CTA FIXO NO RODAPÉ ======
          Botão de largura total ancorado no rodapé pela posição de
          flex-shrink-0 no container coluna. Padrão familiar em apps
          mobile (Nubank, iFood, etc.) — ação principal sempre visível,
          mesmo que o usuário não role até o fim. */}
      <div className="flex-shrink-0 bg-surface border-t border-border p-4">
        <button
          type="button"
          onClick={() => navigate('/assistente')}
          className="w-full bg-primary text-white rounded-xl py-3.5 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          💬 Falar com o Copilot
        </button>
      </div>
    </div>
  );
};

export default BlockDetail;
