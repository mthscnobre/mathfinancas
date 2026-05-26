'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useFinanceData } from '@/hooks/useFinanceData'
import { JuliusMessage } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Send, Loader2, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const JULIUS_SUGGESTIONS = [
  'Como está minha saúde financeira este mês?',
  'Onde estou gastando mais dinheiro?',
  'Consigo montar uma reserva de emergência?',
  'Me dá dicas para reduzir meus gastos',
  'Qual tipo de investimento combina com meu perfil?',
  'Me faz um resumo do meu histórico financeiro',
]

export default function JuliusPage() {
  const { user } = useAuth()
  const { summary, loading } = useFinanceData(user)
  const [messages, setMessages] = useState<JuliusMessage[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async (text?: string) => {
    const message = text || input.trim()
    if (!message || thinking) return

    const userMsg: JuliusMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setThinking(true)

    try {
      const response = await fetch('/api/julius', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          summary,
          history: messages.slice(-10),
        }),
      })

      if (!response.ok) throw new Error('Erro na API')

      const data = await response.json()

      const assistantMsg: JuliusMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      toast.error('Julius está ocupado trabalhando. Tente novamente.')
    } finally {
      setThinking(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen p-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-xl">
            👨🏿
          </div>
          <div>
            <h1 className="text-xl font-bold">Julius</h1>
            <p className="text-xs text-muted-foreground">
              Seu conselheiro financeiro pessoal
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChat} className="text-muted-foreground">
            <RefreshCw className="w-4 h-4 mr-2" />
            Nova conversa
          </Button>
        )}
      </div>

      {/* Chat area */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full flex flex-col">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
                <div className="text-center space-y-2">
                  <p className="text-4xl">💰</p>
                  <p className="font-medium">Julius está pronto</p>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Eu trabalho 14 horas por dia e sei o valor de cada centavo.
                    Pode perguntar sobre suas finanças!
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {JULIUS_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => sendMessage(suggestion)}
                      className="text-left text-sm p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-sm shrink-0 mt-1">
                        👨🏿
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-sm'
                          : 'bg-accent rounded-tl-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-1 ${
                        msg.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'
                      }`}>
                        {format(new Date(msg.timestamp), 'HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}

                {thinking && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-sm shrink-0">
                      👨🏿
                    </div>
                    <div className="bg-accent rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Julius está calculando...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Pergunte algo ao Julius..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={thinking}
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!input.trim() || thinking}
                size="icon"
              >
                {thinking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Julius analisa seus dados financeiros reais para responder
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}