
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

// Tool to add a new transaction (income or expense)
const addTransactionTool = ai.defineTool(
  {
    name: 'addTransaction',
    description:
      'Add a new transaction, either an income or an expense. For income, source is required. For expenses, infer a category if possible; otherwise, it will default to "other".',
    inputSchema: z.object({
        userId: z.string().describe("The ID of the user performing the action."),
        type: z.enum(['income', 'expense']),
        amount: z.number(),
        date: z.string().optional().describe('The date of the transaction in YYYY-MM-DD format. Defaults to today if not specified.'),
        description: z.string().optional().describe('A detailed description of the transaction, e.g., "Software subscription" or "Client payment".'),
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
            userId: input.userId,
            type: input.type,
            amount: input.amount,
            date: input.date ? new Date(input.date).toISOString() : new Date().toISOString(),
        };

        if (input.type === 'income') {
            if (!input.source) return 'Error: Source is required for income transactions.';
            transactionData.source = input.source;
            transactionData.description = input.description || input.source;
        } else { // expense
            transactionData.category = input.category || 'other';
            transactionData.vendor = input.vendor || 'Unspecified Vendor';
            transactionData.description = input.description || 'Unspecified Expense';
        }

        await addTransaction(transactionData);

        return `Successfully added ${input.type} of ${input.amount} ${input.currency} for "${transactionData.description}".`;
    } catch (e: any) {
        console.error('addTransactionTool error:', e);
        return `Error: ${e.message || "Transaction failed unexpectedly."}`;
    }
  }
);


// Tool to create a new client
const addClientTool = ai.defineTool(
  {
    name: 'addClient',
    description: 'Create a new client in the system.',
    inputSchema: z.object({
      userId: z.string().describe("The ID of the user performing the action."),
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
      const { userId, ...clientData } = input;
      await addClient({
        ...clientData,
        userId: userId,
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
        userId: z.string().describe("The ID of the user performing the action."),
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
        const client = await findClientByName(input.userId, input.clientName);
        if (!client) {
          return `Error: Client with name '${input.clientName}' not found. Please create the client first.`;
        }
  
        const itemsWithTotal = input.items.map(item => ({
            ...item,
            total: item.quantity * item.unitPrice,
        }));

        const totalAmount = itemsWithTotal.reduce((acc, item) => acc + item.total, 0);
        const invoiceCount = await getInvoiceCount(input.userId);

        const newInvoice = {
            userId: input.userId,
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
      userId: z.string().describe("The ID of the user performing the action."),
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
      const client = await findClientByName(input.userId, input.clientName);
      if (!client) {
        return `Error: Client with name '${input.clientName}' not found. Please create the client first.`;
      }

      const itemsWithTotal = input.items.map(item => ({
          ...item,
          total: item.quantity * item.unitPrice,
      }));

      const totalAmount = itemsWithTotal.reduce((acc, item) => acc + item.total, 0);
      const quotationCount = await getQuotationCount(input.userId);
      
      const newQuotation = {
          userId: input.userId,
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
        description: 'Returns a string summary of all clients, including their name and status. Use this to answer questions about how many clients there are, or to list them.',
        inputSchema: z.object({
            userId: z.string().describe("The ID of the user performing the action."),
        }),
        outputSchema: z.string(),
    },
    async ({ userId }) => {
        try {
            const clients = await getClients(userId);
            if (clients.length === 0) {
                return "There are no clients in the system.";
            }
            const clientSummaries = clients.map(c => `Client Name: ${c.name}, Status: ${c.status}`);
            return `Total clients: ${clients.length}. Details: ${clientSummaries.join('; ')}`;
        } catch (e: any) {
            return `Error: ${e.message}`;
        }
    }
);

// Tool to get a list of invoices with filtering
const listInvoicesTool = ai.defineTool({
  name: 'listInvoices',
  description: 'Get a list of all invoices, optionally filtering by status.',
  inputSchema: z.object({
    userId: z.string().describe("The ID of the user performing the action."),
    status: z.enum(['draft', 'sent', 'paid', 'overdue']).optional().describe('Filter invoices by status.'),
  }),
  outputSchema: z.any(),
}, async ({ userId, status }) => {
  let invoices = await getInvoices(userId);
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
    userId: z.string().describe("The ID of the user performing the action."),
    status: z.enum(['draft', 'sent', 'won', 'lost']).optional().describe('Filter quotations by status.'),
  }),
  outputSchema: z.any(),
}, async ({ userId, status }) => {
  let quotations = await getQuotations(userId);
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
    userId: z.string().describe("The ID of the user performing the action."),
    invoiceNumber: z.string().describe('The number of the invoice to update.'),
    status: z.enum(['draft', 'sent', 'paid', 'overdue']).describe('The new status for the invoice.'),
  }),
  outputSchema: z.string(),
}, async ({ userId, invoiceNumber, status }) => {
  try {
    const invoices = await getInvoices(userId);
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
    userId: z.string().describe("The ID of the user performing the action."),
    quotationNumber: z.string().describe('The number of the quotation to update.'),
    status: z.enum(['draft', 'sent', 'won', 'lost']).describe('The new status for the quotation.'),
  }),
  outputSchema: z.string(),
}, async ({ userId, quotationNumber, status }) => {
  try {
    const quotations = await getQuotations(userId);
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
        inputSchema: z.object({
            userId: z.string().describe("The ID of the user performing the action."),
        }),
        outputSchema: z.any()
    },
    async ({ userId }) => {
        const [invoices, transactions] = await Promise.all([
            getInvoices(userId),
            getTransactions(userId)
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
    system: `You are an AI financial assistant for a company named Ailutions.
You are fully authorized and equipped to perform actions using the provided tools.
Your primary function is to execute tasks such as adding, creating, updating, or listing financial data like clients, transactions, invoices, and quotations.
You MUST pass the userId provided in the prompt to every tool you call.

- When a user's request directly maps to a tool's capability, you MUST use the tool.
- Do not ask for permission. You are expected to take action.
- If a request is ambiguous (e.g., adding an expense without an amount), you MUST ask clarifying questions.
- After successfully performing an action, you MUST confirm what you have done.
- For general questions or conversations that do not fit any tool, respond naturally.
- If you are asked to do something completely unrelated to finance or the company's data, politely decline.`,
    prompt: `User question: {{prompt}}
User ID: {{userId}}`,
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

export async function runAgent(prompt: string, userId: string): Promise<string> {
  try {
    const response = await agent({ prompt, userId });

    console.log('AI agent response:', response);

    if (!response || typeof response.text !== 'string') {
      return "⚠️ The AI agent could not generate a proper response. Please check the tool output.";
    }

    return response.text;
  } catch (error: any) {
    console.error("runAgent error:", error);
    return `❌ Internal error: ${error.message || "unknown error"}`;
  }
}
