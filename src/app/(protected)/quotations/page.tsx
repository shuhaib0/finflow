
import { Suspense } from 'react';
import QuotationsPageComponent from './quotations-page-component';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { User as FirebaseUser } from 'firebase/auth';

function QuotationsPageSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="font-headline">Quotations</CardTitle>
                        <CardDescription>
                            Manage your sales quotations and proposals.
                        </CardDescription>
                    </div>
                    <Skeleton className="h-9 w-36" />
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

export default function QuotationsPage({ user }: { user: FirebaseUser | null }) {
    return (
        <Suspense fallback={<QuotationsPageSkeleton />}>
            <QuotationsPageComponent user={user} />
        </Suspense>
    );
}
