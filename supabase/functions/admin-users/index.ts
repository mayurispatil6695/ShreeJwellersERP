import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Get the authorization header to verify the requesting user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create a client with the user's token to verify their identity
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })

    // Get the current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Check if the requesting user is an admin using the database function
    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    })

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const method = req.method
    const url = new URL(req.url)

    if (method === 'GET') {
      // Fetch all users from auth.users
      const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (listError) {
        throw listError
      }

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabaseAdmin
        .from('user_roles')
        .select('*')
      
      if (rolesError) {
        throw rolesError
      }

      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*')
      
      if (profilesError) {
        throw profilesError
      }

      // Combine the data
      const users = authUsers.users.map(authUser => {
        const profile = profiles?.find(p => p.user_id === authUser.id)
        const roles = userRoles?.filter(r => r.user_id === authUser.id).map(r => r.role) || ['user']
        
        return {
          id: authUser.id,
          email: authUser.email,
          created_at: authUser.created_at,
          last_sign_in_at: authUser.last_sign_in_at,
          display_name: profile?.display_name || null,
          avatar_url: profile?.avatar_url || null,
          roles: roles.length > 0 ? roles : ['user']
        }
      })

      return new Response(
        JSON.stringify({ users }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'PATCH') {
      // Update user role
      const body = await req.json()
      const { userId, role, action } = body

      if (!userId || !role || !action) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: userId, role, action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Prevent self-demotion from admin
      if (userId === user.id && role === 'admin' && action === 'remove') {
        return new Response(
          JSON.stringify({ error: 'Cannot remove your own admin role' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (action === 'add') {
        const { error } = await supabaseAdmin
          .from('user_roles')
          .upsert({ user_id: userId, role }, { onConflict: 'user_id,role' })
        
        if (error) throw error
      } else if (action === 'remove') {
        const { error } = await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role)
        
        if (error) throw error
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'DELETE') {
      // Delete user
      const body = await req.json()
      const { userId } = body

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Missing required field: userId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Prevent self-deletion
      if (userId === user.id) {
        return new Response(
          JSON.stringify({ error: 'Cannot delete your own account' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Delete the user from auth.users (this will cascade to user_roles and profiles due to ON DELETE CASCADE)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      
      if (deleteError) {
        throw deleteError
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
