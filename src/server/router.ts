import { kvkRouter } from "@/features/register/api/kvk";
import { registerRouter } from "@/features/register/api/register";
import { createTRPCRouter } from "@/lib/trpc/init";

import { agencyRouter } from "./routes/agency";
import { agencyProfileRouter } from "./routes/agency-profile";
import { candidateRouter } from "./routes/candidate";
import { candidateMatchingCriteriaRouter } from "./routes/candidateMatchingCriteria";
import { candidateProfileRouter } from "./routes/candidateProfile";
import { invoicesRouter } from "./routes/invoices";
import { skillsRouter } from "./routes/skills";
import { tokensRouter } from "./routes/tokens";
import { linkedInRouter } from "./routes/linkedin";

export const trpcRouter = createTRPCRouter({
	kvk: kvkRouter,
	register: registerRouter,
	agency: agencyRouter,
	agencyProfile: agencyProfileRouter,
	candidate: candidateRouter,
	candidateProfile: candidateProfileRouter,
	candidateMatchingCriteria: candidateMatchingCriteriaRouter,
	skills: skillsRouter,
	tokens: tokensRouter,
	invoices: invoicesRouter,
	linkedin: linkedInRouter,
});

export type TRPCRouter = typeof trpcRouter;
