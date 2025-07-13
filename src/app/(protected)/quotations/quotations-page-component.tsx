
"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
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
import type { Quotation, Client } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import type { User as FirebaseUser } from "firebase/auth"
import { getClients } from "@/services/clientService"


const initialQuotations: Quotation[] = [
    {
      id: "1",
      quotationNumber: "QUO-001",
      clientRef: "3",
      date: new Date(2024, 6, 10).toISOString(),
      items: [{ description: "Initial Consultation", quantity: 1, unitPrice: 500, tax: 10, total: 550 }],
      totalAmount: 550,
      dueDate: new Date(2024, 7, 10).toISOString(),
      status: "sent",
      createdAt: new Date(2024, 6, 10).toISOString(),
    },
    {
        id: "2",
        quotationNumber: "QUO-002",
        clientRef: "4",
        date: new Date(2024, 7, 1).toISOString(),
        items: [{ description: "Enterprise Software License", quantity: 1, unitPrice: 12000, tax: 10, discount: 10, total: 11880 }],
        totalAmount: 11880,
        dueDate: new Date(2024, 8, 1).toISOString(),
        status: "draft",
        createdAt: new Date(2024, 7, 1).toISOString(),
      },
]

type QuotationsPageComponentProps = {
    user: FirebaseUser | null;
}

export default function QuotationsPageComponent({ user }: QuotationsPageComponentProps) {
    const { toast } = useToast()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations)
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const clientsData = await getClients();
                setClients(clientsData);
            } catch (error) {
                console.error("Failed to fetch clients:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not load client data.",
                });
            } finally {
                setLoading(false);
            }
        };

        if(user) {
            fetchClients();
        }
    }, [user, toast]);
    
    const clientMap = useMemo(() => {
        return clients.reduce((acc, client) => {
          acc[client.id] = client;
          return acc;
        }, {} as { [key: string]: Client });
      }, [clients]);

      useEffect(() => {
        if (loading) return;

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
    }, [searchParams, router, loading]);

    const handleAddQuotation = () => {
      setSelectedQuotation(null)
      setIsDialogOpen(true)
    }
  
    const handleEditQuotation = (quotation: Quotation) => {
      setSelectedQuotation(quotation)
      setIsDialogOpen(true)
    }
  
    const handleDeleteQuotation = (quotationId: string) => {
      setQuotations(quotations.filter((q) => q.id !== quotationId))
      toast({
        title: "Quotation Deleted",
        description: "The quotation has been successfully deleted.",
      })
    }

    const handleStatusChange = (quotationId: string, status: 'won' | 'lost') => {
        setQuotations(quotations.map(q => q.id === quotationId ? {...q, status} : q));
        toast({
            title: `Quotation marked as ${status}`,
            description: "The quotation status has been updated."
        })
    }

    const handleConvertToInvoice = (quotation: Quotation) => {
        const { quotationNumber, ...invoiceData } = quotation;
        const fullInvoiceData = { ...invoiceData, quotationRef: quotation.id };
        router.push(`/invoices?fromQuotation=${encodeURIComponent(JSON.stringify(fullInvoiceData))}`);
    }
  
    const handleFormSubmit = (quotationData: Omit<Quotation, "id" | "createdAt" | "quotationNumber">) => {
      if (selectedQuotation && selectedQuotation.id) {
        const updatedQuotation = { ...selectedQuotation, ...quotationData };
        setQuotations(
          quotations.map((q) =>
            q.id === selectedQuotation.id ? updatedQuotation : q
          )
        )
        setSelectedQuotation(updatedQuotation);
        toast({
          title: "Quotation Updated",
          description: "The quotation details have been updated.",
        })
      } else {
        const newQuotation = {
          ...quotationData,
          id: `quo_${Date.now()}`,
          quotationNumber: `QUO-00${quotations.length + 1}`,
          createdAt: new Date().toISOString(),
          status: 'draft' as const,
        }
        setQuotations([...quotations, newQuotation])
        toast({
          title: "Quotation Created",
          description: "The new quotation has been added successfully.",
        })
      }
      setIsDialogOpen(false)
    }

    const getStatusVariant = (status: Quotation['status']) => {
        switch (status) {
          case 'won':
            return 'default' // Green
          case 'sent':
            return 'secondary' // Blue
          case 'lost':
            return 'destructive' // Red
          case 'draft':
          default:
            return 'outline' // Gray
        }
      }

    const isEditing = !!selectedQuotation;
    
    if (loading) {
        return <div>Loading quotations...</div>; // Or a skeleton loader
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="w-screen h-screen max-w-full max-h-full flex flex-col p-0 gap-0 sm:rounded-none">
                <QuotationForm 
                  onSubmit={handleFormSubmit}
                  defaultValues={selectedQuotation}
                  clients={clients}
                  isEditing={isEditing}
                  onClose={() => setIsDialogOpen(false)}
                />
            </DialogContent>
        </Dialog>
      </>
    );
}
