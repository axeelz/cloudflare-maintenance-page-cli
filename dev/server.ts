import { Console, Effect } from "effect";
import { getPageConfig } from "../src/services/config.js";
import { generateMaintenanceHTML } from "../src/services/worker.js";

const program = Effect.gen(function* () {
  const config = yield* getPageConfig;
  const html = generateMaintenanceHTML(config);

  yield* Effect.all([
    Console.log("Starting development server..."),
    Console.log(`Server available at: http://localhost:3000`),
    Console.log("Press Ctrl+C to stop\n"),
  ]);

  Bun.serve({
    port: 3000,
    fetch() {
      return new Response(html, {
        headers: {
          "content-type": "text/html;charset=UTF-8",
          "cache-control": "no-cache, no-store, must-revalidate",
        },
      });
    },
  });
});

Effect.runPromise(program);
