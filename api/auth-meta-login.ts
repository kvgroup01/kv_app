import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const mode = req.query.mode as string || 'login';
  
  const isAds = mode === 'ads';
  const appId = isAds 
    ? process.env.VITE_META_SYSTEM_APP_ID!
    : process.env.VITE_META_LOGIN_APP_ID!;
    
  const redirectUri = `${process.env.VITE_APP_URL}/api/auth-meta-callback`;
  
  const scopes = isAds ? [
    'ads_read',
    'ads_management',
    'business_management',
    'pages_read_engagement',
    'pages_show_list',
    'public_profile',
  ].join(',') : [
    'email',
    'public_profile',
  ].join(',');

  const state = mode === 'ads' 
    ? 'ads_' + Math.random().toString(36).substring(2)
    : Math.random().toString(36).substring(2);
  const url = new URL('https://www.facebook.com/v19.0/dialog/oauth');
  url.searchParams.set('client_id', appId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', scopes);
  url.searchParams.set('state', state);
  url.searchParams.set('response_type', 'code');
  return res.redirect(url.toString());
}
