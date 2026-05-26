'use client'

import { useState, useEffect } from 'react'
import { User } from 'firebase/auth'
import { TransactionCategory } from '@/types'
import { saveSettings, subscribeSettings } from '@/lib/firestore'

export const DEFAULT_CATEGORIES: TransactionCategory[] = [
  'Alimentação', 'Transporte', 'Moradia', 'Saúde',
  'Educação', 'Lazer', 'Assinatura', 'Vestuário',
  'Investimento', 'Outros',
]

export function useCategories(user: User | null) {
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setCustomCategories([])
      setLoading(false)
      return
    }

    const unsub = subscribeSettings(user.uid, (settings) => {
      setCustomCategories(settings.customCategories || [])
      setLoading(false)
    })

    setLoading(false)
    return unsub
  }, [user])

  const allCategories = [
    ...DEFAULT_CATEGORIES,
    ...customCategories.filter((c) => !DEFAULT_CATEGORIES.includes(c as TransactionCategory)),
  ]

  const addCategory = async (name: string) => {
    if (!user) return
    const trimmed = name.trim()
    if (!trimmed || customCategories.includes(trimmed)) return

    const updated = [...customCategories, trimmed]
    setCustomCategories(updated)
    await saveSettings(user.uid, { customCategories: updated })
  }

  const removeCategory = async (name: string) => {
    if (!user) return
    const updated = customCategories.filter((c) => c !== name)
    setCustomCategories(updated)
    await saveSettings(user.uid, { customCategories: updated })
  }

  return { allCategories, customCategories, addCategory, removeCategory, loading }
}