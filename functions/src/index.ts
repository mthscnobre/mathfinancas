import { onSchedule } from 'firebase-functions/v2/scheduler'
import * as admin from 'firebase-admin'

admin.initializeApp()

const db = admin.firestore()
const messaging = admin.messaging()

async function getUserFCMToken(userId: string): Promise<string | null> {
  const snap = await db
    .collection('users')
    .doc(userId)
    .collection('settings')
    .doc('notifications')
    .get()

  if (!snap.exists) return null
  const data = snap.data()
  if (!data?.enabled || !data?.fcmToken) return null
  return data.fcmToken
}

async function sendNotification(
  userId: string,
  title: string,
  body: string
) {
  const token = await getUserFCMToken(userId)
  if (!token) return

  await messaging.send({
    token,
    notification: { title, body },
    webpush: {
      notification: {
        title,
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
      },
    },
  })
}

async function getActiveUserIds(): Promise<string[]> {
  const usersSnap = await db.collection('users').get()
  const activeUsers: string[] = []

  for (const userDoc of usersSnap.docs) {
    const notifSnap = await userDoc.ref
      .collection('settings')
      .doc('notifications')
      .get()

    if (notifSnap.exists && notifSnap.data()?.enabled) {
      activeUsers.push(userDoc.id)
    }
  }

  return activeUsers
}

// ===== LEMBRETE DIA 9 =====
export const lembreteContas = onSchedule(
  { schedule: '0 8 9 * *', timeZone: 'America/Sao_Paulo' },
  async () => {
    const userIds = await getActiveUserIds()
    for (const userId of userIds) {
      await sendNotification(
        userId,
        '💰 Lembrete de contas',
        'Não esqueça de pagar suas contas do mês!'
      )
    }
  }
)

// ===== RELATÓRIO JULIUS DIA 1 =====
export const lembreteRelatorioJulius = onSchedule(
  { schedule: '0 9 1 * *', timeZone: 'America/Sao_Paulo' },
  async () => {
    const userIds = await getActiveUserIds()
    for (const userId of userIds) {
      await sendNotification(
        userId,
        '📊 Relatório mensal pronto',
        'O Julius preparou uma análise do seu mês. Abra o app para conferir!'
      )
    }
  }
)

// ===== ALERTAS FATURAS =====
export const alertaFaturas = onSchedule(
  { schedule: '0 8 * * *', timeZone: 'America/Sao_Paulo' },
  async () => {
    const userIds = await getActiveUserIds()
    const today = new Date()
    const threeDaysFromNow = new Date(today)
    threeDaysFromNow.setDate(today.getDate() + 3)
    const targetDay = threeDaysFromNow.getDate()

    for (const userId of userIds) {
      const cardsSnap = await db
        .collection('users')
        .doc(userId)
        .collection('creditCards')
        .get()

      for (const cardDoc of cardsSnap.docs) {
        const card = cardDoc.data()
        if (card.dueDay === targetDay) {
          const billingMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
          const txSnap = await db
            .collection('users')
            .doc(userId)
            .collection('transactions')
            .where('paymentMethod', '==', 'credit_card')
            .where('creditCardId', '==', cardDoc.id)
            .where('billingMonth', '==', billingMonth)
            .get()

          const total = txSnap.docs.reduce((acc, doc) => acc + doc.data().amount, 0)

          if (total > 0) {
            const formatted = new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(total)

            await sendNotification(
              userId,
              `💳 Fatura ${card.name} vence em 3 dias`,
              `Valor estimado: ${formatted}. Não deixe para a última hora!`
            )
          }
        }
      }
    }
  }
)

// ===== ALERTAS ORÇAMENTOS =====
export const alertaOrcamentos = onSchedule(
  { schedule: '0 8 * * *', timeZone: 'America/Sao_Paulo' },
  async () => {
    const userIds = await getActiveUserIds()
    const today = new Date()
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

    for (const userId of userIds) {
      const budgetsSnap = await db
        .collection('users')
        .doc(userId)
        .collection('budgets')
        .where('month', '==', currentMonth)
        .get()

      for (const budgetDoc of budgetsSnap.docs) {
        const budget = budgetDoc.data()

        const txSnap = await db
          .collection('users')
          .doc(userId)
          .collection('transactions')
          .where('type', '==', 'expense')
          .where('category', '==', budget.category)
          .get()

        const spent = txSnap.docs
          .filter(d => d.data().date?.startsWith(currentMonth))
          .reduce((acc, doc) => acc + doc.data().amount, 0)

        const percent = (spent / budget.limit) * 100

        if (percent >= 100) {
          await sendNotification(
            userId,
            `🚨 Orçamento excedido: ${budget.category}`,
            `Você ultrapassou o limite de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(budget.limit)} em ${budget.category}.`
          )
        } else if (percent >= 80) {
          await sendNotification(
            userId,
            `⚠️ Orçamento quase no limite: ${budget.category}`,
            `Você usou ${percent.toFixed(0)}% do orçamento de ${budget.category}.`
          )
        }
      }
    }
  }
)