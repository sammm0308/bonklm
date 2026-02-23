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
 * Detects if running in a CI environment
 *
 * Checks common CI environment variables.
 */
function detectCI() {
    const ciVars = [
        'CI',
        'GITHUB_ACTIONS',
        'GITLAB_CI',
        'JENKINS_URL',
        'TRAVIS',
        'CIRCLECI',
        'APPVEYOR',
        'BUILDKITE',
        'GO_PIPELINE_LABEL',
    ];
    return ciVars.some((varName) => process.env[varName] !== undefined);
}
/**
 * Detects the color support level
 *
 * Based on the COLORTERM environment variable and common terminal detection.
 */
function detectColorLevel() {
    const { env } = process;
    // Explicit check for truecolor/24-bit support
    if (env.COLORTERM === 'truecolor' || env.COLORTERM === '24bit') {
        return 3;
    }
    // Check TERM variable
    const term = env.TERM || '';
    // 256-color terminals
    if (term.includes('256color') ||
        term === 'xterm-256color' ||
        term === 'screen-256color' ||
        term === 'tmux-256color') {
        return 2;
    }
    // Basic color support (16 colors)
    if (term.includes('color') ||
        term === 'xterm' ||
        term === 'screen' ||
        term === 'tmux' ||
        env.TERM_PROGRAM === 'Apple_Terminal' ||
        env.TERM_PROGRAM === 'iTerm.app') {
        return 1;
    }
    // No color support
    return 0;
}
/**
 * Gets basic terminal capabilities
 *
 * Detects TTY, color support, and dimensions for the current terminal.
 *
 * @returns Terminal capabilities object
 */
export function getTerminalCapabilities() {
    return {
        isTTY: Boolean(process.stdout.isTTY),
        supportsColor: process.env.FORCE_COLOR !== '0' && Boolean(process.stdout.isTTY),
        width: process.stdout.columns || 80,
        height: process.stdout.rows || 24,
    };
}
/**
 * Gets detailed terminal capabilities
 *
 * Provides more detailed information including color level and CI detection.
 *
 * @returns Detailed terminal capabilities object
 */
export function getDetailedTerminalCapabilities() {
    const isCI = detectCI();
    const colorLevel = detectColorLevel();
    // In CI, disable TTY detection (most CI environments fake TTY)
    const isTTY = isCI ? false : Boolean(process.stdout.isTTY);
    // FORCE_COLOR can override color level detection
    const forceColor = process.env.FORCE_COLOR;
    let effectiveColorLevel = colorLevel;
    if (forceColor !== undefined) {
        if (forceColor === '0') {
            effectiveColorLevel = 0;
        }
        else if (forceColor === '1') {
            effectiveColorLevel = 1;
        }
        else if (forceColor === '2') {
            effectiveColorLevel = 2;
        }
        else if (forceColor === '3' || forceColor === 'true') {
            effectiveColorLevel = 3;
        }
    }
    return {
        isTTY,
        supportsColor: effectiveColorLevel > 0,
        width: process.stdout.columns || 80,
        height: process.stdout.rows || 24,
        colorLevel: effectiveColorLevel,
        isCI,
    };
}
/**
 * Checks if the terminal supports a specific color level
 *
 * @param level - Minimum color level required
 * @returns True if terminal supports at least the specified color level
 */
export function supportsColorLevel(level) {
    const caps = getDetailedTerminalCapabilities();
    return caps.colorLevel >= level;
}
/**
 * Gets the appropriate cursor control codes for the terminal
 *
 * Returns ANSI escape sequences for cursor movement if supported.
 *
 * @returns Object with cursor control functions or no-ops if not supported
 */
export function getCursorControls() {
    const caps = getTerminalCapabilities();
    if (!caps.isTTY) {
        // Return no-op functions for non-TTY environments
        return {
            up: () => '',
            down: () => '',
            left: () => '',
            right: () => '',
            clearLine: () => '',
            clearScreen: () => '',
        };
    }
    return {
        up: (lines) => `\x1b[${lines}A`,
        down: (lines) => `\x1b[${lines}B`,
        left: (cols) => `\x1b[${cols}D`,
        right: (cols) => `\x1b[${cols}C`,
        clearLine: () => '\x1b[2K',
        clearScreen: () => '\x1b[2J\x1b[H',
    };
}
/**
 * Formats text with color if supported
 *
 * @param text - Text to color
 * @param color - ANSI color code (e.g., 31 for red, 32 for green)
 * @returns Text with color codes or plain text if not supported
 */
export function colorize(text, color) {
    const caps = getTerminalCapabilities();
    if (!caps.supportsColor) {
        return text;
    }
    return `\x1b[${color}m${text}\x1b[0m`;
}
/**
 * Color helper functions
 */
export const colors = {
    reset: (text) => colorize(text, 0),
    bold: (text) => colorize(text, 1),
    dim: (text) => colorize(text, 2),
    red: (text) => colorize(text, 31),
    green: (text) => colorize(text, 32),
    yellow: (text) => colorize(text, 33),
    blue: (text) => colorize(text, 34),
    magenta: (text) => colorize(text, 35),
    cyan: (text) => colorize(text, 36),
    gray: (text) => colorize(text, 90),
};
//# sourceMappingURL=terminal.js.map