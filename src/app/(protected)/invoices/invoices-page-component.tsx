
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
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { InvoiceForm } from "./invoice-form"
import type { Invoice, Client } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { getInvoices, addInvoice, updateInvoice, deleteInvoice } from "@/services/invoiceService"
import { getClients } from "@/services/clientService"
import { useAuth } from "../auth-provider"
import { auth } from "@/lib/firebase"

export default function InvoicesPageComponent() {
    const { toast } = useToast()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const invoicePrintRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();

    const clientMap = useMemo(() => {
        return clients.reduce((acc, client) => {
          acc[client.id] = client;
          return acc;
        }, {} as { [key: string]: Client });
      }, [clients]);
    
    useEffect(() => {
      if (user) {
        const fetchData = async () => {
          setLoading(true);
          try {
            const [invoicesData, clientsData] = await Promise.all([
              getInvoices(),
              getClients(),
            ]);
            setInvoices(invoicesData);
            setClients(clientsData);
          } catch (error) {
            console.error("Failed to fetch data:", error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Could not load invoices or client data.",
            });
          } finally {
            setLoading(false);
          }
        };
        fetchData();
      } else {
        setLoading(false);
      }
    }, [user, toast]);


    const handleFormSubmit = async (invoiceData: Omit<Invoice, "id" | "createdAt" | "invoiceNumber">, fromConversion = false) => {
      if (!auth.currentUser) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to save an invoice." });
        return;
      }

      if (selectedInvoice && selectedInvoice.id && !fromConversion) { // Check if it's a real edit
        try {
            await updateInvoice(selectedInvoice.id, invoiceData);
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
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update invoice." });
        }
      } else { // New Invoice
        const newInvoiceData = {
          ...invoiceData,
          id: '', // Firestore will generate
          invoiceNumber: `INV-${String(invoices.length + 1).padStart(3, '0')}`,
          createdAt: new Date().toISOString(),
          status: 'draft' as const,
        }
        try {
            const newInvoice = await addInvoice(newInvoiceData);
            setInvoices(prev => [...prev, newInvoice]);
            toast({
              title: fromConversion ? "Invoice Converted" : "Invoice Created",
              description: fromConversion 
                ? `Invoice ${newInvoice.invoiceNumber} created from quotation.`
                : "The new invoice has been added successfully.",
            });
        } catch(error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to create invoice." });
        }
      }
      setIsDialogOpen(false);
    }

    useEffect(() => {
        if (loading || !user) return;

        const createForClient = searchParams.get('createForClient');
        if (createForClient) {
            setSelectedInvoice({
                id: '',
                invoiceNumber: '',
                clientRef: createForClient,
                items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
                totalAmount: 0,
                currency: 'USD',
                date: new Date().toISOString(),
                dueDate: new Date().toISOString(),
                status: 'draft',
                createdAt: new Date().toISOString(),
            });
            setIsDialogOpen(true);
            router.replace('/invoices', { scroll: false });
        }

        const fromQuotation = searchParams.get('fromQuotation');
        if (fromQuotation) {
            try {
                const quotationData = JSON.parse(decodeURIComponent(fromQuotation));
                const newInvoiceData: Omit<Invoice, "id" | "createdAt" | "invoiceNumber" | "status"> = {
                    ...quotationData,
                    dueDate: new Date().toISOString(), // set new due date
                    quotationRef: quotationData.id,
                };
                handleFormSubmit(newInvoiceData, true);
            } catch (error) {
                console.error("Failed to parse quotation data:", error);
                toast({
                    variant: "destructive",
                    title: "Conversion Failed",
                    description: "There was an error converting the quotation to an invoice."
                });
            }
            router.replace('/invoices', { scroll: false });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, router, loading, user]);
  
    const handleAddInvoice = () => {
      setSelectedInvoice(null)
      setIsDialogOpen(true)
    }
  
    const handleEditInvoice = (invoice: Invoice) => {
      setSelectedInvoice(invoice)
      setIsDialogOpen(true)
    }
  
    const handleDeleteInvoice = async (invoiceId: string) => {
        if (!auth.currentUser) {
            toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to delete an invoice." });
            return;
        }
        try {
            await deleteInvoice(invoiceId);
            setInvoices(invoices.filter((invoice) => invoice.id !== invoiceId));
            toast({
                title: "Invoice Deleted",
                description: "The invoice has been successfully deleted.",
            });
        } catch(error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete invoice." });
        }
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
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Print Invoice</title>
                <link rel="stylesheet" href="/globals.css">
                <style>
                  @media print {
                    @page { size: A4; margin: 0; }
                    body { margin: 0; }
                    .a4-container {
                        box-shadow: none;
                        border: none;
                        margin: 0;
                        padding: 20mm;
                    }
                  }
                </style>
              </head>
              <body>${"```"}html
              ${printableContent}
              ${"```"}</body>
            </html>
          `);
          printWindow.document.close();
          printWindow.focus();
          // Timeout to allow content to load before printing
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 500);
        }
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

    if (loading) {
        return <div>Loading...</div>;
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
            <DialogContent className="w-screen h-screen max-w-full max-h-full flex flex-col p-0 gap-0 sm:rounded-none">
                <InvoiceForm 
                  onSubmit={handleFormSubmit}
                  defaultValues={selectedInvoice}
                  clients={clients}
                  isEditing={isEditing}
                  printRef={invoicePrintRef}
                  onPrint={handlePrint}
                  onDownload={handleDownloadPdf}
                  onClose={() => setIsDialogOpen(false)}
                />
            </DialogContent>
        </Dialog>
      </>
    );
}
