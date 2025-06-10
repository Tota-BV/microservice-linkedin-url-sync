import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "@tanstack/react-start/config";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  tsr: {
    appDirectory: "src",
    routeToken: "layout",
    autoCodeSplitting: true,
  },
  vite: {
    plugins: [
      viteTsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
      tailwindcss(),
    ],
  },
});

// import { wrapVinxiConfigWithSentry } from "@sentry/tanstackstart-react";
// export default wrapVinxiConfigWithSentry(config, {
//   org: process.env.VITE_SENTRY_ORG,
//   project: process.env.VITE_SENTRY_PROJECT,
//   authToken: process.env.SENTRY_AUTH_TOKEN,
//   // Only print logs for uploading source maps in CI
//   // Set to `true` to suppress logs
//   silent: !process.env.CI,
// });
