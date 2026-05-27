'use client'

import { useState } from 'react'
import { Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const PALETA = [
  // Vermelhos e rosas
  '#E53935', '#D81B60', '#EC407A', '#F06292', '#C62828',
  // Roxos e violetas
  '#8E24AA', '#6A1B9A', '#AB47BC', '#7B1FA2', '#9C27B0',
  // Azuis
  '#1E88E5', '#0D47A1', '#1565C0', '#42A5F5', '#0288D1',
  // Ciano e teal
  '#00ACC1', '#00838F', '#26C6DA', '#00796B', '#009688',
  // Verdes
  '#43A047', '#2E7D32', '#66BB6A', '#1B5E20', '#388E3C',
  // Amarelos e âmbar
  '#F9A825', '#F57F17', '#FDD835', '#FF8F00', '#FFB300',
  // Laranjas
  '#FB8C00', '#E65100', '#FF7043', '#F4511E', '#BF360C',
  // Marrons
  '#6D4C41', '#4E342E', '#8D6E63', '#5D4037', '#3E2723',
  // Cinzas azulados
  '#546E7A', '#37474F', '#78909C', '#455A64', '#263238',
  // Indigo e azul profundo
  '#3949AB', '#283593', '#5C6BC0', '#1A237E', '#3F51B5',
]

export function gerarCorSugerida(): string {
  return PALETA[Math.floor(Math.random() * PALETA.length)]
}

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
  disabled?: boolean
}

export function ColorPicker({
  value,
  onChange,
  label = 'Cor',
  disabled = false,
}: ColorPickerProps) {
  const [textValue, setTextValue] = useState(value)

  const handleTextChange = (input: string) => {
    setTextValue(input)
    if (/^#[0-9A-Fa-f]{6}$/.test(input)) {
      onChange(input)
    }
  }

  const handlePickerChange = (input: string) => {
    setTextValue(input.toUpperCase())
    onChange(input.toUpperCase())
  }

  const handleSugerir = () => {
    const novaCor = gerarCorSugerida()
    setTextValue(novaCor)
    onChange(novaCor)
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => handlePickerChange(e.target.value)}
          disabled={disabled}
          className="h-10 w-14 cursor-pointer rounded-md border bg-transparent p-1 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Seletor de cor"
        />
        <Input
          value={textValue}
          onChange={(e) => handleTextChange(e.target.value.toUpperCase())}
          placeholder="#008F95"
          maxLength={7}
          disabled={disabled}
          className="font-mono"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleSugerir}
          disabled={disabled}
          title="Sugerir cor aleatória"
        >
          <Shuffle className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground font-mono">
        Use o seletor, digite o hex ou clique em sugerir
      </p>
    </div>
  )
}