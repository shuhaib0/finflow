
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { Quotation, InvoiceItem, Client } from "@/types"
import { Separator } from "@/components/ui/separator"

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required."),
  quantity: z.coerce.number().min(0.01, "Quantity must be positive."),
  unitPrice: z.coerce.number().min(0.01, "Unit price must be positive."),
  tax: z.coerce.number().min(0).optional().default(0),
  discount: z.coerce.number().min(0).max(100).optional().default(0),
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
  status: z.enum(["draft", "sent", "won", "lost"]),
  date: z.date({ required_error: "Quotation date is required."}),
  dueDate: z.date({ required_error: "Expiry date is required."}),
  companyTaxId: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required."),
  currency: z.string().min(1, "Currency is required."),
  billingAddress: addressSchema.optional(),
  terms: z.string().optional(),
  purchaseOrderNumber: z.string().optional(),
})

type QuotationFormValues = z.infer<typeof formSchema>

type QuotationFormProps = {
  onSubmit: (values: Omit<Quotation, "id" | "createdAt" | "quotationNumber">) => void;
  defaultValues?: Quotation | null;
  clients: Client[];
  isEditing: boolean;
}

const getInitialValues = (defaultValues?: Quotation | null) => {
    const baseValues = {
        clientRef: "",
        status: "draft" as const,
        date: new Date(),
        dueDate: new Date(),
        items: [{ description: "", quantity: 1, unitPrice: 0, tax: 0, discount: 0 }],
        currency: 'USD',
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
            currency: defaultValues.currency || 'USD',
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

export function QuotationForm({ onSubmit, defaultValues, clients, isEditing }: QuotationFormProps) {
  const form = useForm<QuotationFormValues>({
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

  const calculateTotals = (items: (Partial<InvoiceItem>)[]) => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    items.forEach(item => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        const discountPercent = Number(item.discount) || 0;
        const taxPercent = Number(item.tax) || 0;

        const itemTotal = quantity * unitPrice;
        const discountAmount = itemTotal * (discountPercent / 100);
        const discountedTotal = itemTotal - discountAmount;
        const taxAmount = discountedTotal * (taxPercent / 100);
        
        subtotal += itemTotal;
        totalDiscount += discountAmount;
        totalTax += taxAmount;
    });

    const totalAmount = subtotal - totalDiscount + totalTax;
    return { subtotal, totalTax, totalAmount, totalDiscount };
  }
  
  const allFormValues = form.watch();
  const { subtotal, totalTax, totalAmount, totalDiscount } = calculateTotals(allFormValues.items);

  const handleFormSubmit = (values: QuotationFormValues) => {
    const { totalAmount: finalTotal } = calculateTotals(values.items);
    const itemsWithTotal = values.items.map(item => {
      const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
      const discountAmount = itemTotal * ((item.discount || 0) / 100);
      const discountedTotal = itemTotal - discountAmount;
      const taxAmount = discountedTotal * ((item.tax || 0) / 100);
      return {
          ...item,
          total: discountedTotal + taxAmount
      }
  });
    
    onSubmit({
      ...values,
      date: values.date.toISOString(),
      dueDate: values.dueDate.toISOString(),
      items: itemsWithTotal,
      totalAmount: finalTotal,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col h-full @container">
      
        <div className="p-6 border-b flex justify-end">
            <Button type="submit">
                {isEditing ? "Save Changes" : "Create Quotation"}
            </Button>
        </div>
      <div className="flex-1 overflow-y-auto px-6 py-4">
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
                                <SelectItem value="won">Won</SelectItem>
                                <SelectItem value="lost">Lost</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                    <SelectItem value="GBP">GBP (£)</SelectItem>
                                    <SelectItem value="INR">INR (₹)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Quotation Date</FormLabel>
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
                                <FormLabel>Expiry Date</FormLabel>
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
                      <div key={field.id} className="flex items-start gap-2 p-3 border rounded-md">
                          <div className="flex-1 space-y-2">
                            <FormField
                                control={form.control}
                                name={`items.${index}.description`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="sr-only">Description</FormLabel>
                                    <FormControl><Textarea placeholder="Item description" {...field} rows={1} className="min-h-0" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <div className="flex gap-2">
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.tax`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                        <FormLabel className="sr-only">Tax</FormLabel>
                                        <FormControl><Input type="number" {...field} placeholder="Tax (%)"/></FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.discount`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                        <FormLabel className="sr-only">Discount</FormLabel>
                                        <FormControl><Input type="number" {...field} placeholder="Discount (%)"/></FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                          </div>
                          <div className="grid w-20 gap-2">
                              <FormField
                                  control={form.control}
                                  name={`items.${index}.quantity`}
                                  render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>Qty</FormLabel>
                                      <FormControl><Input type="number" {...field} placeholder="1"/></FormControl>
                                      <FormMessage />
                                  </FormItem>
                                  )}
                              />
                          </div>
                          <div className="grid w-28 gap-2">
                              <FormField
                                  control={form.control}
                                  name={`items.${index}.unitPrice`}
                                  render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>Price</FormLabel>
                                      <FormControl><Input type="number" {...field} placeholder="100.00" /></FormControl>
                                      <FormMessage />
                                  </FormItem>
                                  )}
                              />
                          </div>
                          <div className="pt-7">
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                <Trash className="h-4 w-4" /><span className="sr-only">Remove item</span>
                            </Button>
                          </div>
                      </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ description: "", quantity: 1, unitPrice: 0, tax: 0, discount: 0 })}>
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
                            <FormControl><Textarea placeholder="e.g., This quotation is valid for 30 days." {...field} rows={5} /></FormControl>
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
                            <FormLabel>Reference Number</FormLabel>
                            <FormControl><Input placeholder="Enter a reference number" {...field} /></FormControl>
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
                  <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: allFormValues.currency || 'USD' }).format(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                  <span>Discount</span>
                  <span>-{new Intl.NumberFormat('en-US', { style: 'currency', currency: allFormValues.currency || 'USD' }).format(totalDiscount)}</span>
              </div>
              <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: allFormValues.currency || 'USD' }).format(totalTax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: allFormValues.currency || 'USD' }).format(totalAmount)}</span>
              </div>
            </div>
        </div>
        
        </div>
      </form>
    </Form>
  )
}
