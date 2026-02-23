/**
 * Configuration Validator
 *
 * Provides utilities for validating configuration objects.
 *
 * @package @blackunicorn/bonklm
 */

/**
 * Config validation error
 */
export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown
  ) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Config validation result
 */
export interface ConfigValidationResult {
  valid: boolean;
  errors: ConfigValidationError[];
}

/**
 * Validation rule
 */
export interface ValidationRule {
  /** Validate a value */
  validate(value: unknown, path?: string): ConfigValidationError | undefined;
}

/**
 * Number range rule
 */
export class NumberRangeRule implements ValidationRule {
  constructor(
    private readonly min?: number,
    private readonly max?: number,
    private readonly inclusive: boolean = true
  ) {}

  validate(value: unknown, path?: string): ConfigValidationError | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return new ConfigValidationError(
        `Value must be a number`,
        path,
        value
      );
    }

    if (this.min !== undefined) {
      const valid = this.inclusive ? value >= this.min : value > this.min;
      if (!valid) {
        return new ConfigValidationError(
          `Value must be ${this.inclusive ? '>=' : '>'} ${this.min}`,
          path,
          value
        );
      }
    }

    if (this.max !== undefined) {
      const valid = this.inclusive ? value <= this.max : value < this.max;
      if (!valid) {
        return new ConfigValidationError(
          `Value must be ${this.inclusive ? '<=' : '<'} ${this.max}`,
          path,
          value
        );
      }
    }

    return undefined;
  }
}

/**
 * Type rule
 */
export class TypeRule implements ValidationRule {
  constructor(private readonly expectedType: string) {}

  validate(value: unknown, path?: string): ConfigValidationError | undefined {
    const actualType = Array.isArray(value) ? 'array' : typeof value;

    if (actualType !== this.expectedType) {
      return new ConfigValidationError(
        `Value must be of type ${this.expectedType}`,
        path,
        value
      );
    }

    return undefined;
  }
}

/**
 * Enum rule
 */
export class EnumRule implements ValidationRule {
  constructor(private readonly allowedValues: readonly unknown[]) {}

  validate(value: unknown, path?: string): ConfigValidationError | undefined {
    if (!this.allowedValues.includes(value)) {
      return new ConfigValidationError(
        `Value must be one of: ${this.allowedValues.join(', ')}`,
        path,
        value
      );
    }

    return undefined;
  }
}

/**
 * Function rule
 */
export class FunctionRule implements ValidationRule {
  validate(value: unknown, path?: string): ConfigValidationError | undefined {
    if (typeof value !== 'function') {
      return new ConfigValidationError(
        `Value must be a function`,
        path,
        value
      );
    }

    return undefined;
  }
}

/**
 * Array rule
 */
export class ArrayRule implements ValidationRule {
  constructor(
    private readonly itemRule?: ValidationRule,
    private readonly minLength?: number,
    private readonly maxLength?: number
  ) {}

  validate(value: unknown, path?: string): ConfigValidationError | undefined {
    if (!Array.isArray(value)) {
      return new ConfigValidationError(
        `Value must be an array`,
        path,
        value
      );
    }

    if (this.minLength !== undefined && value.length < this.minLength) {
      return new ConfigValidationError(
        `Array must have at least ${this.minLength} items`,
        path,
        value
      );
    }

    if (this.maxLength !== undefined && value.length > this.maxLength) {
      return new ConfigValidationError(
        `Array must have at most ${this.maxLength} items`,
        path,
        value
      );
    }

    // Validate array items
    if (this.itemRule) {
      for (let i = 0; i < value.length; i++) {
        const error = this.itemRule.validate(
          value[i],
          path ? `${path}[${i}]` : `[${i}]`
        );
        if (error) {
          return error;
        }
      }
    }

    return undefined;
  }
}

/**
 * Object rule
 */
export class ObjectRule implements ValidationRule {
  constructor(
    private readonly properties?: Record<string, ValidationRule>,
    private readonly allowUnknown: boolean = true
  ) {}

  validate(value: unknown, path?: string): ConfigValidationError | undefined {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return new ConfigValidationError(
        `Value must be an object`,
        path,
        value
      );
    }

    // Validate known properties
    if (this.properties) {
      for (const [key, rule] of Object.entries(this.properties)) {
        const error = rule.validate(
          (value as Record<string, unknown>)[key],
          path ? `${path}.${key}` : key
        );
        if (error) {
          return error;
        }
      }
    }

    // Check for unknown properties
    if (!this.allowUnknown && this.properties) {
      const unknownKeys = Object.keys(value).filter(
        (key) => !(key in (this.properties || {}))
      );
      if (unknownKeys.length > 0) {
        return new ConfigValidationError(
          `Unknown properties: ${unknownKeys.join(', ')}`,
          path,
          value
        );
      }
    }

    return undefined;
  }
}

/**
 * Optional rule - allows undefined or null
 */
export class OptionalRule implements ValidationRule {
  constructor(private readonly rule: ValidationRule) {}

  validate(value: unknown, path?: string): ConfigValidationError | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    return this.rule.validate(value, path);
  }
}

/**
 * Custom rule
 */
export class CustomRule implements ValidationRule {
  constructor(
    private readonly validator: (value: unknown, path?: string) => ConfigValidationError | undefined
  ) {}

  validate(value: unknown, path?: string): ConfigValidationError | undefined {
    return this.validator(value, path);
  }
}

/**
 * Schema - combines multiple rules for validation
 */
export class Schema {
  constructor(private readonly rules: Record<string, ValidationRule>) {}

  /**
   * Validate a configuration object
   */
  validate(config: Record<string, unknown>): ConfigValidationResult {
    const errors: ConfigValidationError[] = [];

    for (const [key, rule] of Object.entries(this.rules)) {
      const error = rule.validate(config[key], key);
      if (error) {
        errors.push(error);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate and throw if invalid
   */
  validateOrThrow(config: Record<string, unknown>): void {
    const result = this.validate(config);

    if (!result.valid) {
      const messages = result.errors.map(
        (e) => `${e.field ? `${e.field  }: ` : ''}${e.message}${e.value !== undefined ? ` (received: ${JSON.stringify(e.value)})` : ''}`
      );

      throw new ConfigValidationError(
        `Configuration validation failed:\n  - ${messages.join('\n  - ')}`
      );
    }
  }
}

/**
 * Pre-defined validators for common config options
 */
export const Validators = {
  /** Positive number */
  positiveNumber: (min: number = 0) =>
    new NumberRangeRule(min === 0 ? undefined : min, undefined),

  /** Percentage (0-100) */
  percentage: new NumberRangeRule(0, 100),

  /** Timeout (ms) - must be positive */
  timeout: new NumberRangeRule(0, 3600000), // Max 1 hour

  /** Boolean */
  boolean: new TypeRule('boolean'),

  /** String */
  string: new TypeRule('string'),

  /** Number */
  number: new TypeRule('number'),

  /** Function */
  function: new FunctionRule(),

  /** Array */
  array: (itemRule?: ValidationRule, minLength?: number, maxLength?: number) =>
    new ArrayRule(itemRule, minLength, maxLength),

  /** Object */
  object: (properties?: Record<string, ValidationRule>, allowUnknown?: boolean) =>
    new ObjectRule(properties, allowUnknown),

  /** Enum */
  enum: (values: readonly unknown[]) => new EnumRule(values),

  /** Optional */
  optional: (rule: ValidationRule) => new OptionalRule(rule),

  /** Custom */
  custom: (validator: (value: unknown, path?: string) => ConfigValidationError | undefined) =>
    new CustomRule(validator),
};
