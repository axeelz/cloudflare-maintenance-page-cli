import { Command, Options } from "@effect/cli";
import { Console, Effect } from "effect";
import open from "open";
import {
  configPath,
  deleteCloudflareToken,
  loadConfigJSON,
} from "../services/config.js";

const deleteToken = Options.boolean("delete").pipe(Options.withAlias("d"));

export const configCommand = Command.make(
  "config",
  { deleteToken },
  ({ deleteToken }) =>
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
      deleteCloudflareToken.pipe(Effect.when(() => deleteToken)),
    ]),
);
