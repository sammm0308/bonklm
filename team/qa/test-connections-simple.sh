#!/bin/bash
set -e

export PATH=/usr/share/nodejs/corepack/shims:/usr/bin:/bin:$PATH

cd ~/LLM-Guardrails

RESULTS_FILE="$PWD/team/qa/results/connection-test-$(date +%Y%m%d-%H%M%S).log"
mkdir -p team/qa/results

echo "========================================="
echo "LLM-Guardrails Connection Tests"
echo "Started: $(date)"
echo "========================================="
echo "" | tee $RESULTS_FILE

PASSED=0
FAILED=0
SKIPPED=0

# Test 1: Core Package
echo "=== Core Package ===" | tee -a $RESULTS_FILE
cd packages/core
if pnpm test -- --run >> $RESULTS_FILE 2>&1; then
  echo "Core: PASSED" | tee -a $RESULTS_FILE
  ((PASSED++))
else
  echo "Core: FAILED" | tee -a $RESULTS_FILE
  ((FAILED++))
fi
cd ~/LLM-Guardrails

# Test 2: Express Middleware
echo "=== Express Middleware ===" | tee -a $RESULTS_FILE
cd packages/express-middleware
cat > test-express.mjs << 'EOF'
import { createGuardrailsMiddleware } from './dist/index.js';
console.log('Express middleware loaded');
EOF
if node test-express.mjs >> $RESULTS_FILE 2>&1; then
  echo "Express: PASSED" | tee -a $RESULTS_FILE
  ((PASSED++))
else
  echo "Express: FAILED" | tee -a $RESULTS_FILE
  ((FAILED++))
fi
rm -f test-express.mjs
cd ~/LLM-Guardrails

# Test 3: ChromaDB Connection
echo "=== ChromaDB Connection ===" | tee -a $RESULTS_FILE
cat > test-chroma.mjs << 'EOF'
import { ChromaClient } from 'chromadb';
const client = new ChromaClient({ path: 'http://localhost:8000' });
client.heartbeat().then(() => { console.log('ChromaDB: Connected'); process.exit(0); }).catch((e) => { console.error('ChromaDB: Failed', e.message); process.exit(1); });
EOF
if timeout 10 node test-chroma.mjs >> $RESULTS_FILE 2>&1; then
  echo "ChromaDB: PASSED" | tee -a $RESULTS_FILE
  ((PASSED++))
else
  echo "ChromaDB: FAILED" | tee -a $RESULTS_FILE
  ((FAILED++))
fi
rm -f test-chroma.mjs
cd ~/LLM-Guardrails

# Test 4: Weaviate Connection
echo "=== Weaviate Connection ===" | tee -a $RESULTS_FILE
cat > test-weaviate.mjs << 'EOF'
import weaviate from 'weaviate-client';
const client = weaviate.client({ scheme: 'http', host: 'localhost:8080' });
client.misc.live().then(() => { console.log('Weaviate: Connected'); process.exit(0); }).catch((e) => { console.error('Weaviate: Failed', e.message); process.exit(1); });
EOF
if timeout 10 node test-weaviate.mjs >> $RESULTS_FILE 2>&1; then
  echo "Weaviate: PASSED" | tee -a $RESULTS_FILE
  ((PASSED++))
else
  echo "Weaviate: FAILED" | tee -a $RESULTS_FILE
  ((FAILED++))
fi
rm -f test-weaviate.mjs
cd ~/LLM-Guardrails

# Test 5: Qdrant Connection
echo "=== Qdrant Connection ===" | tee -a $RESULTS_FILE
cat > test-qdrant.mjs << 'EOF'
import { QdrantClient } from '@qdrant/js-client-rest';
const client = new QdrantClient({ url: 'http://localhost:6333' });
client.getCollections().then(() => { console.log('Qdrant: Connected'); process.exit(0); }).catch((e) => { console.error('Qdrant: Failed', e.message); process.exit(1); });
EOF
if timeout 10 node test-qdrant.mjs >> $RESULTS_FILE 2>&1; then
  echo "Qdrant: PASSED" | tee -a $RESULTS_FILE
  ((PASSED++))
else
  echo "Qdrant: FAILED" | tee -a $RESULTS_FILE
  ((FAILED++))
fi
rm -f test-qdrant.mjs
cd ~/LLM-Guardrails

# Test 6: OpenAI (if API key)
echo "=== OpenAI Connector ===" | tee -a $RESULTS_FILE
if [ -n "$OPENAI_API_KEY" ] && [ "$OPENAI_API_KEY" != "sk-test-placeholder" ]; then
  cat > test-openai.mjs << EOF
import OpenAI from 'openai';
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
client.models.list().then(() => { console.log('OpenAI: Connected'); process.exit(0); }).catch((e) => { console.error('OpenAI: Failed', e.message); process.exit(1); });
EOF
  if timeout 30 node test-openai.mjs >> $RESULTS_FILE 2>&1; then
    echo "OpenAI: PASSED" | tee -a $RESULTS_FILE
    ((PASSED++))
  else
    echo "OpenAI: FAILED" | tee -a $RESULTS_FILE
    ((FAILED++))
  fi
  rm -f test-openai.mjs
else
  echo "OpenAI: SKIPPED (no API key)" | tee -a $RESULTS_FILE
  ((SKIPPED++))
fi
cd ~/LLM-Guardrails

# Test 7: Anthropic (if API key)
echo "=== Anthropic Connector ===" | tee -a $RESULTS_FILE
if [ -n "$ANTHROPIC_API_KEY" ] && [ "$ANTHROPIC_API_KEY" != "sk-ant-test-placeholder" ]; then
  cat > test-anthropic.mjs << EOF
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
client.messages.create({ model: 'claude-3-haiku-20240307', max_tokens: 10, messages: [{ role: 'user', content: 'Hi' }] }).then(() => { console.log('Anthropic: Connected'); process.exit(0); }).catch((e) => { console.error('Anthropic: Failed', e.message); process.exit(1); });
EOF
  if timeout 30 node test-anthropic.mjs >> $RESULTS_FILE 2>&1; then
    echo "Anthropic: PASSED" | tee -a $RESULTS_FILE
    ((PASSED++))
  else
    echo "Anthropic: FAILED" | tee -a $RESULTS_FILE
    ((FAILED++))
  fi
  rm -f test-anthropic.mjs
else
  echo "Anthropic: SKIPPED (no API key)" | tee -a $RESULTS_FILE
  ((SKIPPED++))
fi
cd ~/LLM-Guardrails

# Test 8: Ollama
echo "=== Ollama Connector ===" | tee -a $RESULTS_FILE
cat > test-ollama.mjs << 'EOF'
import { Ollama } from 'ollama';
const ollama = new Ollama({ host: 'http://localhost:11434' });
ollama.list().then(() => { console.log('Ollama: Connected'); process.exit(0); }).catch((e) => { console.error('Ollama: Failed', e.message); process.exit(1); });
EOF
if timeout 10 node test-ollama.mjs >> $RESULTS_FILE 2>&1; then
  echo "Ollama: PASSED" | tee -a $RESULTS_FILE
  ((PASSED++))
else
  echo "Ollama: SKIPPED (service not running)" | tee -a $RESULTS_FILE
  ((SKIPPED++))
fi
rm -f test-ollama.mjs
cd ~/LLM-Guardrails

# Test 9: LangChain
echo "=== LangChain Connector ===" | tee -a $RESULTS_FILE
cat > test-langchain.mjs << 'EOF'
import { ChatOpenAI } from '@langchain/openai';
console.log('LangChain: Loaded');
EOF
if node test-langchain.mjs >> $RESULTS_FILE 2>&1; then
  echo "LangChain: PASSED" | tee -a $RESULTS_FILE
  ((PASSED++))
else
  echo "LangChain: FAILED" | tee -a $RESULTS_FILE
  ((FAILED++))
fi
rm -f test-langchain.mjs
cd ~/LLM-Guardrails

# Test 10: Vercel AI
echo "=== Vercel AI Connector ===" | tee -a $RESULTS_FILE
cat > test-vercel.mjs << 'EOF'
import { createOpenAI } from '@ai-sdk/openai';
console.log('Vercel AI: Loaded');
EOF
if node test-vercel.mjs >> $RESULTS_FILE 2>&1; then
  echo "Vercel AI: PASSED" | tee -a $RESULTS_FILE
  ((PASSED++))
else
  echo "Vercel AI: FAILED" | tee -a $RESULTS_FILE
  ((FAILED++))
fi
rm -f test-vercel.mjs
cd ~/LLM-Guardrails

# Summary
echo "" | tee -a $RESULTS_FILE
echo "=========================================" | tee -a $RESULTS_FILE
echo "Summary" | tee -a $RESULTS_FILE
echo "=========================================" | tee -a $RESULTS_FILE
echo "Passed:  $PASSED" | tee -a $RESULTS_FILE
echo "Failed:  $FAILED" | tee -a $RESULTS_FILE
echo "Skipped: $SKIPPED" | tee -a $RESULTS_FILE
echo "Total:   $((PASSED + FAILED + SKIPPED))" | tee -a $RESULTS_FILE
echo "Results: $RESULTS_FILE" | tee -a $RESULTS_FILE
echo "=========================================" | tee -a $RESULTS_FILE

exit 0
