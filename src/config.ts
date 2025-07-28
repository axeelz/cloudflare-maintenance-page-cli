import type { MaintenanceOptions } from "./types.ts";

const defaultConfig: MaintenanceOptions = {
  statusCode: 503,
  title: "We'll Be Right Back!",
  message:
    "Our site is currently undergoing scheduled maintenance. We're working hard to bring you a better experience. Thank you for your patience and understanding.",
  expectedCompletionIso: undefined, // As soon as possible
  retryAfterSeconds: 1 * 60 * 60,
  contactEmail: "contact@example.com",
  statusPage: "https://status.example.com",
};

const localConfig: Partial<MaintenanceOptions> = await import(
  "./config.local.ts"
)
  .then(({ localMaintenanceConfig }) => localMaintenanceConfig ?? {})
  .catch(() => ({}));

export const maintenanceConfig: MaintenanceOptions = {
  ...defaultConfig,
  ...localConfig,
};
