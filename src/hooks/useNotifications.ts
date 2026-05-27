'use client'

import { useState, useEffect } from 'react'
import { User } from 'firebase/auth'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import app from '@/lib/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function useNotifications(user: User | null) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!user) return
    setLoading(true)

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission !== 'granted') {
        setLoading(false)
        return
      }

      // Registra o Service Worker customizado
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

      const messaging = getMessaging(app)
      const fcmToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      })

      if (fcmToken) {
        setToken(fcmToken)
        // Salva o token no Firestore
        await setDoc(doc(db, 'users', user.uid, 'settings', 'notifications'), {
          fcmToken,
          updatedAt: new Date().toISOString(),
          enabled: true,
        })
      }
    } catch (err) {
      console.error('Erro ao configurar notificações:', err)
    } finally {
      setLoading(false)
    }
  }

  const disableNotifications = async () => {
    if (!user) return
    try {
      await setDoc(doc(db, 'users', user.uid, 'settings', 'notifications'), {
        fcmToken: null,
        updatedAt: new Date().toISOString(),
        enabled: false,
      })
      setToken(null)
    } catch (err) {
      console.error('Erro ao desativar notificações:', err)
    }
  }

  // Listener para mensagens em foreground
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const messaging = getMessaging(app)
      const unsubscribe = onMessage(messaging, (payload) => {
        const { title, body } = payload.notification || {}
        if (title && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(title, {
            body: body || '',
            icon: '/icon-192.png',
          })
        }
      })
      return unsubscribe
    } catch {
      // messaging não disponível
    }
  }, [])

  return { permission, token, loading, requestPermission, disableNotifications }
}