import { Router } from "express";
import {
  isN8nConfigured,
  testN8nConnection,
  listWorkflows,
  getWorkflow,
  activateWorkflow,
  deactivateWorkflow,
  listExecutions,
  N8nConfigError,
  N8nApiError,
} from "../lib/n8nClient.js";

const router = Router();

function handleN8nError(
  err: unknown,
  res: import("express").Response,
  requestId: unknown
) {
  if (err instanceof N8nConfigError) {
    res.status(503).json({
      ok: false,
      error: { code: "N8N_NOT_CONFIGURED", message: err.message },
      requestId,
    });
  } else if (err instanceof N8nApiError) {
    res.status(err.status >= 400 && err.status < 600 ? err.status : 502).json({
      ok: false,
      error: { code: "N8N_API_ERROR", message: err.message },
      requestId,
    });
  } else {
    res.status(502).json({
      ok: false,
      error: {
        code: "N8N_UPSTREAM_ERROR",
        message: err instanceof Error ? err.message : "خطأ في الاتصال بـ n8n",
      },
      requestId,
    });
  }
}

// ─── Status / connection test ────────────────────────────────────────────────

router.get("/n8n/status", async (req, res) => {
  const result = await testN8nConnection();
  res.status(result.ok ? 200 : 503).json({
    ok: result.ok,
    configured: isN8nConfigured(),
    message: result.message,
    baseUrl: result.baseUrl
      ? result.baseUrl.replace(/\/+$/, "").split("/").slice(0, 3).join("/")
      : undefined,
    requestId: req.id,
  });
});

// ─── Workflows ───────────────────────────────────────────────────────────────

router.get("/n8n/workflows", async (req, res) => {
  try {
    const data = await listWorkflows(50);
    res.json({ ok: true, data: data.data, requestId: req.id });
  } catch (err) {
    handleN8nError(err, res, req.id);
  }
});

router.get("/n8n/workflows/:id", async (req, res) => {
  try {
    const data = await getWorkflow(req.params.id);
    res.json({ ok: true, data, requestId: req.id });
  } catch (err) {
    handleN8nError(err, res, req.id);
  }
});

router.post("/n8n/workflows/:id/activate", async (req, res) => {
  try {
    const data = await activateWorkflow(req.params.id);
    res.json({ ok: true, data, requestId: req.id });
  } catch (err) {
    handleN8nError(err, res, req.id);
  }
});

router.post("/n8n/workflows/:id/deactivate", async (req, res) => {
  try {
    const data = await deactivateWorkflow(req.params.id);
    res.json({ ok: true, data, requestId: req.id });
  } catch (err) {
    handleN8nError(err, res, req.id);
  }
});

// ─── Executions ──────────────────────────────────────────────────────────────

router.get("/n8n/executions", async (req, res) => {
  try {
    const workflowId = req.query.workflowId as string | undefined;
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    const data = await listExecutions(workflowId, limit);
    res.json({ ok: true, data: data.data, requestId: req.id });
  } catch (err) {
    handleN8nError(err, res, req.id);
  }
});

export default router;
