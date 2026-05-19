import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, error, state } = req.query;
  const appUrl = process.env.VITE_APP_URL!;

  if (error || !code) {
    const errorHtml = `<!DOCTYPE html><html><body><script>
      if (window.opener) {
        window.opener.postMessage({ type: 'META_AUTH_ERROR', error: 'access_denied' }, window.location.origin);
      }
      window.close();
    </script></body></html>`;
    return res.status(200).setHeader('Content-Type', 'text/html').send(errorHtml);
  }

  try {
    // Detectar se é fluxo de ads (app System) ou login (app Login)
    const isAds = String(state || '').includes('ads');
    
    const appId = isAds 
      ? process.env.VITE_META_SYSTEM_APP_ID!
      : process.env.VITE_META_LOGIN_APP_ID!;
    const appSecret = isAds
      ? process.env.META_SYSTEM_APP_SECRET!
      : process.env.META_LOGIN_APP_SECRET!;

    const redirectUri = `${appUrl}/api/auth-meta-callback`;

    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `client_id=${appId}&` +
      `client_secret=${appSecret}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `code=${code}`
    );
    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error.message);
    const shortToken = tokenData.access_token;

    const longRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${appId}&` +
      `client_secret=${appSecret}&` +
      `fb_exchange_token=${shortToken}`
    );
    const longData = await longRes.json();
    if (longData.error) throw new Error(longData.error.message);
    const longToken = longData.access_token;
    const expiresIn = longData.expires_in;

    const userRes = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name,email&access_token=${longToken}`
    );
    const userData = await userRes.json();

    const html = `<!DOCTYPE html>
<html>
<head><title>Autenticando...</title></head>
<body>
<script>
  if (window.opener) {
    window.opener.postMessage({
      type: 'META_AUTH_SUCCESS',
      token: ${JSON.stringify(longToken)},
      expires_in: ${JSON.stringify(String(expiresIn))},
      user_id: ${JSON.stringify(userData.id)},
      user_name: ${JSON.stringify(userData.name || '')},
      user_email: ${JSON.stringify(userData.email || '')},
    }, window.location.origin);
  }
  window.close();
</script>
<p>Autenticação concluída. Fechando...</p>
</body>
</html>`;

    return res.status(200).setHeader('Content-Type', 'text/html').send(html);

  } catch (err: any) {
    console.error('OAuth Meta erro:', err);
    const errorHtml = `<!DOCTYPE html><html><body><script>
      if (window.opener) {
        window.opener.postMessage({ 
          type: 'META_AUTH_ERROR', 
          error: ${JSON.stringify(err.message)} 
        }, window.location.origin);
      }
      window.close();
    </script></body></html>`;
    return res.status(200).setHeader('Content-Type', 'text/html').send(errorHtml);
  }
}
