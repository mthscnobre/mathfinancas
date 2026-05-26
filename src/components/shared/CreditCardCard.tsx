'use client'

import { CreditCard } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { AmountDisplay } from '@/components/shared/AmountDisplay'
import { Trash2 } from 'lucide-react'

interface CreditCardCardProps {
  card: CreditCard
  currentInvoice: number
  nextInvoice: number
  onDelete: (id: string) => void
}

export function CreditCardCard({
  card,
  currentInvoice,
  nextInvoice,
  onDelete,
}: CreditCardCardProps) {
  const usagePercent = card.limit > 0
    ? Math.min((currentInvoice / card.limit) * 100, 100)
    : 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-7 rounded-md"
              style={{ backgroundColor: card.color }}
            />
            <div>
              <CardTitle className="text-base">{card.name}</CardTitle>
              <p className="text-xs text-muted-foreground">
                Fecha dia {card.closingDay} · Vence dia {card.dueDay}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-muted-foreground hover:text-red-500"
            onClick={() => onDelete(card.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Fatura atual</span>
            <span className="font-medium">
              <AmountDisplay value={currentInvoice} /> / <AmountDisplay value={card.limit} />
            </span>
          </div>
          <Progress value={usagePercent} className="h-2" />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Próxima fatura estimada</span>
          <span className="font-medium text-foreground">
            <AmountDisplay value={nextInvoice} />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}