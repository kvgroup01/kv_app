import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, error } = req.query;
  const appUrl = process.env.VITE_APP_URL!;

  if (error || !code) {
    return res.redirect(`${appUrl}/admin/meta-connect?error=access_denied`);
  }

  try {
    const appId = process.env.VITE_META_LOGIN_APP_ID!;
    const appSecret = process.env.META_LOGIN_APP_SECRET!;
    const redirectUri = `${appUrl}/api/auth-meta-callback`;

    // Trocar code por short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `client_id=${appId}&` +
      `client_secret=${appSecret}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      throw new Error(tokenData.error.message);
    }

    const shortToken = tokenData.access_token;

    // Trocar por long-lived token (60 dias)
    const longRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${appId}&` +
      `client_secret=${appSecret}&` +
      `fb_exchange_token=${shortToken}`
    );
    const longData = await longRes.json();

    if (longData.error) {
      throw new Error(longData.error.message);
    }

    const longToken = longData.access_token;
    const expiresIn = longData.expires_in; // segundos

    // Buscar info do usuário
    const userRes = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name,email&access_token=${longToken}`
    );
    const userData = await userRes.json();

    // Redirecionar para o painel admin com os dados via query params
    const params = new URLSearchParams({
      token: longToken,
      expires_in: String(expiresIn),
      user_id: userData.id,
      user_name: userData.name || '',
      user_email: userData.email || '',
    });

    return res.redirect(`${appUrl}/admin/meta-connect?${params.toString()}`);

  } catch (err: any) {
    console.error('OAuth Meta erro:', err);
    return res.redirect(`${appUrl}/admin/meta-connect?error=${encodeURIComponent(err.message)}`);
  }
}
