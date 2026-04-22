/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPWRITE_ENDPOINT: string
  readonly VITE_APPWRITE_PROJECT_ID: string
  readonly VITE_APPWRITE_API_KEY: string
  readonly VITE_APP_URL: string
  readonly APP_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
