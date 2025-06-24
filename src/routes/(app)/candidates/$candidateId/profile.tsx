import { Education } from "@/features/candidates/profile/ui/education";
import { Experience } from "@/features/candidates/profile/ui/experience";
import { Skills } from "@/features/candidates/profile/ui/skills";
import { Summary } from "@/features/candidates/profile/ui/summary";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/candidates/$candidateId/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="-mx-6 grid grid-cols-12 gap-4">
      <div className="col-span-8 flex flex-col">
        <Summary />
        <Skills />
        <Experience />
        <Education />
      </div>
    </div>
  );
}
