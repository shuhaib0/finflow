
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import type { Income, Expense } from "@/types"

const formSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive("Amount must be positive."),
  date: z.date({ required_error: "Date is required."}),
  source: z.string().optional(),
  category: z.string().optional(),
  vendor: z.string().optional(),
  clientRef: z.string().optional(),
}).refine(data => {
    if (data.type === 'income') return !!data.source && data.source.length > 0;
    return true;
}, { message: "Source is required for income.", path: ["source"]})
.refine(data => {
    if (data.type === 'expense') return !!data.category && data.category.length > 0;
    return true;
}, { message: "Category is required for expenses.", path: ["category"]});

type TransactionFormValues = z.infer<typeof formSchema>
type Transaction = (Income | Expense) & { type: 'income' | 'expense' };


type TransactionFormProps = {
  onSubmit: (values: TransactionFormValues) => void;
  defaultValues?: Transaction | null;
  clientNames: { [key: string]: string };
}

export function TransactionForm({ onSubmit, defaultValues, clientNames }: TransactionFormProps) {
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues 
        ? { ...defaultValues, date: new Date(defaultValues.date) } 
        : {
            type: "expense",
            amount: 0,
            date: new Date(),
            source: "",
            category: "",
            vendor: "",
            clientRef: "",
        },
  });

  const transactionType = form.watch("type");

  useEffect(() => {
    form.reset(defaultValues 
        ? { ...defaultValues, date: new Date(defaultValues.date) } 
        : {
            type: "expense",
            amount: 0,
            date: new Date(),
            source: "",
            category: "",
            vendor: "",
            clientRef: "",
        });
  }, [defaultValues, form]);

  const handleFormSubmit = (data: TransactionFormValues) => {
    const dataToSubmit = { ...data };
    if (dataToSubmit.clientRef === 'none') {
      dataToSubmit.clientRef = '';
    }
    onSubmit(dataToSubmit);
  }


  const isEditing = !!defaultValues;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 py-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Transaction Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-4"
                  disabled={isEditing}
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="expense" />
                    </FormControl>
                    <FormLabel className="font-normal">Expense</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="income" />
                    </FormControl>
                    <FormLabel className="font-normal">Income</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date > new Date()}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        {transactionType === 'income' && (
            <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Source</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Invoice Payment, Sale" {...field} value={field.value || ''}/>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        )}

        {transactionType === 'expense' && (
            <>
            <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="software">Software</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="salaries">Salaries</SelectItem>
                            <SelectItem value="office">Office Supplies</SelectItem>
                            <SelectItem value="travel">Travel</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="vendor"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Vendor (Optional)</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., SaaS Inc." {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            </>
        )}
        
        <FormField
            control={form.control}
            name="clientRef"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Associated Client (Optional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || 'none'}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {Object.entries(clientNames).map(([id, name]) => (
                        <SelectItem key={id} value={id}>{name}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />

        <Button type="submit" className="w-full">
          {isEditing ? "Update Transaction" : "Add Transaction"}
        </Button>
      </form>
    </Form>
  )
}
