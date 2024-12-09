import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 添加一个测试连接的函数
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

export type DreamJournal = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  dream_date: string;
  generated_image_b64?: string;
  created_at: string;
  updated_at: string;
};
