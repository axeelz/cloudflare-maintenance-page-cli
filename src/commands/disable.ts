import { Command } from "@effect/cli";
import { Console, Effect } from "effect";
import { CloudflareService } from "../services/cloudflare.js";

export const disableCommand = Command.make("disable", {}, () =>
  Effect.gen(function* () {
    yield* Console.log("Disabling maintenance mode...");

    const service = yield* CloudflareService;
    const changed = yield* service.disableMaintenance;
    yield* Console.log(
      changed
        ? "Maintenance mode disabled"
        : "Maintenance mode was already disabled",
    );
  }).pipe(Effect.provide(CloudflareService.Default)),
);
