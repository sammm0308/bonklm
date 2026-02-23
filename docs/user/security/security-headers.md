# Security Headers Guide

When deploying BonkLM in production, proper security headers are essential for defense in depth. This guide shows how to configure recommended headers.

## Essential Security Headers

### 1. Content Security Policy (CSP)

CSP helps prevent XSS attacks by controlling which resources can be loaded.

```typescript
import express from 'express';
import helmet from 'helmet';

const app = express();

// Configure CSP for LLM API endpoints
app.use('/api/ai', helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
  },
}));
```

### 2. HTTP Strict Transport Security (HSTS)

Forces HTTPS connections and prevents man-in-the-middle attacks.

```typescript
import helmet from 'helmet';

app.use(helmet.hsts({
  maxAge: 31536000, // 1 year in seconds
  includeSubDomains: true,
  preload: true,
}));
```

### 3. X-Frame-Options (CLICKJACKING protection)

```typescript
app.use(helmet.frameguard({
  action: 'deny', // SAMEORIGIN or DENY
}));
```

### 4. X-Content-Type-Options

Prevents MIME-sniffing.

```typescript
app.use(helmet.noSniff());
```

### 5. X-XSS-Protection

Legacy XSS protection (modern browsers use CSP).

```typescript
// Set via helmet defaults
app.use(helmet.xssFilter());
```

## Complete Security Middleware Setup

```typescript
import express from 'express';
import helmet from 'helmet';
import { createGuardrailsMiddleware } from '@blackunicorn/bonklm-express';

const app = express();

// 1. Apply security headers to all routes
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  frameguard: {
    action: 'deny',
  },
}));

// 2. Additional security headers
app.use((req, res, next) => {
  // Prevent caching of sensitive responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Content Type enforcement
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (formerly Feature Policy)
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
});

// 3. Apply guardrails middleware
app.use('/api/ai', createGuardrailsMiddleware({
  validators: [/* your validators */],
}));
```

## CORS Configuration

Proper CORS settings prevent unauthorized cross-origin requests.

```typescript
import cors from 'cors';

const allowedOrigins = [
  'https://yourdomain.com',
  'https://app.yourdomain.com',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'CORS policy: This origin is not allowed';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 600, // 10 minutes
}));
```

## Fastify Security Headers

```typescript
import fastifyHelmet from '@fastify/helmet';

await fastify.register(fastifyHelmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});
```

## Headers for API Responses

For JSON API endpoints, include these headers:

```typescript
app.use('/api', (req, res, next) => {
  // Prevent JSON hijacking
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Indicate this is an API (no UI)
  res.setHeader('X-Requested-With', 'XMLHttpRequest');

  // No caching for security-sensitive responses
  res.setHeader('Cache-Control', 'no-store, no-cache');

  next();
});
```

## Security Headers Checklist

- [ ] Content-Security-Policy configured
- [ ] Strict-Transport-Security (HSTS) enabled
- [ ] X-Frame-Options set to DENY or SAMEORIGIN
- [ ] X-Content-Type-Options: nosniff
- [ ] X-XSS-Protection enabled (legacy support)
- [ ] Referrer-Policy configured
- [ ] Permissions-Policy set
- [ ] Cache-Control properly set for sensitive endpoints
- [ ] CORS properly configured
- [ ] Expect-CT enabled (certificate transparency)

## Testing Security Headers

Use these tools to verify your security headers:

```bash
# curl
curl -I https://your-api.com/api/ai

# Security Headers tool
# Visit: https://securityheaders.com/

# OWASP ZAP or similar scanner
```

Expected response headers should include:

```
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=()
```
