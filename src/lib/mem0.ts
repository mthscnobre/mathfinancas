import MemoryClient from 'mem0ai'

const client = new MemoryClient({ apiKey: process.env.MEM0_API_KEY! })
const USER_ID = 'matheus-mathfinancas'

type MemoryMessage = Parameters<typeof client.add>[0][number]

export async function addMemory(messages: { role: 'user' | 'assistant'; content: string }[]) {
  try {
    await client.add(messages as MemoryMessage[], { user_id: USER_ID })
  } catch (err) {
    console.error('Mem0 addMemory error:', err)
  }
}

export async function searchMemories(query: string): Promise<string> {
  try {
    const response = await client.search(query, {
      user_id: USER_ID,
      limit: 10,
    } as Parameters<typeof client.search>[1])

    const results = Array.isArray(response)
      ? response
      : (response as { results: { memory: string }[] }).results

    if (!results || results.length === 0) return ''

    const memories = results
      .map((m: { memory: string }) => `- ${m.memory}`)
      .join('\n')

    return `\nMEMÓRIAS RELEVANTES SOBRE O USUÁRIO:\n${memories}\n`
  } catch (err) {
    console.error('Mem0 searchMemories error:', err)
    return ''
  }
}