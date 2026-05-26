export type TransactionType = 'income' | 'expense'

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

export interface Transaction {
  id: string
  description: string
  amount: number
  type: TransactionType
  category: TransactionCategory
  date: string // YYYY-MM-DD
  local?: string
  notes?: string
  installmentTotal?: number
  installmentCurrent?: number
  recurrenceId?: string
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

export interface Recurrence {
  id: string
  description: string
  amount: number
  type: TransactionType
  category: TransactionCategory
  dayOfMonth: number
  active: boolean
  createdAt: string
}

export interface UserSettings {
  customCategories?: string[]
  currency?: string
  timezone?: string
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

export interface FinancialSummary {
  totalIncome: number
  totalExpenses: number
  balance: number
  topCategories: { category: string; amount: number }[]
  monthlyAvgIncome: number
  monthlyAvgExpenses: number
  transactions: Transaction[]
  goals: Goal[]
}