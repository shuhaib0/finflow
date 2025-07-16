
import { Suspense } from 'react';
import SettingsPageComponent from './settings-page-component';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function SettingsPageSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72 mt-2" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-24 w-full" />
                </div>
                 <Skeleton className="h-10 w-24" />
            </CardContent>
        </Card>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<SettingsPageSkeleton />}>
            <SettingsPageComponent />
        </Suspense>
    );
}
