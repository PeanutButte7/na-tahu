import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const packsDir = path.resolve('assets/data/packs');
const packFiles = fs
  .readdirSync(packsDir)
  .filter((file) => file.endsWith('.json'));

for (const file of packFiles) {
  const packPath = path.join(packsDir, file);
  const packData = JSON.parse(fs.readFileSync(packPath, 'utf-8'));

  const { error: packError } = await supabase.from('packs').upsert(
    {
      id: packData.id,
      name: packData.name,
      description: packData.description,
      price_display: packData.priceDisplay,
      is_active: true,
    },
    { onConflict: 'id' }
  );

  if (packError) {
    throw packError;
  }

  for (const question of packData.questions) {
    const { error: questionError } = await supabase.from('questions').upsert(
      {
        id: question.id,
        pack_id: packData.id,
        prompt: question.text,
      },
      { onConflict: 'id' }
    );

    if (questionError) {
      throw questionError;
    }

    const correctSet = new Set(question.correctIndices);
    const answers = question.options.map((answerText, index) => ({
      question_id: question.id,
      answer_text: answerText,
      is_correct: correctSet.has(index),
    }));

    const { error: answerError } = await supabase
      .from('question_answers')
      .upsert(answers, { onConflict: 'question_id,answer_text' });

    if (answerError) {
      throw answerError;
    }
  }
}

console.log('Supabase seed completed.');
