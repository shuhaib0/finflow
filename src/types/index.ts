export type Client = {
    id: string;
    name: string;
    contactPerson: string;
    email: string;
    phone?: string;
    status: 'lead' | 'opportunity' | 'customer';
    address?: string;
    notes?: string;
};

export type InvoiceItem = {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
};

export type Invoice = {
    id: string;
    invoiceNumber: string;
    clientRef: string; // Refers to Client ID
    items: InvoiceItem[];
    tax: number;
    totalAmount: number;
    dueDate: string; // ISO string
    status: 'draft' | 'sent' | 'paid' | 'overdue';
    createdAt: string; // ISO string
};

export type Payment = {
    id: string;
    invoiceRef: string; // Refers to Invoice ID
    amountPaid: number;
    date: string; // ISO string
    paymentMethod: 'credit_card' | 'bank_transfer' | 'other';
    notes?: string;
};

export type Expense = {
    id: string;
    amount: number;
    category: string;
    date: string; // ISO string
    linkedClient?: string; // Refers to Client ID
    vendor?: string;
    notes?: string;
    receiptUrl?: string;
};

export type Income = {
    id: string;
    amount: number;
    source: string;
    clientRef?: string; // Refers to Client ID
    date: string; // ISO string
    notes?: string;
};

export type User = {
    uid: string;
    name: string;
    email: string;
    role: 'admin' | 'finance' | 'sales' | 'viewer';
};
