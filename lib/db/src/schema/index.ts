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
