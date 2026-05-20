// src/types/index.ts
// Contratos de dados do azulzinho-copilot.
// Centralizar os tipos aqui evita duplicacao e garante que qualquer arquivo
// (componentes, hooks, services, mockData) fale a mesma "lingua" de objetos.

/**
 * Representa o colaborador que recebe o cartao corporativo Azulzinho.
 * Esses dados sao injetados no system prompt da IA para que ela responda
 * com base no contexto real da pessoa que esta conversando.
 */
export interface Colaborador {
  nome: string;       // Nome completo exibido no card visual e usado pela IA ao se dirigir ao usuario
  empresa: string;    // Nome fantasia da empresa contratante - tambem entra no contexto da IA
  saldo: number;      // Saldo atual disponivel no cartao, em reais (ex.: 850.00)
  limite: number;     // Limite total mensal aprovado pela empresa, em reais (ex.: 1500.00)
  cartao: string;     // Numero do cartao ja mascarado para exibicao (ex.: "**** **** **** 4821")
}

/**
 * Politica de despesas configurada pela empresa contratante.
 * E o "regulamento" que a IA consulta antes de validar uma compra
 * ou explicar por que algo foi bloqueado.
 */
export interface Politica {
  horarioPermitido: string;     // Janela em que o cartao pode ser usado (ex.: "06:00 as 22:00")
  categorias: string[];         // Categorias de gasto cobertas pela politica (ex.: ["Alimentacao", "Transporte"])
  limiteDiario: number;         // Teto agregado de gastos por dia, em reais
  limiteRefeicao: number;       // Teto por transacao na categoria Alimentacao, em reais
  limiteHospedagem: number;     // Teto por diaria de hotel, em reais
  exigeFoto: boolean;           // Se true, colaborador precisa anexar foto do comprovante apos a compra
  observacoes: string;          // Texto livre com regras adicionais (ex.: necessidade de justificativa previa)
}

/**
 * Uma transacao do cartao - aprovada ou bloqueada.
 * A lista de Transacao alimenta tanto o Dashboard quanto o contexto enviado
 * a IA, para que ela consiga responder perguntas sobre gastos passados.
 */
export interface Transacao {
  id: number;                                  // Identificador unico (usado em key={} do React e no parametro :id da rota de bloqueio)
  descricao: string;                           // Nome do estabelecimento ou descricao curta da compra
  valor: number;                               // Valor da transacao em reais
  categoria: string;                           // Categoria a que pertence (deve casar com Politica.categorias)
  status: "aprovada" | "bloqueada";            // Estado final da transacao - union literal restringe a esses dois valores
  data: string;                                // Data e hora no formato "YYYY-MM-DD HH:mm" para ordenacao e exibicao
  motivo?: string;                             // Explicacao humana do bloqueio - opcional: so existe quando status === "bloqueada"
}

/**
 * Uma mensagem individual do chat com o Copilot.
 * O formato espelha a API da Anthropic (role + content), entao a lista
 * pode ser passada quase direto para o campo "messages" da requisicao.
 */
export interface Mensagem {
  role: "user" | "assistant";   // Quem produziu a mensagem - "user" e o colaborador, "assistant" e a IA
  content: string;              // Texto puro da mensagem (sem markdown estruturado nesta versao)
}

/**
 * Pacote de contexto que o front monta e entrega para a IA em cada chamada.
 * Reunindo tudo num so objeto, o service nao precisa receber 3 parametros
 * soltos e fica facil evoluir o contexto (ex.: adicionar localizacao) sem
 * mexer na assinatura de varias funcoes.
 */
export interface ContextoCartao {
  colaborador: Colaborador;     // Dados pessoais e financeiros do dono do cartao
  politica: Politica;           // Regras da empresa contratante
  transacoes: Transacao[];      // Historico recente usado pela IA para responder sobre gastos passados
}
