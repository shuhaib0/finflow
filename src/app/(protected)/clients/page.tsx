
"use client"

import { useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { PlusCircle } from "lucide-react"
import { ClientForm } from "./client-form"
import type { Client } from "@/types"
import { useToast } from "@/hooks/use-toast"

const initialClients: Client[] = [
  {
    id: "1",
    name: "Innovate Inc.",
    contactPerson: "John Doe",
    email: "john.doe@innovate.com",
    phone: "123-456-7890",
    status: "customer",
    jobTitle: "CEO",
    salutation: "Mr.",
    gender: "Male",
    leadType: "client",
    requestType: "enquiry",
    mobile: "123-456-7890",
    website: "https://innovate.com",
    whatsapp: "123-456-7890",
    phoneExt: "123",
    addressLine1: "123 Tech Ave",
    addressLine2: "Suite 100",
    city: "Silicon Valley",
    state: "CA",
    postalCode: "94043",
    country: "USA",
    source: "Referral",
    campaign: "Q2 Partner Program",
    notes: "Initial contact made through referral from Existing Corp."
  },
  {
    id: "2",
    name: "Solutions Co.",
    contactPerson: "Jane Smith",
    email: "jane.smith@solutions.com",
    phone: "098-765-4321",
    status: "customer",
  },
  {
    id: "3",
    name: "Future Forward",
    contactPerson: "Sam Wilson",
    email: "sam.wilson@ff.io",
    phone: "555-555-5555",
    status: "lead",
    source: "Website",
  },
  {
    id: "4",
    name: "Legacy Systems",
    contactPerson: "Emily Brown",
    email: "emily.b@legacysys.com",
    phone: "111-222-3333",
    status: "opportunity",
  },
]

type DialogState = 'closed' | 'edit' | 'new';

export default function CrmPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get('status')

  const [clients, setClients] = useState<Client[]>(initialClients)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [dialogState, setDialogState] = useState<DialogState>('closed');

  const filteredClients = useMemo(() => {
    if (!statusFilter) {
      return clients;
    }
    return clients.filter(client => client.status === statusFilter);
  }, [clients, statusFilter]);
  
  const handleOpenDialog = (state: DialogState, client: Client | null = null) => {
    setSelectedClient(client);
    setDialogState(state);
  }

  const handleDeleteClient = (clientId: string) => {
    setClients(clients.filter((client) => client.id !== clientId))
    toast({
      title: "Contact Deleted",
      description: "The contact has been successfully deleted.",
    })
  }

  const handleFormSubmit = (clientData: Omit<Client, "id">) => {
    if (selectedClient) {
      // Editing existing client
      setClients(
        clients.map((c) =>
          c.id === selectedClient.id ? { ...c, ...clientData, id: c.id } : c
        )
      )
      toast({
        title: "Contact Updated",
        description: "The contact details have been updated.",
      })
    } else {
      // Adding new client
      const newClient = {
        ...clientData,
        id: (clients.length + 1).toString(),
      }
      setClients([...clients, newClient])
      toast({
        title: "Contact Created",
        description: "A new contact has been added successfully.",
      })
    }
    setDialogState('closed');
  }

  const getStatusVariant = (status: Client['status']) => {
    switch (status) {
      case 'lead':
        return 'secondary';
      case 'opportunity':
        return 'default';
      case 'customer':
        return 'outline';
      default:
        return 'secondary';
    }
  }

  const getDialogTitle = () => {
    switch (dialogState) {
        case 'edit': return 'Edit Contact';
        case 'new': return 'Add New Contact';
        default: return '';
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
              <div>
                  <CardTitle className="font-headline">Customer Relationship Management</CardTitle>
                  <CardDescription>Manage your contacts and sales pipeline.</CardDescription>
              </div>
              <Button size="sm" className="gap-1" onClick={() => handleOpenDialog('new')}>
                  <PlusCircle className="h-4 w-4" />
                  Add Contact
              </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    {client.name}
                  </TableCell>
                  <TableCell>{client.contactPerson}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusVariant(client.status)}
                      className="capitalize"
                    >
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                        <Button size="sm" variant="outline" onClick={() => handleOpenDialog('edit', client)}>Edit</Button>
                        <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" className="ml-2">Delete</Button>
                        </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the contact
                            and all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteClient(client.id)} className="bg-destructive hover:bg-destructive/90">
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
        </CardContent>
      </Card>

      <Dialog open={dialogState !== 'closed'} onOpenChange={(isOpen) => !isOpen && setDialogState('closed')}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="font-headline">{getDialogTitle()}</DialogTitle>
                <DialogDescription>
                    {dialogState === 'edit' && "Update the contact details below."}
                    {dialogState === 'new' && "Fill in the details below to create a new contact."}
                </DialogDescription>
            </DialogHeader>
            {(dialogState === 'new' || dialogState === 'edit') && (
                <ClientForm 
                  onSubmit={handleFormSubmit}
                  defaultValues={selectedClient} 
                />
            )}
        </DialogContent>
      </Dialog>
    </>
  )
}
