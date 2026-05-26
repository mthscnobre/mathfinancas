'use client'

import { useState, useEffect } from 'react'
import { User } from 'firebase/auth'
import {
  Transaction,
  Goal,
  Recurrence,
  FinancialSummary,
  CreditCard,
  Piggybank,
  Investment,
  CategoryBudget,
} from '@/types'
import {
  subscribeTransactions,
  subscribeGoals,
  subscribeRecurrences,
  subscribeCreditCards,
  subscribePiggybanks,
  subscribeInvestments,
  subscribeBudgets,
} from '@/lib/firestore'
import { format, addMonths } from 'date-fns'

export function useFinanceData(user: User | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [recurrences, setRecurrences] = useState<Recurrence[]>([])
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [piggybanks, setPiggybanks] = useState<Piggybank[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [budgets, setBudgets] = useState<CategoryBudget[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setTransactions([])
      setGoals([])
      setRecurrences([])
      setCreditCards([])
      setPiggybanks([])
      setInvestments([])
      setBudgets([])
      setLoading(false)
      return
    }

    setLoading(true)

    const unsubTx = subscribeTransactions(user.uid, (data) => {
      const normalized = data.map((t) => ({
        ...t,
        paymentMethod: t.paymentMethod || 'debit',
      }))
      setTransactions(normalized)
      setLoading(false)
    })
    const unsubGoals = subscribeGoals(user.uid, (data) => setGoals(data))
    const unsubRecs = subscribeRecurrences(user.uid, (data) => setRecurrences(data))
    const unsubCards = subscribeCreditCards(user.uid, (data) => setCreditCards(data))
    const unsubPiggy = subscribePiggybanks(user.uid, (data) => setPiggybanks(data))
    const unsubInvest = subscribeInvestments(user.uid, (data) => setInvestments(data))
    const unsubBudgets = subscribeBudgets(user.uid, (data) => setBudgets(data))

    return () => {
      unsubTx()
      unsubGoals()
      unsubRecs()
      unsubCards()
      unsubPiggy()
      unsubInvest()
      unsubBudgets()
    }
  }, [user])

  const summary: FinancialSummary = (() => {
    const currentMonth = format(new Date(), 'yyyy-MM')
    const nextMonth = format(addMonths(new Date(), 1), 'yyyy-MM')

    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0)

    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0)

    const cashExpenses = transactions
      .filter((t) => t.type === 'expense' && t.paymentMethod !== 'credit_card')
      .reduce((acc, t) => acc + t.amount, 0)

    const balance = totalIncome - cashExpenses

    const currentMonthInvoice: Record<string, number> = {}
    const nextMonthInvoice: Record<string, number> = {}

    transactions
      .filter((t) => t.type === 'expense' && t.paymentMethod === 'credit_card' && t.creditCardId)
      .forEach((t) => {
        const billing = t.billingMonth || currentMonth
        if (billing === currentMonth) {
          currentMonthInvoice[t.creditCardId!] = (currentMonthInvoice[t.creditCardId!] || 0) + t.amount
        }
        if (billing === nextMonth) {
          nextMonthInvoice[t.creditCardId!] = (nextMonthInvoice[t.creditCardId!] || 0) + t.amount
        }
      })

    const totalNextInvoice = Object.values(nextMonthInvoice).reduce((acc, v) => acc + v, 0)
    const committedBalance = balance - totalNextInvoice

    const categoryMap = transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)

    const topCategories = Object.entries(categoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    const months = [...new Set(transactions.map((t) => t.date.substring(0, 7)))].length || 1
    const monthlyAvgIncome = totalIncome / months
    const monthlyAvgExpenses = totalExpenses / months

    const totalPiggybanks = piggybanks.reduce((acc, p) => acc + p.currentAmount, 0)
    const totalInvested = investments.reduce((acc, i) => acc + i.investedAmount, 0)
    const totalCurrentInvestments = investments.reduce((acc, i) => acc + i.currentAmount, 0)
    const netWorth = balance + totalPiggybanks + totalCurrentInvestments

    // Orçamentos do mês atual
    const currentMonthBudgets = budgets.filter((b) => b.month === currentMonth)
    const currentMonthExpenses = transactions.filter(
      (t) => t.type === 'expense' && t.date.startsWith(currentMonth)
    )

    const budgetStatus = currentMonthBudgets.map((budget) => {
      const spent = currentMonthExpenses
        .filter((t) => t.category === budget.category)
        .reduce((acc, t) => acc + t.amount, 0)
      const percent = budget.limit > 0 ? (spent / budget.limit) * 100 : 0
      const status =
        percent >= 100 ? 'exceeded' : percent >= 80 ? 'warning' : 'ok'

      return {
        category: budget.category,
        limit: budget.limit,
        spent,
        percent,
        status: status as 'ok' | 'warning' | 'exceeded',
      }
    })

    return {
      totalIncome,
      totalExpenses,
      balance,
      committedBalance,
      budgets: currentMonthBudgets,
      budgetStatus,
      creditCards,
      currentMonthInvoice,
      nextMonthInvoice,
      totalNextInvoice,
      piggybanks,
      investments,
      totalPiggybanks,
      totalInvested,
      totalCurrentInvestments,
      netWorth,
      topCategories,
      monthlyAvgIncome,
      monthlyAvgExpenses,
      transactions,
      goals,
    }
  })()

  return { transactions, goals, recurrences, creditCards, piggybanks, investments, budgets, summary, loading }
}