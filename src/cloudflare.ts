import Cloudflare from "cloudflare";
import { Config, Data, Effect, pipe, Redacted } from "effect";
import type { MaintenanceOptions } from "./types.js";
import { createWorkerFile } from "./worker.js";

class CloudflareError extends Data.Error<{ message: string }> {}

const cloudflareConfig = Effect.all([
  Config.string("CLOUDFLARE_ACCOUNT_ID"),
  Config.redacted("CLOUDFLARE_API_TOKEN"),
  Config.string("CLOUDFLARE_ZONE_ID"),
  Config.string("WORKER_SCRIPT_NAME").pipe(
    Config.withDefault("cf-maintenance-worker"),
  ),
]).pipe(
  Effect.map(([accountId, apiToken, zoneId, scriptName]) => ({
    accountId,
    apiToken: Redacted.value(apiToken),
    zoneId,
    scriptName,
  })),
);

export class CloudflareService extends Effect.Service<CloudflareService>()(
  "app/CloudflareService",
  {
    effect: Effect.gen(function* () {
      const config = yield* cloudflareConfig;
      const client = new Cloudflare({ apiToken: config.apiToken });

      const getZoneDomain = Effect.tryPromise({
        try: async () => {
          const zoneDetails = await client.zones.get({
            zone_id: config.zoneId,
          });
          return zoneDetails.name;
        },
        catch: (error) =>
          new CloudflareError({
            message: `Failed to get zone domain: ${error}`,
          }),
      });

      const enabledPattern = (zoneDomain: string) => `*.${zoneDomain}/*`;
      const disabledPattern = (zoneDomain: string) =>
        `*.${zoneDomain}/maintenance`;

      const getRoutes = Effect.tryPromise({
        try: async () => {
          const routes: Array<{ id: string; pattern: string }> = [];

          for await (const routeListResponse of client.workers.routes.list({
            zone_id: config.zoneId,
          })) {
            routes.push({
              id: routeListResponse.id,
              pattern: routeListResponse.pattern,
            });
          }

          return routes;
        },
        catch: (error) =>
          new CloudflareError({ message: `Failed to get routes: ${error}` }),
      });

      const getRouteWithPattern = (pattern: string) =>
        pipe(
          getRoutes,
          Effect.map((routes) =>
            routes.find((route) => route.pattern === pattern),
          ),
          Effect.flatMap((route) =>
            route
              ? Effect.succeed(route)
              : Effect.fail(
                  new CloudflareError({
                    message: `No route found with pattern: ${pattern}`,
                  }),
                ),
          ),
        );

      const createRoute = (newPattern: string) =>
        Effect.tryPromise({
          try: async () => {
            await client.workers.routes.create({
              zone_id: config.zoneId,
              pattern: newPattern,
              script: config.scriptName,
            });
          },
          catch: (error) =>
            new CloudflareError({
              message: `Failed to create route: ${error}`,
            }),
        });

      const updateRoute = (routeId: string, newPattern: string) =>
        Effect.tryPromise({
          try: async () => {
            await client.workers.routes.update(routeId, {
              zone_id: config.zoneId,
              pattern: newPattern,
              script: config.scriptName,
            });
          },
          catch: (error) =>
            new CloudflareError({
              message: `Failed to update route: ${error}`,
            }),
        });

      const setupScript = (options: MaintenanceOptions) =>
        Effect.tryPromise({
          try: async () => {
            const { metadata, files } = await createWorkerFile(options);

            await client.workers.scripts.update(config.scriptName, {
              account_id: config.accountId,
              metadata,
              files,
            });
          },
          catch: (error) =>
            new CloudflareError({
              message: `Failed to setup script: ${error}`,
            }),
        }).pipe(
          Effect.andThen(
            pipe(
              getZoneDomain,
              Effect.andThen((zoneDomain) =>
                createRoute(disabledPattern(zoneDomain)),
              ),
            ),
          ),
        );

      const enableMaintenance = Effect.gen(function* () {
        const zoneDomain = yield* getZoneDomain;
        const route = yield* getRoutes.pipe(
          Effect.flatMap(() =>
            getRouteWithPattern(disabledPattern(zoneDomain)),
          ),
        );
        yield* updateRoute(route.id, enabledPattern(zoneDomain));
      });

      const disableMaintenance = Effect.gen(function* () {
        const zoneDomain = yield* getZoneDomain;
        const route = yield* getRoutes.pipe(
          Effect.flatMap(() => getRouteWithPattern(enabledPattern(zoneDomain))),
        );
        yield* updateRoute(route.id, disabledPattern(zoneDomain));
      });

      return {
        setupScript,
        enableMaintenance,
        disableMaintenance,
      } as const;
    }),
  },
) {}
