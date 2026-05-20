// src/components/Card/CardVisual.tsx
// Componente puro de apresentação: desenha o cartão Azulzinho e a barra de
// limite logo abaixo. Não tem estado interno e não busca dados — recebe tudo
// via props para ficar fácil de reutilizar no Dashboard, no BlockDetail, ou
// até num futuro modal de "ver detalhes do cartão".

import type { Colaborador, Politica } from '../../types';

interface Props {
  colaborador: Colaborador;
  politica: Politica;
}

const CardVisual = ({ colaborador, politica: _politica }: Props) => {
  // _politica é aceita por contrato (a página passa o objeto inteiro) mas
  // ainda não é usada no visual. Mantemos o underscore para sinalizar
  // intencionalmente "não-utilizada" e silenciar noUnusedLocals do TS.

  // -------- Cálculos do limite utilizado --------
  // gasto = parte do limite que JÁ saiu (limite total - saldo disponível).
  const gasto = colaborador.limite - colaborador.saldo;

  // pctGasto vai de 0 (nada gasto) a 100 (limite estourado). É o que
  // determina tanto a LARGURA quanto a COR da barra.
  const pctGasto = (gasto / colaborador.limite) * 100;

  // Regra de cor inspirada em semáforo:
  // < 70% = ok (verde), 70–89% = atenção (amarelo), 90%+ = perigo (vermelho).
  // A ordem dos ternários é do mais grave para o menos — o primeiro que
  // bate ganha.
  const corBarra =
    pctGasto >= 90 ? '#F85149'
    : pctGasto >= 70 ? '#D29922'
    : '#3FB950';

  // Formatador de moeda BR reutilizado nas duas interpolações do template.
  const formatBRL = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="w-full">
      {/* ====== CARTÃO ====== */}
      {/* O <div> abaixo é o "plástico" do cartão. Tailwind cobre o layout
          (flex coluna, padding, cor de texto, raio). As regras dinâmicas
          ou de valor arbitrário (gradiente diagonal, sombra colorida,
          aspect-ratio) ficam inline porque não fazem sentido como utilitário
          repetível e poluiriam o tailwind.config se virassem token. */}
      <div
        className="w-full p-7 flex flex-col text-white rounded-2xl"
        style={{
          aspectRatio: '1.586',                                           // proporção ISO/IEC 7810 ID-1 (cartão físico real)
          background: 'linear-gradient(135deg, #0D2E6E 0%, #1A6FFF 100%)',// gradiente diagonal sup-esq → inf-dir
          boxShadow: '0 8px 32px rgba(26, 111, 255, 0.4)',                // sombra azul dramática para "flutuar"
        }}
      >
        {/* Linha superior — marca à esquerda, parceiro à direita */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg tracking-widest">Azulzinho</span>
          <span className="text-xs font-semibold tracking-wider opacity-70">ONFLY</span>
        </div>

        {/* Espaço elástico — empurra o número e o rodapé para baixo,
            mantendo a marca colada ao topo independente da altura. */}
        <div className="flex-grow" />

        {/* Número do cartão — fonte mono, espaçamento amplo, branco com
            leve transparência para imitar a estética de relevo dos cartões reais. */}
        <div className="font-mono text-xl sm:text-2xl tracking-[0.2em] text-white/90">
          {colaborador.cartao}
        </div>

        {/* Rodapé — nome em caixa alta à esquerda, bandeira à direita.
            min-w-0 + truncate evitam que um nome muito longo empurre o
            VISA para fora do cartão; shrink-0 garante que a bandeira
            nunca encolhe (sempre legível). gap-3 mantém respiro mínimo. */}
        <div className="flex items-end justify-between mt-4 gap-3">
          <span className="text-xs uppercase tracking-wider truncate min-w-0">
            {colaborador.nome}
          </span>
          <span className="italic font-bold text-2xl shrink-0">VISA</span>
        </div>
      </div>

      {/* ====== BARRA DE LIMITE ====== */}
      {/* Bloco posicionado FORA do card, separado por mt-4 (16px). */}
      <div className="mt-4">
        {/* Rótulos: à esquerda o que a barra representa, à direita o valor numérico */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">Saldo disponível</span>
          <span className="text-text-main font-medium">
            {formatBRL(colaborador.saldo)} de {formatBRL(colaborador.limite)}
          </span>
        </div>

        {/* Trilho da barra: fundo escuro neutro, altura fixa, cantos pill.
            overflow-hidden garante que o preenchimento interno respeite
            o arredondamento do trilho. */}
        <div className="mt-2 h-1.5 bg-border rounded-full overflow-hidden">
          {/* Preenchimento da barra — largura e cor são dinâmicas, então
              vão inline (Tailwind JIT não gera classes a partir de variáveis
              runtime). transition-all dá um leve easing quando saldo muda. */}
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pctGasto}%`,
              backgroundColor: corBarra,
            }}
          />
        </div>

        {/* Legenda — percentual arredondado para inteiro, sem casas decimais
            (a precisão de centavos não interessa nessa leitura rápida). */}
        <p className="mt-1 text-xs text-text-muted">
          {Math.round(pctGasto)}% do limite utilizado
        </p>
      </div>
    </div>
  );
};

export default CardVisual;
