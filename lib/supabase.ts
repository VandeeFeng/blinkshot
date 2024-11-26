import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export type DreamJournal = {
  id: number;
  user_id: string;
  title: string;
  content: string;
  dream_date: string;
  generated_image_b64?: string;
  created_at: string;
  updated_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const createSupabaseClient = () => {
  return createClientComponentClient();
};

export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('dream_journals')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    
    console.log('Supabase connection test succeeded:', data);
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return false;
  }
}
