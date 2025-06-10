import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "./auth";
import { authClient } from "./auth-client";

export const getIsomorphicSession = createIsomorphicFn()
  .client(async () => {
    const session = await authClient.getSession();
    return session.data;
  })
  .server(async () => {
    const headers = new Headers(
      Object.entries(getRequestHeaders()).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
    const session = await auth.api.getSession({ headers });
    return session;
  });
