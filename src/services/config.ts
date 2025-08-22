import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { Prompt } from "@effect/cli";
import {
  Config,
  ConfigProvider,
  Console,
  Effect,
  Option,
  pipe,
  Redacted,
} from "effect";
import { type ConfigJSON, PROJECT_ROOT } from "../constants";
import { prompt } from "./prompt";

export const configPath = join(
  homedir(),
  ".config",
  "cloudflare-maintenance-page-cli",
  "config.json",
);

const initConfig = Effect.gen(function* () {
  const exists = yield* Effect.promise(() => Bun.file(configPath).exists());

  if (!exists) {
    yield* Effect.promise(() =>
      mkdir(dirname(configPath), { recursive: true }),
    );

    const exampleConfig = Bun.file(join(PROJECT_ROOT, "config.example.json"));
    yield* Effect.promise(() =>
      Bun.write(configPath, exampleConfig, { mode: 0o600 }),
    );
    yield* Console.log(`Configuration file created at ${configPath}`);
  }
});

export const loadConfigJSON = pipe(
  initConfig,
  Effect.flatMap(() =>
    Effect.promise(() => Bun.file(configPath).json() as Promise<ConfigJSON>),
  ),
);

const loadCloudflareConfig = Effect.all([
  Config.string("ACCOUNT_ID"),
  Config.redacted("API_TOKEN"),
  Config.string("ZONE_ID"),
  Config.string("SCRIPT_NAME"),
]).pipe(
  Effect.map(([accountId, apiToken, zoneId, scriptName]) => ({
    accountId,
    apiToken: Redacted.value(apiToken),
    zoneId,
    scriptName,
  })),
);

export const getCloudflareConfig = Effect.gen(function* () {
  const configJSON = yield* loadConfigJSON;
  const configProvider = pipe(
    ConfigProvider.fromEnv(),
    ConfigProvider.orElse(() => ConfigProvider.fromJson(configJSON)),
    ConfigProvider.nested("CLOUDFLARE"),
  );

  const config = yield* loadCloudflareConfig.pipe(
    Effect.withConfigProvider(configProvider),
    Effect.catchTag("ConfigError", () =>
      Prompt.run(prompt).pipe(
        Effect.flatMap((answers) =>
          Effect.gen(function* () {
            const newConfig = {
              ...configJSON,
              CLOUDFLARE: {
                ...configJSON.CLOUDFLARE,
                ACCOUNT_ID: answers.accountId,
                API_TOKEN: Redacted.value(answers.apiToken),
                ZONE_ID: answers.zoneId,
              },
            } satisfies ConfigJSON;

            if (answers.shouldStore) {
              yield* Effect.promise(() =>
                Bun.write(configPath, JSON.stringify(newConfig, null, 2)),
              );
            }

            return yield* loadCloudflareConfig.pipe(
              Effect.withConfigProvider(
                ConfigProvider.fromJson(newConfig).pipe(
                  ConfigProvider.nested("CLOUDFLARE"),
                ),
              ),
            );
          }),
        ),
      ),
    ),
  );

  return config;
});

export const getPageConfig = Effect.gen(function* () {
  const configJSON = yield* loadConfigJSON;

  const config = yield* Effect.all([
    Config.number("STATUS_CODE"),
    Config.string("TITLE"),
    Config.string("MESSAGE"),
    Config.option(Config.string("EXPECTED_COMPLETION_ISO")),
    Config.number("RETRY_AFTER_SECONDS"),
    Config.string("CONTACT_EMAIL"),
    Config.option(Config.string("STATUS_PAGE")),
    Config.option(Config.string("BYPASS_VALUE")),
  ]).pipe(
    Effect.map(
      ([
        statusCode,
        title,
        message,
        expectedCompletionIso,
        retryAfterSeconds,
        contactEmail,
        statusPage,
        bypassValue,
      ]) => ({
        statusCode,
        title,
        message,
        expectedCompletionIso: Option.getOrUndefined(expectedCompletionIso),
        retryAfterSeconds,
        contactEmail,
        statusPage: Option.getOrUndefined(statusPage),
        bypassValue: Option.getOrUndefined(bypassValue),
      }),
    ),
    Effect.withConfigProvider(
      ConfigProvider.fromJson(configJSON).pipe(ConfigProvider.nested("PAGE")),
    ),
  );

  return config;
});

export type PageConfig = Effect.Effect.Success<typeof getPageConfig>;
