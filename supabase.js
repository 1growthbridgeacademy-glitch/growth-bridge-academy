const SUPABASE_URL = "https://ybahrdhjqqqadusnqbck.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_cAANCwmZAmQgUGdNIZN_6Q_CA9tBsqa";

if (
  window.supabase &&
  SUPABASE_URL !== "YOUR_SUPABASE_PROJECT_URL" &&
  SUPABASE_PUBLISHABLE_KEY !== "YOUR_SUPABASE_PUBLISHABLE_KEY"
) {
  window.db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
} else {
  window.db = null;
  console.warn("Add your Supabase URL and publishable key in supabase.js.");
}
