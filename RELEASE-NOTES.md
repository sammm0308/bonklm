# BonkLM v0.2.0 Release Notes

## Release Date: February 23, 2026

## Overview

BonkLM v0.2.0 is a significant update that includes a complete project rebranding, enhanced security features, and improved connector ecosystem. This release focuses on security hardening, better developer experience, and expanded platform support.

## What's New

### Project Rebranding

- **New Name**: The project has been renamed from LLM Guardrails to **BonkLM**
- **New Package Scope**: All packages now use the `@blackunicorn/bonklm` namespace
- **CLI Commands Updated**: All CLI commands now use `bonklm` instead of `llm-guardrails`

### Security Enhancements

#### Attack Logger (New Feature)
- Comprehensive attack logging system for security monitoring
- Configurable logging levels and output formats
- Structured attack data capture for analysis and forensics
- Located in `packages/logger`

#### Core Validation Hardening
- Enhanced prompt injection detection with improved pattern matching
- Strengthened jailbreak detection algorithms
- Better boundary detection for adversarial inputs
- Improved PII (Personally Identifiable Information) validation

### Connector Updates

All connector packages bumped to v1.1.0 with:
- Improved error handling and resilience
- Better timeout management
- Enhanced credential validation
- Updated dependencies for security

Updated connectors:
- `@blackunicorn/bonklm-anthropic` v1.1.0
- `@blackunicorn/bonklm-chroma` v1.1.0
- `@blackunicorn/bonklm-copilotkit` v1.1.0
- `@blackunicorn/bonklm-express` v1.1.0
- `@blackunicorn/bonklm-fastify` v1.1.0
- `@blackunicorn/bonklm-genkit` v1.1.0
- `@blackunicorn/bonklm-huggingface` v1.1.0
- `@blackunicorn/bonklm-langchain` v1.1.0
- `@blackunicorn/bonklm-llamaindex` v1.1.0
- `@blackunicorn/bonklm-mastra` v1.1.0
- `@blackunicorn/bonklm-mcp` v1.1.0
- `@blackunicorn/bonklm-nestjs` v1.1.0
- `@blackunicorn/bonklm-ollama` v1.1.0
- `@blackunicorn/bonklm-openai` v1.1.0
- `@blackunicorn/bonklm-pinecone` v1.1.0
- `@blackunicorn/bonklm-qdrant` v1.1.0
- `@blackunicorn/bonklm-vercel` v1.1.0
- `@blackunicorn/bonklm-weaviate` v1.1.0

### Middleware Framework Improvements

- **Express Middleware**: Enhanced request/response handling
- **Fastify Plugin**: Improved integration patterns
- **NestJS Module**: Better decorator support and dependency injection

### Quality & Testing

- 100% test pass rate across all packages
- 2003 passing tests
- Enhanced security test coverage
- Improved type safety across all packages

## Package Versions

| Package | Old Version | New Version |
|---------|-------------|-------------|
| `@blackunicorn/bonklm` (core) | 0.1.0 | 0.2.0 |
| `@blackunicorn/bonklm-logger` | 0.1.0 | 0.2.0 |
| `@blackunicorn/bonklm-wizard` | 0.1.0-deprecated | 0.2.0-deprecated |
| All connectors | 1.0.0 | 1.1.0 |

## Security Fixes

This release includes security improvements to:

1. **Command Injection Prevention**: Enhanced validation in the wizard package to prevent command injection through PATH manipulation
2. **DoS Protection**: Added resource limits to prevent denial-of-service through resource exhaustion
3. **Credential Handling**: Improved secure credential handling in audit logs
4. **Input Validation**: Strengthened input validation across all validators

## Breaking Changes

### CLI Commands

If you were using the old `llm-guardrails` CLI commands, you'll need to update to `bonklm`:

```bash
# Old (v0.1.0)
llm-guardrails wizard
llm-guardrails status

# New (v0.2.0)
bonklm wizard
bonklm status
```

### Package Imports

Update your imports to use the new package names:

```typescript
// Old (v0.1.0)
import { GuardrailEngine } from '@llm-guardrails/core';

// New (v0.2.0)
import { GuardrailEngine } from '@blackunicorn/bonklm';
```

## Migration Guide

### Updating from v0.1.0

1. **Update package names** in your `package.json`:
   ```bash
   npm uninstall @llm-guardrails/core
   npm install @blackunicorn/bonklm
   ```

2. **Update imports** in your code:
   ```typescript
   // Find and replace
   - from '@llm-guardrails/core'
   + from '@blackunicorn/bonklm'
   - from '@llm-guardrails/openai'
   + from '@blackunicorn/bonklm-openai'
   ```

3. **Update CLI scripts** in your `package.json`:
   ```json
   {
     "scripts": {
   -    "setup": "llm-guardrails wizard"
   +    "setup": "bonklm wizard"
     }
   }
   ```

## Installation

```bash
# Core package
npm install @blackunicorn/bonklm

# Connectors
npm install @blackunicorn/bonklm-openai
npm install @blackunicorn/bonklm-anthropic
npm install @blackunicorn/bonklm-express

# Logger
npm install @blackunicorn/bonklm-logger
```

## Documentation

- [Getting Started](/docs/user/getting-started.md)
- [API Reference](/docs/api-reference.md)
- [Connectors Guide](/docs/user/connectors/)
- [Security Guide](/docs/user/security/)

## Contributors

- Black Unicorn Security Team

## Support

- **GitHub Issues**: https://github.com/blackunicorn/bonklm/issues
- **Documentation**: https://github.com/blackunicorn/bonklm#readme
- **Security**: security@blackunicorn.tech

## License

MIT License - See LICENSE file for details
