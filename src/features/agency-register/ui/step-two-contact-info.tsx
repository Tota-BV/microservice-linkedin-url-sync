import { Combobox, toLabelMap } from "@/components/combobox";
import { Button } from "@/components/ui/button";
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
import { type ContactSchema, contactSchema, pronounce } from "../model/schema";
import { CountryPicker } from "./country-picker";

export function StepTwoContactInfo() {
  const stepper = use$(agencyStore$.data);

  const form = useForm<ContactSchema>({
    mode: "onSubmit",
    defaultValues: {
      ...stepper.contact,
      phone: stepper.agency?.phone,
    },
    resolver: zodResolver(contactSchema),
  });

  console.log(stepper.agency?.phone);

  const onSubmit = (values: ContactSchema) => {
    agencyStore$.data.contact.set(values);
    agencyStore$.step.set(agencyStore$.step.peek() + 1);
  };

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          <div className="grid gap-3">
            <FormField
              control={form.control}
              name="pronounce"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pronounce</FormLabel>
                  <FormControl>
                    <Combobox
                      {...field}
                      fullWidth
                      data={pronounce.options.map(toLabelMap)}
                      value={toLabelMap(field.value)}
                      onChange={(v) => field.onChange(v?.name)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-12 gap-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="col-span-8">
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="namePrefix"
              render={({ field }) => (
                <FormItem className="col-span-4">
                  <FormLabel>Name prefix (optional)</FormLabel>
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
              name="surname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Surname</FormLabel>
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
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job title</FormLabel>
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
              name="phone.number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <div className="flex overflow-hidden rounded-md border aria-invalid:border-destructive">
                      <CountryPicker
                        defaultValue={stepper.agency?.country}
                        onChange={(val) => {
                          if (val) {
                            form.setValue("phone.dial_code", val.dial_code);
                          }
                        }}
                        includeDialCode
                      />
                      <Input
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="border-none shadow-none focus-visible:ring-0"
                        type="number"
                      />
                    </div>
                  </FormControl>
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
              Next
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
