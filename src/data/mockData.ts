// src/data/mockData.ts
// Dados fictícios que simulam o que viria do back-end da Onfly em produção.
// Nesta fase de protótipo eles alimentam tanto o Dashboard (UI) quanto o
// contexto enviado à IA. Ao trocar por uma API real no futuro, basta
// substituir essas constantes por chamadas (fetch/axios) que retornem o
// mesmo formato — os tipos garantem que o resto do app continue funcionando.

import type { Colaborador, Politica, Transacao, ContextoCartao } from '../types';

/**
 * Dono do cartão Azulzinho usado na demo.
 * No produto real viria da sessão autenticada do colaborador.
 */
export const colaborador: Colaborador = {
  nome: 'Júlio Oliveira',                 // Nome exibido no card e referenciado pela IA
  empresa: 'Tech Corp Ltda',              // Empresa contratante (entra no contexto da IA)
  saldo: 850.00,                          // Quanto AINDA pode ser gasto neste ciclo (diferente de limite)
  limite: 1500.00,                        // Teto total aprovado pela empresa para o ciclo
  cartao: '**** **** **** 4821',          // Número já mascarado — nunca trafegamos o número completo no front
};

/**
 * Política de despesas da empresa contratante.
 * É o "regulamento" que a IA consulta para validar compras e explicar bloqueios.
 * Em produção cada empresa teria sua própria política configurada na Onfly.
 */
export const politica: Politica = {
  horarioPermitido: '06:00 às 22:00',                                                  // Janela em que o cartão aceita transações
  categorias: ['Alimentação', 'Hospedagem', 'Transporte', 'Combustível'],              // Categorias cobertas — fora delas, bloqueio automático
  limiteDiario: 500.00,                                                                // Teto agregado por dia (somatório das transações)
  limiteRefeicao: 80.00,                                                               // Teto por transação em Alimentação
  limiteHospedagem: 350.00,                                                            // Teto por diária de hotel
  exigeFoto: true,                                                                     // Se true, colaborador precisa anexar comprovante após a compra
  observacoes: 'Refeições com clientes precisam de justificativa prévia.',             // Regras adicionais em texto livre
};

/**
 * Histórico recente de transações do cartão.
 * O mix proposital de aprovadas e bloqueadas é o que dá material para a demo:
 *  - As bloqueadas viram a tela BlockDetail (motivo humanizado)
 *  - O conjunto inteiro vira contexto para a IA responder perguntas sobre gastos
 */
export const transacoes: Transacao[] = [
  {
    id: 1,
    descricao: 'Restaurante Central',
    valor: 67.50,
    categoria: 'Alimentação',
    status: 'aprovada',
    data: '2026-05-19 12:30',
  },
  {
    id: 2,
    descricao: 'Uber',
    valor: 34.00,
    categoria: 'Transporte',
    status: 'aprovada',
    data: '2026-05-19 09:10',
  },
  {
    id: 3,
    descricao: 'Bar Noturno',
    valor: 95.00,
    categoria: 'Alimentação',
    status: 'bloqueada',
    data: '2026-05-18 23:15',
    // Bloqueio por horário — 23:15 está fora da janela 06:00 às 22:00 da política
    motivo: 'Compra realizada fora do horário permitido pela empresa (06:00 às 22:00).',
  },
  {
    id: 4,
    descricao: 'Hotel Executive',
    valor: 420.00,
    categoria: 'Hospedagem',
    status: 'bloqueada',
    data: '2026-05-17 14:00',
    // Bloqueio por valor — 420 > 350 (limiteHospedagem). Mostramos a diferença para humanizar.
    motivo: 'Valor acima do limite de hospedagem permitido (R$350,00). Diferença: R$70,00.',
  },
  {
    id: 5,
    descricao: 'Posto Shell',
    valor: 180.00,
    categoria: 'Combustível',
    status: 'aprovada',
    data: '2026-05-17 08:45',
  },
];

/**
 * Pacote completo enviado para a IA em cada conversa.
 * Agrupar aqui evita que cada componente que fala com o service precise
 * remontar o objeto na mão — e centraliza o ponto de troca quando os dados
 * passarem a vir de uma API real.
 */
export const contexto: ContextoCartao = {
  colaborador,
  politica,
  transacoes,
};
