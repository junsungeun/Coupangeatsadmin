import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ayflvlzqwnfrdqedisor.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5Zmx2bHpxd25mcmRxZWRpc29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNjE1NTEsImV4cCI6MjA4MDgzNzU1MX0.1tB_oZ9fSWQ-GDXkEi5pH2vJjAVVeCRF1hbTVS--olg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadFile(file, folder) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Upload error:', error);
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}
