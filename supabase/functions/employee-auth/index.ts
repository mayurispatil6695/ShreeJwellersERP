import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Generate a secure session token
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const url = new URL(req.url);
    const body = await req.json();
    
    // Determine action from query param OR body
    const action = url.searchParams.get("action") || body.action || 
      (body.employee_id && body.password ? "login" : 
       body.session_token ? "validate" : null);

    // Login action
    if (req.method === "POST" && action === "login") {
      const { employee_id, password } = body;

      if (!employee_id || !password) {
        return new Response(
          JSON.stringify({ error: "Employee ID and password are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find the employee
      const { data: employee, error: findError } = await supabaseAdmin
        .from("employees")
        .select("*")
        .eq("employee_id", employee_id)
        .eq("is_active", true)
        .maybeSingle();

      if (findError) {
        console.error("Error finding employee:", findError);
        return new Response(
          JSON.stringify({ error: "An error occurred" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!employee) {
        return new Response(
          JSON.stringify({ error: "Invalid credentials" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify password - hash incoming password and compare with stored hash
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      if (employee.password_hash !== hashedPassword && employee.password_hash !== password) {
        return new Response(
          JSON.stringify({ error: "Invalid credentials" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create session token
      const sessionToken = generateSessionToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Delete existing sessions for this employee
      await supabaseAdmin
        .from("employee_sessions")
        .delete()
        .eq("employee_id", employee.id);

      // Create new session
      const { error: sessionError } = await supabaseAdmin
        .from("employee_sessions")
        .insert({
          employee_id: employee.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
        });

      if (sessionError) {
        console.error("Error creating session:", sessionError);
        return new Response(
          JSON.stringify({ error: "Failed to create session" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          employee: {
            id: employee.id,
            employee_id: employee.employee_id,
            name: employee.name,
            email: employee.email,
            department: employee.department,
          },
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate session action
    if (req.method === "POST" && action === "validate") {
      const { session_token } = body;

      if (!session_token) {
        return new Response(
          JSON.stringify({ valid: false, error: "No session token provided" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find session and join with employee
      const { data: session, error: sessionError } = await supabaseAdmin
        .from("employee_sessions")
        .select(`
          *,
          employees (
            id,
            employee_id,
            name,
            email,
            department,
            is_active
          )
        `)
        .eq("session_token", session_token)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (sessionError || !session || !session.employees?.is_active) {
        return new Response(
          JSON.stringify({ valid: false, error: "Invalid or expired session" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          valid: true,
          employee: {
            id: session.employees.id,
            employee_id: session.employees.employee_id,
            name: session.employees.name,
            email: session.employees.email,
            department: session.employees.department,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Logout action
    if (req.method === "POST" && action === "logout") {
      const { session_token } = body;

      if (session_token) {
        await supabaseAdmin
          .from("employee_sessions")
          .delete()
          .eq("session_token", session_token);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Employee auth error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
