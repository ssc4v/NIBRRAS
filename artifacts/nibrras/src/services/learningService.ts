import type { KnowledgeNode, Question, LearningFile, GeneratedQuestionSet, LearningProfile } from '../types';

const unavailable = (feature: string): never => {
  throw new Error(`${feature}: هذه الميزة غير متصلة بخدمة حقيقية بعد`);
};

export const getLearningGraph = async (): Promise<LearningProfile> => unavailable('ملف التعلم');
export const getTodayLesson = async () => unavailable('درس اليوم');
export const getReviewQueue = async () => unavailable('قائمة المراجعة');
export const updateLearningProfileMock = async (_event: unknown): Promise<void> => unavailable('تحديث ملف التعلم');

export const getKnowledgeTree = async (): Promise<KnowledgeNode[]> => [];
export const createKnowledgeNode = async (_parentId: string | null, _nodeData: Partial<KnowledgeNode>): Promise<KnowledgeNode> => unavailable('إضافة عقدة معرفة');
export const updateKnowledgeNode = async (_nodeId: string, _updates: Partial<KnowledgeNode>): Promise<void> => unavailable('تعديل عقدة معرفة');
export const moveKnowledgeNode = async (_nodeId: string, _newParentId: string | null): Promise<void> => unavailable('نقل عقدة معرفة');
export const archiveKnowledgeNode = async (_nodeId: string): Promise<void> => unavailable('أرشفة عقدة معرفة');

export const getQuestionsByKnowledgeNode = async (_nodeId?: string): Promise<Question[]> => [];
export const createQuestion = async (_questionData: Partial<Question>): Promise<Question> => unavailable('إضافة سؤال');
export const updateQuestion = async (_questionId: string, _updates: Partial<Question>): Promise<void> => unavailable('تعديل سؤال');
export const moveQuestion = async (_questionId: string, _targetKnowledgeNodeId: string): Promise<void> => unavailable('نقل سؤال');
export const updateReviewSchedule = async (_questionId: string, _result: 'correct' | 'incorrect'): Promise<void> => unavailable('تحديث نتيجة السؤال');

export const generateQuestionsFromTextMock = async (_text: string): Promise<GeneratedQuestionSet> => unavailable('توليد أسئلة من نص');
export const generateQuestionsFromYouTubeMock = async (_url: string): Promise<GeneratedQuestionSet> => unavailable('توليد أسئلة من يوتيوب');
export const generateQuestionsFromImageMock = async (_file: unknown): Promise<GeneratedQuestionSet> => unavailable('توليد أسئلة من صورة');
export const generateQuestionsFromVideoMock = async (_file: unknown): Promise<GeneratedQuestionSet> => unavailable('توليد أسئلة من فيديو');
export const generateQuestionsFromFileMock = async (_fileId: string): Promise<GeneratedQuestionSet> => unavailable('توليد أسئلة من ملف');
export const addGeneratedQuestionsToBank = async (_questions: Omit<Question, 'id'>[]): Promise<void> => unavailable('إضافة الأسئلة إلى البنك');
export const addGeneratedQuestionsToMap = async (_questions: Omit<Question, 'id'>[]): Promise<void> => unavailable('إضافة الأسئلة إلى الخريطة');

export const getLearningFiles = async (): Promise<LearningFile[]> => [];
export const createLearningFile = async (_fileData: Partial<LearningFile>): Promise<LearningFile> => unavailable('إضافة ملف تعلم');
export const updateLearningFile = async (_fileId: string, _updates: Partial<LearningFile>): Promise<void> => unavailable('تعديل ملف تعلم');
export const moveLearningFile = async (_fileId: string, _targetNodeId: string): Promise<void> => unavailable('نقل ملف تعلم');
export const archiveLearningFile = async (_fileId: string): Promise<void> => unavailable('أرشفة ملف تعلم');
export const linkFileToKnowledgeNode = async (_fileId: string, _nodeId: string): Promise<void> => unavailable('ربط ملف بخريطة المعرفة');
