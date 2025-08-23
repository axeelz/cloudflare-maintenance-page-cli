import Cloudflare from "cloudflare";
import { Data, Effect, pipe } from "effect";
import { getCloudflareConfig, type PageConfig } from "./config.js";
import { createWorkerFile } from "./worker.js";

class CloudflareError extends Data.Error<{ message: string }> {}

export class CloudflareService extends Effect.Service<CloudflareService>()(
  "app/CloudflareService",
  {
    effect: Effect.gen(function* () {
      const config = yield* getCloudflareConfig;
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
            message: `Failed to get zone domain\n${error}`,
          }),
      });
      const zoneDomain = yield* getZoneDomain;
      const patterns = {
        enabled: `*${zoneDomain}/*`,
        disabled: `*${zoneDomain}/maintenance*`,
      } as const;

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
          new CloudflareError({ message: `Failed to get routes\n${error}` }),
      });

      const findRouteByPattern = (
        routes: Array<{ id: string; pattern: string }>,
        pattern: string,
      ) => routes.find((route) => route.pattern === pattern);

      const requireRoute = (
        route: { id: string; pattern: string } | undefined,
      ) =>
        route
          ? Effect.succeed(route)
          : Effect.fail(
              new CloudflareError({
                message:
                  "No matching route found. Run 'deploy' first to create the maintenance route.",
              }),
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
              message: `Failed to create route\n${error}`,
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
              message: `Failed to update route\n${error}`,
            }),
        });

      const setupScript = (options: PageConfig) =>
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
              message: `Failed to setup script\n${error}`,
            }),
        }).pipe(
          Effect.andThen(() =>
            pipe(
              getRoutes,
              Effect.flatMap((routes) =>
                routes.length === 0
                  ? createRoute(patterns.disabled)
                  : Effect.succeed(undefined),
              ),
            ),
          ),
        );

      const enableMaintenance = Effect.gen(function* () {
        const routes = yield* getRoutes;
        const alreadyEnabled = findRouteByPattern(routes, patterns.enabled);
        if (alreadyEnabled) {
          return false;
        }
        const disabledRoute = yield* requireRoute(
          findRouteByPattern(routes, patterns.disabled),
        );
        yield* updateRoute(disabledRoute.id, patterns.enabled);
        return true;
      });

      const disableMaintenance = Effect.gen(function* () {
        const routes = yield* getRoutes;
        const alreadyDisabled = findRouteByPattern(routes, patterns.disabled);
        if (alreadyDisabled) {
          return false;
        }
        const enabledRoute = yield* requireRoute(
          findRouteByPattern(routes, patterns.enabled),
        );
        yield* updateRoute(enabledRoute.id, patterns.disabled);
        return true;
      });

      return {
        setupScript,
        enableMaintenance,
        disableMaintenance,
        patterns,
      } as const;
    }),
  },
) {}
