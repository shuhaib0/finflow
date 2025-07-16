
"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/app/(protected)/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { getCompanyDetails, updateCompanyDetails, createCompanyDetails } from "@/services/companyService"
import type { Company } from "@/types"

const websiteRegex = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/;

const formSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters."),
  address: z.string().optional(),
  taxId: z.string().optional(),
  contactEmail: z.string().email("Invalid email address.").optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  website: z.string().refine((val) => !val || websiteRegex.test(val), {
    message: "Please enter a valid website URL (e.g., website.com)",
  }).optional().or(z.literal('')),
  logoUrl: z.string().url().optional().or(z.literal('')),
})

type SettingsFormValues = z.infer<typeof formSchema>

export default function SettingsPageComponent() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      taxId: "",
      contactEmail: "",
      contactPhone: "",
      website: "",
      logoUrl: "",
    },
  })

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }

    async function fetchCompanyDetails() {
      setLoading(true)
      try {
        const companyDetails = await getCompanyDetails(user.uid)
        if (companyDetails) {
          setCompany(companyDetails)
          form.reset(companyDetails)
        } else {
            // If no company details, set default name from user profile
            form.setValue('name', user.displayName ? `${user.displayName}'s Company` : 'My Company');
            form.setValue('contactEmail', user.email || '');
        }
      } catch (error) {
        console.error("Failed to fetch company details:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load your company's data.",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCompanyDetails()
  }, [user, authLoading, toast, form])
  
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !user) {
      return
    }
    const file = event.target.files[0]
    setIsUploading(true)

    try {
      const storage = getStorage()
      const storageRef = ref(storage, `logos/${user.uid}/${file.name}`)
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      form.setValue("logoUrl", downloadURL)
    } catch (error) {
      console.error("Logo upload failed:", error)
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "There was an error uploading your logo.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  async function onSubmit(values: SettingsFormValues) {
    if (!user) return;

    try {
      if (company && company.id) {
        // Update existing company details
        await updateCompanyDetails(company.id, values);
        setCompany({ ...company, ...values });
        toast({
          title: "Settings Saved",
          description: "Your company details have been updated successfully.",
        });
      } else {
        // Create new company details
        const newCompanyData = { ...values, userId: user.uid };
        const newCompany = await createCompanyDetails(newCompanyData);
        setCompany(newCompany);
        toast({
          title: "Company Profile Created",
          description: "Your company details have been saved.",
        });
      }
    } catch (error) {
      console.error("Failed to save company details:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "There was an error saving your settings.",
      });
    }
  }

  if (loading || authLoading) {
    return <SettingsPageSkeleton />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Company Settings</CardTitle>
        <CardDescription>
          Manage your company profile and branding. This information will appear on your invoices and quotations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Company LLC" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea placeholder="123 Main Street, Anytown, USA 12345" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="taxId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax ID / VAT Number</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., US123456789" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                 <div className="space-y-4">
                    <FormLabel>Company Logo</FormLabel>
                    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-6">
                        {form.watch("logoUrl") ? (
                            <Image src={form.watch("logoUrl")!} alt="Company Logo" width={128} height={128} className="h-32 w-32 object-contain rounded-md bg-muted" />
                        ) : (
                            <div className="h-32 w-32 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-sm">No Logo</div>
                        )}
                        <Input id="logo-upload" type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" disabled={isUploading} />
                        <label htmlFor="logo-upload" className="cursor-pointer">
                            <Button type="button" variant="outline" asChild>
                                <span>{isUploading ? "Uploading..." : "Upload Logo"}</span>
                            </Button>
                        </label>
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-medium border-t pt-8">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@yourcompany.com" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(123) 456-7890" {...field} value={field.value || ''} />
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
                        <Input placeholder="yourcompany.com" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}


function SettingsPageSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96 mt-2" />
            </CardHeader>
            <CardContent className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                     <div className="space-y-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                </div>
                <Skeleton className="h-6 w-56" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
                <Skeleton className="h-10 w-32" />
            </CardContent>
        </Card>
    );
}

