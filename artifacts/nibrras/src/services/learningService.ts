/**
 * learningService.ts — Mock-only implementation.
 * All functions operate on in-memory arrays seeded from mockData.
 * No real API calls, no backend, no n8n contact.
 * When real backend is approved, swap implementations here only.
 * UI must call this service exclusively — never import mockData directly.
 */

import {
  mockKnowledgeNodes,
  mockKnowledgeEdges,
  mockQuestions,
  mockLearningFiles,
} from '../data/mockData';
import type {
  KnowledgeNode,
  KnowledgeNodeType,
  KnowledgeEdge,
  KnowledgeRelationshipType,
  RelationshipStrength,
  Question,
  QuestionType,
  QuestionDifficulty,
  LearningFile,
  FileType,
  GeneratedQuestionSet,
} from '../types';

// ─── In-memory store (seeded from mock data) ──────────────────────────────────

let _nodes: KnowledgeNode[] = mockKnowledgeNodes.map((n) => ({ ...n }));
let _edges: KnowledgeEdge[] = mockKnowledgeEdges.map((e) => ({ ...e }));
let _questions: Question[] = mockQuestions.map((q) => ({ ...q }));
let _files: LearningFile[] = mockLearningFiles.map((f) => ({ ...f }));

// ─── Utilities ────────────────────────────────────────────────────────────────

function delay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Knowledge Tree ───────────────────────────────────────────────────────────

export async function getLearningTree(): Promise<KnowledgeNode[]> {
  await delay();
  return _nodes.filter((n) => !('archived' in n && n.archived));
}

export async function createKnowledgeNode(
  label: string,
  parentId: string | null = null,
  type: KnowledgeNodeType = 'lesson',
): Promise<KnowledgeNode> {
  await delay();
  const node: KnowledgeNode = {
    id: uid(),
    parentId,
    label,
    type,
    mastery: 0,
    status: 'new',
    childCount: 0,
    questionCount: 0,
    dependencies: [],
  };
  _nodes.push(node);
  // update parent childCount
  if (parentId) {
    const parent = _nodes.find((n) => n.id === parentId);
    if (parent) parent.childCount += 1;
  }
  return { ...node };
}

export async function updateKnowledgeNode(
  id: string,
  updates: Partial<KnowledgeNode>,
): Promise<KnowledgeNode> {
  await delay();
  const idx = _nodes.findIndex((n) => n.id === id);
  if (idx === -1) throw new Error('عقدة غير موجودة');
  _nodes[idx] = { ..._nodes[idx], ...updates };
  return { ..._nodes[idx] };
}

export async function archiveKnowledgeNode(id: string): Promise<void> {
  await delay();
  _nodes = _nodes.filter((n) => n.id !== id);
  // remove orphaned children
  _nodes = _nodes.filter((n) => n.parentId !== id);
}

// ─── Knowledge Relationship Graph ────────────────────────────────────────────

export async function getKnowledgeRelationshipGraph(): Promise<{
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}> {
  await delay();
  return { nodes: [..._nodes], edges: [..._edges] };
}

export async function getNodeRelationships(nodeId: string): Promise<KnowledgeEdge[]> {
  await delay();
  return _edges.filter((e) => e.sourceId === nodeId || e.targetId === nodeId);
}

export async function getRelatedNodes(nodeId: string): Promise<KnowledgeNode[]> {
  await delay();
  const relatedIds = new Set<string>();
  _edges
    .filter((e) => e.sourceId === nodeId || e.targetId === nodeId)
    .forEach((e) => {
      relatedIds.add(e.sourceId === nodeId ? e.targetId : e.sourceId);
    });
  return _nodes.filter((n) => relatedIds.has(n.id));
}

export async function createKnowledgeRelationship(
  data: Omit<KnowledgeEdge, 'id' | 'createdAt'>,
): Promise<KnowledgeEdge> {
  await delay();
  const edge: KnowledgeEdge = {
    ...data,
    id: uid(),
    createdAt: new Date().toISOString(),
  };
  _edges.push(edge);
  return { ...edge };
}

export async function updateKnowledgeRelationship(
  edgeId: string,
  updates: Partial<KnowledgeEdge>,
): Promise<KnowledgeEdge> {
  await delay();
  const idx = _edges.findIndex((e) => e.id === edgeId);
  if (idx === -1) throw new Error('علاقة غير موجودة');
  _edges[idx] = { ..._edges[idx], ...updates };
  return { ..._edges[idx] };
}

export async function removeKnowledgeRelationshipMock(edgeId: string): Promise<void> {
  await delay();
  _edges = _edges.filter((e) => e.id !== edgeId);
}

export async function findMissingPrerequisites(nodeId: string): Promise<KnowledgeNode[]> {
  await delay();
  const prereqEdges = _edges.filter(
    (e) =>
      e.targetId === nodeId &&
      (e.type === 'متطلب سابق' || e.type === 'يعتمد على'),
  );
  const ids = new Set(prereqEdges.map((e) => e.sourceId));
  return _nodes.filter((n) => ids.has(n.id) && n.mastery < 50);
}

export async function getConfusingConcepts(nodeId: string): Promise<KnowledgeNode[]> {
  await delay();
  const confusingEdges = _edges.filter(
    (e) =>
      (e.sourceId === nodeId || e.targetId === nodeId) &&
      e.type === 'يسبب لبس مع',
  );
  const ids = new Set(
    confusingEdges.map((e) => (e.sourceId === nodeId ? e.targetId : e.sourceId)),
  );
  return _nodes.filter((n) => ids.has(n.id));
}

export async function getRecommendedNextNode(
  currentNodeId: string,
): Promise<KnowledgeNode | null> {
  await delay();
  const relatedIds = new Set<string>();
  _edges
    .filter((e) => e.sourceId === currentNodeId || e.targetId === currentNodeId)
    .forEach((e) => {
      relatedIds.add(e.sourceId === currentNodeId ? e.targetId : e.sourceId);
    });
  const candidates = _nodes.filter((n) => relatedIds.has(n.id) && n.mastery < 70);
  return candidates.length > 0 ? { ...candidates[0] } : null;
}

// ─── Questions ────────────────────────────────────────────────────────────────

export async function listQuestions(linkedNodeId?: string): Promise<Question[]> {
  await delay();
  if (linkedNodeId) return _questions.filter((q) => q.linkedNodeId === linkedNodeId);
  return [..._questions];
}

export async function createQuestion(
  data: { title: string; type?: QuestionType; difficulty?: QuestionDifficulty; linkedNodeId?: string } & Partial<Question>,
): Promise<Question> {
  await delay();
  const { id: _ignored, title, type, linkedNodeId, difficulty, masteryImpact, ...extra } = data;
  const q: Question = {
    ...extra,
    id: uid(),
    title,
    type: type ?? 'text',
    linkedNodeId: linkedNodeId ?? '',
    difficulty: difficulty ?? 'medium',
    masteryImpact: masteryImpact ?? 10,
    correctCount: 0,
    incorrectCount: 0,
  };
  _questions.push(q);
  return { ...q };
}

export async function updateQuestion(
  id: string,
  updates: Partial<Question>,
): Promise<Question> {
  await delay();
  const idx = _questions.findIndex((q) => q.id === id);
  if (idx === -1) throw new Error('سؤال غير موجود');
  _questions[idx] = { ..._questions[idx], ...updates };
  return { ..._questions[idx] };
}

export async function deleteQuestion(id: string): Promise<void> {
  await delay();
  _questions = _questions.filter((q) => q.id !== id);
}

export async function linkQuestionToConcept(
  questionId: string,
  conceptId: string,
): Promise<Question> {
  return updateQuestion(questionId, { linkedNodeId: conceptId });
}

export async function addGeneratedQuestionsToBank(
  questionSet: GeneratedQuestionSet,
): Promise<Question[]> {
  await delay();
  const added: Question[] = [];
  for (const q of questionSet.questions) {
    const newQ: Question = {
      ...(q as Omit<Question, 'id'>),
      id: uid(),
      correctCount: 0,
      incorrectCount: 0,
    };
    _questions.push(newQ);
    added.push({ ...newQ });
  }
  return added;
}

// ─── Learning Files ───────────────────────────────────────────────────────────

export async function getLearningFiles(): Promise<LearningFile[]> {
  await delay();
  return _files.filter((f) => !f.archived);
}

export async function createLearningFile(
  data: { title: string; type?: FileType; url?: string; linkedNodeId?: string },
): Promise<LearningFile> {
  await delay();
  const f: LearningFile = {
    id: uid(),
    title: data.title,
    type: data.type ?? 'notes',
    url: data.url,
    linkedNodeId: data.linkedNodeId,
    linkedQuestionsCount: 0,
    inReviewQueue: false,
    archived: false,
  };
  _files.push(f);
  return { ...f };
}

export async function linkFileToConcept(
  fileId: string,
  conceptId: string,
): Promise<LearningFile> {
  await delay();
  const idx = _files.findIndex((f) => f.id === fileId);
  if (idx === -1) throw new Error('ملف غير موجود');
  _files[idx] = { ..._files[idx], linkedNodeId: conceptId };
  return { ..._files[idx] };
}

export async function archiveLearningFileMock(fileId: string): Promise<void> {
  await delay();
  const idx = _files.findIndex((f) => f.id === fileId);
  if (idx !== -1) _files[idx] = { ..._files[idx], archived: true };
}

export async function moveLearningFileMock(
  fileId: string,
  newNodeId: string,
): Promise<LearningFile> {
  return linkFileToConcept(fileId, newNodeId);
}

export async function generateQuestionsFromFileMock(
  fileId: string,
): Promise<GeneratedQuestionSet> {
  await delay(600);
  const file = _files.find((f) => f.id === fileId);
  return {
    id: uid(),
    sourceTitle: file?.title ?? 'ملف',
    topics: ['مفهوم مستخرج 1', 'مفهوم مستخرج 2'],
    suggestedBranchId: file?.linkedNodeId ?? 'ai-1',
    questions: [
      {
        title: `سؤال مستخرج من: ${file?.title ?? 'الملف'}`,
        type: 'text',
        linkedNodeId: file?.linkedNodeId ?? '',
        difficulty: 'medium',
        masteryImpact: 10,
        correctCount: 0,
        incorrectCount: 0,
      },
    ],
  };
}

// ─── Question Generator (Mock) ────────────────────────────────────────────────

export async function generateQuestionsFromTextMock(
  text: string,
): Promise<GeneratedQuestionSet> {
  await delay(800);
  const snippet = text.slice(0, 40);
  return {
    id: uid(),
    sourceTitle: `نص: ${snippet}…`,
    topics: ['الذكاء الاصطناعي', 'تعلم الآلة'],
    suggestedBranchId: 'ai-1-1',
    questions: [
      {
        title: `ما المفهوم الرئيسي في: "${snippet}…"؟`,
        type: 'text',
        linkedNodeId: 'ai-1-1',
        difficulty: 'medium',
        masteryImpact: 10,
        correctCount: 0,
        incorrectCount: 0,
      },
      {
        title: 'اشرح بكلامك الفكرة الأساسية التي وردت في النص.',
        type: 'explain',
        linkedNodeId: 'ai-1-1',
        difficulty: 'hard',
        masteryImpact: 15,
        correctCount: 0,
        incorrectCount: 0,
      },
      {
        title: 'صح أم خطأ: النص يتحدث عن موضوع تقني.',
        type: 'true-false',
        linkedNodeId: 'ai-1-1',
        difficulty: 'easy',
        masteryImpact: 5,
        correctCount: 0,
        incorrectCount: 0,
        correctAnswer: 'true',
      },
    ],
  };
}

export async function generateQuestionsFromYouTubeMock(
  url: string,
): Promise<GeneratedQuestionSet> {
  await delay(1200);
  return {
    id: uid(),
    sourceTitle: `فيديو YouTube`,
    sourceUrl: url,
    topics: ['الذكاء الاصطناعي', 'تعلم الآلة', 'البيانات'],
    suggestedBranchId: 'ai-1-1',
    questions: [
      {
        title: 'ما الموضوع الرئيسي الذي غطاه الفيديو؟',
        type: 'text',
        linkedNodeId: 'ai-1-1',
        difficulty: 'easy',
        masteryImpact: 5,
        correctCount: 0,
        incorrectCount: 0,
      },
      {
        title: 'رتب الخطوات التي شرحها المحاضر.',
        type: 'order',
        linkedNodeId: 'ai-1-1',
        difficulty: 'medium',
        masteryImpact: 10,
        correctCount: 0,
        incorrectCount: 0,
      },
      {
        title: 'صح أم خطأ: الفيديو يشرح أساسيات تعلم الآلة.',
        type: 'true-false',
        linkedNodeId: 'ai-1-1',
        difficulty: 'easy',
        masteryImpact: 5,
        correctCount: 0,
        incorrectCount: 0,
        correctAnswer: 'true',
      },
    ],
  };
}

export async function generateQuestionsFromImageMock(
  placeholder: string,
): Promise<GeneratedQuestionSet> {
  await delay(800);
  return {
    id: uid(),
    sourceTitle: `صورة/مخطط [Mock]: ${placeholder}`,
    topics: ['مفهوم مرئي'],
    suggestedBranchId: 'ai-1',
    questions: [
      {
        title: 'صف ما تراه في الصورة بكلامك.',
        type: 'explain',
        linkedNodeId: 'ai-1',
        difficulty: 'medium',
        masteryImpact: 10,
        correctCount: 0,
        incorrectCount: 0,
      },
      {
        title: 'ما المفهوم الذي يوضحه هذا المخطط؟',
        type: 'text',
        linkedNodeId: 'ai-1',
        difficulty: 'easy',
        masteryImpact: 5,
        correctCount: 0,
        incorrectCount: 0,
      },
    ],
  };
}

export async function generateQuestionsFromVideoMock(
  placeholder: string,
): Promise<GeneratedQuestionSet> {
  await delay(1000);
  return {
    id: uid(),
    sourceTitle: `مقطع فيديو [Mock]: ${placeholder}`,
    topics: ['محتوى الفيديو'],
    suggestedBranchId: 'ai-1',
    questions: [
      {
        title: 'استخرج النقطة الرئيسية من المقطع.',
        type: 'text',
        linkedNodeId: 'ai-1',
        difficulty: 'medium',
        masteryImpact: 10,
        correctCount: 0,
        incorrectCount: 0,
      },
    ],
  };
}

export async function generateRelationshipsFromYouTubeMock(
  url: string,
): Promise<KnowledgeEdge[]> {
  await delay(1200);
  const edge: KnowledgeEdge = {
    id: uid(),
    sourceId: 'ai-1-1',
    targetId: 'ai-1-1-1',
    type: 'مولّد من فيديو',
    strength: 'متوسط',
    confidence: 70,
    reason: `مستخرج تلقائيًا من: ${url.length > 40 ? url.slice(-40) : url}`,
    createdBy: 'mock-ai',
    createdAt: new Date().toISOString(),
  };
  _edges.push(edge);
  return [{ ...edge }];
}

export async function generateRelationshipsFromTextMock(
  text: string,
): Promise<KnowledgeEdge[]> {
  await delay(800);
  const edge: KnowledgeEdge = {
    id: uid(),
    sourceId: 'ai-1',
    targetId: 'ma-1',
    type: 'مرتبط بـ',
    strength: 'ضعيف',
    confidence: 50,
    reason: `مستخرج من النص: ${text.slice(0, 30)}…`,
    createdBy: 'mock-ai',
    createdAt: new Date().toISOString(),
  };
  _edges.push(edge);
  return [{ ...edge }];
}
