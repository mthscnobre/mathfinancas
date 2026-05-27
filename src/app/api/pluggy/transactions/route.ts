import { NextRequest, NextResponse } from 'next/server'
import { PluggyClient } from 'pluggy-sdk'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!itemId) {
      return NextResponse.json(
        { error: 'itemId é obrigatório' },
        { status: 400 }
      )
    }

    const client = new PluggyClient({
      clientId: process.env.PLUGGY_CLIENT_ID!,
      clientSecret: process.env.PLUGGY_CLIENT_SECRET!,
    })

    // Busca as contas do item
    const { results: accounts } = await client.fetchAccounts(itemId)

    // Busca transações de todas as contas
    const allTransactions = []
    for (const account of accounts) {
      const params: Record<string, string> = {}
      if (from) params.from = from
      if (to) params.to = to

      const { results: transactions } = await client.fetchTransactions(
        account.id,
        params
      )
      allTransactions.push(...transactions.map(t => ({ ...t, accountId: account.id, accountName: account.name })))
    }

    return NextResponse.json({
      accounts,
      transactions: allTransactions,
    })
  } catch (error) {
    console.error('Erro ao buscar transações Pluggy:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar transações' },
      { status: 500 }
    )
  }
}