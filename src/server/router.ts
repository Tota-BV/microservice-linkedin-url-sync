import { createTRPCRouter } from "@/lib/trpc/init";
import { linkedInRouter } from "./routes/linkedin";

export const trpcRouter = createTRPCRouter({
	linkedin: linkedInRouter,
});

export type TRPCRouter = typeof trpcRouter;
