import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, aiEmployeesTable, auditLogsTable } from "@workspace/db";
import { logger } from "../lib/logger.js";

const router = Router();

const VALID_STATUSES = new Set([
  "draft", "testing", "active", "paused", "failed", "waiting_approval", "archived",
]);
const VALID_MODES = new Set([
  "manual", "scheduled", "event_driven", "supervised", "autonomous",
]);

async function logAudit(
  action: string,
  employeeId: string | null,
  prevState: unknown,
  newState: unknown
) {
  try {
    await db.insert(auditLogsTable).values({
      actor: "user",
      employeeId: employeeId ?? undefined,
      action,
      prevState: prevState as Record<string, unknown>,
      newState: newState as Record<string, unknown>,
    });
  } catch {
    // audit failures must not break the main operation
  }
}

// ─── List ────────────────────────────────────────────────────────────────────

router.get("/employees", async (_req, res, next) => {
  try {
    const employees = await db
      .select()
      .from(aiEmployeesTable)
      .orderBy(desc(aiEmployeesTable.createdAt));
    res.json({ ok: true, data: employees });
  } catch (err) {
    next(err);
  }
});

// ─── Create ──────────────────────────────────────────────────────────────────

router.post("/employees", async (req, res, next) => {
  try {
    const body = req.body as Record<string, unknown>;

    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      res.status(400).json({
        ok: false,
        error: { code: "VALIDATION_ERROR", message: "اسم الموظف مطلوب" },
        requestId: req.id,
      });
      return;
    }

    if (!body.jobTitle || typeof body.jobTitle !== "string") {
      res.status(400).json({
        ok: false,
        error: { code: "VALIDATION_ERROR", message: "المسمى الوظيفي مطلوب" },
        requestId: req.id,
      });
      return;
    }

    const id = randomUUID();
    const mode = VALID_MODES.has(String(body.operatingMode))
      ? (String(body.operatingMode) as "manual" | "scheduled" | "event_driven" | "supervised" | "autonomous")
      : "supervised";

    const [employee] = await db
      .insert(aiEmployeesTable)
      .values({
        id,
        name: body.name.trim(),
        jobTitle: String(body.jobTitle).trim(),
        department: body.department ? String(body.department) : null,
        description: body.description ? String(body.description) : null,
        avatar: body.avatar ? String(body.avatar) : "🤖",
        mainObjective: body.mainObjective ? String(body.mainObjective) : null,
        responsibilities: Array.isArray(body.responsibilities)
          ? (body.responsibilities as string[])
          : [],
        allowedActions: Array.isArray(body.allowedActions)
          ? (body.allowedActions as string[])
          : [],
        forbiddenActions: Array.isArray(body.forbiddenActions)
          ? (body.forbiddenActions as string[])
          : [],
        supervisorId: body.supervisorId ? String(body.supervisorId) : null,
        communicationStyle: body.communicationStyle
          ? String(body.communicationStyle)
          : "رسمي",
        preferredLanguage: body.preferredLanguage
          ? String(body.preferredLanguage)
          : "ar",
        status: "draft",
        operatingMode: mode,
        tools: Array.isArray(body.tools) ? (body.tools as string[]) : [],
        integrations: Array.isArray(body.integrations)
          ? (body.integrations as string[])
          : [],
        permissions:
          body.permissions && typeof body.permissions === "object"
            ? (body.permissions as Record<string, boolean>)
            : {},
        memoryConfig:
          body.memoryConfig && typeof body.memoryConfig === "object"
            ? (body.memoryConfig as Record<string, unknown>)
            : {},
        knowledgeSources: Array.isArray(body.knowledgeSources)
          ? (body.knowledgeSources as string[])
          : [],
        connectedWorkflows: Array.isArray(body.connectedWorkflows)
          ? (body.connectedWorkflows as string[])
          : [],
        approvalPolicy: body.approvalPolicy ? String(body.approvalPolicy) : "all",
        templateId: body.templateId ? String(body.templateId) : null,
      })
      .returning();

    await logAudit("employee.created", id, null, employee);
    logger.info({ employeeId: id, name: body.name }, "employee created");
    res.status(201).json({ ok: true, data: employee, requestId: req.id });
  } catch (err) {
    next(err);
  }
});

// ─── Get one ─────────────────────────────────────────────────────────────────

router.get("/employees/:id", async (req, res, next) => {
  try {
    const [employee] = await db
      .select()
      .from(aiEmployeesTable)
      .where(eq(aiEmployeesTable.id, req.params.id));

    if (!employee) {
      res.status(404).json({
        ok: false,
        error: { code: "NOT_FOUND", message: "الموظف غير موجود" },
        requestId: req.id,
      });
      return;
    }
    res.json({ ok: true, data: employee });
  } catch (err) {
    next(err);
  }
});

// ─── Update ──────────────────────────────────────────────────────────────────

router.patch("/employees/:id", async (req, res, next) => {
  try {
    const [existing] = await db
      .select()
      .from(aiEmployeesTable)
      .where(eq(aiEmployeesTable.id, req.params.id));

    if (!existing) {
      res.status(404).json({
        ok: false,
        error: { code: "NOT_FOUND", message: "الموظف غير موجود" },
        requestId: req.id,
      });
      return;
    }

    const body = req.body as Record<string, unknown>;

    // Sanitize status/mode if provided
    if (body.status && !VALID_STATUSES.has(String(body.status))) {
      delete body.status;
    }
    if (body.operatingMode && !VALID_MODES.has(String(body.operatingMode))) {
      delete body.operatingMode;
    }

    // Prevent updating immutable fields
    delete body.id;
    delete body.createdAt;

    const [updated] = await db
      .update(aiEmployeesTable)
      .set({ ...(body as Partial<typeof aiEmployeesTable.$inferInsert>), updatedAt: new Date() })
      .where(eq(aiEmployeesTable.id, req.params.id))
      .returning();

    await logAudit("employee.updated", req.params.id, existing, updated);
    res.json({ ok: true, data: updated, requestId: req.id });
  } catch (err) {
    next(err);
  }
});

// ─── Status actions ───────────────────────────────────────────────────────────

const STATUS_ACTIONS: Record<
  string,
  "active" | "paused" | "archived" | "testing"
> = {
  activate: "active",
  pause: "paused",
  archive: "archived",
  test: "testing",
};

router.post("/employees/:id/:action(activate|pause|archive|test)", async (req, res, next) => {
  try {
    const newStatus = STATUS_ACTIONS[req.params.action];

    const [employee] = await db
      .select()
      .from(aiEmployeesTable)
      .where(eq(aiEmployeesTable.id, req.params.id));

    if (!employee) {
      res.status(404).json({
        ok: false,
        error: { code: "NOT_FOUND", message: "الموظف غير موجود" },
        requestId: req.id,
      });
      return;
    }

    const [updated] = await db
      .update(aiEmployeesTable)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(aiEmployeesTable.id, req.params.id))
      .returning();

    await logAudit(
      `employee.${req.params.action}`,
      req.params.id,
      { status: employee.status },
      { status: newStatus }
    );

    logger.info(
      { employeeId: req.params.id, action: req.params.action, newStatus },
      "employee status changed"
    );
    res.json({ ok: true, data: updated, requestId: req.id });
  } catch (err) {
    next(err);
  }
});

// ─── Duplicate ────────────────────────────────────────────────────────────────

router.post("/employees/:id/duplicate", async (req, res, next) => {
  try {
    const [source] = await db
      .select()
      .from(aiEmployeesTable)
      .where(eq(aiEmployeesTable.id, req.params.id));

    if (!source) {
      res.status(404).json({
        ok: false,
        error: { code: "NOT_FOUND", message: "الموظف المصدر غير موجود" },
        requestId: req.id,
      });
      return;
    }

    const { id: _id, createdAt: _ca, updatedAt: _ua, ...rest } = source;
    const newId = randomUUID();

    const [clone] = await db
      .insert(aiEmployeesTable)
      .values({
        ...rest,
        id: newId,
        name: `${rest.name} (نسخة)`,
        status: "draft",
        successCount: 0,
        errorCount: 0,
        pendingApprovals: 0,
        currentTask: null,
        lastActivityAt: null,
      })
      .returning();

    await logAudit("employee.duplicated", newId, { sourceId: req.params.id }, clone);
    res.status(201).json({ ok: true, data: clone, requestId: req.id });
  } catch (err) {
    next(err);
  }
});

// ─── Delete (soft-delete via archive) ─────────────────────────────────────────

router.delete("/employees/:id", async (req, res, next) => {
  try {
    const [existing] = await db
      .select()
      .from(aiEmployeesTable)
      .where(eq(aiEmployeesTable.id, req.params.id));

    if (!existing) {
      res.status(404).json({
        ok: false,
        error: { code: "NOT_FOUND", message: "الموظف غير موجود" },
        requestId: req.id,
      });
      return;
    }

    await db
      .update(aiEmployeesTable)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(aiEmployeesTable.id, req.params.id));

    await logAudit("employee.deleted", req.params.id, existing, { status: "archived" });
    res.json({ ok: true, message: "تم حذف الموظف بنجاح", requestId: req.id });
  } catch (err) {
    next(err);
  }
});

export default router;
