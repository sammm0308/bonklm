/**
 * Vercel AI SDK Guardrail Connector
 * =================================
 *
 * Main entry point for @blackunicorn/bonklm-vercel.
 *
 * @package @blackunicorn/bonklm-vercel
 */

// Main exports
export { createGuardedAI, messagesToText } from './guarded-ai.js';

// Error classes
export { StreamValidationError, ConnectorValidationError } from '@blackunicorn/bonklm/core/connector-utils';

// Type exports
export type {
  GuardedAIOptions,
  GuardedGenerateTextOptions,
  GuardedStreamOptions,
  GuardedTextResult,
} from './types.js';

// Constants
export {
  VALIDATION_INTERVAL,
  DEFAULT_MAX_BUFFER_SIZE,
  DEFAULT_VALIDATION_TIMEOUT,
} from './types.js';
