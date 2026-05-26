'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useFinanceData } from '@/hooks/useFinanceData'
import { Transaction, TransactionCategory, PaymentMethod } from '@/types'
import { saveTransaction } from '@/lib/firestore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { format, parseISO, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'

const COLORS = ['#00d4aa', '#ff6b6b', '#74b9ff', '#ffd166', '#a29bfe', '#fd79a8']

const CATEGORIES: TransactionCategory[] = [
  'Alimentação', 'Transporte', 'Moradia', 'Saúde',
  'Educação', 'Lazer', 'Assinatura', 'Vestuário',
  'Investimento', 'Outros',
]

const fmt = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export default function DashboardPage() {
  const { user } = useAuth()
  const { transactions, creditCards, summary, loading } = useFinanceData(user)

  const [quickOpen, setQuickOpen] = useState(false)
  const [quickForm, setQuickForm] = useState({
    description: '',
    amount: '',
    category: 'Outros' as TransactionCategory,
    paymentMethod: 'debit' as PaymentMethod,
    creditCardId: '',
  })
  const [quickSaving, setQuickSaving] = useState(false)

  const handleQuickSave = async () => {
    if (!user || !quickForm.description || !quickForm.amount) {
      toast.error('Preencha descrição e valor')
      return
    }
    setQuickSaving(true)
    try {
      const tx: Transaction = {
        id: uuidv4(),
        description: quickForm.description,
        amount: parseFloat(quickForm.amount.replace(',', '.')),
        type: 'expense',
        category: quickForm.category,
        date: format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: quickForm.paymentMethod,
        creditCardId: quickForm.paymentMethod === 'credit_card' ? quickForm.creditCardId : undefined,
        billingMonth: quickForm.paymentMethod === 'credit_card'
          ? format(addMonths(new Date(), 1), 'yyyy-MM')
          : undefined,
        createdAt: new Date().toISOString(),
      }
      await saveTransaction(user.uid, tx)
      toast.success('Despesa registrada!')
      setQuickForm({ description: '', amount: '', category: 'Outros', paymentMethod: 'debit', creditCardId: '' })
      setQuickOpen(false)
    } catch {
      toast.error('Erro ao salvar')
    } finally {
      setQuickSaving(false)
    }
  }

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

  const categoryData = summary.topCategories.map((c) => ({
    name: c.category,
    value: c.amount,
  }))

  const currentMonth = format(new Date(), 'yyyy-MM')
  const currentMonthTx = transactions.filter((t) => t.date.startsWith(currentMonth))
  const currentIncome = currentMonthTx
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0)
  const currentExpenses = currentMonthTx
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <Button onClick={() => setQuickOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Registrar despesa
        </Button>
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
            <p className="text-xs text-muted-foreground mt-1">Histórico completo</p>
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
            <div className="text-2xl font-bold text-emerald-500">{fmt(currentIncome)}</div>
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
            <div className="text-2xl font-bold text-red-500">{fmt(currentExpenses)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Média: {fmt(summary.monthlyAvgExpenses)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerta */}
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
                  <Badge variant={t.type === 'income' ? 'default' : 'destructive'} className="text-xs">
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal despesa rápida */}
      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar despesa rápida</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                placeholder="Ex: Almoço, Uber..."
                value={quickForm.description}
                onChange={(e) => setQuickForm({ ...quickForm, description: e.target.value })}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                placeholder="0,00"
                value={quickForm.amount}
                onChange={(e) => setQuickForm({ ...quickForm, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={quickForm.category}
                onValueChange={(v) => setQuickForm({ ...quickForm, category: v as TransactionCategory })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <Select
                value={quickForm.paymentMethod}
                onValueChange={(v) => setQuickForm({ ...quickForm, paymentMethod: v as PaymentMethod, creditCardId: '' })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">Débito</SelectItem>
                  <SelectItem value="pix">Pix</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {quickForm.paymentMethod === 'credit_card' && creditCards.length > 0 && (
              <div className="space-y-2">
                <Label>Cartão</Label>
                <Select
                  value={quickForm.creditCardId}
                  onValueChange={(v) => setQuickForm({ ...quickForm, creditCardId: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {creditCards.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button className="w-full" onClick={handleQuickSave} disabled={quickSaving}>
              {quickSaving ? 'Salvando...' : 'Registrar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}