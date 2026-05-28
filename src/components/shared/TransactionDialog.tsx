'use client'

import { useState, useEffect } from 'react'
import { Transaction, TransactionCategory, PaymentMethod, CreditCard } from '@/types'
import { saveTransaction } from '@/lib/firestore'
import { useCategories } from '@/hooks/useCategories'
import { useAuth } from '@/hooks/useAuth'
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
import { toast } from 'sonner'
import { format, addMonths } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'

// CATEGORIES local removido — agora vem do useCategories

const PAYMENT_METHODS = [
  { value: 'debit', label: 'Débito' },
  { value: 'pix', label: 'Pix' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
]

interface TransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  creditCards: CreditCard[]
  editingTx?: Transaction | null
  onSuccess?: () => void
  defaultType?: 'income' | 'expense'
}

const emptyForm = (defaultType: 'income' | 'expense' = 'expense') => ({
  description: '',
  amount: '',
  type: defaultType,
  category: 'Outros' as TransactionCategory,
  date: format(new Date(), 'yyyy-MM-dd'),
  paymentMethod: 'debit' as PaymentMethod,
  creditCardId: '',
  local: '',
  notes: '',
  installmentTotal: '',
})

export function TransactionDialog({
  open,
  onOpenChange,
  userId,
  creditCards,
  editingTx,
  onSuccess,
  defaultType = 'expense',
}: TransactionDialogProps) {
  // Busca o usuário autenticado para passar ao useCategories
  const { user } = useAuth()
  // allCategories já inclui as categorias padrão + as customizadas do usuário
  const { allCategories } = useCategories(user)

  const [form, setForm] = useState(emptyForm(defaultType))

useEffect(() => {
    if (editingTx) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        description: editingTx.description,
        amount: editingTx.amount.toString(),
        type: editingTx.type,
        category: editingTx.category,
        date: editingTx.date,
        paymentMethod: editingTx.paymentMethod || 'debit',
        creditCardId: editingTx.creditCardId || '',
        local: editingTx.local || '',
        notes: editingTx.notes || '',
        installmentTotal: '',
      })
    } else {
      setForm(emptyForm(defaultType))
    }
  }, [editingTx, open, defaultType])

  const [saving, setSaving] = useState(false)

  const handleOpenChange = (v: boolean) => {
    if (!v) setForm(emptyForm(defaultType))
    onOpenChange(v)
  }

  const handleSave = async () => {
    if (!form.description || !form.amount) {
      toast.error('Preencha descrição e valor')
      return
    }

    if (form.paymentMethod === 'credit_card' && !form.creditCardId) {
      toast.error('Selecione um cartão de crédito')
      return
    }

    setSaving(true)
    try {
      const amount = parseFloat(form.amount.replace(',', '.'))

      if (editingTx) {
        const updated = {
          ...editingTx,
          description: form.description,
          amount,
          type: form.type,
          category: form.category,
          date: form.date,
          paymentMethod: form.paymentMethod,
          ...(form.paymentMethod === 'credit_card' && form.creditCardId
            ? { creditCardId: form.creditCardId }
            : {}),
          ...(form.paymentMethod === 'credit_card'
            ? { billingMonth: format(addMonths(new Date(form.date), 1), 'yyyy-MM') }
            : {}),
          ...(form.local ? { local: form.local } : {}),
          ...(form.notes ? { notes: form.notes } : {}),
        }

        const clean = Object.fromEntries(
          Object.entries(updated).filter(([, v]) => v !== undefined)
        ) as unknown as Transaction

        await saveTransaction(userId, clean)
        toast.success('Transação atualizada!')
      } else {
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
            paymentMethod: form.paymentMethod,
            ...(form.paymentMethod === 'credit_card' && form.creditCardId
              ? { creditCardId: form.creditCardId }
              : {}),
            ...(form.paymentMethod === 'credit_card'
              ? { billingMonth: format(addMonths(new Date(form.date), i + 1), 'yyyy-MM') }
              : {}),
            ...(form.local ? { local: form.local } : {}),
            ...(form.notes ? { notes: form.notes } : {}),
            ...(installments > 1
              ? { installmentTotal: installments, installmentCurrent: i + 1 }
              : {}),
            createdAt: new Date().toISOString(),
          }

          await saveTransaction(userId, tx)
        }

        toast.success(
          parseInt(form.installmentTotal) > 1
            ? `${form.installmentTotal} parcelas lançadas!`
            : 'Transação salva!'
        )
      }

      setForm(emptyForm(defaultType))
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar transação')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingTx ? 'Editar Transação' : 'Nova Transação'}</DialogTitle>
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
              placeholder="Ex: Almoço no trabalho"
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
              <Label>Data</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
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
                {allCategories.map((c) => (
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
                <p className="text-xs text-muted-foreground">
                  Nenhum cartão cadastrado. Cadastre um cartão primeiro.
                </p>
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

          <div className="space-y-2">
            <Label>Local (opcional)</Label>
            <Input
              placeholder="Ex: McDonald's, Posto Shell"
              value={form.local}
              onChange={(e) => setForm({ ...form, local: e.target.value })}
            />
          </div>

          {!editingTx && form.type === 'expense' && (
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

          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Input
              placeholder="Alguma nota adicional"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : editingTx ? 'Salvar alterações' : 'Salvar Transação'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}