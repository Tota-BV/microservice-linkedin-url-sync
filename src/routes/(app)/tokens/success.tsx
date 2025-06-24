import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Separator } from "@radix-ui/react-separator";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/tokens/success")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container grid gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-start gap-2">
            Payment successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="">
          <h2>
            Thank you for your payment, your tokens will be added to your wallet
          </h2>
        </CardContent>
      </Card>
    </div>
  );
}
