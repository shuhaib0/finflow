
"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import type { VariantProps } from "class-variance-authority"
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

import { Badge, badgeVariants } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PlusCircle } from "lucide-react"
import { ClientForm } from "./client-form"
import type { Client, Note } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { getClients, addClient, updateClient, deleteClient } from "@/services/clientService"
import { useAuth } from "../auth-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type DialogState = 'closed' | 'edit' | 'new';

export default function ClientsPageComponent() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get('status')
  
  const [clients, setClients] = useState<Client[]>([])
  const [pageLoading, setPageLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [dialogState, setDialogState] = useState<DialogState>('closed');
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setPageLoading(false);
      return;
    }

    const fetchClients = async () => {
      setPageLoading(true);
      try {
        const clientsData = await getClients(user.uid);
        setClients(clientsData);
      } catch (error) {
        console.error("Failed to fetch clients:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load client data.",
        });
      } finally {
        setPageLoading(false);
      }
    };

    fetchClients();
  }, [user, authLoading, toast]);

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

  const handleDeleteClient = async (clientId: string) => {
    if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to delete a contact." });
        return;
    }
    try {
        await deleteClient(clientId);
        setClients(clients.filter((client) => client.id !== clientId));
        toast({
            title: "Contact Deleted",
            description: "The contact has been successfully deleted.",
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to delete contact.",
        });
    }
  }

  const handleStatusChange = async (status: 'opportunity' | 'customer', worth?: number) => {
    if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to change status." });
        return;
    }
    if (!selectedClient) {
        toast({ variant: "destructive", title: "Error", description: "No client selected." });
        return;
    }

    const updatedClientData: Partial<Client> = {
        status,
        opportunityWorth: status === 'opportunity' ? worth : selectedClient.opportunityWorth,
    };
    
    try {
        await updateClient(selectedClient.id, updatedClientData);
        const updatedClient = { ...selectedClient, ...updatedClientData } as Client;
        setClients(clients.map(c => c.id === selectedClient.id ? updatedClient : c));
        setSelectedClient(updatedClient);
        toast({
            title: `Contact converted to ${status}`,
            description: `${selectedClient.name} is now a ${status}.`,
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to convert contact to ${status}.`,
        });
    }
  }

  const handleFormSubmit = async (clientData: Omit<Client, "id"> & { newNote?: string }) => {
    if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to save a contact." });
        return;
    }
    
    const authorName = user.displayName || "Admin User";
    const { newNote, ...restOfClientData } = clientData;
    const finalClientData = { ...restOfClientData, userId: user.uid };

    try {
        if (selectedClient) { 
          const existingNotes = selectedClient.notes || [];
          const newNoteEntry: Note[] = newNote ? 
            [{ content: newNote, author: authorName, createdAt: new Date().toISOString() }] 
            : [];
          
          const updatedNotes = [...existingNotes, ...newNoteEntry].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          const finalData = { ...finalClientData, notes: updatedNotes };
    
          await updateClient(selectedClient.id, finalData);
          const updatedClientWithNotes = { ...selectedClient, ...finalData, id: selectedClient.id } as Client;
          setClients(clients.map((c) =>
            c.id === selectedClient.id ? updatedClientWithNotes : c
          ));
          setSelectedClient(updatedClientWithNotes);
          toast({
            title: "Contact Updated",
            description: "The contact details have been updated.",
          });
    
        } else {
          const notes: Note[] = newNote ? [{ content: newNote, author: authorName, createdAt: new Date().toISOString() }] : [];
          const newClientData = { ...finalClientData, notes, status: 'lead' as const };
    
          const newClient = await addClient(newClientData);
          setClients([...clients, newClient]);
          setDialogState('closed');
          toast({
            title: "Contact Created",
            description: "A new contact has been added successfully.",
          });
        }
    } catch (error) {
        console.error("Failed to save client:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to create contact.",
        });
    }
  }

  const getStatusVariant = (status: Client['status']): VariantProps<typeof badgeVariants>['variant'] => {
    switch (status) {
      case 'lead':
        return 'secondary' as const;
      case 'opportunity':
        return 'default' as const;
      case 'customer':
        return 'outline' as const;
      default:
        return 'secondary' as const;
    }
  }

  const isEditing = dialogState === 'edit';

  if (pageLoading || authLoading) {
    return (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-7 w-72" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </div>
                <Skeleton className="h-9 w-28" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      );
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
                <TableHead>Opportunity Worth</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell 
                    className="font-medium cursor-pointer hover:underline"
                    onClick={() => handleOpenDialog('edit', client)}
                  >
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
                  <TableCell>
                    {client.status === 'opportunity' && client.opportunityWorth
                      ? `$${client.opportunityWorth.toLocaleString()}`
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
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
        <DialogContent className="sm:max-w-full h-full max-h-full flex flex-col p-0 gap-0">
            <DialogHeader className="p-6 border-b">
                <DialogTitle className="text-2xl font-headline font-semibold">{isEditing ? "Edit Contact" : "Create Contact"}</DialogTitle>
                <DialogDescription>{isEditing ? "Update the contact's details below." : "Fill in the details for the new contact."}</DialogDescription>
            </DialogHeader>
            {(dialogState === 'new' || dialogState === 'edit') && (
                <ClientForm 
                  key={selectedClient?.id || 'new'}
                  onSubmit={handleFormSubmit}
                  onStatusChange={handleStatusChange}
                  defaultValues={selectedClient}
                  isEditing={isEditing}
                />
            )}
        </DialogContent>
      </Dialog>
    </>
  )
}
