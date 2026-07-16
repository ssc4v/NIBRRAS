import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { isN8nConfigured, testN8nConnection } from "../lib/n8nClient.js";

const router = Router();

async function checkDatabase(): Promise<{
  ok: boolean;
  latencyMs: number;
  message: string;
}> {
  const start = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return { ok: true, latencyMs: Date.now() - start, message: "متاح" };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : "فشل الاتصال بقاعدة البيانات",
    };
  }
}

// ─── Basic liveness probe ─────────────────────────────────────────────────────

router.get("/healthz", (_req, res) => {
  res.json({ ok: true, status: "ok", service: "nibrras-api", timestamp: new Date().toISOString() });
});

// ─── Detailed system health ───────────────────────────────────────────────────

router.get("/health/system", async (req, res) => {
  const [dbStatus] = await Promise.all([checkDatabase()]);

  const nirbasAuthConfigured = Boolean(process.env.NIRBAS_AUTH_VALUE?.trim());
  const controlTokenConfigured = Boolean(process.env.REPLIT_CONTROL_TOKEN?.trim());
  const n8nConfigured = isN8nConfigured();

  let n8nStatus: { ok: boolean; message: string } = {
    ok: false,
    message: "غير مضبوط — أضف N8N_BASE_URL و N8N_API_KEY في Replit Secrets",
  };

  if (n8nConfigured) {
    // Only test connectivity if configured (to avoid slow responses when unconfigured)
    n8nStatus = await testN8nConnection();
  }

  const allCriticalOk = dbStatus.ok && nirbasAuthConfigured;

  res.status(allCriticalOk ? 200 : 503).json({
    ok: allCriticalOk,
    timestamp: new Date().toISOString(),
    requestId: req.id,
    services: {
      api: { ok: true, message: "يعمل" },
      database: {
        ok: dbStatus.ok,
        message: dbStatus.message,
        latencyMs: dbStatus.latencyMs,
      },
      nirbasGateway: {
        ok: nirbasAuthConfigured,
        message: nirbasAuthConfigured
          ? "بوابة نبراس مضبوطة"
          : "NIRBAS_AUTH_VALUE غير مضبوط",
      },
      n8n: {
        ok: n8nStatus.ok,
        configured: n8nConfigured,
        message: n8nStatus.message,
      },
      controlToken: {
        ok: controlTokenConfigured,
        message: controlTokenConfigured
          ? "مضبوط"
          : "REPLIT_CONTROL_TOKEN غير مضبوط",
      },
    },
  });
});

export default router;
