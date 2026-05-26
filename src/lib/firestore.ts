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
import { Transaction, Goal, Recurrence, UserSettings } from '@/types'

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