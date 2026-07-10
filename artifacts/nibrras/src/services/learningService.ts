import { mockKnowledgeNodes, mockQuestions, mockLearningFiles, mockLearningProfile } from '../data/mockData';
import { KnowledgeNode, Question, LearningFile, GeneratedQuestionSet, LearningProfile } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let knowledgeNodes = [...mockKnowledgeNodes];
let questions = [...mockQuestions];
let learningFiles = [...mockLearningFiles];

export const getLearningGraph = async (): Promise<LearningProfile> => {
  await delay(600);
  return { ...mockLearningProfile };
};

export const getTodayLesson = async () => {
  await delay(300);
  return mockLearningProfile.todayLesson;
};

export const getReviewQueue = async () => {
  await delay(300);
  return mockLearningProfile.reviewQueue;
};

export const updateLearningProfileMock = async (event: any): Promise<void> => {
  await delay(500);
  console.log('Mock: Learning profile updated with event:', event);
};

export const getKnowledgeTree = async (): Promise<KnowledgeNode[]> => {
  await delay(400);
  return [...knowledgeNodes];
};

export const createKnowledgeNode = async (parentId: string | null, nodeData: Partial<KnowledgeNode>): Promise<KnowledgeNode> => {
  await delay(500);
  const newNode: KnowledgeNode = {
    id: `node-\${Date.now()}`,
    parentId,
    label: nodeData.label || 'عقدة جديدة',
    type: nodeData.type || 'lesson',
    mastery: 0,
    status: 'new',
    childCount: 0,
    questionCount: 0,
    dependencies: [],
    ...nodeData,
  } as KnowledgeNode;
  knowledgeNodes.push(newNode);
  if (parentId) {
    const parent = knowledgeNodes.find(n => n.id === parentId);
    if (parent) parent.childCount++;
  }
  return newNode;
};

export const updateKnowledgeNode = async (nodeId: string, updates: Partial<KnowledgeNode>): Promise<void> => {
  await delay(300);
  const idx = knowledgeNodes.findIndex(n => n.id === nodeId);
  if (idx > -1) {
    knowledgeNodes[idx] = { ...knowledgeNodes[idx], ...updates };
  }
};

export const moveKnowledgeNode = async (nodeId: string, newParentId: string | null): Promise<void> => {
  await delay(400);
  const node = knowledgeNodes.find(n => n.id === nodeId);
  if (node) {
    if (node.parentId) {
      const oldParent = knowledgeNodes.find(n => n.id === node.parentId);
      if (oldParent) oldParent.childCount--;
    }
    node.parentId = newParentId;
    if (newParentId) {
      const newParent = knowledgeNodes.find(n => n.id === newParentId);
      if (newParent) newParent.childCount++;
    }
  }
};

export const archiveKnowledgeNode = async (nodeId: string): Promise<void> => {
  await delay(300);
  // Just filter it out for mock purposes
  knowledgeNodes = knowledgeNodes.filter(n => n.id !== nodeId);
};

export const getQuestionsByKnowledgeNode = async (nodeId?: string): Promise<Question[]> => {
  await delay(400);
  if (!nodeId) return [...questions];
  return questions.filter(q => q.linkedNodeId === nodeId);
};

export const createQuestion = async (questionData: Partial<Question>): Promise<Question> => {
  await delay(500);
  const newQ: Question = {
    id: `q-\${Date.now()}`,
    title: questionData.title || 'سؤال جديد',
    type: questionData.type || 'text',
    linkedNodeId: questionData.linkedNodeId || '',
    difficulty: questionData.difficulty || 'medium',
    masteryImpact: questionData.masteryImpact || 5,
    correctCount: 0,
    incorrectCount: 0,
    ...questionData,
  } as Question;
  questions.push(newQ);
  return newQ;
};

export const updateQuestion = async (questionId: string, updates: Partial<Question>): Promise<void> => {
  await delay(300);
  const idx = questions.findIndex(q => q.id === questionId);
  if (idx > -1) {
    questions[idx] = { ...questions[idx], ...updates };
  }
};

export const moveQuestion = async (questionId: string, targetKnowledgeNodeId: string): Promise<void> => {
  await delay(400);
  const q = questions.find(q => q.id === questionId);
  if (q) {
    q.linkedNodeId = targetKnowledgeNodeId;
  }
};

export const generateQuestionsFromTextMock = async (text: string): Promise<GeneratedQuestionSet> => {
  await delay(1500);
  return {
    id: `gq-\${Date.now()}`,
    sourceTitle: 'نص ملصق',
    topics: ['مفهوم 1', 'مفهوم 2'],
    questions: [
      { title: 'سؤال نصي تم توليده؟', type: 'text', linkedNodeId: '', difficulty: 'medium', masteryImpact: 10, correctCount: 0, incorrectCount: 0 }
    ]
  };
};

export const generateQuestionsFromYouTubeMock = async (url: string): Promise<GeneratedQuestionSet> => {
  // Front-end -> learningService -> n8n webhook -> YouTube transcript/extraction workflow -> AI question generator -> returns structured questions -> NIBRRAS stores them.
  await delay(2000);
  return {
    id: `gq-\${Date.now()}`,
    sourceTitle: 'مقطع يوتيوب: فهم الأساسيات',
    sourceUrl: url,
    topics: ['مقدمة', 'نظريات', 'أمثلة عملية'],
    suggestedBranchId: 'ai-1-1-1',
    questions: [
      { title: 'ما هو المفهوم الأساسي المشروح في المقطع؟', type: 'multiple-choice', linkedNodeId: '', difficulty: 'easy', masteryImpact: 5, correctCount: 0, incorrectCount: 0 },
      { title: 'اشرح بأسلوبك النظرية الثانية المذكورة.', type: 'explain', linkedNodeId: '', difficulty: 'hard', masteryImpact: 15, correctCount: 0, incorrectCount: 0 },
      { title: 'هل التطبيق العملي المذكور صحيح أم خاطئ؟', type: 'true-false', linkedNodeId: '', difficulty: 'medium', masteryImpact: 10, correctCount: 0, incorrectCount: 0 },
      { title: 'حدد العنصر الخاطئ في المشهد من الفيديو', type: 'video', mediaUrl: 'https://placeholder.com/gen-video.mp4', linkedNodeId: '', difficulty: 'hard', masteryImpact: 15, correctCount: 0, incorrectCount: 0 }
    ]
  };
};

export const generateQuestionsFromImageMock = async (file: any): Promise<GeneratedQuestionSet> => {
  await delay(1500);
  return {
    id: `gq-\${Date.now()}`,
    sourceTitle: 'صورة مرفوعة',
    topics: ['تحليل صورة'],
    questions: [
      { title: 'ماذا تستنتج من المخطط في الصورة؟', type: 'explain', linkedNodeId: '', difficulty: 'medium', masteryImpact: 10, correctCount: 0, incorrectCount: 0 }
    ]
  };
};

export const generateQuestionsFromVideoMock = async (file: any): Promise<GeneratedQuestionSet> => {
  await delay(1500);
  return {
    id: `gq-\${Date.now()}`,
    sourceTitle: 'فيديو مرفوع',
    topics: ['تحليل فيديو'],
    questions: [
      { title: 'لخص الخطوات في الفيديو', type: 'order', linkedNodeId: '', difficulty: 'medium', masteryImpact: 10, correctCount: 0, incorrectCount: 0 }
    ]
  };
};

export const addGeneratedQuestionsToBank = async (questionsToAdd: Omit<Question, 'id'>[]): Promise<void> => {
  await delay(500);
  questionsToAdd.forEach(q => {
    questions.push({ ...q, id: `q-\${Date.now()}-\${Math.random()}` } as Question);
  });
};

export const linkFileToKnowledgeNode = async (fileId: string, nodeId: string): Promise<void> => {
  await delay(300);
  const f = learningFiles.find(f => f.id === fileId);
  if (f) f.linkedNodeId = nodeId;
};

export const getLearningFiles = async (): Promise<LearningFile[]> => {
  await delay(400);
  return [...learningFiles];
};

export const createLearningFile = async (fileData: Partial<LearningFile>): Promise<LearningFile> => {
  await delay(500);
  const newF: LearningFile = {
    id: `f-\${Date.now()}`,
    title: fileData.title || 'ملف جديد',
    type: fileData.type || 'notes',
    linkedNodeId: fileData.linkedNodeId,
    linkedQuestionsCount: 0,
    inReviewQueue: false,
    ...fileData,
  } as LearningFile;
  learningFiles.push(newF);
  return newF;
};

export const updateReviewSchedule = async (questionId: string, result: 'correct' | 'incorrect'): Promise<void> => {
  await delay(300);
  const q = questions.find(q => q.id === questionId);
  if (q) {
    if (result === 'correct') q.correctCount++;
    else q.incorrectCount++;
    q.lastAnswered = new Date().toISOString();
  }
};

export const updateLearningFile = async (fileId: string, updates: Partial<LearningFile>): Promise<void> => {
  await delay(300);
  const idx = learningFiles.findIndex(f => f.id === fileId);
  if (idx > -1) {
    learningFiles[idx] = { ...learningFiles[idx], ...updates };
  }
};

export const moveLearningFile = async (fileId: string, targetNodeId: string): Promise<void> => {
  await delay(400);
  const f = learningFiles.find(f => f.id === fileId);
  if (f) f.linkedNodeId = targetNodeId;
};

export const archiveLearningFile = async (fileId: string): Promise<void> => {
  await delay(300);
  learningFiles = learningFiles.filter(f => f.id !== fileId);
};

export const generateQuestionsFromFileMock = async (fileId: string): Promise<GeneratedQuestionSet> => {
  await delay(1500);
  return {
    id: `gq-${Date.now()}`,
    sourceTitle: 'ملف تعليمي',
    topics: ['موضوع 1', 'موضوع 2'],
    questions: [
      { title: 'سؤال مستخرج من الملف', type: 'text', linkedNodeId: '', difficulty: 'medium', masteryImpact: 10, correctCount: 0, incorrectCount: 0 }
    ]
  };
};

export const addGeneratedQuestionsToMap = async (questions: Omit<Question, 'id'>[]): Promise<void> => {
  await delay(500);
  // Mock adding questions to the map
};
