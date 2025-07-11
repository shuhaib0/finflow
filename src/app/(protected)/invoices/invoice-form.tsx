
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { useEffect, useRef } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Trash, Download, Printer } from "lucide-react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { Invoice, InvoiceItem, Client } from "@/types"
import { Separator } from "@/components/ui/separator"
import { InvoiceTemplate } from "./invoice-template"

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required."),
  quantity: z.coerce.number().min(0.01, "Quantity must be positive."),
  unitPrice: z.coerce.number().min(0.01, "Unit price must be positive."),
})

const addressSchema = z.object({
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
})

const formSchema = z.object({
  clientRef: z.string().min(1, "Client is required."),
  status: z.enum(["draft", "sent", "paid", "overdue"]),
  date: z.date({ required_error: "Invoice date is required."}),
  dueDate: z.date({ required_error: "Due date is required."}),
  companyTaxId: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required."),
  discount: z.coerce.number().min(0).optional().default(0),
  tax: z.coerce.number().min(0).optional().default(0),
  billingAddress: addressSchema.optional(),
  terms: z.string().optional(),
  purchaseOrderNumber: z.string().optional(),
})

type InvoiceFormValues = z.infer<typeof formSchema>

type InvoiceFormProps = {
  onSubmit: (values: Omit<Invoice, "id" | "createdAt" | "invoiceNumber">) => void;
  defaultValues?: Invoice | null;
  clients: Client[];
  onClose: () => void;
}

const getInitialValues = (defaultValues?: Invoice | null) => {
    const baseValues = {
        clientRef: "",
        status: "draft" as const,
        date: new Date(),
        dueDate: new Date(),
        items: [{ description: "", quantity: 1, unitPrice: 0 }],
        tax: 0,
        discount: 0,
        companyTaxId: '',
        terms: '',
        purchaseOrderNumber: '',
        billingAddress: {
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            postalCode: '',
            country: '',
        }
    };

    if (defaultValues) {
        return {
            ...baseValues,
            ...defaultValues,
            date: new Date(defaultValues.date), 
            dueDate: new Date(defaultValues.dueDate), 
            items: defaultValues.items.map(item => ({...item})),
            companyTaxId: defaultValues.companyTaxId || '',
            terms: defaultValues.terms || '',
            purchaseOrderNumber: defaultValues.purchaseOrderNumber || '',
            billingAddress: {
                ...baseValues.billingAddress,
                ...defaultValues.billingAddress
            }
        };
    }

    return baseValues;
}

export function InvoiceForm({ onSubmit, defaultValues, clients, onClose }: InvoiceFormProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialValues(defaultValues),
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })
  
  const watchedClientRef = form.watch("clientRef");

  useEffect(() => {
    form.reset(getInitialValues(defaultValues));
  }, [defaultValues, form])

  useEffect(() => {
    if (watchedClientRef) {
        const client = clients.find(c => c.id === watchedClientRef);
        if (client) {
            form.setValue('companyTaxId', client.taxId || '');
            form.setValue('billingAddress', {
                addressLine1: client.addressLine1 || '',
                addressLine2: client.addressLine2 || '',
                city: client.city || '',
                state: client.state || '',
                postalCode: client.postalCode || '',
                country: client.country || '',
            });
        }
    }
  }, [watchedClientRef, clients, form]);

  const calculateTotals = (items: (Partial<InvoiceItem>)[], taxRate: number, discount: number) => {
    const subtotal = items.reduce((acc, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      return acc + (quantity * unitPrice);
    }, 0);
    const discountedSubtotal = subtotal - discount;
    const taxAmount = discountedSubtotal * (taxRate / 100);
    const totalAmount = discountedSubtotal + taxAmount;
    return { subtotal, taxAmount, totalAmount };
  }
  
  const watchedItems = form.watch("items");
  const watchedTax = form.watch("tax");
  const watchedDiscount = form.watch("discount");
  const { subtotal, taxAmount, totalAmount } = calculateTotals(watchedItems, watchedTax || 0, watchedDiscount || 0);

  const handleFormSubmit = (values: InvoiceFormValues) => {
    const { totalAmount: finalTotal } = calculateTotals(values.items, values.tax || 0, values.discount || 0);
    const itemsWithTotal = values.items.map(item => ({
        ...item,
        total: item.quantity * item.unitPrice
    }));
    
    onSubmit({
      ...values,
      date: values.date.toISOString(),
      dueDate: values.dueDate.toISOString(),
      items: itemsWithTotal,
      tax: values.tax || 0,
      discount: values.discount || 0,
      totalAmount: finalTotal,
    })
  }

  const isEditing = !!defaultValues?.id;

  const handleDownloadPdf = async () => {
    const element = invoiceRef.current;
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2 });
    const data = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`invoice-${defaultValues?.invoiceNumber || 'new'}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const clientMap = clients.reduce((acc, client) => {
    acc[client.id] = client;
    return acc;
  }, {} as { [key: string]: Client });
  const currentClient = clientMap[watchedClientRef];


  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col h-full @container">
      <div className="flex items-center justify-between p-6 border-b non-printable">
        <div>
          <h2 className="text-2xl font-headline font-semibold">{isEditing ? `Edit Invoice ${defaultValues?.invoiceNumber}` : "New Invoice"}</h2>
          <p className="text-muted-foreground text-sm">{isEditing ? "Update the details below." : "Fill in the details to create a new invoice."}</p>
        </div>
        <div className="flex items-center gap-2">
            {isEditing && (
              <>
                <Button type="button" variant="outline" size="sm" onClick={handleDownloadPdf}><Download className="mr-2 h-4 w-4" /> PDF</Button>
                <Button type="button" variant="outline" size="sm" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>
              </>
            )}
            <Button type="submit">
                {isEditing ? "Save Changes" : "Create Invoice"}
            </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4 non-printable">
      <Tabs defaultValue="details" className="w-full mb-6">
            <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="address">Address & Contact</TabsTrigger>
                <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
                <TabsTrigger value="more-info">More Info</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-6">
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
                                {clients.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="companyTaxId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Company Tax ID</FormLabel>
                                <FormControl><Input placeholder="e.g., GST12345" {...field} /></FormControl>
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
                    <div /> 
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Invoice Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={"outline"}
                                        className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
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
                                        className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <Separator className="my-6" />
        
                <div>
                    <h3 className="text-lg font-medium mb-2">Particulars</h3>
                    <div className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-2 p-3 border rounded-md">
                            <div className="grid flex-1 gap-2">
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.description`}
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className={cn(index !== 0 && "sr-only")}>Description</FormLabel>
                                        <FormControl><Input {...field} placeholder="Item description" /></FormControl>
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
                                        <FormControl><Input type="number" {...field} placeholder="1"/></FormControl>
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
                                        <FormControl><Input type="number" {...field} placeholder="100.00" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                <Trash className="h-4 w-4" /><span className="sr-only">Remove item</span>
                            </Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}>
                        Add Item
                    </Button>
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="address" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="billingAddress.addressLine1"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2"><FormLabel>Billing Address</FormLabel><FormControl><Input placeholder="Line 1" {...field} /></FormControl><FormMessage /></FormItem>
                        )}
                    />
                    <FormField control={form.control} name="billingAddress.addressLine2" render={({ field }) => (<FormItem><FormControl><Input placeholder="Line 2" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="billingAddress.city" render={({ field }) => (<FormItem><FormControl><Input placeholder="City" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="billingAddress.state" render={({ field }) => (<FormItem><FormControl><Input placeholder="State" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="billingAddress.postalCode" render={({ field }) => (<FormItem><FormControl><Input placeholder="Postal Code" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="billingAddress.country" render={({ field }) => (<FormItem><FormControl><Input placeholder="Country" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
            </TabsContent>
            <TabsContent value="terms" className="mt-4">
                <FormField
                    control={form.control}
                    name="terms"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Terms and Conditions</FormLabel>
                            <FormControl><Textarea placeholder="e.g., Payment is due within 30 days." {...field} rows={5} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </TabsContent>
            <TabsContent value="more-info" className="mt-4">
                 <FormField
                    control={form.control}
                    name="purchaseOrderNumber"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Purchase Order (PO) Number</FormLabel>
                            <FormControl><Input placeholder="Enter PO Number" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </TabsContent>
        </Tabs>
        
        <div className="flex justify-end mt-6">
            <div className="w-80 space-y-2">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <FormField
                        control={form.control}
                        name="discount"
                        render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                                <FormLabel className="text-sm">Discount ($)</FormLabel>
                                <FormControl><Input type="number" {...field} className="w-24 h-8" placeholder="0.00" /></FormControl>
                            </FormItem>
                        )}
                    />
                    <span>-${(Number(form.getValues("discount")) || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <FormField
                        control={form.control}
                        name="tax"
                        render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                                <FormLabel className="text-sm">Tax (%)</FormLabel>
                                <FormControl><Input type="number" {...field} className="w-20 h-8" placeholder="0" /></FormControl>
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
        
        </div>
      </form>
    </Form>
    <div className="hidden print:block">
      <div ref={invoiceRef}>
        <InvoiceTemplate 
          invoice={defaultValues ? {
            ...defaultValues,
            ...form.getValues(),
            totalAmount: totalAmount,
            client: currentClient,
          } : {
            ...getInitialValues(),
            ...form.getValues(),
            totalAmount: totalAmount,
            client: currentClient
          }}
        />
      </div>
    </div>
    </>
  )
}
