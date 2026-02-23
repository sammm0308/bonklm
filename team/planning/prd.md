---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
inputDocuments: ['README.md']
workflowType: 'prd'
lastStep: 11
documentCounts: {
  briefCount: 0,
  researchCount: 0,
  brainstormingCount: 0,
  projectDocsCount: 1
}
---

# Product Requirements Document - BonkLM Installation Wizard

**Author:** J
**Date:** 2026-02-18

## Executive Summary

### Vision

BonkLM provides powerful security validators for LLM applications, but getting started with connectors can be friction-heavy. The Installation Wizard eliminates this barrier by providing an intelligent, auto-detecting setup experience that gets users from "npm install" to "it works" in under 2 minutes.

The wizard discovers what users already have (local services, frameworks, API keys), presents smart defaults, and validates that each connector actually functions before completing setup. This reduces configuration cognitive load and accelerates time-to-first-success.

### What Makes This Special

Unlike traditional setup wizards that require manual selection and configuration, the BonkLM Installation Wizard is **environment-aware**:

- **Auto-detects local services** - Scans for Ollama, Docker containers with vector DBs (Chroma, Weaviate, Qdrant)
- **Reads project context** - Analyzes package.json to identify installed frameworks (Express, Fastify, NestJS, LangChain, etc.)
- **Finds existing credentials** - Checks environment variables for API keys that are already configured
- **Validates end-to-end** - Tests both connection AND runs a sample guardrail query to confirm everything works

The key insight: **users shouldn't have to tell the wizard what they have - the wizard should discover it and ask for confirmation.** This reduces setup from a questionnaire to a confirmation experience.

## Project Classification

**Technical Type:** CLI Tool / Developer Utility
**Domain:** Developer Tools / Security
**Complexity:** Medium
**Project Context:** Brownfield - extending existing BonkLM npm package

### Feature Classification

This is an **add-on developer utility** that enhances the core BonkLM package by:

1. **Reducing first-run friction** - Auto-detection minimizes manual configuration
2. **Increasing confidence** - End-to-end testing proves connectors work before exit
3. **Enabling incremental adoption** - Quick command allows adding connectors anytime
4. **Supporting diverse environments** - Works for both developers (local) and DevOps (containerized)

The wizard complements existing manual configuration methods rather than replacing them, offering a fast path for new users while preserving full control for advanced users.

## Success Criteria

### User Success

Users complete the wizard experience with working, validated connectors and immediate confidence to proceed:

- **Time-to-first-success**: Complete initial wizard and validate ≥1 connector in under 2 minutes
- **Validation confidence**: Each connector shows explicit test results (connection + query) before exit
- **Zero uncertainty**: Users never wonder "did this actually work?" - green checkmarks confirm success
- **Emotional win**: Relief and confidence - "something that just works" without reading docs

### Business Success

As an open-source developer tool, success is measured by adoption and reduced support burden:

- **Connector adoption**: Increase percentage of users who successfully configure and use connectors
- **Support reduction**: Decrease in "how do I set up X connector" issues and questions
- **Production deployment**: More users deploying guardrails to production (vs. just npm install)
- **3-month indicator**: Wizard completion rate >80% with exit-to-usage conversion >50%

### Technical Success

The wizard must be accurate, fast, and reliable with zero tolerance for detection errors:

- **Detection accuracy**: 100% - no false positives (detecting non-existent services) and no false negatives (missing available services)
- **Validation depth**: Detect "service is usable" not just "service exists" (e.g., Ollama running AND has models)
- **Speed**: Complete full detection + validation cycle in under 60 seconds
- **Reliability**: Works consistently across OS platforms (macOS, Linux, Windows) and Node versions
- **Graceful uncertainty**: When detection is uncertain, show "Unsure - want to try anyway?" rather than guessing

### Measurable Outcomes

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Wizard completion time | <2 minutes | Built-in timing |
| Connector test success rate | >95% of detected connectors | Test pass/fail tracking |
| Detection accuracy | 100% | User feedback loop |
| Wizard exit → code usage | >50% | Anonymous usage telemetry (opt-in) |
| "setup help" issues reduction | -60% | GitHub issue trending |

## Product Scope

### MVP - Minimum Viable Product

Core wizard experience that proves the concept:

1. **Auto-detection engine**
   - Scan for local services (Ollama on :11434, Docker containers)
   - Read package.json for framework detection
   - Check environment variables for API keys
   - Present findings with pre-selected options

2. **Connector configuration flow**
   - Interactive CLI prompts for missing credentials
   - Support for top 5 connectors: OpenAI, Anthropic, Ollama, Express, LangChain

3. **Connection + query testing**
   - Validate API connectivity
   - Run sample guardrail check
   - Display pass/fail with clear feedback

4. **Quick add command**
   - `bonklm connector add` for anytime connector addition
   - Re-runs detection and configuration for new connectors

### Growth Features (Post-MVP)

Enhanced experience and broader connector support:

1. **Extended detection**
   - Support all 19 connectors
   - Detect local vector DBs (Chroma, Weaviate, Qdrant, Pinecone)
   - Advanced Docker service discovery

2. **Configuration persistence**
   - Save connector configs to project file
   - Reuse configs across wizard runs
   - Environment variable generation

3. **Improved UX**
   - Progress bars during detection
   - Colored terminal output (success/warning/error)
   - Auto-fix suggestions for common failures

### Vision (Future)

The complete intelligent setup experience:

1. **Predictive recommendations**
   - Suggest connectors based on project stack
   - Bundle recommendations (e.g., "Express + OpenAI starter kit")
   - Community connector plugins

2. **Self-healing**
   - Detect and fix common configuration issues
   - Automated troubleshooting
   - Service health monitoring

3. **Team collaboration**
   - Share connector configurations
   - Organization-wide connector templates
   - CI/CD integration

## User Journeys

### Journey 1: Alex Chen - The Developer Who Needs Guardrails Yesterday

Alex is a full-stack developer building a customer support chatbot for his startup. He just read about prompt injection attacks and realizes his chatbot is vulnerable. He needs to add guardrails immediately but is overwhelmed by the configuration docs.

**Opening Scene**: It's 9 PM, Alex is worried about security but dreading reading pages of documentation. He runs `npm install @blackunicorn/bonklm` and hopes for the best.

**Rising Action**: Alex runs `bonklm wizard`. To his surprise, it immediately detects:
- "Found Express.js in your project"
- "Found OPENAI_API_KEY in your environment"
- "Found Ollama running on localhost:11434"

The wizard asks: "Setup Express middleware + OpenAI connector?" Alex hits Enter.

**Climax**: The wizard runs a test - it sends a prompt injection attempt and shows: "✓ BLOCKED: Prompt injection detected". Alex breathes a sigh of relief. It actually works.

**Resolution**: In 90 seconds, Alex has validated connectors working. He copies the generated code snippet into his app and sleeps peacefully knowing his chatbot is protected.

### Journey 2: Sam Rivera - The DevOps Who Hates Manual Configuration

Sam is setting up LLM guardrails across her company's microservices architecture. She has 5 services, different LLM providers, and zero patience for repetitive configuration.

**Opening Scene**: Sam is staring at a spreadsheet of services and connectors. She needs a systematic way to ensure every service has working guardrail validation.

**Rising Action**: She runs the wizard in her first service project. It detects Docker containers with Weaviate and Chroma. It pre-selects the vector DB connectors. Sam confirms.

**Climax**: All 5 connectors test successfully. Sam sees the green checkmarks and knows these configs will work in production.

**Resolution**: Sam uses `bonklm connector add` to quickly add connectors to the remaining 4 services. She documents the process for her team and ships to production with confidence.

### Journey 3: Jordan Lee - The "Something Went Wrong" Recovery

Jordan is a new developer who inherited a project using BonkLM. The connectors aren't working and he has no idea why.

**Opening Scene**: Jordan tries to run guardrails but gets connection errors. He doesn't know which connectors are configured or what's broken.

**Rising Action**: He runs `bonklm wizard`. The wizard auto-detects what's available and shows: "OpenAI: API key missing, Anthropic: ✓ detected, Ollama: ✓ running".

**Climax**: Jordan enters his OpenAI key. The wizard tests all three connectors and shows two green checkmarks and one red X with a helpful error message: "OpenAI API key invalid - check your credentials".

**Resolution**: Jordan fixes his .env file and re-runs the test. All green. He now understands his project's connector setup and can proceed with development.

### Journey Requirements Summary

These journeys reveal core capability requirements:

| Capability | Journeys Revealing Need |
|------------|------------------------|
| Auto-detection of frameworks | Alex (Express), Sam (vector DBs) |
| Auto-detection of services | Alex (Ollama), Jordan (Anthropic) |
| Auto-detection of credentials | Alex (API keys), Jordan (missing keys) |
| Pre-selected defaults | Alex (hit Enter to confirm), Sam (bulk setup) |
| Connection + query testing | All journeys (validation confidence) |
| Clear visual feedback | All journeys (green checkmarks, red X) |
| Actionable error messages | Jordan (invalid API key guidance) |
| Quick-add command | Sam (connector add for multiple services) |
| Generated code snippets | Alex (copy into app) |
| Test re-running | Jordan (fix and re-test) |

## CLI Tool Specific Requirements

### Project-Type Overview

The Installation Wizard is a CLI tool that provides both interactive and programmatic modes for configuring BonkLM connectors. It prioritizes developer experience with fast, intelligent setup while supporting automation workflows.

### Command Structure

**Primary Commands:**
- `bonklm wizard` - Full interactive setup with auto-detection
- `bonklm connector add` - Quick add connector anytime
- `bonklm connector test` - Test existing connectors
- `bonklm status` - Show detected environment and configured connectors

**Modes:**
- **Interactive mode** (default): Prompt-driven with confirmation steps
- **Non-interactive mode** (`--yes` flag): Accept all defaults, suitable for CI/CD
- **JSON mode** (`--json`): Output results in JSON format for parsing

### Output Formats

- **Terminal output**: Human-readable with colored indicators (✓/✗) and progress feedback
- **JSON**: Structured output for programmatic consumption and logging
- **Exit codes**: 0 (success), 1 (failure), 2 (partial success - some connectors failed)

### Configuration Schema

**Storage location:** `.env` file in project root

**Format:**
```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
LLM_GUARDRAILS_CONNECTORS=openai,anthropic,express
```

**Rationale:** `.env` is the Node.js standard, works with all deployment platforms, and aligns with existing user mental models.

### Scripting Support

**Non-interactive usage:**
```bash
# Accept all defaults
bonklm wizard --yes

# Specific connector only
bonklm connector add openai --api-key=$OPENAI_API_KEY

# JSON output for CI/CD
bonklm status --json
```

**Exit codes enable script logic:**
```bash
bonklm wizard || echo "Setup failed, check logs"
```

### Shell Completion

**Decision:** Skip for MVP, consider for Growth phase based on user demand.

**Rationale:** Shell completion adds ~200-500 lines of code, varies by shell (bash/zsh/fish), and provides marginal value for an occasional-use wizard. Better to focus on core detection and testing capabilities first.

### Implementation Considerations

**Cross-platform compatibility:**
- Must work on macOS, Linux, Windows (WSL and native)
- Use Node.js cross-platform APIs (no shell-specific commands)
- Test on all three platforms before release

**Terminal compatibility:**
- Gracefully degrade if colors not supported
- Handle various terminal widths (wrap text appropriately)
- Support CI/CD environments (no TTY)

**Performance:**
- Detection phase should complete in <10 seconds
- Parallelize service detection where possible
- Show progress indicator for long-running operations

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Platform MVP - Build extensible foundation for all 19 connectors from day one

**Resource Requirements:** 1-2 developers, 4-6 weeks for MVP foundation

**Rationale:** Rather than solving for just 5 connectors and refactoring later, we're building the extensible detection and testing architecture that supports all connectors from the start. This prevents technical debt and enables rapid connector addition post-MVP.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Alex (Developer first-time setup)
- Sam (DevOps multi-service setup)
- Jordan (Debugging existing setup)

**Must-Have Capabilities:**

1. **Extensible Detection Engine** (supports all 19 connectors architecturally)
   - Service detection framework (port scanning, Docker detection, package.json parsing)
   - Connector plugin system (easy to add new connectors)
   - Environment variable detection

2. **5 Working Connectors**
   - OpenAI, Anthropic, Ollama (LLM providers)
   - Express, LangChain (framework integrations)

3. **Connection + Query Testing**
   - Generic testing framework applicable to all connector types
   - Sample guardrail validation for each connector

4. **CLI Foundation**
   - Interactive wizard mode
   - `connector add` command
   - Basic terminal output with colored indicators

5. **Configuration Management**
   - .env file read/write
   - API key collection and validation

### Post-MVP Features

**Phase 2 (Post-MVP - 2-4 weeks):**
- Remaining 14 connectors implemented
- Progress bars and enhanced UX
- Configuration persistence across runs
- JSON output mode
- Non-interactive mode (`--yes` flag)

**Phase 3 (Expansion - 4-8 weeks):**
- Advanced Docker service discovery
- Vector DB connector support (Chroma, Weaviate, Qdrant, Pinecone)
- Self-healing and auto-fix suggestions
- Shell completion (if user demand justifies)
- Connector recommendation engine

### Risk Mitigation Strategy

**Technical Risks:**
- **Risk:** Cross-platform compatibility issues (Windows/macOS/Linux)
- **Mitigation:** Use Node.js cross-platform APIs exclusively; test on all 3 platforms before each release

- **Risk:** Detection engine false positives/negatives
- **Mitigation:** 100% accuracy requirement means each detection must be verified before showing to user; "Unsure - try anyway?" fallback

**Market Risks:**
- **Risk:** Users prefer manual configuration over automated detection
- **Mitigation:** Wizard is opt-in, not replacement for manual config; always show what was detected and allow editing

**Resource Risks:**
- **Risk:** Connector implementation takes longer than expected
- **Mitigation:** Extensible architecture means any 5 connectors prove the concept; remaining 14 can be added incrementally by community or team

## Functional Requirements

### Environment Detection

- FR1: System can detect installed Node.js frameworks by reading package.json
- FR2: System can detect running local services (Ollama on :11434)
- FR3: System can detect Docker containers and their exposed services
- FR4: System can detect existing API keys in environment variables
- FR5: System can present detected services to user for confirmation

### Connector Management

- FR6: User can add a new connector through interactive prompts
- FR7: User can remove an existing connector configuration
- FR8: User can view all configured connectors
- FR9: User can test an existing connector configuration
- FR10: System can generate connector-specific configuration code snippets
- FR11: System can validate connector configuration before saving

### Credential Management

- FR12: User can provide API credentials through secure prompts
- FR13: System can validate API credentials by making test requests
- FR14: System can store credentials in .env file format
- FR15: System can mask sensitive credential values in output display
- FR16: User can update existing credential values

### Connection Testing

- FR17: System can test connectivity to LLM provider APIs
- FR18: System can test connectivity to local services
- FR19: System can execute sample guardrail validation as part of testing
- FR20: System can display test results with clear pass/fail indicators
- FR21: System can provide actionable error messages for failed connections
- FR22: User can re-run tests after fixing configuration issues

### Wizard Interface

- FR23: User can start interactive setup wizard
- FR24: System can display progress indicators during detection
- FR25: User can accept detected configuration with single confirmation
- FR26: User can modify detected configuration before confirmation
- FR27: System can display colored terminal output for status indicators

### CLI Operations

- FR28: User can invoke wizard command from terminal
- FR29: User can invoke connector-specific subcommands
- FR30: User can invoke status command to view environment state
- FR31: System can exit with appropriate status codes for scripting
- FR32: User can bypass interactive prompts with confirmation flags

### Extensibility

- FR33: System can support new connector types via plugin architecture
- FR34: System can define detection rules per connector type
- FR35: System can define test procedures per connector type
- FR36: System can define configuration schema per connector type

### Configuration Persistence

- FR37: System can read existing .env files
- FR38: System can write to .env files without overwriting unrelated entries
- FR39: System can merge new configuration with existing .env entries
- FR40: System can validate .env file format before writing

### Error Handling

- FR41: System can detect when required services are unavailable
- FR42: System can detect when credentials are invalid
- FR43: System can provide recovery suggestions for common errors
- FR44: System can gracefully handle network timeouts during testing
- FR45: System can continue processing when non-critical services fail

### Output & Reporting

- FR46: System can display connector status in tabular format
- FR47: System can display connector status in JSON format
- FR48: System can display timing information for operations
- FR49: System can display summary statistics after wizard completion
- FR50: System can log diagnostic information for troubleshooting

## Non-Functional Requirements

### Performance

- NFR-PERF-001: Wizard completes full detection and configuration flow in under 2 minutes
- NFR-PERF-002: Service detection phase completes in under 10 seconds
- NFR-PERF-003: Connection tests complete in under 5 seconds per connector
- NFR-PERF-004: CLI commands respond with output within 500ms for status commands

### Security

- NFR-SEC-001: API keys are never displayed in plain text in terminal output
- NFR-SEC-002: API keys are never logged to files or diagnostic output
- NFR-SEC-003: Credentials are validated before storage but never transmitted externally except to target service
- NFR-SEC-004: .env files are created with restrictive file permissions (read/write for owner only)
- NFR-SEC-005: No credentials are stored in system configuration or package manager cache

### Reliability

- NFR-REL-001: Detection accuracy is 100% - no false positives or false negatives presented as certain
- NFR-REL-002: When detection is uncertain, system presents "Unsure - want to try anyway?" rather than guessing
- NFR-REL-003: System handles network timeouts gracefully without crashing
- NFR-REL-004: Partial failures (some connectors failing) don't prevent wizard completion
- NFR-REL-005: Exit codes accurately reflect success (0), failure (1), or partial success (2)

### Compatibility

- NFR-COMP-001: Wizard works on macOS, Linux, and Windows (WSL and native)
- NFR-COMP-002: Wizard works with Node.js versions 18.x and later
- NFR-COMP-003: Terminal output gracefully degrades when colors are not supported
- NFR-COMP-004: Wizard operates correctly in CI/CD environments without TTY
- NFR-COMP-005: System respects .gitignore and .env best practices

### Usability

- NFR-USE-001: First-time users can complete wizard without reading documentation
- NFR-USE-002: Error messages provide actionable next steps
- NFR-USE-003: Terminal output wraps correctly for widths 80-160 characters
- NFR-USE-004: Status indicators (✓/✗) are visually distinct and color-coded when supported
