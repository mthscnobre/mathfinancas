'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useFinanceData } from '@/hooks/useFinanceData'
import { Goal } from '@/types'
import { saveGoal, deleteGoal } from '@/lib/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Trash2, Target } from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { v4 as uuidv4 } from 'uuid'

const fmt = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const GOAL_ICONS = ['🏠', '🚗', '✈️', '📱', '💻', '🎓', '💍', '🏦', '🛡️', '🎯']

const emptyForm = {
  title: '',
  targetAmount: '',
  currentAmount: '',
  deadline: '',
  icon: '🎯',
}

export default function MetasPage() {
  const { user } = useAuth()
  const { goals, loading } = useFinanceData(user)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!user || !form.title || !form.targetAmount || !form.deadline) {
      toast.error('Preencha título, valor alvo e prazo')
      return
    }

    setSaving(true)
    try {
      const goal: Goal = {
        id: uuidv4(),
        title: form.title,
        targetAmount: parseFloat(form.targetAmount.replace(',', '.')),
        currentAmount: parseFloat(form.currentAmount.replace(',', '.')) || 0,
        deadline: form.deadline,
        icon: form.icon,
        createdAt: new Date().toISOString(),
      }

      await saveGoal(user.uid, goal)
      toast.success('Meta criada!')
      setForm(emptyForm)
      setOpen(false)
    } catch {
      toast.error('Erro ao criar meta')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) return
    try {
      await deleteGoal(user.uid, id)
      toast.success('Meta removida')
    } catch {
      toast.error('Erro ao remover meta')
    }
  }

  const handleAddAmount = async (goal: Goal, amount: number) => {
    if (!user) return
    try {
      const updated: Goal = {
        ...goal,
        currentAmount: Math.min(goal.currentAmount + amount, goal.targetAmount),
      }
      await saveGoal(user.uid, updated)
      toast.success('Valor atualizado!')
    } catch {
      toast.error('Erro ao atualizar meta')
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Metas</h1>
          <p className="text-muted-foreground text-sm">
            {goals.length} {goals.length === 1 ? 'meta ativa' : 'metas ativas'}
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Meta Financeira</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Ícone */}
              <div className="space-y-2">
                <Label>Ícone</Label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setForm({ ...form, icon })}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-colors ${
                        form.icon === icon
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-accent hover:bg-accent/80'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Título */}
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  placeholder="Ex: Reserva de emergência"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              {/* Valores */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Valor alvo (R$)</Label>
                  <Input
                    placeholder="0,00"
                    value={form.targetAmount}
                    onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Já tenho (R$)</Label>
                  <Input
                    placeholder="0,00"
                    value={form.currentAmount}
                    onChange={(e) => setForm({ ...form, currentAmount: e.target.value })}
                  />
                </div>
              </div>

              {/* Prazo */}
              <div className="space-y-2">
                <Label>Prazo</Label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                />
              </div>

              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Criar Meta'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <Target className="w-12 h-12 text-muted-foreground" />
          <div>
            <p className="font-medium">Nenhuma meta ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crie sua primeira meta financeira e o Julius vai te ajudar a chegar lá
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
            const daysLeft = differenceInDays(parseISO(goal.deadline), new Date())
            const remaining = goal.targetAmount - goal.currentAmount
            const isCompleted = progress >= 100

            return (
              <Card key={goal.id} className={isCompleted ? 'border-emerald-500/50' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{goal.icon}</span>
                      <div>
                        <CardTitle className="text-base">{goal.title}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Prazo: {format(parseISO(goal.deadline), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-muted-foreground hover:text-red-500"
                      onClick={() => handleDelete(goal.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        {fmt(goal.currentAmount)} de {fmt(goal.targetAmount)}
                      </span>
                      <span className="font-medium">{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {!isCompleted && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Faltam {fmt(remaining)}</span>
                      <span>
                        {daysLeft > 0
                          ? `${daysLeft} dias restantes`
                          : daysLeft === 0
                          ? 'Vence hoje!'
                          : `Vencida há ${Math.abs(daysLeft)} dias`}
                      </span>
                    </div>
                  )}

                  {isCompleted && (
                    <p className="text-sm text-emerald-500 font-medium text-center">
                      🎉 Meta concluída!
                    </p>
                  )}

                  {!isCompleted && (
                    <div className="flex gap-2">
                      {[50, 100, 500].map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => handleAddAmount(goal, amount)}
                        >
                          +{fmt(amount)}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}