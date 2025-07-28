import path from "node:path";
import type { ScriptUpdateParams } from "cloudflare/resources/workers.mjs";
import { toFile, type Uploadable } from "cloudflare/uploads.mjs";
import { Eta } from "eta";
import type { MaintenanceOptions } from "./types";

export const generateMaintenanceHTML = (
  options: MaintenanceOptions,
): string => {
  const eta = new Eta({ views: path.join(__dirname, "templates") });
  return eta.render("index.eta", options);
};

export const generateWorkerScript = (
  html: string,
  statusCode: number,
  retryAfterSeconds: number,
): string => {
  return `export default {
  async fetch(request) {
    return new Response(\`${html}\`, {
      status: ${statusCode},
      headers: {
        "content-type": "text/html;charset=UTF-8",
        "Retry-After": "${retryAfterSeconds}",
      },
    });
  },
};`;
};

export const createWorkerFile = async (
  options: MaintenanceOptions,
): Promise<{
  metadata: ScriptUpdateParams.Metadata;
  files: Record<string, Uploadable>;
}> => {
  const html = generateMaintenanceHTML(options);
  const workerScript = generateWorkerScript(
    html,
    options.statusCode,
    options.retryAfterSeconds,
  );

  return {
    metadata: {
      main_module: "worker.js",
      compatibility_date: "2025-07-26",
    },
    files: {
      "worker.js": await toFile(Buffer.from(workerScript), "worker.js", {
        type: "application/javascript+module",
      }),
    },
  };
};
