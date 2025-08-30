import { Command } from "@effect/cli";
import { Console, Effect } from "effect";
import { CloudflareService } from "../services/cloudflare.js";

export const enableCommand = Command.make("enable", {}, () =>
  Effect.gen(function* () {
    yield* Console.log("Enabling maintenance mode...");

    const service = yield* CloudflareService;
    const changed = yield* service.enableMaintenance;
    yield* Console.log(
      changed
        ? `Maintenance mode enabled, pattern is now ${service.patterns.enabled}`
        : `Maintenance mode is already enabled`,
    );
  }).pipe(Effect.provide(CloudflareService.Default)),
);
