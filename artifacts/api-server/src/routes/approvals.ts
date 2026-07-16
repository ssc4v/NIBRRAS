import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, approvalsTable, auditLogsTable } from "@workspace/db";
import { logger } from "../lib/logger.js";

const router = Router();

// ─── List ────────────────────────────────────────────────────────────────────

router.get("/approvals", async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const approvals = await db
      .select()
      .from(approvalsTable)
      .orderBy(desc(approvalsTable.requestedAt));

    const filtered = status
      ? approvals.filter((a) => a.status === status)
      : approvals;

    res.json({ ok: true, data: filtered });
  } catch (err) {
    next(err);
  }
});

// ─── Create ──────────────────────────────────────────────────────────────────

router.post("/approvals", async (req, res, next) => {
  try {
    const body = req.body as Record<string, unknown>;

    if (!body.action || typeof body.action !== "string") {
      res.status(400).json({
        ok: false,
        error: { code: "VALIDATION_ERROR", message: "الإجراء المطلوب موافقته مطلوب" },
        requestId: req.id,
      });
      return;
    }

    const validRisks = new Set(["low", "medium", "high", "critical"]);
    const riskLevel = validRisks.has(String(body.riskLevel))
      ? (String(body.riskLevel) as "low" | "medium" | "high" | "critical")
      : "medium";

    const id = randomUUID();
    const expiresAt = body.expiresAt
      ? new Date(String(body.expiresAt))
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h default

    const [approval] = await db
      .insert(approvalsTable)
      .values({
        id,
        action: body.action.trim(),
        employeeId: body.employeeId ? String(body.employeeId) : null,
        workflowId: body.workflowId ? String(body.workflowId) : null,
        riskLevel,
        reason: body.reason ? String(body.reason) : null,
        proposedInput: body.proposedInput as Record<string, unknown> ?? null,
        proposedOutput: body.proposedOutput as Record<string, unknown> ?? null,
        estimatedCost: body.estimatedCost ? String(body.estimatedCost) : null,
        status: "pending",
        expiresAt,
      })
      .returning();

    logger.info({ approvalId: id, action: body.action }, "approval created");
    res.status(201).json({ ok: true, data: approval, requestId: req.id });
  } catch (err) {
    next(err);
  }
});

// ─── Get one ─────────────────────────────────────────────────────────────────

router.get("/approvals/:id", async (req, res, next) => {
  try {
    const [approval] = await db
      .select()
      .from(approvalsTable)
      .where(eq(approvalsTable.id, req.params.id));

    if (!approval) {
      res.status(404).json({
        ok: false,
        error: { code: "NOT_FOUND", message: "الموافقة غير موجودة" },
        requestId: req.id,
      });
      return;
    }
    res.json({ ok: true, data: approval });
  } catch (err) {
    next(err);
  }
});

// ─── Approve ─────────────────────────────────────────────────────────────────

router.post("/approvals/:id/approve", async (req, res, next) => {
  try {
    const [existing] = await db
      .select()
      .from(approvalsTable)
      .where(eq(approvalsTable.id, req.params.id));

    if (!existing) {
      res.status(404).json({ ok: false, error: { code: "NOT_FOUND", message: "الموافقة غير موجودة" }, requestId: req.id });
      return;
    }

    if (existing.status !== "pending") {
      res.status(409).json({
        ok: false,
        error: { code: "ALREADY_RESOLVED", message: "تمت معالجة هذا الطلب مسبقًا" },
        requestId: req.id,
      });
      return;
    }

    const comment = req.body?.comment ? String(req.body.comment) : null;
    const now = new Date();

    const [updated] = await db
      .update(approvalsTable)
      .set({ status: "approved", comment, resolvedAt: now })
      .where(eq(approvalsTable.id, req.params.id))
      .returning();

    await db.insert(auditLogsTable).values({
      actor: "user",
      employeeId: existing.employeeId ?? undefined,
      workflowId: existing.workflowId ?? undefined,
      action: "approval.approved",
      approvalId: req.params.id,
      prevState: { status: "pending" } as Record<string, unknown>,
      newState: { status: "approved", comment } as Record<string, unknown>,
    });

    logger.info({ approvalId: req.params.id }, "approval approved");
    res.json({ ok: true, data: updated, requestId: req.id });
  } catch (err) {
    next(err);
  }
});

// ─── Reject ──────────────────────────────────────────────────────────────────

router.post("/approvals/:id/reject", async (req, res, next) => {
  try {
    const [existing] = await db
      .select()
      .from(approvalsTable)
      .where(eq(approvalsTable.id, req.params.id));

    if (!existing) {
      res.status(404).json({ ok: false, error: { code: "NOT_FOUND", message: "الموافقة غير موجودة" }, requestId: req.id });
      return;
    }

    if (existing.status !== "pending") {
      res.status(409).json({
        ok: false,
        error: { code: "ALREADY_RESOLVED", message: "تمت معالجة هذا الطلب مسبقًا" },
        requestId: req.id,
      });
      return;
    }

    const comment = req.body?.comment ? String(req.body.comment) : null;

    const [updated] = await db
      .update(approvalsTable)
      .set({ status: "rejected", comment, resolvedAt: new Date() })
      .where(eq(approvalsTable.id, req.params.id))
      .returning();

    await db.insert(auditLogsTable).values({
      actor: "user",
      employeeId: existing.employeeId ?? undefined,
      action: "approval.rejected",
      approvalId: req.params.id,
      prevState: { status: "pending" } as Record<string, unknown>,
      newState: { status: "rejected", comment } as Record<string, unknown>,
    });

    logger.info({ approvalId: req.params.id }, "approval rejected");
    res.json({ ok: true, data: updated, requestId: req.id });
  } catch (err) {
    next(err);
  }
});

export default router;
