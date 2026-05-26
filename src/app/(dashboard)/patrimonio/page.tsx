'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useFinanceData } from '@/hooks/useFinanceData'
import { CreditCard, Piggybank, Investment, InvestmentType } from '@/types'
import {
  saveCreditCard,
  deleteCreditCard,
  savePiggybank,
  deletePiggybank,
  saveInvestment,
  deleteInvestment,
} from '@/lib/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Trash2, CreditCard as CreditCardIcon, PiggyBank, TrendingUp } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { v4 as uuidv4 } from 'uuid'

const fmt = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const INVESTMENT_TYPES: InvestmentType[] = [
  'CDB', 'LCI', 'LCA', 'Tesouro Direto', 'Poupança',
  'Fundos', 'Ações', 'FII', 'Criptomoedas', 'Outros',
]

const CARD_COLORS = [
  '#6366f1', '#ec4899', '#14b8a6', '#f59e0b',
  '#ef4444', '#8b5cf6', '#06b6d4', '#10b981',
]

const PIGGY_ICONS = ['🐷', '✈️', '🏠', '🚗', '📱', '💻', '🎓', '🏖️', '🎯', '💊']

export default function PatrimonioPage() {
  const { user } = useAuth()
  const { creditCards, piggybanks, investments, summary, loading } = useFinanceData(user)

  // Cartões
  const [cardOpen, setCardOpen] = useState(false)
  const [cardForm, setCardForm] = useState({
    name: '', limit: '', closingDay: '', dueDay: '', color: CARD_COLORS[0],
  })

  // Caixinhas
  const [piggyOpen, setPiggyOpen] = useState(false)
  const [piggyForm, setPiggyForm] = useState({
    name: '', targetAmount: '', currentAmount: '', icon: '🐷',
  })
  const [piggyAddOpen, setPiggyAddOpen] = useState<string | null>(null)
  const [piggyAddAmount, setPiggyAddAmount] = useState('')

  // Investimentos
  const [investOpen, setInvestOpen] = useState(false)
  const [investForm, setInvestForm] = useState({
    name: '', type: 'CDB' as InvestmentType, investedAmount: '',
    currentAmount: '', startDate: format(new Date(), 'yyyy-MM-dd'),
    dueDate: '', liquidity: 'daily' as 'daily' | 'on_due_date' | 'custom',
    institution: '', rate: '',
  })

  const handleSaveCard = async () => {
    if (!user || !cardForm.name || !cardForm.limit || !cardForm.closingDay || !cardForm.dueDay) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    try {
      const card: CreditCard = {
        id: uuidv4(),
        name: cardForm.name,
        limit: parseFloat(cardForm.limit.replace(',', '.')),
        closingDay: parseInt(cardForm.closingDay),
        dueDay: parseInt(cardForm.dueDay),
        color: cardForm.color,
        createdAt: new Date().toISOString(),
      }
      await saveCreditCard(user.uid, card)
      toast.success('Cartão cadastrado!')
      setCardForm({ name: '', limit: '', closingDay: '', dueDay: '', color: CARD_COLORS[0] })
      setCardOpen(false)
    } catch {
      toast.error('Erro ao salvar cartão')
    }
  }

  const handleSavePiggy = async () => {
    if (!user || !piggyForm.name) {
      toast.error('Preencha o nome da caixinha')
      return
    }
    try {
      const piggy: Piggybank = {
        id: uuidv4(),
        name: piggyForm.name,
        targetAmount: piggyForm.targetAmount ? parseFloat(piggyForm.targetAmount.replace(',', '.')) : undefined,
        currentAmount: parseFloat(piggyForm.currentAmount.replace(',', '.')) || 0,
        icon: piggyForm.icon,
        createdAt: new Date().toISOString(),
      }
      await savePiggybank(user.uid, piggy)
      toast.success('Caixinha criada!')
      setPiggyForm({ name: '', targetAmount: '', currentAmount: '', icon: '🐷' })
      setPiggyOpen(false)
    } catch {
      toast.error('Erro ao criar caixinha')
    }
  }

  const handleAddToPiggy = async (piggy: Piggybank) => {
    if (!user || !piggyAddAmount) return
    try {
      const amount = parseFloat(piggyAddAmount.replace(',', '.'))
      const updated: Piggybank = {
        ...piggy,
        currentAmount: piggy.currentAmount + amount,
      }
      await savePiggybank(user.uid, updated)
      toast.success('Valor adicionado!')
      setPiggyAddAmount('')
      setPiggyAddOpen(null)
    } catch {
      toast.error('Erro ao atualizar caixinha')
    }
  }

  const handleSaveInvestment = async () => {
    if (!user || !investForm.name || !investForm.investedAmount || !investForm.institution) {
      toast.error('Preencha os campos obrigatórios')
      return
    }
    try {
      const invested = parseFloat(investForm.investedAmount.replace(',', '.'))
      const investment: Investment = {
        id: uuidv4(),
        name: investForm.name,
        type: investForm.type,
        investedAmount: invested,
        currentAmount: investForm.currentAmount
          ? parseFloat(investForm.currentAmount.replace(',', '.'))
          : invested,
        startDate: investForm.startDate,
        dueDate: investForm.dueDate || undefined,
        liquidity: investForm.liquidity,
        institution: investForm.institution,
        rate: investForm.rate || undefined,
        createdAt: new Date().toISOString(),
      }
      await saveInvestment(user.uid, investment)
      toast.success('Investimento cadastrado!')
      setInvestForm({
        name: '', type: 'CDB', investedAmount: '', currentAmount: '',
        startDate: format(new Date(), 'yyyy-MM-dd'), dueDate: '',
        liquidity: 'daily', institution: '', rate: '',
      })
      setInvestOpen(false)
    } catch {
      toast.error('Erro ao salvar investimento')
    }
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Patrimônio</h1>
        <p className="text-muted-foreground text-sm">
          Patrimônio líquido: {fmt(summary.netWorth)}
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCardIcon className="w-4 h-4" /> Fatura próximo mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">{fmt(summary.totalNextInvoice)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {creditCards.length} {creditCards.length === 1 ? 'cartão' : 'cartões'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <PiggyBank className="w-4 h-4" /> Total em caixinhas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-500">{fmt(summary.totalPiggybanks)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {piggybanks.length} {piggybanks.length === 1 ? 'caixinha' : 'caixinhas'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Total investido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-500">{fmt(summary.totalCurrentInvestments)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Aportado: {fmt(summary.totalInvested)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cartoes">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="cartoes">Cartões</TabsTrigger>
          <TabsTrigger value="caixinhas">Caixinhas</TabsTrigger>
          <TabsTrigger value="investimentos">Investimentos</TabsTrigger>
        </TabsList>

        {/* CARTÕES */}
        <TabsContent value="cartoes" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={cardOpen} onOpenChange={setCardOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-2" />Novo Cartão</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Novo Cartão de Crédito</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Nome do cartão</Label>
                    <Input placeholder="Ex: Nubank, Inter, C6" value={cardForm.name}
                      onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Limite (R$)</Label>
                    <Input placeholder="0,00" value={cardForm.limit}
                      onChange={(e) => setCardForm({ ...cardForm, limit: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Dia de fechamento</Label>
                      <Input type="number" min="1" max="31" placeholder="15"
                        value={cardForm.closingDay}
                        onChange={(e) => setCardForm({ ...cardForm, closingDay: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Dia de vencimento</Label>
                      <Input type="number" min="1" max="31" placeholder="22"
                        value={cardForm.dueDay}
                        onChange={(e) => setCardForm({ ...cardForm, dueDay: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cor</Label>
                    <div className="flex gap-2">
                      {CARD_COLORS.map((color) => (
                        <button key={color} onClick={() => setCardForm({ ...cardForm, color })}
                          className={`w-8 h-8 rounded-full transition-transform ${cardForm.color === color ? 'scale-125 ring-2 ring-offset-2 ring-foreground' : ''}`}
                          style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleSaveCard}>Salvar Cartão</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {creditCards.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Nenhum cartão cadastrado ainda
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {creditCards.map((card) => {
                const currentInvoice = summary.currentMonthInvoice[card.id] || 0
                const nextInvoice = summary.nextMonthInvoice[card.id] || 0
                const usagePercent = (currentInvoice / card.limit) * 100

                return (
                  <Card key={card.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-7 rounded-md" style={{ backgroundColor: card.color }} />
                          <div>
                            <CardTitle className="text-base">{card.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">
                              Fecha dia {card.closingDay} · Vence dia {card.dueDay}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-red-500"
                          onClick={() => { if (user) deleteCreditCard(user.uid, card.id) }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Fatura atual</span>
                          <span className="font-medium">{fmt(currentInvoice)} / {fmt(card.limit)}</span>
                        </div>
                        <Progress value={Math.min(usagePercent, 100)} className="h-2" />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Próxima fatura estimada</span>
                        <span className="font-medium text-foreground">{fmt(nextInvoice)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* CAIXINHAS */}
        <TabsContent value="caixinhas" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={piggyOpen} onOpenChange={setPiggyOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-2" />Nova Caixinha</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Nova Caixinha</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Ícone</Label>
                    <div className="flex flex-wrap gap-2">
                      {PIGGY_ICONS.map((icon) => (
                        <button key={icon} onClick={() => setPiggyForm({ ...piggyForm, icon })}
                          className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-colors ${piggyForm.icon === icon ? 'bg-primary text-primary-foreground' : 'bg-accent'}`}>
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input placeholder="Ex: Viagem, Reserva, Emergência" value={piggyForm.name}
                      onChange={(e) => setPiggyForm({ ...piggyForm, name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Meta (opcional)</Label>
                      <Input placeholder="0,00" value={piggyForm.targetAmount}
                        onChange={(e) => setPiggyForm({ ...piggyForm, targetAmount: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Já tenho (R$)</Label>
                      <Input placeholder="0,00" value={piggyForm.currentAmount}
                        onChange={(e) => setPiggyForm({ ...piggyForm, currentAmount: e.target.value })} />
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleSavePiggy}>Criar Caixinha</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {piggybanks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Nenhuma caixinha ainda
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {piggybanks.map((piggy) => {
                const progress = piggy.targetAmount
                  ? Math.min((piggy.currentAmount / piggy.targetAmount) * 100, 100)
                  : null

                return (
                  <Card key={piggy.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{piggy.icon}</span>
                          <CardTitle className="text-base">{piggy.name}</CardTitle>
                        </div>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-red-500"
                          onClick={() => { if (user) deletePiggybank(user.uid, piggy.id) }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-2xl font-bold">{fmt(piggy.currentAmount)}</p>
                      {piggy.targetAmount && progress !== null && (
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Meta: {fmt(piggy.targetAmount)}</span>
                            <span>{progress.toFixed(0)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      )}
                      <div className="flex gap-2">
                        {piggyAddOpen === piggy.id ? (
                          <>
                            <Input
                              placeholder="Valor"
                              value={piggyAddAmount}
                              onChange={(e) => setPiggyAddAmount(e.target.value)}
                              className="h-8 text-sm"
                            />
                            <Button size="sm" onClick={() => handleAddToPiggy(piggy)}>+</Button>
                            <Button size="sm" variant="ghost" onClick={() => setPiggyAddOpen(null)}>✕</Button>
                          </>
                        ) : (
                          <Button size="sm" variant="outline" className="w-full"
                            onClick={() => setPiggyAddOpen(piggy.id)}>
                            Adicionar valor
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* INVESTIMENTOS */}
        <TabsContent value="investimentos" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={investOpen} onOpenChange={setInvestOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-2" />Novo Investimento</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Novo Investimento</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select value={investForm.type}
                        onValueChange={(v) => setInvestForm({ ...investForm, type: v as InvestmentType })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {INVESTMENT_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Instituição</Label>
                      <Input placeholder="Ex: Nubank, XP" value={investForm.institution}
                        onChange={(e) => setInvestForm({ ...investForm, institution: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input placeholder="Ex: CDB Nubank 100% CDI" value={investForm.name}
                      onChange={(e) => setInvestForm({ ...investForm, name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Valor aportado (R$)</Label>
                      <Input placeholder="0,00" value={investForm.investedAmount}
                        onChange={(e) => setInvestForm({ ...investForm, investedAmount: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Valor atual (R$)</Label>
                      <Input placeholder="Igual ao aportado" value={investForm.currentAmount}
                        onChange={(e) => setInvestForm({ ...investForm, currentAmount: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Taxa</Label>
                    <Input placeholder="Ex: 100% CDI, IPCA+5%" value={investForm.rate}
                      onChange={(e) => setInvestForm({ ...investForm, rate: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Data de início</Label>
                      <Input type="date" value={investForm.startDate}
                        onChange={(e) => setInvestForm({ ...investForm, startDate: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Vencimento (opcional)</Label>
                      <Input type="date" value={investForm.dueDate}
                        onChange={(e) => setInvestForm({ ...investForm, dueDate: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Liquidez</Label>
                    <Select value={investForm.liquidity}
                      onValueChange={(v) => setInvestForm({ ...investForm, liquidity: v as 'daily' | 'on_due_date' | 'custom' })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Liquidez diária</SelectItem>
                        <SelectItem value="on_due_date">No vencimento</SelectItem>
                        <SelectItem value="custom">Personalizada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={handleSaveInvestment}>Salvar Investimento</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {investments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Nenhum investimento cadastrado ainda
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {investments.map((inv) => {
                const rendimento = inv.currentAmount - inv.investedAmount
                const rendimentoPercent = (rendimento / inv.investedAmount) * 100

                return (
                  <Card key={inv.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{inv.name}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {inv.type} · {inv.institution}
                            {inv.rate && ` · ${inv.rate}`}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-red-500"
                          onClick={() => { if (user) deleteInvestment(user.uid, inv.id) }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-2xl font-bold">{fmt(inv.currentAmount)}</p>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Aportado: {fmt(inv.investedAmount)}</span>
                        <span className={rendimento >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                          {rendimento >= 0 ? '+' : ''}{fmt(rendimento)} ({rendimentoPercent.toFixed(2)}%)
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Início: {format(parseISO(inv.startDate), 'dd/MM/yyyy')}</span>
                        <span>
                          {inv.liquidity === 'daily' ? '💧 Liquidez diária' :
                           inv.dueDate ? `Vence: ${format(parseISO(inv.dueDate), 'dd/MM/yyyy')}` :
                           'No vencimento'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}