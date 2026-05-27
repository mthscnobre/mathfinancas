import { NextResponse } from 'next/server'
import { PluggyClient } from 'pluggy-sdk'

export async function GET() {
  try {
    const pluggy = new PluggyClient({
      clientId: process.env.PLUGGY_CLIENT_ID!,
      clientSecret: process.env.PLUGGY_CLIENT_SECRET!,
    })

    const connectToken = await pluggy.createConnectToken()

    return NextResponse.json({ accessToken: connectToken.accessToken })
  } catch (error) {
    console.error('Erro ao gerar connect token:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar token de conexão' },
      { status: 500 }
    )
  }
}

export async function POST() {
  return GET()
}