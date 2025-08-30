import type { ScriptUpdateParams } from "cloudflare/resources/workers.mjs";
import { toFile, type Uploadable } from "cloudflare/uploads.mjs";
import { Eta } from "eta";
import templatePath from "../templates/index.eta" with { type: "file" };
import type { PageConfig } from "./config";

const templateFile = Bun.file(templatePath);

export const generateMaintenanceHTML = async (options: PageConfig) => {
  const eta = new Eta();
  return eta.renderString(await templateFile.text(), options);
};

export const generateWorkerScript = (
  html: string,
  statusCode: number,
  retryAfterSeconds: number,
  bypassValue?: string,
): string => {
  const bypassCheck = bypassValue
    ? `if (url.searchParams.get("bypass") === "${bypassValue}") { return fetch(request); }`
    : "";

  return `export default {
  async fetch(request) {
    const url = new URL(request.url);
    ${bypassCheck}

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
  options: PageConfig,
): Promise<{
  metadata: ScriptUpdateParams.Metadata;
  files: Record<string, Uploadable>;
}> => {
  const html = await generateMaintenanceHTML(options);
  const workerScript = generateWorkerScript(
    html,
    options.statusCode,
    options.retryAfterSeconds,
    options.bypassValue,
  );

  return {
    metadata: {
      main_module: "worker.js",
      compatibility_date: "2025-08-28",
    },
    files: {
      "worker.js": await toFile(Buffer.from(workerScript), "worker.js", {
        type: "application/javascript+module",
      }),
    },
  };
};
