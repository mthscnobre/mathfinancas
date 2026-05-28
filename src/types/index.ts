export type TransactionType = 'income' | 'expense'

export type PaymentMethod = 'debit' | 'pix' | 'cash' | 'credit_card'

export type TransactionCategory =
  | 'Alimentação'
  | 'Transporte'
  | 'Moradia'
  | 'Saúde'
  | 'Educação'
  | 'Lazer'
  | 'Assinatura'
  | 'Vestuário'
  | 'Investimento'
  | 'Outros'

export type InvestmentType =
  | 'CDB'
  | 'LCI'
  | 'LCA'
  | 'Tesouro Direto'
  | 'Poupança'
  | 'Fundos'
  | 'Ações'
  | 'FII'
  | 'Criptomoedas'
  | 'Outros'

export interface Transaction {
  id: string
  description: string
  amount: number
  type: TransactionType
  category: TransactionCategory
  date: string // YYYY-MM-DD
  paymentMethod: PaymentMethod
  creditCardId?: string
  billingMonth?: string // YYYY-MM — mês da fatura se crédito
  local?: string
  notes?: string
  installmentTotal?: number
  installmentCurrent?: number
  recurrenceId?: string
  createdAt: string
}

export interface CreditCard {
  id: string
  name: string // "Nubank", "Inter", "C6"
  limit: number
  closingDay: number // dia de fechamento da fatura
  dueDay: number // dia de vencimento
  color: string // hex color
  createdAt: string
}

export interface Goal {
  id: string
  title: string
  targetAmount: number
  currentAmount: number
  deadline: string // YYYY-MM-DD
  icon?: string
  createdAt: string
}

export interface Piggybank {
  id: string
  name: string // "Viagem", "Emergência", "Reserva"
  targetAmount?: number // opcional — pode ser sem meta
  currentAmount: number
  icon?: string
  color?: string
  createdAt: string
}

export interface Investment {
  id: string
  name: string // "CDB Nubank 100%CDI"
  type: InvestmentType
  investedAmount: number // valor aportado
  currentAmount: number // valor atual com rendimento
  startDate: string // YYYY-MM-DD
  dueDate?: string // YYYY-MM-DD — vencimento se tiver
  liquidity: 'daily' | 'on_due_date' | 'custom'
  institution: string // "Nubank", "XP", "Tesouro"
  rate?: string // "100% CDI", "IPCA+5%"
  createdAt: string
}

export interface Recurrence {
  id: string
  description: string
  amount: number
  type: TransactionType
  category: TransactionCategory
  paymentMethod: PaymentMethod
  creditCardId?: string
  dayOfMonth: number
  active: boolean
  createdAt: string
}

export interface UserSettings {
  customCategories?: string[]
  customCategoryColors?: Record<string, string>
  currency?: string
  timezone?: string
  hideValues?: boolean
}

export interface MonthlyData {
  month: number
  year: number
  income: number
  expenses: number
  balance: number
}

export interface JuliusMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface CategoryBudget {
  id: string
  category: TransactionCategory
  limit: number
  month: string // YYYY-MM
  createdAt: string
}

export interface FinancialSummary {
  // Saldos
  totalIncome: number
  totalExpenses: number
  balance: number
  committedBalance: number

  // Orçamentos
  budgets: CategoryBudget[]
  budgetStatus: {
    category: string
    limit: number
    spent: number
    percent: number
    status: 'ok' | 'warning' | 'exceeded'
  }[]

  // Cartões
  creditCards: CreditCard[]
  currentMonthInvoice: Record<string, number>
  nextMonthInvoice: Record<string, number>
  totalNextInvoice: number

  // Caixinhas e investimentos
  piggybanks: Piggybank[]
  investments: Investment[]
  totalPiggybanks: number
  totalInvested: number
  totalCurrentInvestments: number
  netWorth: number

  // Análise
  topCategories: { category: string; amount: number }[]
  monthlyAvgIncome: number
  monthlyAvgExpenses: number

  // Dados brutos
  transactions: Transaction[]
  goals: Goal[]
}

// ===== MOTOR DE REGRAS DE CATEGORIZAÇÃO =====

// Campo da transação que a condição vai avaliar
export type RuleConditionField = 'description' | 'amount' | 'paymentMethod'

// Operador de comparação da condição
export type RuleConditionOperator =
  | 'contains'     // descrição contém "iFood"
  | 'equals'       // campo igual a valor exato
  | 'startsWith'   // descrição começa com "PIX"
  | 'greaterThan'  // valor > 2000
  | 'lessThan'     // valor < 50

export interface RuleCondition {
  field: RuleConditionField
  operator: RuleConditionOperator
  value: string // sempre string — para amount, converte na hora de comparar
}

export interface CategorizationRule {
  id: string
  name: string                        // nome amigável: "iFood → Alimentação"
  conditions: RuleCondition[]
  conditionLogic: 'AND' | 'OR'        // todas as condições ou qualquer uma
  // Ações aplicadas quando a regra bate:
  setCategory?: string                // usa string para aceitar categorias customizadas também
  setPaymentMethod?: PaymentMethod
  setType?: TransactionType
  priority: number                    // ordem de aplicação — menor número = maior prioridade
  active: boolean
  createdAt: string
}