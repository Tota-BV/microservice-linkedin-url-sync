import { createTRPCRouter } from "@/lib/trpc/init";

import { kvkRouter } from "@/features/agency-register/api/kvk";
import { registerRouter } from "@/features/agency-register/api/register";

import { agencyRouter } from "./routes/agency";
import { agencyProfileRouter } from "./routes/agency-profile";
import { authRouter } from "./routes/auth";
import { candidateRouter } from "./routes/candidate";
import { candidateProfileRouter } from "./routes/candidateProfile";
import { invoicesRouter } from "./routes/invoices";
import { tokensRouter } from "./routes/tokens";

export const trpcRouter = createTRPCRouter({
  auth: authRouter,
  kvk: kvkRouter,
  register: registerRouter,
  agency: agencyRouter,
  agencyProfile: agencyProfileRouter,
  candidate: candidateRouter,
  candidateProfile: candidateProfileRouter,
  tokens: tokensRouter,
  invoices: invoicesRouter,
});

export type TRPCRouter = typeof trpcRouter;
