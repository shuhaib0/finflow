'use server'

import { runAgent } from '@/ai/flows/finance-agent'

export async function handleQuestion(query: string): Promise<string> {
  try {
    const result = await runAgent(query);
    return result;
  } catch (error) {
    console.error('Error handling finance question:', error)
    return 'I had trouble processing that request. Please try again.'
  }
}
