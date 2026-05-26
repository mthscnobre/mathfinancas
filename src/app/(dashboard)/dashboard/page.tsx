'use client'

import { useAuth } from '@/hooks/useAuth'
import { useFinanceData } from '@/hooks/useFinanceData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertCircle,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const COLORS = ['#00d4aa', '#ff6b6b', '#74b9ff', '#ffd166', '#a29bfe', '#fd79a8']

const fmt = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export default function DashboardPage() {
  const { user } = useAuth()
  const { transactions, summary, loading } = useFinanceData(user)

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

  // Dados para gráfico de barras mensal
  const monthlyData = (() => {
    const map: Record<string, { income: number; expenses: number }> = {}
    transactions.forEach((t) => {
      const key = t.date.substring(0, 7)
      if (!map[key]) map[key] = { income: 0, expenses: 0 }
      if (t.type === 'income') map[key].income += t.amount
      else map[key].expenses += t.amount
    })
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, val]) => ({
        month: format(parseISO(`${key}-01`), 'MMM/yy', { locale: ptBR }),
        Receita: val.income,
        Despesa: val.expenses,
      }))
  })()

  // Dados para gráfico de pizza por categoria
  const categoryData = summary.topCategories.map((c) => ({
    name: c.category,
    value: c.amount,
  }))

  // Saldo do mês atual
  const currentMonth = format(new Date(), 'yyyy-MM')
  const currentMonthTx = transactions.filter((t) =>
    t.date.startsWith(currentMonth)
  )
  const currentIncome = currentMonthTx
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0)
  const currentExpenses = currentMonthTx
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
        </p>
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
            <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {fmt(summary.balance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Histórico completo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receitas do Mês
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {fmt(currentIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Média: {fmt(summary.monthlyAvgIncome)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas do Mês
            </CardTitle>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {fmt(currentExpenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Média: {fmt(summary.monthlyAvgExpenses)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerta se despesas > receitas no mês */}
      {currentExpenses > currentIncome && currentIncome > 0 && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardContent className="flex items-center gap-3 pt-4">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm">
              <span className="font-medium text-red-500">Atenção: </span>
              Suas despesas estão {fmt(currentExpenses - currentIncome)} acima das receitas este mês.
              Converse com o Julius para um plano de ação.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Receitas vs Despesas (últimos 6 meses)
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
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
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
            <CardTitle className="text-sm font-medium">
              Gastos por Categoria
            </CardTitle>
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
                      <span className="font-medium">{fmt(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Últimas transações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Últimas Transações</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              Nenhuma transação registrada ainda
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${t.type === 'income' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="text-sm font-medium">{t.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.category} • {format(parseISO(t.date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={t.type === 'income' ? 'default' : 'destructive'} className="text-xs">
                      {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}