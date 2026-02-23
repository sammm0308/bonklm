/**
 * Connector Add Command
 *
 * Add a single connector configuration to the .env file.
 *
 * This command:
 * 1. Validates connector ID exists
 * 2. Checks for existing credentials in environment
 * 3. Collects credentials via secure password prompt
 * 4. Tests connector before saving (unless --force is used)
 * 5. Writes configuration to .env file
 * 6. Logs audit event
 *
 * @module commands/connector-add
 */
import { Command } from 'commander';
/**
 * Connector add command implementation
 */
export declare const connectorAddCommand: Command;
//# sourceMappingURL=connector-add.d.ts.map