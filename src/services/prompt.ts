import { Prompt } from "@effect/cli";
import { Effect } from "effect";

export const tokenPrompt = Prompt.password({
  message:
    "Enter your Cloudflare API Token (with Edit Cloudflare Workers template)",
  validate: (value) =>
    value.length === 0
      ? Effect.fail("Token cannot be empty")
      : Effect.succeed(value),
});

const accountIdPrompt = Prompt.text({
  message: "Enter your Cloudflare Account ID",
  validate: (value) =>
    value.length === 0
      ? Effect.fail("Account ID cannot be empty")
      : Effect.succeed(value),
});

const zoneIdPrompt = Prompt.text({
  message: "Enter your Cloudflare Zone ID",
  validate: (value) =>
    value.length === 0
      ? Effect.fail("Zone ID cannot be empty")
      : Effect.succeed(value),
});

export const cloudflareConfigPrompt = Prompt.all({
  accountId: accountIdPrompt,
  zoneId: zoneIdPrompt,
});
