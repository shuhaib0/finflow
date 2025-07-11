import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Financial Reports</CardTitle>
                <CardDescription>
                    View and export your financial reports.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                    <h3 className="text-lg font-semibold">Reports Coming Soon</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                        Advanced financial reporting features are under development.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
