'use client'

import { Goal } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AmountDisplay } from '@/components/shared/AmountDisplay'
import { Trash2 } from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useState } from 'react'

interface GoalCardProps {
  goal: Goal
  onDelete: (id: string) => void
  onAddAmount: (goal: Goal, amount: number) => void
}

export function GoalCard({ goal, onDelete, onAddAmount }: GoalCardProps) {
  const [addOpen, setAddOpen] = useState(false)
  const [addAmount, setAddAmount] = useState('')

  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
  const daysLeft = differenceInDays(parseISO(goal.deadline), new Date())
  const remaining = goal.targetAmount - goal.currentAmount
  const isCompleted = progress >= 100

  const handleAdd = () => {
    const amount = parseFloat(addAmount.replace(',', '.'))
    if (!amount || amount <= 0) return
    onAddAmount(goal, amount)
    setAddAmount('')
    setAddOpen(false)
  }

  return (
    <Card className={isCompleted ? 'border-emerald-500/50' : ''}>
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
            onClick={() => onDelete(goal.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              <AmountDisplay value={goal.currentAmount} /> de <AmountDisplay value={goal.targetAmount} />
            </span>
            <span className="font-medium">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {!isCompleted && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Faltam <AmountDisplay value={remaining} /></span>
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
          <div className="space-y-2">
            {addOpen ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Valor"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                />
                <Button size="sm" onClick={handleAdd}>+</Button>
                <Button size="sm" variant="ghost" onClick={() => setAddOpen(false)}>✕</Button>
              </div>
            ) : (
              <div className="flex gap-2">
                {[50, 100, 500].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => onAddAmount(goal, amount)}
                  >
                    +<AmountDisplay value={amount} />
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setAddOpen(true)}
                >
                  Outro
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}