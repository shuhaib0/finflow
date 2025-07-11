
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect, useState, useRef } from "react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import type { Client, Note } from "@/types"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"

const formSchema = z.object({
  // General
  name: z.string().min(1, "Company name is required."),
  firstName: z.string().min(1, "First name is required."),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  jobTitle: z.string().optional(),
  salutation: z.string().optional(),
  gender: z.string().optional(),
  status: z.enum(["lead", "opportunity", "customer"]),
  opportunityWorth: z.coerce.number().optional(),
  leadType: z.string().optional(),
  requestType: z.string().optional(),
  requestTypeOther: z.string().optional(),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  mobile: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  whatsapp: z.string().optional(),
  phoneExt: z.string().optional(),
  // Address
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  // Analytics
  source: z.string().optional(),
  campaign: z.string().optional(),
  // Notes
  newNote: z.string().optional(),
  notes: z.array(z.object({
    content: z.string(),
    author: z.string(),
    createdAt: z.string(),
  })).optional(),
}).transform(data => ({
    ...data,
    contactPerson: `${data.firstName} ${data.middleName || ''} ${data.lastName || ''}`.replace(/\s+/g, ' ').trim()
})).refine(data => {
    if (data.requestType === 'other') return !!data.requestTypeOther && data.requestTypeOther.length > 0;
    return true;
}, { message: "Please specify the 'other' request type.", path: ["requestTypeOther"]});

type ClientFormValues = z.infer<typeof formSchema>

type ClientFormProps = {
  onSubmit: (values: Omit<Client, "id" | "contactPerson" | "notes"> & { contactPerson: string, newNote?: string }) => void;
  onStatusChange: (status: 'opportunity' | 'customer', worth?: number) => void;
  defaultValues?: Client | null;
  isEditing: boolean;
}

const parseContactPerson = (contactPerson?: string) => {
    if (!contactPerson) return { firstName: '', middleName: '', lastName: '' };
    const parts = contactPerson.split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.length > 1 ? parts[parts.length - 1] : '';
    const middleName = parts.slice(1, -1).join(' ');
    return { firstName, middleName, lastName };
}


export function ClientForm({ onSubmit, onStatusChange, defaultValues, isEditing }: ClientFormProps) {
    const router = useRouter();
    const [opportunityWorth, setOpportunityWorth] = useState("");
    const opportunityAlertDialogTrigger = useRef<HTMLButtonElement>(null);

    const { firstName, middleName, lastName } = parseContactPerson(defaultValues?.contactPerson);

    const form = useForm<ClientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      salutation: "",
      firstName: "",
      middleName: "",
      lastName: "",
      jobTitle: "",
      gender: "",
      status: "lead",
      opportunityWorth: 0,
      leadType: "",
      requestType: "",
      requestTypeOther: "",
      email: "",
      mobile: "",
      phone: "",
      website: "",
      whatsapp: "",
      phoneExt: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      source: "",
      campaign: "",
      newNote: "",
      notes: [],
      ...defaultValues,
      firstName: defaultValues ? firstName : "",
      middleName: defaultValues ? middleName : "",
      lastName: defaultValues ? lastName : "",
    },
  })

  useEffect(() => {
    const { firstName, middleName, lastName } = parseContactPerson(defaultValues?.contactPerson);
    form.reset({
        name: "",
        salutation: "",
        firstName: "",
        middleName: "",
        lastName: "",
        jobTitle: "",
        gender: "",
        status: "lead",
        opportunityWorth: 0,
        leadType: "",
        requestType: "",
        requestTypeOther: "",
        email: "",
        mobile: "",
        phone: "",
        website: "",
        whatsapp: "",
        phoneExt: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
        source: "",
        campaign: "",
        newNote: "",
        notes: [],
        ...defaultValues,
        firstName: defaultValues ? firstName : "",
        middleName: defaultValues ? middleName : "",
        lastName: defaultValues ? lastName : "",
    })
  }, [defaultValues, form])

  const watchedRequestType = form.watch("requestType");
  const existingNotes = form.watch("notes") || [];

  const handleCreateQuotation = () => {
    if (defaultValues) {
        router.push(`/quotations?createForClient=${defaultValues.id}`)
    }
  }
  const handleCreateOpportunityConfirm = () => {
    onStatusChange('opportunity', parseFloat(opportunityWorth));
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="address">Address</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                            <Input placeholder="Innovate Inc." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={form.control}
                        name="jobTitle"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Job Title</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., CEO" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <FormField
                    control={form.control}
                    name="salutation"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Salutation</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Mr, Mrs" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Male, Female" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                            <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Status *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select contact status" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <SelectItem value="lead">Lead</SelectItem>
                                <SelectItem value="opportunity">Opportunity</SelectItem>
                                <SelectItem value="customer">Customer</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                    control={form.control}
                    name="middleName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Middle Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Michael" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={form.control}
                        name="leadType"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Lead Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select lead type" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="client">Client</SelectItem>
                                    <SelectItem value="partner">Partner</SelectItem>
                                    <SelectItem value="consultant">Consultant</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={form.control}
                        name="requestType"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Request Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select request type" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="enquiry">Enquiry</SelectItem>
                                    <SelectItem value="rfi">Request for Information</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    {watchedRequestType === 'other' && (
                        <FormField
                            control={form.control}
                            name="requestTypeOther"
                            render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>Please specify</FormLabel>
                                <FormControl>
                                <Textarea placeholder="Describe the request..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    )}
                    {form.getValues('status') === 'opportunity' && (
                         <FormField
                            control={form.control}
                            name="opportunityWorth"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Opportunity Worth</FormLabel>
                                <FormControl>
                                <Input type="number" placeholder="e.g. 5000" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    )}
                </div>
                 <div className="space-y-4 pt-8">
                    <h3 className="text-lg font-medium">Contact Info</h3>
                    <Separator/>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 pt-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="contact@innovate.com" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="mobile"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Mobile No</FormLabel>
                                <FormControl>
                                    <Input placeholder="123-456-7890" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                    <Input placeholder="123-456-7890" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="website"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Website</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://innovate.com" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="whatsapp"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>WhatsApp</FormLabel>
                                <FormControl>
                                    <Input placeholder="123-456-7890" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phoneExt"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Phone Ext.</FormLabel>
                                <FormControl>
                                    <Input placeholder="123" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="address" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <FormField
                        control={form.control}
                        name="addressLine1"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>Address Line 1</FormLabel>
                                <FormControl>
                                    <Input placeholder="123 Main St" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="addressLine2"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>Address Line 2</FormLabel>
                                <FormControl>
                                    <Input placeholder="Suite 400" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                    <Input placeholder="New York" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>State / Province</FormLabel>
                                <FormControl>
                                    <Input placeholder="NY" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="postalCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Postal Code</FormLabel>
                                <FormControl>
                                    <Input placeholder="10001" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Country</FormLabel>
                                <FormControl>
                                    <Input placeholder="USA" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </TabsContent>
            <TabsContent value="analytics" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <FormField
                        control={form.control}
                        name="source"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Source</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., Website, Referral" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="campaign"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Campaign</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., Summer 2024 Promo" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </TabsContent>
            <TabsContent value="notes" className="mt-6">
                <div className="space-y-4">
                    {existingNotes.length > 0 && (
                        <div className="space-y-4">
                             <h3 className="text-lg font-medium">Notes History</h3>
                            <ScrollArea className="h-48 w-full rounded-md border p-4">
                                {existingNotes.map((note, index) => (
                                <div key={index} className="mb-4">
                                    <p className="text-sm">{note.content}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        By {note.author} on {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
                                    </p>
                                    {index < existingNotes.length -1 && <Separator className="mt-2" />}
                                </div>
                                ))}
                            </ScrollArea>
                        </div>
                    )}
                    <FormField
                        control={form.control}
                        name="newNote"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{existingNotes.length > 0 ? 'Add a new note' : 'Add a note'}</FormLabel>
                            <FormControl>
                            <Textarea placeholder="Add a note..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </TabsContent>
        </Tabs>
        </div>
        <div className="p-6 border-t flex justify-end gap-2">
            {isEditing && (
                <AlertDialog>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button type="button" variant="outline">Create</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <AlertDialogTrigger asChild ref={opportunityAlertDialogTrigger}>
                                <DropdownMenuItem>Opportunity</DropdownMenuItem>
                            </AlertDialogTrigger>
                            <DropdownMenuItem onClick={() => onStatusChange('customer')}>
                                Customer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleCreateQuotation}>
                                Quotation
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Create Opportunity</AlertDialogTitle>
                        <AlertDialogDescription>
                            Enter the estimated worth of this opportunity.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <Input 
                            type="number"
                            placeholder="e.g., 5000.00"
                            value={opportunityWorth}
                            onChange={(e) => setOpportunityWorth(e.target.value)}
                            className="mt-2"
                        />
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCreateOpportunityConfirm}>
                            Create
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
            <Button type="submit">
                {isEditing ? "Save" : "Create"}
            </Button>
        </div>
      </form>
    </Form>
  )
}

    