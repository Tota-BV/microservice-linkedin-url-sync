import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2Icon, CheckCircleIcon, CheckIcon } from "lucide-react";

export const Route = createFileRoute("/(app)/welcome")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-display">
            Welcome to Tota
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Building Trust Between Western Enterprises and Global Tech Talent
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col gap-4">
          <p>
            The Tota network enables Western companies to work with
            international agencies that are screened and validated by EU
            Standards.
          </p>
          <div className="grid grid-cols-12">
            <div className="flex flex-col col-span-4 gap-4">
              <span className="font-display">Western companies</span>
              <div className="flex flex-col gap-2">
                <ul className="space-y-3 text-sm/6 text-gray-600">
                  <li className="flex gap-x-3">
                    <CheckCircle2Icon color="green" />
                    Demand exceeds Western supply
                  </li>
                  <li className="flex gap-x-3">
                    <CheckCircle2Icon color="green" />
                    Only verified and compliant agencies
                  </li>
                  <li className="flex gap-x-3">
                    <CheckCircle2Icon color="green" />
                    No more spam by agencies
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex flex-col gap-4 col-span-4">
              <span className="font-display">International Agencies</span>
              <div className="flex flex-col gap-2">
                <ul className="space-y-3 text-sm/6 text-gray-600">
                  <li className="flex gap-x-3">
                    <CheckCircle2Icon color="green" />
                    Access to Western Enterprises
                  </li>
                  <li className="flex gap-x-3">
                    <CheckCircle2Icon color="green" />
                    Talent protection - closed marketplace
                  </li>
                  <li className="flex gap-x-3">
                    <CheckCircle2Icon color="green" />
                    Pay for succes only
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-display">
            Start in 3 steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-none space-y-3 text-gray-600">
            <li
              data-number="1"
              className="relative pl-12 flex items-center before:content-[attr(data-number)] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:flex before:items-center before:justify-center before:w-8 before:h-8 before:rounded-full before:bg-primary before:text-white before:text-base before:font-medium"
            >
              Access to Western Enterprises
            </li>
            <li
              data-number="2"
              className="relative pl-12 flex items-center before:content-[attr(data-number)] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:flex before:items-center before:justify-center before:w-8 before:h-8 before:rounded-full before:bg-primary before:text-white before:text-base before:font-medium"
            >
              Talent protection - closed marketplace
            </li>
            <li
              data-number="3"
              className="relative pl-12 flex items-center before:content-[attr(data-number)] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:flex before:items-center before:justify-center before:w-8 before:h-8 before:rounded-full before:bg-primary before:text-white before:text-base before:font-medium"
            >
              Pay for success only
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
