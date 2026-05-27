'use client'

import { useState, useEffect } from 'react'
import { User } from 'firebase/auth'
import { TransactionCategory } from '@/types'
import { saveSettings, subscribeSettings } from '@/lib/firestore'
import { gerarCorSugerida } from '@/components/shared/ColorPicker'

export const DEFAULT_CATEGORIES: TransactionCategory[] = [
  'Alimentação', 'Transporte', 'Moradia', 'Saúde',
  'Educação', 'Lazer', 'Assinatura', 'Vestuário',
  'Investimento', 'Outros',
]

export function useCategories(user: User | null) {
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [customCategoryColors, setCustomCategoryColors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setCustomCategories([])
      setCustomCategoryColors({})
      setLoading(false)
      return
    }

    const unsub = subscribeSettings(user.uid, (settings) => {
      setCustomCategories(settings.customCategories || [])
      setCustomCategoryColors(settings.customCategoryColors || {})
      setLoading(false)
    })

    setLoading(false)
    return unsub
  }, [user])

  const allCategories = [
    ...DEFAULT_CATEGORIES,
    ...customCategories.filter((c) => !DEFAULT_CATEGORIES.includes(c as TransactionCategory)),
  ]

  const addCategory = async (name: string, color: string) => {
    if (!user) return
    const trimmed = name.trim()
    if (!trimmed || customCategories.includes(trimmed)) return

    const updatedCategories = [...customCategories, trimmed]
    const updatedColors = { ...customCategoryColors, [trimmed]: color }

    setCustomCategories(updatedCategories)
    setCustomCategoryColors(updatedColors)

    await saveSettings(user.uid, {
      customCategories: updatedCategories,
      customCategoryColors: updatedColors,
    })
  }

  const removeCategory = async (name: string) => {
    if (!user) return
    const updatedCategories = customCategories.filter((c) => c !== name)
    const updatedColors = { ...customCategoryColors }
    delete updatedColors[name]

    setCustomCategories(updatedCategories)
    setCustomCategoryColors(updatedColors)

    await saveSettings(user.uid, {
      customCategories: updatedCategories,
      customCategoryColors: updatedColors,
    })
  }

  return { allCategories, customCategories, customCategoryColors, addCategory, removeCategory, loading }
}