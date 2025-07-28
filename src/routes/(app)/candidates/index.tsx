import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CandidateTable } from "@/features/candidates/table/ui/table";

export const Route = createFileRoute("/(app)/candidates/")({
	component: CandidatesPage,
});

function CandidatesPage() {
	const navigate = useNavigate();

	return (
		<div className="container mx-auto p-6 grid gap-4">
			<h1 className="font-bold text-3xl">Candidates</h1>

			<div className="flex items-center justify-between">
				<div />

				<Button onClick={() => navigate({ to: "/candidates/add" })}>
					<PlusIcon />
					Add candidates
				</Button>
			</div>

			<Card>
				<CardContent>
					<CandidateTable />
				</CardContent>
			</Card>
		</div>
	);
}
