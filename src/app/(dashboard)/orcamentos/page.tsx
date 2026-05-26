'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useFinanceData } from '@/hooks/useFinanceData'
import { CategoryBudget, TransactionCategory } from '@/types'
import { saveBudget, deleteBudget } from '@/lib/firestore'
import { AmountDisplay } from '@/components/shared/AmountDisplay'
import { CategoryBadge } from '@/components/shared/CategoryBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Trash2, PieChart } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { v4 as uuidv4 } from 'uuid'

const CATEGORIES: TransactionCategory[] = [
  'Alimentação', 'Transporte', 'Moradia', 'Saúde',
  'Educação', 'Lazer', 'Assinatura', 'Vestuário',
  'Investimento', 'Outros',
]

const STATUS_COLORS = {
  ok: 'bg-emerald-500',
  warning: 'bg-amber-500',
  exceeded: 'bg-red-500',
}

const STATUS_LABELS = {
  ok: 'No limite',
  warning: 'Atenção',
  exceeded: 'Excedido',
}

export default function OrcamentosPage() {
  const { user } = useAuth()
  const { summary, loading } = useFinanceData(user)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    category: 'Alimentação' as TransactionCategory,
    limit: '',
  })
  const [saving, setSaving] = useState(false)

  const currentMonth = format(new Date(), 'yyyy-MM')
  const currentMonthLabel = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })

  const handleSave = async () => {
    if (!user || !form.limit) {
      toast.error('Preencha o valor limite')
      return
    }

    const existing = summary.budgets.find((b) => b.category === form.category)
    if (existing) {
      toast.error('Já existe um orçamento para essa categoria este mês')
      return
    }

    setSaving(true)
    try {
      const budget: CategoryBudget = {
        id: uuidv4(),
        category: form.category,
        limit: parseFloat(form.limit.replace(',', '.')),
        month: currentMonth,
        createdAt: new Date().toISOString(),
      }

      await saveBudget(user.uid, budget)
      toast.success('Orçamento criado!')
      setForm({ category: 'Alimentação', limit: '' })
      setOpen(false)
    } catch {
      toast.error('Erro ao criar orçamento')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) return
    try {
      await deleteBudget(user.uid, id)
      toast.success('Orçamento removido')
    } catch {
      toast.error('Erro ao remover orçamento')
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const totalBudget = summary.budgetStatus.reduce((acc, b) => acc + b.limit, 0)
  const totalSpent = summary.budgetStatus.reduce((acc, b) => acc + b.spent, 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orçamentos</h1>
          <p className="text-muted-foreground text-sm capitalize">{currentMonthLabel}</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Orçamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Novo Orçamento Mensal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v as TransactionCategory })}
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
                <Label>Limite mensal (R$)</Label>
                <Input
                  placeholder="0,00"
                  value={form.limit}
                  onChange={(e) => setForm({ ...form, limit: e.target.value })}
                />
              </div>
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Criar Orçamento'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumo geral */}
      {summary.budgetStatus.length > 0 && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total orçado</span>
              <AmountDisplay value={totalBudget} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total gasto</span>
              <AmountDisplay
                value={totalSpent}
                type={totalSpent > totalBudget ? 'expense' : 'neutral'}
              />
            </div>
            <div>
              <Progress
                value={Math.min((totalSpent / totalBudget) * 100, 100)}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {summary.budgetStatus.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <PieChart className="w-12 h-12 text-muted-foreground" />
          <div>
            <p className="font-medium">Nenhum orçamento para este mês</p>
            <p className="text-sm text-muted-foreground mt-1">
              Defina limites por categoria e acompanhe seus gastos em tempo real
            </p>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {summary.budgetStatus.map((bs) => {
                const budget = summary.budgets.find((b) => b.category === bs.category)

                return (
                  <div key={bs.category} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <CategoryBadge category={bs.category as TransactionCategory} />
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          bs.status === 'ok'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : bs.status === 'warning'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-red-500/10 text-red-500'
                        }`}>
                          {STATUS_LABELS[bs.status]}
                        </span>
                        {budget && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-muted-foreground hover:text-red-500"
                            onClick={() => handleDelete(budget.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span>
                          <AmountDisplay value={bs.spent} /> de <AmountDisplay value={bs.limit} />
                        </span>
                        <span>{bs.percent.toFixed(0)}%</span>
                      </div>
                      <Progress
                        value={Math.min(bs.percent, 100)}
                        className={`h-2 ${bs.status !== 'ok' ? '[&>div]:' + STATUS_COLORS[bs.status] : ''}`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}