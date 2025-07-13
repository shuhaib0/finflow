
import { Suspense } from 'react';
import InvoicesPageComponent from './invoices-page-component';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { User as FirebaseUser } from 'firebase/auth';

function InvoicesPageSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="font-headline">Invoices</CardTitle>
                        <CardDescription>
                            Create and manage your invoices here.
                        </CardDescription>
                    </div>
                    <Skeleton className="h-9 w-32" />
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

export default function InvoicesPage({ user }: { user: FirebaseUser | null }) {
    return (
        <Suspense fallback={<InvoicesPageSkeleton />}>
            <InvoicesPageComponent user={user} />
        </Suspense>
    );
}
