/**
 * Connector Remove Command
 *
 * Remove a connector configuration.
 *
 * @module commands/connector-remove
 */
import { Command } from 'commander';
import { WizardError } from '../utils/error.js';
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
export const connectorRemoveCommand = new Command('remove')
    .argument('<id>', 'Connector ID (e.g., openai, anthropic, ollama)')
    .description('Remove a connector configuration')
    .option('--yes', 'Skip confirmation prompt')
    .action(async (id, _options) => {
    // TODO: Implement connector remove in EPIC-6
    throw new WizardError('NOT_IMPLEMENTED', `Connector remove command is not yet implemented for: ${id}`, 'See EPIC-6 for implementation details', undefined, 2 // Partial - CLI is functional, remove is not
    );
});
//# sourceMappingURL=connector-remove.js.map