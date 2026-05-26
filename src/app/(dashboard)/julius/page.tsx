'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useFinanceData } from '@/hooks/useFinanceData'
import { JuliusMessage } from '@/types'
import {
  getLastReport,
  saveReport,
  saveJuliusMessage,
  getJuliusHistory,
  clearJuliusHistory,
} from '@/lib/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Send, Loader2, RefreshCw, History } from 'lucide-react'
import { format, subMonths } from 'date-fns'
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
  const [loadingReport, setLoadingReport] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const reportGenerated = useRef(false)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Carrega histórico ao abrir
  useEffect(() => {
    if (!user) return

    const loadHistory = async () => {
      try {
        const history = await getJuliusHistory(user.uid, 30)
        setMessages(history)
      } catch {
        // histórico vazio ou erro — não faz nada
      } finally {
        setLoadingHistory(false)
      }
    }

    loadHistory()
  }, [user])

  // Relatório automático no primeiro dia do mês
  useEffect(() => {
    if (!user || loading || loadingHistory || reportGenerated.current) return

    const checkAndGenerateReport = async () => {
      const today = new Date()
      const isFirstDay = today.getDate() === 1
      if (!isFirstDay) return

      const lastReport = await getLastReport(user.uid)
      const currentMonth = format(today, 'yyyy-MM')
      if (lastReport && lastReport.startsWith(currentMonth)) return

      reportGenerated.current = true
      setLoadingReport(true)

      const lastMonthLabel = format(subMonths(today, 1), "MMMM 'de' yyyy", { locale: ptBR })
      const autoMessage = `Gere um relatório completo do mês de ${lastMonthLabel}. Analise receitas, despesas, categorias principais, comparação com médias históricas, pontos de atenção e recomendações para este novo mês. Use sua personalidade característica.`

      try {
        const response = await fetch('/api/julius', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: autoMessage, summary, history: [] }),
        })

        if (!response.ok) throw new Error()
        const data = await response.json()

        const reportMsg: JuliusMessage = {
          role: 'assistant',
          content: `📊 *Relatório de ${lastMonthLabel}*\n\n${data.response}`,
          timestamp: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, reportMsg])
        await saveJuliusMessage(user.uid, reportMsg)
        await saveReport(user.uid, {
          content: data.response,
          createdAt: new Date().toISOString(),
        })
      } catch {
        toast.error('Não foi possível gerar o relatório mensal')
      } finally {
        setLoadingReport(false)
      }
    }

    checkAndGenerateReport()
  }, [user, loading, loadingHistory, summary])

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

    if (user) await saveJuliusMessage(user.uid, userMsg)

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
      if (user) await saveJuliusMessage(user.uid, assistantMsg)
    } catch {
      toast.error('Julius está ocupado trabalhando. Tente novamente.')
    } finally {
      setThinking(false)
      inputRef.current?.focus()
    }
  }

  const handleClearChat = async () => {
    if (!user) return
    try {
      await clearJuliusHistory(user.uid)
      setMessages([])
      reportGenerated.current = false
      toast.success('Histórico limpo')
    } catch {
      toast.error('Erro ao limpar histórico')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loading || loadingHistory) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] p-6 gap-4">
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
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                className="text-muted-foreground"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Limpar histórico
              </Button>
            </>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <History className="w-3 h-3" />
            <span>{messages.length} mensagens</span>
          </div>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full flex flex-col">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {loadingReport ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-xl">
                  👨🏿
                </div>
                <div className="text-center space-y-1">
                  <p className="font-medium">Julius está preparando seu relatório mensal...</p>
                  <p className="text-sm text-muted-foreground">
                    Analisando seus dados de {format(subMonths(new Date(), 1), 'MMMM', { locale: ptBR })}
                  </p>
                </div>
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
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

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Pergunte algo ao Julius..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={thinking || loadingReport}
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!input.trim() || thinking || loadingReport}
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