
'use server';

/**
 * @fileOverview A powerful AI agent for financial Q&A and actions.
 * This agent uses tools to interact with the application's services.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  addClient,
  findClientByName,
  getClients,
} from '@/services/clientService';
import { addTransaction, getTransactions } from '@/services/transactionService';
import { addInvoice, getInvoices, getInvoiceCount, updateInvoice } from '@/services/invoiceService';
import { addQuotation, getQuotations, getQuotationCount, updateQuotation } from '@/services/quotationService';
import type { InvoiceItem } from '@/types';

// Tool to add a new transaction (income or expense)
const addTransactionTool = ai.defineTool(
  {
    name: 'addTransaction',
    description:
      'Add a new transaction, either an income or an expense. For expenses, category is required. For income, source is required.',
    inputSchema: z.object({
        type: z.enum(['income', 'expense']),
        amount: z.number(),
        date: z.string().describe('The date of the transaction in YYYY-MM-DD format. Defaults to today if not specified.'),
        description: z.string().describe('A detailed description of the transaction, e.g., "Software subscription" or "Client payment".'),
        category: z.string().optional().describe('Category of the expense (e.g., "software", "marketing", "travel", "office").'),
        vendor: z.string().optional().describe('Vendor for the expense (e.g., "Google", "Microsoft", "Figma").'),
        source: z.string().optional().describe('Source of the income (e.g., "Invoice Payment", "Sale").'),
        currency: z.enum(['USD', 'EUR', 'GBP', 'INR', 'AED', 'CAD']).default('USD'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    try {
        const transactionData: any = {
            type: input.type,
            amount: input.amount,
            date: input.date ? new Date(input.date).toISOString() : new Date().toISOString(),
            description: input.description,
        };

        if (input.type === 'income') {
            if (!input.source) return 'Error: Source is required for income transactions.';
            transactionData.source = input.source;
        } else { // expense
            if (!input.category) {
                // If category is missing, default to 'other'
                transactionData.category = 'other';
            } else {
                transactionData.category = input.category;
            }
            // Use the vendor if provided, otherwise it can be null
            transactionData.vendor = input.vendor;
        }

        await addTransaction(transactionData);

        return `Successfully added ${input.type} of ${input.amount} ${input.currency} for "${input.description}".`;
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
  }
);


// Tool to create a new client
const addClientTool = ai.defineTool(
  {
    name: 'addClient',
    description: 'Create a new client in the system.',
    inputSchema: z.object({
      name: z.string().describe("The client's company name."),
      contactPerson: z.string().describe('The main contact person.'),
      email: z.string().email().describe('The email of the client.'),
      phone: z.string().optional().describe('The phone number of the client.'),
      taxId: z.string().optional().describe("The client's tax ID."),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      await addClient({
        ...input,
        status: 'lead',
      });
      return `Client '${input.name}' created successfully.`;
    } catch (e: any) {
      return `Error: ${e.message}`;
    }
  }
);

// Tool to create a new invoice
const createInvoiceTool = ai.defineTool(
    {
      name: 'createInvoice',
      description: 'Create a new invoice for a client.',
      inputSchema: z.object({
        clientName: z.string().describe("The name of the client to invoice."),
        items: z.array(z.object({
            description: z.string(),
            quantity: z.number(),
            unitPrice: z.number(),
        })).describe("An array of items for the invoice."),
        dueDate: z.string().describe("The due date for the invoice in YYYY-MM-DD format."),
        currency: z.enum(['USD', 'EUR', 'GBP', 'INR', 'AED', 'CAD']).default('USD'),
      }),
      outputSchema: z.string(),
    },
    async (input) => {
      try {
        const client = await findClientByName(input.clientName);
        if (!client) {
          return `Error: Client with name '${input.clientName}' not found. Please create the client first.`;
        }
  
        const itemsWithTotal = input.items.map(item => ({
            ...item,
            total: item.quantity * item.unitPrice,
        }));

        const totalAmount = itemsWithTotal.reduce((acc, item) => acc + item.total, 0);
        const invoiceCount = await getInvoiceCount();

        const newInvoice = {
            clientRef: client.id,
            items: itemsWithTotal,
            totalAmount,
            date: new Date().toISOString(),
            dueDate: new Date(input.dueDate).toISOString(),
            status: 'draft' as const,
            invoiceNumber: `INV-${String(invoiceCount + 1).padStart(3, '0')}`,
            createdAt: new Date().toISOString(),
            currency: input.currency,
        };
  
        await addInvoice(newInvoice);
        return `Invoice ${newInvoice.invoiceNumber} created successfully for ${client.name}.`;
      } catch (e: any) {
        return `Error: ${e.message}`;
      }
    }
);

// Tool to create a new quotation
const createQuotationTool = ai.defineTool(
  {
    name: 'createQuotation',
    description: 'Create a new quotation or proposal for a client.',
    inputSchema: z.object({
      clientName: z.string().describe("The name of the client for the quotation."),
      items: z.array(z.object({
          description: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
      })).describe("An array of items for the quotation."),
      dueDate: z.string().describe("The expiry date for the quotation in YYYY-MM-DD format."),
      currency: z.enum(['USD', 'EUR', 'GBP', 'INR', 'AED', 'CAD']).default('USD'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      const client = await findClientByName(input.clientName);
      if (!client) {
        return `Error: Client with name '${input.clientName}' not found. Please create the client first.`;
      }

      const itemsWithTotal = input.items.map(item => ({
          ...item,
          total: item.quantity * item.unitPrice,
      }));

      const totalAmount = itemsWithTotal.reduce((acc, item) => acc + item.total, 0);
      const quotationCount = await getQuotationCount();
      
      const newQuotation = {
          clientRef: client.id,
          items: itemsWithTotal,
          totalAmount,
          date: new Date().toISOString(),
          dueDate: new Date(input.dueDate).toISOString(),
          status: 'draft' as const,
          quotationNumber: `QUO-${String(quotationCount + 1).padStart(3, '0')}`,
          createdAt: new Date().toISOString(),
          currency: input.currency,
      };

      await addQuotation(newQuotation);
      return `Quotation ${newQuotation.quotationNumber} created successfully for ${client.name}.`;
    } catch (e: any) {
      return `Error: ${e.message}`;
    }
  }
);

// Tool to get a list of all clients
const listClientsTool = ai.defineTool(
    {
        name: 'listClients',
        description: 'Get a list of all clients, including their name, status, and opportunity worth.',
        inputSchema: z.object({}),
        outputSchema: z.array(z.object({
            name: z.string(),
            status: z.string(),
            opportunityWorth: z.number().optional(),
        }))
    },
    async () => {
        const clients = await getClients();
        return clients.map(c => ({ name: c.name, status: c.status, opportunityWorth: c.opportunityWorth }));
    }
);

// Tool to get a list of invoices with filtering
const listInvoicesTool = ai.defineTool({
  name: 'listInvoices',
  description: 'Get a list of all invoices, optionally filtering by status.',
  inputSchema: z.object({
    status: z.enum(['draft', 'sent', 'paid', 'overdue']).optional().describe('Filter invoices by status.'),
  }),
  outputSchema: z.any(),
}, async ({ status }) => {
  let invoices = await getInvoices();
  if (status) {
    invoices = invoices.filter(inv => inv.status === status);
  }
  return invoices.map(inv => ({
    invoiceNumber: inv.invoiceNumber,
    clientRef: inv.clientRef,
    totalAmount: inv.totalAmount,
    status: inv.status,
    dueDate: inv.dueDate,
  }));
});

// Tool to get a list of quotations with filtering
const listQuotationsTool = ai.defineTool({
  name: 'listQuotations',
  description: 'Get a list of all quotations, optionally filtering by status.',
  inputSchema: z.object({
    status: z.enum(['draft', 'sent', 'won', 'lost']).optional().describe('Filter quotations by status.'),
  }),
  outputSchema: z.any(),
}, async ({ status }) => {
  let quotations = await getQuotations();
  if (status) {
    quotations = quotations.filter(q => q.status === status);
  }
  return quotations.map(q => ({
    quotationNumber: q.quotationNumber,
    clientRef: q.clientRef,
    totalAmount: q.totalAmount,
    status: q.status,
    dueDate: q.dueDate,
  }));
});

// Tool to update invoice status
const updateInvoiceStatusTool = ai.defineTool({
  name: 'updateInvoiceStatus',
  description: 'Update the status of a specific invoice.',
  inputSchema: z.object({
    invoiceNumber: z.string().describe('The number of the invoice to update.'),
    status: z.enum(['draft', 'sent', 'paid', 'overdue']).describe('The new status for the invoice.'),
  }),
  outputSchema: z.string(),
}, async ({ invoiceNumber, status }) => {
  try {
    const invoices = await getInvoices();
    const invoice = invoices.find(inv => inv.invoiceNumber === invoiceNumber);
    if (!invoice) {
      return `Error: Invoice with number '${invoiceNumber}' not found.`;
    }
    await updateInvoice(invoice.id, { status });
    return `Status of invoice ${invoiceNumber} updated to ${status}.`;
  } catch (e: any) {
    return `Error: ${e.message}`;
  }
});

// Tool to update quotation status
const updateQuotationStatusTool = ai.defineTool({
  name: 'updateQuotationStatus',
  description: 'Update the status of a specific quotation.',
  inputSchema: z.object({
    quotationNumber: z.string().describe('The number of the quotation to update.'),
    status: z.enum(['draft', 'sent', 'won', 'lost']).describe('The new status for the quotation.'),
  }),
  outputSchema: z.string(),
}, async ({ quotationNumber, status }) => {
  try {
    const quotations = await getQuotations();
    const quotation = quotations.find(q => q.quotationNumber === quotationNumber);
    if (!quotation) {
      return `Error: Quotation with number '${quotationNumber}' not found.`;
    }
    await updateQuotation(quotation.id, { status });
    return `Status of quotation ${quotationNumber} updated to ${status}.`;
  } catch (e: any) {
    return `Error: ${e.message}`;
  }
});


// Tool to get a financial summary
const getFinancialSummaryTool = ai.defineTool(
    {
        name: 'getFinancialSummary',
        description: 'Get a summary of all financial data, including invoices and transactions, to answer questions about revenue, expenses, and profitability.',
        inputSchema: z.object({}),
        outputSchema: z.any()
    },
    async () => {
        const [invoices, transactions] = await Promise.all([
            getInvoices(),
            getTransactions()
        ]);

        const paidInvoices = invoices.filter(inv => inv.status === 'paid');
        const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            totalRevenue,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses,
            totalInvoices: invoices.length,
            paidInvoices: paidInvoices.length,
            unpaidInvoices: invoices.length - paidInvoices.length,
            totalTransactions: transactions.length,
        };
    }
);


const agent = ai.definePrompt({
    name: 'financeAgent',
    system: `You are a powerful financial assistant for the company Ailutions.
    - Your goal is to help users by answering questions and performing actions related to their financial data.
    - When a user asks you to perform an action (like creating, adding, or updating something), you MUST use the provided tools.
    - When a user asks a question, first see if you can answer it using the available tools to get the most accurate, up-to-date information. If a tool can answer the question, use it.
    - If you cannot fulfill a request with the available tools, or if the question is conversational, answer naturally.
    - If you are asked to do something that is not related to the company's financial data, you must politely decline and state that you can only help with financial tasks.
    - When creating entities like invoices or clients, confirm the action and its result (e.g., "Invoice INV-001 has been created for Client X.").
    - When asked to add an expense, if a category is not provided, default the category to 'other'.
    - Do not answer any questions that are not related to the company's financial data.`,
    prompt: `User question: {{prompt}}`,
    tools: [
      addTransactionTool, 
      addClientTool, 
      createInvoiceTool, 
      listClientsTool, 
      getFinancialSummaryTool,
      createQuotationTool,
      listInvoicesTool,
      listQuotationsTool,
      updateInvoiceStatusTool,
      updateQuotationStatusTool,
    ],
});

export async function runAgent(prompt: string): Promise<string> {
    const response = await agent.generate({
        prompt,
    });
    return response.text;
}

