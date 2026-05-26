'use client'

import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { create } from 'zustand'

interface HideValuesStore {
  hidden: boolean
  toggle: () => void
}

export const useHideValues = create<HideValuesStore>((set) => ({
  hidden: false,
  toggle: () => set((state) => ({ hidden: !state.hidden })),
}))

interface AmountDisplayProps {
  value: number
  className?: string
  showSign?: boolean
  type?: 'income' | 'expense' | 'neutral'
}

const fmt = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export function AmountDisplay({ value, className, showSign, type }: AmountDisplayProps) {
  const { hidden } = useHideValues()

  const colorClass =
    type === 'income'
      ? 'text-emerald-500'
      : type === 'expense'
      ? 'text-red-500'
      : ''

  const sign = showSign ? (type === 'income' ? '+' : type === 'expense' ? '-' : '') : ''

  return (
    <span className={`${colorClass} ${className || ''}`}>
      {hidden ? '••••••' : `${sign}${fmt(value)}`}
    </span>
  )
}

export function HideValuesButton() {
  const { hidden, toggle } = useHideValues()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="w-8 h-8 text-muted-foreground"
    >
      {hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
    </Button>
  )
}