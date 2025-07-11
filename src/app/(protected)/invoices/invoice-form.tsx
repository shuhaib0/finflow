"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { useEffect } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
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
import { cn } from "@/lib/utils"
import type { Invoice, InvoiceItem } from "@/types"
import { Separator } from "@/components/ui/separator"

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required."),
  quantity: z.coerce.number().min(0.01, "Quantity must be positive."),
  unitPrice: z.coerce.number().min(0.01, "Unit price must be positive."),
})

const formSchema = z.object({
  clientRef: z.string().min(1, "Client is required."),
  status: z.enum(["draft", "sent", "paid", "overdue"]),
  dueDate: z.date({ required_error: "Due date is required."}),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required."),
  tax: z.coerce.number().min(0).optional().default(0),
})

type InvoiceFormValues = z.infer<typeof formSchema>

type InvoiceFormProps = {
  onSubmit: (values: Omit<Invoice, "id" | "createdAt" | "invoiceNumber">) => void;
  defaultValues?: Invoice | null;
  clientNames: { [key: string]: string };
}

export function InvoiceForm({ onSubmit, defaultValues, clientNames }: InvoiceFormProps) {
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues
      ? {
          ...defaultValues,
          dueDate: new Date(defaultValues.dueDate),
          items: defaultValues.items.map(item => ({...item}))
        }
      : {
          clientRef: "",
          status: "draft",
          dueDate: new Date(),
          items: [{ description: "", quantity: 1, unitPrice: 0 }],
          tax: 0,
        },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  useEffect(() => {
    form.reset(defaultValues
        ? { ...defaultValues, dueDate: new Date(defaultValues.dueDate), items: defaultValues.items.map(item => ({...item})) }
        : {
            clientRef: "",
            status: "draft",
            dueDate: new Date(),
            items: [{ description: "", quantity: 1, unitPrice: 0 }],
            tax: 0,
        });
  }, [defaultValues, form])

  const calculateTotals = (items: (Partial<InvoiceItem>)[], taxRate: number) => {
    const subtotal = items.reduce((acc, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      return acc + (quantity * unitPrice);
    }, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;
    return { subtotal, taxAmount, totalAmount };
  }
  
  const watchedItems = form.watch("items");
  const watchedTax = form.watch("tax");
  const { subtotal, taxAmount, totalAmount } = calculateTotals(watchedItems, watchedTax || 0);

  const handleFormSubmit = (values: InvoiceFormValues) => {
    const { subtotal: finalSubtotal, taxAmount: finalTaxAmount, totalAmount: finalTotal } = calculateTotals(values.items, values.tax || 0);
    const itemsWithTotal = values.items.map(item => ({
        ...item,
        total: item.quantity * item.unitPrice
    }));
    
    onSubmit({
      ...values,
      dueDate: values.dueDate.toISOString(),
      items: itemsWithTotal,
      tax: finalTaxAmount,
      totalAmount: finalTotal,
    })
  }
  

  const isEditing = !!defaultValues;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 py-6 overflow-y-auto max-h-[calc(100vh-10rem)] pr-4">
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="clientRef"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Client</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {Object.entries(clientNames).map(([id, name]) => (
                        <SelectItem key={id} value={id}>{name}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
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
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
            )}
        />
        
        <Separator />

        <div>
            <FormLabel className="text-lg font-medium">Items</FormLabel>
            <div className="space-y-4 mt-2">
            {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2 p-3 border rounded-md">
                     <div className="grid flex-1 gap-2">
                        <FormField
                            control={form.control}
                            name={`items.${index}.description`}
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className={cn(index !== 0 && "sr-only")}>Description</FormLabel>
                                <FormControl>
                                <Input {...field} placeholder="Item description" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                     </div>
                     <div className="grid w-24 gap-2">
                        <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className={cn(index !== 0 && "sr-only")}>Qty</FormLabel>
                                <FormControl>
                                <Input type="number" {...field} placeholder="1"/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                     </div>
                     <div className="grid w-32 gap-2">
                        <FormField
                            control={form.control}
                            name={`items.${index}.unitPrice`}
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className={cn(index !== 0 && "sr-only")}>Price</FormLabel>
                                <FormControl>
                                <Input type="number" {...field} placeholder="100.00" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                     </div>
                     <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Remove item</span>
                     </Button>
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
            >
                Add Item
            </Button>
            </div>
        </div>

        <Separator />
        
        <div className="flex justify-end space-y-2">
            <div className="w-64 space-y-2">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <FormField
                        control={form.control}
                        name="tax"
                        render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                                <FormLabel className="text-sm">Tax (%)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} className="w-20 h-8" placeholder="0" />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <span>${taxAmount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                </div>
            </div>
        </div>

        <Button type="submit" className="w-full">
          {isEditing ? "Update Invoice" : "Create Invoice"}
        </Button>
      </form>
    </Form>
  )
}
