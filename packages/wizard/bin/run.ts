#!/usr/bin/env node
/**
 * BonkLM Installation Wizard CLI
 *
 * @deprecated This package is deprecated. Use @blackunicorn/bonklm instead.
 * The wizard functionality has been merged into the core package.
 *
 * Interactive setup wizard for BonkLM connectors.
 *
 * @package @blackunicorn/bonklm-wizard
 */

import { Command } from 'commander';
import { wizardCommand } from '../src/commands/wizard.js';
import { connectorCommand } from '../src/commands/connector.js';
import { statusCommand } from '../src/commands/status.js';

// Display deprecation warning
console.warn('\x1b[33m%s\x1b[0m', '⚠️  WARNING: @blackunicorn/bonklm-wizard is deprecated.');
console.warn('\x1b[33m%s\x1b[0m', 'Please use @blackunicorn/bonklm instead.');
console.warn('\x1b[33m%s\x1b[0m', 'The wizard functionality has been merged into the core package.');
console.warn('\x1b[33m%s\x1b[0m', '\nInstall with: npm install @blackunicorn/bonklm\n');

const program = new Command();

program
  .name('bonklm')
  .description('BonkLM Installation Wizard (DEPRECATED - use @blackunicorn/bonklm)')
  .version('0.1.0-deprecated');

// Add subcommands
program.addCommand(wizardCommand);
program.addCommand(connectorCommand);
program.addCommand(statusCommand);

// Parse and execute
program.parse();
