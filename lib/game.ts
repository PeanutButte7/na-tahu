import { allPacks } from '../assets/data/packs';
import { Pack, Question } from '../types';

export function getAllPacks(): Pack[] {
  return allPacks;
}

export function getQuestionsForPacks(packIds: string[]): Question[] {
  return allPacks
    .filter((p) => packIds.includes(p.id))
    .flatMap((p) => p.questions);
}

export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}
