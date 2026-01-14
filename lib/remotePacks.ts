import { supabaseClient, supabaseConfig } from '@/lib/supabaseClient';
import { Pack } from '@/types';

interface SupabasePackRow {
  id: string;
  name: string;
  description: string;
  price_display: string | null;
  questions: Array<{
    id: string;
    prompt: string;
    question_answers: Array<{
      answer_text: string;
      is_correct: boolean;
    }>;
  }>;
}

export async function fetchRemotePacks(): Promise<Pack[]> {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    return [];
  }

  const { data, error } = await supabaseClient
    .from('packs')
    .select(
      `
        id,
        name,
        description,
        price_display,
        questions:questions(
          id,
          prompt,
          question_answers:question_answers(
            answer_text,
            is_correct
          )
        )
      `
    )
    .eq('is_active', true);

  if (error) {
    throw error;
  }

  return (data as SupabasePackRow[]).map((pack) => ({
    id: pack.id,
    name: pack.name,
    description: pack.description,
    priceDisplay: pack.price_display ?? 'Free',
    questions: pack.questions.map((question) => ({
      id: question.id,
      text: question.prompt,
      correctAnswers: question.question_answers
        .filter((answer) => answer.is_correct)
        .map((answer) => answer.answer_text),
      wrongAnswers: question.question_answers
        .filter((answer) => !answer.is_correct)
        .map((answer) => answer.answer_text),
    })),
  }));
}
