#!/bin/bash
# Run all connector connection tests
# Usage: bash team/qa/run-all-connector-tests.sh [--skip-api-tests]
#
# This script tests all LLM-Guardrails connectors for proper connection
# to their destination services. Results are logged with timestamps.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
SKIP_API_TESTS=false
if [[ "$1" == "--skip-api-tests" ]]; then
  SKIP_API_TESTS=true
fi

# Load environment variables if available
if [ -f "team/qa/.env.connector-test" ]; then
  echo -e "${BLUE}Loading environment variables...${NC}"
  source team/qa/.env.connector-test
else
  echo -e "${YELLOW}Warning: .env.connector-test not found. Using defaults.${NC}"
  echo -e "${YELLOW}Copy team/qa/.env.connector-test.template to .env.connector-test and add API keys.${NC}"
fi

# Create results directory
mkdir -p team/qa/results

# Results file with timestamp
RESULTS_FILE="team/qa/results/connector-test-results-$(date +%Y%m%d-%H%M%S).log"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}LLM-Guardrails Connector Test Suite${NC}"
echo -e "${BLUE}Started: $(date)${NC}"
echo -e "${BLUE}========================================${NC}"
echo "" | tee -a $RESULTS_FILE

# Write header to results file
{
  echo "========================================"
  echo "LLM-Guardrails Connector Test Suite"
  echo "Started: $(date)"
  echo "========================================"
  echo ""
} >> $RESULTS_FILE

# Array of all connectors with metadata
# Format: "connector_name:requires_api_key:requires_local_service"
declare -A CONNECTORS=(
  ["express-middleware"]="false:false"
  ["fastify-plugin"]="false:false"
  ["nestjs-module"]="false:false"
  ["openai-connector"]="true:false"
  ["anthropic-connector"]="true:false"
  ["ollama-connector"]="false:true"
  ["vercel-connector"]="false:false"
  ["langchain-connector"]="false:false"
  ["mcp-connector"]="false:false"
  ["pinecone-connector"]="true:false"
  ["chroma-connector"]="false:true"
  ["weaviate-connector"]="false:true"
  ["qdrant-connector"]="false:true"
  ["llamaindex-connector"]="false:false"
  ["huggingface-connector"]="true:false"
  ["mastra-connector"]="false:false"
  ["genkit-connector"]="false:false"
  ["copilotkit-connector"]="false:false"
)

# Counters
PASSED=0
FAILED=0
SKIPPED=0

# Function to test a connector
test_connector() {
  local connector=$1
  local requires_api=$2
  local requires_service=$3
  local skip_reason=""

  echo -e "\n${BLUE}Testing: $connector${NC}"
  echo "----------------------------------------" | tee -a $RESULTS_FILE
  echo "Testing: $connector" >> $RESULTS_FILE

  # Check if connector directory exists
  if [ ! -d "packages/$connector" ]; then
    echo -e "${YELLOW}⊘ SKIPPED (directory not found)${NC}"
    echo "SKIPPED: Directory not found" >> $RESULTS_FILE
    ((SKIPPED++))
    return 0
  fi

  # Skip API tests if flag is set
  if [ "$SKIP_API_TESTS" = true ] && [ "$requires_api" = "true" ]; then
    skip_reason="API tests skipped by flag"
  fi

  # Check if API key is available for connectors that need it
  if [ "$requires_api" = "true" ] && [ -z "$skip_reason" ]; then
    case $connector in
      "openai-connector")
        if [ -z "$OPENAI_API_KEY" ] || [[ "$OPENAI_API_KEY" == *"your-"* ]]; then
          skip_reason="OPENAI_API_KEY not configured"
        fi
        ;;
      "anthropic-connector")
        if [ -z "$ANTHROPIC_API_KEY" ] || [[ "$ANTHROPIC_API_KEY" == *"your-"* ]]; then
          skip_reason="ANTHROPIC_API_KEY not configured"
        fi
        ;;
      "pinecone-connector")
        if [ -z "$PINECONE_API_KEY" ] || [[ "$PINECONE_API_KEY" == *"your-"* ]]; then
          skip_reason="PINECONE_API_KEY not configured"
        fi
        ;;
      "huggingface-connector")
        if [ -z "$HUGGINGFACE_API_KEY" ] || [[ "$HUGGINGFACE_API_KEY" == *"your-"* ]]; then
          skip_reason="HUGGINGFACE_API_KEY not configured"
        fi
        ;;
    esac
  fi

  # Check if local service is running for connectors that need it
  if [ "$requires_service" = "true" ] && [ -z "$skip_reason" ]; then
    case $connector in
      "ollama-connector")
        if ! curl -s http://localhost:11434 > /dev/null 2>&1; then
          skip_reason="Ollama service not running (run: ollama serve)"
        fi
        ;;
      "chroma-connector")
        if ! curl -s http://localhost:8000 > /dev/null 2>&1; then
          skip_reason="ChromaDB not running (run: docker-compose -f team/qa/docker-compose.vector-db.yml up -d)"
        fi
        ;;
      "weaviate-connector")
        if ! curl -s http://localhost:8080 > /dev/null 2>&1; then
          skip_reason="Weaviate not running (run: docker-compose -f team/qa/docker-compose.vector-db.yml up -d)"
        fi
        ;;
      "qdrant-connector")
        if ! curl -s http://localhost:6333 > /dev/null 2>&1; then
          skip_reason="Qdrant not running (run: docker-compose -f team/qa/docker-compose.vector-db.yml up -d)"
        fi
        ;;
    esac
  fi

  # Skip if we have a reason
  if [ -n "$skip_reason" ]; then
    echo -e "${YELLOW}⊘ SKIPPED ($skip_reason)${NC}"
    echo "SKIPPED: $skip_reason" >> $RESULTS_FILE
    ((SKIPPED++))
    return 0
  fi

  # Navigate to connector directory
  cd packages/$connector

  # Check for connection test file
  if [ ! -f "tests/connection.test.ts" ] && [ ! -f "tests/integration/connection.test.ts" ]; then
    cd ../..
    echo -e "${YELLOW}⊘ SKIPPED (no connection test file)${NC}"
    echo "SKIPPED: No connection test file found" >> $RESULTS_FILE
    ((SKIPPED++))
    return 0
  fi

  # Run the test
  echo "Running tests..." | tee -a ../../$RESULTS_FILE

  if pnpm test 2>&1 | tee -a ../../$RESULTS_FILE; then
    echo -e "${GREEN}✓ PASSED${NC}"
    echo "PASSED" >> ../../$RESULTS_FILE
    ((PASSED++))
  else
    echo -e "${RED}✗ FAILED${NC}"
    echo "FAILED" >> ../../$RESULTS_FILE
    ((FAILED++))
  fi

  cd ../..
}

# Main test loop
for connector in "${!CONNECTORS[@]}"; do
  IFS=':' read -r requires_api requires_service <<< "${CONNECTORS[$connector]}"
  test_connector "$connector" "$requires_api" "$requires_service"
done

# Print summary
echo "" | tee -a $RESULTS_FILE
echo -e "${BLUE}========================================${NC}" | tee -a $RESULTS_FILE
echo -e "${BLUE}Test Summary${NC}" | tee -a $RESULTS_FILE
echo "========================================" | tee -a $RESULTS_FILE
echo -e "Passed:  ${GREEN}$PASSED${NC}" | tee -a $RESULTS_FILE
echo -e "Failed:  ${RED}$FAILED${NC}" | tee -a $RESULTS_FILE
echo -e "Skipped: ${YELLOW}$SKIPPED${NC}" | tee -a $RESULTS_FILE
echo "Total:   $((PASSED + FAILED + SKIPPED))" | tee -a $RESULTS_FILE
echo "Finished: $(date)" | tee -a $RESULTS_FILE
echo "========================================" | tee -a $RESULTS_FILE
echo "" | tee -a $RESULTS_FILE

# Write summary to results file
{
  echo "========================================"
  echo "Test Summary"
  echo "========================================"
  echo "Passed:  $PASSED"
  echo "Failed:  $FAILED"
  echo "Skipped: $SKIPPED"
  echo "Total:   $((PASSED + FAILED + SKIPPED))"
  echo "Finished: $(date)"
  echo "========================================"
} >> $RESULTS_FILE

# Exit with error code if any tests failed
if [ $FAILED -gt 0 ]; then
  echo -e "${RED}Some tests failed! Check $RESULTS_FILE for details.${NC}"
  exit 1
fi

echo -e "${GREEN}All tests passed! Results saved to: $RESULTS_FILE${NC}"
exit 0
