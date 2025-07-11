"use client"

import { useState } from "react"
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
  SheetTrigger,
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
    status: "active",
  },
  {
    id: "2",
    name: "Solutions Co.",
    contactPerson: "Jane Smith",
    email: "jane.smith@solutions.com",
    phone: "098-765-4321",
    status: "active",
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
    status: "inactive",
  },
]

export default function ClientsPage() {
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

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
      title: "Client Deleted",
      description: "The client has been successfully deleted.",
    })
  }

  const handleFormSubmit = (clientData: Omit<Client, "id">) => {
    if (selectedClient) {
      // Update existing client
      setClients(
        clients.map((c) =>
          c.id === selectedClient.id ? { ...c, ...clientData, id: c.id } : c
        )
      )
      toast({
        title: "Client Updated",
        description: "The client details have been updated.",
      })
    } else {
      // Add new client
      const newClient = {
        ...clientData,
        id: (clients.length + 1).toString(),
      }
      setClients([...clients, newClient])
      toast({
        title: "Client Created",
        description: "The new client has been added successfully.",
      })
    }
    setIsSheetOpen(false)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
              <div>
                  <CardTitle className="font-headline">Clients</CardTitle>
                  <CardDescription>Manage your clients and view their details.</CardDescription>
              </div>
              <Button size="sm" className="gap-1" onClick={handleAddClient}>
                  <PlusCircle className="h-4 w-4" />
                  Add Client
              </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.contactPerson}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        client.status === "active"
                          ? "default"
                          : client.status === "lead"
                          ? "secondary"
                          : "destructive"
                      }
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
                            This action cannot be undone. This will permanently delete the client
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
        <SheetContent>
            <SheetHeader>
                <SheetTitle className="font-headline">{selectedClient ? "Edit Client" : "Add New Client"}</SheetTitle>
                <SheetDescription>
                    {selectedClient ? "Update the client details below." : "Fill in the details below to create a new client."}
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
