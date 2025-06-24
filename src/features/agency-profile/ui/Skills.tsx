import { Badge } from "@/components/ui/badge";
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
import { Form } from "@/components/ui/form";
import { useTRPC } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useLoaderData, useRouter } from "@tanstack/react-router";
import { PencilIcon, XIcon } from "lucide-react";
import React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import type { UpdateAgencyProfile } from "../model/schema";

export function Skills() {
  const { profile } = useLoaderData({ from: "/(app)/profile/" });

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex justify-between">Skills</CardTitle>
        <EditSkills>
          <Button variant="icon" size="icon">
            <PencilIcon />
          </Button>
        </EditSkills>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1">
          {profile?.skills.map((item) => (
            <Badge variant="secondary" key={item.value}>
              {item.value}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EditSkills({ children }: React.PropsWithChildren) {
  const { profile } = useLoaderData({ from: "/(app)/profile/" });

  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const trpc = useTRPC();
  const update = useMutation(trpc.agency.update.mutationOptions());
  const form = useForm<UpdateAgencyProfile>({
    defaultValues: {
      skills: profile?.skills ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "skills",
  });

  const onSubmit = async (values: UpdateAgencyProfile) => {
    await update.mutateAsync(values);
    await router.invalidate();

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[600px]">
        <DialogHeader>
          <DialogTitle>Agency skills</DialogTitle>
          <DialogDescription>
            Define some skills your candidates in your agency work with.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div
              className={cn(
                "flex w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
                "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
                "flex-wrap gap-2",
              )}
            >
              {fields.map((field, idx) => {
                return (
                  <React.Fragment key={field.id}>
                    <input
                      type="hidden"
                      {...form.register(`skills.${idx}.value`)}
                    />
                    <Badge variant="secondary">
                      {field.value}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-2 size-3"
                        onClick={() => remove(idx)}
                      >
                        <XIcon className="w-3" />
                      </Button>
                    </Badge>
                  </React.Fragment>
                );
              })}
              <input
                className="bg-transparent outline-none"
                // biome-ignore lint/a11y/noAutofocus: <explanation>
                autoFocus
                onKeyDown={(e) => {
                  const value = (e.target as unknown as { value: string })
                    .value;

                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    append({ value });
                    (e.target as unknown as { value: string }).value = "";
                  }
                  if (e.key === "Backspace" && value.length === 0) {
                    e.preventDefault();
                    remove(fields.length - 1);
                  }
                }}
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
