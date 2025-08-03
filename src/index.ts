#!/usr/bin/env bun

import { Command } from "@effect/cli";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect } from "effect";
import {
  configCommand,
  deployCommand,
  disableCommand,
  enableCommand,
} from "./commands/index.js";

const mainCommand = Command.make("cfm").pipe(
  Command.withSubcommands([
    configCommand,
    deployCommand,
    disableCommand,
    enableCommand,
  ]),
);

const cli = Command.run(mainCommand, {
  name: "Cloudflare Maintenance Page CLI",
  version: "v1.0.0",
});

cli(process.argv).pipe(Effect.provide(BunContext.layer), BunRuntime.runMain);
