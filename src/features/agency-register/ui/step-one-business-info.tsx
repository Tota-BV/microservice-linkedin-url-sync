import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Show, use$ } from "@legendapp/state/react";
import React from "react";
import { useForm } from "react-hook-form";
import { agencyStore$ } from "../model/agency.store.client";
import { type AgencySchema, agencySchema } from "../model/schema";
import { CountryPicker, countries } from "./country-picker";
import { KvKFinder } from "./kvk-finder";

export function StepOneBusinessInfo() {
  const stepper = use$(agencyStore$.data);

  const defaultCountry =
    countries.find((c) => c.code === "NL") ?? stepper.agency?.country;

  const form = useForm<AgencySchema>({
    mode: "onSubmit",
    defaultValues: {
      ...stepper.agency,
      country: defaultCountry,
      phone: {
        ...stepper.agency?.phone,
        dial_code: defaultCountry?.dial_code,
      },
    },
    resolver: zodResolver(agencySchema),
  });

  console.log(form.getValues());

  const onSubmit = (values: AgencySchema) => {
    console.log(values);
    agencyStore$.data.agency.set(values);
    agencyStore$.step.set(agencyStore$.step.peek() + 1);
  };

  const country = form.watch("country");
  const countryDialCode = form.watch("phone.dial_code");

  React.useEffect(() => {
    form.resetField("address.city");
    form.resetField("address.houseNumber");
    form.resetField("address.houseNumberAddition");
    form.resetField("address.postalCode");
    form.resetField("address.street");
    form.resetField("company.name");
    form.resetField("company.number");
  }, [country]);

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-6">
          <div className="grid gap-3">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <CountryPicker
                    {...field}
                    fullWidth
                    onChange={(val) => {
                      if (val) {
                        field.onChange(val);
                        form.setValue("phone.dial_code", val.dial_code);
                      }
                    }}
                  />
                </FormItem>
              )}
            />
          </div>
          <Show if={country.code === "NL"}>
            <div className="grid gap-3">
              <KvKFinder />
            </div>
          </Show>
          <div className="grid gap-3">
            <FormField
              control={form.control}
              name="company.name"
              defaultValue=""
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company name</FormLabel>
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
              name="company.website"
              defaultValue=""
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company website</FormLabel>
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
              name="company.number"
              defaultValue=""
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-12 gap-3">
            <FormField
              control={form.control}
              name="address.street"
              defaultValue=""
              render={({ field }) => (
                <FormItem className="col-span-6">
                  <FormLabel>Street name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address.houseNumber"
              defaultValue=""
              render={({ field }) => (
                <FormItem className="col-span-4">
                  <FormLabel>House number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address.houseNumberAddition"
              defaultValue=""
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Addition</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-12 gap-3">
            <FormField
              control={form.control}
              name="address.postalCode"
              defaultValue=""
              render={({ field }) => (
                <FormItem className="col-span-6">
                  <FormLabel>ZIP code</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address.city"
              defaultValue=""
              render={({ field }) => (
                <FormItem className="col-span-6">
                  <FormLabel>City</FormLabel>
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
                  <FormDescription>
                    The phone number where we can contact you
                  </FormDescription>
                  <FormControl>
                    <div className="flex overflow-hidden rounded-md border aria-invalid:border-destructive">
                      <CountryPicker
                        value={
                          countries.find(
                            (c) => c.dial_code === countryDialCode,
                          ) ?? country
                        }
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
          <div className="flex justify-end">
            <Button
              disabled={!form.formState.isValid}
              type="submit"
              className="px-6"
            >
              Next
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
