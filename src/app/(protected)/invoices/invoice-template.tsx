
"use client"

import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Client, Invoice } from "@/types";
import { format } from "date-fns";

type InvoiceTemplateProps = {
  invoice: (Omit<Invoice, 'clientRef'> & { client?: Client | null }) | null;
}

export function InvoiceTemplate({ invoice }: InvoiceTemplateProps) {
  if (!invoice || !invoice.client) {
    return <div className="p-10 text-center">No invoice data to display.</div>;
  }

  const {
    invoiceNumber,
    client,
    date,
    dueDate,
    items,
    tax,
    discount,
    totalAmount,
    status,
    terms
  } = invoice;

  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const taxAmount = (subtotal - (discount || 0)) * (tax / 100);

  return (
    <div className="bg-white text-gray-900 p-8 font-sans">
      <header className="flex justify-between items-start mb-8">
        <div>
          <Icons.logo className="h-12 w-12 text-gray-800" />
          <h1 className="text-2xl font-bold font-headline mt-2">Ailutions Inc.</h1>
          <p className="text-sm">123 Innovation Drive, Tech City, 12345</p>
          <p className="text-sm">contact@ailutions.com</p>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-bold text-gray-800 uppercase font-headline">Invoice</h2>
          <p className="text-lg mt-2"># {invoiceNumber}</p>
          <div className="mt-2">
            <Badge variant={status === 'paid' ? 'default' : 'destructive'} className="text-sm capitalize">{status}</Badge>
          </div>
        </div>
      </header>
      
      <section className="flex justify-between mb-8">
        <div>
          <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Bill To</h3>
          <p className="font-bold text-lg">{client.name}</p>
          {client.addressLine1 && <p>{client.addressLine1}</p>}
          {client.addressLine2 && <p>{client.addressLine2}</p>}
          {(client.city || client.state || client.postalCode) && <p>{`${client.city || ''} ${client.state || ''} ${client.postalCode || ''}`.trim()}</p>}
          {client.country && <p>{client.country}</p>}
          <p>{client.email}</p>
        </div>
        <div className="text-right">
          <div className="mb-2">
            <p className="text-sm font-semibold uppercase text-gray-500">Invoice Date</p>
            <p>{format(new Date(date), "MMMM d, yyyy")}</p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase text-gray-500">Due Date</p>
            <p>{format(new Date(dueDate), "MMMM d, yyyy")}</p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100 text-sm uppercase">
              <th className="p-3 font-semibold">Description</th>
              <th className="p-3 font-semibold text-center w-24">Qty</th>
              <th className="p-3 font-semibold text-right w-32">Unit Price</th>
              <th className="p-3 font-semibold text-right w-32">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="p-3">{item.description}</td>
                <td className="p-3 text-center">{item.quantity}</td>
                <td className="p-3 text-right">${item.unitPrice.toFixed(2)}</td>
                <td className="p-3 text-right">${(item.quantity * item.unitPrice).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="flex justify-end mb-8">
        <div className="w-full max-w-sm">
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {discount ? (
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Discount</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
          ) : null}
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Tax ({tax}%)</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          <Separator className="my-2 bg-gray-200" />
          <div className="flex justify-between py-2 font-bold text-xl">
            <span>Total Amount</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </section>
      
      {terms && (
        <section className="mb-8">
            <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Terms & Conditions</h3>
            <p className="text-xs text-gray-600">{terms}</p>
        </section>
      )}

      <footer className="text-center text-xs text-gray-500 pt-8 border-t border-gray-200">
        <p>Thank you for your business!</p>
        <p>Ailutions Inc. | (123) 456-7890 | www.ailutions.com</p>
      </footer>
    </div>
  )
}
