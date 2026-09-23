const SUPABASE_URL = "https://fgzjumabssfgopqgdcyk.supabase.co/";

const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnemp1bWFic3NmZ29wcWdkY3lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNjkwMjUsImV4cCI6MjEwNTc0NTAyNX0.tq8wIsJl0mYxPN6R44S5py-_a2l_bv22Uok2jLFTXHs";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);