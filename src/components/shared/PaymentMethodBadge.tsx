import { PaymentMethod } from '@/types'
import { Badge } from '@/components/ui/badge'

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  debit: 'Débito',
  pix: 'Pix',
  cash: 'Dinheiro',
  credit_card: 'Crédito',
}

const PAYMENT_COLORS: Record<PaymentMethod, string> = {
  debit: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  pix: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  cash: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  credit_card: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
}

interface PaymentMethodBadgeProps {
  method: PaymentMethod
  className?: string
}

export function PaymentMethodBadge({ method, className }: PaymentMethodBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`text-xs py-0 ${PAYMENT_COLORS[method] || ''} ${className || ''}`}
    >
      {PAYMENT_LABELS[method]}
    </Badge>
  )
}