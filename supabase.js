// ==========================================
// GROWTH BRIDGE RPG ACADEMY
// SUPABASE CONNECTION
// ==========================================

// 1. Paste your Supabase Project URL here.
const SUPABASE_URL = "https://giomhrelsspflvjoqmvp.supabase.co";

// 2. Paste your Supabase Publishable key here.
const SUPABASE_ANON_KEY = "sb_publishable_arF6ZUeuebSiYXlu0pSNKA_VNRi5_h7";

// Check whether the Supabase library has loaded.
if (!window.supabase) {
  console.error("Supabase library did not load. Check your internet connection.");
  window.gbSupabaseReady = false;
} else if (
  SUPABASE_URL.includes("PASTE_") ||
  SUPABASE_ANON_KEY.includes("PASTE_")
) {
  console.warn("Add your Supabase Project URL and Publishable key.");
  window.gbSupabaseReady = false;
} else {
  // Create the Supabase connection.
  const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  // Make the connection available to the website JavaScript.
  window.gbSupabase = supabaseClient;
  window.gbSupabaseReady = true;

  console.log("Growth Bridge Supabase connection is ready.");
}
