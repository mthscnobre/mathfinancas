'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useFinanceData } from '@/hooks/useFinanceData'
import { Transaction, PaymentMethod } from '@/types'
import { deleteTransaction } from '@/lib/firestore'
import { TransactionDialog } from '@/components/shared/TransactionDialog'
import { CategoryBadge } from '@/components/shared/CategoryBadge'
import { PaymentMethodBadge } from '@/components/shared/PaymentMethodBadge'
import { AmountDisplay } from '@/components/shared/AmountDisplay'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Trash2, Search, Pencil } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Badge } from '@/components/ui/badge'

const CATEGORIES = [
  'Alimentação', 'Transporte', 'Moradia', 'Saúde',
  'Educação', 'Lazer', 'Assinatura', 'Vestuário',
  'Investimento', 'Outros',
]

export default function TransacoesPage() {
  const { user } = useAuth()
  const { transactions, creditCards, loading } = useFinanceData(user)
  const [open, setOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const openNew = () => {
    setEditingTx(null)
    setOpen(true)
  }

  const openEdit = (tx: Transaction) => {
    setEditingTx(tx)
    setOpen(true)
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
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Transação
        </Button>
      </div>

      <TransactionDialog
        open={open}
        onOpenChange={(v) => { setOpen(v); if (!v) setEditingTx(null) }}
        userId={user?.uid || ''}
        creditCards={creditCards}
        editingTx={editingTx}
      />

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
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="income">Receitas</SelectItem>
            <SelectItem value="expense">Despesas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-12">
              Nenhuma transação encontrada
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((t) => {
                const card = t.creditCardId
                  ? creditCards.find((c) => c.id === t.creditCardId)
                  : null

                return (
                  <div key={t.id} className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-8 rounded-full ${t.type === 'income' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="text-sm font-medium">{t.description}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(t.date), 'dd/MM/yyyy')}
                          </span>
                          <CategoryBadge category={t.category} />
                          <PaymentMethodBadge method={t.paymentMethod || 'debit'} />
                          {card && (
                            <Badge variant="outline" className="text-xs py-0 flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: card.color }} />
                              {card.name}
                            </Badge>
                          )}
                          {t.local && (
                            <span className="text-xs text-muted-foreground">📍 {t.local}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AmountDisplay
                        value={t.amount}
                        type={t.type}
                        showSign
                        className="font-semibold"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-muted-foreground hover:text-blue-500"
                        onClick={() => openEdit(t)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
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
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}