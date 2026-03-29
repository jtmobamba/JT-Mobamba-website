// Supabase Configuration
// Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'https://mptkcxfklhbqksuxkubj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wdGtjeGZrbGhicWtzdXhrdWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTQxNzgsImV4cCI6MjA4OTMzMDE3OH0.ninFXHyJHdObPJKLr0_2VdyKbGs7HAfZawuD9D9Jbg4';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Storage configuration
const STORAGE_BUCKET = 'files';
const MAX_STORAGE_BYTES = 8589934592; // 8GB per workspace

// Export for use in other modules
window.supabaseClient = supabase;
window.STORAGE_BUCKET = STORAGE_BUCKET;
window.MAX_STORAGE_BYTES = MAX_STORAGE_BYTES;
