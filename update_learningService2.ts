import fs from 'fs';

let content = fs.readFileSync('artifacts/nibrras/src/services/learningService.ts', 'utf8');

const newFunctions = `
export const addGeneratedQuestionsToMap = async (questions: Omit<Question, 'id'>[]): Promise<void> => {
  await delay(500);
  // Mock adding questions to the map
};
`;

content += newFunctions;

fs.writeFileSync('artifacts/nibrras/src/services/learningService.ts', content);
