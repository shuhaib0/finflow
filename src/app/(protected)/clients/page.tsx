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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MoreHorizontal, PlusCircle } from "lucide-react"

import { ClientForm } from "./client-form"
import type { Client } from "@/types"

const clients: Client[] = [
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
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle className="font-headline">Clients</CardTitle>
                <CardDescription>Manage your clients and view their details.</CardDescription>
            </div>
            <Sheet>
                <SheetTrigger asChild>
                    <Button size="sm" className="gap-1">
                        <PlusCircle className="h-4 w-4" />
                        Add Client
                    </Button>
                </SheetTrigger>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle className="font-headline">Add New Client</SheetTitle>
                        <SheetDescription>
                            Fill in the details below to create a new client.
                        </SheetDescription>
                    </SheetHeader>
                    <ClientForm />
                </SheetContent>
            </Sheet>
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
