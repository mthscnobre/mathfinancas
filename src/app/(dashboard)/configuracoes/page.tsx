'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCategories, DEFAULT_CATEGORIES } from '@/hooks/useCategories'
import { CategoryBadge } from '@/components/shared/CategoryBadge'
import { TransactionCategory } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Trash2, Settings } from 'lucide-react'

export default function ConfiguracoesPage() {
  const { user } = useAuth()
  const { allCategories, customCategories, addCategory, removeCategory, loading } = useCategories(user)
  const [newCategory, setNewCategory] = useState('')
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
      await addCategory(newCategory.trim())
      toast.success('Categoria criada!')
      setNewCategory('')
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
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Label>Nova categoria</Label>
              <Input
                placeholder="Ex: Pet, Viagem, Farmácia..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAdd} disabled={saving}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
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
                  <Badge variant="outline" className="text-sm">
                    {cat}
                  </Badge>
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