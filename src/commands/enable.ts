import { Command } from "@effect/cli";
import { Console, Effect } from "effect";
import { CloudflareService } from "../services/cloudflare.js";

export const enableCommand = Command.make("enable", {}, () =>
  Effect.gen(function* () {
    yield* Console.log("Enabling maintenance mode...");

    const service = yield* CloudflareService;
    yield* service.enableMaintenance;

    yield* Console.log("Maintenance mode enabled");
  }).pipe(Effect.provide(CloudflareService.Default)),
);
