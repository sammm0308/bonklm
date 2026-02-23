# UAT Quick Start Guide

**Dev Server**: 192.168.70.105
**User**: paultinp
**Password**: Lediscet2020

---

## Step 1: Connect to Dev Server

```bash
ssh paultinp@192.168.70.105
# Enter password: Lediscet2020
```

## Step 2: One-Line Setup

Run this single command to set up everything:

```bash
curl -fsSL https://raw.githubusercontent.com/blackunicorn/bonklm/main/team/qa/setup-dev-env.sh | bash
```

Or if the repo is already cloned:

```bash
cd BonkLM && bash team/qa/setup-dev-env.sh
```

## Step 3: Run UAT Tests

```bash
# All tests
npm run uat

# With report
npm run uat -- --report

# Security tests only
npm run uat -- --category security --verbose
```

---

## Manual Setup (If Script Fails)

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install tsx
pnpm add -g tsx

# Install build tools
sudo apt install -y build-essential python3

# Clone and setup
git clone <repo-url> BonkLM
cd BonkLM
pnpm install
pnpm build
```

---

## What Gets Tested

| Category | Tests | Files |
|----------|-------|-------|
| Core Validators | 12 | `packages/core/src/validators/` |
| Framework Connectors | 4 | `packages/*-middleware/`, `packages/*-plugin/` |
| LLM Connectors | 5 | `packages/openai-connector/`, `packages/anthropic-connector/` |
| Vector DB Connectors | 5 | `packages/*-connector/` (chroma, pinecone, etc.) |
| AI Framework Connectors | 7 | `packages/langchain-connector/`, etc. |

---

## Expected Output

```
UAT Test Suite for @blackunicorn/bonklm
================================================

Running UAT tests...

[SECURITY] UAT-SEC-001: Direct Prompt Injection Attacks ... PASSED
[SECURITY] UAT-SEC-002: Jailbreak Pattern Detection ... PASSED
...

Summary
========
Total Tests:    47
Passed:         47
Failed:         0
Pass Rate:      100.0%

Duration:       2.3s

✓ All tests passed!
```

---

## If Tests Fail

1. Check Node.js version: `node -v` (must be 18+)
2. Rebuild: `pnpm build`
3. Clean install: `rm -rf node_modules && pnpm install`
4. Check logs in `team/uat/reports/`

---

## Documents Created

- `team/qa/uat-plan.md` - Full UAT plan with all test cases
- `team/qa/uat-checklist.md` - Quick reference checklist
- `team/qa/setup-dev-env.sh` - Automated setup script
