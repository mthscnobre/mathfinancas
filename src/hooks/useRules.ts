'use client'

import { useState, useEffect } from 'react'
import { User } from 'firebase/auth'
import { v4 as uuidv4 } from 'uuid'
import { CategorizationRule } from '@/types'
import { saveRule, deleteRule, subscribeRules } from '@/lib/firestore'

export function useRules(user: User | null) {
  const [rules, setRules] = useState<CategorizationRule[]>([])
  const [loading, setLoading] = useState(true)

  // ─── Listener em tempo real ───────────────────────────────────────────────
useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRules([])
      setLoading(false)
      return
    }

    setLoading(true)

    const unsub = subscribeRules(user.uid, (data) => {
      setRules(data)
      setLoading(false)
    })

    return unsub
  }, [user])

  // ─── Adicionar regra ──────────────────────────────────────────────────────
  /**
   * Cria uma nova regra. A prioridade é atribuída automaticamente:
   * o maior valor existente + 10, para deixar espaço para inserções futuras
   * sem precisar reordenar tudo.
   */
  const addRule = async (
    data: Omit<CategorizationRule, 'id' | 'priority' | 'createdAt'>
  ): Promise<void> => {
    if (!user) return

    const maxPriority = rules.reduce((max, r) => Math.max(max, r.priority), 0)

    const newRule: CategorizationRule = {
      ...data,
      id: uuidv4(),
      priority: maxPriority + 10,
      createdAt: new Date().toISOString(),
    }

    // Otimistic update — reflete na UI antes da confirmação do Firestore
    setRules((prev) => [...prev, newRule].sort((a, b) => a.priority - b.priority))

    await saveRule(user.uid, newRule)
  }

  // ─── Atualizar regra ──────────────────────────────────────────────────────
  /**
   * Atualiza campos de uma regra existente pelo id.
   * Aceita qualquer subconjunto dos campos — apenas o que for passado é alterado.
   */
  const updateRule = async (
    id: string,
    data: Partial<Omit<CategorizationRule, 'id' | 'createdAt'>>
  ): Promise<void> => {
    if (!user) return

    const existing = rules.find((r) => r.id === id)
    if (!existing) return

    const updated: CategorizationRule = { ...existing, ...data }

    setRules((prev) =>
      prev
        .map((r) => (r.id === id ? updated : r))
        .sort((a, b) => a.priority - b.priority)
    )

    await saveRule(user.uid, updated)
  }

  // ─── Remover regra ────────────────────────────────────────────────────────
  const removeRule = async (id: string): Promise<void> => {
    if (!user) return

    setRules((prev) => prev.filter((r) => r.id !== id))

    await deleteRule(user.uid, id)
  }

  // ─── Ativar / desativar regra ─────────────────────────────────────────────
  const toggleRule = async (id: string): Promise<void> => {
    const rule = rules.find((r) => r.id === id)
    if (!rule) return
    await updateRule(id, { active: !rule.active })
  }

  // ─── Reordenar prioridades ────────────────────────────────────────────────
  /**
   * Recebe a lista de ids na nova ordem desejada e reatribui prioridades
   * em incrementos de 10 (10, 20, 30...). Salva todas as regras afetadas
   * em paralelo para minimizar round-trips.
   */
  const reorderRules = async (orderedIds: string[]): Promise<void> => {
    if (!user) return

    const reordered = orderedIds
      .map((id, index) => {
        const rule = rules.find((r) => r.id === id)
        if (!rule) return null
        return { ...rule, priority: (index + 1) * 10 }
      })
      .filter((r): r is CategorizationRule => r !== null)

    setRules(reordered)

    await Promise.all(reordered.map((r) => saveRule(user.uid, r)))
  }

  return {
    rules,
    loading,
    addRule,
    updateRule,
    removeRule,
    toggleRule,
    reorderRules,
  }
}