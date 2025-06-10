import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTRPC } from "@/lib/trpc/react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";

export const Route = createFileRoute("/(app)/complaince-and-verification/")({
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const form = useForm();

  const uploadDocuments = useMutation(
    trpc.agency.uploadDocuments.mutationOptions(),
  );

  const onSubmit = (values) => {
    console.log(values);

    const formData = new FormData();

    formData.append("businessRegistration", values.businessRegistration[0]);
    // formData.append("bankAccount", values.bankAccount[0]);
    // formData.append("customersScreening", values.customersScreening[0]);
    // formData.append("taxVerification", values.taxVerification[0]);

    console.log([...formData.values()]);

    uploadDocuments.mutate(formData);
  };

  return (
    <div className="container grid gap-8">
      <div className="flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl">Verification & Compliance</h1>
        <span>drop a file</span>
      </div>

      {/* <Card>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-2 gap-4"
            >
              <div className="grid w-full items-center gap-2">
                <FormItem>
                  <FormLabel>Business registration</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      {...form.register("businessRegistration")}
                    />
                  </FormControl>
                  <FormDescription>Lorem ipsum dolor sit amet</FormDescription>
                  <FormMessage />
                </FormItem>
              </div>
              <div className="grid w-full items-center gap-2">
                <FormField
                  control={form.control}
                  name="bankAccount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank account</FormLabel>
                      <FormControl>
                        <Input type="file" {...field} />
                      </FormControl>
                      <FormDescription>
                        Lorem ipsum dolor sit amet
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid w-full items-center gap-2">
                <FormField
                  control={form.control}
                  name="customersScreening"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customers screening</FormLabel>
                      <FormControl>
                        <Input type="file" {...field} />
                      </FormControl>
                      <FormDescription>
                        Lorem ipsum dolor sit amet
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid w-full items-center gap-2">
                <FormField
                  control={form.control}
                  name="taxVerification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax verification</FormLabel>
                      <FormControl>
                        <Input type="file" {...field} />
                      </FormControl>
                      <FormDescription>
                        Lorem ipsum dolor sit amet
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <Button>Save</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card> */}
    </div>
  );
}
