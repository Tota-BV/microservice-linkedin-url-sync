import { createTRPCRouter } from "@/lib/trpc/init";

import { kvkRouter } from "@/features/agency-register/api/kvk";
import { registerRouter } from "@/features/agency-register/api/register";

import { agencyRouter } from "./routes/agency";
import { authRouter } from "./routes/auth";
import { todoRouter } from "./routes/todo";
import { candidatesRouter } from "./routes/candidates";

export const trpcRouter = createTRPCRouter({
  auth: authRouter,
  todo: todoRouter,
  kvk: kvkRouter,
  register: registerRouter,
  agency: agencyRouter,
  candidates: candidatesRouter,
});

export type TRPCRouter = typeof trpcRouter;
