#!/usr/bin/env bun

import { Command } from "@effect/cli";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Console, Effect } from "effect";
import { CloudflareService } from "./cloudflare.js";
import { maintenanceConfig } from "./config.js";

const deployCommand = Command.make("deploy", {}, () =>
  Effect.gen(function* () {
    yield* Console.log("Creating Cloudflare Worker...");

    const service = yield* CloudflareService;
    yield* service.setupScript(maintenanceConfig);

    yield* Console.log("Worker script deployed successfully");
  }),
);

const enableCommand = Command.make("enable", {}, () =>
  Effect.gen(function* () {
    yield* Console.log("Enabling maintenance mode...");

    const service = yield* CloudflareService;
    yield* service.enableMaintenance;

    yield* Console.log("Maintenance mode enabled");
  }),
);

const disableCommand = Command.make("disable", {}, () =>
  Effect.gen(function* () {
    yield* Console.log("Disabling maintenance mode...");

    const service = yield* CloudflareService;
    yield* service.disableMaintenance;

    yield* Console.log("Maintenance mode disabled");
  }),
);

const mainCommand = Command.make("cloudflare-maintenance-page-cli").pipe(
  Command.withSubcommands([deployCommand, enableCommand, disableCommand]),
);

const cli = Command.run(mainCommand, {
  name: "Cloudflare Maintenance Page Helper CLI",
  version: "v1.0.0",
});

cli(process.argv).pipe(
  Effect.provide(CloudflareService.Default),
  Effect.provide(BunContext.layer),
  BunRuntime.runMain,
);
