
"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
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
import type { VariantProps } from "class-variance-authority"

import { Badge, badgeVariants } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { QuotationForm } from "./quotation-form"
import type { Quotation, Client, InvoiceItem, Company } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { useAuth } from "@/app/(protected)/auth-provider"
import { getClients } from "@/services/clientService"
import { getQuotations, addQuotation, updateQuotation, deleteQuotation, getQuotationCount } from "@/services/quotationService"
import { getCompanyDetails } from "@/services/companyService"
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
    const [company, setCompany] = useState<Company | null>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const { user, loading: authLoading } = useAuth();
    const quotationPrintRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (authLoading || !user) {
            setPageLoading(!user);
            return;
        }
        
        const fetchData = async () => {
          setPageLoading(true);
          try {
            const [quotationsData, clientsData, companyData] = await Promise.all([
              getQuotations(user.uid),
              getClients(user.uid),
              getCompanyDetails(user.uid),
            ]);
            setQuotations(quotationsData);
            setClients(clientsData);
            setCompany(companyData);
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
                userId: user.uid,
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
      if (!user) return;
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
  
    const handleFormSubmit = async (quotationData: Omit<Quotation, "id" | "createdAt" | "quotationNumber" | "userId">) => {
      if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to save a quotation." });
        return;
      }
      try {
        if (selectedQuotation && selectedQuotation.id) {
            await updateQuotation(selectedQuotation.id, quotationData);
            const updatedQuotation = { ...selectedQuotation, ...quotationData } as Quotation;
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
          const quotationCount = await getQuotationCount(user.uid);
          const newQuotationData = {
            ...quotationData,
            userId: user.uid,
            quotationNumber: `QUO-${String(quotationCount + 1).padStart(3, '0')}`,
            createdAt: new Date().toISOString(),
          }
          const newQuotation = await addQuotation(newQuotationData);
          setQuotations([...quotations, newQuotation])
          setIsDialogOpen(false)
          toast({
            title: "Quotation Created",
            description: "The new quotation has been added successfully.",
          });
        }
      } catch(error) {
          toast({ variant: "destructive", title: "Error", description: "Failed to create quotation." });
      }
    }

    const handleDownloadPdf = () => {
        if (!selectedQuotation) return;
        const client = clientMap[selectedQuotation.clientRef];
        if (!client || !company) return;
    
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageMargin = 20;

        // Header
        // doc.addImage(company.logoUrl, 'PNG', pageMargin, 15, 30, 12);
        
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(75, 0, 130); // Primary color
        doc.text(company.name, pageMargin, 30);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        const companyAddress = doc.splitTextToSize(company.address || "", 60);
        doc.text(companyAddress, pageMargin, 37);

        doc.setFontSize(28);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(34, 34, 34);
        doc.text("QUOTATION", pageWidth - pageMargin, 30, { align: "right" });
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`# ${selectedQuotation.quotationNumber}`, pageWidth - pageMargin, 37, { align: "right" });
    
        doc.setDrawColor(75, 0, 130); // Primary color
        doc.setLineWidth(0.5);
        doc.line(pageMargin, 55, pageWidth - pageMargin, 55);

        // Billing Info & Dates
        let yPos = 65;
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("PROPOSAL FOR", pageMargin, yPos);
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(75, 0, 130); // Primary color
        doc.text(client.name, pageMargin, yPos + 7);
    
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        let addressY = yPos + 12;
        if(client.addressLine1) { doc.text(client.addressLine1, pageMargin, addressY); addressY += 5; }
        const cityStateZip = `${client.city || ''} ${client.state || ''} ${client.postalCode || ''}`.trim();
        if(cityStateZip) { doc.text(cityStateZip, pageMargin, addressY); addressY += 5; }
        if(client.country) { doc.text(client.country, pageMargin, addressY); }
        
        const datesX = pageWidth - pageMargin;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text("QUOTATION DATE", datesX, yPos, { align: 'right' });
        doc.text(format(new Date(selectedQuotation.date), "MMMM d, yyyy"), datesX, yPos + 5, { align: 'right' });
        doc.text("EXPIRES ON", datesX, yPos + 12, { align: 'right' });
        doc.text(format(new Date(selectedQuotation.dueDate), "MMMM d, yyyy"), datesX, yPos + 17, { align: 'right' });

        // Items Table
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
            startY: addressY + 15,
            theme: 'plain',
            headStyles: {
                fillColor: [243, 238, 247], // light purple
                textColor: [75, 0, 130], // primary
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

        // Totals Section
        let finalY = (doc as any).lastAutoTable.finalY + 10;
        
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

        const totalsX = pageWidth - pageMargin - 80;
        const totalsValueX = pageWidth - pageMargin;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);

        doc.text("Subtotal:", totalsX, finalY, { align: 'right' });
        doc.text(`${currencySymbol}${subtotal.toFixed(2)}`, totalsValueX, finalY, { align: 'right' });
        finalY += 7;
        
        if (totalDiscount > 0) {
            doc.text(`Discount (${selectedQuotation.discount}%):`, totalsX, finalY, { align: 'right' });
            doc.text(`-${currencySymbol}${totalDiscount.toFixed(2)}`, totalsValueX, finalY, { align: 'right' });
            finalY += 7;
        }

        doc.text(`Tax (${selectedQuotation.tax}%):`, totalsX, finalY, { align: 'right' });
        doc.text(`${currencySymbol}${totalTax.toFixed(2)}`, totalsValueX, finalY, { align: 'right' });
        finalY += 10;

        // Draw Total Amount box
        const totalBoxWidth = 80;
        doc.setFillColor(243, 238, 247); // light purple
        doc.rect(pageWidth - pageMargin - totalBoxWidth, finalY - 5, totalBoxWidth, 10, 'F');
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(75, 0, 130); // primary
        doc.text("Total Amount", pageWidth - pageMargin - totalBoxWidth + 5, finalY);
        doc.text(`${currencySymbol}${selectedQuotation.totalAmount.toFixed(2)}`, totalsValueX, finalY, { align: 'right' });
        
        // Terms and Footer
        let bottomY = doc.internal.pageSize.getHeight() - 15;
        
        // Footer first to determine its height
        const footerText1 = "We appreciate your business!";
        const footerText2 = `${company.name} | ${company.contactEmail || ''} | ${company.website || ''}`;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(footerText1, pageWidth / 2, bottomY, { align: 'center' });
        doc.text(footerText2, pageWidth / 2, bottomY + 4, { align: 'center' });
        
        // Now Terms, positioned above the footer
        if(selectedQuotation.terms) {
            let termsY = finalY + 30;
            const termsText = doc.splitTextToSize(selectedQuotation.terms, pageWidth - (pageMargin * 2));
            const termsHeight = doc.getTextDimensions(termsText).h;
            
            // If terms would overlap footer, move them up.
            if (termsY + termsHeight > bottomY - 10) {
                termsY = bottomY - 10 - termsHeight;
            }

            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(150);
            doc.text("TERMS & CONDITIONS", pageMargin, termsY);

            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text(termsText, pageMargin, termsY + 5);
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

    const getStatusVariant = (status: Quotation['status']): VariantProps<typeof badgeVariants>['variant'] => {
        switch (status) {
          case 'won':
            return 'default' as const
          case 'sent':
            return 'secondary' as const
          case 'lost':
            return 'destructive' as const
          case 'draft':
          default:
            return 'outline' as const
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
                  company={company}
                />
            </DialogContent>
        </Dialog>
      </>
    );
}
