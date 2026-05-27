'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCategories, DEFAULT_CATEGORIES } from '@/hooks/useCategories'
import { usePluggy } from '@/hooks/usePluggy'
import { CategoryBadge } from '@/components/shared/CategoryBadge'
import { ColorPicker, gerarCorSugerida } from '@/components/shared/ColorPicker'
import { TransactionCategory } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Plus, Trash2, Settings, Building2, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import dynamic from 'next/dynamic'

const PluggyConnect = dynamic(
  () => import('react-pluggy-connect').then((mod) => mod.PluggyConnect),
  { ssr: false }
)

export default function ConfiguracoesPage() {
  const { user } = useAuth()
  const { allCategories, customCategories, customCategoryColors, addCategory, removeCategory, loading } = useCategories(user)
  const { itemId, syncing, lastSync, connectToken, showWidget, setShowWidget, openWidget, handleSuccess, syncTransactions } = usePluggy(user)

  const [newCategory, setNewCategory] = useState('')
  const [newColor, setNewColor] = useState(gerarCorSugerida())
  const [saving, setSaving] = useState(false)

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

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6" />
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground text-sm">Personalize o sistema</p>
        </div>
      </div>

      {/* Open Finance */}
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
          onSuccess={handleSuccess}
          onClose={() => setShowWidget(false)}
          onError={(error: { message: string; data?: unknown }) => {
  console.error('Pluggy error:', error)
  toast.error('Erro ao conectar banco')
  setShowWidget(false)
}}
        />
      )}

      {/* Categorias padrão */}
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

      {/* Categorias customizadas */}
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