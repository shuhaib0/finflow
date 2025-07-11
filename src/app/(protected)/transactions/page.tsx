import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";

export default function TransactionsPage() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="font-headline">Transactions</CardTitle>
                        <CardDescription>
                            Track your income and expenses.
                        </CardDescription>
                    </div>
                    <Button size="sm" className="gap-1">
                        <PlusCircle className="h-4 w-4" />
                        Add Transaction
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                    <h3 className="text-lg font-semibold">No Transactions Logged</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                        Click "Add Transaction" to start tracking your finances.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
