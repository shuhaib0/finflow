
"use client"

import { useState, useEffect, useMemo } from 'react'
import { subDays, format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { Calendar as CalendarIcon, DollarSign, TrendingUp, TrendingDown, Landmark, Receipt } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

import type { Invoice, Transaction } from '@/types'
import { getInvoices } from '@/services/invoiceService'
import { getTransactions } from '@/services/transactionService'
import { useAuth } from '@/app/(protected)/auth-provider"
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'


export default function ReportsPageComponent() {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [date, setDate] = useState<DateRange | undefined>({
      from: subDays(new Date(), 29),
      to: new Date(),
    })
    const { user, loading: authLoading } = useAuth()
    const { toast } = useToast()
    
    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setLoading(false);
            return;
        }

        async function fetchData() {
            setLoading(true)
            try {
                const [invoicesData, transactionsData] = await Promise.all([
                    getInvoices(user.uid),
                    getTransactions(user.uid)
                ]);
                setInvoices(invoicesData);
                setTransactions(transactionsData);
            } catch (error) {
                console.error("Failed to fetch financial data:", error)
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not load financial data for reports.",
                })
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [user, authLoading, toast]);

    const filteredData = useMemo(() => {
        const from = date?.from ? new Date(date.from.setHours(0, 0, 0, 0)) : new Date(0);
        const to = date?.to ? new Date(date.to.setHours(23, 59, 59, 999)) : new Date();

        const filteredInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= from && invDate <= to && inv.status === 'paid';
        });

        const filteredTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= from && tDate <= to;
        });

        return { filteredInvoices, filteredTransactions };
    }, [invoices, transactions, date]);

    const reportData = useMemo(() => {
        const { filteredInvoices, filteredTransactions } = filteredData;

        const totalRevenue = filteredInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
        const otherIncome = filteredTransactions
            .filter(t => t.type === 'income' && t.source !== 'Invoice Payment')
            .reduce((acc, t) => acc + t.amount, 0);

        const totalIncome = totalRevenue + otherIncome;

        const totalExpenses = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => acc + t.amount, 0);

        const netProfit = totalIncome - totalExpenses;

        const combinedTransactions = [
            ...filteredInvoices.map(inv => ({
                id: inv.id,
                date: inv.date,
                description: `Invoice ${inv.invoiceNumber}`,
                category: 'Revenue',
                amount: inv.totalAmount,
                type: 'income' as const
            })),
            ...filteredTransactions.map(t => ({
                id: t.id,
                date: t.date,
                description: t.type === 'income' ? t.source : (t.vendor || t.category),
                category: t.type === 'income' ? 'Income' : t.category,
                amount: t.amount,
                type: t.type
            }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


        return { totalIncome, totalExpenses, netProfit, combinedTransactions };
    }, [filteredData]);

    const chartData = useMemo(() => {
        const { filteredInvoices, filteredTransactions } = filteredData;
        const dataMap: { [key: string]: { income: number, expenses: number } } = {};

        const addData = (dateStr: string, amount: number, type: 'income' | 'expense') => {
            const month = format(new Date(dateStr), 'MMM yy');
            if (!dataMap[month]) {
                dataMap[month] = { income: 0, expenses: 0 };
            }
            if (type === 'income') {
                dataMap[month].income += amount;
            } else {
                dataMap[month].expenses += amount;
            }
        };

        filteredInvoices.forEach(inv => addData(inv.date, inv.totalAmount, 'income'));
        filteredTransactions.forEach(t => addData(t.date, t.amount, t.type));

        return Object.entries(dataMap).map(([name, values]) => ({ name, ...values }));
    }, [filteredData]);
    
    if (loading || authLoading) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <Skeleton className="h-7 w-48" />
                            <Skeleton className="h-4 w-72 mt-2" />
                        </div>
                        <Skeleton className="h-9 w-64" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Skeleton className="h-28 w-full" />
                        <Skeleton className="h-28 w-full" />
                        <Skeleton className="h-28 w-full" />
                    </div>
                    <Skeleton className="h-96 w-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-headline">Financial Reports</h1>
                    <p className="text-muted-foreground">Analyze your business performance.</p>
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn("w-full sm:w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                        date.to ? (
                            <>
                            {format(date.from, "LLL dd, y")} -{" "}
                            {format(date.to, "LLL dd, y")}
                            </>
                        ) : (
                            format(date.from, "LLL dd, y")
                        )
                        ) : (
                        <span>Pick a date</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                    />
                    </PopoverContent>
                </Popover>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(reportData.totalIncome)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(reportData.totalExpenses)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${reportData.netProfit >= 0 ? 'text-foreground' : 'text-red-600'}`}>
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(reportData.netProfit)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Income vs. Expenses</CardTitle>
                    <CardDescription>A monthly breakdown of your cash flow.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`}/>
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}/>
                            <Bar dataKey="income" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Income" />
                            <Bar dataKey="expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Expenses" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Transaction History</CardTitle>
                    <CardDescription>A detailed list of all transactions in the selected period.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.combinedTransactions.length > 0 ? (
                                reportData.combinedTransactions.map(t => (
                                    <TableRow key={t.id}>
                                        <TableCell>{format(new Date(t.date), 'MMM d, yyyy')}</TableCell>
                                        <TableCell className="font-medium">{t.description}</TableCell>
                                        <TableCell><Badge variant="outline" className="capitalize">{t.category}</Badge></TableCell>
                                        <TableCell className={`text-right font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {t.type === 'income' ? '+' : '-'}
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(t.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">No transactions in this period.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

