# CORS Configuration Guide

This document explains how to configure Cross-Origin Resource Sharing (CORS) for the IMIP application across different environments.

## Overview

CORS is a security feature that controls which domains can make requests to your API. Proper CORS configuration is **critical** for production security.

## Current Implementation

**Location**: `app/config.py` lines 80-102 and `app/api.py` lines 113-141

### Development Mode

When `ENVIRONMENT=development` or `DEBUG=true`:

```python
CORS_ORIGINS = [
    "http://localhost:5173",  # Vite default
    "http://localhost:5174",  # Vite alternate
    "http://localhost:3000",  # React/Next.js
    "http://localhost:3001",  # Alternate
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000"
]
```

**CORS Policy**:
- `allow_credentials=True` (cookies/auth headers allowed)
- `allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]`
- `allow_headers=["*"]` (permissive for development)
- `max_age=600` (10-minute preflight cache)

### Production Mode

When `ENVIRONMENT=production` and `DEBUG=false`:

```python
CORS_ORIGINS = []  # Must be explicitly set via environment variable
```

**CORS Policy**:
- `allow_credentials=True` (required for cookie auth)
- `allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"]` (no OPTIONS)
- `allow_headers=[...]` (explicit allowlist)
- `max_age=3600` (1-hour preflight cache)

---

## Configuration

### Method 1: Environment Variable (Recommended)

Set `CORS_ORIGINS` in your `.env` file or environment:

```bash
# Backend .env
CORS_ORIGINS=https://app.example.com,https://www.example.com,https://admin.example.com
ENVIRONMENT=production
DEBUG=false
```

**Format**: Comma-separated list of fully-qualified URLs with protocol and domain.

### Method 2: Modify config.py

Edit `app/config.py` directly (not recommended for production):

```python
def _setup_cors_origins(self):
    if self.ENVIRONMENT == "production":
        self.CORS_ORIGINS = [
            "https://app.example.com",
            "https://www.example.com",
            "https://admin.example.com"
        ]
```

---

## Validation

### Check Current Configuration

Run this command to see your active CORS origins:

```bash
# From project root
python -c "from app.config import config; print('CORS Origins:', config.CORS_ORIGINS); print('Environment:', config.ENVIRONMENT); print('Debug:', config.DEBUG)"
```

**Expected output (production)**:
```
CORS Origins: ['https://app.example.com', 'https://www.example.com']
Environment: production
Debug: False
```

### Test CORS from Browser

Open browser console on your frontend domain and run:

```javascript
fetch('https://api.example.com/health', {
  method: 'GET',
  credentials: 'include' // Required for cookie auth
})
.then(r => r.json())
.then(data => console.log('CORS OK:', data))
.catch(err => console.error('CORS Error:', err));
```

**Success**: Response received  
**Failure**: CORS error in console (add origin to allowed list)

### Test Preflight (OPTIONS)

```bash
curl -X OPTIONS https://api.example.com/api/meetings \
  -H "Origin: https://app.example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Authorization" \
  -v
```

**Expected headers in response**:
```
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH
Access-Control-Max-Age: 3600
```

---

## Common Scenarios

### Scenario 1: Single-Page App on Same Domain

**Example**: Frontend at `https://example.com`, API at `https://example.com/api`

```bash
# No CORS needed - use reverse proxy
CORS_ORIGINS=https://example.com
```

**Nginx config**:
```nginx
location /api/ {
    proxy_pass http://localhost:8080/;
}

location / {
    root /var/www/frontend;
}
```

### Scenario 2: Subdomain API

**Example**: Frontend at `https://app.example.com`, API at `https://api.example.com`

```bash
CORS_ORIGINS=https://app.example.com
```

**Cookie configuration** (if using cookie auth):
```bash
COOKIE_AUTH_ENABLED=true
COOKIE_DOMAIN=.example.com  # Allows sharing across subdomains
COOKIE_SECURE=true
COOKIE_SAMESITE=lax
```

### Scenario 3: Multiple Frontend Domains

**Example**: Marketing site + App + Admin panel

```bash
CORS_ORIGINS=https://example.com,https://app.example.com,https://admin.example.com
```

### Scenario 4: Development + Production

Use environment-specific `.env` files:

```bash
# .env.development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
DEBUG=true
ENVIRONMENT=development

# .env.production
CORS_ORIGINS=https://app.example.com
DEBUG=false
ENVIRONMENT=production
COOKIE_SECURE=true
```

---

## Security Best Practices

### ✅ DO

1. **Explicit origins only**: Never use `*` wildcard with credentials
2. **HTTPS in production**: Always use `https://` origins
3. **Minimal origins**: Only list domains you control
4. **Environment-specific**: Different origins for dev/staging/prod
5. **Validate environment**: Check config on deployment

### ❌ DON'T

1. **Never use `*` with credentials**:
   ```python
   # DANGEROUS - exposes auth to any domain
   allow_origins=["*"]
   allow_credentials=True
   ```

2. **Never allow HTTP in production**:
   ```bash
   # INSECURE
   CORS_ORIGINS=http://example.com  # Should be https://
   ```

3. **Never allow untrusted domains**:
   ```bash
   # RISKY - attacker domain
   CORS_ORIGINS=https://evil.com
   ```

4. **Never use overly permissive headers**:
   ```python
   # Too broad for production
   allow_headers=["*"]
   ```

---

## Troubleshooting

### Issue: CORS error in browser console

**Error**: `Access to fetch at 'https://api.example.com' from origin 'https://app.example.com' has been blocked by CORS policy`

**Solution**:
1. Check `CORS_ORIGINS` includes the frontend domain
2. Verify protocol matches (http vs https)
3. Ensure `allow_credentials=True` if using cookies
4. Check backend logs for rejected origins

### Issue: Preflight request fails

**Error**: OPTIONS request returns 403 or 404

**Solution**:
1. Ensure CORS middleware is loaded before routes
2. Check `allow_methods` includes the request method
3. Verify `allow_headers` includes requested headers
4. In production, OPTIONS may be disabled - use reverse proxy

### Issue: Cookies not sent

**Error**: Requests succeed but cookies missing

**Solution**:
1. Set `credentials: 'include'` in frontend fetch/axios:
   ```javascript
   axios.create({ withCredentials: true })
   ```
2. Verify `allow_credentials=True` in backend
3. Check `COOKIE_DOMAIN` matches request domain
4. Ensure `COOKIE_SAMESITE` is `lax` or `none` (with `COOKIE_SECURE=true`)

### Issue: Different behavior in dev vs prod

**Symptoms**: Works locally, fails in production

**Solution**:
1. Check environment detection:
   ```bash
   echo $ENVIRONMENT
   echo $DEBUG
   ```
2. Verify production `CORS_ORIGINS` is set
3. Test production config locally:
   ```bash
   ENVIRONMENT=production DEBUG=false python run.py
   ```
4. Check reverse proxy isn't stripping CORS headers

---

## Testing Checklist

Before deploying to production:

- [ ] `CORS_ORIGINS` set to production domains only
- [ ] `ENVIRONMENT=production` and `DEBUG=false`
- [ ] All origins use HTTPS (no HTTP)
- [ ] Preflight OPTIONS requests succeed
- [ ] Authenticated requests work with credentials
- [ ] Cookies are set and sent correctly (if using cookie auth)
- [ ] No CORS errors in browser console
- [ ] Backend logs show allowed origins
- [ ] Test from each frontend domain
- [ ] Verify wildcards are not used

---

## Monitoring

### Log CORS rejections

Backend logs include CORS decisions:

```python
# app/api.py logs
INFO: CORS middleware initialized with origins: ['https://app.example.com']
WARNING: CORS request from https://evil.com rejected (not in allowed origins)
```

### Metrics to track

- CORS-related 403 errors
- Preflight OPTIONS request volume
- Requests from unexpected origins
- Cookie authentication failures

---

## Reference

### CORS Headers Explained

| Header | Purpose | Example |
|--------|---------|---------|
| `Access-Control-Allow-Origin` | Specifies allowed origin | `https://app.example.com` |
| `Access-Control-Allow-Credentials` | Allows cookies/auth | `true` |
| `Access-Control-Allow-Methods` | Allowed HTTP methods | `GET, POST, PUT, DELETE` |
| `Access-Control-Allow-Headers` | Allowed request headers | `Authorization, Content-Type` |
| `Access-Control-Max-Age` | Preflight cache duration | `3600` (1 hour) |
| `Access-Control-Expose-Headers` | Headers visible to JS | `X-Request-ID` |

### Frontend Configuration

When backend uses credentials:

```javascript
// axios
const api = axios.create({
  baseURL: 'https://api.example.com',
  withCredentials: true  // Required for cookies
});

// fetch
fetch('https://api.example.com/api/meetings', {
  credentials: 'include'  // Required for cookies
});
```

---

## Additional Resources

- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [OWASP: CORS Security](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#cross-origin-resource-sharing)
- [SECURITY.md](../SECURITY.md) - General security guidelines
- [TOKEN_REFRESH_IMPLEMENTATION.md](../TOKEN_REFRESH_IMPLEMENTATION.md) - Cookie auth details

---

**Last Updated**: 2025-10-03
