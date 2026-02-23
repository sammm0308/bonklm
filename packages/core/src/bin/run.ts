#!/usr/bin/env node
/**
 * BonkLM CLI
 *
 * Interactive setup wizard for BonkLM connectors.
 *
 * @package @blackunicorn/bonklm
 */

import { Command } from 'commander';
import { wizardCommand } from '../cli/commands/wizard.js';
import { connectorCommand } from '../cli/commands/connector.js';
import { statusCommand } from '../cli/commands/status.js';

const program = new Command();

program
  .name('bonklm')
  .description('BonkLM - LLM Security Guardrails')
  .version('0.1.0');

// Default to wizard if no command provided
program.action(() => {
  // Show help if no command provided - commander will handle this
});

// Add subcommands
program.addCommand(wizardCommand);
program.addCommand(connectorCommand);
program.addCommand(statusCommand);

// Parse and execute
program.parse();
