import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Availabillty } from "@/features/candidates/matching-criteria/ui/availibility";
import { createFileRoute } from "@tanstack/react-router";
import { PencilIcon } from "lucide-react";

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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex justify-between">Price range</CardTitle>
            <Button variant="icon" size="icon">
              <PencilIcon />
            </Button>
          </CardHeader>
          <CardContent>
            <span>€60.00 to €80.00</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex justify-between">Languages</CardTitle>
            <Button variant="icon" size="icon">
              <PencilIcon />
            </Button>
          </CardHeader>
          <CardContent>
            <span>Dutch, English</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex justify-between">
              Working hours timezone
            </CardTitle>
            <Button variant="icon" size="icon">
              <PencilIcon />
            </Button>
          </CardHeader>
          <CardContent>
            <span>09:00–17:00 CET</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex justify-between">
              Hours per week
            </CardTitle>
            <Button variant="icon" size="icon">
              <PencilIcon />
            </Button>
          </CardHeader>
          <CardContent>
            <span>32–40 hrs/week</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
