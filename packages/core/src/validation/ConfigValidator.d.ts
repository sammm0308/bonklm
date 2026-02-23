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
export declare class ConfigValidationError extends Error {
    readonly field?: string | undefined;
    readonly value?: unknown | undefined;
    constructor(message: string, field?: string | undefined, value?: unknown | undefined);
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
export declare class NumberRangeRule implements ValidationRule {
    private readonly min?;
    private readonly max?;
    private readonly inclusive;
    constructor(min?: number | undefined, max?: number | undefined, inclusive?: boolean);
    validate(value: unknown, path?: string): ConfigValidationError | undefined;
}
/**
 * Type rule
 */
export declare class TypeRule implements ValidationRule {
    private readonly expectedType;
    constructor(expectedType: string);
    validate(value: unknown, path?: string): ConfigValidationError | undefined;
}
/**
 * Enum rule
 */
export declare class EnumRule implements ValidationRule {
    private readonly allowedValues;
    constructor(allowedValues: readonly unknown[]);
    validate(value: unknown, path?: string): ConfigValidationError | undefined;
}
/**
 * Function rule
 */
export declare class FunctionRule implements ValidationRule {
    validate(value: unknown, path?: string): ConfigValidationError | undefined;
}
/**
 * Array rule
 */
export declare class ArrayRule implements ValidationRule {
    private readonly itemRule?;
    private readonly minLength?;
    private readonly maxLength?;
    constructor(itemRule?: ValidationRule | undefined, minLength?: number | undefined, maxLength?: number | undefined);
    validate(value: unknown, path?: string): ConfigValidationError | undefined;
}
/**
 * Object rule
 */
export declare class ObjectRule implements ValidationRule {
    private readonly properties?;
    private readonly allowUnknown;
    constructor(properties?: Record<string, ValidationRule> | undefined, allowUnknown?: boolean);
    validate(value: unknown, path?: string): ConfigValidationError | undefined;
}
/**
 * Optional rule - allows undefined or null
 */
export declare class OptionalRule implements ValidationRule {
    private readonly rule;
    constructor(rule: ValidationRule);
    validate(value: unknown, path?: string): ConfigValidationError | undefined;
}
/**
 * Custom rule
 */
export declare class CustomRule implements ValidationRule {
    private readonly validator;
    constructor(validator: (value: unknown, path?: string) => ConfigValidationError | undefined);
    validate(value: unknown, path?: string): ConfigValidationError | undefined;
}
/**
 * Schema - combines multiple rules for validation
 */
export declare class Schema {
    private readonly rules;
    constructor(rules: Record<string, ValidationRule>);
    /**
     * Validate a configuration object
     */
    validate(config: Record<string, unknown>): ConfigValidationResult;
    /**
     * Validate and throw if invalid
     */
    validateOrThrow(config: Record<string, unknown>): void;
}
/**
 * Pre-defined validators for common config options
 */
export declare const Validators: {
    /** Positive number */
    positiveNumber: (min?: number) => NumberRangeRule;
    /** Percentage (0-100) */
    percentage: NumberRangeRule;
    /** Timeout (ms) - must be positive */
    timeout: NumberRangeRule;
    /** Boolean */
    boolean: TypeRule;
    /** String */
    string: TypeRule;
    /** Number */
    number: TypeRule;
    /** Function */
    function: FunctionRule;
    /** Array */
    array: (itemRule?: ValidationRule, minLength?: number, maxLength?: number) => ArrayRule;
    /** Object */
    object: (properties?: Record<string, ValidationRule>, allowUnknown?: boolean) => ObjectRule;
    /** Enum */
    enum: (values: readonly unknown[]) => EnumRule;
    /** Optional */
    optional: (rule: ValidationRule) => OptionalRule;
    /** Custom */
    custom: (validator: (value: unknown, path?: string) => ConfigValidationError | undefined) => CustomRule;
};
//# sourceMappingURL=ConfigValidator.d.ts.map