
"use client"

import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import type { Client, Invoice } from "@/types";
import { format } from "date-fns";

type InvoiceTemplateProps = {
  invoice: (Omit<Invoice, 'clientRef'> & { client?: Client | null }) | null;
}

const getCurrencySymbol = (currencyCode: string) => {
    const symbols: { [key: string]: string } = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'INR': '₹'
    };
    return symbols[currencyCode] || '$';
}


export function InvoiceTemplate({ invoice }: InvoiceTemplateProps) {
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

  const currencySymbol = getCurrencySymbol(currency || 'USD');

  const calculateTotals = (invoice: InvoiceTemplateProps['invoice']) => {
    if (!invoice) return { subtotal: 0, totalDiscount: 0, totalTax: 0 };
    
    const subtotal = invoice.items.reduce((acc, item) => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        return acc + (quantity * unitPrice);
    }, 0);

    const discountPercent = Number(invoice.discount) || 0;
    const taxPercent = Number(invoice.tax) || 0;

    const totalDiscount = subtotal * (discountPercent / 100);
    const subtotalAfterDiscount = subtotal - totalDiscount;
    const totalTax = subtotalAfterDiscount * (taxPercent / 100);

    return { subtotal, totalDiscount, totalTax };
  }

  const { subtotal, totalDiscount, totalTax } = calculateTotals(invoice);

  const getStatusInfo = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return { variant: 'default', text: 'Paid', className: 'bg-green-600 text-white' };
      case 'sent':
        return { variant: 'secondary', text: 'Sent', className: 'bg-blue-500 text-white' };
      case 'overdue':
        return { variant: 'destructive', text: 'Overdue', className: 'bg-red-600 text-white' };
      case 'draft':
      default:
        return { variant: 'outline', text: 'Draft', className: 'bg-gray-500 text-white' };
    }
  };

  const statusInfo = getStatusInfo(status);

  return (
    <div className="bg-white text-gray-900 font-sans a4-container printable-area">
      <header className="flex justify-between items-start mb-10">
        <div>
          <Icons.logo className="h-10 w-10 text-gray-800" />
          <h1 className="text-xl font-bold font-headline mt-2">Ailutions Inc.</h1>
          <p className="text-xs text-gray-600">123 Innovation Drive, Tech City, 12345</p>
          <p className="text-xs text-gray-600">contact@ailutions.com</p>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold text-gray-800 uppercase font-headline">Invoice</h2>
          <p className="text-sm text-gray-600 mt-1"># {invoiceNumber || 'INV-XXXX'}</p>
          <div className="mt-4">
            <Badge variant={statusInfo.variant} className={`text-sm capitalize ${statusInfo.className}`}>{statusInfo.text}</Badge>
          </div>
        </div>
      </header>
      
      <section className="grid grid-cols-2 gap-4 mb-10">
        <div>
          <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2">Bill To</h3>
          <p className="font-bold">{client.name}</p>
          <p className="text-sm text-gray-600">{client.addressLine1}</p>
          {client.addressLine2 && <p className="text-sm text-gray-600">{client.addressLine2}</p>}
          <p className="text-sm text-gray-600">{`${client.city || ''} ${client.state || ''} ${client.postalCode || ''}`.trim()}</p>
          <p className="text-sm text-gray-600">{client.country}</p>
          <p className="text-sm text-gray-600">{client.email}</p>
        </div>
        <div className="text-right">
          <div className="mb-2">
            <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Invoice Date</p>
            <p className="text-sm font-medium">{format(new Date(date), "MMMM d, yyyy")}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Due Date</p>
            <p className="text-sm font-medium">{format(new Date(dueDate), "MMMM d, yyyy")}</p>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100 text-xs uppercase text-gray-600">
              <th className="p-3 font-semibold">Description</th>
              <th className="p-3 font-semibold text-center w-24">Qty</th>
              <th className="p-3 font-semibold text-right w-32">Unit Price</th>
              <th className="p-3 font-semibold text-right w-32">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const quantity = Number(item.quantity) || 0;
              const unitPrice = Number(item.unitPrice) || 0;
              const itemTotal = quantity * unitPrice;

              return (
              <tr key={index} className="border-b border-gray-100 text-sm">
                <td className="p-3">
                  {item.description}
                </td>
                <td className="p-3 text-center">{quantity}</td>
                <td className="p-3 text-right">{currencySymbol}{unitPrice.toFixed(2)}</td>
                <td className="p-3 text-right">{currencySymbol}{itemTotal.toFixed(2)}</td>
              </tr>
            )})}
          </tbody>
        </table>
      </section>

      <section className="flex justify-end mb-10">
        <div className="w-full max-w-xs text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{currencySymbol}{subtotal.toFixed(2)}</span>
          </div>
          {totalDiscount > 0 ? (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Discount ({discount}%)</span>
              <span className="font-medium">-{currencySymbol}{totalDiscount.toFixed(2)}</span>
            </div>
          ) : null}
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Tax ({tax}%)</span>
            <span className="font-medium">{currencySymbol}{totalTax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-3 bg-gray-100 px-3 mt-2 rounded-md">
            <span className="font-bold text-base">Total Amount</span>
            <span className="font-bold text-base">{currencySymbol}{(Number(totalAmount) || 0).toFixed(2)}</span>
          </div>
        </div>
      </section>
      
      {terms && (
        <section className="mb-10">
            <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2">Terms & Conditions</h3>
            <p className="text-xs text-gray-600">{terms}</p>
        </section>
      )}

      <footer className="text-center text-xs text-gray-500 pt-6 border-t border-gray-200 mt-auto">
        <p>Thank you for your business!</p>
        <p>Ailutions Inc. | (123) 456-7890 | www.ailutions.com</p>
      </footer>
    </div>
  )
}
