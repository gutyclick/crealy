import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "proj_avfyftfsbdbkpeqgufpc",
  dirs: ["./src/trigger"],
  maxDuration: 900,
  build: {
    // Crealy's backend modules use Next.js' `server-only` guard. Trigger runs
    // those same modules in Node, so resolve the package's no-op server export.
    conditions: ["react-server"],
  },
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 1,
      minTimeoutInMs: 1_000,
      maxTimeoutInMs: 10_000,
      factor: 2,
      randomize: true,
    },
  },
});
