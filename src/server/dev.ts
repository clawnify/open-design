import "dotenv/config";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import app from "./index.js";

const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  app.use("/*", serveStatic({ root: "./dist" }));
  app.get("*", serveStatic({ root: "./dist", rewriteRequestPath: () => "/index.html" }));
}

const port = 3006;
console.log(`API server running on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
