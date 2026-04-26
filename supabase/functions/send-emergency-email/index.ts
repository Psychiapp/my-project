import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_EMAIL = 'psychiapp@outlook.com';
const RESEND_API_URL = 'https://api.resend.com/emails';

interface EmergencyReport {
  id: string;
  sessionId: string;
  sessionType: 'chat' | 'phone' | 'video';
  participantName: string;
  reporterName: string;
  emergencyType: '911' | '988';
  timestamp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { to, subject, report }: { to: string; subject: string; report: EmergencyReport } = await req.json();

    if (!report || !report.sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: report, report.sessionId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emergencyLabel = report.emergencyType === '911'
      ? 'Emergency Services (911)'
      : 'Suicide & Crisis Lifeline (988)';

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">URGENT: Emergency Report</h1>
        </div>
        <div style="background: #fff1f1; border: 1px solid #dc2626; padding: 24px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin-top: 0;">
            A user has initiated an emergency call during a Psychi support session.
          </p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; font-weight: bold; width: 40%;">Emergency Type:</td>
                <td style="padding: 8px; color: #dc2626; font-weight: bold;">${emergencyLabel}</td></tr>
            <tr style="background: #fff;"><td style="padding: 8px; font-weight: bold;">Session ID:</td>
                <td style="padding: 8px; font-family: monospace;">${report.sessionId}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Session Type:</td>
                <td style="padding: 8px; text-transform: capitalize;">${report.sessionType}</td></tr>
            <tr style="background: #fff;"><td style="padding: 8px; font-weight: bold;">Participant:</td>
                <td style="padding: 8px;">${report.participantName}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Reported By:</td>
                <td style="padding: 8px;">${report.reporterName}</td></tr>
            <tr style="background: #fff;"><td style="padding: 8px; font-weight: bold;">Timestamp:</td>
                <td style="padding: 8px;">${new Date(report.timestamp).toLocaleString('en-US', { timeZone: 'America/New_York' })} ET</td></tr>
          </table>
          <div style="margin-top: 20px; padding: 16px; background: #fee2e2; border-radius: 6px; border-left: 4px solid #dc2626;">
            <strong>IMMEDIATE ACTION REQUIRED</strong><br>
            Please review this session and follow up according to the Psychi Safety Protocol.
          </div>
          <p style="margin-top: 16px; color: #666; font-size: 13px;">
            Report ID: ${report.id || 'N/A'} &mdash; This is an automated emergency notification from the Psychi mobile app.
          </p>
        </div>
      </div>
    `;

    const emailText = `
URGENT: Emergency Report

A user has initiated an emergency call during a Psychi support session.

Emergency Type: ${emergencyLabel}
Session ID: ${report.sessionId}
Session Type: ${report.sessionType}
Participant: ${report.participantName}
Reported By: ${report.reporterName}
Timestamp: ${new Date(report.timestamp).toLocaleString()}

IMMEDIATE ACTION REQUIRED: Please review this session and follow up according to the Psychi Safety Protocol.

Report ID: ${report.id || 'N/A'}
    `.trim();

    let emailSent = false;
    let emailError = '';

    // Try Resend (preferred) if API key is configured
    if (resendApiKey) {
      const emailResponse = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'Psychi Safety <alerts@psychi.app>',
          to: [ADMIN_EMAIL],
          subject: subject || `URGENT: Emergency Report - ${emergencyLabel}`,
          html: emailHtml,
          text: emailText,
        }),
      });

      if (emailResponse.ok) {
        emailSent = true;
      } else {
        const err = await emailResponse.text();
        emailError = `Resend error: ${err}`;
        console.error('Resend API error:', err);
      }
    } else {
      emailError = 'RESEND_API_KEY not configured';
      console.warn('RESEND_API_KEY not set — email not sent. Report logged to DB only.');
    }

    // Always mark as email_sent in DB regardless of email outcome
    // (so admin can see it in the dashboard even if email failed)
    if (report.id) {
      await supabase
        .from('emergency_reports')
        .update({ email_sent: emailSent, email_error: emailSent ? null : emailError })
        .eq('id', report.id);
    }

    // Log to Supabase for audit trail
    console.log('Emergency report processed:', {
      reportId: report.id,
      sessionId: report.sessionId,
      emergencyType: report.emergencyType,
      emailSent,
      emailError: emailError || null,
    });

    return new Response(
      JSON.stringify({ success: true, emailSent, emailError: emailSent ? null : emailError }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('send-emergency-email error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
