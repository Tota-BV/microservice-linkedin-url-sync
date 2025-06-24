import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { InvoicesTable } from "@/features/invoices/table/ui/table";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/invoices/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Invoices</h1>
      </div>

      {/* Actions Bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          {/* <Button variant="outline">
            <MoreHorizontalIcon className="w-4 h-4 mr-2" />
            Actions
          </Button> */}
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            // onClick={() => navigate({ to: "/candidates/bulk-upload" })}
          >
            Download
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoicesTable />
        </CardContent>
      </Card>
    </div>
  );
}
