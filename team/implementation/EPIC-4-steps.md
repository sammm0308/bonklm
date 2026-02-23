# EPIC-4: Connector System - Implementation Steps

**Priority:** P2
**Points:** 18
**Stories:** 6
**Dependency:** EPIC-2 (Core Infrastructure)

## Overview

This epic implements the extensible connector plugin system and the 5 MVP connectors.

---

## Story 4.1: Connector Registry (3 points)

**File:** `src/connectors/registry.ts`

### Steps

1. **Create implementations directory**
   ```bash
   mkdir -p packages/wizard/src/connectors/implementations
   ```

2. **Implement registry** (`src/connectors/registry.ts`)
   ```typescript
   import type { ConnectorDefinition, ConnectorCategory } from './base.js';

   // Import all MVP connectors (will be created in subsequent stories)
   import { openaiConnector } from './implementations/openai.js';
   import { anthropicConnector } from './implementations/anthropic.js';
   import { ollamaConnector } from './implementations/ollama.js';
   import { expressConnector } from './implementations/express.js';
   import { langchainConnector } from './implementations/langchain.js';

   const CONNECTORS: readonly ConnectorDefinition[] = [
     openaiConnector,
     anthropicConnector,
     ollamaConnector,
     expressConnector,
     langchainConnector,
   ] as const;

   export function getConnector(id: string): ConnectorDefinition | undefined {
     return CONNECTORS.find((c) => c.id === id);
   }

   export function getAllConnectors(): ConnectorDefinition[] {
     return [...CONNECTORS];
   }

   export function getConnectorsByCategory(
     category: ConnectorCategory
   ): ConnectorDefinition[] {
     return CONNECTORS.filter((c) => c.category === category);
   }
   ```

3. **Create tests** (90% coverage)

---

## Story 4.2: OpenAI Connector (3 points)

**File:** `src/connectors/implementations/openai.ts`

### Steps

1. **Create OpenAI connector**
   ```typescript
   import type { ConnectorDefinition } from '../base.js';
   import { z } from 'zod';
   import { validateApiKeySecure } from '../../utils/validation.js';

   export const openaiConnector: ConnectorDefinition = {
     id: 'openai',
     name: 'OpenAI',
     category: 'llm',
     detection: {
       envVars: ['OPENAI_API_KEY'],
       packageJson: ['openai'],
     },

     test: async (config) => {
       const result = await validateApiKeySecure(config.apiKey, {
         method: 'GET',
         sendInHeader: true,
         testEndpoint: 'https://api.openai.com/v1/models',
         timeout: 5000,
         logLevel: 'none',
       });

       return {
         connection: result,
         validation: result,
       };
     },

     generateSnippet: (config) => `
   import { GuardrailEngine } from '@blackunicorn/bonklm';
   import { openaiConnector } from '@blackunicorn/bonklm/openai-connector';

   const engine = new GuardrailEngine({
     connectors: [
       openaiConnector({
         apiKey: process.env.OPENAI_API_KEY,
       }),
     ],
   });
     `.trim(),

     configSchema: z.object({
       apiKey: z.string().startsWith('sk-'),
     }),
   };
   ```

2. **Create tests** (90% coverage, mock fetch)

---

## Story 4.3: Anthropic Connector (3 points)

**File:** `src/connectors/implementations/anthropic.ts`

### Steps

1. **Create Anthropic connector** (similar to OpenAI but with sk-ant- prefix)
   ```typescript
   import type { ConnectorDefinition } from '../base.js';
   import { z } from 'zod';
   import { validateApiKeySecure } from '../../utils/validation.js';

   export const anthropicConnector: ConnectorDefinition = {
     id: 'anthropic',
     name: 'Anthropic',
     category: 'llm',
     detection: {
       envVars: ['ANTHROPIC_API_KEY'],
       packageJson: ['@anthropic-ai/sdk'],
     },

     test: async (config) => {
       const result = await validateApiKeySecure(config.apiKey, {
         method: 'GET',
         sendInHeader: true,
         testEndpoint: 'https://api.anthropic.com/v1/models',
         timeout: 5000,
         logLevel: 'none',
       });

       return {
         connection: result,
         validation: result,
       };
     },

     generateSnippet: (config) => `
   import { GuardrailEngine } from '@blackunicorn/bonklm';
   import { anthropicConnector } from '@blackunicorn/bonklm/anthropic-connector';

   const engine = new GuardrailEngine({
     connectors: [
       anthropicConnector({
         apiKey: process.env.ANTHROPIC_API_KEY,
       }),
     ],
   });
     `.trim(),

     configSchema: z.object({
       apiKey: z.string().startsWith('sk-ant-'),
     }),
   };
   ```

2. **Create tests** (90% coverage)

---

## Story 4.4: Ollama Connector (3 points)

**File:** `src/connectors/implementations/ollama.ts`

### Steps

1. **Create Ollama connector** (local service, no API key)
   ```typescript
   import type { ConnectorDefinition } from '../base.js';
   import { z } from 'zod';

   export const ollamaConnector: ConnectorDefinition = {
     id: 'ollama',
     name: 'Ollama',
     category: 'llm',
     detection: {
       ports: [11434],
     },

     test: async (config) => {
       const baseUrl = config.baseUrl || 'http://localhost:11434';

       try {
         const controller = new AbortController();
         const timeout = setTimeout(() => controller.abort(), 2000);

         const response = await fetch(`${baseUrl}/api/tags`, {
           method: 'GET',
           signal: controller.signal,
         });

         clearTimeout(timeout);

         return {
           connection: response.ok,
           validation: response.ok,
           error: response.ok ? undefined : `HTTP ${response.status}`,
         };
       } catch (error) {
         return {
           connection: false,
           validation: false,
           error: (error as Error).message,
         };
       }
     },

     generateSnippet: (config) => `
   import { ollamaConnector } from '@blackunicorn/bonklm/ollama-connector';

   const connector = ollamaConnector({
     baseUrl: '${config.baseUrl || 'http://localhost:11434'}',
   });
     `.trim(),

     configSchema: z.object({
       baseUrl: z.string().url().optional(),
     }),
   };
   ```

2. **Create tests** (90% coverage)

---

## Story 4.5: Express Framework Connector (3 points)

**File:** `src/connectors/implementations/express.ts`

### Steps

1. **Create Express connector** (framework connector, no external test)
   ```typescript
   import type { ConnectorDefinition } from '../base.js';
   import { z } from 'zod';

   export const expressConnector: ConnectorDefinition = {
     id: 'express',
     name: 'Express',
     category: 'framework',
     detection: {
       packageJson: ['express'],
     },

     test: async (_config) => {
       // Framework connectors don't need external testing
       return {
         connection: true,
         validation: true,
       };
     },

     generateSnippet: () => `
   import { GuardrailEngine } from '@blackunicorn/bonklm';
   import { expressMiddleware } from '@blackunicorn/bonklm/express-middleware';
   import express from 'express';

   const app = express();
   const guardrails = new GuardrailEngine({
     // ... configuration
   });

   app.use(express.json());
   app.use(expressMiddleware(guardrails));

   app.post('/api/chat', async (req, res) => {
     const result = await guardrails.validate(req.body.message);
     if (result.flagged) {
       return res.status(400).json({ error: 'Content flagged' });
     }
     // ... handle request
   });

   app.listen(3000);
     `.trim(),

     configSchema: z.object({
       validateOnRequest: z.boolean().optional(),
     }),
   };
   ```

2. **Create tests** (90% coverage)

---

## Story 4.6: LangChain Connector (3 points)

**File:** `src/connectors/implementations/langchain.ts`

### Steps

1. **Create LangChain connector** (framework connector with callback pattern)
   ```typescript
   import type { ConnectorDefinition } from '../base.js';
   import { z } from 'zod';

   export const langchainConnector: ConnectorDefinition = {
     id: 'langchain',
     name: 'LangChain',
     category: 'framework',
     detection: {
       packageJson: ['langchain', '@langchain/core'],
     },

     test: async (_config) => {
       return {
         connection: true,
         validation: true,
       };
     },

     generateSnippet: () => `
   import { GuardrailEngine } from '@blackunicorn/bonklm';
   import { BaseCallbackHandler } from '@langchain/core/callbacks/base';

   const guardrails = new GuardrailEngine({
     validators: [
       // ... your validators
     ],
   });

   class GuardrailCallbackHandler extends BaseCallbackHandler {
     name = 'guardrail-handler';

     async handleLLMStart(llm: string, prompts: string[]) {
       for (const prompt of prompts) {
         const result = await guardrails.validate(prompt);
         if (result.flagged) {
           throw new Error(\`Content flagged: \${result.reason}\`);
         }
       }
     }
   }

   // Use with LangChain
   import { ChatOpenAI } from '@langchain/openai';

   const llm = new ChatOpenAI({
     callbacks: [new GuardrailCallbackHandler()],
   });
     `.trim(),

     configSchema: z.object({
       blockOnFlag: z.boolean().optional(),
     }),
   };
   ```

2. **Create tests** (90% coverage)

---

## Epic Completion Checklist

- [ ] All 6 stories implemented
- [ ] Registry stores all connectors
- [ ] 5 MVP connectors defined
- [ ] LLM connectors (OpenAI, Anthropic, Ollama)
- [ ] Framework connectors (Express, LangChain)
- [ ] All connectors have detection rules
- [ ] All connectors have test functions
- [ ] All connectors generate code snippets
- [ ] All connectors have Zod schemas

**Next Epic:** EPIC-5 - Testing Framework
