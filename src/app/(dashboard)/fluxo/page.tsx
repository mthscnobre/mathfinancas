'use client'

import { useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useFinanceData } from '@/hooks/useFinanceData'
import { buildCashflow } from '@/lib/cashflow'
import { AmountDisplay } from '@/components/shared/AmountDisplay'
import { CategoryBadge } from '@/components/shared/CategoryBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  RefreshCw,
  Layers,
  AlertTriangle,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const SOURCE_ICONS = {
  recurrence: <RefreshCw className="w-3 h-3" />,
  installment: <Layers className="w-3 h-3" />,
  invoice: <CreditCard className="w-3 h-3" />,
}

const SOURCE_LABELS = {
  recurrence: 'Recorrência',
  installment: 'Parcela',
  invoice: 'Fatura',
}

const fmt = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export default function FluxoPage() {
  const { user } = useAuth()
  const { transactions, recurrences, creditCards, summary, loading } = useFinanceData(user)
  const [days, setDays] = useState<'30' | '60' | '90'>('60')

  const cashflow = useMemo(() => {
    if (loading) return []
    return buildCashflow(
      transactions,
      recurrences,
      creditCards,
      summary.balance,
      parseInt(days)
    )
  }, [transactions, recurrences, creditCards, summary.balance, days, loading])

  const totalFutureIncome = cashflow.reduce((acc, d) => acc + d.totalIncome, 0)
  const totalFutureExpense = cashflow.reduce((acc, d) => acc + d.totalExpense, 0)
  const lowestBalance = cashflow.reduce(
    (min, d) => Math.min(min, d.runningBalance),
    summary.balance
  )
  const lowestBalanceDay = cashflow.find((d) => d.runningBalance === lowestBalance)

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fluxo de Caixa</h1>
          <p className="text-muted-foreground text-sm">
            Projeção baseada em recorrências, parcelas e faturas
          </p>
        </div>
        <Select value={days} onValueChange={(v) => setDays(v as typeof days)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">30 dias</SelectItem>
            <SelectItem value="60">60 dias</SelectItem>
            <SelectItem value="90">90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Entradas previstas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AmountDisplay value={totalFutureIncome} type="income" className="text-2xl font-bold" />
            <p className="text-xs text-muted-foreground mt-1">nos próximos {days} dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              Saídas previstas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AmountDisplay value={totalFutureExpense} type="expense" className="text-2xl font-bold" />
            <p className="text-xs text-muted-foreground mt-1">nos próximos {days} dias</p>
          </CardContent>
        </Card>

        <Card className={lowestBalance < 0 ? 'border-red-500/50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {lowestBalance < 0
                ? <AlertTriangle className="w-4 h-4 text-red-500" />
                : <TrendingDown className="w-4 h-4 text-muted-foreground" />
              }
              Menor saldo previsto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AmountDisplay
              value={lowestBalance}
              type={lowestBalance < 0 ? 'expense' : 'neutral'}
              className="text-2xl font-bold"
            />
            {lowestBalanceDay && (
              <p className="text-xs text-muted-foreground mt-1">
                em {format(new Date(lowestBalanceDay.date), "dd 'de' MMMM", { locale: ptBR })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerta saldo negativo */}
      {lowestBalance < 0 && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardContent className="flex items-center gap-3 pt-4">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm">
              <span className="font-medium text-red-500">Atenção: </span>
              Seu saldo ficará negativo em{' '}
              {lowestBalanceDay && format(new Date(lowestBalanceDay.date), "dd/MM/yyyy")}
              {'. '}
              Converse com o Julius para um plano de ação.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {cashflow.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <RefreshCw className="w-10 h-10 text-muted-foreground" />
            <p className="font-medium">Nenhum evento previsto</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Cadastre recorrências, parcelas ou cartões de crédito para ver o fluxo de caixa futuro
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {cashflow.map((day) => (
            <Card key={day.date} className={day.runningBalance < 0 ? 'border-red-500/30' : ''}>
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium capitalize">{day.label}</span>
                    {day.balance !== 0 && (
                      <span className={`text-xs font-medium ${
                        day.balance > 0 ? 'text-emerald-500' : 'text-red-500'
                      }`}>
                        {day.balance > 0 ? '+' : ''}{fmt(day.balance)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Saldo:</span>
                    <AmountDisplay
                      value={day.runningBalance}
                      type={day.runningBalance >= 0 ? 'income' : 'expense'}
                      className="text-sm font-semibold"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {day.entries.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 border-t first:border-t-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-6 rounded-full ${
                        entry.type === 'income' ? 'bg-emerald-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">{entry.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant="outline"
                            className="text-xs py-0 flex items-center gap-1"
                          >
                            {SOURCE_ICONS[entry.source]}
                            {SOURCE_LABELS[entry.source]}
                          </Badge>
                          {entry.category && (
                            <CategoryBadge category={entry.category} />
                          )}
                        </div>
                      </div>
                    </div>
                    <AmountDisplay
                      value={entry.amount}
                      type={entry.type}
                      showSign
                      className="font-semibold"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}