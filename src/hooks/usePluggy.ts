'use client'

import { useState, useEffect } from 'react'
import { User } from 'firebase/auth'
import { savePluggyItemId, getPluggyItemId } from '@/lib/firestore'
import { Transaction, TransactionCategory } from '@/types'
import { saveTransaction } from '@/lib/firestore'
import { format } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'

export function usePluggy(user: User | null) {
  const [itemId, setItemId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [connectToken, setConnectToken] = useState<string | null>(null)
  const [showWidget, setShowWidget] = useState(false)

  useEffect(() => {
    if (!user) return
    getPluggyItemId(user.uid).then((id) => {
      if (id) setItemId(id)
    })
  }, [user])

  const getConnectToken = async () => {
    const response = await fetch('/api/pluggy/connect-token', { method: 'POST' })
    const data = await response.json()
    return data.accessToken
  }

  const openWidget = async () => {
    const token = await getConnectToken()
    setConnectToken(token)
    setShowWidget(true)
  }

  const handleSuccess = async (itemData: { item: { id: string } }) => {
    if (!user) return
    const newItemId = itemData.item.id
    await savePluggyItemId(user.uid, newItemId)
    setItemId(newItemId)
    setShowWidget(false)
    await syncTransactions(newItemId)
  }

  const syncTransactions = async (id?: string) => {
    if (!user) return
    const targetItemId = id || itemId
    if (!targetItemId) return

    setSyncing(true)
    try {
      const from = format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
      const to = format(new Date(), 'yyyy-MM-dd')

      const response = await fetch(
        `/api/pluggy/transactions?itemId=${targetItemId}&from=${from}&to=${to}`
      )
      const data = await response.json()

      if (data.error) throw new Error(data.error)

      // Importa transações do banco para o Firestore
      for (const tx of data.transactions) {
        const pluggyId = `pluggy_${tx.id}`

        const transaction: Transaction = {
          id: pluggyId,
          description: tx.description || tx.descriptionRaw || 'Transação bancária',
          amount: Math.abs(tx.amount),
          type: tx.type === 'CREDIT' ? 'income' : 'expense',
          category: mapPluggyCategory(tx.category) as TransactionCategory,
          date: format(new Date(tx.date), 'yyyy-MM-dd'),
          paymentMethod: mapPluggyPaymentMethod(tx.paymentData?.paymentMethod),
          createdAt: new Date().toISOString(),
        }

        await saveTransaction(user.uid, transaction)
      }

      setLastSync(new Date().toISOString())
    } catch (error) {
      console.error('Erro ao sincronizar:', error)
      throw error
    } finally {
      setSyncing(false)
    }
  }

  return {
    itemId,
    syncing,
    lastSync,
    connectToken,
    showWidget,
    setShowWidget,
    openWidget,
    handleSuccess,
    syncTransactions,
  }
}

function mapPluggyCategory(category?: string): TransactionCategory {
  if (!category) return 'Outros'

  const map: Record<string, TransactionCategory> = {
    'FOOD_AND_DRINK': 'Alimentação',
    'TRANSPORT': 'Transporte',
    'HOUSING': 'Moradia',
    'HEALTH_AND_FITNESS': 'Saúde',
    'EDUCATION': 'Educação',
    'ENTERTAINMENT': 'Lazer',
    'SUBSCRIPTION': 'Assinatura',
    'SHOPPING': 'Vestuário',
    'INVESTMENT': 'Investimento',
  }

  return map[category] || 'Outros'
}

function mapPluggyPaymentMethod(method?: string) {
  const map: Record<string, string> = {
    'PIX': 'pix',
    'TED': 'debit',
    'BOLETO': 'debit',
    'DEBIT_CARD': 'debit',
    'CREDIT_CARD': 'credit_card',
  }
  return (map[method || ''] || 'debit') as 'pix' | 'debit' | 'credit_card' | 'cash'
}