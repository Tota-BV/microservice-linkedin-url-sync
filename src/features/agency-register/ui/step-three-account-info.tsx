import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Show, use$ } from "@legendapp/state/react";
import { useForm } from "react-hook-form";
import { agencyStore$ } from "../model/agency.store.client";
import { type AccountSchema, accountSchema } from "../model/schema";

export function StepThreeAccountInfo() {
  const stepper = use$(agencyStore$.data);

  const form = useForm<AccountSchema>({
    mode: "onSubmit",
    defaultValues: stepper.account,
    resolver: zodResolver(accountSchema),
  });

  const onSubmit = (values: AccountSchema) => {
    console.log(values);
    agencyStore$.data.account.set(values);
    agencyStore$.step.set(agencyStore$.step.peek() + 1);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-4">
          <div className="grid gap-3">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-3">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="mt-4 grid gap-3">
            <FormField
              control={form.control}
              name="termsAccepted"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormLabel>
                    Accept Terms privacy statement & conditons
                  </FormLabel>
                </FormItem>
              )}
            />
          </div>
          <div className="mb-4 grid gap-3">
            <FormField
              control={form.control}
              name="subscribeToNewsLetter"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormLabel>Tutorials and Newsletters (optional)</FormLabel>
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-between gap-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                agencyStore$.step.set(agencyStore$.step.peek() - 1);
              }}
            >
              Back
            </Button>
            <Button type="submit" className="px-6">
              Finish
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
