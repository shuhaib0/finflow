"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { InvoiceForm } from "./invoice-form"
import type { Invoice } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

const initialInvoices: Invoice[] = [
    {
      id: "1",
      invoiceNumber: "INV-001",
      clientRef: "1",
      items: [{ description: "Web Development", quantity: 1, unitPrice: 5000, total: 5000 }],
      tax: 500,
      totalAmount: 5500,
      dueDate: new Date(2024, 7, 15).toISOString(),
      status: "paid",
      createdAt: new Date(2024, 6, 15).toISOString(),
    },
    {
      id: "2",
      invoiceNumber: "INV-002",
      clientRef: "2",
      items: [{ description: "Consulting", quantity: 10, unitPrice: 150, total: 1500 }],
      tax: 150,
      totalAmount: 1650,
      dueDate: new Date(2024, 6, 30).toISOString(),
      status: "overdue",
      createdAt: new Date(2024, 5, 30).toISOString(),
    },
    {
        id: "3",
        invoiceNumber: "INV-003",
        clientRef: "3",
        items: [{ description: "Design Services", quantity: 1, unitPrice: 2000, total: 2000 }],
        tax: 200,
        totalAmount: 2200,
        dueDate: new Date(2024, 8, 1).toISOString(),
        status: "sent",
        createdAt: new Date(2024, 7, 1).toISOString(),
      },
]

// Mock client names for display
const clientNames: { [key: string]: string } = {
  "1": "Innovate Inc.",
  "2": "Solutions Co.",
  "3": "Future Forward",
  "4": "Legacy Systems",
}


export default function InvoicesPage() {
    const { toast } = useToast()
    const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
  
    const handleAddInvoice = () => {
      setSelectedInvoice(null)
      setIsSheetOpen(true)
    }
  
    const handleEditInvoice = (invoice: Invoice) => {
      setSelectedInvoice(invoice)
      setIsSheetOpen(true)
    }
  
    const handleDeleteInvoice = (invoiceId: string) => {
      setInvoices(invoices.filter((invoice) => invoice.id !== invoiceId))
      toast({
        title: "Invoice Deleted",
        description: "The invoice has been successfully deleted.",
      })
    }
  
    const handleFormSubmit = (invoiceData: Omit<Invoice, "id" | "createdAt" | "invoiceNumber">) => {
      if (selectedInvoice) {
        setInvoices(
          invoices.map((inv) =>
            inv.id === selectedInvoice.id ? { ...selectedInvoice, ...invoiceData } : inv
          )
        )
        toast({
          title: "Invoice Updated",
          description: "The invoice details have been updated.",
        })
      } else {
        const newInvoice = {
          ...invoiceData,
          id: (invoices.length + 1).toString(),
          invoiceNumber: `INV-00${invoices.length + 1}`,
          createdAt: new Date().toISOString(),
        }
        setInvoices([...invoices, newInvoice])
        toast({
          title: "Invoice Created",
          description: "The new invoice has been added successfully.",
        })
      }
      setIsSheetOpen(false)
    }

    const getStatusVariant = (status: Invoice['status']) => {
        switch (status) {
          case 'paid':
            return 'default'
          case 'sent':
            return 'secondary'
          case 'overdue':
            return 'destructive'
          case 'draft':
            return 'outline'
        }
      }

    return (
        <>
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="font-headline">Invoices</CardTitle>
                        <CardDescription>
                            Create and manage your invoices here.
                        </CardDescription>
                    </div>
                    <Button size="sm" className="gap-1" onClick={handleAddInvoice}>
                        <PlusCircle className="h-4 w-4" />
                        New Invoice
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {invoices.length > 0 ? (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Number</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>
                        <span className="sr-only">Actions</span>
                        </TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{clientNames[invoice.clientRef] || 'Unknown Client'}</TableCell>
                        <TableCell>${invoice.totalAmount.toFixed(2)}</TableCell>
                        <TableCell>{format(new Date(invoice.dueDate), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                            <Badge variant={getStatusVariant(invoice.status)} className="capitalize">
                            {invoice.status}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <AlertDialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>Edit</DropdownMenuItem>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>
                                </AlertDialogTrigger>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the invoice.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteInvoice(invoice.id)} className="bg-destructive hover:bg-destructive/90">
                                    Delete
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                    <h3 className="text-lg font-semibold">No Invoices Yet</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                        Click "New Invoice" to get started.
                    </p>
                </div>
                )}
            </CardContent>
        </Card>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent className="sm:max-w-xl">
                <SheetHeader>
                    <SheetTitle className="font-headline">{selectedInvoice ? "Edit Invoice" : "New Invoice"}</SheetTitle>
                    <SheetDescription>
                        {selectedInvoice ? "Update the invoice details below." : "Fill in the details to create a new invoice."}
                    </SheetDescription>
                </SheetHeader>
                <InvoiceForm 
                  onSubmit={handleFormSubmit}
                  defaultValues={selectedInvoice}
                  clientNames={clientNames}
                />
            </SheetContent>
        </Sheet>
      </>
    );
}
