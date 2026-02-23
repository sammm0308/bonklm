/**
 * Terminal capability detection for the BonkLM Installation Wizard
 *
 * This module provides utilities to detect terminal capabilities such as:
 * - TTY availability (interactive terminal)
 * - Color support
 * - Terminal width
 *
 * These capabilities are used to adapt the UI for different environments.
 */
/**
 * Terminal capabilities interface
 *
 * Describes the detected capabilities of the current terminal.
 */
export interface TerminalCapabilities {
    /** True if running in an interactive terminal (TTY) */
    isTTY: boolean;
    /** True if the terminal supports ANSI color codes */
    supportsColor: boolean;
    /** Terminal width in columns (default 80 if not detectable) */
    width: number;
    /** Terminal height in rows (default 24 if not detectable) */
    height: number;
}
/**
 * Color level for more granular color support detection
 */
export type ColorLevel = 0 | 1 | 2 | 3;
/**
 * Detailed terminal information with color level
 */
export interface DetailedTerminalCapabilities extends TerminalCapabilities {
    /** Color support level (0=none, 1=16, 2=256, 3=16m) */
    colorLevel: ColorLevel;
    /** True if running in a CI environment */
    isCI: boolean;
}
/**
 * Gets basic terminal capabilities
 *
 * Detects TTY, color support, and dimensions for the current terminal.
 *
 * @returns Terminal capabilities object
 */
export declare function getTerminalCapabilities(): TerminalCapabilities;
/**
 * Gets detailed terminal capabilities
 *
 * Provides more detailed information including color level and CI detection.
 *
 * @returns Detailed terminal capabilities object
 */
export declare function getDetailedTerminalCapabilities(): DetailedTerminalCapabilities;
/**
 * Checks if the terminal supports a specific color level
 *
 * @param level - Minimum color level required
 * @returns True if terminal supports at least the specified color level
 */
export declare function supportsColorLevel(level: ColorLevel): boolean;
/**
 * Gets the appropriate cursor control codes for the terminal
 *
 * Returns ANSI escape sequences for cursor movement if supported.
 *
 * @returns Object with cursor control functions or no-ops if not supported
 */
export declare function getCursorControls(): {
    up: (lines: number) => string;
    down: (lines: number) => string;
    left: (cols: number) => string;
    right: (cols: number) => string;
    clearLine: () => string;
    clearScreen: () => string;
};
/**
 * Formats text with color if supported
 *
 * @param text - Text to color
 * @param color - ANSI color code (e.g., 31 for red, 32 for green)
 * @returns Text with color codes or plain text if not supported
 */
export declare function colorize(text: string, color: number): string;
/**
 * Color helper functions
 */
export declare const colors: {
    readonly reset: (text: string) => string;
    readonly bold: (text: string) => string;
    readonly dim: (text: string) => string;
    readonly red: (text: string) => string;
    readonly green: (text: string) => string;
    readonly yellow: (text: string) => string;
    readonly blue: (text: string) => string;
    readonly magenta: (text: string) => string;
    readonly cyan: (text: string) => string;
    readonly gray: (text: string) => string;
};
//# sourceMappingURL=terminal.d.ts.map