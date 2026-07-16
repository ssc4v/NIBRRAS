import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, tasksTable, approvalsTable, auditLogsTable } from "@workspace/db";
import { logger } from "../lib/logger.js";

const router = Router();

const VALID_STATUSES = new Set([
  "new", "planning", "waiting_approval", "running", "completed", "failed", "paused", "cancelled",
]);
const VALID_PRIORITIES = new Set(["low", "medium", "high", "urgent"]);

// ─── List ────────────────────────────────────────────────────────────────────

router.get("/tasks", async (req, res, next) => {
  try {
    const tasks = await db
      .select()
      .from(tasksTable)
      .orderBy(desc(tasksTable.createdAt));
    res.json({ ok: true, data: tasks });
  } catch (err) {
    next(err);
  }
});

// ─── Create ──────────────────────────────────────────────────────────────────

router.post("/tasks", async (req, res, next) => {
  try {
    const body = req.body as Record<string, unknown>;

    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      res.status(400).json({
        ok: false,
        error: { code: "VALIDATION_ERROR", message: "عنوان المهمة مطلوب" },
        requestId: req.id,
      });
      return;
    }

    const priority = VALID_PRIORITIES.has(String(body.priority))
      ? (String(body.priority) as "low" | "medium" | "high" | "urgent")
      : "medium";

    const id = randomUUID();
    const [task] = await db
      .insert(tasksTable)
      .values({
        id,
        title: body.title.trim(),
        instructions: body.instructions ? String(body.instructions) : null,
        priority,
        status: "new",
        deadline: body.deadline ? new Date(String(body.deadline)) : null,
        assignedEmployeeId: body.assignedEmployeeId
          ? String(body.assignedEmployeeId)
          : null,
        supervisorId: body.supervisorId ? String(body.supervisorId) : null,
        requiresApproval: Boolean(body.requiresApproval),
        relatedWorkflowId: body.relatedWorkflowId
          ? String(body.relatedWorkflowId)
          : null,
        inputData: body.inputData as Record<string, unknown> ?? null,
      })
      .returning();

    logger.info({ taskId: id, title: body.title }, "task created");
    res.status(201).json({ ok: true, data: task, requestId: req.id });
  } catch (err) {
    next(err);
  }
});

// ─── Get one ─────────────────────────────────────────────────────────────────

router.get("/tasks/:id", async (req, res, next) => {
  try {
    const [task] = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.id, req.params.id));

    if (!task) {
      res.status(404).json({
        ok: false,
        error: { code: "NOT_FOUND", message: "المهمة غير موجودة" },
        requestId: req.id,
      });
      return;
    }
    res.json({ ok: true, data: task });
  } catch (err) {
    next(err);
  }
});

// ─── Update ──────────────────────────────────────────────────────────────────

router.patch("/tasks/:id", async (req, res, next) => {
  try {
    const [existing] = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.id, req.params.id));

    if (!existing) {
      res.status(404).json({
        ok: false,
        error: { code: "NOT_FOUND", message: "المهمة غير موجودة" },
        requestId: req.id,
      });
      return;
    }

    const body = req.body as Record<string, unknown>;
    delete body.id;
    delete body.createdAt;

    if (body.status && !VALID_STATUSES.has(String(body.status))) {
      delete body.status;
    }

    const [updated] = await db
      .update(tasksTable)
      .set({ ...(body as Partial<typeof tasksTable.$inferInsert>), updatedAt: new Date() })
      .where(eq(tasksTable.id, req.params.id))
      .returning();

    res.json({ ok: true, data: updated, requestId: req.id });
  } catch (err) {
    next(err);
  }
});

// ─── Task actions ─────────────────────────────────────────────────────────────

router.post("/tasks/:id/cancel", async (req, res, next) => {
  try {
    const [task] = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.id, req.params.id));

    if (!task) {
      res.status(404).json({ ok: false, error: { code: "NOT_FOUND", message: "المهمة غير موجودة" }, requestId: req.id });
      return;
    }

    const [updated] = await db
      .update(tasksTable)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(tasksTable.id, req.params.id))
      .returning();

    res.json({ ok: true, data: updated, requestId: req.id });
  } catch (err) {
    next(err);
  }
});

export default router;
