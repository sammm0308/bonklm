/**
 * Wizard Command
 *
 * Run interactive setup wizard for LLM-Guardrails connectors.
 *
 * This command orchestrates the complete setup flow:
 * 1. Detects frameworks in the project
 * 2. Detects available services (Ollama, vector DBs)
 * 3. Detects existing credentials in environment
 * 4. Presents connector options to the user
 * 5. Collects credentials securely via password prompts
 * 6. Tests all selected connectors
 * 7. Writes configuration to .env file
 * 8. Displays summary of results
 *
 * @module commands/wizard
 */
import { Command } from 'commander';
/**
 * Wizard command implementation
 */
export declare const wizardCommand: Command;
//# sourceMappingURL=wizard.d.ts.map