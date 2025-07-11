'use server';

/**
 * @fileOverview An AI-powered finance Q&A agent.
 *
 * - askFinanceQuestion - A function that handles financial questions.
 * - FinanceQAInput - The input type for the askFinanceQuestion function.
 * - FinanceQAOutput - The return type for the askFinanceQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinanceQAInputSchema = z.object({
  query: z.string().describe('The question about financial data.'),
  financialData: z.string().optional().describe('Relevant financial data in JSON format. Optional.'),
});

export type FinanceQAInput = z.infer<typeof FinanceQAInputSchema>;

const FinanceQAOutputSchema = z.object({
  answer: z.string().describe('The answer to the financial question.'),
});

export type FinanceQAOutput = z.infer<typeof FinanceQAOutputSchema>;

export async function askFinanceQuestion(input: FinanceQAInput): Promise<FinanceQAOutput> {
  return financeQAFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financeQAPrompt',
  input: {schema: FinanceQAInputSchema},
  output: {schema: FinanceQAOutputSchema},
  prompt: `You are a financial expert. Use the provided financial data to answer the following question. If the answer is not found in the financial data, respond that you cannot answer the question.

Question: {{{query}}}

Financial Data: {{{financialData}}}
`,
});

const financeQAFlow = ai.defineFlow(
  {
    name: 'financeQAFlow',
    inputSchema: FinanceQAInputSchema,
    outputSchema: FinanceQAOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
