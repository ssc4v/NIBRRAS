import fs from 'fs';

let content = fs.readFileSync('artifacts/nibrras/src/services/learningService.ts', 'utf8');

const newFunctions = `
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
    id: \`gq-\${Date.now()}\`,
    sourceTitle: 'ملف تعليمي',
    topics: ['موضوع 1', 'موضوع 2'],
    questions: [
      { title: 'سؤال مستخرج من الملف', type: 'text', linkedNodeId: '', difficulty: 'medium', masteryImpact: 10, correctCount: 0, incorrectCount: 0 }
    ]
  };
};
`;

content += newFunctions;

fs.writeFileSync('artifacts/nibrras/src/services/learningService.ts', content);
