import { addMemory } from './mem0'

const MATHEUS_PROFILE = [
  {
    role: 'user' as const,
    content: `Meu perfil financeiro e pessoal:
    
- Me chamo Matheus, tenho 35 anos, moro em Brasília/DF
- Sou contratado como PJ (MEI em transição para ME), trabalho como Gerente de Tecnologia
- Tenho TDAH — prefiro respostas diretas, objetivas e com ações concretas
- Minha maior dificuldade financeira é organização e consistência nos registros
- Tenho histórico de começar sistemas de controle financeiro e abandonar
- Gosto de tecnologia, ciência, café especial, guitarra, rock e Flamengo
- Minha renda é relativamente previsível mas tenho despesas PJ e PF separadas
- Objetivo principal: organizar finanças pessoais e construir reserva de emergência
- Uso cartão de crédito com frequência — preciso controlar faturas
- Prefiro análises práticas com números reais, não conselhos genéricos`,
  },
  {
    role: 'assistant' as const,
    content: 'Entendido. Vou sempre considerar seu perfil, suas dificuldades com TDAH e seus objetivos financeiros em todas as análises.',
  },
]

let profileLoaded = false

export async function ensureProfileLoaded() {
  if (profileLoaded) return
  profileLoaded = true

  try {
    await addMemory(MATHEUS_PROFILE)
    console.log('Perfil do Matheus carregado no Mem0')
  } catch (err) {
    console.error('Erro ao carregar perfil:', err)
  }
}