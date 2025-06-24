import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { AddCandidateDialog } from "@/features/candidates/add-candidate/ui/add-dialog";
import { CandidateTable } from "@/features/candidates/table/ui/table";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PlusIcon, SearchIcon } from "lucide-react";

export const Route = createFileRoute("/(app)/candidates/")({
  component: CandidatesPage,
});

function CandidatesPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Candidates</h1>
      </div>

      {/* Actions Bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          {/* <Button variant="outline">
            <MoreHorizontalIcon className="w-4 h-4 mr-2" />
            Actions
          </Button> */}
          <div className="relative">
            <SearchIcon className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
            <Input
              placeholder="Search candidates..."
              // value={searchQuery}
              // onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <AddCandidateDialog>
            <Button>
              <PlusIcon />
              Add candidate
            </Button>
          </AddCandidateDialog>
          <Button
            variant="secondary"
            onClick={() => navigate({ to: "/candidates/bulk-upload" })}
          >
            <PlusIcon />
            Bulk upload
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Candidates</CardTitle>
        </CardHeader>
        <CardContent>
          <CandidateTable />
        </CardContent>
      </Card>
    </div>
  );
}
