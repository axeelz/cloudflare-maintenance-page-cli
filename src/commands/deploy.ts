import { Command } from "@effect/cli";
import { Console, Effect } from "effect";
import { CloudflareService } from "../services/cloudflare.js";
import { getPageConfig } from "../services/config.js";

export const deployCommand = Command.make("deploy", {}, () =>
  Effect.gen(function* () {
    yield* Console.log("Creating Cloudflare Worker...");

    const service = yield* CloudflareService;
    const config = yield* getPageConfig;
    yield* service.setupScript(config);

    yield* Console.log(
      `Worker script deployed successfully for ${service.patterns.disabled}`,
    );
  }).pipe(Effect.provide(CloudflareService.Default)),
);
