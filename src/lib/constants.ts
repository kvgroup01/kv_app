/**
 * Central configuration for the application.
 * Values are prioritized from environment variables.
 */

const getViteEnv = (key: string, fallback: string = ''): string => {
  return import.meta.env[key] || fallback;
};

// Ensure domain has a protocol
const formatDomain = (domain: string): string => {
  if (!domain) return '';
  if (domain.startsWith('http')) return domain;
  return `https://${domain}`;
};

// Force dashboard domain regardless of Vite Env or AI Studio injected OS Secrets
const APP_URL = 'https://sistema.kvgroupbr.com.br';

export const CONFIG = {
  APP_URL,
  APPWRITE: {
    ENDPOINT: getViteEnv('VITE_APPWRITE_ENDPOINT', 'https://cloud.appwrite.io/v1'),
    PROJECT_ID: getViteEnv('VITE_APPWRITE_PROJECT_ID'),
  }
};
