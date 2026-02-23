# Connector Integration Test Plan

> **Target Environment**: 192.168.70.105 (Dev Server)
> **Product**: `@blackunicorn/bonklm`
> **Purpose**: Real-world connector testing before Prompt Injection Lab validation
> **Date Created**: 2026-02-18

---

## INDEX

| Section | Description |
|---------|-------------|
| [1.0](#10-overview) | Plan overview and objectives |
| [2.0](#20-environment-setup) | Dev server preparation |
| [3.0](#30-connector-categories) | All 19 connectors grouped by type |
| [4.0](#40-connection-tests) | Per-connector test procedures |
| [5.0](#50-configuration-files) | Config to leave in place |
| [6.0](#60-prompt-injection-lab-prep) | Setup for next phase |

---

## 1.0 Overview

### 1.1 Objectives

1. **Verify Connection**: Each connector can successfully connect to its destination service
2. **Validate Authentication**: API keys, tokens, and credentials work correctly
3. **Test Basic Operations**: Simple read/validate operations through each connector
4. **Leave Configuration**: All tools and configs remain installed for Prompt Injection Lab testing
5. **Document Results**: Record connection status for each connector

### 1.2 Connector Summary (19 Total)

| Category | Connectors | External Services Required |
|----------|-----------|---------------------------|
| **Web Frameworks** | Express, Fastify, NestJS | Local Node.js apps only |
| **LLM Providers** | OpenAI, Anthropic, Ollama | API keys + Ollama local |
| **AI Frameworks** | Vercel AI, LangChain, MCP | Local installations |
| **Vector DBs** | Pinecone, Chroma, Weaviate, Qdrant | Docker/local servers |
| **RAG Frameworks** | LlamaIndex, HuggingFace | API + local install |
| **Emerging** | Mastra, Genkit, CopilotKit | Local installations |

### 1.3 Test Environment

- **Server**: 192.168.70.105
- **OS**: Linux (Ubuntu/Debian)
- **Node.js**: 18+ required
- **Package Manager**: pnpm (workspace)

---

## 2.0 Environment Setup

### 2.1 Initial Server Connection

```bash
# SSH to dev server
ssh user@192.168.70.105

# Navigate to project
cd ~/BonkLM  # or wherever repo is cloned
```

### 2.2 Base Dependencies

```bash
# Run existing setup script
bash team/qa/setup-dev-env.sh

# Or manual setup:
sudo apt update
sudo apt install -y build-essential python3 git curl docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group (logout/login required)
sudo usermod -aG docker $USER
```

### 2.3 Verify Node.js and pnpm

```bash
node --version  # Should be 18+
pnpm --version  # Should be 8+
pnpm install
pnpm build
```

---

## 3.0 Connector Categories

### 3.1 Category 1: Web Framework Connectors (3)

**No external services required** - These are Node.js middleware/plugins.

| Connector | Package | Test Method |
|-----------|---------|-------------|
| Express | `@blackunicorn/bonklm-express` | Start test server, send request |
| Fastify | `@blackunicorn/bonklm-fastify` | Start test server, send request |
| NestJS | `@blackunicorn/bonklm-nestjs` | Start test module, call endpoint |

### 3.2 Category 2: LLM Provider Connectors (3)

| Connector | Package | Requirements | Setup Steps |
|-----------|---------|--------------|-------------|
| OpenAI | `@blackunicorn/bonklm-openai` | OpenAI API key | Set `OPENAI_API_KEY` |
| Anthropic | `@blackunicorn/bonklm-anthropic` | Anthropic API key | Set `ANTHROPIC_API_KEY` |
| Ollama | `@blackunicorn/bonklm-ollama` | Ollama server | Install & run Ollama |

### 3.3 Category 3: AI Framework Connectors (3)

| Connector | Package | Requirements | Setup Steps |
|-----------|---------|--------------|-------------|
| Vercel AI | `@blackunicorn/bonklm-vercel` | ai package | Installed via npm |
| LangChain | `@blackunicorn/bonklm-langchain` | @langchain/core | Installed via npm |
| MCP | `@blackunicorn/bonklm-mcp` | @modelcontextprotocol/sdk | Installed via npm |

### 3.4 Category 4: Vector Database Connectors (4)

| Connector | Package | Requirements | Setup Steps |
|-----------|---------|--------------|-------------|
| Pinecone | `@blackunicorn/bonklm-pinecone` | Pinecone API key | Set `PINECONE_API_KEY` |
| ChromaDB | `@blackunicorn/bonklm-chroma` | Chroma server | Docker or local |
| Weaviate | `@blackunicorn/bonklm-weaviate` | Weaviate server | Docker or local |
| Qdrant | `@blackunicorn/bonklm-qdrant` | Qdrant server | Docker or local |

### 3.5 Category 5: RAG & Emerging Connectors (6)

| Connector | Package | Requirements | Setup Steps |
|-----------|---------|--------------|-------------|
| LlamaIndex | `@blackunicorn/bonklm-llamaindex` | llamaindex package | Installed via npm |
| HuggingFace | `@blackunicorn/bonklm-huggingface` | HF API token | Set `HUGGINGFACE_API_KEY` |
| Mastra | `@blackunicorn/bonklm-mastra` | @mastra/core | Installed via npm |
| Genkit | `@blackunicorn/bonklm-genkit` | genkit package | Installed via npm |
| CopilotKit | `@blackunicorn/bonklm-copilotkit` | @copilotkit/react-core | Installed via npm |

---

## 4.0 Connection Tests

### 4.1 Test Script Template

Create `team/qa/test-connector.sh`:

```bash
#!/bin/bash
# Connector Connection Test Script

CONNECTOR=$1
TEST_TYPE=${2:-connection}

case $CONNECTOR in
  "express")
    echo "Testing Express Connector..."
    tsx packages/express-middleware/tests/integration/connection.test.ts
    ;;
  "fastify")
    echo "Testing Fastify Connector..."
    tsx packages/fastify-plugin/tests/integration/connection.test.ts
    ;;
  # ... etc
esac
```

### 4.2 Web Framework Tests

```bash
# Express
cd packages/express-middleware
pnpm test:connection
# Expected: Test server starts, middleware validates

# Fastify
cd packages/fastify-plugin
pnpm test:connection
# Expected: Plugin registers, route validates

# NestJS
cd packages/nestjs-module
pnpm test:connection
# Expected: Module imports, guard works
```

### 4.3 LLM Provider Tests

#### OpenAI
```bash
export OPENAI_API_KEY="sk-..."
cd packages/openai-connector
pnpm test:connection
# Expected: Connects to OpenAI API, validates prompt
```

#### Anthropic
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
cd packages/anthropic-connector
pnpm test:connection
# Expected: Connects to Anthropic API, validates prompt
```

#### Ollama
```bash
# Install Ollama first
curl -fsSL https://ollama.com/install.sh | sh
ollama serve &
ollama pull llama2

cd packages/ollama-connector
pnpm test:connection
# Expected: Connects to local Ollama, validates through model
```

### 4.4 Vector Database Tests

#### Docker Compose for Vector DBs
Create `team/qa/docker-compose.vector-db.yml`:

```yaml
version: '3.8'
services:
  chroma:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"

  weaviate:
    image: semitechnologies/weaviate:latest
    ports:
      - "8080:8080"
    environment:
      QUERY_DEFAULTS_LIMIT: 25

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
```

Start vector DBs:
```bash
docker-compose -f team/qa/docker-compose.vector-db.yml up -d
```

#### ChromaDB
```bash
cd packages/chroma-connector
pnpm test:connection
# Expected: Connects to localhost:8000
```

#### Weaviate
```bash
cd packages/weaviate-connector
pnpm test:connection
# Expected: Connects to localhost:8080
```

#### Qdrant
```bash
cd packages/qdrant-connector
pnpm test:connection
# Expected: Connects to localhost:6333
```

#### Pinecone
```bash
export PINECONE_API_KEY="..."
cd packages/pinecone-connector
pnpm test:connection
# Expected: Connects to Pinecone cloud
```

### 4.5 Framework Connector Tests

```bash
# Vercel AI
cd packages/vercel-connector
pnpm test:connection

# LangChain
cd packages/langchain-connector
pnpm test:connection

# MCP
cd packages/mcp-connector
pnpm test:connection

# LlamaIndex
cd packages/llamaindex-connector
pnpm test:connection

# HuggingFace
export HUGGINGFACE_API_KEY="..."
cd packages/huggingface-connector
pnpm test:connection

# Mastra
cd packages/mastra-connector
pnpm test:connection

# Genkit
cd packages/genkit-connector
pnpm test:connection

# CopilotKit
cd packages/copilotkit-connector
pnpm test:connection
```

---

## 5.0 Configuration Files

### 5.1 Environment Variables Template

Create `team/qa/.env.connector-test`:

```bash
# BonkLM Connector Testing Environment
# Source this file before running connector tests: source team/qa/.env.connector-test

# ============== LLM Providers ==============
export OPENAI_API_KEY="sk-your-openai-key-here"
export ANTHROPIC_API_KEY="sk-ant-your-anthropic-key-here"

# ============== Vector Databases ==============
export PINECONE_API_KEY="your-pinecone-key"
export PINECONE_ENVIRONMENT="production"
export PINECONE_INDEX="test-index"

# ============== HuggingFace ==============
export HUGGINGFACE_API_KEY="hf-your-huggingface-key"

# ============== Vector DB URLs ==============
export QDRANT_URL="http://localhost:6333"
export QDRANT_API_KEY=""  # Leave empty for local dev

export WEAVIATE_URL="http://localhost:8080"

export CHROMA_HOST="localhost"
export CHROMA_PORT="8000"

# ============== Ollama ==============
export OLLAMA_HOST="http://localhost:11434"

# ============== Node Environment ==============
export NODE_ENV="development"
export LOG_LEVEL="debug"
```

### 5.2 Test Runner Script

Create `team/qa/run-all-connector-tests.sh`:

```bash
#!/bin/bash
# Run all connector connection tests
# Usage: bash team/qa/run-all-connector-tests.sh

set -e

source team/qa/.env.connector-test

RESULTS_FILE="team/qa/connector-test-results-$(date +%Y%m%d-%H%M%S).log"

echo "========================================" | tee -a $RESULTS_FILE
echo "BonkLM Connector Test Suite" | tee -a $RESULTS_FILE
echo "Started: $(date)" | tee -a $RESULTS_FILE
echo "========================================" | tee -a $RESULTS_FILE

# Array of connectors
CONNECTORS=(
  "express-middleware"
  "fastify-plugin"
  "nestjs-module"
  "openai-connector"
  "anthropic-connector"
  "ollama-connector"
  "vercel-connector"
  "langchain-connector"
  "mcp-connector"
  "pinecone-connector"
  "chroma-connector"
  "weaviate-connector"
  "qdrant-connector"
  "llamaindex-connector"
  "huggingface-connector"
  "mastra-connector"
  "genkit-connector"
  "copilotkit-connector"
)

PASSED=0
FAILED=0
SKIPPED=0

for connector in "${CONNECTORS[@]}"; do
  echo "" | tee -a $RESULTS_FILE
  echo "Testing: $connector" | tee -a $RESULTS_FILE
  echo "----------------------------------------" | tee -a $RESULTS_FILE

  if [ -d "packages/$connector" ]; then
    cd packages/$connector

    if [ -f "tests/connection.test.ts" ]; then
      if pnpm test tests/connection.test.ts 2>&1 | tee -a ../../$RESULTS_FILE; then
        echo "✓ PASSED" | tee -a ../../$RESULTS_FILE
        ((PASSED++))
      else
        echo "✗ FAILED" | tee -a ../../$RESULTS_FILE
        ((FAILED++))
      fi
    else
      echo "⊘ SKIPPED (no connection test)" | tee -a ../../$RESULTS_FILE
      ((SKIPPED++))
    fi

    cd ../..
  else
    echo "⊘ SKIPPED (directory not found)" | tee -a $RESULTS_FILE
    ((SKIPPED++))
  fi
done

echo "" | tee -a $RESULTS_FILE
echo "========================================" | tee -a $RESULTS_FILE
echo "Test Summary" | tee -a $RESULTS_FILE
echo "========================================" | tee -a $RESULTS_FILE
echo "Passed:  $PASSED" | tee -a $RESULTS_FILE
echo "Failed:  $FAILED" | tee -a $RESULTS_FILE
echo "Skipped: $SKIPPED" | tee -a $RESULTS_FILE
echo "Total:   $((PASSED + FAILED + SKIPPED))" | tee -a $RESULTS_FILE
echo "Finished: $(date)" | tee -a $RESULTS_FILE
echo "========================================" | tee -a $RESULTS_FILE
```

---

## 6.0 Prompt Injection Lab Preparation

### 6.1 What to Leave Installed

After connector testing, keep these in place:

1. **Docker containers** for vector DBs (running)
2. **Ollama** service with models pulled
3. **All npm packages** installed
4. **Environment variables** configured
5. **Built packages** in `dist/` folders

### 6.2 Pre-Lab Checklist

- [ ] All vector DB Docker containers running
- [ ] Ollama service running with llama2 model
- [ ] API keys configured in `.env.connector-test`
- [ ] All packages built (`pnpm build`)
- [ ] Core tests passing (`pnpm test --workspace=packages/core`)
- [ ] Connection test results logged

### 6.3 Next Phase: Prompt Injection Tests

After connector tests pass, the Prompt Injection Lab will:

1. Send malicious prompts through each connector
2. Validate guardrail detection works
3. Measure false positive/negative rates
4. Test streaming validation
5. Verify production mode behavior

---

## 7.0 Troubleshooting

### 7.1 Common Issues

| Issue | Solution |
|-------|----------|
| Docker permission denied | `sudo usermod -aG docker $USER` then logout/login |
| pnpm install fails | Delete `node_modules` and `pnpm-lock.yaml`, retry |
| Ollama connection refused | Run `ollama serve` in background |
| Vector DB timeouts | Check Docker containers: `docker ps` |
| API key errors | Verify keys in `.env.connector-test` |

### 7.2 Diagnostic Commands

```bash
# Check all services
docker ps                    # Docker containers
ps aux | grep ollama        # Ollama process
curl localhost:8000         # ChromaDB
curl localhost:8080         # Weaviate
curl localhost:6333         # Qdrant
curl localhost:11434        # Ollama

# Rebuild if needed
pnpm build --force
```

---

## 8.0 Execution Order

1. **Setup Phase** (Run once):
   - SSH to 192.168.70.105
   - Run `team/qa/setup-dev-env.sh`
   - Configure `.env.connector-test` with API keys
   - Start Docker services

2. **Test Phase** (Run full suite):
   - `bash team/qa/run-all-connector-tests.sh`
   - Review results in generated log file

3. **Individual Test Phase** (If failures):
   - Run specific connector tests
   - Debug connection issues
   - Re-run until all pass

4. **Pre-Lab Phase** (Final preparation):
   - Verify all services still running
   - Confirm all connector tests pass
   - Leave environment as-is for Prompt Injection Lab

---

## Appendix A: Connector Status Matrix

| Connector | External Service | API Key Required | Local Service | Test Script | Status |
|-----------|------------------|------------------|---------------|-------------|--------|
| express-middleware | None | No | No | `tests/connection.test.ts` | ⬜ Pending |
| fastify-plugin | None | No | No | `tests/connection.test.ts` | ⬜ Pending |
| nestjs-module | None | No | No | `tests/connection.test.ts` | ⬜ Pending |
| openai-connector | OpenAI API | Yes | No | `tests/connection.test.ts` | ⬜ Pending |
| anthropic-connector | Anthropic API | Yes | No | `tests/connection.test.ts` | ⬜ Pending |
| ollama-connector | Ollama | No | Yes | `tests/connection.test.ts` | ⬜ Pending |
| vercel-connector | None | No | No | `tests/connection.test.ts` | ⬜ Pending |
| langchain-connector | None | No | No | `tests/connection.test.ts` | ⬜ Pending |
| mcp-connector | None | No | No | `tests/connection.test.ts` | ⬜ Pending |
| pinecone-connector | Pinecone | Yes | No | `tests/connection.test.ts` | ⬜ Pending |
| chroma-connector | ChromaDB | No | Yes | `tests/connection.test.ts` | ⬜ Pending |
| weaviate-connector | Weaviate | No | Yes | `tests/connection.test.ts` | ⬜ Pending |
| qdrant-connector | Qdrant | No | Yes | `tests/connection.test.ts` | ⬜ Pending |
| llamaindex-connector | None | No | No | `tests/connection.test.ts` | ⬜ Pending |
| huggingface-connector | HuggingFace | Yes | No | `tests/connection.test.ts` | ⬜ Pending |
| mastra-connector | None | No | No | `tests/connection.test.ts` | ⬜ Pending |
| genkit-connector | None | No | No | `tests/connection.test.ts` | ⬜ Pending |
| copilotkit-connector | None | No | No | `tests/connection.test.ts` | ⬜ Pending |

**Legend: ⬜ Pending | ✅ Passed | ❌ Failed | ⚠️ Skipped**
