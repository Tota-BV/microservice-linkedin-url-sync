import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useTRPC } from "@/lib/trpc/react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";

export const Route = createFileRoute("/(app)/tokens/")({
  component: RouteComponent,
  loader: async ({ context: { trpc, queryClient } }) => {
    const agency = await queryClient.fetchQuery(
      trpc.agency.getAgency.queryOptions(),
    );

    return { agency };
  },
});

function RouteComponent() {
  const { agency } = Route.useLoaderData();
  const trpc = useTRPC();

  const form = useForm<{ tokens: string }>();

  const checkout = useMutation(
    trpc.tokens.createCheckoutSession.mutationOptions(),
  );

  const handleBuyTokens = async (values: { tokens: string }) => {
    const { url } = await checkout.mutateAsync({
      amount: Number(values.tokens),
    });
    if (url) {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="container grid gap-8">
      <h1 className="text-4xl">Tokens</h1>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-start gap-2">Price</CardTitle>
          </CardHeader>
          <CardContent className="">
            <div className="flex flex-col gap-2">
              <div className="line-through w-72 flex justify-between mb-6">
                Regular: <span className="font-bold">&euro;24</span>
              </div>
              <Separator />
              <div className="w-72 flex justify-between">
                Small (up to 10): <span className="font-bold">&euro;21</span>
              </div>
              <Separator />
              <div className="w-72 flex justify-between">
                Medium (up to 50): <span className="font-bold">&euro;20</span>
              </div>
              <Separator />
              <div className="w-72 flex justify-between">
                Large (up to 100): <span className="font-bold">&euro;19</span>
              </div>
              <Separator />
              <div>
                <ul>
                  <li>- 95% higher matchprobability</li>
                  <li>- Discount via trusted partner</li>
                  <li>- Start now</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-start gap-2">Buy tokens</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <div className="w-full flex flex-col gap-4">
              <div>Current tokens: {agency?.tokens.tokenCount ?? 0}</div>
              <Separator />
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleBuyTokens)}
                  className="flex flex-col gap-4"
                >
                  <FormField
                    control={form.control}
                    name="tokens"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Token amount</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button>Buy</Button>
                </form>
              </Form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
