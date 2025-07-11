import { createTRPCRouter, publicProcedure } from "@/lib/trpc/init";
import { z } from "zod";
import type { paths } from "./api";

export const kvkRouter = createTRPCRouter({
  search: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      const kvkUrl = new URL("api/v2/zoeken", "https://api.kvk.nl");

      if (input.query.length === 8 && !Number.isNaN(Number(input.query))) {
        kvkUrl.searchParams.append("kvkNummer", input.query);
      } else {
        kvkUrl.searchParams.append("naam", input.query);
      }

      const res = await fetch(kvkUrl, {
        headers: {
          apikey: "l72b0b3a805c134b4a8534ff9ff2039dfe",
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
