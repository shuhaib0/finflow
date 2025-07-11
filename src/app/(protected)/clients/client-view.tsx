
"use client"

import type { Client } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"

type ClientViewProps = {
  client: Client;
  onEdit: () => void;
}

const DetailItem = ({ label, value }: { label: string, value?: string | null }) => (
    <div className="flex flex-col">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-base font-medium">{value || "N/A"}</p>
    </div>
)

export function ClientView({ client, onEdit }: ClientViewProps) {
  return (
    <div className="space-y-6 py-6">
        <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="address">Address</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="mt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6">
                    <DetailItem label="Company Name" value={client.name} />
                    <DetailItem label="Contact Person" value={client.contactPerson} />
                    <DetailItem label="Job Title" value={client.jobTitle} />
                    <DetailItem label="Status" value={client.status} />
                    <DetailItem label="Lead Type" value={client.leadType} />
                    <DetailItem label="Request Type" value={client.requestType} />
                    {client.requestType === 'other' && (
                        <div className="col-span-full">
                            <DetailItem label="Other Request Details" value={client.requestTypeOther} />
                        </div>
                    )}
                </div>
                 <div className="space-y-4 pt-8">
                    <h3 className="text-lg font-medium">Contact Info</h3>
                    <Separator/>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6 pt-4">
                        <DetailItem label="Email" value={client.email} />
                        <DetailItem label="Mobile" value={client.mobile} />
                        <DetailItem label="Phone" value={client.phone} />
                        <DetailItem label="Website" value={client.website} />
                        <DetailItem label="WhatsApp" value={client.whatsapp} />
                        <DetailItem label="Phone Ext." value={client.phoneExt} />
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="address" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <DetailItem label="Address Line 1" value={client.addressLine1} />
                    <DetailItem label="Address Line 2" value={client.addressLine2} />
                    <DetailItem label="City" value={client.city} />
                    <DetailItem label="State / Province" value={client.state} />
                    <DetailItem label="Postal Code" value={client.postalCode} />
                    <DetailItem label="Country" value={client.country} />
                </div>
            </TabsContent>
            <TabsContent value="analytics" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <DetailItem label="Source" value={client.source} />
                    <DetailItem label="Campaign" value={client.campaign} />
                     <div className="col-span-full">
                        <DetailItem label="Notes" value={client.notes} />
                    </div>
                </div>
            </TabsContent>
        </Tabs>

        <Button onClick={onEdit} className="w-full gap-2">
            <Edit />
            Edit Contact
        </Button>
    </div>
  )
}
