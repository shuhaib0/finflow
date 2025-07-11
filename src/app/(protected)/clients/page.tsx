
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
import { MoreHorizontal, PlusCircle } from "lucide-react"
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

export default function CrmPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get('status')

  const [clients, setClients] = useState<Client[]>(initialClients)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const filteredClients = useMemo(() => {
    if (!statusFilter) {
      return clients;
    }
    return clients.filter(client => client.status === statusFilter);
  }, [clients, statusFilter]);

  const handleAddClient = () => {
    setSelectedClient(null)
    setIsSheetOpen(true)
  }

  const handleEditClient = (client: Client) => {
    setSelectedClient(client)
    setIsSheetOpen(true)
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
    setIsSheetOpen(false)
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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
              <div>
                  <CardTitle className="font-headline">Customer Relationship Management</CardTitle>
                  <CardDescription>Manage your contacts and sales pipeline.</CardDescription>
              </div>
              <Button size="sm" className="gap-1" onClick={handleAddClient}>
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
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
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
                  <TableCell>
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => handleEditClient(client)}>Edit</DropdownMenuItem>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:w-full sm:max-w-full lg:max-w-4xl overflow-y-auto">
            <SheetHeader>
                <SheetTitle className="font-headline">{selectedClient ? "Edit Contact" : "Add New Contact"}</SheetTitle>
                <SheetDescription>
                    {selectedClient ? "Update the contact details below." : "Fill in the details below to create a new contact."}
                </SheetDescription>
            </SheetHeader>
            <ClientForm 
              onSubmit={handleFormSubmit}
              defaultValues={selectedClient} 
            />
        </SheetContent>
      </Sheet>
    </>
  )
}
