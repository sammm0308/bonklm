# UAT Quick Checklist

**Dev Server**: 192.168.70.105 | **User**: paultinp

---

## Initial Setup

- [ ] SSH to dev server: `ssh paultinp@192.168.70.105`
- [ ] Run setup script: `bash team/qa/setup-dev-env.sh`
- [ ] Update `.env` with any required API keys
- [ ] Verify: `node -v` (should be 18+)
- [ ] Verify: `pnpm -v`
- [ ] Build: `pnpm build`

---

## Core Validators (CRITICAL - 100% Pass Required)

| ID | Test | Command | Status |
|----|------|---------|--------|
| 1 | Prompt Injection | `npm run uat -- --category security` | [ ] |
| 2 | Jailbreak Detection | `npm run uat -- --category security` | [ ] |
| 3 | Secret Guard | `npm run uat -- --category security` | [ ] |
| 4 | PII Detection | `npm run uat -- --category security` | [ ] |
| 5 | Reformulation | `npm run uat -- --category security` | [ ] |
| 6 | Multilingual | `npm run uat -- --category security` | [ ] |

**Pass Criteria**: All security tests MUST pass (0 false negatives)

---

## Framework Connectors (CRITICAL)

| ID | Connector | Test Command | Status |
|----|-----------|--------------|--------|
| 1 | Express | `pnpm test --workspace=packages/express-middleware` | [ ] |
| 2 | Fastify | `pnpm test --workspace=packages/fastify-plugin` | [ ] |
| 3 | NestJS | `pnpm test --workspace=packages/nestjs-module` | [ ] |

**Pass Criteria**: All connectors must integrate without errors

---

## LLM Provider Connectors (Priority 2)

| ID | Connector | Test Command | Status |
|----|-----------|--------------|--------|
| 1 | OpenAI | `pnpm test --workspace=packages/openai-connector` | [ ] |
| 2 | Anthropic | `pnpm test --workspace=packages/anthropic-connector` | [ ] |
| 3 | Ollama | `pnpm test --workspace=packages/ollama-connector` | [ ] |

**Pass Criteria**: 90%+ pass rate

---

## Vector DB Connectors (Priority 2)

| ID | Connector | Test Command | Status |
|----|-----------|--------------|--------|
| 1 | Chroma | `pnpm test --workspace=packages/chroma-connector` | [ ] |
| 2 | Pinecone | `pnpm test --workspace=packages/pinecone-connector` | [ ] |
| 3 | Qdrant | `pnpm test --workspace=packages/qdrant-connector` | [ ] |
| 4 | Weaviate | `pnpm test --workspace=packages/weaviate-connector` | [ ] |

**Pass Criteria**: 90%+ pass rate

---

## AI Framework Connectors (Priority 3)

| ID | Connector | Test Command | Status |
|----|-----------|--------------|--------|
| 1 | LangChain | `pnpm test --workspace=packages/langchain-connector` | [ ] |
| 2 | LlamaIndex | `pnpm test --workspace=packages/llamaindex-connector` | [ ] |
| 3 | Mastra | `pnpm test --workspace=packages/mastra-connector` | [ ] |
| 4 | GenKit | `pnpm test --workspace=packages/genkit-connector` | [ ] |

---

## Full UAT Commands

```bash
# Run all UAT tests
npm run uat

# With HTML report
npm run uat -- --report

# Verbose output
npm run uat -- --verbose

# JSON output for automation
npm run uat -- --json

# List all tests
npm run uat -- --list

# Specific category
npm run uat -- --category security
npm run uat -- --category happy-path
npm run uat -- --category edge-cases
npm run uat -- --category performance
```

---

## Acceptance Criteria

### Must Pass (Blocking)
- [ ] 100% of core security tests pass
- [ ] 0 false negatives on known attack patterns
- [ ] All framework connectors integrate successfully

### Should Pass
- [ ] 90%+ of LLM provider connector tests
- [ ] 90%+ of vector DB connector tests
- [ ] < 5% false positive rate

### Performance
- [ ] Validation latency < 100ms for typical input
- [ ] Memory usage < 500MB for full engine
- [ ] Streaming validation adds < 10% overhead

---

## Quick Verification

```bash
# Quick smoke test (core only)
npm run uat -- --category security --verbose

# Check all connectors work
pnpm test --workspace=packages/*
```

---

## Report Generation

```bash
# Generate HTML report
npm run uat -- --report

# Report location
ls team/uat/reports/
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Module not found | Run `pnpm build` |
| Permission denied | Don't use sudo, check node version |
| Tests timeout | Check if API keys are needed |
| Port in use | Kill existing processes: `pkill -f "node.*express"` |

---

**Sign-off**

Tester: ______________ Date: ________

Pass/Fail: ____________

Notes: ________________________________
