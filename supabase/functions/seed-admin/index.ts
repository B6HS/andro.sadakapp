import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const admins = [
    { email: "rs4b69@gmail.com", password: "1234567@", name: "Admin Sadaqa", role: "admin" },
    { email: "paoprod69@gmail.com", password: "SuperAdmin69!", name: "Super Admin", role: "super_admin" },
  ];

  const results = [];

  for (const admin of admins) {
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const existing = users?.find((u: any) => u.email === admin.email);

    let userId: string;

    if (existing) {
      userId = existing.id;
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: admin.email,
        password: admin.password,
        email_confirm: true,
        user_metadata: { display_name: admin.name },
      });
      if (error) {
        results.push({ email: admin.email, error: error.message });
        continue;
      }
      userId = data.user.id;
    }

    // Ensure role
    const { data: roleExists } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", admin.role)
      .maybeSingle();

    if (!roleExists) {
      await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: admin.role });
    }

    results.push({ email: admin.email, role: admin.role, user_id: userId, ok: true });
  }

  return new Response(
    JSON.stringify({ ok: true, results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
