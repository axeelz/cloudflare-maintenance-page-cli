import { generateMaintenanceHTML } from "../src/worker.js";
import { maintenanceConfig } from "../config.js";

const html = generateMaintenanceHTML(maintenanceConfig);

console.log("Starting development server...");
console.log("Server available at: http://localhost:3000");
console.log("Press Ctrl+C to stop\n");

Bun.serve({
  port: 3000,
  fetch() {
    return new Response(html, {
      headers: {
        "content-type": "text/html;charset=UTF-8",
        "cache-control": "no-cache, no-store, must-revalidate",
      },
    });
  },
});
