import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env
  .VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!SUPABASE_URL?.length || !SUPABASE_PUBLISHABLE_KEY?.length) {
  throw new Error(
    "Supabase : définissez VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY dans .env (voir .env.example). Clé anon : paramètres du projet sur supabase.com.",
  );
}

/** Client partagé — `import { supabase } from "@/integrations/supabase/client"` */
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});