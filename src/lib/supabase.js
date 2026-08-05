import { createClient } from '@supabase/supabase-js';

// Vercel ortam değişkeni inadını kırmak için linkleri doğrudan buraya yazıyoruz.
// Bu (Anon Key) tarayıcıda çalışmak üzere tasarlandığı için kodun içinde olması tamamen güvenlidir.
const supabaseUrl = 'https://spdnnyxdmvucnhxtwpfrn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwZG55eGRtdnVjbmh4dHdwZnJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NzExNjIsImV4cCI6MjEwMTQ0NzE2Mn0.86_EemHiNc4JoVT1wMJWST48SyTKgcpqjFnJXWA6LiE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);