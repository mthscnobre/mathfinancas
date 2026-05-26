'use client'

import { Investment } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AmountDisplay } from '@/components/shared/AmountDisplay'
import { Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface InvestmentCardProps {
  investment: Investment
  onDelete: (id: string) => void
}

export function InvestmentCard({ investment: inv, onDelete }: InvestmentCardProps) {
  const rendimento = inv.currentAmount - inv.investedAmount
  const rendimentoPercent = inv.investedAmount > 0
    ? (rendimento / inv.investedAmount) * 100
    : 0

  const liquidityLabel = {
    daily: '💧 Liquidez diária',
    on_due_date: 'No vencimento',
    custom: 'Personalizada',
  }[inv.liquidity]

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{inv.name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {inv.type} · {inv.institution}
              {inv.rate && ` · ${inv.rate}`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-muted-foreground hover:text-red-500"
            onClick={() => onDelete(inv.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-2xl font-bold">
          <AmountDisplay value={inv.currentAmount} />
        </p>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Aportado: <AmountDisplay value={inv.investedAmount} /></span>
          <span className={rendimento >= 0 ? 'text-emerald-500' : 'text-red-500'}>
            {rendimento >= 0 ? '+' : ''}
            <AmountDisplay value={rendimento} />
            {' '}({rendimentoPercent.toFixed(2)}%)
          </span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Início: {format(parseISO(inv.startDate), 'dd/MM/yyyy')}</span>
          <span>
            {inv.liquidity === 'daily'
              ? liquidityLabel
              : inv.dueDate
              ? `Vence: ${format(parseISO(inv.dueDate), 'dd/MM/yyyy')}`
              : liquidityLabel}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}