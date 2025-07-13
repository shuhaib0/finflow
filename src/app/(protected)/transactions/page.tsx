
"use client"

import { useState, useEffect } from "react"
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { MoreHorizontal, PlusCircle, TrendingDown, TrendingUp } from "lucide-react"
import type { Transaction, Client } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { TransactionForm } from "./transaction-form"
import { getTransactions, addTransaction, updateTransaction, deleteTransaction } from "@/services/transactionService"
import { getClients } from "@/services/clientService"
import { useAuth } from "../auth-provider"
import { Skeleton } from "@/components/ui/skeleton"

export default function TransactionsPage() {
    const { toast } = useToast()
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [clientNames, setClientNames] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(true);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const { user } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [transactionsData, clientsData] = await Promise.all([
                    getTransactions(),
                    getClients(),
                ]);
                
                setTransactions(transactionsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                setClients(clientsData);

                const nameMap = clientsData.reduce((acc, client) => {
                    acc[client.id] = client.name;
                    return acc;
                }, {} as { [key: string]: string });
                setClientNames(nameMap);

            } catch (error) {
                console.error("Failed to fetch data:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not load transactions or client data.",
                });
            } finally {
                setLoading(false);
            }
        };

        if(user){
            fetchData();
        } else {
            setLoading(false);
        }
    }, [user, toast]);

    const handleAddTransaction = () => {
        setSelectedTransaction(null)
        setIsDialogOpen(true)
    }
    
    const handleEditTransaction = (transaction: Transaction) => {
        setSelectedTransaction(transaction)
        setIsDialogOpen(true)
    }

    const handleDeleteTransaction = async (transactionId: string) => {
        if (!user) {
            toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to delete a transaction." });
            return;
        }
        try {
            await deleteTransaction(transactionId);
            setTransactions(transactions.filter((t) => t.id !== transactionId));
            toast({
                title: "Transaction Deleted",
                description: "The transaction has been successfully deleted.",
            });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete transaction." });
        }
    }

    const handleFormSubmit = async (data: Omit<Transaction, 'id'>) => {
        if (!user) {
            toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to save a transaction." });
            return;
        }
        try {
            if (selectedTransaction) {
                await updateTransaction(selectedTransaction.id, data);
                const updatedTransactions = transactions.map((t) =>
                    t.id === selectedTransaction.id ? { ...selectedTransaction, ...data } : t
                ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setTransactions(updatedTransactions);
                toast({
                    title: "Transaction Updated",
                    description: "The transaction details have been updated.",
                });
            } else {
                const newTransaction = await addTransaction(data);
                setTransactions([...transactions, newTransaction].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                toast({
                    title: "Transaction Added",
                    description: "The new transaction has been added successfully.",
                });
            }
            setIsDialogOpen(false)
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to save transaction." });
        }
    }


    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <Skeleton className="h-7 w-48" />
                            <Skeleton className="h-4 w-64 mt-2" />
                        </div>
                        <Skeleton className="h-9 w-40" />
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
                        <CardTitle className="font-headline">Transactions</CardTitle>
                        <CardDescription>
                            Track your income and expenses.
                        </CardDescription>
                    </div>
                    <Button size="sm" className="gap-1" onClick={handleAddTransaction}>
                        <PlusCircle className="h-4 w-4" />
                        Add Transaction
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {transactions.length > 0 ? (
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Category/Source</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map(t => (
                            <TableRow key={t.id}>
                                <TableCell>
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${t.type === 'income' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                                        {t.type === 'income' ? <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" /> : <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">
                                        {t.type === 'income' ? t.source : t.vendor || 'N/A'}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {t.clientRef && clientNames[t.clientRef] ? `Client: ${clientNames[t.clientRef]}` : ''}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                        {t.type === 'expense' ? t.category : 'Income'}
                                    </Badge>
                                </TableCell>
                                <TableCell>{format(new Date(t.date), 'MMM d, yyyy')}</TableCell>
                                <TableCell className={`text-right font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
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
                                                <DropdownMenuItem onClick={() => handleEditTransaction(t)}>Edit</DropdownMenuItem>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>
                                                </AlertDialogTrigger>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the transaction.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteTransaction(t.id)} className="bg-destructive hover:bg-destructive/90">
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
                    <h3 className="text-lg font-semibold">No Transactions Logged</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                        Click "Add Transaction" to start tracking your finances.
                    </p>
                </div>
                )}
            </CardContent>
        </Card>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-headline">{selectedTransaction ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
                    <DialogDescription>
                        {selectedTransaction ? 'Update the details of your transaction.' : 'Log a new income or expense.'}
                    </DialogDescription>
                </DialogHeader>
                <TransactionForm
                    onSubmit={handleFormSubmit}
                    defaultValues={selectedTransaction}
                    clientNames={clientNames}
                />
            </DialogContent>
        </Dialog>
      </>
    );
}
