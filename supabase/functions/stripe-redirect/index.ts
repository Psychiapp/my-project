import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

/**
 * Simple redirect handler for Stripe Connect onboarding callbacks.
 * Stripe requires HTTPS URLs, so this function receives the callback
 * and redirects to the app using a deep link.
 */
serve(async (req) => {
  const url = new URL(req.url);
  const type = url.searchParams.get('type'); // 'success' or 'refresh'

  // Build the deep link URL
  const deepLink = type === 'success'
    ? 'psychi://payout-settings?success=true'
    : 'psychi://payout-settings?refresh=true';

  // Return an HTML page that redirects to the app
  // Using meta refresh as primary method, with JavaScript as backup
  const title = type === 'success' ? 'Setup Complete!' : 'Returning to Psychi';
  const message = type === 'success' ? 'Your payout account has been set up.' : 'Click below to return to the app.';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0;url=${deepLink}">
<title>${title}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#FDF8F4;color:#2A2A2A;text-align:center;padding:20px}
h1{font-size:24px;margin-bottom:16px}
p{color:#666;margin-bottom:24px}
.button{display:inline-block;background:#4A90E2;color:white;padding:14px 28px;border-radius:30px;text-decoration:none;font-weight:600}
</style>
</head>
<body>
<h1>${title}</h1>
<p>${message}</p>
<a href="${deepLink}" class="button">Open Psychi</a>
<script>window.location.href="${deepLink}";</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
});
