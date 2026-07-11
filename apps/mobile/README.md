# SaudeSeg+ Mobile

App mobile SPA (Vite + React) com PWA e preparação para Capacitor.

## Stack

- **Frontend**: React 19 + Vite + React Router v7
- **PWA**: Service Worker + Manifest + Web Push
- **Capacitor**: Configurado (wrapper nativo para futuro)
- **Vendor**: `src/lib/vendor/api-types` e `api-client` (copias locais dos packages do monorepo)

## Desenvolvimento

### Instalar dependências

```bash
cd apps/mobile
npm install
```

### Rodar em dispositivo físico (LAN)

```bash
# Na máquina, descubra o IP (ipconfig no Windows)
# O vite.config.ts já tem server.host: true

npm run dev

# Acesse no celular: http://<IP_DA_MAQUINA>:5173
```

### Build para produção

```bash
npm run build
# Output: apps/mobile/dist/
```

### Checar tipos

```bash
npm run check-types
```

## Instalar como PWA no Android

1. Abra Chrome no Android e acesse `http://<IP>:5173` (dev) ou a URL de produção
2. Toque no menu (3 pontos) → "Instalar app" ou "Adicionar à tela inicial"
3. O app aparece como ícone independente, sem barra do navegador

### Testar offline

1. Instale o PWA
2. Navegue pelo portal (preencha dados)
3. Ative modo avião
4. Navegue novamente — o SW serve as páginas do cache
5. O questionário (IndexedDB) funciona 100% offline

## Web Push

### Configurar VAPID keys

1. Gere as chaves: `npx web-push generate-vapid-keys`
2. Crie `.env` em `apps/mobile/`:
   ```
   VITE_VAPID_PUBLIC_KEY=<sua_chave_publica>
   ```
3. No backend, configure a chave privada no módulo de push

### Fluxo

1. Usuário concede permissão de notificação
2. App inscreve no push service com as VAPID keys
3. Backend envia push quando evento crítico (ex: teleconsulta iniciada)
4. SW mostra notificação → click abre app na tela correta

## Capacitor (preparação)

O `capacitor.config.ts` está configurado:

```json
{
  "appId": "com.saudesegplus.mobile",
  "appName": "SaudeSeg+",
  "webDir": "dist"
}
```

### Para build nativo (futuro)

```bash
npm run build
npx cap sync android
npx cap open android
```

## Estrutura

```
apps/mobile/
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── sw.js                # Service worker
│   └── icons/               # Ícones SVG (logo oficial)
├── src/
│   ├── app/                 # App.tsx, providers, globals.css
│   ├── routes/
│   │   ├── portal/[token]/  # Portal do colaborador (7 telas)
│   │   ├── medico/          # Fluxo médico (login + 4 telas)
│   │   └── consultorio/     # Placeholder
│   ├── components/          # ConnectionStatus, ErrorBoundary
│   ├── hooks/               # usePortalAuth, useQueue, useCamera, etc.
│   └── lib/
│       ├── vendor/          # Copias locais de api-types e api-client
│       ├── storage.ts       # Storage adapter
│       └── questionDraft.ts # IndexedDB draft
├── capacitor.config.ts
├── vite.config.ts
└── package.json
```

## Nota sobre packages

O mobile é um projeto independente do monorepo. Os packages `api-types` e `api-client`
foram copiados para `src/lib/vendor/` para evitar dependência do npm workspaces do root.

Se os packages do monorepo forem atualizados, copie as alterações para `src/lib/vendor/`
manualmente ou execute o script de sincronização (a ser criado).
