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

// 获取所有日记日期
export async function fetchJournalDates() {
  try {
    const { data, error } = await supabase
      .from('dream_journals')
      .select('dream_date');
    
    if (error) {
      console.error('Error fetching journal dates:', error);
      return [];
    }
    
    // 转换日期格式并去重
    const dates = data.map(journal => {
      const date = new Date(journal.dream_date);
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
    });

    // 使用 Set 去重并返回 Date 数组
    return Array.from(new Set(dates.map(date => date.toISOString())))
      .map(dateStr => new Date(dateStr));
    
  } catch (error) {
    console.error('Error in fetchJournalDates:', error);
    return [];
  }
}
