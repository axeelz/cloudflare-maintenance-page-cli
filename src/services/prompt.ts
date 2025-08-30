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

export type SelectChoice = {
  title: string;
  value: string;
  description?: string;
  disabled?: boolean;
};

export const makeAccountSelectPrompt = (choices: Array<SelectChoice>) =>
  Prompt.select({
    message: "Choose a Cloudflare account",
    choices,
  });

export const makeZoneSelectPrompt = (choices: Array<SelectChoice>) =>
  Prompt.select({
    message: "Choose a Cloudflare zone",
    choices,
  });
