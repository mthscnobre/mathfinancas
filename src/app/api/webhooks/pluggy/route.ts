import { NextRequest, NextResponse } from 'next/server'
import { PluggyClient } from 'pluggy-sdk'
import { saveTransaction, getUserIdByItemId } from '@/lib/firestore'
import { Transaction, TransactionCategory } from '@/types'
import { format } from 'date-fns'

const pluggy = new PluggyClient({
  clientId: process.env.PLUGGY_CLIENT_ID!,
  clientSecret: process.env.PLUGGY_CLIENT_SECRET!,
})

function mapCategory(category?: string): TransactionCategory {
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
  return map[category || ''] || 'Outros'
}

async function syncItemTransactions(itemId: string) {
  try {
    const userId = await getUserIdByItemId(itemId)
    if (!userId) {
      console.error('UserId não encontrado para itemId:', itemId)
      return
    }

    const { results: accounts } = await pluggy.fetchAccounts(itemId)
    const from = format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
    const to = format(new Date(), 'yyyy-MM-dd')

    for (const account of accounts) {
      const { results: transactions } = await pluggy.fetchTransactions(
        account.id,
        { from, to } as never
      )

      for (const tx of transactions) {
        const transaction: Transaction = {
          id: `pluggy_${tx.id}`,
          description: tx.description || 'Transação bancária',
          amount: Math.abs(tx.amount),
          type: tx.type === 'CREDIT' ? 'income' : 'expense',
          category: mapCategory(tx.category  ?? undefined),
          date: format(new Date(tx.date), 'yyyy-MM-dd'),
          paymentMethod: 'debit',
          createdAt: new Date().toISOString(),
        }

        await saveTransaction(userId as string, transaction)
      }
    }

    console.log('Sync concluído para userId:', userId)
  } catch (err) {
    console.error('Erro ao sincronizar item:', itemId, err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const event = await req.json()
    console.log('Pluggy webhook:', event.event, event.itemId)

    switch (event.event) {
      case 'item/created':
      case 'item/updated':
        await syncItemTransactions(event.itemId)
        break
      case 'item/error':
        console.error('Item error:', event.itemId, event.error)
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ received: true })
  }
}