
"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import jsPDF from "jspdf"
import autoTable from 'jspdf-autotable'
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
  DropdownMenuSeparator,
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

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { QuotationForm } from "./quotation-form"
import type { Quotation, Client, InvoiceItem } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { useAuth } from "../auth-provider"
import { getClients } from "@/services/clientService"
import { getQuotations, addQuotation, updateQuotation, deleteQuotation } from "@/services/quotationService"
import { Skeleton } from "@/components/ui/skeleton"

const getCurrencySymbol = (currencyCode: string | undefined) => {
    const symbols: { [key: string]: string } = {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'AED': 'د.إ', 'CAD': '$'
    };
    return symbols[currencyCode || 'USD'] || '$';
}

export default function QuotationsPageComponent() {
    const { toast } = useToast()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [quotations, setQuotations] = useState<Quotation[]>([])
    const [clients, setClients] = useState<Client[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const { user, loading: authLoading } = useAuth();
    const quotationPrintRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setPageLoading(false);
            return;
        }
        
        const fetchData = async () => {
          setPageLoading(true);
          try {
            const [quotationsData, clientsData] = await Promise.all([
              getQuotations(),
              getClients(),
            ]);
            setQuotations(quotationsData);
            setClients(clientsData);
          } catch (error) {
            console.error("Failed to fetch data:", error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Could not load quotations or client data.",
            });
          } finally {
            setPageLoading(false);
          }
        };
        
        fetchData();
    }, [user, authLoading, toast]);
    
    const clientMap = useMemo(() => {
        return clients.reduce((acc, client) => {
          acc[client.id] = client;
          return acc;
        }, {} as { [key: string]: Client });
      }, [clients]);

      useEffect(() => {
        if (pageLoading || !user) return;

        const createForClient = searchParams.get('createForClient');
        if (createForClient) {
            setSelectedQuotation({
                id: '',
                quotationNumber: '',
                clientRef: createForClient,
                items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
                totalAmount: 0,
                date: new Date().toISOString(),
                dueDate: new Date().toISOString(),
                status: 'draft',
                createdAt: new Date().toISOString(),
            });
            setIsDialogOpen(true);
            router.replace('/quotations', { scroll: false });
        }
    }, [searchParams, router, user, pageLoading]);

    const handleAddQuotation = () => {
      setSelectedQuotation(null)
      setIsDialogOpen(true)
    }
  
    const handleEditQuotation = (quotation: Quotation) => {
      setSelectedQuotation(quotation)
      setIsDialogOpen(true)
    }
  
    const handleDeleteQuotation = async (quotationId: string) => {
      if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to delete a quotation." });
        return;
      }
      try {
        await deleteQuotation(quotationId);
        setQuotations(quotations.filter((q) => q.id !== quotationId))
        toast({
            title: "Quotation Deleted",
            description: "The quotation has been successfully deleted.",
        });
      } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to delete quotation.",
        });
      }
    }

    const handleStatusChange = async (quotationId: string, status: 'won' | 'lost') => {
        if (!user) {
            toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to update status." });
            return;
        }
        try {
            await updateQuotation(quotationId, { status });
            setQuotations(quotations.map(q => q.id === quotationId ? {...q, status} : q));
            toast({
                title: `Quotation marked as ${status}`,
                description: "The quotation status has been updated."
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update quotation status.",
            });
        }
    }

    const handleConvertToInvoice = (quotation: Quotation) => {
        const { quotationNumber, ...invoiceData } = quotation;
        const fullInvoiceData = { ...invoiceData, quotationRef: quotation.id };
        router.push(`/invoices?fromQuotation=${encodeURIComponent(JSON.stringify(fullInvoiceData))}`);
    }
  
    const handleFormSubmit = async (quotationData: Omit<Quotation, "id" | "createdAt" | "quotationNumber">) => {
      if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to save a quotation." });
        return;
      }
      try {
        if (selectedQuotation && selectedQuotation.id) {
            await updateQuotation(selectedQuotation.id, quotationData);
            const updatedQuotation = { ...selectedQuotation, ...quotationData };
            setQuotations(
                quotations.map((q) =>
                  q.id === selectedQuotation.id ? updatedQuotation : q
                )
            );
            setSelectedQuotation(updatedQuotation);
            toast({
              title: "Quotation Updated",
              description: "The quotation details have been updated.",
            });
        } else {
          const newQuotationData = {
            ...quotationData,
            quotationNumber: `QUO-${String(quotations.length + 1).padStart(3, '0')}`,
            createdAt: new Date().toISOString(),
            status: 'draft' as const,
          }
          const newQuotation = await addQuotation(newQuotationData);
          setQuotations([...quotations, newQuotation])
          setSelectedQuotation(newQuotation);
          toast({
            title: "Quotation Created",
            description: "The new quotation has been added successfully.",
          });
        }
        setIsDialogOpen(false)
      } catch(error) {
          toast({ variant: "destructive", title: "Error", description: "Failed to create quotation." });
      }
    }

    const handleDownloadPdf = () => {
        if (!selectedQuotation) return;
        const client = clientMap[selectedQuotation.clientRef];
        if (!client) return;
    
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageMargin = 20;

        // Ailutions Header
        doc.setFontSize(26);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(75, 0, 130); // Deep Indigo
        doc.text("Ailutions Inc.", pageMargin, 22);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text("123 Innovation Drive, Tech City, 12345", pageMargin, 28);
    
        // Quotation Title
        doc.setFontSize(28);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(34, 34, 34);
        doc.text("QUOTATION", pageWidth - pageMargin, 22, { align: "right" });
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`# ${selectedQuotation.quotationNumber}`, pageWidth - pageMargin, 28, { align: "right" });
    
        // Line separator
        doc.setDrawColor(75, 0, 130);
        doc.setLineWidth(0.5);
        doc.line(pageMargin, 38, pageWidth - pageMargin, 38);

        // Bill To section
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("PROPOSAL FOR", pageMargin, 48);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(75, 0, 130);
        doc.text(client.name, pageMargin, 55);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        let yPos = 60;
        if(client.addressLine1) { doc.text(client.addressLine1, pageMargin, yPos); yPos += 5; }
        if(client.addressLine2) { doc.text(client.addressLine2, pageMargin, yPos); yPos += 5; }
        const cityStateZip = `${client.city || ''} ${client.state || ''} ${client.postalCode || ''}`.trim();
        if(cityStateZip) { doc.text(cityStateZip, pageMargin, yPos); yPos += 5; }
        if(client.country) { doc.text(client.country, pageMargin, yPos); yPos += 5; }

        // Dates section
        const datesX = pageWidth - pageMargin - 60;
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100);
        doc.text("Quotation Date:", datesX, 48);
        doc.text("Expires On:", datesX, 55);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(34, 34, 34);
        doc.text(format(new Date(selectedQuotation.date), "MMMM d, yyyy"), datesX + 28, 48);
        doc.text(format(new Date(selectedQuotation.dueDate), "MMMM d, yyyy"), datesX + 28, 55);

        // Table
        const currencySymbol = getCurrencySymbol(selectedQuotation.currency);
        const tableColumn = ["Description", "Qty", "Unit Price", "Total"];
        const tableRows: (string | number)[][] = selectedQuotation.items.map((item: InvoiceItem) => [
            item.description,
            item.quantity,
            `${currencySymbol}${(item.unitPrice || 0).toFixed(2)}`,
            `${currencySymbol}${(item.quantity * item.unitPrice).toFixed(2)}`
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: yPos + 10,
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
            didDrawPage: (data) => {
                let finalY = (data.cursor?.y || 0) + 10;
                
                const calculateTotals = (q: Quotation) => {
                    const subtotal = q.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
                    const discountPercent = Number(q.discount) || 0;
                    const taxPercent = Number(q.tax) || 0;
                    const totalDiscount = subtotal * (discountPercent / 100);
                    const subtotalAfterDiscount = subtotal - totalDiscount;
                    const totalTax = subtotalAfterDiscount * (taxPercent / 100);
                    return { subtotal, totalDiscount, totalTax };
                };
                
                const { subtotal, totalDiscount, totalTax } = calculateTotals(selectedQuotation!);
    
                const totalsX = pageWidth - pageMargin - 50;
                const totalsValueX = pageWidth - pageMargin;
    
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(100);
                doc.text("Subtotal:", totalsX, finalY);
                doc.text(`${currencySymbol}${subtotal.toFixed(2)}`, totalsValueX, finalY, { align: 'right' });
                finalY += 7;
                
                if (totalDiscount > 0) {
                    doc.text(`Discount (${selectedQuotation.discount}%):`, totalsX, finalY);
                    doc.text(`-${currencySymbol}${totalDiscount.toFixed(2)}`, totalsValueX, finalY, { align: 'right' });
                    finalY += 7;
                }
    
                doc.text(`Tax (${selectedQuotation.tax}%):`, totalsX, finalY);
                doc.text(`${currencySymbol}${totalTax.toFixed(2)}`, totalsValueX, finalY, { align: 'right' });
                finalY += 7;
    
                doc.setLineWidth(0.2);
                doc.line(totalsX, finalY - 3, totalsValueX, finalY - 3);
    
                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(34, 34, 34);
                doc.text("Total:", totalsX, finalY + 2);
                doc.text(`${currencySymbol}${selectedQuotation.totalAmount.toFixed(2)}`, totalsValueX, finalY + 2, { align: 'right' });
            }
        });
        
        // Terms
        const finalY = (doc as any).lastAutoTable.finalY || doc.internal.pageSize.getHeight() - 50;
        if(selectedQuotation.terms) {
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text("Terms & Conditions", pageMargin, finalY + 20);
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text(selectedQuotation.terms, pageMargin, finalY + 25, {
                maxWidth: pageWidth - (pageMargin * 2)
            });
        }
    
        doc.save(`Quotation-${selectedQuotation.quotationNumber}.pdf`);
      };
    
      const handlePrint = () => {
        const node = quotationPrintRef.current;
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
                <title>Print Quotation</title>
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

    const getStatusVariant = (status: Quotation['status']) => {
        switch (status) {
          case 'won':
            return 'default' 
          case 'sent':
            return 'secondary'
          case 'lost':
            return 'destructive'
          case 'draft':
          default:
            return 'outline'
        }
      }

    const isEditing = !!selectedQuotation;
    
    if (pageLoading || authLoading) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <Skeleton className="h-7 w-48" />
                            <Skeleton className="h-4 w-72 mt-2" />
                        </div>
                        <Skeleton className="h-9 w-36" />
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
                        <CardTitle className="font-headline">Quotations</CardTitle>
                        <CardDescription>
                            Manage your sales quotations and proposals.
                        </CardDescription>
                    </div>
                    <Button size="sm" className="gap-1" onClick={handleAddQuotation}>
                        <PlusCircle className="h-4 w-4" />
                        New Quotation
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {quotations.length > 0 ? (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Number</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Expires On</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>
                        <span className="sr-only">Actions</span>
                        </TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {quotations.map((q) => (
                        <TableRow key={q.id}>
                        <TableCell 
                            className="font-medium cursor-pointer hover:underline"
                            onClick={() => handleEditQuotation(q)}
                        >
                            {q.quotationNumber}
                        </TableCell>
                        <TableCell>{clientMap[q.clientRef]?.name || 'Unknown Client'}</TableCell>
                        <TableCell>{new Intl.NumberFormat('en-US', { style: 'currency', currency: q.currency || 'USD' }).format(q.totalAmount)}</TableCell>
                        <TableCell>{format(new Date(q.dueDate), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                            <Badge variant={getStatusVariant(q.status)} className="capitalize">
                            {q.status}
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
                                <DropdownMenuItem onClick={() => handleEditQuotation(q)}>Edit</DropdownMenuItem>
                                {q.status !== 'won' && (
                                    <DropdownMenuItem onClick={() => handleStatusChange(q.id, 'won')}>Mark as Won</DropdownMenuItem>
                                )}
                                {q.status !== 'lost' && (
                                     <DropdownMenuItem onClick={() => handleStatusChange(q.id, 'lost')}>Mark as Lost</DropdownMenuItem>
                                )}
                                {q.status === 'won' && (
                                    <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleConvertToInvoice(q)}>Convert to Invoice</DropdownMenuItem>
                                    </>
                                )}
                                <DropdownMenuSeparator />
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>
                                </AlertDialogTrigger>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the quotation.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteQuotation(q.id)} className="bg-destructive hover:bg-destructive/90">
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
                    <h3 className="text-lg font-semibold">No Quotations Yet</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                        Click "New Quotation" to get started.
                    </p>
                </div>
                )}
            </CardContent>
        </Card>
        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
            if (!isOpen) {
                setSelectedQuotation(null);
            }
            setIsDialogOpen(isOpen);
        }}>
            <DialogContent className="w-screen h-screen max-w-full max-h-full flex flex-col p-0 gap-0 sm:rounded-none">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="text-2xl font-headline font-semibold">{isEditing ? `Edit Quotation ${selectedQuotation?.quotationNumber}` : "New Quotation"}</DialogTitle>
                    <DialogDescription>{isEditing ? "Update the details below." : "Fill in the details to create a new quotation."}</DialogDescription>
                </DialogHeader>
                <QuotationForm 
                  onSubmit={handleFormSubmit}
                  defaultValues={selectedQuotation}
                  clients={clients}
                  isEditing={isEditing}
                  printRef={quotationPrintRef}
                  onPrint={handlePrint}
                  onDownload={handleDownloadPdf}
                  onClose={() => setIsDialogOpen(false)}
                />
            </DialogContent>
        </Dialog>
      </>
    );
}
