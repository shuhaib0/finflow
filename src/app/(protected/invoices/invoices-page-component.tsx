
"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import jsPDF from "jspdf"
import autoTable from 'jspdf-autotable'
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import type { VariantProps } from "class-variance-authority"

import { Badge, badgeVariants } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { InvoiceForm } from "./invoice-form"
import type { Invoice, Client, InvoiceItem, Company } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { getInvoices, addInvoice, updateInvoice, getInvoiceCount, deleteInvoice } from "@/services/invoiceService"
import { getClients } from "@/services/clientService"
import { getCompanyDetails } from "@/services/companyService"
import { useAuth } from "../auth-provider"
import { Skeleton } from "@/components/ui/skeleton"

const getCurrencySymbol = (currencyCode: string | undefined) => {
    const symbols: { [key: string]: string } = {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'AED': 'د.إ', 'CAD': '$'
    };
    return symbols[currencyCode || 'USD'] || '$';
}

export default function InvoicesPageComponent() {
    const { toast } = useToast()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [company, setCompany] = useState<Company | null>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const invoicePrintRef = useRef<HTMLDivElement>(null);
    const { user, loading: authLoading } = useAuth();

    const clientMap = useMemo(() => {
        return clients.reduce((acc, client) => {
          acc[client.id] = client;
          return acc;
        }, {} as { [key: string]: Client });
      }, [clients]);
    
    useEffect(() => {
      if (authLoading || !user) {
        setPageLoading(!user);
        return;
      }
      
      const fetchData = async () => {
        setPageLoading(true);
        try {
          const [invoicesData, clientsData, companyData] = await Promise.all([
            getInvoices(user.uid),
            getClients(user.uid),
            getCompanyDetails(user.uid),
          ]);
          setInvoices(invoicesData);
          setClients(clientsData);
          setCompany(companyData);
        } catch (error) {
          console.error("Failed to fetch data:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load invoices or client data.",
          });
        } finally {
          setPageLoading(false);
        }
      };
      
      fetchData();
    }, [user, authLoading, toast]);


    const handleFormSubmit = async (invoiceData: Omit<Invoice, "id" | "createdAt" | "invoiceNumber" | "userId">, fromConversion = false) => {
      if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to save an invoice." });
        return;
      }

      try {
        if (selectedInvoice && selectedInvoice.id && !fromConversion) { 
            await updateInvoice(selectedInvoice.id, invoiceData);
            const updatedInvoice = { ...selectedInvoice, ...invoiceData } as Invoice;
            setInvoices(
              invoices.map((inv) =>
                inv.id === selectedInvoice.id ? updatedInvoice : inv
              )
            )
            setSelectedInvoice(updatedInvoice); 
            toast({
              title: "Invoice Updated",
              description: "The invoice details have been updated.",
            })
        } else {
          const invoiceCount = await getInvoiceCount(user.uid);
          const newInvoiceData = {
            ...invoiceData,
            userId: user.uid,
            id: '', 
            invoiceNumber: `INV-${String(invoiceCount + 1).padStart(3, '0')}`,
            createdAt: new Date().toISOString(),
          }
          const newInvoice = await addInvoice(newInvoiceData);
          setInvoices(prev => [...prev, newInvoice]);
          setSelectedInvoice(newInvoice);
          toast({
            title: fromConversion ? "Invoice Converted" : "Invoice Created",
            description: fromConversion 
              ? `Invoice ${newInvoice.invoiceNumber} created from quotation.`
              : "The new invoice has been added successfully.",
          });
          if (!fromConversion) {
            setIsDialogOpen(false);
          }
        }
      } catch(error) {
          toast({ variant: "destructive", title: "Error", description: "Failed to save invoice." });
      }
    }

    useEffect(() => {
        if (pageLoading || !user) return;

        const createForClient = searchParams.get('createForClient');
        if (createForClient) {
            setSelectedInvoice({
                id: '',
                userId: user.uid,
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
                const newInvoiceData: Omit<Invoice, "id" | "createdAt" | "invoiceNumber"> = {
                    ...quotationData,
                    status: 'draft',
                    userId: user.uid,
                    dueDate: new Date().toISOString(), 
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
    
    }, [searchParams, router, pageLoading, user, toast]);
  
    const handleAddInvoice = () => {
      if(!user) return;
      setSelectedInvoice(null)
      setIsDialogOpen(true)
    }
  
    const handleEditInvoice = (invoice: Invoice) => {
      setSelectedInvoice(invoice)
      setIsDialogOpen(true)
    }
  
    const handleDeleteInvoice = async (invoiceId: string) => {
        if (!user) {
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

    const handleDownloadPdf = () => {
        if (!selectedInvoice) return;
        const client = clientMap[selectedInvoice.clientRef];
        if (!client || !company) return;
    
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageMargin = 20;

        // Header
        if (company.logoUrl) {
          doc.addImage(company.logoUrl, 'PNG', pageMargin, 15, 30, 12, undefined, 'FAST');
        }
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(75, 0, 130);
        doc.text(company.name, pageMargin, 35);
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        const companyAddress = doc.splitTextToSize(company.address || "", 60);
        doc.text(companyAddress, pageMargin, 40);

        doc.setFontSize(28);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(34, 34, 34);
        doc.text("INVOICE", pageWidth - pageMargin, 22, { align: "right" });
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`# ${selectedInvoice.invoiceNumber}`, pageWidth - pageMargin, 28, { align: "right" });
    
        doc.setDrawColor(75, 0, 130);
        doc.setLineWidth(0.5);
        doc.line(pageMargin, 55, pageWidth - pageMargin, 55);

        // Client & Dates Info
        let yPos = 65;
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("BILL TO", pageMargin, yPos);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(75, 0, 130);
        doc.text(client.name, pageMargin, yPos + 7);
    
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        let addressY = yPos + 12;
        if(client.addressLine1) { doc.text(client.addressLine1, pageMargin, addressY); addressY += 5; }
        const cityStateZip = `${client.city || ''} ${client.state || ''} ${client.postalCode || ''}`.trim();
        if(cityStateZip) { doc.text(cityStateZip, pageMargin, addressY); addressY += 5; }
        if(client.country) { doc.text(client.country, pageMargin, addressY); addressY += 5; }
        
        const datesX = pageWidth - pageMargin;
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100);
        doc.text("Invoice Date:", datesX, yPos, { align: 'right' });
        doc.text("Due Date:", datesX, yPos + 7, { align: 'right' });

        doc.setFont("helvetica", "normal");
        doc.setTextColor(34, 34, 34);
        doc.text(format(new Date(selectedInvoice.date), "MMMM d, yyyy"), datesX, yPos + 3, { align: 'right' });
        doc.text(format(new Date(selectedInvoice.dueDate), "MMMM d, yyyy"), datesX, yPos + 10, { align: 'right' });

        // Table
        const currencySymbol = getCurrencySymbol(selectedInvoice.currency);
        const tableColumn = ["Description", "Qty", "Unit Price", "Total"];
        const tableRows: (string | number)[][] = selectedInvoice.items.map((item: InvoiceItem) => [
            item.description,
            item.quantity,
            `${currencySymbol}${(item.unitPrice || 0).toFixed(2)}`,
            `${currencySymbol}${(item.quantity * item.unitPrice).toFixed(2)}`
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: addressY + 10,
            theme: 'striped',
            headStyles: {
                fillColor: [240, 240, 240], 
                textColor: [75, 0, 130], 
                fontStyle: 'bold'
            },
            styles: {
                cellPadding: 3,
                fontSize: 10
            },
            columnStyles: {
                1: { halign: 'center' },
                2: { halign: 'right' },
                3: { halign: 'right' }
            },
        });

        // Totals
        let finalY = (doc as any).lastAutoTable.finalY + 10;
        
        const calculateTotals = (inv: Invoice) => {
            const subtotal = inv.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
            const discountPercent = Number(inv.discount) || 0;
            const taxPercent = Number(inv.tax) || 0;
            const totalDiscount = subtotal * (discountPercent / 100);
            const subtotalAfterDiscount = subtotal - totalDiscount;
            const totalTax = subtotalAfterDiscount * (taxPercent / 100);
            return { subtotal, totalDiscount, totalTax };
        };
        
        const { subtotal, totalDiscount, totalTax } = calculateTotals(selectedInvoice!);

        const totalsX = pageWidth - pageMargin - 60;
        const totalsValueX = pageWidth - pageMargin;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text("Subtotal:", totalsX, finalY);
        doc.text(`${currencySymbol}${subtotal.toFixed(2)}`, totalsValueX, finalY, { align: 'right' });
        finalY += 7;
        
        if (totalDiscount > 0) {
            doc.text(`Discount (${selectedInvoice.discount}%):`, totalsX, finalY);
            doc.text(`-${currencySymbol}${totalDiscount.toFixed(2)}`, totalsValueX, finalY, { align: 'right' });
            finalY += 7;
        }

        doc.text(`Tax (${selectedInvoice.tax}%):`, totalsX, finalY);
        doc.text(`${currencySymbol}${totalTax.toFixed(2)}`, totalsValueX, finalY, { align: 'right' });
        finalY += 10;

        // Draw Total box
        doc.setFillColor(240, 240, 255);
        doc.rect(totalsX - 10, finalY - 5, 70, 10, 'F');
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(75, 0, 130);
        doc.text("Total Amount", totalsX - 5, finalY);
        doc.text(`${currencySymbol}${selectedInvoice.totalAmount.toFixed(2)}`, totalsValueX, finalY, { align: 'right' });

        // Terms and Conditions
        let termsY = finalY + 20;
        if(selectedInvoice.terms) {
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(150);
            doc.text("Terms & Conditions", pageMargin, termsY);
            doc.setFontSize(8);
            doc.setTextColor(100);
            const termsText = doc.splitTextToSize(selectedInvoice.terms, pageWidth - (pageMargin * 2));
            doc.text(termsText, pageMargin, termsY + 5);
        }

        // Footer
        const footerY = pageHeight - 15;
        doc.setLineWidth(0.2);
        doc.line(pageMargin, footerY - 5, pageWidth - pageMargin, footerY - 5);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Thank you for your business!", pageWidth / 2, footerY, { align: 'center' });
        const footerContact = `${company.name} | ${company.contactEmail || ''} | ${company.website || ''}`;
        doc.text(footerContact, pageWidth / 2, footerY + 4, { align: 'center' });
    
        doc.save(`Invoice-${selectedInvoice.invoiceNumber}.pdf`);
    };
    
    const handlePrint = () => {
        const node = invoicePrintRef.current;
        if (!node) return;
        
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const allStyleSheets = Array.from(document.styleSheets)
                .map(styleSheet => {
                    try {
                        return Array.from(styleSheet.cssRules)
                            .map(rule => rule.cssText)
                            .join('');
                    } catch (e) {
                        console.log('Cannot access stylesheet rules: ', styleSheet.href);
                        return '';
                    }
                })
                .join('\n');

            printWindow.document.write(`
            <html>
              <head>
                <title>Print Invoice</title>
                <style>
                  ${allStyleSheets}
                  @page { size: A4; margin: 0; }
                  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                </style>
              </head>
              <body>
                <div class="a4-container printable-area">
                  ${node.innerHTML}
                </div>
              </body>
            </html>
            `);

            printWindow.document.close();
            
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            }, 500);
        }
      };

    const getStatusVariant = (status: Invoice['status']): VariantProps<typeof badgeVariants>['variant'] => {
        switch (status) {
          case 'paid':
            return 'default' as const;
          case 'sent':
            return 'secondary' as const;
          case 'overdue':
            return 'destructive' as const;
          case 'draft':
            return 'outline' as const;
        }
      }

    const isEditing = !!selectedInvoice;

    if (pageLoading || authLoading) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <Skeleton className="h-7 w-48" />
                            <Skeleton className="h-4 w-64 mt-2" />
                        </div>
                        <Skeleton className="h-9 w-32" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </CardContent>
            </Card>
        );
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
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="text-2xl font-headline font-semibold">{isEditing ? `Edit Invoice ${selectedInvoice?.invoiceNumber}` : "New Invoice"}</DialogTitle>
                    <DialogDescription>{isEditing ? "Update the details below." : "Fill in the details to create a new invoice."}</DialogDescription>
                </DialogHeader>
                <InvoiceForm 
                  onSubmit={handleFormSubmit}
                  defaultValues={selectedInvoice}
                  clients={clients}
                  isEditing={isEditing}
                  printRef={invoicePrintRef}
                  onPrint={handlePrint}
                  onDownload={handleDownloadPdf}
                  onClose={() => setIsDialogOpen(false)}
                  company={company}
                />
            </DialogContent>
        </Dialog>
      </>
    );
}
