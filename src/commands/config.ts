import { Command } from "@effect/cli";
import { Console, Effect } from "effect";
import open from "open";
import { configPath, loadConfigJSON } from "../config.js";

export const configCommand = Command.make("config", {}, () =>
  Effect.all([
    loadConfigJSON,
    Console.log(`Configuration loaded from ${configPath}`),
    Console.log(
      "You can edit the configuration file directly with your preferred editor.",
    ),
    Console.log(
      "To reset the configuration, simply delete the configuration file.",
    ),
    Effect.promise(() => open(configPath, { wait: false })),
  ]),
);
