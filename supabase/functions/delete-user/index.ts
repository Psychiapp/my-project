import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Check environment variables
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      serviceKeyPrefix: supabaseServiceKey?.substring(0, 20) + '...'
    });
    return new Response(
      JSON.stringify({ error: 'Server configuration error: missing environment variables' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get the authorization header to identify the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the JWT token from the Authorization header
    const token = authHeader.replace('Bearer ', '');

    // Create service role client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Step 1: Getting user from token...');

    // Get the calling user's info from the JWT token
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !callerUser) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Step 2: Verifying caller is admin...', { callerId: callerUser.id, callerEmail: callerUser.email });

    // Verify the caller is an admin
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', callerUser.id)
      .single();

    if (profileError || !callerProfile) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify caller profile', details: profileError?.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Step 3: Caller role is:', callerProfile.role);

    if (callerProfile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin role required', callerRole: callerProfile.role }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the user ID to delete from the request body
    const { userId } = await req.json();

    console.log('Step 4: Attempting to delete userId:', userId);

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent admin from deleting themselves
    if (userId === callerUser.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own admin account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the user's info before deletion for logging
    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name, role')
      .eq('id', userId)
      .single();

    if (targetError || !targetUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin ${callerUser.email} deleting user: ${targetUser.email} (${targetUser.full_name})`);

    // Delete the user from auth.users using admin API
    // This will cascade delete to profiles -> supporter_details -> etc.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Failed to delete user from auth:', deleteError);
      return new Response(
        JSON.stringify({
          error: 'Failed to delete user',
          details: deleteError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully deleted user ${userId} (${targetUser.email})`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `User ${targetUser.full_name} (${targetUser.email}) has been permanently deleted`,
        deletedUserId: userId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Delete user error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: errorMessage
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
