/**
 * Configuration validation module
 *
 * Provides utilities for validating configuration objects.
 *
 * @package @blackunicorn/bonklm
 */

export {
  Schema,
  NumberRangeRule,
  TypeRule,
  EnumRule,
  FunctionRule,
  ArrayRule,
  ObjectRule,
  OptionalRule,
  CustomRule,
  ConfigValidationError,
  Validators,
  type ConfigValidationResult,
  type ValidationRule,
} from './ConfigValidator.js';
