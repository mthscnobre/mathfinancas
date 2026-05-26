import { NextRequest, NextResponse } from 'next/server'
import { askJulius } from '@/lib/julius'
import { addMemory, searchMemories } from '@/lib/mem0'
import { FinancialSummary, JuliusMessage } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      message,
      summary,
      history,
    }: {
      message: string
      summary: FinancialSummary
      history: JuliusMessage[]
    } = body

    if (!message || !summary) {
      return NextResponse.json(
        { error: 'Mensagem e resumo financeiro são obrigatórios' },
        { status: 400 }
      )
    }

    // Busca memórias relevantes no Mem0
    const memories = await searchMemories(message)

    // Gera resposta com contexto de memória
    const response = await askJulius(message, summary, history, memories)

    // Salva a interação no Mem0 de forma assíncrona
    addMemory([
      { role: 'user', content: message },
      { role: 'assistant', content: response },
    ])

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Erro na API do Julius:', error)
    return NextResponse.json(
      { error: 'Erro ao processar sua mensagem' },
      { status: 500 }
    )
  }
}