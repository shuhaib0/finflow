
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ClientsPageComponent from './clients-page-component';
import type { User as FirebaseUser } from 'firebase/auth';

function ClientsPageSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle className="font-headline">Customer Relationship Management</CardTitle>
                <CardDescription>Manage your contacts and sales pipeline.</CardDescription>
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


export default function CrmPage({ user }: { user: FirebaseUser | null }) {
    return (
        <Suspense fallback={<ClientsPageSkeleton />}>
            <ClientsPageComponent user={user} />
        </Suspense>
    )
}
