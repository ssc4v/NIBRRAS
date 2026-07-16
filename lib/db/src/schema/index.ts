import { pgTable, text, bigserial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ─── Chat messages ─────────────────────────────────────────────────────────

export const messagesTable = pgTable("messages", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  sessionId: text("session_id"),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messagesTable).omit({ id: true, createdAt: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messagesTable.$inferSelect;

// ─── Knowledge tree ────────────────────────────────────────────────────────

export const knowledgeNodesTable = pgTable("knowledge_nodes", {
  id: text("id").primaryKey(),
  parentId: text("parent_id"),
  label: text("label").notNull(),
  type: text("type", { enum: ["domain", "area", "branch", "sub-branch", "lesson"] }).notNull(),
  mastery: integer("mastery").notNull().default(0),
  status: text("status", {
    enum: ["new", "learning", "mastered", "needs-review", "missing-basics"],
  })
    .notNull()
    .default("new"),
  childCount: integer("child_count").notNull().default(0),
  questionCount: integer("question_count").notNull().default(0),
  dependencies: text("dependencies").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertKnowledgeNodeSchema = createInsertSchema(knowledgeNodesTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertKnowledgeNode = z.infer<typeof insertKnowledgeNodeSchema>;
export type KnowledgeNode = typeof knowledgeNodesTable.$inferSelect;

// ─── Knowledge relationships ───────────────────────────────────────────────

export const knowledgeEdgesTable = pgTable("knowledge_edges", {
  id: text("id").primaryKey(),
  sourceId: text("source_id").notNull(),
  targetId: text("target_id").notNull(),
  type: text("type").notNull(),
  strength: text("strength", { enum: ["ضعيف", "متوسط", "قوي"] }).notNull(),
  confidence: integer("confidence").notNull().default(0),
  reason: text("reason"),
  createdBy: text("created_by", { enum: ["user", "mock-ai", "system"] })
    .notNull()
    .default("system"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertKnowledgeEdgeSchema = createInsertSchema(knowledgeEdgesTable).omit({ createdAt: true });
export type InsertKnowledgeEdge = z.infer<typeof insertKnowledgeEdgeSchema>;
export type KnowledgeEdge = typeof knowledgeEdgesTable.$inferSelect;

// ─── Questions ──────────────────────────────────────────────────────────────

export const questionsTable = pgTable("questions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  linkedNodeId: text("linked_node_id"),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).notNull(),
  masteryImpact: integer("mastery_impact").notNull().default(0),
  lastAnswered: timestamp("last_answered", { withTimezone: true }),
  correctCount: integer("correct_count").notNull().default(0),
  incorrectCount: integer("incorrect_count").notNull().default(0),
  reviewDate: timestamp("review_date", { withTimezone: true }),
  mediaUrl: text("media_url"),
  options: jsonb("options").$type<string[]>(),
  correctAnswer: jsonb("correct_answer").$type<string | number | string[]>(),
  explanation: text("explanation"),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertQuestionSchema = createInsertSchema(questionsTable).omit({ createdAt: true });
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questionsTable.$inferSelect;

// ─── Learning files ─────────────────────────────────────────────────────────

export const learningFilesTable = pgTable("learning_files", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  url: text("url"),
  linkedNodeId: text("linked_node_id"),
  linkedQuestionsCount: integer("linked_questions_count").notNull().default(0),
  inReviewQueue: boolean("in_review_queue").notNull().default(false),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLearningFileSchema = createInsertSchema(learningFilesTable).omit({ createdAt: true });
export type InsertLearningFile = z.infer<typeof insertLearningFileSchema>;
export type LearningFile = typeof learningFilesTable.$inferSelect;

// ─── Review / mastery ───────────────────────────────────────────────────────

export const reviewScheduleTable = pgTable("review_schedule", {
  questionId: text("question_id").primaryKey(),
  nextReviewDate: timestamp("next_review_date", { withTimezone: true }).notNull(),
});

export type ReviewSchedule = typeof reviewScheduleTable.$inferSelect;

export const masteryRecordsTable = pgTable("mastery_records", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  nodeId: text("node_id").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  masteryDelta: integer("mastery_delta").notNull(),
});

export type MasteryRecord = typeof masteryRecordsTable.$inferSelect;

// ─── AI Employees ───────────────────────────────────────────────────────────

export const aiEmployeesTable = pgTable("ai_employees", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  jobTitle: text("job_title").notNull(),
  department: text("department"),
  description: text("description"),
  avatar: text("avatar").default("🤖"),
  mainObjective: text("main_objective"),
  responsibilities: jsonb("responsibilities").$type<string[]>().default([]),
  allowedActions: jsonb("allowed_actions").$type<string[]>().default([]),
  forbiddenActions: jsonb("forbidden_actions").$type<string[]>().default([]),
  supervisorId: text("supervisor_id"),
  communicationStyle: text("communication_style").default("رسمي"),
  preferredLanguage: text("preferred_language").default("ar"),
  status: text("status", {
    enum: ["draft", "testing", "active", "paused", "failed", "waiting_approval", "archived"],
  }).notNull().default("draft"),
  operatingMode: text("operating_mode", {
    enum: ["manual", "scheduled", "event_driven", "supervised", "autonomous"],
  }).notNull().default("supervised"),
  tools: jsonb("tools").$type<string[]>().default([]),
  integrations: jsonb("integrations").$type<string[]>().default([]),
  permissions: jsonb("permissions").$type<Record<string, boolean>>().default({}),
  memoryConfig: jsonb("memory_config").$type<Record<string, unknown>>().default({}),
  knowledgeSources: jsonb("knowledge_sources").$type<string[]>().default([]),
  connectedWorkflows: jsonb("connected_workflows").$type<string[]>().default([]),
  approvalPolicy: text("approval_policy").default("all"),
  templateId: text("template_id"),
  version: integer("version").notNull().default(1),
  successCount: integer("success_count").notNull().default(0),
  errorCount: integer("error_count").notNull().default(0),
  pendingApprovals: integer("pending_approvals").notNull().default(0),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
  currentTask: text("current_task"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAiEmployeeSchema = createInsertSchema(aiEmployeesTable).omit({ createdAt: true, updatedAt: true });
export type InsertAiEmployee = z.infer<typeof insertAiEmployeeSchema>;
export type AiEmployee = typeof aiEmployeesTable.$inferSelect;

// ─── Workflow versions (backup + draft system) ─────────────────────────────

export const workflowVersionsTable = pgTable("workflow_versions", {
  id: text("id").primaryKey(),
  workflowId: text("workflow_id").notNull(),
  employeeId: text("employee_id"),
  versionNumber: integer("version_number").notNull(),
  name: text("name").notNull(),
  definition: jsonb("definition").notNull(),
  changeSummary: text("change_summary"),
  actor: text("actor").notNull().default("user"),
  testResult: text("test_result", { enum: ["passed", "failed", "pending", "skipped"] }).default("pending"),
  testOutput: jsonb("test_output"),
  publishStatus: text("publish_status", { enum: ["draft", "published", "archived"] }).notNull().default("draft"),
  previousVersionId: text("previous_version_id"),
  rollbackStatus: text("rollback_status"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type WorkflowVersion = typeof workflowVersionsTable.$inferSelect;

// ─── Tasks ─────────────────────────────────────────────────────────────────

export const tasksTable = pgTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  instructions: text("instructions"),
  priority: text("priority", { enum: ["low", "medium", "high", "urgent"] }).notNull().default("medium"),
  status: text("status", {
    enum: ["new", "planning", "waiting_approval", "running", "completed", "failed", "paused", "cancelled"],
  }).notNull().default("new"),
  deadline: timestamp("deadline", { withTimezone: true }),
  assignedEmployeeId: text("assigned_employee_id"),
  supervisorId: text("supervisor_id"),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  relatedWorkflowId: text("related_workflow_id"),
  inputData: jsonb("input_data"),
  outputData: jsonb("output_data"),
  errorMessage: text("error_message"),
  executionId: text("execution_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasksTable).omit({ createdAt: true, updatedAt: true });
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasksTable.$inferSelect;

// ─── Approvals ─────────────────────────────────────────────────────────────

export const approvalsTable = pgTable("approvals", {
  id: text("id").primaryKey(),
  action: text("action").notNull(),
  employeeId: text("employee_id"),
  workflowId: text("workflow_id"),
  riskLevel: text("risk_level", { enum: ["low", "medium", "high", "critical"] }).notNull().default("medium"),
  reason: text("reason"),
  proposedInput: jsonb("proposed_input"),
  proposedOutput: jsonb("proposed_output"),
  estimatedCost: text("estimated_cost"),
  status: text("status", { enum: ["pending", "approved", "rejected", "expired"] }).notNull().default("pending"),
  comment: text("comment"),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const insertApprovalSchema = createInsertSchema(approvalsTable).omit({ requestedAt: true });
export type InsertApproval = z.infer<typeof insertApprovalSchema>;
export type Approval = typeof approvalsTable.$inferSelect;

// ─── Audit logs ────────────────────────────────────────────────────────────

export const auditLogsTable = pgTable("audit_logs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  actor: text("actor").notNull().default("user"),
  employeeId: text("employee_id"),
  workflowId: text("workflow_id"),
  action: text("action").notNull(),
  prevState: jsonb("prev_state"),
  newState: jsonb("new_state"),
  approvalId: text("approval_id"),
  executionResult: text("execution_result"),
  errorCode: text("error_code"),
  rollbackInfo: jsonb("rollback_info"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AuditLog = typeof auditLogsTable.$inferSelect;

// ─── Notifications ─────────────────────────────────────────────────────────

export const notificationsTable = pgTable("notifications", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  employeeId: text("employee_id"),
  workflowId: text("workflow_id"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Notification = typeof notificationsTable.$inferSelect;
