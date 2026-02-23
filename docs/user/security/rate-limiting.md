# Rate Limiting Integration

BonkLM middleware does not include built-in rate limiting to allow flexibility with your existing infrastructure. However, rate limiting is **strongly recommended** to prevent brute force attacks and DoS vulnerabilities.

## Why Rate Limiting is Important

Without rate limiting, an attacker could:
- Submit malicious prompts repeatedly to find patterns that bypass detection
- Overwhelm your system with requests (DoS attack)
- Attempt to brute force override tokens
- Exhaust server resources through complex validation requests

## Express Integration Example

Using `express-rate-limit`:

```typescript
import express from 'express';
import rateLimit from 'express-rate-limit';
import { createGuardrailsMiddleware } from '@blackunicorn/bonklm-express';

const app = express();
app.use(express.json());

// Configure rate limiter for guardrails endpoints
const guardrailsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting before guardrails
app.use('/api/ai', guardrailsLimiter);
app.use('/api/ai', createGuardrailsMiddleware({
  validators: [/* your validators */],
}));
```

## Advanced Configuration

### Sliding Window Rate Limiting

For production use, consider a sliding window implementation:

```typescript
import rateLimit from 'express-rate-limit';

const slidingWindowLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  // Skip successful requests (only count blocked ones)
  skipSuccessfulRequests: true,
  // Use a custom store for distributed systems
  store: new RedisStore({
    client: redisClient,
    prefix: 'guardrails:limit:',
  }),
});
```

### Per-User Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const userLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  keyGenerator: (req) => {
    // Use authenticated user ID if available
    return (req as any).user?.id || req.ip;
  },
});
```

## Redis-Based Distributed Rate Limiting

For multi-instance deployments, use Redis:

```typescript
import RedisStore from 'rate-limit-redis';
import redis from 'redis';
import rateLimit from 'express-rate-limit';

const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
});

await redisClient.connect();

const distributedLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'llm-guard:rate:',
  }),
  windowMs: 60 * 1000,
  max: 100,
});
```

## Fastify Integration

```typescript
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';

export default fp(async (fastify) => {
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    cache: 10000,
    allowList: ['127.0.0.1'],
    redis: fastify.redis, // Optional: use Redis for distributed limiting
  });
});
```

## Recommended Rate Limits

| Use Case | Requests | Window |
|----------|----------|--------|
| Development | 1000 | 15 minutes |
| Production (authenticated) | 100 | 15 minutes |
| Production (anonymous) | 20 | 15 minutes |
| API Key based | 1000 | 1 hour |

## Monitoring and Alerts

Set up monitoring for rate limit violations:

```typescript
import rateLimit from 'express-rate-limit';

const monitoredLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  handler: (req, res) => {
    // Log rate limit violations for security monitoring
    console.warn('[SECURITY] Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString(),
    });

    res.status(429).json({
      error: 'Too many requests',
    });
  },
});
```

## Security Best Practices

1. **Always apply rate limiting before guardrails** to reduce load on validation
2. **Use different limits for authenticated vs anonymous users**
3. **Implement progressive backoff** for repeated violations
4. **Log rate limit violations** for security monitoring
5. **Use Redis stores** for distributed deployments
6. **Consider CAPTCHA** after repeated violations
