import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { useTRPC } from "@/lib/trpc/react";
import { useMutation } from "@tanstack/react-query";
import { useLoaderData, useRouter } from "@tanstack/react-router";
import { BadgeCheckIcon, PencilIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import type { UpdateAgency } from "../model/schema";

export function AgencyDetails() {
  const { profile } = useLoaderData({ from: "/(app)/profile/" });

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold">{profile?.agency.name}</h1>
        {/* <Badge className="bg-green-500/20 text-sm">
                  <BadgeCheckIcon className="text-green-700" />
                  <span className="text-green-700">Verified</span>
                </Badge> */}
        <Badge className="bg-yellow-500/20 text-sm">
          <BadgeCheckIcon className="text-yellow-700" />
          <span className="text-yellow-700">Unverified</span>
        </Badge>
        <EditDialog>
          <Button variant="icon" size="icon">
            <PencilIcon />
          </Button>
        </EditDialog>
      </div>

      <span>{profile?.agency.description}</span>
      <div>
        <Button variant="link" size="inline">
          {profile?.agency.website}
        </Button>
      </div>
    </div>
  );
}

function EditDialog({ children }: React.PropsWithChildren) {
  const { profile } = useLoaderData({ from: "/(app)/profile/" });

  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const trpc = useTRPC();
  const update = useMutation(trpc.agency.update.mutationOptions());
  const form = useForm<UpdateAgency>({
    defaultValues: {
      name: profile?.agency.name ?? "",
      description: profile?.agency.description ?? "",
      website: profile?.agency.website ?? "",
    },
  });

  console.log(form.formState.errors);

  const onSubmit = async (values: UpdateAgency) => {
    await update.mutateAsync(values);
    await router.invalidate();

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[600px]">
        <DialogHeader>
          <DialogTitle>Agency details</DialogTitle>
          <DialogDescription>
            Update your agency details here, including the name, description,
            and website. Changes are saved immediately and may be visible to
            your team and others.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agency name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agency description</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="agency description" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agency website</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="pt-8">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
