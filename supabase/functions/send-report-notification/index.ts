import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const ADMIN_EMAIL = 'psychiapp@outlook.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportNotificationRequest {
  reportId: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  description: string;
  sessionId?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') as string,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    );

    const {
      reportId,
      reporterId,
      reportedUserId,
      reason,
      description,
      sessionId
    }: ReportNotificationRequest = await req.json();

    // Get reporter and reported user info
    const { data: reporter } = await supabase
      .from('profiles')
      .select('full_name, email, role')
      .eq('id', reporterId)
      .single();

    const { data: reportedUser } = await supabase
      .from('profiles')
      .select('full_name, email, role')
      .eq('id', reportedUserId)
      .single();

    const reporterName = reporter?.full_name || 'Unknown';
    const reportedName = reportedUser?.full_name || 'Unknown';
    const reporterRole = reporter?.role || 'unknown';
    const reportedRole = reportedUser?.role || 'unknown';

    // Format reason for display
    const reasonDisplay = reason
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l: string) => l.toUpperCase());

    // 1. Send push notification to all admins
    const { data: admins } = await supabase
      .from('profiles')
      .select('id, expo_push_token, full_name')
      .eq('role', 'admin');

    const pushResults: any[] = [];

    for (const admin of admins || []) {
      if (admin.expo_push_token) {
        const pushMessage = {
          to: admin.expo_push_token,
          title: '🚨 New User Report',
          body: `${reporterName} (${reporterRole}) reported ${reportedName} (${reportedRole}) for ${reasonDisplay}`,
          data: {
            type: 'user_report',
            reportId,
            reporterId,
            reportedUserId,
          },
          sound: 'default',
          priority: 'high',
          channelId: 'admin_alerts',
        };

        try {
          const pushResponse = await fetch(EXPO_PUSH_URL, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(pushMessage),
          });

          const pushResult = await pushResponse.json();
          pushResults.push({ adminId: admin.id, result: pushResult });
        } catch (pushError) {
          console.error('Push error for admin:', admin.id, pushError);
        }
      }
    }

    // 2. Send email notification to admin
    // Using Resend API (if configured) or fallback logging
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    let emailSent = false;

    if (resendApiKey) {
      try {
        const emailBody = `
          <h2>New User Report Submitted</h2>
          <p><strong>Report ID:</strong> ${reportId}</p>
          <hr>
          <h3>Reporter</h3>
          <p><strong>Name:</strong> ${reporterName}</p>
          <p><strong>Role:</strong> ${reporterRole}</p>
          <p><strong>Email:</strong> ${reporter?.email || 'N/A'}</p>
          <hr>
          <h3>Reported User</h3>
          <p><strong>Name:</strong> ${reportedName}</p>
          <p><strong>Role:</strong> ${reportedRole}</p>
          <p><strong>Email:</strong> ${reportedUser?.email || 'N/A'}</p>
          <hr>
          <h3>Report Details</h3>
          <p><strong>Reason:</strong> ${reasonDisplay}</p>
          <p><strong>Description:</strong></p>
          <blockquote>${description}</blockquote>
          ${sessionId ? `<p><strong>Session ID:</strong> ${sessionId}</p>` : ''}
          <hr>
          <p>Please review this report in the admin dashboard.</p>
        `;

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Psychi App <alerts@psychiapp.com>',
            to: [ADMIN_EMAIL],
            subject: `🚨 User Report: ${reporterName} reported ${reportedName} for ${reasonDisplay}`,
            html: emailBody,
          }),
        });

        if (emailResponse.ok) {
          emailSent = true;
          console.log('Email sent successfully to', ADMIN_EMAIL);
        } else {
          const emailError = await emailResponse.text();
          console.error('Email send failed:', emailError);
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
      }
    } else {
      // Log for manual follow-up if no email service configured
      console.log('=== ADMIN EMAIL NOTIFICATION (No Resend API key) ===');
      console.log('To:', ADMIN_EMAIL);
      console.log('Subject: User Report -', reporterName, 'reported', reportedName);
      console.log('Reason:', reasonDisplay);
      console.log('Description:', description);
    }

    return new Response(
      JSON.stringify({
        success: true,
        pushNotificationsSent: pushResults.length,
        emailSent,
        adminEmail: ADMIN_EMAIL,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Report notification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
