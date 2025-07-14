
import { Suspense } from 'react';
import ReportsPageComponent from './reports-page-component';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function ReportsPageSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="font-headline">Financial Reports</CardTitle>
                        <CardDescription>
                            View and analyze your financial reports.
                        </CardDescription>
                    </div>
                    <Skeleton className="h-9 w-64" />
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
                <Skeleton className="h-96 w-full" />
                <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </CardContent>
        </Card>
    );
}


export default function ReportsPage() {
    return (
        <Suspense fallback={<ReportsPageSkeleton />}>
            <ReportsPageComponent />
        </Suspense>
    );
}
