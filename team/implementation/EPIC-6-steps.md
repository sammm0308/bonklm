# EPIC-6: Wizard UX - Implementation Steps

**Priority:** P2
**Points:** 12
**Stories:** 4
**Dependency:** EPIC-3 (Detection Engine), EPIC-5 (Testing Framework)

## Overview

This epic implements the main wizard flows and user interaction patterns.

---

## Story 6.1: Wizard Command Flow (5 points)

**File:** `src/commands/wizard.ts`

### Steps

1. **Implement wizard command** (using Clack for UI)
   ```typescript
   import { Command } from 'commander';
   import * as p from '@clack/prompts';
   import { detectFrameworks } from '../detection/framework.js';
   import { detectServices } from '../detection/services.js';
   import { detectCredentials } from '../detection/credentials.js';
   import { testConnector } from '../testing/validator.js';
   import { EnvManager } from '../config/env.js';
   import { AuditLogger } from '../utils/audit.js';
   import { exit, exitWithError, setupShutdownHandlers } from '../utils/exit.js';
   import { withSpinner } from '../utils/progress.js';

   export const wizardCommand = new Command('wizard')
     .description('Run interactive setup wizard')
     .option('--yes', 'Accept all defaults (non-interactive)')
     .option('--json', 'Output results in JSON format')
     .action(async (options) => {
       const audit = new AuditLogger();
       setupShutdownHandlers();

       try {
         if (!options.json) {
           p.intro('BonkLM Installation Wizard');
         }

         // Phase 1: Framework Detection
         const frameworks = await withSpinner(
           'Detecting frameworks...',
           () => detectFrameworks()
         );

         // Phase 2: Service Detection
         const services = await withSpinner(
           'Detecting services...',
           () => detectServices()
         );

         // Phase 3: Credential Detection
         const credentials = await withSpinner(
           'Checking credentials...',
           () => detectCredentials()
         );

         // Display and select connectors
         if (options.yes) {
           // Auto-select all detected
           await proceedWithAutoSelection(
             frameworks,
             services,
             credentials,
             options.json
           );
         } else {
           await promptUserSelection(
             frameworks,
             services,
             credentials,
             options.json
           );
         }

         p.outro('Setup complete!');
         exit('SUCCESS');
       } catch (error) {
         await audit.log({
           action: 'connector_added',
           success: false,
           error_code: (error as WizardError)?.code,
         });
         exitWithError(error as Error);
       }
     });
   ```

2. **Implement user selection prompts**
   ```typescript
   async function promptUserSelection(
     frameworks: DetectedFramework[],
     services: DetectedService[],
     credentials: DetectedCredential[],
     jsonMode: boolean
   ) {
     // Build connector options
     const options = buildConnectorOptions(
       frameworks,
       services,
       credentials
     );

     const selected = await p.multiselect({
       message: 'Select connectors to configure:',
       options,
       required: false,
     });

     if (p.isCancel(selected) || selected.length === 0) {
       p.outro('No connectors selected. Exiting.');
       exit('SUCCESS');
     }

     // Collect credentials
     const config = await collectCredentials(selected);

     // Test connectors
     const testResults = await testAllConnectors(selected, config);

     // Write .env
     const envManager = new EnvManager();
     await envManager.write(config);

     // Display summary
     displaySummary(selected, testResults, jsonMode);
   }
   ```

3. **Create tests** (80% coverage)

---

## Story 6.2: Connector Add Command (3 points)

**File:** `src/commands/connector-add.ts`

### Steps

1. **Implement connector-add command**
   ```typescript
   import { Command } from 'commander';
   import * as p from '@clack/prompts';
   import { getConnector } from '../connectors/registry.js';
   import { testConnector } from '../testing/validator.js';
   import { EnvManager } from '../config/env.js';
   import { AuditLogger } from '../utils/audit.js';
   import { exit, exitWithError } from '../utils/exit.js';

   export const connectorAddCommand = new Command('add')
     .argument('<id>', 'Connector ID')
     .description('Add a connector')
     .action(async (id) => {
       const audit = new AuditLogger();

       try {
         p.intro(`Adding ${id} connector`);

         await audit.log({
           action: 'connector_detected',
           connector_id: id,
           success: true,
         });

         const connector = getConnector(id);
         if (!connector) {
           console.error(`Unknown connector: ${id}`);
           console.error('Available connectors:');
           getAllConnectors().forEach(c => console.log(`  - ${c.id}`));
           exit('ERROR');
         }

         // Collect credentials
         const config: Record<string, string> = {};
         for (const key of connector.detection.envVars || []) {
           const value = await p.password({
             message: `Enter ${key}:`,
             validate: (val) => {
               if (!val) return 'Value is required';
               if (key.includes('KEY') && !val.startsWith('sk-')) {
                 return 'Invalid format';
               }
               return undefined;
             },
           });

           if (typeof value === 'string') {
             config[key] = value;
           }
         }

         // Test connector
         const testSpinner = p.spinner();
         testSpinner.start('Testing connector...');

         const result = await testConnector(connector, config);

         if (result.connection && result.validation) {
           testSpinner.stop('✓ Connector test passed');
         } else {
           testSpinner.stop('✗ Connector test failed');
           console.log(`Error: ${result.error}`);

           const continueAnyway = await p.confirm({
             message: 'Connector test failed. Continue anyway?',
             initialValue: false,
           });

           if (typeof continueAnyway !== 'boolean' || !continueAnyway) {
             await audit.log({
               action: 'connector_added',
               connector_id: id,
               success: false,
               error_code: 'TEST_FAILED',
             });
             exit('ERROR');
           }
         }

         // Write to .env
         const envManager = new EnvManager();
         await envManager.write(config);

         await audit.log({
           action: 'connector_added',
           connector_id: id,
           success: true,
         });

         p.outro(`✓ ${connector.name} connector added successfully.`);
         exit('SUCCESS');
       } catch (error) {
         await audit.log({
           action: 'connector_added',
           connector_id: id,
           success: false,
           error_code: (error as WizardError)?.code,
         });
         exitWithError(error as Error);
       }
     });
   ```

2. **Create tests** (80% coverage)

---

## Story 6.3: Status Command (2 points)

**File:** `src/commands/status.ts`

### Steps

1. **Implement status command**
   ```typescript
   import { Command } from 'commander';
   import { detectFrameworks } from '../detection/framework.js';
   import { detectServices } from '../detection/services.js';
   import { detectCredentials } from '../detection/credentials.js';
   import { EnvManager } from '../config/env.js';
   import { getTerminalCapabilities } from '../utils/terminal.js';

   export const statusCommand = new Command('status')
     .option('--json', 'Output in JSON format')
     .description('Show environment and connector status')
     .action(async (options) => {
       const frameworks = await detectFrameworks();
       const services = await detectServices();
       const credentials = await detectCredentials();
       const envManager = new EnvManager();
       const env = await envManager.read();

       if (options.json) {
         console.log(
           JSON.stringify(
             {
               frameworks,
               services,
               credentials,
               configured: Object.keys(env),
               timestamp: new Date().toISOString(),
             },
             null,
             2
           )
         );
         return;
       }

       displayStatus(frameworks, services, credentials, env);
     });

   function displayStatus(
     frameworks: DetectedFramework[],
     services: DetectedService[],
     credentials: DetectedCredential[],
     env: Record<string, string>
   ): void {
     const { supportsColor } = getTerminalCapabilities();

     console.log('\n=== Environment Status ===\n');

     // Frameworks
     console.log('Frameworks:');
     if (frameworks.length === 0) {
       console.log('  No frameworks detected');
     } else {
       for (const f of frameworks) {
         const status = supportsColor ? '\x1b[32m✓\x1b[0m' : '✓';
         console.log(`  ${status} ${f.name} ${f.version || ''}`);
       }
     }

     // Services
     console.log('\nServices:');
     if (services.length === 0) {
       console.log('  No services detected');
     } else {
       for (const s of services) {
         const status = s.available
           ? (supportsColor ? '\x1b[32m✓\x1b[0m' : '✓')
           : (supportsColor ? '\x1b[31m✗\x1b[0m' : '✗');
         console.log(`  ${status} ${s.name}: ${s.available ? 'running' : 'not running'}`);
       }
     }

     // Credentials
     console.log('\nCredentials:');
     if (credentials.length === 0) {
       console.log('  No credentials detected');
     } else {
       for (const c of credentials) {
         const status = c.present
           ? (supportsColor ? '\x1b[32m✓\x1b[0m' : '✓')
           : (supportsColor ? '\x1b[31m✗\x1b[0m' : '✗');
         console.log(`  ${status} ${c.key}: ${c.maskedValue}`);
       }
     }

     // Configured connectors
     console.log('\n=== Configured Connectors ===\n');

     const configuredKeys = Object.keys(env).filter((k) =>
       k.includes('API_KEY') || k.includes('HOST')
     );

     if (configuredKeys.length === 0) {
       console.log('  No connectors configured');
       console.log('  Run "bonklm wizard" to set up connectors');
     } else {
       for (const key of configuredKeys) {
         const status = supportsColor ? '\x1b[32m✓\x1b[0m' : '✓';
         console.log(`  ${status} ${key}`);
       }
     }

     console.log('');
   }
   ```

2. **Create tests** (80% coverage)

---

## Story 6.4: Progress Indicators (2 points)

**File:** `src/utils/progress.ts`

### Steps

1. **Implement withSpinner() helper**
   ```typescript
   import * as p from '@clack/prompts';
   import { getTerminalCapabilities } from './terminal.js';

   export async function withSpinner<T>(
     message: string,
     fn: () => Promise<T>
   ): Promise<T> {
     const { isTTY } = getTerminalCapabilities();

     if (!isTTY) {
       console.log(message);
       return await fn();
     }

     const spin = p.spinner();
     spin.start(message);

     try {
       const result = await fn();
       spin.stop(`${message} ✓`);
       return result;
     } catch (error) {
       spin.stop(`${message} ✗`);
       throw error;
     }
   }
   ```

2. **Create tests** (80% coverage, mock getTerminalCapabilities)

---

## Epic Completion Checklist

- [ ] All 4 stories implemented
- [ ] Wizard command flow working
- [ ] Connector add command working
- [ ] Status command working
- [ ] Progress indicators working
- [ ] Clack prompts integrated
- [ ] JSON mode supported
- [ ] Non-TTY handling working

---

## All Epics Complete - Project Ready for Development

**Final Checklist:**
- [ ] All 23 stories implemented across 6 epics
- [ ] All tests passing with required coverage
- [ ] Security patterns enforced throughout
- [ ] CLI fully functional
- [ ] Detection engine working
- [ ] Connector system operational
- [ ] Testing framework in place
- [ ] Wizard UX complete

**Ready for:** Code review, QA testing, Production deployment
