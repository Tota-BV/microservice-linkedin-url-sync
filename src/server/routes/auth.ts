import { auth } from "@/lib/auth/auth";

import { createTRPCRouter, publicProcedure } from "@/lib/trpc/init";

import { z } from "zod";

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(
      z.object({
        email: z.string(),
        password: z.string(),
        rememberMe: z.boolean().optional(),
      }),
    )
    .mutation(({ input }) => {
      return auth.api.signInEmail({ body: input });
    }),
});
