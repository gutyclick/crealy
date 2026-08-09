import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "proj_avfyftfsbdbkpeqgufpc",
  dirs: ["./src/trigger"],
  maxDuration: 900,
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
