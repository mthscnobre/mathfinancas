'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useFinanceData } from '@/hooks/useFinanceData'
import { Recurrence, TransactionCategory, PaymentMethod } from '@/types'
import { saveRecurrence, deleteRecurrence } from '@/lib/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
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
import { Plus, Trash2, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

const CATEGORIES: TransactionCategory[] = [
  'Alimentação', 'Transporte', 'Moradia', 'Saúde',
  'Educação', 'Lazer', 'Assinatura', 'Vestuário',
  'Investimento', 'Outros',
]

const PAYMENT_METHODS = [
  { value: 'debit', label: 'Débito' },
  { value: 'pix', label: 'Pix' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
]

const fmt = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const emptyForm = {
  description: '',
  amount: '',
  type: 'expense' as 'income' | 'expense',
  category: 'Outros' as TransactionCategory,
  paymentMethod: 'debit' as PaymentMethod,
  creditCardId: '',
  dayOfMonth: '1',
}

export default function RecorrenciasPage() {
  const { user } = useAuth()
  const { recurrences, creditCards, loading } = useFinanceData(user)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!user || !form.description || !form.amount || !form.dayOfMonth) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    if (form.paymentMethod === 'credit_card' && !form.creditCardId) {
      toast.error('Selecione um cartão de crédito')
      return
    }

    setSaving(true)
    try {
      const rec: Recurrence = {
        id: uuidv4(),
        description: form.description,
        amount: parseFloat(form.amount.replace(',', '.')),
        type: form.type,
        category: form.category,
        paymentMethod: form.paymentMethod,
        ...(form.paymentMethod === 'credit_card' && form.creditCardId
          ? { creditCardId: form.creditCardId }
          : {}),
        dayOfMonth: parseInt(form.dayOfMonth),
        active: true,
        createdAt: new Date().toISOString(),
      }

      await saveRecurrence(user.uid, rec)
      toast.success('Recorrência criada!')
      setForm(emptyForm)
      setOpen(false)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao criar recorrência')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (rec: Recurrence) => {
    if (!user) return
    try {
      await saveRecurrence(user.uid, { ...rec, active: !rec.active })
      toast.success(rec.active ? 'Recorrência pausada' : 'Recorrência reativada')
    } catch {
      toast.error('Erro ao atualizar recorrência')
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) return
    try {
      await deleteRecurrence(user.uid, id)
      toast.success('Recorrência removida')
    } catch {
      toast.error('Erro ao remover recorrência')
    }
  }

  const getPaymentLabel = (method: PaymentMethod) => {
    const labels: Record<PaymentMethod, string> = {
      debit: 'Débito', pix: 'Pix', cash: 'Dinheiro', credit_card: 'Crédito',
    }
    return labels[method]
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const active = recurrences.filter((r) => r.active)
  const inactive = recurrences.filter((r) => !r.active)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recorrências</h1>
          <p className="text-muted-foreground text-sm">
            {active.length} ativas · {inactive.length} pausadas
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Recorrência
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Recorrência Mensal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
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

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  placeholder="Ex: Netflix, Salário, Aluguel"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

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
                  <Label>Dia do mês</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="1"
                    value={form.dayOfMonth}
                    onChange={(e) => setForm({ ...form, dayOfMonth: e.target.value })}
                  />
                </div>
              </div>

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

              {form.type === 'expense' && (
                <div className="space-y-2">
                  <Label>Forma de pagamento</Label>
                  <Select
                    value={form.paymentMethod}
                    onValueChange={(v) => setForm({ ...form, paymentMethod: v as PaymentMethod, creditCardId: '' })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {form.type === 'expense' && form.paymentMethod === 'credit_card' && (
                <div className="space-y-2">
                  <Label>Cartão</Label>
                  {creditCards.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum cartão cadastrado.</p>
                  ) : (
                    <Select
                      value={form.creditCardId}
                      onValueChange={(v) => setForm({ ...form, creditCardId: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecione o cartão" /></SelectTrigger>
                      <SelectContent>
                        {creditCards.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                              {c.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Criar Recorrência'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {recurrences.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <RefreshCw className="w-12 h-12 text-muted-foreground" />
          <div>
            <p className="font-medium">Nenhuma recorrência ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cadastre salário, aluguel, Netflix e outras transações mensais fixas
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Ativas
              </h2>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {active.map((rec) => {
                      const card = rec.creditCardId
                        ? creditCards.find((c) => c.id === rec.creditCardId)
                        : null

                      return (
                        <div key={rec.id} className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-8 rounded-full ${rec.type === 'income' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <div>
                              <p className="text-sm font-medium">{rec.description}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-xs text-muted-foreground">
                                  Todo dia {rec.dayOfMonth}
                                </span>
                                <Badge variant="outline" className="text-xs py-0">{rec.category}</Badge>
                                <Badge variant="outline" className="text-xs py-0">
                                  {getPaymentLabel(rec.paymentMethod || 'debit')}
                                </Badge>
                                {card && (
                                  <Badge variant="outline" className="text-xs py-0 flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: card.color }} />
                                    {card.name}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${rec.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                              {rec.type === 'income' ? '+' : '-'}{fmt(rec.amount)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 text-muted-foreground hover:text-amber-500"
                              onClick={() => handleToggle(rec)}
                            >
                              <ToggleRight className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 text-muted-foreground hover:text-red-500"
                              onClick={() => handleDelete(rec.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {inactive.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Pausadas
              </h2>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {inactive.map((rec) => (
                      <div key={rec.id} className="flex items-center justify-between p-4 opacity-50 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-8 rounded-full bg-muted" />
                          <div>
                            <p className="text-sm font-medium">{rec.description}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">
                                Todo dia {rec.dayOfMonth}
                              </span>
                              <Badge variant="outline" className="text-xs py-0">{rec.category}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-muted-foreground">
                            {fmt(rec.amount)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-muted-foreground hover:text-emerald-500"
                            onClick={() => handleToggle(rec)}
                          >
                            <ToggleLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-muted-foreground hover:text-red-500"
                            onClick={() => handleDelete(rec.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}