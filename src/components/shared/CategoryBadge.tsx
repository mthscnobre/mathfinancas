import { TransactionCategory } from '@/types'
import { Badge } from '@/components/ui/badge'

const DEFAULT_CATEGORY_COLORS: Record<TransactionCategory, string> = {
  'Alimentação': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'Transporte': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Moradia': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'Saúde': 'bg-red-500/10 text-red-500 border-red-500/20',
  'Educação': 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  'Lazer': 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  'Assinatura': 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  'Vestuário': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  'Investimento': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'Outros': 'bg-gray-500/10 text-gray-500 border-gray-500/20',
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

interface CategoryBadgeProps {
  category: string
  color?: string
  className?: string
}

export function CategoryBadge({ category, color, className }: CategoryBadgeProps) {
  // Categoria customizada com cor hex
  if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${className || ''}`}
        style={{
          backgroundColor: hexToRgba(color, 0.15),
          color: color,
          borderColor: hexToRgba(color, 0.4),
        }}
      >
        {category}
      </span>
    )
  }

  // Categoria padrão com classe Tailwind
  const colorClass = DEFAULT_CATEGORY_COLORS[category as TransactionCategory]
    || 'bg-gray-500/10 text-gray-500 border-gray-500/20'

  return (
    <Badge
      variant="outline"
      className={`text-xs py-0 ${colorClass} ${className || ''}`}
    >
      {category}
    </Badge>
  )
}