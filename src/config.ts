import { Config, ConfigProvider, Effect, Option, Redacted } from "effect";

const path = "./config.json";
const file = Bun.file(path);
const configJSON = await file.json();

export const cloudflareConfig = Effect.all([
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
  Effect.withConfigProvider(
    ConfigProvider.fromJson(configJSON).pipe(
      ConfigProvider.nested("CLOUDFLARE"),
    ),
  ),
);

export type CloudflareConfig = Effect.Effect.Success<typeof cloudflareConfig>;

export const pageConfig = Effect.all([
  Config.number("STATUS_CODE"),
  Config.string("TITLE"),
  Config.string("MESSAGE"),
  Config.option(Config.string("EXPECTED_COMPLETION_ISO")),
  Config.number("RETRY_AFTER_SECONDS"),
  Config.string("CONTACT_EMAIL"),
  Config.option(Config.string("STATUS_PAGE")),
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
    ]) => ({
      statusCode,
      title,
      message,
      expectedCompletionIso: Option.getOrUndefined(expectedCompletionIso),
      retryAfterSeconds,
      contactEmail,
      statusPage: Option.getOrUndefined(statusPage),
    }),
  ),
  Effect.withConfigProvider(
    ConfigProvider.fromJson(configJSON).pipe(ConfigProvider.nested("PAGE")),
  ),
);

export type PageConfig = Effect.Effect.Success<typeof pageConfig>;
