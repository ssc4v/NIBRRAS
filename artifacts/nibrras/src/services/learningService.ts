import { callNibrras, reportClientError } from './backendClient';

export interface LearningNode {
  id: string;
  parentId: string | null;
  label: string;
  type: string;
  mastery: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LearningFile {
  id: string;
  title: string;
  type: string;
  url: string | null;
  linkedNodeId: string | null;
  createdAt?: string;
}

export interface LearningProfile {
  mastery: number;
  streak: number;
  totalAnswered: number;
  correctAnswered: number;
  updatedAt?: string;
}

export interface LearningGraph {
  nodes: LearningNode[];
  files: LearningFile[];
  profile: LearningProfile;
}

export interface Question {
  id: string;
  title: string;
  type: string;
  options: string[];
  correctAnswer: unknown;
  explanation: string;
  difficulty: string;
  linkedNodeId: string | null;
  correctCount: number;
  incorrectCount: number;
}

async function learningCall<T>(payload: Record<string, unknown>): Promise<T> {
  try {
    const response = await callNibrras<T>('learning', payload);
    return response.data as T;
  } catch (error) {
    void reportClientError('learning-ui', error, payload);
    throw error;
  }
}

async function questionCall<T>(payload: Record<string, unknown>): Promise<T> {
  try {
    const response = await callNibrras<T>('questionBank', payload);
    return response.data as T;
  } catch (error) {
    void reportClientError('question-bank-ui', error, payload);
    throw error;
  }
}

export const getLearningGraph = () => learningCall<LearningGraph>({ action: 'getGraph' });
export const createKnowledgeNode = (label: string, parentId: string | null = null) =>
  learningCall<LearningNode>({ action: 'createNode', label, parentId, type: 'lesson' });
export const updateKnowledgeNode = (id: string, updates: Partial<LearningNode>) =>
  learningCall<LearningNode>({ action: 'updateNode', id, updates });
export const archiveKnowledgeNode = (id: string) =>
  learningCall<LearningNode>({ action: 'archiveNode', id });
export const createLearningFile = (title: string, url?: string, linkedNodeId?: string | null) =>
  learningCall<LearningFile>({ action: 'createFile', title, url: url || null, linkedNodeId: linkedNodeId || null });
export const updateLearningProfile = (updates: Partial<LearningProfile>) =>
  learningCall<LearningProfile>({ action: 'updateProfile', updates });

export const listQuestions = () => questionCall<Question[]>({ action: 'list' });
export const createQuestion = (question: Partial<Question> & { title: string }) =>
  questionCall<Question>({ action: 'create', ...question });
export const updateQuestion = (id: string, updates: Partial<Question>) =>
  questionCall<Question>({ action: 'update', id, updates });
export const deleteQuestion = (id: string) => questionCall<Question>({ action: 'delete', id });
export const answerQuestion = (id: string, answer: unknown) =>
  questionCall<{ correct: boolean; correctAnswer: unknown; explanation: string }>({ action: 'answer', id, answer });
