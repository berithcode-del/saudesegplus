interface ImportMetaEnv {
  readonly PROD: boolean;
  readonly VITE_BACKEND_URL: string;
  readonly VITE_VAPID_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
