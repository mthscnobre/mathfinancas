'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useFinanceData } from '@/hooks/useFinanceData'
import { Goal } from '@/types'
import { saveGoal, deleteGoal } from '@/lib/firestore'
import { GoalCard } from '@/components/shared/GoalCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Target } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

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

              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  placeholder="Ex: Reserva de emergência"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

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
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onDelete={handleDelete}
              onAddAmount={handleAddAmount}
            />
          ))}
        </div>
      )}
    </div>
  )
}