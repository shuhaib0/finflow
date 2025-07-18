
'use server'

import { runAgent } from '@/ai/flows/finance-agent'

export async function handleQuestion(query: string, userId: string): Promise<string> {
  if (!userId) {
    return 'Authentication error. Could not verify user.';
  }

  try {
    const result = await runAgent(query, userId);
    return result;
  } catch (error) {
    console.error('Error handling finance question:', error)
    return 'I had trouble processing that request. Please try again.'
  }
}

    