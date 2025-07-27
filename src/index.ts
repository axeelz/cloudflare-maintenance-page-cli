import { Command } from "@effect/cli";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Console, Effect, Config, ConfigError } from "effect";

const requiredConfig = Effect.all([
  Config.string("CLOUDFLARE_ACCOUNT_ID"),
  Config.redacted("CLOUDFLARE_API_TOKEN"),
  Config.string("CLOUDFLARE_ZONE_ID"),
]);
const optionalConfig = Config.string("SCRIPT_NAME").pipe(Config.withDefault("cf-maintenance-script"));

const appConfig = Effect.all([requiredConfig, optionalConfig]).pipe(
  Effect.map(([[accountId, apiToken, zoneId], scriptName]) => ({
    accountId,
    apiToken,
    zoneId,
    scriptName,
  }))
);

const command = Command.make("cf-maintenance", {}, () =>
  Effect.gen(function* () {
    const config = yield* appConfig;
  }).pipe(Effect.catchTag("ConfigError", (error) => Console.error("Missing or invalid configuration:", error.message)))
);

const cli = Command.run(command, {
  name: "Cloudflare Maintenance Page CLI",
  version: "v1.0.0",
});

cli(process.argv).pipe(Effect.provide(BunContext.layer), BunRuntime.runMain);
