'use client'

import { useState } from 'react'
import { Piggybank } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AmountDisplay } from '@/components/shared/AmountDisplay'
import { Trash2 } from 'lucide-react'

interface PiggybankCardProps {
  piggy: Piggybank
  onDelete: (id: string) => void
  onAddAmount: (piggy: Piggybank, amount: number) => void
}

export function PiggybankCard({ piggy, onDelete, onAddAmount }: PiggybankCardProps) {
  const [addOpen, setAddOpen] = useState(false)
  const [addAmount, setAddAmount] = useState('')

  const progress = piggy.targetAmount
    ? Math.min((piggy.currentAmount / piggy.targetAmount) * 100, 100)
    : null

  const handleAdd = () => {
    const amount = parseFloat(addAmount.replace(',', '.'))
    if (!amount || amount <= 0) return
    onAddAmount(piggy, amount)
    setAddAmount('')
    setAddOpen(false)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{piggy.icon}</span>
            <CardTitle className="text-base">{piggy.name}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-muted-foreground hover:text-red-500"
            onClick={() => onDelete(piggy.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-2xl font-bold">
          <AmountDisplay value={piggy.currentAmount} />
        </p>

        {piggy.targetAmount && progress !== null && (
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Meta: <AmountDisplay value={piggy.targetAmount} /></span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

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
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => setAddOpen(true)}
            >
              Adicionar valor
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}