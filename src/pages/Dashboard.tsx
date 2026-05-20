// src/pages/Dashboard.tsx
// Tela inicial do Azulzinho Copilot — agora em layout de duas colunas
// para desktop (cartao + metricas a esquerda, lista de transacoes a
// direita) e coluna unica empilhada para mobile.
//
// A pagina e "burra": le tudo de mockData e renderiza. Toda interacao
// real (chat, detalhes de bloqueio) e delegada a outras telas via routing.

import { useNavigate } from 'react-router-dom';
import CardVisual from '../components/Card';
import { colaborador, politica, transacoes } from '../data/mockData';
import type { Transacao } from '../types';

// Mapa categoria -> emoji. Funcao pura: mesmo input, mesmo output.
// O default cobre categorias futuras que ainda nao previmos.
function getEmojiCategoria(categoria: string): string {
  switch (categoria) {
    case 'Alimentação': return '🍽️';
    case 'Hospedagem':  return '🏨';
    case 'Transporte':  return '🚗';
    case 'Combustível': return '⛽';
    default:            return '💳';
  }
}

// Converte 'YYYY-MM-DD HH:mm' (formato do mock) em 'DD mes' compacto
// (ex.: '2026-05-19 12:30' -> '19 mai'). E uma versao mais curta da
// formatarDataHora anterior, ajustada ao novo layout em lista densa.
function formatarData(dataString: string): string {
  // Pega so a parte da data (ignora a hora) e quebra em ano-mes-dia.
  const [iso] = dataString.split(' ');
  const [, mesNum, dia] = iso.split('-');

  // Abreviacoes em pt-BR. Usar array indexado e mais rapido e mais
  // previsivel do que depender de Intl/DateTimeFormat (que pode variar
  // por locale do runtime).
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const indice = parseInt(mesNum, 10) - 1;
  const mesAbrev = meses[indice] ?? mesNum;

  // parseInt + String tira o zero a esquerda do dia ('05' -> '5').
  const diaSemZero = String(parseInt(dia, 10));
  return `${diaSemZero} ${mesAbrev}`;
}

// Formatter de moeda BR criado uma vez no modulo e reutilizado.
const formatBRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const Dashboard = () => {
  const navigate = useNavigate();

  // -------- Calculos do limite utilizado --------
  // gasto = parte do limite ja consumida; pctGasto vai de 0 a 100.
  // A cor da barra segue logica de semaforo: <70 verde, 70-89 amarelo,
  // >=90 vermelho. Mesma regra usada dentro do CardVisual.
  const gasto = colaborador.limite - colaborador.saldo;
  const pctGasto = (gasto / colaborador.limite) * 100;
  const corBarra =
    pctGasto >= 90 ? '#F85149'
    : pctGasto >= 70 ? '#D29922'
    : '#3FB950';

  return (
    // Wrapper raiz. min-h-screen garante que a viewport inteira fique
    // ocupada mesmo se o conteudo for curto. Em desktop, o container
    // interno usa min-h-0 (no grid) para permitir scroll por coluna sem
    // estourar a tela.
    <div className="bg-dark min-h-screen flex flex-col">

      {/* ====== HEADER ====== */}
      {/* Faixa superior comum a mobile e desktop. flex-shrink-0 evita
          que o header seja comprimido pelo flex-1 do body abaixo. */}
      <header className="bg-surface border-b border-border px-5 py-3 flex items-center justify-between flex-shrink-0">
        {/* Lado esquerdo: titulo + empresa. min-w-0 + truncate evita
            estouro horizontal em telas estreitas. */}
        <div className="min-w-0">
          <h1 className="text-text-main font-bold text-lg">Azulzinho Copilot</h1>
          <p className="text-text-muted text-sm truncate">
            Assistente de cartão corporativo · {colaborador.empresa}
          </p>
        </div>

        {/* Lado direito: badge "Copilot online" com bolinha animada.
            animate-pulse e a animacao de respiracao default do Tailwind
            (opacidade 100 -> 50 -> 100). bg-primary/10 = 10% de alpha
            no azul principal — destaca sem competir com o texto. */}
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-3 py-1 text-xs text-primary flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" aria-hidden="true" />
          <span>Copilot online</span>
        </div>
      </header>

      {/* ====== CORPO ======
          Mobile: flex-col empilhado, sem altura fixa — a pagina inteira rola.
          Desktop (lg): grid de duas colunas (340px fixos + resto). min-h-0
          libera o grid filho a respeitar o limite vertical do pai, condicao
          necessaria pra overflow-y-auto funcionar em cada coluna. */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[340px_1fr] lg:min-h-0">

        {/* ====== COLUNA ESQUERDA ======
            Em desktop tem borda divisora a direita e scroll proprio quando
            o conteudo passa da altura visivel. Em mobile, ocupa a largura
            inteira e flui naturalmente. */}
        <aside className="p-5 flex flex-col gap-4 lg:border-r border-border lg:overflow-y-auto">

          {/* 1) Cartao visual — componente isolado, ocupa toda a largura. */}
          <CardVisual colaborador={colaborador} politica={politica} />

          {/* 2) Grid de duas metricas (saldo + limite).
              grid-cols-2 ja distribui 50/50, gap-2 = 8px entre os cards.
              p-3 = 12px de padding interno; rounded-xl = 12px de raio. */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-surface border border-border rounded-xl p-3">
              <p className="text-text-muted text-xs">Saldo disponível</p>
              <p className="text-success text-lg font-medium">
                {formatBRL(colaborador.saldo)}
              </p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-3">
              <p className="text-text-muted text-xs">Limite total</p>
              <p className="text-text-main text-lg font-medium">
                {formatBRL(colaborador.limite)}
              </p>
            </div>
          </div>

          {/* 3) Card com a barra de uso do limite.
              Rotulo + percentual no topo, barra horizontal abaixo. A cor
              da barra muda com pctGasto (logica espelhada do CardVisual)
              pra dar feedback visual rapido sobre quao perto da margem o
              colaborador esta. */}
          <div className="bg-surface border border-border rounded-xl p-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted">Limite utilizado</span>
              <span className="text-text-main font-medium">
                {Math.round(pctGasto)}%
              </span>
            </div>
            {/* Trilho da barra: fundo neutro, altura fina, pill nas pontas.
                overflow-hidden garante que o preenchimento respeite o raio. */}
            <div className="mt-2 h-1.5 bg-border rounded-full overflow-hidden">
              {/* Preenchimento: largura e cor sao dinamicas — Tailwind JIT
                  nao gera classes a partir de variaveis runtime, entao vao
                  inline. transition-all suaviza alteracoes de valor. */}
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pctGasto}%`,
                  backgroundColor: corBarra,
                }}
              />
            </div>
          </div>

          {/* 4) Botao "Falar com o Copilot" — agora integrado a coluna,
              ocupando 100% da largura (sem fixed/floating). active:scale-95
              da feedback tatil ao clicar; hover:opacity-90 mostra que e
              interativo no desktop. */}
          <button
            type="button"
            onClick={() => navigate('/assistente')}
            className="bg-primary text-white rounded-xl py-3 font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all duration-150"
          >
            <span aria-hidden="true">💬</span>
            <span>Falar com o Copilot</span>
          </button>
        </aside>

        {/* ====== COLUNA DIREITA ======
            Em desktop: rolagem propria via overflow-hidden no container +
            overflow-y-auto na lista interna. Em mobile: fluxo normal,
            empilhado depois da coluna esquerda. */}
        <section className="flex flex-col lg:min-h-0 lg:overflow-hidden">

          {/* Sub-header da lista. flex-shrink-0 mantem este cabecalho
              ancorado no topo enquanto a lista abaixo rola. */}
          <div className="border-b border-border px-5 py-3 flex justify-between items-center flex-shrink-0">
            <h2 className="font-medium text-sm text-text-main">Últimas transações</h2>
            <span className="text-xs text-text-muted">
              {transacoes.length} registros
            </span>
          </div>

          {/* Estado vazio defensivo: a API real pode devolver array vazio
              (colaborador novo, sem extrato). Melhor uma mensagem neutra
              do que uma area branca sem contexto. */}
          {transacoes.length === 0 && (
            <div className="text-center text-text-muted py-8 text-sm">
              Nenhuma transação ainda.
            </div>
          )}

          {/* Lista propriamente dita.
              flex-1 + overflow-y-auto: ocupa o restante da coluna e cria
              scroll interno quando o conteudo passa da altura disponivel
              (so importa em desktop; em mobile a pagina inteira ja rola). */}
          <ul className="flex-1 lg:overflow-y-auto">
            {transacoes.map((transacao: Transacao) => {
              // Avaliamos uma vez aqui pra nao repetir comparacao no JSX.
              const aprovada = transacao.status === 'aprovada';
              const bloqueada = transacao.status === 'bloqueada';

              return (
                <li
                  key={transacao.id}
                  // onClick so existe para itens bloqueados — passar
                  // undefined faz o React nem anexar listener.
                  onClick={
                    bloqueada
                      ? () => navigate(`/bloqueio/${transacao.id}`)
                      : undefined
                  }
                  className={[
                    'flex items-center gap-3 px-5 py-3 border-b border-border',
                    bloqueada
                      ? 'cursor-pointer hover:border-danger/30 transition-all duration-150'
                      : '',
                  ].join(' ')}
                >
                  {/* Icone de categoria — quadrado 36x36 (w-9 h-9) com
                      fundo dependente do status: cinza neutro nas aprovadas,
                      vermelho com alpha nas bloqueadas. Usar /10 mantem o
                      tom suave sem competir com o badge a direita. */}
                  <div
                    className={[
                      'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                      bloqueada ? 'bg-danger/10' : 'bg-surface',
                    ].join(' ')}
                  >
                    <span className="text-base" aria-hidden="true">
                      {getEmojiCategoria(transacao.categoria)}
                    </span>
                  </div>

                  {/* Lado esquerdo: descricao + linha "data · categoria".
                      min-w-0 e o truque que permite o filho com truncate
                      encolher dentro do flex (sem ele, conteudos longos
                      empurram o lado direito pra fora da tela). */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-main truncate">
                      {transacao.descricao}
                    </p>
                    <p className="text-xs text-text-muted">
                      {formatarData(transacao.data)} · {transacao.categoria}
                    </p>
                  </div>

                  {/* Lado direito: valor + badge de status.
                      flex-shrink-0 garante que ele nunca encolhe mesmo se
                      a descricao for muito longa. text-right alinha as
                      duas linhas a direita. */}
                  <div className="text-right flex-shrink-0">
                    <p
                      className={`text-sm font-medium ${
                        aprovada ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {formatBRL(transacao.valor)}
                    </p>
                    {/* text-[10px] = tamanho arbitrario do Tailwind JIT.
                        bg-{cor}/10 cria fundo com 10% de alpha mantendo
                        o tom da paleta. */}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
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
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
