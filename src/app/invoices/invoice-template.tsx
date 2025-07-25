
"use client"

import { Icons } from "@/components/icons";
import { Badge, badgeVariants } from "@/components/ui/badge";
import type { Client, Invoice, Company } from "@/types";
import { format } from "date-fns";
import type { VariantProps } from "class-variance-authority";
import Image from "next/image";

type InvoiceTemplateProps = {
  invoice: (Omit<Invoice, 'clientRef'> & { client?: Client | null }) | null;
  company: Company | null;
}

const getCurrencySymbol = (currencyCode: string) => {
    const symbols: { [key: string]: string } = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'INR': '₹',
        'AED': 'د.إ',
        'CAD': '$'
    };
    return symbols[currencyCode] || '$';
}


export function InvoiceTemplate({ invoice, company }: InvoiceTemplateProps) {
  if (!invoice || !invoice.client) {
    return <div className="p-10 text-center text-muted-foreground a4-container flex items-center justify-center bg-white">No invoice data to display. Select a client and fill in the details.</div>;
  }

  const {
    invoiceNumber,
    client,
    date,
    dueDate,
    items,
    currency,
    totalAmount,
    status,
    terms,
    discount,
    tax,
  } = invoice;

  const currencyCode = currency || 'USD';
  const currencySymbol = getCurrencySymbol(currencyCode);

  const calculateTotals = (inv: InvoiceTemplateProps['invoice']) => {
    if (!inv) return { subtotal: 0, totalDiscount: 0, totalTax: 0 };
    
    const subtotal = inv.items.reduce((acc, item) => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        return acc + (quantity * unitPrice);
    }, 0);

    const discountPercent = Number(inv.discount) || 0;
    const taxPercent = Number(inv.tax) || 0;

    const totalDiscount = subtotal * (discountPercent / 100);
    const subtotalAfterDiscount = subtotal - totalDiscount;
    const totalTax = subtotalAfterDiscount * (taxPercent / 100);

    return { subtotal, totalDiscount, totalTax };
  }

  const { subtotal, totalDiscount, totalTax } = calculateTotals(invoice);

  const getStatusInfo = (status: Invoice['status']): { variant: VariantProps<typeof badgeVariants>['variant']; text: string; className: string } => {
    switch (status) {
      case 'paid':
        return { variant: 'default' as const, text: 'Paid', className: 'bg-green-600 text-white' };
      case 'sent':
        return { variant: 'secondary' as const, text: 'Sent', className: 'bg-blue-500 text-white' };
      case 'overdue':
        return { variant: 'destructive' as const, text: 'Overdue', className: 'bg-red-600 text-white' };
      case 'draft':
      default:
        return { variant: 'outline' as const, text: 'Draft', className: 'bg-gray-500 text-white' };
    }
  };

  const statusInfo = getStatusInfo(status);

  return (
    <div className="bg-white text-gray-900 font-sans a4-container flex flex-col">
      <header className="flex justify-between items-start mb-10 pb-6 border-b-2 border-primary">
        <div>
          {company?.logoUrl ? (
            <Image src={company.logoUrl} alt={`${company.name} logo`} width={128} height={48} className="h-12 w-auto object-contain"/>
          ) : (
            <Icons.logo className="h-12 w-12 text-primary" />
          )}
          <h1 className="text-2xl font-bold font-headline mt-4 text-primary">{company?.name || 'Your Company'}</h1>
          <p className="text-xs text-muted-foreground whitespace-pre-line">{company?.address || '123 Innovation Drive, Tech City, 12345'}</p>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-bold text-foreground uppercase font-headline">Invoice</h2>
          <p className="text-sm text-muted-foreground mt-2"># {invoiceNumber || 'INV-XXXX'}</p>
          <div className="mt-4 print:hidden">
            <Badge variant={statusInfo.variant} className={`text-sm capitalize ${statusInfo.className}`}>{statusInfo.text}</Badge>
          </div>
        </div>
      </header>
      
      <section className="grid grid-cols-2 gap-4 mb-10">
        <div>
          <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-2">Bill To</h3>
          <p className="font-bold text-lg text-primary">{client.name}</p>
          {client.addressLine1 && <p className="text-sm text-muted-foreground">{client.addressLine1}</p>}
          {client.addressLine2 && <p className="text-sm text-muted-foreground">{client.addressLine2}</p>}
          <p className="text-sm text-muted-foreground">{`${client.city || ''} ${client.state || ''} ${client.postalCode || ''}`.trim()}</p>
          {client.country && <p className="text-sm text-muted-foreground">{client.country}</p>}
          {client.email && <p className="text-sm text-muted-foreground mt-2">{client.email}</p>}
        </div>
        <div className="text-right space-y-4">
          <div>
            <p className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Invoice Date</p>
            <p className="text-md font-medium text-foreground">{format(new Date(date), "MMMM d, yyyy")}</p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Due Date</p>
            <p className="text-md font-medium text-foreground">{format(new Date(dueDate), "MMMM d, yyyy")}</p>
          </div>
        </div>
      </section>

      <section className="mb-10 flex-grow">
        <table className="w-full text-left">
          <thead className="bg-primary/10 text-primary">
            <tr className="text-sm uppercase">
              <th className="p-3 font-semibold tracking-wider">Description</th>
              <th className="p-3 font-semibold tracking-wider text-center w-24">Qty</th>
              <th className="p-3 font-semibold tracking-wider text-right w-32">Unit Price</th>
              <th className="p-3 font-semibold tracking-wider text-right w-32">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const quantity = Number(item.quantity) || 0;
              const unitPrice = Number(item.unitPrice) || 0;
              const itemTotal = quantity * unitPrice;

              return (
              <tr key={index} className="border-b border-gray-100 text-sm">
                <td className="p-3 font-medium">
                  {item.description}
                </td>
                <td className="p-3 text-center text-muted-foreground">{quantity}</td>
                <td className="p-3 text-right text-muted-foreground">{new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(unitPrice)}</td>
                <td className="p-3 text-right font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(itemTotal)}</td>
              </tr>
            )})}
          </tbody>
        </table>
      </section>

      <section className="flex justify-end mb-10">
        <div className="w-full max-w-sm text-md">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(subtotal)}</span>
          </div>
          {totalDiscount > 0 ? (
            <div className="flex justify-between py-2 border-b border-gray-100 text-muted-foreground">
              <span>Discount ({discount}%)</span>
              <span>-{new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(totalDiscount)}</span>
            </div>
          ) : null}
          <div className="flex justify-between py-2 border-b border-gray-100 text-muted-foreground">
            <span>Tax ({tax}%)</span>
            <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(totalTax)}</span>
          </div>
          <div className="flex justify-between py-4 bg-primary/10 px-4 mt-4 rounded-md text-primary">
            <span className="font-bold text-lg">Total Amount</span>
            <span className="font-bold text-lg">{new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(Number(totalAmount) || 0)}</span>
          </div>
        </div>
      </section>
      
      {terms && (
        <section className="mb-10">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-2">Terms & Conditions</h3>
            <p className="text-xs text-muted-foreground">{terms}</p>
        </section>
      )}

      <footer className="text-center text-xs text-muted-foreground pt-6 border-t mt-auto">
        <p>Thank you for your business!</p>
        <p>{company?.name} | {company?.contactEmail} | {company?.website}</p>
      </footer>
    </div>
  )
}
