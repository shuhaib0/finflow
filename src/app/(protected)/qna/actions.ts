'use server'

import { askFinanceQuestion } from '@/ai/flows/finance-qa'

const mockFinancialData = {
  revenue: [
    { month: 'January', amount: 15000 },
    { month: 'February', amount: 18000 },
    { month: 'March', amount: 22000 },
    { month: 'April', amount: 19500 },
    { month: 'May', amount: 25000 },
    { month: 'June', amount: 28000 },
  ],
  expenses: [
    { month: 'January', category: 'Salaries', amount: 8000 },
    { month: 'June', category: 'Marketing', amount: 3500 },
    { month: 'June', category: 'Software', amount: 1200 },
  ],
  clients: [
    { name: 'Innovate Inc.', lifetimeValue: 55000, lastInvoiceDate: '2023-06-15' },
    { name: 'Solutions Co.', lifetimeValue: 72000, lastInvoiceDate: '2023-06-20' },
  ],
}

export async function handleQuestion(query: string): Promise<string> {
  try {
    const result = await askFinanceQuestion({
      query,
      financialData: JSON.stringify(mockFinancialData, null, 2),
    })
    return result.answer
  } catch (error) {
    console.error('Error handling finance question:', error)
    return 'I had trouble processing that request. Please try again.'
  }
}
