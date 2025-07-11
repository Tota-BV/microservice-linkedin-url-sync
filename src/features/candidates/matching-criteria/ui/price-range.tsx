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

import { Input } from "@/components/ui/input";
import { useTRPC } from "@/lib/trpc/react";
import { formatEuro } from "@/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { UpdateCandidateMatchingCritera } from "../../model/schema";

export function PriceRange() {
  const { candidate } = useLoaderData({
    from: "/(app)/candidates/$candidateId",
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex justify-between">Price range</CardTitle>
        <EditSection>
          <Button variant="icon" size="icon">
            <PencilIcon />
          </Button>
        </EditSection>
      </CardHeader>
      <CardContent>
        <span>
          {formatEuro(candidate?.matchingCriteria.priceFrom ?? 0)} to{" "}
          {formatEuro(candidate?.matchingCriteria.priceTo ?? 0)}
        </span>
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
  const update = useMutation(
    trpc.candidateMatchingCriteria.update.mutationOptions(),
  );
  const form = useForm<UpdateCandidateMatchingCritera>({
    defaultValues: {
      priceFrom: (candidate?.matchingCriteria.priceFrom ?? 0) / 100,
      priceTo: (candidate?.matchingCriteria.priceTo ?? 0) / 100,
    },
    resolver: zodResolver(
      z.object({
        priceFrom: z.coerce.number().min(0).optional(),
        priceTo: z.coerce.number().min(0).optional(),
      }),
    ),
  });

  const onSubmit = async (values: UpdateCandidateMatchingCritera) => {
    const priceFrom = (values.priceFrom ?? 0) * 100;
    const priceTo = (values.priceTo ?? 0) * 100;

    console.log(priceFrom);

    await update.mutateAsync({ priceFrom, priceTo, candidateId });
    await router.invalidate();

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[600px]!">
        <DialogHeader>
          <DialogTitle>Edit price range</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <FormField
                control={form.control}
                name="priceFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <span className="-translate-y-1/2 absolute top-1/2 left-3 text-sm">
                          &euro;
                        </span>
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          {...field}
                          className="pl-6"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>-</div>
              <FormField
                control={form.control}
                name="priceTo"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <span className="-translate-y-1/2 absolute top-1/2 left-3 text-sm">
                          &euro;
                        </span>
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          {...field}
                          className="pl-6"
                        />
                      </div>
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
