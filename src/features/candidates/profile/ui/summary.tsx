import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

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
import { useLoaderData, useParams, useRouter } from "@tanstack/react-router";
import { PencilIcon } from "lucide-react";

import { useTRPC } from "@/lib/trpc/react";
import { useMutation } from "@tanstack/react-query";
import React from "react";
import { useForm } from "react-hook-form";
import type { UpdateCandidateProfile } from "../../model/schema";

export function Summary() {
  const { candidate } = useLoaderData({
    from: "/(app)/candidates/$candidateId",
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex justify-between">Agency summary</CardTitle>
        <EditSection>
          <Button variant="icon" size="icon">
            <PencilIcon />
          </Button>
        </EditSection>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-line">
          {candidate?.profile.agencySummary || "here goes summary"}
        </p>
      </CardContent>
    </Card>
  );
}

function EditSection({ children }: React.PropsWithChildren) {
  const { candidate } = useLoaderData({
    from: "/(app)/candidates/$candidateId",
  });

  const { candidateId } = useParams({
    from: "/(app)/candidates/$candidateId",
  });

  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const trpc = useTRPC();
  const update = useMutation(trpc.candidateProfile.update.mutationOptions());
  const form = useForm({
    defaultValues: {
      agencySummary: candidate?.profile.agencySummary ?? "",
    },
  });

  const onSubmit = async (values: UpdateCandidateProfile) => {
    await update.mutateAsync({ ...values, candidateId });
    await router.invalidate();

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[600px]!">
        <DialogHeader>
          <DialogTitle>Edit agency summary</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div>
              <FormField
                control={form.control}
                name="agencySummary"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="min-h-30 max-h-72"
                        rows={25}
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
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
