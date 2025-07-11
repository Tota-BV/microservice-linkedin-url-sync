import { Availabillty } from "@/features/candidates/matching-criteria/ui/availibility";
import { HoursPerWeek } from "@/features/candidates/matching-criteria/ui/hours-per-week";
import { Languages } from "@/features/candidates/matching-criteria/ui/languages";
import { PriceRange } from "@/features/candidates/matching-criteria/ui/price-range";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/(app)/candidates/$candidateId/matching-criteria",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="-mx-6 grid grid-cols-12 gap-4">
      <div className="col-span-6 flex flex-col">
        <Availabillty />
        <PriceRange />
        <Languages />
        <HoursPerWeek />
      </div>
    </div>
  );
}
