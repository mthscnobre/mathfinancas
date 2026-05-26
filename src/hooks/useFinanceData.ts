'use client'

import { useState, useEffect } from 'react'
import { User } from 'firebase/auth'
import { Transaction, Goal, Recurrence, FinancialSummary } from '@/types'
import {
  subscribeTransactions,
  subscribeGoals,
  subscribeRecurrences,
} from '@/lib/firestore'

export function useFinanceData(user: User | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [recurrences, setRecurrences] = useState<Recurrence[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setTransactions([])
      setGoals([])
      setRecurrences([])
      setLoading(false)
      return
    }

    setLoading(true)

    const unsubTx = subscribeTransactions(user.uid, (data) => {
      setTransactions(data)
      setLoading(false)
    })

    const unsubGoals = subscribeGoals(user.uid, (data) => {
      setGoals(data)
    })

    const unsubRecs = subscribeRecurrences(user.uid, (data) => {
      setRecurrences(data)
    })

    return () => {
      unsubTx()
      unsubGoals()
      unsubRecs()
    }
  }, [user])

  const summary: FinancialSummary = (() => {
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0)

    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0)

    const balance = totalIncome - totalExpenses

    const categoryMap = transactions
      .filter((t) => t.type === 'expense')
      .reduce(
        (acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount
          return acc
        },
        {} as Record<string, number>
      )

    const topCategories = Object.entries(categoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    const months = [
      ...new Set(transactions.map((t) => t.date.substring(0, 7))),
    ].length || 1

    const monthlyAvgIncome = totalIncome / months
    const monthlyAvgExpenses = totalExpenses / months

    return {
      totalIncome,
      totalExpenses,
      balance,
      topCategories,
      monthlyAvgIncome,
      monthlyAvgExpenses,
      transactions,
      goals,
    }
  })()

  return { transactions, goals, recurrences, summary, loading }
}