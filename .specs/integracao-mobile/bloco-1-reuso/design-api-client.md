# API Client — Design

## Architecture

```
packages/api-client/
├── src/
│   ├── index.ts                  # re-exports públicos
│   ├── client.ts                 # apiFetch (wrapper fetch genérico)
│   ├── socket.ts                 # useQueue hook (Socket.IO)
│   ├── storage/
│   │   ├── types.ts              # StorageAdapter interface
│   │   ├── localStorage.ts       # LocalStorageAdapter (web)
│   │   └── capacitor.ts          # CapacitorPreferencesAdapter (mobile, lazy)
│   ├── auth.ts                   # getAuthToken, getProfileIdFromToken
│   └── config.ts                 # Base URL por env (NEXT_PUBLIC_ ou VITE_)
└── package.json
```

## Key Design Decisions

### Storage Injection (AD-002)
`apiFetch` e `useQueue` recebem o storage via parâmetro/config, não importam `localStorage` direto.

```typescript
interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

class ApiClient {
  constructor(private storage: StorageAdapter, private baseUrl: string) {}
  async fetch(path: string, options?: RequestInit) { ... }
}
```

### Base URL Config (env-agnostic)
`config.ts` lê `process.env.NEXT_PUBLIC_BACKEND_URL` ou `import.meta.env.VITE_BACKEND_URL` dependendo do runtime.

### Socket.IO Lazy Import
Mantém o lazy-import de `socket.io-client` (como no `api.ts` atual) para evitar SSR issues no web e reduzir bundle.

## Migration Strategy (web)
1. Criar `packages/api-client` com imports/export espelhando `api.ts`
2. `web` cria `LocalStorageAdapter` e passa para `ApiClient`
3. Substituir imports de `app/lib/api.ts` por `@repo/api-client` gradualmente
4. Manter `api.ts` como thin wrapper durante transição (deprecated)
5. Remover `api.ts` quando 100% migrado

## Dependencies
- `socket.io-client` (peer dep)
- `@repo/api-types` (tipos)
