import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { query, get, run } from "./db.js";
import { putUpload, getUpload } from "./uploads.js";

const app = new OpenAPIHono();

// ── Schemas ──────────────────────────────────────────────────────────

const DesignSchema = z.object({
  id: z.number(),
  name: z.string(),
  canvas_json: z.string(),
  width: z.number(),
  height: z.number(),
  thumbnail_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const TemplateSchema = z.object({
  id: z.number(),
  name: z.string(),
  category: z.string(),
  canvas_json: z.string(),
  width: z.number(),
  height: z.number(),
  thumbnail_url: z.string().nullable(),
  sort_order: z.number(),
});

const ErrorSchema = z.object({ error: z.string() });

// ── List designs ────────────────────────────────────────────────────

const listDesigns = createRoute({
  method: "get",
  path: "/api/designs",
  responses: { 200: { content: { "application/json": { schema: z.array(DesignSchema) } }, description: "OK" } },
});

app.openapi(listDesigns, async (c) => {
  const rows = await query<z.infer<typeof DesignSchema>>("SELECT * FROM designs ORDER BY updated_at DESC");
  return c.json(rows, 200);
});

// ── Get design ──────────────────────────────────────────────────────

const getDesign = createRoute({
  method: "get",
  path: "/api/designs/{id}",
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: DesignSchema } }, description: "OK" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Not found" },
  },
});

app.openapi(getDesign, async (c) => {
  const { id } = c.req.valid("param");
  const row = await get<z.infer<typeof DesignSchema>>("SELECT * FROM designs WHERE id = ?", id);
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row, 200);
});

// ── Create design ───────────────────────────────────────────────────

const createDesign = createRoute({
  method: "post",
  path: "/api/designs",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string().optional(),
            canvas_json: z.string().optional(),
            width: z.number().optional(),
            height: z.number().optional(),
          }),
        },
      },
    },
  },
  responses: { 200: { content: { "application/json": { schema: DesignSchema } }, description: "OK" } },
});

app.openapi(createDesign, async (c) => {
  const { name, canvas_json, width, height } = c.req.valid("json");
  const result = await run(
    "INSERT INTO designs (name, canvas_json, width, height) VALUES (?, ?, ?, ?)",
    name || "Untitled Design",
    canvas_json || "{}",
    width || 1080,
    height || 1080
  );
  const row = await get<z.infer<typeof DesignSchema>>("SELECT * FROM designs WHERE id = ?", result.lastInsertRowid);
  return c.json(row!, 200);
});

// ── Update design ───────────────────────────────────────────────────

const updateDesign = createRoute({
  method: "put",
  path: "/api/designs/{id}",
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string().optional(),
            canvas_json: z.string().optional(),
            width: z.number().optional(),
            height: z.number().optional(),
            thumbnail_url: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { content: { "application/json": { schema: DesignSchema } }, description: "OK" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Not found" },
  },
});

app.openapi(updateDesign, async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const existing = await get<z.infer<typeof DesignSchema>>("SELECT * FROM designs WHERE id = ?", id);
  if (!existing) return c.json({ error: "Not found" }, 404);

  await run(
    `UPDATE designs SET name = ?, canvas_json = ?, width = ?, height = ?, thumbnail_url = ?, updated_at = datetime('now') WHERE id = ?`,
    body.name ?? existing.name,
    body.canvas_json ?? existing.canvas_json,
    body.width ?? existing.width,
    body.height ?? existing.height,
    body.thumbnail_url ?? existing.thumbnail_url,
    id
  );
  const row = await get<z.infer<typeof DesignSchema>>("SELECT * FROM designs WHERE id = ?", id);
  return c.json(row!, 200);
});

// ── Delete design ───────────────────────────────────────────────────

const deleteDesign = createRoute({
  method: "delete",
  path: "/api/designs/{id}",
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: z.object({ ok: z.boolean() }) } }, description: "OK" },
  },
});

app.openapi(deleteDesign, async (c) => {
  const { id } = c.req.valid("param");
  await run("DELETE FROM designs WHERE id = ?", id);
  return c.json({ ok: true }, 200);
});

// ── List templates ──────────────────────────────────────────────────

const listTemplates = createRoute({
  method: "get",
  path: "/api/templates",
  responses: { 200: { content: { "application/json": { schema: z.array(TemplateSchema) } }, description: "OK" } },
});

app.openapi(listTemplates, async (c) => {
  const rows = await query<z.infer<typeof TemplateSchema>>("SELECT * FROM templates ORDER BY sort_order");
  return c.json(rows, 200);
});

// ── Get template ────────────────────────────────────────────────────

const getTemplate = createRoute({
  method: "get",
  path: "/api/templates/{id}",
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: TemplateSchema } }, description: "OK" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Not found" },
  },
});

app.openapi(getTemplate, async (c) => {
  const { id } = c.req.valid("param");
  const row = await get<z.infer<typeof TemplateSchema>>("SELECT * FROM templates WHERE id = ?", id);
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row, 200);
});

// ── File uploads ────────────────────────────────────────────────────

app.post("/api/uploads", async (c) => {
  const body = await c.req.parseBody();
  const file = body["file"];
  if (!file || typeof file === "string") {
    return c.json({ error: "No file provided" }, 400);
  }

  const ext = file.name?.split(".").pop()?.toLowerCase() || "png";
  const allowed = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg"]);
  if (!allowed.has(ext)) {
    return c.json({ error: "Unsupported file type" }, 400);
  }

  const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const data = await file.arrayBuffer();
  const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "webp" ? "image/webp" : ext === "gif" ? "image/gif" : ext === "svg" ? "image/svg+xml" : "image/png";
  const url = await putUpload(filename, data, mime);

  return c.json({ url }, 200);
});

app.get("/api/uploads/:filename", async (c) => {
  const { filename } = c.req.param();
  const result = await getUpload(filename);
  if (!result) return c.json({ error: "Not found" }, 404);

  return new Response(result.data, {
    headers: { "Content-Type": result.contentType, "Cache-Control": "public, max-age=31536000" },
  });
});

// ── OpenAPI doc ─────────────────────────────────────────────────────

app.doc("/openapi.json", { openapi: "3.0.0", info: { title: "Canva App API", version: "1.0.0" } });

export default app;
