'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useFinanceData } from '@/hooks/useFinanceData'
import { TransactionDialog } from '@/components/shared/TransactionDialog'
import { AmountDisplay } from '@/components/shared/AmountDisplay'
import { CategoryBadge } from '@/components/shared/CategoryBadge'
import { PaymentMethodBadge } from '@/components/shared/PaymentMethodBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
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
  Wallet,
  AlertCircle,
  Plus,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { format, parseISO, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

const COLORS = ['#00d4aa', '#ff6b6b', '#74b9ff', '#ffd166', '#a29bfe', '#fd79a8']

const fmt = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

type PeriodOption = 'this_month' | 'last_month' | '3_months' | '6_months' | '12_months' | 'all'

const PERIOD_OPTIONS: { value: PeriodOption; label: string }[] = [
  { value: 'this_month', label: 'Este mês' },
  { value: 'last_month', label: 'Mês passado' },
  { value: '3_months', label: 'Últimos 3 meses' },
  { value: '6_months', label: 'Últimos 6 meses' },
  { value: '12_months', label: 'Últimos 12 meses' },
  { value: 'all', label: 'Todo o período' },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const { transactions, creditCards, summary, loading } = useFinanceData(user)
  const [quickOpen, setQuickOpen] = useState(false)
  const [period, setPeriod] = useState<PeriodOption>('this_month')

  const filteredTransactions = useMemo(() => {
    if (period === 'all') return transactions

    const now = new Date()
    let start: Date
    let end: Date = endOfMonth(now)

    switch (period) {
      case 'this_month':
        start = startOfMonth(now)
        end = endOfMonth(now)
        break
      case 'last_month':
        start = startOfMonth(subMonths(now, 1))
        end = endOfMonth(subMonths(now, 1))
        break
      case '3_months':
        start = startOfMonth(subMonths(now, 2))
        break
      case '6_months':
        start = startOfMonth(subMonths(now, 5))
        break
      case '12_months':
        start = startOfMonth(subMonths(now, 11))
        break
      default:
        return transactions
    }

    return transactions.filter((t) => {
      const date = parseISO(t.date)
      return isWithinInterval(date, { start, end })
    })
  }, [transactions, period])

  const periodIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0)

  const periodExpenses = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0)

  const monthlyData = useMemo(() => {
    const map: Record<string, { income: number; expenses: number }> = {}
    filteredTransactions.forEach((t) => {
      const key = t.date.substring(0, 7)
      if (!map[key]) map[key] = { income: 0, expenses: 0 }
      if (t.type === 'income') map[key].income += t.amount
      else map[key].expenses += t.amount
    })
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => ({
        month: format(parseISO(`${key}-01`), 'MMM/yy', { locale: ptBR }),
        Receita: val.income,
        Despesa: val.expenses,
      }))
  }, [filteredTransactions])

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {}
    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount
      })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [filteredTransactions])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
<div className="flex items-center gap-2">
  <Button onClick={() => setQuickOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Registrar despesa
          </Button>
        </div>
      </div>

      <TransactionDialog
        open={quickOpen}
        onOpenChange={setQuickOpen}
        userId={user?.uid || ''}
        creditCards={creditCards}
        defaultType="expense"
      />

      {/* Filtro de período */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Período:</span>
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodOption)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Total
            </CardTitle>
            <Wallet className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <AmountDisplay
              value={summary.balance}
              type={summary.balance >= 0 ? 'income' : 'expense'}
              className="text-2xl font-bold"
            />
            <p className="text-xs text-muted-foreground mt-1">Histórico completo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receitas do Período
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <AmountDisplay value={periodIncome} type="income" className="text-2xl font-bold" />
            <p className="text-xs text-muted-foreground mt-1">
              Média mensal: <AmountDisplay value={summary.monthlyAvgIncome} />
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas do Período
            </CardTitle>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <AmountDisplay value={periodExpenses} type="expense" className="text-2xl font-bold" />
            <p className="text-xs text-muted-foreground mt-1">
              Média mensal: <AmountDisplay value={summary.monthlyAvgExpenses} />
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerta */}
      {periodExpenses > periodIncome && periodIncome > 0 && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardContent className="flex items-center gap-3 pt-4">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm">
              <span className="font-medium text-red-500">Atenção: </span>
              Suas despesas estão{' '}
              <AmountDisplay value={periodExpenses - periodIncome} type="expense" />{' '}
              acima das receitas no período selecionado.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Receitas vs Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                Nenhum dado disponível
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => fmt(Number(value))} />
                  <Bar dataKey="Receita" fill="#00d4aa" radius={4} />
                  <Bar dataKey="Despesa" fill="#ff6b6b" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Gastos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                Nenhum dado disponível
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => fmt(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {categoryData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <AmountDisplay value={item.value} className="font-medium" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orçamentos do mês */}
      {summary.budgetStatus.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Orçamentos do Mês</CardTitle>
            <Link href="/orcamentos" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Ver todos
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.budgetStatus.slice(0, 4).map((bs) => (
              <div key={bs.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{bs.category}</span>
                  <span className={
                    bs.status === 'exceeded' ? 'text-red-500' :
                    bs.status === 'warning' ? 'text-amber-500' :
                    'text-muted-foreground'
                  }>
                    <AmountDisplay value={bs.spent} /> / <AmountDisplay value={bs.limit} />
                  </span>
                </div>
                <Progress value={Math.min(bs.percent, 100)} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Últimas transações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Últimas Transações</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              Nenhuma transação no período selecionado
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${t.type === 'income' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="text-sm font-medium">{t.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <CategoryBadge category={t.category} />
                        <PaymentMethodBadge method={t.paymentMethod || 'debit'} />
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(t.date), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <AmountDisplay
                    value={t.amount}
                    type={t.type}
                    showSign
                    className="font-semibold"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}