'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCategories, DEFAULT_CATEGORIES } from '@/hooks/useCategories'
import { usePluggy } from '@/hooks/usePluggy'
import { useNotifications } from '@/hooks/useNotifications'
import { useRules } from '@/hooks/useRules'
import { CategoryBadge } from '@/components/shared/CategoryBadge'
import { ColorPicker, gerarCorSugerida } from '@/components/shared/ColorPicker'
import {
  TransactionCategory,
  PaymentMethod,
  TransactionType,
  RuleCondition,
  RuleConditionField,
  RuleConditionOperator,
} from '@/types'
import { describeCondition, describeActions } from '@/lib/categorization'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Settings,
  Building2,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Bell,
  BellOff,
  Filter,
  ToggleLeft,
  ToggleRight,
  ChevronUp,
  GripVertical,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import dynamic from 'next/dynamic'

const PluggyConnect = dynamic(
  () => import('react-pluggy-connect').then((mod) => mod.PluggyConnect),
  { ssr: false }
)

// ─── Tipos locais do formulário ───────────────────────────────────────────────

interface RuleFormState {
  name: string
  conditionLogic: 'AND' | 'OR'
  conditions: RuleCondition[]
  setCategory: string
  setPaymentMethod: string
  setType: string
}

const EMPTY_FORM: RuleFormState = {
  name: '',
  conditionLogic: 'AND',
  conditions: [{ field: 'description', operator: 'contains', value: '' }],
  setCategory: '',
  setPaymentMethod: '',
  setType: '',
}

const FIELD_OPTIONS: { value: RuleConditionField; label: string }[] = [
  { value: 'description', label: 'Descrição' },
  { value: 'amount', label: 'Valor (R$)' },
  { value: 'paymentMethod', label: 'Forma de pagamento' },
]

const OPERATOR_OPTIONS: Record<RuleConditionField, { value: RuleConditionOperator; label: string }[]> = {
  description: [
    { value: 'contains', label: 'contém' },
    { value: 'equals', label: 'é igual a' },
    { value: 'startsWith', label: 'começa com' },
  ],
  amount: [
    { value: 'greaterThan', label: 'maior que' },
    { value: 'lessThan', label: 'menor que' },
    { value: 'equals', label: 'igual a' },
  ],
  paymentMethod: [
    { value: 'equals', label: 'é igual a' },
  ],
}

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'debit', label: 'Débito' },
  { value: 'pix', label: 'PIX' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'credit_card', label: 'Cartão de crédito' },
]

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ConfiguracoesPage() {
  const { user } = useAuth()
  const { allCategories, customCategories, customCategoryColors, addCategory, removeCategory, loading } = useCategories(user)
  const { itemId, syncing, lastSync, connectToken, showWidget, setShowWidget, openWidget, handleSuccess, syncTransactions } = usePluggy(user)
  const { permission, token, loading: notifLoading, requestPermission, disableNotifications } = useNotifications(user)
  const { rules, loading: rulesLoading, addRule, removeRule, toggleRule } = useRules(user)

  // Estado — categorias
  const [newCategory, setNewCategory] = useState('')
  const [newColor, setNewColor] = useState(gerarCorSugerida())
  const [saving, setSaving] = useState(false)

  // Estado — formulário de regras
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [ruleForm, setRuleForm] = useState<RuleFormState>(EMPTY_FORM)
  const [savingRule, setSavingRule] = useState(false)

  // ─── Handlers — categorias ──────────────────────────────────────────────────

  const handleAdd = async () => {
    if (!newCategory.trim()) {
      toast.error('Digite o nome da categoria')
      return
    }
    if (allCategories.map(c => c.toLowerCase()).includes(newCategory.trim().toLowerCase())) {
      toast.error('Essa categoria já existe')
      return
    }
    setSaving(true)
    try {
      await addCategory(newCategory.trim(), newColor)
      toast.success('Categoria criada!')
      setNewCategory('')
      setNewColor(gerarCorSugerida())
    } catch {
      toast.error('Erro ao criar categoria')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (category: string) => {
    try {
      await removeCategory(category)
      toast.success('Categoria removida')
    } catch {
      toast.error('Erro ao remover categoria')
    }
  }

  const handleSync = async () => {
    try {
      await syncTransactions()
      toast.success('Transações sincronizadas!')
    } catch {
      toast.error('Erro ao sincronizar transações')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
  }

  // ─── Handlers — formulário de regras ───────────────────────────────────────

  const handleConditionChange = (
    index: number,
    field: keyof RuleCondition,
    value: string
  ) => {
    setRuleForm((prev) => {
      const updated = [...prev.conditions]
      updated[index] = { ...updated[index], [field]: value }

      // Se mudou o campo, reseta o operador para o primeiro disponível do novo campo
      if (field === 'field') {
        const newField = value as RuleConditionField
        updated[index].operator = OPERATOR_OPTIONS[newField][0].value
        updated[index].value = ''
      }

      return { ...prev, conditions: updated }
    })
  }

  const addCondition = () => {
    setRuleForm((prev) => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        { field: 'description', operator: 'contains', value: '' },
      ],
    }))
  }

  const removeCondition = (index: number) => {
    setRuleForm((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }))
  }

  const handleSaveRule = async () => {
    // Validações
    if (!ruleForm.name.trim()) {
      toast.error('Dê um nome para a regra')
      return
    }
    if (ruleForm.conditions.some((c) => !c.value.trim())) {
      toast.error('Preencha o valor de todas as condições')
      return
    }
    if (!ruleForm.setCategory && !ruleForm.setPaymentMethod && !ruleForm.setType) {
      toast.error('Defina pelo menos uma ação para a regra')
      return
    }

    setSavingRule(true)
    try {
      await addRule({
        name: ruleForm.name.trim(),
        conditionLogic: ruleForm.conditionLogic,
        conditions: ruleForm.conditions,
        setCategory: ruleForm.setCategory || undefined,
        setPaymentMethod: (ruleForm.setPaymentMethod as PaymentMethod) || undefined,
        setType: (ruleForm.setType as TransactionType) || undefined,
        active: true,
      })
      toast.success('Regra criada!')
      setRuleForm(EMPTY_FORM)
      setShowRuleForm(false)
    } catch {
      toast.error('Erro ao criar regra')
    } finally {
      setSavingRule(false)
    }
  }

  const handleDeleteRule = async (id: string) => {
    try {
      await removeRule(id)
      toast.success('Regra removida')
    } catch {
      toast.error('Erro ao remover regra')
    }
  }

  const handleToggleRule = async (id: string) => {
    try {
      await toggleRule(id)
    } catch {
      toast.error('Erro ao atualizar regra')
    }
  }

  // ─── Renderização condicional — loading ─────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6" />
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground text-sm">Personalize o sistema</p>
        </div>
      </div>

      {/* ── Conexão Bancária ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Conexão Bancária
          </CardTitle>
          <CardDescription>
            Sincronize suas transações automaticamente via Open Finance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {itemId ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-emerald-500">
                <CheckCircle2 className="w-4 h-4" />
                <span>Conta bancária conectada</span>
              </div>
              {lastSync && (
                <p className="text-xs text-muted-foreground">
                  Última sincronização: {format(new Date(lastSync), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  disabled={syncing}
                >
                  {syncing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sincronizar agora
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openWidget}
                  className="text-muted-foreground"
                >
                  Reconectar banco
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Conecte sua conta bancária para importar transações automaticamente.
                Seus dados são transmitidos com segurança via Open Finance.
              </p>
              <Button onClick={openWidget} disabled={syncing}>
                <Building2 className="w-4 h-4 mr-2" />
                Conectar banco
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Widget do Pluggy */}
      {showWidget && connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox={true}
          onSuccess={handleSuccess}
          onClose={() => setShowWidget(false)}
          onError={(error: { message: string; data?: unknown }) => {
            console.error('Pluggy error:', error)
            toast.error('Erro ao conectar banco')
            setShowWidget(false)
          }}
        />
      )}

      {/* ── Notificações ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notificações Push
          </CardTitle>
          <CardDescription>
            Receba alertas sobre faturas, orçamentos e lembretes financeiros
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {permission === 'granted' && token ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-emerald-500">
                <CheckCircle2 className="w-4 h-4" />
                <span>Notificações ativadas</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>✅ Fatura de cartão vencendo (3 dias antes)</p>
                <p>✅ Orçamento próximo do limite (80%+)</p>
                <p>✅ Orçamento excedido</p>
                <p>✅ Relatório mensal do Julius (dia 1)</p>
                <p>✅ Lembrete de contas (dia 9)</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={disableNotifications}
                className="text-muted-foreground"
              >
                <BellOff className="w-4 h-4 mr-2" />
                Desativar notificações
              </Button>
            </div>
          ) : permission === 'denied' ? (
            <div className="space-y-2">
              <p className="text-sm text-red-500">
                Notificações bloqueadas pelo navegador.
              </p>
              <p className="text-xs text-muted-foreground">
                Para ativar, acesse as configurações do navegador e permita notificações para este site.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Ative para receber alertas sobre faturas, orçamentos excedidos e lembretes mensais.
              </p>
              <Button
                onClick={requestPermission}
                disabled={notifLoading}
                size="sm"
              >
                {notifLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Ativando...
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 mr-2" />
                    Ativar notificações
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Regras de Categorização ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Regras de Categorização
              </CardTitle>
              <CardDescription className="mt-1">
                Categorize transações importadas automaticamente com base em condições
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant={showRuleForm ? 'outline' : 'default'}
              onClick={() => {
                setShowRuleForm((v) => !v)
                setRuleForm(EMPTY_FORM)
              }}
            >
              {showRuleForm ? (
                <ChevronUp className="w-4 h-4 mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {showRuleForm ? 'Cancelar' : 'Nova regra'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* Formulário de nova regra */}
          {showRuleForm && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <p className="text-sm font-medium">Nova regra</p>

              {/* Nome */}
              <div className="space-y-1.5">
                <Label className="text-xs">Nome da regra</Label>
                <Input
                  placeholder="Ex: iFood → Alimentação"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>

              {/* Lógica entre condições */}
              {ruleForm.conditions.length > 1 && (
                <div className="flex items-center gap-3">
                  <Label className="text-xs text-muted-foreground">Lógica entre condições</Label>
                  <div className="flex gap-2">
                    {(['AND', 'OR'] as const).map((logic) => (
                      <button
                        key={logic}
                        onClick={() => setRuleForm((p) => ({ ...p, conditionLogic: logic }))}
                        className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                          ruleForm.conditionLogic === logic
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-accent border-input'
                        }`}
                      >
                        {logic === 'AND' ? 'Todas (AND)' : 'Qualquer (OR)'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Condições */}
              <div className="space-y-2">
                <Label className="text-xs">
                  {ruleForm.conditions.length === 1 ? 'Condição' : 'Condições'}
                </Label>
                {ruleForm.conditions.map((cond, i) => (
                  <div key={i} className="flex items-start gap-2">
                    {/* Campo */}
                    <Select
                      value={cond.field}
                      onValueChange={(v) => handleConditionChange(i, 'field', v)}
                    >
                      <SelectTrigger className="w-44 h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_OPTIONS.map((f) => (
                          <SelectItem key={f.value} value={f.value} className="text-xs">
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Operador */}
                    <Select
                      value={cond.operator}
                      onValueChange={(v) => handleConditionChange(i, 'operator', v)}
                    >
                      <SelectTrigger className="w-36 h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATOR_OPTIONS[cond.field].map((op) => (
                          <SelectItem key={op.value} value={op.value} className="text-xs">
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Valor — se field=paymentMethod mostra select, senão input */}
                    {cond.field === 'paymentMethod' ? (
                      <Select
                        value={cond.value}
                        onValueChange={(v) => handleConditionChange(i, 'value', v)}
                      >
                        <SelectTrigger className="flex-1 h-9 text-xs">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHOD_OPTIONS.map((pm) => (
                            <SelectItem key={pm.value} value={pm.value} className="text-xs">
                              {pm.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        className="flex-1 h-9 text-xs"
                        placeholder={cond.field === 'amount' ? 'Ex: 200' : 'Ex: iFood'}
                        value={cond.value}
                        onChange={(e) => handleConditionChange(i, 'value', e.target.value)}
                      />
                    )}

                    {/* Remover condição */}
                    {ruleForm.conditions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-9 h-9 text-muted-foreground hover:text-red-500 shrink-0"
                        onClick={() => removeCondition(i)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground h-8 px-2"
                  onClick={addCondition}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar condição
                </Button>
              </div>

              {/* Ações */}
              <div className="space-y-2">
                <Label className="text-xs">Ações (aplique uma ou mais)</Label>

                {/* Definir categoria */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-36 shrink-0">Definir categoria</span>
                  <Select
                    value={ruleForm.setCategory}
                    onValueChange={(v) => setRuleForm((p) => ({ ...p, setCategory: v === '__none__' ? '' : v }))}
                  >
                    <SelectTrigger className="flex-1 h-9 text-xs">
                      <SelectValue placeholder="Não alterar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__" className="text-xs text-muted-foreground">
                        Não alterar
                      </SelectItem>
                      {allCategories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-xs">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Definir forma de pagamento */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-36 shrink-0">Forma de pagamento</span>
                  <Select
                    value={ruleForm.setPaymentMethod}
                    onValueChange={(v) => setRuleForm((p) => ({ ...p, setPaymentMethod: v === '__none__' ? '' : v }))}
                  >
                    <SelectTrigger className="flex-1 h-9 text-xs">
                      <SelectValue placeholder="Não alterar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__" className="text-xs text-muted-foreground">
                        Não alterar
                      </SelectItem>
                      {PAYMENT_METHOD_OPTIONS.map((pm) => (
                        <SelectItem key={pm.value} value={pm.value} className="text-xs">
                          {pm.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Definir tipo */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-36 shrink-0">Tipo de transação</span>
                  <Select
                    value={ruleForm.setType}
                    onValueChange={(v) => setRuleForm((p) => ({ ...p, setType: v === '__none__' ? '' : v }))}
                  >
                    <SelectTrigger className="flex-1 h-9 text-xs">
                      <SelectValue placeholder="Não alterar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__" className="text-xs text-muted-foreground">
                        Não alterar
                      </SelectItem>
                      <SelectItem value="income" className="text-xs">Receita</SelectItem>
                      <SelectItem value="expense" className="text-xs">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Botão salvar */}
              <Button
                onClick={handleSaveRule}
                disabled={savingRule}
                className="w-full"
              >
                {savingRule ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar regra
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Lista de regras existentes */}
          {rulesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : rules.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhuma regra criada ainda. As regras são aplicadas durante a importação via Open Finance.
            </p>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    rule.active
                      ? 'bg-background hover:bg-accent/30'
                      : 'bg-muted/40 opacity-60'
                  }`}
                >
                  {/* Indicador de prioridade */}
                  <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{rule.name}</p>
                      {!rule.active && (
                        <Badge variant="outline" className="text-xs py-0 shrink-0">
                          Inativa
                        </Badge>
                      )}
                    </div>

                    {/* Condições */}
                    <div className="flex flex-wrap gap-1">
                      {rule.conditions.map((cond, i) => (
                        <span key={i} className="text-xs text-muted-foreground">
                          {i > 0 && (
                            <span className="font-medium text-foreground/50 mx-1">
                              {rule.conditionLogic}
                            </span>
                          )}
                          {describeCondition(cond)}
                        </span>
                      ))}
                    </div>

                    {/* Ações */}
                    <p className="text-xs text-muted-foreground">
                      → {describeActions(rule)}
                    </p>
                  </div>

                  {/* Controles */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-muted-foreground"
                      title={rule.active ? 'Desativar regra' : 'Ativar regra'}
                      onClick={() => handleToggleRule(rule.id)}
                    >
                      {rule.active
                        ? <ToggleRight className="w-4 h-4 text-emerald-500" />
                        : <ToggleLeft className="w-4 h-4" />
                      }
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-muted-foreground hover:text-red-500"
                      title="Remover regra"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground pt-1">
                {rules.filter(r => r.active).length} de {rules.length} regras ativas · aplicadas em ordem de prioridade
              </p>
            </div>
          )}

        </CardContent>
      </Card>

      {/* ── Categorias padrão ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categorias padrão</CardTitle>
          <CardDescription>
            Categorias fixas do sistema — não podem ser removidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_CATEGORIES.map((cat) => (
              <CategoryBadge key={cat} category={cat as TransactionCategory} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Categorias personalizadas ───────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categorias personalizadas</CardTitle>
          <CardDescription>
            Suas categorias aparecem em todos os formulários do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da categoria</Label>
              <Input
                placeholder="Ex: Pet, Viagem, Farmácia..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <ColorPicker
              value={newColor}
              onChange={setNewColor}
              label="Cor da categoria"
            />
            <Button onClick={handleAdd} disabled={saving} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              {saving ? 'Adicionando...' : 'Adicionar categoria'}
            </Button>
          </div>

          {customCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhuma categoria personalizada ainda
            </p>
          ) : (
            <div className="space-y-2">
              {customCategories.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <CategoryBadge
                    category={cat}
                    color={customCategoryColors[cat]}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-muted-foreground hover:text-red-500"
                    onClick={() => handleRemove(cat)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
