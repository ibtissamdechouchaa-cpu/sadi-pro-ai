# SADI PRO — Security

## Authentication

- Supabase Auth with email/password
- Session persistence with auto-refresh
- Password validation (min 8 chars, uppercase, lowercase, number)
- Email validation
- Demo mode for development

## Authorization

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|------------|
| Owner | Full access to everything |
| Admin | All except billing ownership |
| Manager | Department-level document management |
| Editor | Create, read, update documents |
| Reviewer | Read and approve documents |
| Viewer | Read-only access |
| Auditor | Read documents and audit logs |

### Granular Permissions

```
document.read, document.create, document.update, document.delete
document.download, document.share, document.approve, document.archive, document.restore
org.manage, billing.manage, billing.read, team.manage, settings.manage
audit.read, compliance.manage, compliance.read
```

## Row Level Security (RLS)

All database tables have RLS enabled:
- Users can only query their organization's data
- Policies enforce tenant isolation at database level
- Server-side authorization (not just UI hiding)

## File Security

### Validation
- MIME type verification
- File extension checking
- Magic byte validation
- Size limits (500MB per file, 100GB per batch)
- Filename sanitization (removes special characters)

### Blocked File Types
```
exe, bat, cmd, com, msi, scr, pif
js, vbs, vbe, wsf, wsh, ps1, psm1
reg, inf, dll, sys, drv, sh, bash
```

### Suspicious File Detection
- Double extension detection (e.g., `file.exe.pdf`)
- MIME/extension mismatch warnings
- Null byte detection in filenames

## Input Sanitization

- HTML entity encoding for all user input
- Filename sanitization
- SQL injection prevention (Supabase parameterized queries)
- XSS protection via React's default escaping

## Rate Limiting

- Client-side rate limiting per operation
- Configurable attempts and window

## Audit Logging

All significant actions are logged:
- LOGIN, LOGOUT, SIGNUP
- UPLOAD, DOWNLOAD, VIEW
- CREATE, UPDATE, DELETE
- ARCHIVE, RESTORE, SHARE
- AI_ANALYSIS, PERMISSION_CHANGE
- LEGAL_HOLD, RETENTION_CHANGE

Audit logs are **immutable** — no updates or deletes allowed.

## Data Privacy

- Organization data is logically separated
- User data export available
- Data deletion request support
- No sensitive data in localStorage
- Environment variables for secrets

## Security Headers

Configured in production:
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Content-Type-Options
- X-Frame-Options

## Recommendations for Production

1. Enable Supabase RLS policies (run migrations)
2. Configure CORS properly
3. Set up CSP headers
4. Enable MFA for admin accounts
5. Regular security audits
6. Monitor audit logs
7. Implement webhook signatures
8. Use signed URLs for file downloads
