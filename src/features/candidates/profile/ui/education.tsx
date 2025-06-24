import { DatePicker } from "@/components/data-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/lib/trpc/react";
import { useMutation } from "@tanstack/react-query";
import { useLoaderData, useParams, useRouter } from "@tanstack/react-router";
import { PencilIcon, PlusIcon } from "lucide-react";
import { DateTime } from "luxon";
import { nanoid } from "nanoid";
import React from "react";
import { useForm } from "react-hook-form";
import type { EducationType } from "../model/types";

export function Education() {
  const { candidate } = useLoaderData({
    from: "/(app)/candidates/$candidateId",
  });

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex justify-between">Education</CardTitle>
        <EditSection>
          <Button variant="icon" size="icon">
            <PlusIcon />
          </Button>
        </EditSection>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          {candidate?.profile.education?.map((edu) => {
            return (
              <div key={edu.degree} className="flex flex-col gap-4">
                <div className="flex justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-2">
                      <span className="font-bold text-base">{edu.degree}</span>-
                      <span>{edu.institution}</span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span>
                        {DateTime.fromISO(edu.dates.from).toFormat("LLL-yyyy")}
                      </span>
                      <span>
                        {DateTime.fromISO(edu.dates.to).toFormat("LLL-yyyy")}
                      </span>
                    </div>
                  </div>
                  <EditSection education={edu}>
                    <Button variant="icon" size="icon">
                      <PencilIcon />
                    </Button>
                  </EditSection>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function EditSection({
  children,
  education,
}: React.PropsWithChildren<{ education?: EducationType }>) {
  const { candidateId } = useParams({
    from: "/(app)/candidates/$candidateId",
  });

  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const trpc = useTRPC();
  const update = useMutation(trpc.candidateProfile.update.mutationOptions());
  const form = useForm<EducationType>({
    defaultValues: education,
  });

  const onSubmit = async (values: EducationType) => {
    await update.mutateAsync({ education: [values], candidateId });
    await router.invalidate();
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[600px]">
        <DialogHeader>
          <DialogTitle>Candidate experience</DialogTitle>
          <DialogDescription> </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...form.register("id")} value={nanoid()} />
            <FormField
              control={form.control}
              name="degree"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Degree</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="institution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Institution</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dates.from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date from</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        fullWidth
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dates.to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date to</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        fullWidth
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="pt-8">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button>Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
