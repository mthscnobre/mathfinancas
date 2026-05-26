'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useFinanceData } from '@/hooks/useFinanceData'
import { Transaction, TransactionCategory } from '@/types'
import { saveTransaction, deleteTransaction } from '@/lib/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { Plus, Trash2, Search } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { v4 as uuidv4 } from 'uuid'

const CATEGORIES: TransactionCategory[] = [
  'Alimentação', 'Transporte', 'Moradia', 'Saúde',
  'Educação', 'Lazer', 'Assinatura', 'Vestuário',
  'Investimento', 'Outros',
]

const fmt = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const emptyForm = {
  description: '',
  amount: '',
  type: 'expense' as 'income' | 'expense',
  category: 'Outros' as TransactionCategory,
  date: format(new Date(), 'yyyy-MM-dd'),
  local: '',
  notes: '',
  installmentTotal: '',
}

export default function TransacoesPage() {
  const { user } = useAuth()
  const { transactions, loading } = useFinanceData(user)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const handleSave = async () => {
    if (!user || !form.description || !form.amount) {
      toast.error('Preencha descrição e valor')
      return
    }

    setSaving(true)
    try {
      const amount = parseFloat(form.amount.replace(',', '.'))
      const installments = parseInt(form.installmentTotal) || 1

      for (let i = 0; i < installments; i++) {
        const date = new Date(form.date)
        date.setMonth(date.getMonth() + i)

        const tx: Transaction = {
          id: uuidv4(),
          description: installments > 1
            ? `${form.description} (${i + 1}/${installments})`
            : form.description,
          amount: amount / installments,
          type: form.type,
          category: form.category,
          date: format(date, 'yyyy-MM-dd'),
          local: form.local || undefined,
          notes: form.notes || undefined,
          installmentTotal: installments > 1 ? installments : undefined,
          installmentCurrent: installments > 1 ? i + 1 : undefined,
          createdAt: new Date().toISOString(),
        }

        await saveTransaction(user.uid, tx)
      }

      toast.success(
        installments > 1
          ? `${installments} parcelas lançadas com sucesso!`
          : 'Transação salva!'
      )
      setForm(emptyForm)
      setOpen(false)
    } catch {
      toast.error('Erro ao salvar transação')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) return
    try {
      await deleteTransaction(user.uid, id)
      toast.success('Transação removida')
    } catch {
      toast.error('Erro ao remover transação')
    }
  }

  const filtered = transactions.filter((t) => {
    const matchSearch =
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      (t.local?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchType = filterType === 'all' || t.type === filterType
    const matchCategory = filterCategory === 'all' || t.category === filterCategory
    return matchSearch && matchType && matchCategory
  })

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transações</h1>
          <p className="text-muted-foreground text-sm">
            {transactions.length} transações registradas
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Transação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Tipo */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={form.type === 'expense' ? 'destructive' : 'outline'}
                  onClick={() => setForm({ ...form, type: 'expense' })}
                >
                  Despesa
                </Button>
                <Button
                  variant={form.type === 'income' ? 'default' : 'outline'}
                  className={form.type === 'income' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                  onClick={() => setForm({ ...form, type: 'income' })}
                >
                  Receita
                </Button>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  placeholder="Ex: Almoço no trabalho"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* Valor e Data */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    placeholder="0,00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v as TransactionCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Local */}
              <div className="space-y-2">
                <Label>Local (opcional)</Label>
                <Input
                  placeholder="Ex: McDonald's, Posto Shell"
                  value={form.local}
                  onChange={(e) => setForm({ ...form, local: e.target.value })}
                />
              </div>

              {/* Parcelas */}
              {form.type === 'expense' && (
                <div className="space-y-2">
                  <Label>Parcelas (opcional)</Label>
                  <Input
                    type="number"
                    placeholder="1"
                    min="1"
                    max="48"
                    value={form.installmentTotal}
                    onChange={(e) => setForm({ ...form, installmentTotal: e.target.value })}
                  />
                </div>
              )}

              {/* Observações */}
              <div className="space-y-2">
                <Label>Observações (opcional)</Label>
                <Input
                  placeholder="Alguma nota adicional"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar Transação'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar transações..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="income">Receitas</SelectItem>
            <SelectItem value="expense">Despesas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-12">
              Nenhuma transação encontrada
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-8 rounded-full ${t.type === 'income' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="text-sm font-medium">{t.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(t.date), 'dd/MM/yyyy')}
                        </span>
                        <Badge variant="outline" className="text-xs py-0">
                          {t.category}
                        </Badge>
                        {t.local && (
                          <span className="text-xs text-muted-foreground">
                            📍 {t.local}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-semibold ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-muted-foreground hover:text-red-500"
                      onClick={() => handleDelete(t.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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