# PWA + Capacitor — Specification

## Problem Statement
Transformar `apps/mobile` em PWA instalável (Android-first) com service worker, cache offline, e Web Push. Preparar `capacitor.config.ts` para wrapper nativo futuro (sem build agora). Distribuição faseada: PWA (M4) → Capacitor (M5).

## Goals
- [ ] `manifest.json` válido (ícone, splash, theme, display standalone)
- [ ] Service worker registra e cacheia assets + questionário offline
- [ ] Web Push funcional (inscrição + recepção em Android)
- [ ] `capacitor.config.ts` pronto para wrapper nativo
- [ ] Lighthouse PWA score ≥ 90
- [ ] Lighthouse Performance ≥ 80 em dispositivo mid-range
- [ ] README documenta teste em dispositivo físico via LAN

## Out of Scope
| Feature | Reason |
|---------|--------|
| Build nativo Capacitor (APK/AAB) | M5 — decisão de produto |
| Push via FCM/APNs nativo | M5 (via Capacitor) |
| iOS App Store | iOS parcial em PWA por ora |

## User Stories

### P1: PWA Instalável ⭐ MVP
**AC**:
1. WHEN `manifest.json` válido THEN navegador mostra "Instalar app"
2. WHEN instalado THEN abre standalone (sem barra do navegador)
3. WHEN splash screen THEN mostra ícone/tema do app

### P2: Service Worker + Offline
**AC**:
1. WHEN service worker registra THEN cacheia assets estáticos
2. WHEN offline THEN questionário carrega do cache (IndexedDB + SW)
3. WHEN volta online THEN sincroniza rascunhos pendentes

### P3: Web Push
**AC**:
1. WHEN usuário permite notificações THEN inscreve em push service
2. WHEN evento crítico (TELECONSULTA_INICIADA) THEN recebe notificação
3. WHEN notificação clicada THEN abre app na tela correta

### P4: Capacitor Ready
**AC**:
1. WHEN `capacitor.config.ts` existe THEN appId/appName/webDir configurados
2. WHEN `npx capacitor sync` THEN sincroniza (sem build nativo, só checagem)

## Requirement Traceability
| ID | Story | Status |
|----|-------|--------|
| REQ-PWA-001 | P1: manifest válido | Pending |
| REQ-PWA-002 | P1: standalone | Pending |
| REQ-PWA-003 | P1: splash | Pending |
| REQ-PWA-004 | P2: SW cacheia assets | Pending |
| REQ-PWA-005 | P2: Offline questionário | Pending |
| REQ-PWA-006 | P2: Sync online | Pending |
| REQ-PWA-007 | P3: Inscrição push | Pending |
| REQ-PWA-008 | P3: Notificação recebida | Pending |
| REQ-PWA-009 | P3: Deep link da notificação | Pending |
| REQ-PWA-010 | P4: capacitor.config válido | Pending |
| REQ-PWA-011 | P4: capacitor sync checagem | Pending |
