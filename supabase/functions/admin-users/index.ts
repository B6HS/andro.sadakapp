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

  // Verify caller is admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: corsHeaders });
  }

  const { data: { user: caller } } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
  if (!caller) {
    return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });
  }

  const { data: roleData } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", caller.id)
    .in("role", ["admin", "super_admin"]);

  if (!roleData || roleData.length === 0) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
  }

  const { action, ...body } = await req.json();

  // LIST users
  if (action === "list") {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }

    // Get all roles
    const { data: roles } = await supabaseAdmin.from("user_roles").select("*");
    const rolesMap: Record<string, string> = {};
    (roles || []).forEach((r: any) => { rolesMap[r.user_id] = r.role; });

    const result = users.map((u: any) => ({
      id: u.id,
      email: u.email,
      display_name: u.user_metadata?.display_name || u.email?.split("@")[0] || "",
      role: rolesMap[u.id] || "user",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      banned: u.banned_until ? true : false,
      banned_until: u.banned_until,
    }));

    return new Response(JSON.stringify({ users: result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // CREATE user
  if (action === "create") {
    const { email, password, display_name, role } = body;
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name },
    });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
    }

    if (role && role !== "user") {
      await supabaseAdmin.from("user_roles").insert({ user_id: data.user.id, role });
    }

    return new Response(JSON.stringify({ user: data.user }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // UPDATE role
  if (action === "update_role") {
    const { user_id, role } = body;
    await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
    if (role && role !== "user") {
      await supabaseAdmin.from("user_roles").insert({ user_id, role });
    }
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // BAN / UNBAN user
  if (action === "ban") {
    const { user_id, ban } = body;
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
      ban_duration: ban ? "876600h" : "none",
    });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // DELETE user
  if (action === "delete") {
    const { user_id } = body;
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
});
