import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const appId = process.env.VITE_META_SYSTEM_APP_ID!;
  const redirectUri = `${process.env.VITE_APP_URL}/api/auth-meta-callback`;
  const scopes = [
    'ads_read',
    'ads_management',
    'business_management',
    'pages_read_engagement',
    'pages_show_list',
    'public_profile',
  ].join(',');
  const state = Math.random().toString(36).substring(2);
  const url = new URL('https://www.facebook.com/v19.0/dialog/oauth');
  url.searchParams.set('client_id', appId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', scopes);
  url.searchParams.set('state', state);
  url.searchParams.set('response_type', 'code');
  return res.redirect(url.toString());
}
