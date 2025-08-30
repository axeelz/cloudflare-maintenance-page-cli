import { mkdir } from "node:fs/promises";
import { homedir, type } from "node:os";
import { dirname, join } from "node:path";
import { Prompt } from "@effect/cli";
import { secrets } from "bun";
import {
  Config,
  ConfigProvider,
  Console,
  Effect,
  Option,
  pipe,
  Redacted,
} from "effect";
import {
  CLI_NAME,
  type ConfigJSON,
  PROJECT_ROOT,
  SECRETS_NAME,
} from "../constants";
import { cloudflareConfigPrompt, tokenPrompt } from "./prompt";

export const configPath = join(homedir(), ".config", CLI_NAME, "config.json");

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
  Config.string("ZONE_ID"),
  Config.string("SCRIPT_NAME"),
]).pipe(
  Effect.map(([accountId, zoneId, scriptName]) => ({
    accountId,
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
      Prompt.run(cloudflareConfigPrompt).pipe(
        Effect.flatMap((answers) =>
          Effect.gen(function* () {
            const newConfig = {
              ...configJSON,
              CLOUDFLARE: {
                ...configJSON.CLOUDFLARE,
                ACCOUNT_ID: answers.accountId,
                ZONE_ID: answers.zoneId,
              },
            } satisfies ConfigJSON;

            yield* Effect.promise(() =>
              Bun.write(configPath, JSON.stringify(newConfig, null, 2)),
            );

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

const keychain = {
  Darwin: "Keychain Services",
  Linux: "libsecret",
  Windows_NT: "Windows Credential Manager",
}[type()];

export const getCloudflareToken = Effect.gen(function* () {
  const token = yield* Effect.tryPromise(() =>
    secrets.get({
      service: CLI_NAME,
      name: SECRETS_NAME,
    }),
  );

  if (!token) {
    const newToken = yield* Prompt.run(tokenPrompt);
    yield* Effect.tryPromise(() =>
      secrets.set({
        service: CLI_NAME,
        name: SECRETS_NAME,
        value: Redacted.value(newToken),
      }),
    ).pipe(
      Effect.tap(() => Console.log(`Token securely stored in ${keychain}`)),
    );
    return Redacted.value(newToken);
  }

  return token;
});

export const deleteCloudflareToken = Effect.gen(function* () {
  const deleted = yield* Effect.tryPromise(() =>
    secrets.delete({
      service: CLI_NAME,
      name: SECRETS_NAME,
    }),
  );

  yield* Console.log(
    deleted
      ? `Token deleted from ${keychain}`
      : `Couldn't delete API token from ${keychain}, either it doesn't exist or you may need to delete it manually.`,
  );
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
