// ─── Core chat types ───────────────────────────────────────────────────────────

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// ─── Control / n8n types ───────────────────────────────────────────────────────

export interface WorkflowAgent {
  id: string;
  workflowId: string;
  name: string;
  role: string;
  model: string;
  tools: string[];
  databases: string[];
  prompt: string;
  lastError?: string;
}

export interface Workflow {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  lastRun: string;
  agentsCount: number;
  pinned: boolean;
  hidden: boolean;
}

// ─── Search types ─────────────────────────────────────────────────────────────

export interface SearchResult {
  id: string;
  title: string;
  sourceType: 'Official Docs' | 'GitHub' | 'Reddit/Hacker News' | 'YouTube' | 'Articles' | 'Research Papers';
  trustScore: number;
  summary: string;
  url: string;
}

// ─── System / backup / log types ──────────────────────────────────────────────

export interface Backup {
  id: string;
  version: string;
  date: string;
  changedItem: string;
  status: 'completed' | 'failed' | 'pending';
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'error' | 'warning';
  message: string;
  source: string;
}

// ─── Legacy learning profile (kept for backward-compat) ───────────────────────

export interface SkillNode {
  id: string;
  label: string;
  mastery: number; // 0 to 100
  dependencies: string[];
}

export interface LearningProfile {
  id: string;
  skills: SkillNode[];
  todayLesson: {
    title: string;
    description: string;
    targetSkillId: string;
  };
  reviewQueue: {
    title: string;
    skillId: string;
  }[];
}

// ─── Knowledge Tree ───────────────────────────────────────────────────────────

export type KnowledgeNodeType = 'domain' | 'area' | 'branch' | 'sub-branch' | 'lesson';
export type KnowledgeNodeStatus = 'new' | 'learning' | 'mastered' | 'needs-review' | 'missing-basics';

export interface KnowledgeNode {
  id: string;
  parentId: string | null;
  label: string;
  type: KnowledgeNodeType;
  mastery: number; // 0-100
  status: KnowledgeNodeStatus;
  childCount: number;
  questionCount: number;
  dependencies: string[];
}

// ─── Knowledge Relationship Graph ────────────────────────────────────────────

export type KnowledgeRelationshipType =
  | 'يعتمد على'
  | 'متطلب سابق'
  | 'يشرح'
  | 'مثال على'
  | 'يشبه'
  | 'يعارض'
  | 'يسبب لبس مع'
  | 'يُستخدم في'
  | 'جزء من'
  | 'نتيجة لـ'
  | 'مرتبط بـ'
  | 'يختبر'
  | 'مأخوذ من ملف'
  | 'مولّد من فيديو'
  | 'يحتاج مراجعة بسبب';

export type RelationshipStrength = 'ضعيف' | 'متوسط' | 'قوي';

export interface KnowledgeEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: KnowledgeRelationshipType;
  strength: RelationshipStrength;
  confidence: number; // 0-100
  reason: string;
  createdBy: 'user' | 'mock-ai' | 'system';
  createdAt: string;
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

// ─── Questions ────────────────────────────────────────────────────────────────

export type QuestionType =
  | 'multiple-choice'
  | 'true-false'
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'order'
  | 'practical'
  | 'explain'
  | 'fill-in';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  title: string;
  type: QuestionType;
  linkedNodeId: string;
  difficulty: QuestionDifficulty;
  masteryImpact: number;
  lastAnswered?: string;
  correctCount: number;
  incorrectCount: number;
  reviewDate?: string;
  mediaUrl?: string;
  options?: string[];
  correctAnswer?: string | number | string[];
  explanation?: string;
  tags?: string[];
}

// ─── Learning Files ───────────────────────────────────────────────────────────

export type FileType = 'text' | 'image' | 'video' | 'youtube' | 'article' | 'pdf' | 'notes';

export interface LearningFile {
  id: string;
  title: string;
  type: FileType;
  url?: string;
  linkedNodeId?: string;
  linkedQuestionsCount: number;
  inReviewQueue: boolean;
  archived?: boolean;
}

// ─── Question Generator ───────────────────────────────────────────────────────

export interface GeneratedQuestionSet {
  id: string;
  sourceTitle: string;
  sourceUrl?: string;
  topics: string[];
  suggestedBranchId?: string;
  questions: Omit<Question, 'id'>[];
}

// ─── Review / Mastery ─────────────────────────────────────────────────────────

export interface ReviewSchedule {
  questionId: string;
  nextReviewDate: string;
}

export interface MasteryRecord {
  nodeId: string;
  date: string;
  masteryDelta: number;
}
