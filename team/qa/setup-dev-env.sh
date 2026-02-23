#!/bin/bash
# UAT Environment Setup Script for @blackunicorn/llm-guardrails
# Run on dev server: 192.168.70.105

set -e

echo "========================================="
echo "LLM Guardrails UAT Environment Setup"
echo "========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}Don't run as root${NC}"
    exit 1
fi

# 1. Check Node.js version
echo ""
echo "Step 1: Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js not found. Installing...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}Node.js $NODE_VERSION installed${NC}"
    # Check if version is 18+
    MAJOR_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        echo -e "${RED}Node.js must be version 18 or higher${NC}"
        exit 1
    fi
fi

# 2. Check pnpm
echo ""
echo "Step 2: Checking pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}pnpm not found. Installing...${NC}"
    npm install -g pnpm
else
    echo -e "${GREEN}pnpm $(pnpm -v) installed${NC}"
fi

# 3. Install build tools
echo ""
echo "Step 3: Installing build tools..."
sudo apt install -y build-essential python3 git curl > /dev/null 2>&1
echo -e "${GREEN}Build tools installed${NC}"

# 4. Install tsx for running TypeScript
echo ""
echo "Step 4: Installing tsx..."
pnpm add -g tsx 2>/dev/null || npm install -g tsx
echo -e "${GREEN}tsx installed${NC}"

# 5. Navigate to project directory
echo ""
echo "Step 5: Setting up project..."
if [ -d "LLM-Guardrails" ]; then
    cd LLM-Guardrails
    echo -e "${GREEN}In project directory${NC}"
else
    echo -e "${YELLOW}Project directory not found${NC}"
    echo "Please clone the repo first:"
    echo "git clone <repo-url> LLM-Guardrails"
    exit 1
fi

# 6. Install dependencies
echo ""
echo "Step 6: Installing dependencies..."
pnpm install
echo -e "${GREEN}Dependencies installed${NC}"

# 7. Build packages
echo ""
echo "Step 7: Building packages..."
pnpm build
echo -e "${GREEN}Packages built${NC}"

# 8. Check if .env exists, create template if not
echo ""
echo "Step 8: Environment configuration..."
if [ ! -f .env ]; then
    cat > .env << 'EOF'
# LLM Guardrails UAT Environment

# Core
NODE_ENV=development

# OpenAI (for OpenAI connector testing)
OPENAI_API_KEY=sk-test-placeholder

# Anthropic (for Anthropic connector testing)
ANTHROPIC_API_KEY=sk-ant-test-placeholder

# Vector DBs (optional - for connector testing)
PINECONE_API_KEY=placeholder
QDRANT_URL=http://localhost:6333
WEAVIATE_URL=http://localhost:8080
CHROMA_HOST=localhost
CHROMA_PORT=8000

# HuggingFace (optional)
HUGGINGFACE_API_KEY=placeholder
EOF
    echo -e "${YELLOW}.env file created. Please update with real API keys for connector testing${NC}"
else
    echo -e "${GREEN}.env file exists${NC}"
fi

# 9. Run core tests
echo ""
echo "Step 9: Running core tests..."
pnpm test --workspace=packages/core || echo -e "${YELLOW}Some tests may need API keys to pass${NC}"

# 10. Run UAT suite
echo ""
echo "Step 10: UAT Suite Check..."
if [ -f "package.json" ] && grep -q "uat" package.json; then
    echo -e "${GREEN}UAT script available. Run with: npm run uat${NC}"
else
    echo -e "${YELLOW}UAT script not found in package.json${NC}"
fi

# Summary
echo ""
echo "========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "========================================="
echo ""
echo "Available commands:"
echo "  pnpm test              - Run unit tests"
echo "  npm run uat            - Run UAT suite"
echo "  npm run uat -- --help  - UAT options"
echo "  pnpm build             - Build packages"
echo ""
echo "Test categories:"
echo "  npm run uat -- --category core"
echo "  npm run uat -- --category security"
echo "  npm run uat -- --category performance"
echo ""
echo "For full UAT plan, see: team/qa/uat-plan.md"
