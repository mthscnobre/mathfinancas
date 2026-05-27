import { NextRequest, NextResponse } from 'next/server'
import { PluggyClient } from 'pluggy-sdk'

export async function POST(request: NextRequest) {
  try {
    const { itemId } = await request.json()

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

    // Verifica se o item existe e está conectado
    const item = await client.fetchItem(itemId)

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Erro ao salvar item:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar conexão bancária' },
      { status: 500 }
    )
  }
}