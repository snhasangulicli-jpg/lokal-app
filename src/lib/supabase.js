import { createClient } from '@supabase/supabase-js';

// BENİM BOZDUĞUM DEĞİL, SİZİN ORİJİNAL VE DOĞRU ADRESİNİZ (Tek 'n' ile)
const supabaseUrl = 'https://spdnyxdmvucnhxtwpfrn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwZG55eGRtdnVjbmh4dHdwZnJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NzExNjIsImV4cCI6MjEwMTQ0NzE2Mn0.86_EemHiNc4JoVT1wMJWST48SyTKgcpqjFnJXWA6LiE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);