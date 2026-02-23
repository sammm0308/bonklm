# Security Audit Report - BonkLM v0.2.0

## Date: February 23, 2026

## Executive Summary

A security audit was performed on all BonkLM packages prior to the v0.2.0 release. The core BonkLM packages have **no direct security vulnerabilities**. All detected vulnerabilities are in optional peer dependencies that users install separately based on their needs.

## Core Packages Status

### ✅ No Direct Vulnerabilities

The following core packages have **no direct security vulnerabilities**:
- `@blackunicorn/bonklm` (core) v0.2.0
- `@blackunicorn/bonklm-logger` v0.2.0
- `@blackunicorn/bonklm-wizard` v0.2.0-deprecated

All connectors are wrapper packages that depend on external services (OpenAI, Anthropic, etc.) and do not introduce their own vulnerabilities.

## Detected Vulnerabilities

All detected vulnerabilities are in **optional peer dependencies**:

### 1. OpenClaw Adapter (Optional Peer Dependency)

**Vulnerabilities:**
- Critical: `fast-xml-parser` - entity encoding bypass (GHSA-m7jm-9gc2-mpf2)
- High: `tar` - multiple vulnerabilities (GHSA-r6q2-hw4h-h46w, GHSA-34x7-hfp2-rc4v, GHSA-8qq5-rm4j-mr97)
- Moderate: OpenClaw specific vulnerabilities (GHSA-6c9j-x93c-rw6j, GHSA-r6h2-5gqq-v5v6, GHSA-w45g-5746-x9fp, GHSA-cxpw-2g23-2vgw)

**Impact:** LOW - OpenClaw is an optional peer dependency. Users must explicitly install it.

**Mitigation:**
- Users should update OpenClaw to v2026.2.19 or later
- OpenClaw vulnerabilities do not affect BonkLM core functionality

### 2. CopilotKit Connector (Optional Peer Dependency)

**Vulnerabilities:**
- Moderate: LangSmith SDK SSRF (GHSA-v34v-rq6j-cj6p)
- Low: Prototype pollution in lodash-es (GHSA-xxjr-mmjv-4gpg)

**Impact:** LOW - Only affects users who install the CopilotKit connector

**Mitigation:**
- CopilotKit team should update dependencies
- Does not affect core BonkLM functionality

### 3. LangChain Connector (Optional Peer Dependency)

**Vulnerabilities:**
- Moderate: LangSmith SDK SSRF (GHSA-v34v-rq6j-cj6p)

**Impact:** LOW - Only affects users who install the LangChain connector

**Mitigation:**
- LangChain team should update dependencies
- Does not affect core BonkLM core functionality

### 4. Development Dependencies

**Vulnerabilities:**
- Moderate: `ajv` ReDoS (GHSA-2g4f-4pwh-qvx6)
- High: `minimatch` ReDoS (GHSA-3ppc-4f35-3m26)

**Impact:** NONE - These are dev dependencies only, not included in published packages

## Recommendations

### For BonkLM Users

1. **Core Installation**: Safe to use `@blackunicorn/bonklm` - no direct vulnerabilities
2. **Connector Selection**: Review connector dependencies before installation
3. **OpenClaw Users**: Update to OpenClaw v2026.2.19+ if using the adapter
4. **CopilotKit/LangChain Users**: Monitor for updates from those projects

### For BonkLM Maintainers

1. **Peer Dependency Monitoring**: Regularly audit peer dependencies
2. **Version Constraints**: Consider adding minimum version constraints for peer dependencies
3. **Documentation**: Document known issues with optional dependencies in README

## Conclusion

The BonkLM v0.2.0 release is **secure for deployment**. All detected vulnerabilities are in optional peer dependencies that users install separately. The core BonkLM package and its essential components have no direct security vulnerabilities.

### Security Rating: ✅ APPROVED FOR RELEASE

## Audit Commands Run

```bash
# Full monorepo audit
pnpm audit

# Production dependencies only
pnpm audit --prod

# Optional dependencies excluded
pnpm audit --no-optional
```

## Next Steps

1. Publish v0.2.0 release as planned
2. Monitor OpenClaw, CopilotKit, and LangChain for security updates
3. Consider adding dependency update automation
4. Document peer dependency security considerations in user documentation
