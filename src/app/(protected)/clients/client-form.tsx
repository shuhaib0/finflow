
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect } from "react"

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
import type { Client } from "@/types"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

const formSchema = z.object({
  name: z.string().min(1, "Company name is required."),
  firstName: z.string().min(1, "First name is required."),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  jobTitle: z.string().optional(),
  salutation: z.string().optional(),
  gender: z.string().optional(),
  status: z.enum(["lead", "opportunity", "customer"]),
  leadType: z.string().optional(),
  requestType: z.string().optional(),
  requestTypeOther: z.string().optional(),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  mobile: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  whatsapp: z.string().optional(),
  phoneExt: z.string().optional(),
}).transform(data => ({
    ...data,
    contactPerson: `${data.firstName} ${data.middleName || ''} ${data.lastName || ''}`.replace(/\s+/g, ' ').trim()
})).refine(data => {
    if (data.requestType === 'other') return !!data.requestTypeOther && data.requestTypeOther.length > 0;
    return true;
}, { message: "Please specify the 'other' request type.", path: ["requestTypeOther"]});

type ClientFormValues = z.infer<typeof formSchema>

type ClientFormProps = {
  onSubmit: (values: Omit<Client, "id" | "contactPerson"> & {contactPerson: string}) => void;
  defaultValues?: Client | null;
}

const parseContactPerson = (contactPerson?: string) => {
    if (!contactPerson) return { firstName: '', middleName: '', lastName: '' };
    const parts = contactPerson.split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.length > 1 ? parts[parts.length - 1] : '';
    const middleName = parts.slice(1, -1).join(' ');
    return { firstName, middleName, lastName };
}


export function ClientForm({ onSubmit, defaultValues }: ClientFormProps) {
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
      leadType: "",
      requestType: "",
      requestTypeOther: "",
      email: "",
      mobile: "",
      phone: "",
      website: "",
      whatsapp: "",
      phoneExt: "",
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
        leadType: "",
        requestType: "",
        requestTypeOther: "",
        email: "",
        mobile: "",
        phone: "",
        website: "",
        whatsapp: "",
        phoneExt: "",
        ...defaultValues,
        firstName: defaultValues ? firstName : "",
        middleName: defaultValues ? middleName : "",
        lastName: defaultValues ? lastName : "",
    })
  }, [defaultValues, form])

  const watchedRequestType = form.watch("requestType");
  const isEditing = !!defaultValues;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-6">
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
        </div>

        <div className="space-y-4">
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
        
        <Button type="submit" className="w-full">
          {isEditing ? "Update Contact" : "Create Contact"}
        </Button>
      </form>
    </Form>
  )
}

    