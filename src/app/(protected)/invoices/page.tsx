
"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
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
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
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
import { MoreHorizontal, PlusCircle, Download, Printer } from "lucide-react"
import { InvoiceForm } from "./invoice-form"
import type { Invoice, Client } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

const initialClients: Client[] = [
  {
    id: "1",
    name: "Innovate Inc.",
    contactPerson: "John Doe",
    email: "john.doe@innovate.com",
    phone: "123-456-7890",
    status: "customer",
    taxId: "GST12345",
    addressLine1: "123 Tech Ave",
    city: "Silicon Valley",
    state: "CA",
    postalCode: "94043",
    country: "USA",
  },
  {
    id: "2",
    name: "Solutions Co.",
    contactPerson: "Jane Smith",
    email: "jane.smith@solutions.com",
    phone: "098-765-4321",
    status: "customer",
  },
  {
    id: "3",
    name: "Future Forward",
    contactPerson: "Sam Wilson",
    email: "sam.wilson@ff.io",
    phone: "555-555-5555",
    status: "lead",
  },
];

const initialInvoices: Invoice[] = [
    {
      id: "1",
      invoiceNumber: "INV-001",
      clientRef: "1",
      date: new Date(2024, 6, 15).toISOString(),
      items: [{ description: "Web Development", quantity: 1, unitPrice: 5000, total: 5000 }],
      discount: 0,
      discountType: 'value',
      tax: 10,
      totalAmount: 5500,
      currency: "USD",
      dueDate: new Date(2024, 7, 15).toISOString(),
      status: "paid",
      createdAt: new Date(2024, 6, 15).toISOString(),
    },
    {
      id: "2",
      invoiceNumber: "INV-002",
      clientRef: "2",
      date: new Date(2024, 5, 30).toISOString(),
      items: [{ description: "Consulting", quantity: 10, unitPrice: 150, total: 1500 }],
      discount: 100,
      discountType: 'value',
      tax: 10,
      totalAmount: 1540,
      currency: "USD",
      dueDate: new Date(2024, 6, 30).toISOString(),
      status: "overdue",
      createdAt: new Date(2024, 5, 30).toISOString(),
    },
    {
        id: "3",
        invoiceNumber: "INV-003",
        clientRef: "1",
        date: new Date(2024, 7, 1).toISOString(),
        items: [{ description: "Design Services", quantity: 1, unitPrice: 2000, total: 2000 }],
        tax: 10,
        discount: 0,
        discountType: 'value',
        totalAmount: 2200,
        currency: "USD",
        dueDate: new Date(2024, 8, 1).toISOString(),
        status: "sent",
        createdAt: new Date(2024, 7, 1).toISOString(),
      },
]

export default function InvoicesPage() {
    const { toast } = useToast()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
    const [clients] = useState<Client[]>(initialClients)
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const invoicePrintRef = useRef<HTMLDivElement>(null);


    const clientMap = useMemo(() => {
        return clients.reduce((acc, client) => {
          acc[client.id] = client;
          return acc;
        }, {} as { [key: string]: Client });
      }, [clients]);
    
    useEffect(() => {
        const savedInvoices = localStorage.getItem('invoices');
        if (savedInvoices) {
            try {
                const parsedInvoices = JSON.parse(savedInvoices);
                setInvoices(parsedInvoices);
            } catch (e) {
                console.error("Failed to parse invoices from localStorage", e);
                setInvoices(initialInvoices);
            }
        }
    }, []);

    useEffect(() => {
        if (invoices.length > 0 && invoices !== initialInvoices) {
            localStorage.setItem('invoices', JSON.stringify(invoices));
        }
    }, [invoices]);

    const handleFormSubmit = (invoiceData: Omit<Invoice, "id" | "createdAt" | "invoiceNumber">, fromConversion = false) => {
      if (selectedInvoice && selectedInvoice.id && !fromConversion) { // Check if it's a real edit
        const updatedInvoice = { ...selectedInvoice, ...invoiceData };
        setInvoices(
          invoices.map((inv) =>
            inv.id === selectedInvoice.id ? updatedInvoice : inv
          )
        )
        setSelectedInvoice(updatedInvoice); // Keep dialog open with updated data
        toast({
          title: "Invoice Updated",
          description: "The invoice details have been updated.",
        })
      } else {
        const newInvoice = {
          ...invoiceData,
          id: `inv_${Date.now()}`,
          invoiceNumber: `INV-${String(invoices.length + 1).padStart(3, '0')}`,
          createdAt: new Date().toISOString(),
          status: 'draft' as const,
        }
        setInvoices(prev => [...prev, newInvoice])
        toast({
          title: fromConversion ? "Invoice Converted" : "Invoice Created",
          description: fromConversion 
            ? `Invoice ${newInvoice.invoiceNumber} created from quotation.`
            : "The new invoice has been added successfully.",
        })
      }
      setIsDialogOpen(false);
    }

    useEffect(() => {
        const createForClient = searchParams.get('createForClient');
        if (createForClient) {
            setSelectedInvoice({
                id: '',
                invoiceNumber: '',
                clientRef: createForClient,
                items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
                tax: 0,
                discount: 0,
                discountType: 'value',
                totalAmount: 0,
                currency: 'USD',
                date: new Date().toISOString(),
                dueDate: new Date().toISOString(),
                status: 'draft',
                createdAt: new Date().toISOString(),
            });
            setIsDialogOpen(true);
            router.replace('/invoices', undefined);
        }

        const fromQuotation = searchParams.get('fromQuotation');
        if (fromQuotation) {
            try {
                const quotationData = JSON.parse(decodeURIComponent(fromQuotation));
                const newInvoice: Omit<Invoice, "id" | "createdAt" | "invoiceNumber" | "status"> = {
                    ...quotationData,
                    dueDate: new Date().toISOString(), // set new due date
                    quotationRef: quotationData.id,
                };
                handleFormSubmit(newInvoice, true);
            } catch (error) {
                console.error("Failed to parse quotation data:", error);
                toast({
                    variant: "destructive",
                    title: "Conversion Failed",
                    description: "There was an error converting the quotation to an invoice."
                });
            }
            router.replace('/invoices', undefined);
        }
    }, [searchParams, router]); // handleFormSubmit dependency removed to avoid re-triggering
  
    const handleAddInvoice = () => {
      setSelectedInvoice(null)
      setIsDialogOpen(true)
    }
  
    const handleEditInvoice = (invoice: Invoice) => {
      setSelectedInvoice(invoice)
      setIsDialogOpen(true)
    }
  
    const handleDeleteInvoice = (invoiceId: string) => {
      setInvoices(invoices.filter((invoice) => invoice.id !== invoiceId))
      toast({
        title: "Invoice Deleted",
        description: "The invoice has been successfully deleted.",
      })
    }

    const handleDownloadPdf = async () => {
        const element = invoicePrintRef.current;
        if (!element) return;
    
        const canvas = await html2canvas(element, { 
            scale: 2,
            useCORS: true,
            allowTaint: true,
        });
        const data = canvas.toDataURL('image/png');
    
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`invoice-${selectedInvoice?.invoiceNumber || 'new'}.pdf`);
      };
    
      const handlePrint = () => {
        const node = invoicePrintRef.current;
        if (!node) return;
        
        const printableContent = node.innerHTML;
        const originalContent = document.body.innerHTML;

        const printStyles = `
            @media print {
              body, html {
                  margin: 0;
                  padding: 0;
                  background: #fff;
              }
              .non-printable {
                display: none !important;
              }
              .printable-area {
                  visibility: visible;
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  height: auto;
                  padding: 0;
                  margin: 0;
                  border: none;
                  box-shadow: none;
                  transform: scale(1) !important;
              }
              @page {
                size: A4;
                margin: 0;
              }
            }
        `;
        
        const styleEl = document.createElement('style');
        styleEl.innerHTML = printStyles;
        document.head.appendChild(styleEl);

        document.body.innerHTML = printableContent;
        window.print();
        document.body.innerHTML = originalContent;
        styleEl.remove();
        window.location.reload();
      };

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

    const isEditing = !!selectedInvoice;

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
                        <TableCell 
                            className="font-medium cursor-pointer hover:underline"
                            onClick={() => handleEditInvoice(invoice)}
                        >
                            {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>{clientMap[invoice.clientRef]?.name || 'Unknown Client'}</TableCell>
                        <TableCell>{new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency || 'USD' }).format(invoice.totalAmount)}</TableCell>
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0 gap-0">
                <InvoiceForm 
                  onSubmit={handleFormSubmit}
                  defaultValues={selectedInvoice}
                  clients={clients}
                  isEditing={isEditing}
                  printRef={invoicePrintRef}
                  onPrint={handlePrint}
                  onDownload={handleDownloadPdf}
                />
            </DialogContent>
        </Dialog>
      </>
    );
}
