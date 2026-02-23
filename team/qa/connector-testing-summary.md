# Connector Testing Plan - Executive Summary

## Overview

Complete plan created for testing all 19 BonkLM connectors on the dev environment (192.168.70.105).

## Deliverables Created

| File | Location | Purpose |
|------|----------|---------|
| **Main Plan** | `team/qa/connector-integration-test-plan.md` | Complete testing strategy |
| **Quick Start** | `team/qa/connector-test-quick-start.md` | Step-by-step execution |
| **Test Runner** | `team/qa/run-all-connector-tests.sh` | Automated test script |
| **Docker Compose** | `team/qa/docker-compose.vector-db.yml` | Vector DB containers |
| **Env Template** | `team/qa/.env.connector-test.template` | API key template |

---

## Connectors to Test (19 Total)

### Category 1: Web Frameworks (3) - No external services
- Express Middleware
- Fastify Plugin
- NestJS Module

### Category 2: LLM Providers (3) - API keys required
- OpenAI Connector (requires `OPENAI_API_KEY`)
- Anthropic Connector (requires `ANTHROPIC_API_KEY`)
- Ollama Connector (requires local Ollama service)

### Category 3: AI Frameworks (3) - npm packages only
- Vercel AI SDK Connector
- LangChain Connector
- MCP Connector

### Category 4: Vector Databases (4) - Docker/local services
- Pinecone Connector (requires `PINECONE_API_KEY`)
- ChromaDB Connector (requires Docker container)
- Weaviate Connector (requires Docker container)
- Qdrant Connector (requires Docker container)

### Category 5: RAG & Emerging (6)
- LlamaIndex Connector
- HuggingFace Connector (requires `HUGGINGFACE_API_KEY`)
- Mastra Connector
- Genkit Connector
- CopilotKit Connector

---

## Execution Steps

### On Dev Server (192.168.70.105):

```bash
# 1. Connect
ssh user@192.168.70.105
cd ~/BonkLM

# 2. Setup environment (if first time)
bash team/qa/setup-dev-env.sh

# 3. Configure API keys
cp team/qa/.env.connector-test.template team/qa/.env.connector-test
nano team/qa/.env.connector-test  # Add your API keys

# 4. Start vector databases
docker-compose -f team/qa/docker-compose.vector-db.yml up -d

# 5. Start Ollama (optional, for ollama-connector)
curl -fsSL https://ollama.com/install.sh | sh
ollama serve &
ollama pull llama2

# 6. Run all connector tests
source team/qa/.env.connector-test
bash team/qa/run-all-connector-tests.sh

# 7. Check results
cat team/qa/results/connector-test-results-*.log
```

---

## What Gets Installed

### Docker Containers (left running):
- ChromaDB on port 8000
- Weaviate on port 8080
- Qdrant on port 6333
- Redis on port 6379 (optional, for caching)

### Local Services:
- Ollama with llama2 model

### npm Packages:
- Already installed via `pnpm install`

---

## Post-Test Configuration

**Important for Prompt Injection Lab**: All tools and configurations remain in place:

| Item | Status |
|------|--------|
| Docker containers | Left running |
| Ollama service | Left running |
| Environment variables | Saved in `.env.connector-test` |
| Built packages | In `dist/` folders |
| Test results | Logged to `team/qa/results/` |

---

## Test Results Format

```
========================================
BonkLM Connector Test Suite
Started: 2026-02-18 XX:XX:XX
========================================

Testing: express-middleware
✓ PASSED

Testing: openai-connector
✓ PASSED

...

========================================
Test Summary
========================================
Passed:  X
Failed:  0
Skipped: Y
Total:   Z
========================================
```

---

## Next Steps After Connector Tests

Once all connectors pass connection tests:

1. **Verify services still running**
   ```bash
   docker ps
   curl localhost:8000  # Chroma
   curl localhost:8080  # Weaviate
   curl localhost:6333  # Qdrant
   ```

2. **Proceed to Prompt Injection Lab**
   - Use same environment
   - Run malicious prompts through each connector
   - Validate guardrail detection
   - Measure false positive/negative rates

---

## Files Reference

- **Full Plan**: [connector-integration-test-plan.md](./connector-integration-test-plan.md)
- **Quick Start**: [connector-test-quick-start.md](./connector-test-quick-start.md)
- **Main QA README**: [README.md](./README.md)
