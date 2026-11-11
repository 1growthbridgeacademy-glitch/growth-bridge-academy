const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";

if (!window.supabase) {
  throw new Error("Supabase library did not load.");
}

if (
  SUPABASE_URL === "YOUR_SUPABASE_PROJECT_URL" ||
  SUPABASE_PUBLISHABLE_KEY === "YOUR_SUPABASE_PUBLISHABLE_KEY"
) {
  console.warn("Add your Supabase URL and Publishable Key in supabase.js.");
}

window.db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
