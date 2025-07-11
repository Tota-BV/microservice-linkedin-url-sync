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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-bold text-3xl">Candidates</h1>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <SearchIcon className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
            <Input placeholder="Search candidates..." className="w-64 pl-10" />
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
