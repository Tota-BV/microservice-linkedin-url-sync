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
import { useTRPC } from "@/lib/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { use$ } from "@legendapp/state/react";
import { skipToken, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { agencyStore$ } from "../model/agency.store.client";
import { type AccountSchema, accountSchema } from "../model/schema";

export function StepFourComplete() {
  const stepper = use$(agencyStore$.data);
  const trpc = useTRPC();

  const register = useQuery(
    trpc.register.agency.queryOptions(
      stepper.agency && stepper.contact && stepper.account
        ? {
            account: stepper.account,
            agency: stepper.agency,
            contact: stepper.contact,
          }
        : skipToken,
    ),
  );

  console.log(register.error);

  if (register.isFetching || register.isLoading) {
    return (
      <div className="space-y-2 text-center">
        <h1 className="font-bold text-2xl">Finalizing your signup…</h1>
        <p>Please wait while we complete your registration.</p>
      </div>
    );
  }

  if (register.isSuccess) {
    return (
      <div className="space-y-2 text-center">
        <h1 className="font-bold text-2xl">Signup success!</h1>
        <p>
          Please check your email at{" "}
          <span className="font-display">{stepper.account?.email}</span> to
          activate your account and login.
        </p>
      </div>
    );
  }

  return null;
}
