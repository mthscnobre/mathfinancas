import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore'
import { db } from './firebase'
import { Transaction, Goal, Recurrence, UserSettings, CreditCard, Piggybank, Investment } from '@/types'

// ===== TRANSACTIONS =====
export const saveTransaction = async (userId: string, tx: Transaction) => {
  await setDoc(doc(db, 'users', userId, 'transactions', tx.id), tx)
}

export const deleteTransaction = async (userId: string, id: string) => {
  await deleteDoc(doc(db, 'users', userId, 'transactions', id))
}

export const subscribeTransactions = (
  userId: string,
  callback: (transactions: Transaction[]) => void
) => {
  const q = query(
    collection(db, 'users', userId, 'transactions'),
    orderBy('date', 'desc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as Transaction))
  })
}

export const getTransactions = async (userId: string): Promise<Transaction[]> => {
  const q = query(
    collection(db, 'users', userId, 'transactions'),
    orderBy('date', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as Transaction)
}

// ===== GOALS =====
export const saveGoal = async (userId: string, goal: Goal) => {
  await setDoc(doc(db, 'users', userId, 'goals', goal.id), goal)
}

export const deleteGoal = async (userId: string, id: string) => {
  await deleteDoc(doc(db, 'users', userId, 'goals', id))
}

export const subscribeGoals = (
  userId: string,
  callback: (goals: Goal[]) => void
) => {
  return onSnapshot(collection(db, 'users', userId, 'goals'), (snap) => {
    callback(snap.docs.map((d) => d.data() as Goal))
  })
}

// ===== RECURRENCES =====
export const saveRecurrence = async (userId: string, rec: Recurrence) => {
  await setDoc(doc(db, 'users', userId, 'recurrences', rec.id), rec)
}

export const deleteRecurrence = async (userId: string, id: string) => {
  await deleteDoc(doc(db, 'users', userId, 'recurrences', id))
}

export const subscribeRecurrences = (
  userId: string,
  callback: (recurrences: Recurrence[]) => void
) => {
  return onSnapshot(collection(db, 'users', userId, 'recurrences'), (snap) => {
    callback(snap.docs.map((d) => d.data() as Recurrence))
  })
}

// ===== SETTINGS =====
export const saveSettings = async (userId: string, settings: UserSettings) => {
  await setDoc(doc(db, 'users', userId, 'settings', 'preferences'), settings)
}

export const subscribeSettings = (
  userId: string,
  callback: (settings: UserSettings) => void
) => {
  return onSnapshot(
    doc(db, 'users', userId, 'settings', 'preferences'),
    (snap) => {
      if (snap.exists()) callback(snap.data() as UserSettings)
    }
  )
}

// ===== CREDIT CARDS =====
export const saveCreditCard = async (userId: string, card: CreditCard) => {
  await setDoc(doc(db, 'users', userId, 'creditCards', card.id), card)
}

export const deleteCreditCard = async (userId: string, id: string) => {
  await deleteDoc(doc(db, 'users', userId, 'creditCards', id))
}

export const subscribeCreditCards = (
  userId: string,
  callback: (cards: CreditCard[]) => void
) => {
  return onSnapshot(collection(db, 'users', userId, 'creditCards'), (snap) => {
    callback(snap.docs.map((d) => d.data() as CreditCard))
  })
}

// ===== PIGGYBANKS =====
export const savePiggybank = async (userId: string, piggy: Piggybank) => {
  await setDoc(doc(db, 'users', userId, 'piggybanks', piggy.id), piggy)
}

export const deletePiggybank = async (userId: string, id: string) => {
  await deleteDoc(doc(db, 'users', userId, 'piggybanks', id))
}

export const subscribePiggybanks = (
  userId: string,
  callback: (piggybanks: Piggybank[]) => void
) => {
  return onSnapshot(collection(db, 'users', userId, 'piggybanks'), (snap) => {
    callback(snap.docs.map((d) => d.data() as Piggybank))
  })
}

// ===== INVESTMENTS =====
export const saveInvestment = async (userId: string, investment: Investment) => {
  await setDoc(doc(db, 'users', userId, 'investments', investment.id), investment)
}

export const deleteInvestment = async (userId: string, id: string) => {
  await deleteDoc(doc(db, 'users', userId, 'investments', id))
}

export const subscribeInvestments = (
  userId: string,
  callback: (investments: Investment[]) => void
) => {
  return onSnapshot(collection(db, 'users', userId, 'investments'), (snap) => {
    callback(snap.docs.map((d) => d.data() as Investment))
  })
}

import { CategoryBudget } from '@/types'

// ===== BUDGETS =====
export const saveBudget = async (userId: string, budget: CategoryBudget) => {
  await setDoc(doc(db, 'users', userId, 'budgets', budget.id), budget)
}

export const deleteBudget = async (userId: string, id: string) => {
  await deleteDoc(doc(db, 'users', userId, 'budgets', id))
}

export const subscribeBudgets = (
  userId: string,
  callback: (budgets: CategoryBudget[]) => void
) => {
  return onSnapshot(collection(db, 'users', userId, 'budgets'), (snap) => {
    callback(snap.docs.map((d) => d.data() as CategoryBudget))
  })
}

// ===== JULIUS REPORT =====
export const getLastReport = async (userId: string): Promise<string | null> => {
  const snap = await getDocs(collection(db, 'users', userId, 'julius_reports'))
  if (snap.empty) return null
  const docs = snap.docs.map(d => d.data())
  const sorted = docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return sorted[0]?.createdAt || null
}

export const saveReport = async (userId: string, report: { content: string; createdAt: string }) => {
  const id = report.createdAt.substring(0, 7) // YYYY-MM
  await setDoc(doc(db, 'users', userId, 'julius_reports', id), report)
}