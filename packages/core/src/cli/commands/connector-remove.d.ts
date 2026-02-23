/**
 * Connector Remove Command
 *
 * Remove a connector configuration.
 *
 * @module commands/connector-remove
 */
import { Command } from 'commander';
/**
 * Connector remove command implementation
 *
 * This command removes a connector configuration:
 * 1. Validates connector ID exists
 * 2. Shows what will be removed
 * 3. Removes env entries for that connector
 * 4. Writes updated .env file
 * 5. Logs audit event
 *
 * Full implementation will be in EPIC-6
 */
export declare const connectorRemoveCommand: Command;
//# sourceMappingURL=connector-remove.d.ts.map