import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azsmdlkzlekubxsxzjvn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6c21kbGt6bGVrdWJ4c3h6anZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NTU0NzgsImV4cCI6MjEwNDUzMTQ3OH0.cBHuuwPC9z-UNbP33f3K4TJ9j2XZkjQDykiOFjbc0vs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
