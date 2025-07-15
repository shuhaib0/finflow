

export type Note = {
    content: string;
    author: string;
    createdAt: string; // ISO string
};

export type Client = {
    id: string;
    name: string;
    contactPerson: string;
    email?: string;
    phone?: string;
    status: 'lead' | 'opportunity' | 'customer';
    opportunityWorth?: number;
    // General Info
    jobTitle?: string;
    salutation?: string;
    gender?: string;
    leadType?: string;
    requestType?: string;
    requestTypeOther?: string;
    mobile?: string;
    website?: string;
    whatsapp?: string;
    phoneExt?: string;
    taxId?: string;
    // Address Info
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    // Analytics Info
    source?: string;
    campaign?: string;
    notes?: Note[];
};

export type InvoiceItem = {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
};

export type Address = {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
};

export type SalesDocument = {
    id: string;
    clientRef: string;
    companyTaxId?: string;
    date: string; // ISO string
    items: InvoiceItem[];
    currency?: 'USD' | 'EUR' | 'GBP' | 'INR' | 'AED' | 'CAD';
    totalAmount: number;
    tax?: number; // Overall tax percentage
    discount?: number; // Overall discount percentage
    billingAddress?: Address;
    terms?: string;
    purchaseOrderNumber?: string;
    createdAt: string; // ISO string
}

export type Quotation = SalesDocument & {
    quotationNumber: string;
    dueDate: string; // Expiry Date
    status: 'draft' | 'sent' | 'won' | 'lost';
};

export type Invoice = SalesDocument & {
    invoiceNumber: string;
    dueDate: string; // Due Date
    status: 'draft' | 'sent' | 'paid' | 'overdue';
    quotationRef?: string; // Optional reference to the original quotation
};


export type Payment = {
    id:string;
    invoiceRef: string; // Refers to Invoice ID
    amountPaid: number;
    date: string; // ISO string
    paymentMethod: 'credit_card' | 'bank_transfer' | 'other';
    notes?: string;
};

export type Expense = {
    id: string;
    type: 'expense';
    amount: number;
    category: string;
    date: string; // ISO string
    description?: string;
    clientRef?: string; // Refers to Client ID
    vendor?: string;
    notes?: string;
    receiptUrl?: string;
};

export type Income = {
    id: string;
    type: 'income';
    amount: number;
    source: string;
    description?: string;
    clientRef?: string; // Refers to Client ID
    date: string; // ISO string
    notes?: string;
};

export type Transaction = Income | Expense;

export type User = {
    uid: string;
    name: string;
    email: string;
    role: 'admin' | 'finance' | 'sales' | 'viewer';
};
