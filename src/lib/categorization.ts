import {
  CategorizationRule,
  RuleCondition,
  Transaction,
  TransactionCategory,
  PaymentMethod,
  TransactionType,
} from '@/types'

// ─────────────────────────────────────────────
// AVALIAÇÃO DE UMA CONDIÇÃO INDIVIDUAL
// ─────────────────────────────────────────────

/**
 * Avalia se uma transação satisfaz uma condição específica.
 * Toda comparação de texto é case-insensitive e ignora espaços extras.
 */
export function matchesCondition(
  tx: Transaction,
  condition: RuleCondition
): boolean {
  const { field, operator, value } = condition

  // Extrai o valor bruto do campo da transação
  const rawFieldValue: string | number = (() => {
    switch (field) {
      case 'description':
        return tx.description
      case 'amount':
        return tx.amount
      case 'paymentMethod':
        return tx.paymentMethod
      default:
        return ''
    }
  })()

  // Comparações numéricas (só se aplica ao campo amount)
  if (operator === 'greaterThan' || operator === 'lessThan') {
    const numericField = typeof rawFieldValue === 'number'
      ? rawFieldValue
      : parseFloat(String(rawFieldValue))
    const numericValue = parseFloat(value)

    if (isNaN(numericField) || isNaN(numericValue)) return false

    return operator === 'greaterThan'
      ? numericField > numericValue
      : numericField < numericValue
  }

  // Comparações de texto — normaliza ambos os lados
  const fieldStr = String(rawFieldValue).toLowerCase().trim()
  const valueStr = value.toLowerCase().trim()

  switch (operator) {
    case 'contains':
      return fieldStr.includes(valueStr)
    case 'equals':
      return fieldStr === valueStr
    case 'startsWith':
      return fieldStr.startsWith(valueStr)
    default:
      return false
  }
}

// ─────────────────────────────────────────────
// AVALIAÇÃO DE UMA REGRA COMPLETA
// ─────────────────────────────────────────────

/**
 * Avalia se uma transação satisfaz uma regra inteira,
 * respeitando a lógica AND/OR entre as condições.
 */
export function matchesRule(
  tx: Transaction,
  rule: CategorizationRule
): boolean {
  if (!rule.active) return false
  if (rule.conditions.length === 0) return false

  if (rule.conditionLogic === 'AND') {
    return rule.conditions.every((c) => matchesCondition(tx, c))
  }

  // OR — basta uma condição satisfeita
  return rule.conditions.some((c) => matchesCondition(tx, c))
}

// ─────────────────────────────────────────────
// APLICAÇÃO DE UMA REGRA A UMA TRANSAÇÃO
// ─────────────────────────────────────────────

/**
 * Aplica as ações de uma regra a uma transação.
 * Retorna uma nova transação (não muta o original).
 */
export function applyRuleActions(
  tx: Transaction,
  rule: CategorizationRule
): Transaction {
  const updated = { ...tx }

  if (rule.setCategory) {
    updated.category = rule.setCategory as TransactionCategory
  }
  if (rule.setPaymentMethod) {
    updated.paymentMethod = rule.setPaymentMethod as PaymentMethod
  }
  if (rule.setType) {
    updated.type = rule.setType as TransactionType
  }

  return updated
}

// ─────────────────────────────────────────────
// PONTO DE ENTRADA PRINCIPAL
// ─────────────────────────────────────────────

/**
 * Aplica a lista de regras a uma transação.
 *
 * Comportamento:
 * - As regras devem chegar ordenadas por `priority` (menor = maior prioridade).
 * - A primeira regra que bater é aplicada e o loop para (first-match).
 * - Retorna a transação modificada, ou a original se nenhuma regra bateu.
 * - Nunca muta o objeto original.
 */
export function applyRules(
  tx: Transaction,
  rules: CategorizationRule[]
): Transaction {
  for (const rule of rules) {
    if (matchesRule(tx, rule)) {
      return applyRuleActions(tx, rule)
    }
  }
  return tx
}

// ─────────────────────────────────────────────
// UTILITÁRIOS DE APOIO À UI
// ─────────────────────────────────────────────

/**
 * Retorna um texto descritivo legível para uma condição.
 * Usado nos cards de regra na tela de configurações.
 *
 * Ex: condition { field: 'description', operator: 'contains', value: 'iFood' }
 *   → "Descrição contém 'iFood'"
 */
export function describeCondition(condition: RuleCondition): string {
  const fieldLabels: Record<string, string> = {
    description: 'Descrição',
    amount: 'Valor',
    paymentMethod: 'Forma de pagamento',
  }

  const operatorLabels: Record<string, string> = {
    contains: 'contém',
    equals: 'é igual a',
    startsWith: 'começa com',
    greaterThan: 'maior que',
    lessThan: 'menor que',
  }

  const field = fieldLabels[condition.field] ?? condition.field
  const operator = operatorLabels[condition.operator] ?? condition.operator

  // Formata o valor: se for amount com operador numérico, exibe em reais
  const isMonetary =
    condition.field === 'amount' &&
    (condition.operator === 'greaterThan' || condition.operator === 'lessThan')

  const value = isMonetary
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
        parseFloat(condition.value)
      )
    : `'${condition.value}'`

  return `${field} ${operator} ${value}`
}

/**
 * Retorna um sumário legível das ações de uma regra.
 * Usado nos cards de regra na tela de configurações.
 *
 * Ex: "Categoria → Alimentação · Pagamento → PIX"
 */
export function describeActions(rule: CategorizationRule): string {
  const parts: string[] = []

  if (rule.setCategory) {
    parts.push(`Categoria → ${rule.setCategory}`)
  }
  if (rule.setPaymentMethod) {
    const labels: Record<PaymentMethod, string> = {
      debit: 'Débito',
      pix: 'PIX',
      cash: 'Dinheiro',
      credit_card: 'Cartão de crédito',
    }
    parts.push(`Pagamento → ${labels[rule.setPaymentMethod] ?? rule.setPaymentMethod}`)
  }
  if (rule.setType) {
    parts.push(`Tipo → ${rule.setType === 'income' ? 'Receita' : 'Despesa'}`)
  }

  return parts.join(' · ') || 'Nenhuma ação definida'
}