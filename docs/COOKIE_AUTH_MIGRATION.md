# Cookie-Based Authentication Migration Guide

This guide helps you migrate from localStorage-based JWT tokens to httpOnly cookies for enhanced security.

## Overview

### Current Authentication (Default)

**localStorage with Bearer tokens:**
- Access tokens stored in `localStorage`
- Sent as `Authorization: Bearer <token>` header
- Vulnerable to XSS attacks
- Works across domains
- Easy to debug

### Recommended Authentication (Production)

**httpOnly cookies:**
- Tokens stored in secure httpOnly cookies
- Automatically sent by browser
- Protected from XSS (not accessible via JavaScript)
- Requires CSRF protection
- Requires same-origin or proper CORS configuration

---

## Why Migrate?

### Security Benefits

| Threat | localStorage | httpOnly Cookie |
|--------|-------------|-----------------|
| XSS attacks | ❌ Vulnerable | ✅ Protected |
| CSRF attacks | ✅ Immune | ⚠️ Requires protection |
| Network sniffing | ⚠️ Requires HTTPS | ⚠️ Requires HTTPS |
| Token theft | ❌ Easy via JS | ✅ Browser-protected |

### When to Use Each

**Use localStorage (Bearer tokens) if:**
- Developing/testing locally
- Mobile app (React Native, Flutter)
- Cross-domain auth (different top-level domains)
- Need to inspect tokens for debugging

**Use httpOnly cookies if:**
- Production web application
- Same domain or subdomains
- Security is priority over convenience
- Regulatory compliance (GDPR, HIPAA)

---

## Migration Steps

### Step 1: Enable Cookie Auth in Backend

Edit your backend `.env` file:

```bash
# Backend .env
COOKIE_AUTH_ENABLED=true
COOKIE_SECURE=auto          # auto = secure in prod, not secure in dev
COOKIE_SAMESITE=lax         # lax (recommended), strict, or none
COOKIE_DOMAIN=              # Leave empty or set to .yourdomain.com
COOKIE_ACCESS_MAX_AGE=3600  # 1 hour
COOKIE_REFRESH_MAX_AGE=604800  # 7 days
```

**Configuration Details:**

- `COOKIE_SECURE=auto`: Uses secure cookies in production (HTTPS), non-secure in development
- `COOKIE_SAMESITE=lax`: Allows cookies on same-site navigation; use `strict` for maximum security
- `COOKIE_DOMAIN`: Leave empty for single domain; set to `.example.com` for subdomain sharing
- `COOKIE_ACCESS_MAX_AGE`: Access token validity in seconds
- `COOKIE_REFRESH_MAX_AGE`: Refresh token validity in seconds

### Step 2: Enable Cookie Auth in Frontend

Edit your frontend `.env.local` file:

```bash
# Frontend .env.local
VITE_USE_COOKIE_AUTH=true
VITE_API_ROOT=http://localhost:8080  # Or your API URL
```

### Step 3: Restart Services

```bash
# Stop current services (Ctrl+C in terminals)

# Restart backend
cd backend
python run.py

# Restart frontend (in new terminal)
cd frontend
npm run dev
```

### Step 4: Test Authentication

1. **Clear existing tokens:**
   - Open browser DevTools → Application → Local Storage
   - Delete `token` and `refreshToken` entries

2. **Test login:**
   ```bash
   # Try logging in via UI or:
   curl -X POST http://localhost:8080/auth/login \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "email=member@test.com&password=member123!@#" \
     -c cookies.txt -v
   ```

3. **Verify cookies set:**
   - DevTools → Application → Cookies
   - Should see: `access_token`, `refresh_token`, `csrf_token`
   - `HttpOnly` flag should be checked
   - `Secure` flag depends on HTTPS

4. **Test authenticated request:**
   ```bash
   # Using saved cookies
   curl -X GET http://localhost:8080/api/meetings \
     -b cookies.txt \
     -H "x-csrf-token: <csrf_value_from_cookie>" \
     -v
   ```

### Step 5: Verify CSRF Protection

Cookie auth includes automatic CSRF protection:

1. **Frontend automatically:**
   - Reads `csrf_token` cookie
   - Sends as `x-csrf-token` header on requests
   - See `frontend/src/utils/axios.js` lines 44-48

2. **Backend validates:**
   - Checks `x-csrf-token` header matches cookie
   - Rejects mismatched or missing tokens
   - Implementation in `app/auth.py`

**Test CSRF rejection:**
```bash
# Request without CSRF token should fail
curl -X POST http://localhost:8080/api/meetings \
  -b "access_token=<token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test"}' \
  -v
# Expected: 403 Forbidden
```

---

## Configuration Reference

### Backend Environment Variables

```bash
# Required
COOKIE_AUTH_ENABLED=true        # Enable cookie-based auth

# Security
COOKIE_SECURE=auto              # auto | true | false
COOKIE_SAMESITE=lax             # lax | strict | none
COOKIE_DOMAIN=                  # empty or .example.com

# Expiry
COOKIE_ACCESS_MAX_AGE=3600      # Access token: 1 hour
COOKIE_REFRESH_MAX_AGE=604800   # Refresh token: 7 days

# CORS (required for cross-origin)
CORS_ORIGINS=https://app.example.com
ENVIRONMENT=production
DEBUG=false
```

### Frontend Environment Variables

```bash
# Required
VITE_USE_COOKIE_AUTH=true       # Enable cookie mode in axios
VITE_API_ROOT=https://api.example.com  # Backend URL
```

### Production Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name app.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # Backend proxy
    location /api/ {
        proxy_pass http://localhost:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Pass cookies
        proxy_pass_request_headers on;
        proxy_cookie_path / /;
    }

    # Frontend
    location / {
        root /var/www/imip/dist;
        try_files $uri /index.html;
    }
}
```

---

## Rollback Procedure

If issues arise, revert to localStorage authentication:

### Step 1: Disable Cookie Auth

```bash
# Backend .env
COOKIE_AUTH_ENABLED=false

# Frontend .env.local
VITE_USE_COOKIE_AUTH=false
```

### Step 2: Restart Services

```bash
# Restart backend and frontend as in Step 3 above
```

### Step 3: Clear Cookies

Users should clear cookies and log in again:
- Browser DevTools → Application → Cookies → Delete all for your domain
- Or: Settings → Privacy → Clear browsing data → Cookies

### Step 4: Verify Bearer Token Mode

Test that `Authorization: Bearer <token>` works:

```bash
# Login and get token
TOKEN=$(curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=member@test.com&password=member123!@#" \
  -s | jq -r '.token')

# Use token
curl -X GET http://localhost:8080/api/meetings \
  -H "Authorization: Bearer $TOKEN" \
  -v
```

---

## Troubleshooting

### Issue: Cookies not being set

**Symptoms:**
- Login succeeds but no cookies in DevTools
- Requests fail with 401 Unauthorized

**Solutions:**
1. Check `COOKIE_AUTH_ENABLED=true` in backend
2. Verify HTTPS in production (`COOKIE_SECURE=true` requires it)
3. Check browser console for errors
4. Verify CORS allows credentials:
   ```python
   allow_credentials=True  # In CORS middleware
   ```
5. Frontend must set:
   ```javascript
   axios.create({ withCredentials: true })
   ```

### Issue: CSRF validation fails

**Symptoms:**
- Authenticated requests return 403 Forbidden
- Error: "CSRF token mismatch" or "Missing CSRF token"

**Solutions:**
1. Check `csrf_token` cookie exists in DevTools
2. Verify axios interceptor sends header:
   ```javascript
   config.headers['x-csrf-token'] = csrf;
   ```
3. Backend logs should show token validation
4. Try disabling CSRF temporarily for debugging:
   ```python
   # In route handler (TESTING ONLY)
   # validate_csrf_token(request)  # Comment out
   ```

### Issue: Cookies not sent on requests

**Symptoms:**
- Cookies visible in DevTools but not in request headers
- Backend doesn't receive cookies

**Solutions:**
1. Ensure `withCredentials: true` in axios config
2. Check CORS `allow_credentials=True`
3. Verify `COOKIE_SAMESITE` setting:
   - `lax`: Works for same-site navigation
   - `none`: Requires `COOKIE_SECURE=true` (HTTPS)
4. Check `COOKIE_DOMAIN` matches request domain:
   - Empty: Exact domain match
   - `.example.com`: All subdomains

### Issue: Works locally, fails in production

**Symptoms:**
- Authentication works on localhost
- Fails on deployed environment

**Solutions:**
1. Verify HTTPS enabled (`COOKIE_SECURE=true`)
2. Check production `CORS_ORIGINS` includes frontend domain
3. Ensure `ENVIRONMENT=production` and `DEBUG=false`
4. Test with curl:
   ```bash
   curl -X POST https://api.example.com/auth/login \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "email=test@example.com&password=pass" \
     -c cookies.txt -v
   
   # Check Set-Cookie headers in response
   ```
5. Check reverse proxy passes cookies:
   ```nginx
   proxy_pass_request_headers on;
   proxy_cookie_path / /;
   ```

### Issue: Logout doesn't clear cookies

**Symptoms:**
- User logs out but remains authenticated
- Cookies persist after logout

**Solutions:**
1. Verify logout endpoint clears cookies:
   ```python
   # app/api.py
   response.delete_cookie('access_token')
   response.delete_cookie('refresh_token')
   response.delete_cookie('csrf_token')
   ```
2. Frontend should call logout API:
   ```javascript
   await axiosInstance.post('/auth/logout');
   ```
3. Clear localStorage as fallback:
   ```javascript
   localStorage.removeItem('token');
   localStorage.removeItem('refreshToken');
   ```

---

## Testing Checklist

Before deploying cookie auth to production:

### Backend
- [ ] `COOKIE_AUTH_ENABLED=true` in production `.env`
- [ ] `COOKIE_SECURE=true` (or `auto` with HTTPS)
- [ ] `COOKIE_SAMESITE` set appropriately
- [ ] `CORS_ORIGINS` includes frontend domain
- [ ] `allow_credentials=True` in CORS middleware
- [ ] CSRF validation works on state-changing endpoints
- [ ] Logout clears all cookies

### Frontend
- [ ] `VITE_USE_COOKIE_AUTH=true` in production `.env`
- [ ] `withCredentials: true` in axios config
- [ ] CSRF token sent on POST/PUT/DELETE requests
- [ ] Token refresh works automatically
- [ ] Logout clears cookies and redirects to login

### Manual Testing
- [ ] Login sets cookies (check DevTools)
- [ ] Cookies have `HttpOnly` and `Secure` flags
- [ ] Authenticated requests succeed
- [ ] CSRF protection blocks invalid requests
- [ ] Token refresh happens automatically
- [ ] Logout clears cookies
- [ ] Works across browser tabs
- [ ] Works after browser restart (if within refresh window)

### Security Testing
- [ ] Cookies not accessible via `document.cookie`
- [ ] XSS attempt doesn't steal tokens
- [ ] CSRF attempt blocked (missing/invalid token)
- [ ] HTTPS enforced in production
- [ ] No tokens in URL or logs

---

## Comparison Table

| Feature | localStorage | httpOnly Cookie |
|---------|-------------|-----------------|
| XSS protection | ❌ No | ✅ Yes |
| CSRF protection | ✅ Built-in | ⚠️ Needs implementation |
| Cross-domain | ✅ Easy | ⚠️ Complex |
| Mobile apps | ✅ Works | ❌ Not ideal |
| Debugging | ✅ Easy | ⚠️ Harder |
| Setup complexity | ✅ Simple | ⚠️ Moderate |
| Production security | ⚠️ Moderate | ✅ Strong |
| Browser support | ✅ Universal | ✅ Universal |

---

## Best Practices

### Development

1. Use `COOKIE_SECURE=auto` to avoid HTTPS requirement locally
2. Set `COOKIE_SAMESITE=lax` for easier testing
3. Keep `DEBUG=true` for detailed logs
4. Test both auth modes during development

### Production

1. Always use `COOKIE_SECURE=true` with HTTPS
2. Set `COOKIE_SAMESITE=strict` for maximum security
3. Use specific `CORS_ORIGINS` (no wildcards)
4. Enable rate limiting on auth endpoints
5. Monitor for CSRF and cookie-related errors
6. Implement session timeout warnings
7. Log all authentication events

### User Experience

1. Show clear error messages for auth failures
2. Auto-refresh tokens silently in background
3. Warn users before session expires
4. Provide "Keep me logged in" option (longer refresh token)
5. Clear guidance on logout

---

## Additional Resources

- [SECURITY.md](../SECURITY.md) - General security guidelines
- [TOKEN_REFRESH_IMPLEMENTATION.md](../TOKEN_REFRESH_IMPLEMENTATION.md) - Auth flow details
- [CORS_CONFIGURATION.md](./CORS_CONFIGURATION.md) - CORS setup
- [MDN: HttpOnly Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies)
- [OWASP: CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

---

**Last Updated**: 2025-10-03
