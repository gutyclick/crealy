import { esbuildPlugin } from "@trigger.dev/build/extensions";
import { defineConfig } from "@trigger.dev/sdk";

const serverOnlyShim = esbuildPlugin(
  {
    name: "crealy-server-only-shim",
    setup(build) {
      build.onResolve({ filter: /^server-only$/ }, () => ({
        path: "server-only",
        namespace: "crealy-server-only",
      }));
      build.onLoad(
        { filter: /.*/, namespace: "crealy-server-only" },
        () => ({ contents: "export {};", loader: "js" }),
      );
    },
  },
  { placement: "first" },
);

export default defineConfig({
  project: "proj_avfyftfsbdbkpeqgufpc",
  dirs: ["./src/trigger"],
  maxDuration: 900,
  build: {
    // Only neutralize Next.js' compile-time guard. A global `react-server`
    // condition also changes React and third-party runtime exports.
    extensions: [serverOnlyShim],
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
