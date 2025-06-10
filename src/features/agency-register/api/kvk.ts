import { createTRPCRouter, publicProcedure } from "@/lib/trpc/init";
import { z } from "zod";
import type { paths } from "./api";

export const kvkRouter = createTRPCRouter({
  search: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      const kvkUrl = new URL("test/api/v2/zoeken", "https://api.kvk.nl");

      if (input.query.length === 8 && !Number.isNaN(Number(input.query))) {
        kvkUrl.searchParams.append("kvkNummer", input.query);
      } else {
        kvkUrl.searchParams.append("naam", input.query);
      }

      const res = await fetch(kvkUrl, {
        headers: {
          apikey: "l7xx1f2691f2520d487b902f4e0b57a0b197",
          "content-type": "application/json",
        },
        mode: "no-cors",
      });

      if (res.status === 200) {
        return (await res.json()) as paths["/zoeken"]["get"]["responses"]["200"]["content"]["application/json"];
      }

      if (res.status === 404) {
        return (await res.json()) as paths["/zoeken"]["get"]["responses"]["404"]["content"]["application/json"];
      }
    }),
});
