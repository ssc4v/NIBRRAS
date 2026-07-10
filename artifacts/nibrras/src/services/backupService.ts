import { mockBackups } from '../data/mockData';
import { Backup } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const listBackupsMock = async (): Promise<Backup[]> => {
  await delay(400);
  return [...mockBackups];
};

export const createBackupMock = async (target: string): Promise<void> => {
  await delay(800);
  console.log(`Mock: Backup created for ${target}`);
};

export const restoreBackupMock = async (versionId: string): Promise<void> => {
  await delay(1000);
  console.log(`Mock: Backup ${versionId} restored`);
};
