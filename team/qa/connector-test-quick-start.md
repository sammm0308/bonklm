# Connector Testing - Quick Start Guide

> **For execution on dev server**: 192.168.70.105

## Prerequisites Checklist

Before starting, ensure you have:
- [ ] SSH access to 192.168.70.105
- [ ] API keys for OpenAI, Anthropic, Pinecone, HuggingFace (optional for basic tests)
- [ ] Docker installed on dev server
- [ ] Repository cloned on dev server

---

## Step-by-Step Execution

### Step 1: Connect to Dev Server

```bash
ssh user@192.168.70.105
cd ~/BonkLM
```

### Step 2: Run Environment Setup

```bash
bash team/qa/setup-dev-env.sh
```

This installs Node.js, pnpm, build tools, and builds packages.

### Step 3: Configure API Keys (Optional but Recommended)

```bash
# Copy the template
cp team/qa/.env.connector-test.template team/qa/.env.connector-test

# Edit with your API keys
nano team/qa/.env.connector-test
```

Add your real API keys for:
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `PINECONE_API_KEY`
- `HUGGINGFACE_API_KEY`

### Step 4: Start Vector Database Services

```bash
docker-compose -f team/qa/docker-compose.vector-db.yml up -d
```

Verify services are running:
```bash
docker ps
```

Expected containers:
- `llmguardrails-chroma` on port 8000
- `llmguardrails-weaviate` on port 8080
- `llmguardrails-qdrant` on port 6333

### Step 5: Install and Start Ollama (Optional)

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama in background
ollama serve &

# Pull a model
ollama pull llama2
```

### Step 6: Load Environment Variables

```bash
source team/qa/.env.connector-test
```

### Step 7: Run All Connector Tests

```bash
bash team/qa/run-all-connector-tests.sh
```

Or skip API-requiring tests:
```bash
bash team/qa/run-all-connector-tests.sh --skip-api-tests
```

### Step 8: Review Results

Results are saved to:
```
team/qa/results/connector-test-results-YYYYMMDD-HHMMSS.log
```

---

## Individual Connector Testing

To test a specific connector:

```bash
cd packages/<connector-name>
pnpm test
```

Example:
```bash
cd packages/openai-connector
source ../../team/qa/.env.connector-test
pnpm test
```

---

## Service Status Commands

```bash
# Check Docker containers
docker ps

# Check specific services
curl localhost:8000  # ChromaDB
curl localhost:8080  # Weaviate
curl localhost:6333  # Qdrant
curl localhost:11434 # Ollama

# View Docker logs
docker-compose -f team/qa/docker-compose.vector-db.yml logs

# Stop all services
docker-compose -f team/qa/docker-compose.vector-db.yml down
```

---

## Troubleshooting

### Issue: Docker permission denied

```bash
sudo usermod -aG docker $USER
# Logout and login again
```

### Issue: Tests fail with connection errors

```bash
# Verify services are running
docker ps

# Restart services
docker-compose -f team/qa/docker-compose.vector-db.yml restart
```

### Issue: API key errors

```bash
# Verify keys are set
echo $OPENAI_API_KEY
echo $ANTHROPIC_API_KEY

# Reload environment
source team/qa/.env.connector-test
```

### Issue: Ollama not responding

```bash
# Kill existing Ollama and restart
pkill ollama
ollama serve &
```

---

## After Testing: Prompt Injection Lab Prep

**IMPORTANT**: Leave everything running after tests complete!

The Prompt Injection Lab will use:
1. Running Docker containers (vector DBs)
2. Ollama service with models
3. Configured environment variables
4. Built packages

**DO NOT**:
- Stop Docker containers
- Kill Ollama service
- Delete `.env.connector-test`
- Clean `node_modules` or `dist` folders

---

## Test Categories Matrix

| Connector | External Service | API Key | Local Service | Command |
|-----------|------------------|---------|---------------|---------|
| Express | None | ✗ | ✗ | `cd packages/express-middleware && pnpm test` |
| Fastify | None | ✗ | ✗ | `cd packages/fastify-plugin && pnpm test` |
| NestJS | None | ✗ | ✗ | `cd packages/nestjs-module && pnpm test` |
| OpenAI | OpenAI API | ✓ | ✗ | `cd packages/openai-connector && pnpm test` |
| Anthropic | Anthropic API | ✓ | ✗ | `cd packages/anthropic-connector && pnpm test` |
| Ollama | Ollama | ✗ | ✓ | `cd packages/ollama-connector && pnpm test` |
| Vercel AI | None | ✗ | ✗ | `cd packages/vercel-connector && pnpm test` |
| LangChain | None | ✗ | ✗ | `cd packages/langchain-connector && pnpm test` |
| MCP | None | ✗ | ✗ | `cd packages/mcp-connector && pnpm test` |
| Pinecone | Pinecone | ✓ | ✗ | `cd packages/pinecone-connector && pnpm test` |
| ChromaDB | ChromaDB | ✗ | ✓ | `cd packages/chroma-connector && pnpm test` |
| Weaviate | Weaviate | ✗ | ✓ | `cd packages/weaviate-connector && pnpm test` |
| Qdrant | Qdrant | ✗ | ✓ | `cd packages/qdrant-connector && pnpm test` |
| LlamaIndex | None | ✗ | ✗ | `cd packages/llamaindex-connector && pnpm test` |
| HuggingFace | HF API | ✓ | ✗ | `cd packages/huggingface-connector && pnpm test` |
| Mastra | None | ✗ | ✗ | `cd packages/mastra-connector && pnpm test` |
| Genkit | None | ✗ | ✗ | `cd packages/genkit-connector && pnpm test` |
| CopilotKit | None | ✗ | ✗ | `cd packages/copilotkit-connector && pnpm test` |

---

## Full Test Script

Copy-paste this complete block:

```bash
# 1. Connect and navigate
cd ~/BonkLM

# 2. Setup environment (if not done)
# bash team/qa/setup-dev-env.sh

# 3. Configure API keys (first time only)
# cp team/qa/.env.connector-test.template team/qa/.env.connector-test
# nano team/qa/.env.connector-test

# 4. Start vector DBs
docker-compose -f team/qa/docker-compose.vector-db.yml up -d

# 5. Start Ollama (if not running)
# pkill ollama; ollama serve &
# ollama pull llama2

# 6. Load environment
source team/qa/.env.connector-test

# 7. Run tests
bash team/qa/run-all-connector-tests.sh

# 8. Check results
ls -la team/qa/results/
cat team/qa/results/connector-test-results-*.log | tail -20
```

---

## Expected Results

When all tests pass, you should see:

```
========================================
Test Summary
========================================
Passed:  X
Failed:  0
Skipped: Y
Total:   Z
========================================

All tests passed! Results saved to: team/qa/results/connector-test-results-...
```

If tests fail, check the log file for specific error messages.

---

## Next: Prompt Injection Lab

Once connector tests pass, proceed to:

1. Verify all services still running
2. Run Prompt Injection Lab tests
3. Document guardrail detection effectiveness
4. Measure false positive/negative rates

Reference: [Connector Integration Test Plan](./connector-integration-test-plan.md)
