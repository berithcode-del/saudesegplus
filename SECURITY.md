# Security Baseline

## Public HTTP entry points

Only these routes may bypass the main JWT guard:

| Route | Reason | Additional protection |
| --- | --- | --- |
| `GET /api` and health endpoints | Service health | Read-only |
| `POST /api/auth/login` | Authentication bootstrap | DTO validation, 5 requests/minute |
| `POST /api/company` | Company registration | DTO validation, 1 MB global body limit |
| `POST /api/colaboradores` | Registration by invite | UUID invite, strong password, 5 requests/minute |
| `GET /api/portal/preview/:token` | Invite preview | UUID token, 20 requests/minute |
| `POST /api/portal/auth` | Portal authentication | CPF/date validation, 5 requests/minute |
| Other `/api/portal/*` routes | Patient portal | `PortalSessionGuard` and process ownership |
| `POST /api/upload/file` | Patient document upload | `PortalSessionGuard`, MIME allow-list, 8 MB |
| `POST /api/signature/webhook` | Signature provider callback | Shared secret with timing-safe comparison |

Any new public route must be added to this table with its compensating control.

## Role boundaries

| Area | Allowed roles |
| --- | --- |
| Admin and financial | `ADMIN` |
| Company | `ADMIN`, `COMPANY_ADMIN` with company scope |
| Clinic profile/operators | `CLINIC` |
| Medical record, ASO, teleconsultation | `DOCTOR` (admin read where declared) |
| Queue and exam collection | `ADMIN`, `DOCTOR`, `CLINIC`, `OPERATOR` as declared |
| Patient requests | `PATIENT` with patient scope, or `ADMIN` |

## Required production configuration

- `JWT_SECRET`: at least 32 characters.
- `CORS_ORIGINS`: comma-separated HTTPS origins.
- `SIGNATURE_WEBHOOK_SECRET`: unique secret for signature callbacks.
- TLS termination must be enabled so HSTS and secure cookies are effective.

## Local verification

Run `npm run security:check`. Dependency audit requires an explicitly approved
external npm registry request and should also run in the private CI pipeline.
