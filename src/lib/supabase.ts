import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wepnjmoaswfkhxdvpnep.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlcG5qbW9hc3dma2h4ZHZwbmVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MDgyODMsImV4cCI6MjA5MDk4NDI4M30.3Ozg5PTxPQDOokwKGSoVmO9I7zIHkf1n3d1DdGqn4jI';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.');
}

// Only create the client if we have the URL, otherwise export a dummy or handle it
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any; 

if (!supabase) {
  console.warn('Supabase client not initialized due to missing credentials.');
}
