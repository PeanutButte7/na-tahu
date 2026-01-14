import { allPacks } from '../assets/data/packs';
import { LegacyPack, LegacyQuestion, Pack, Question } from '../types';

function isLegacyQuestion(question: Question | LegacyQuestion): question is LegacyQuestion {
  return 'options' in question && 'correctIndices' in question;
}

function normalizeQuestion(question: Question | LegacyQuestion): Question {
  if (!isLegacyQuestion(question)) {
    return question;
  }

  const correctSet = new Set(question.correctIndices);
  const correctAnswers = question.options.filter((_, index) => correctSet.has(index));
  const wrongAnswers = question.options.filter((_, index) => !correctSet.has(index));

  return {
    id: question.id,
    text: question.text,
    correctAnswers,
    wrongAnswers,
  };
}

function normalizePack(pack: Pack | LegacyPack): Pack {
  return {
    id: pack.id,
    name: pack.name,
    description: pack.description,
    priceDisplay: pack.priceDisplay,
    questions: pack.questions.map((question) =>
      normalizeQuestion(question as Question | LegacyQuestion)
    ),
  };
}

export function getAllPacks(): Pack[] {
  return (allPacks as LegacyPack[]).map((pack) => normalizePack(pack));
}

export function getQuestionsForPacks(packIds: string[], packs: Pack[] = getAllPacks()): Question[] {
  return packs
    .filter((p) => packIds.includes(p.id))
    .flatMap((p) => p.questions.map((question) => normalizeQuestion(question)));
}

export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function buildRoundOptions(
  question: Question,
  minCorrect = 5,
  minWrong = 5
): { options: string[]; correctIndices: number[] } | null {
  const uniqueCorrect = Array.from(new Set(question.correctAnswers));
  const uniqueWrong = Array.from(
    new Set(question.wrongAnswers.filter((answer) => !uniqueCorrect.includes(answer)))
  );

  if (uniqueCorrect.length < minCorrect || uniqueWrong.length < minWrong) {
    return null;
  }

  const correctSample = shuffleArray(uniqueCorrect).slice(0, minCorrect);
  const wrongSample = shuffleArray(uniqueWrong).slice(0, minWrong);
  const combined = shuffleArray([...correctSample, ...wrongSample]);
  const correctSet = new Set(correctSample);
  const correctIndices = combined
    .map((option, index) => (correctSet.has(option) ? index : -1))
    .filter((index) => index >= 0);

  return { options: combined, correctIndices };
}
