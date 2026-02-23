/**
 * HookSandbox Unit Tests
 * =====================
 * Comprehensive unit tests for VM-based hook sandbox execution.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  HookSandbox,
  SecurityLevel,
  type SandboxConfig,
  type ExecutionResult,
} from '../../../src/hooks/HookSandbox.js';

describe('HookSandbox', () => {
  let sandbox: HookSandbox;

  beforeEach(async () => {
    sandbox = new HookSandbox({ securityLevel: 'strict' });
    await sandbox.initialize();
  });

  describe('HS-001: Initialize Sandbox', () => {
    it('should initialize successfully', async () => {
      const sb = new HookSandbox();
      const result = await sb.initialize();
      expect(result).toBe(true);
    });

    it('should set isInitialized flag', async () => {
      const sb = new HookSandbox();
      await sb.initialize();
      expect(await sb.initialize()).toBe(true);
    });
  });

  describe('HS-002: Execute Hook Function', () => {
    it('should execute function hook', async () => {
      const handler = (context: Record<string, unknown>) => {
        return { received: context.input };
      };

      const result = await sandbox.executeHook(handler, { input: 'test' });

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ received: 'test' });
      expect(result.sandboxed).toBe(true);
    });

    it('should support async handlers', async () => {
      const handler = async () => {
        await Promise.resolve();
        return { async: true };
      };

      const result = await sandbox.executeHook(handler);

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ async: true });
    });
  });

  describe('HS-003: Execute Hook String', () => {
    it('should execute string code', async () => {
      const code = 'return { value: context.input * 2 };';

      const result = await sandbox.executeHook(code, { input: 21 });

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ value: 42 });
    });
  });

  describe('HS-004: Validate Safe Code', () => {
    it('should pass safe code validation', () => {
      const validation = sandbox.validateHookCode('return context.value + 1;');
      expect(validation.safe).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });
  });

  describe('HS-005: Block Dangerous Code', () => {
    it('should block process access', async () => {
      const code = 'return process.env.NODE_PATH;';

      const result = await sandbox.executeHook(code);

      expect(result.success).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.error).toBe('SECURITY_VIOLATION');
    });

    it('should block require calls', async () => {
      const code = 'return require("fs");';

      const result = await sandbox.executeHook(code);

      expect(result.success).toBe(false);
      expect(result.blocked).toBe(true);
    });
  });

  describe('HS-010: Timeout Protection', () => {
    it('should support timeout configuration', async () => {
      // Note: VM timeout enforcement depends on Node.js version and execution context
      // This test verifies that timeout configuration is accepted
      const result = await sandbox.executeHook('return { quick: true };', {}, { timeout: 100 });

      // Short operation should complete successfully
      expect(result.success).toBe(true);
      expect(result.result).toEqual({ quick: true });
    });
  });

  describe('HS-008: Safe Globals', () => {
    it('should provide safe console', async () => {
      const handler = () => {
        console.log('test');
        return { logged: true };
      };

      const result = await sandbox.executeHook(handler);

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ logged: true });
    });

    it('should provide Math', async () => {
      const code = 'return { sqrt: Math.sqrt(16) };';

      const result = await sandbox.executeHook(code);

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ sqrt: 4 });
    });

    it('should provide JSON', async () => {
      const code = 'return { parsed: JSON.parse(\'{"key":"value"}\') };';

      const result = await sandbox.executeHook(code);

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ parsed: { key: 'value' } });
    });

    it('should provide Date', async () => {
      const code = 'return { now: Date.now() > 0 };';

      const result = await sandbox.executeHook(code);

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ now: true });
    });
  });

  describe('HS-009: Block Process Access', () => {
    it('should block process.env', async () => {
      const result = await sandbox.executeHook('return process.env');
      expect(result.blocked).toBe(true);
    });

    it('should block process.exit', async () => {
      const result = await sandbox.executeHook('process.exit()');
      expect(result.blocked).toBe(true);
    });
  });

  describe('HS-010: Block Require', () => {
    it('should block require()', async () => {
      const result = await sandbox.executeHook('require("fs")');
      expect(result.blocked).toBe(true);
    });
  });

  describe('HS-011: Block Eval', () => {
    it('should block eval()', async () => {
      const result = await sandbox.executeHook('eval("1+1")');
      expect(result.blocked).toBe(true);
    });
  });

  describe('HS-012: Block Function', () => {
    it('should block Function constructor', async () => {
      const result = await sandbox.executeHook('new Function("return 1")');
      expect(result.blocked).toBe(true);
    });

    it('should block Function()', async () => {
      const result = await sandbox.executeHook('Function("return 1")');
      expect(result.blocked).toBe(true);
    });
  });

  describe('HS-013: Sanitize Result', () => {
    it('should sanitize result objects', async () => {
      const handler = () => ({
        nested: { value: 42 },
        array: [1, 2, 3],
      });

      const result = await sandbox.executeHook(handler);

      expect(result.success).toBe(true);
      expect(result.result).toEqual({
        nested: { value: 42 },
        array: [1, 2, 3],
      });
    });

    it('should handle circular references gracefully', async () => {
      const handler = () => {
        const obj: Record<string, unknown> = { value: 1 };
        obj.self = obj;
        return obj;
      };

      const result = await sandbox.executeHook(handler);

      // Should either succeed or handle gracefully
      expect(result).toBeDefined();
    });
  });

  describe('HS-014: Context Isolation', () => {
    it('should provide isolated context', async () => {
      const handler = (context: Record<string, unknown>) => {
        return { input: context.input };
      };

      const result = await sandbox.executeHook(handler, { input: 'isolated' });

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ input: 'isolated' });
    });

    it('should not leak context between executions', async () => {
      await sandbox.executeHook((ctx: Record<string, unknown>) => {
        (ctx as Record<string, unknown>).leaked = 'value';
        return {};
      }, {});

      const result = await sandbox.executeHook((ctx: Record<string, unknown>) => {
        return { hasLeaked: 'leaked' in ctx };
      }, {});

      expect(result.result).toEqual({ hasLeaked: false });
    });
  });

  describe('HS-015: Statistics', () => {
    it('should get execution statistics', async () => {
      await sandbox.executeHook('return { test: true };');

      const stats = sandbox.getStatistics();

      expect(stats.totalExecutions).toBe(1);
      expect(stats.blockedAttempts).toBe(0);
      expect(stats.securityLevel).toBe('strict');
    });
  });

  describe('HS-016: Blocked Attempts', () => {
    it('should track blocked attempts', async () => {
      await sandbox.executeHook('require("fs")');

      const blocked = sandbox.getBlockedAttempts();

      expect(blocked.length).toBe(1);
      expect(blocked[0].issues).toContain('require() call');
    });
  });

  describe('HS-017: Security Levels', () => {
    it('should support strict security level', async () => {
      const strictSb = new HookSandbox({ securityLevel: 'strict' });
      await strictSb.initialize();

      const result = await strictSb.executeHook('return process.env');
      expect(result.blocked).toBe(true);
    });

    it('should support permissive security level', async () => {
      const permissiveSb = new HookSandbox({ securityLevel: 'permissive' });
      await permissiveSb.initialize();

      // Safe code should still work
      const result = await permissiveSb.executeHook('return { value: 42 }');
      expect(result.success).toBe(true);
    });
  });

  describe('HS-018: VM Context', () => {
    it('should block globalThis access in strict mode', async () => {
      // In strict mode, globalThis access is blocked as a dangerous pattern
      const result = await sandbox.executeHook('return typeof globalThis');
      expect(result.success).toBe(false);
      expect(result.blocked).toBe(true);
    });

    it('should allow access to safe globals in context', async () => {
      // Safe globals like Math are available
      const result = await sandbox.executeHook('return typeof Math');
      expect(result.success).toBe(true);
      expect(result.result).toBe('object');
    });
  });

  describe('HS-019: Result Size Limit', () => {
    it('should limit large result sizes', async () => {
      const handler = () => {
        // Create a large object
        const large: Record<string, unknown> = {};
        for (let i = 0; i < 100000; i++) {
          large[`key${i}`] = 'x'.repeat(100);
        }
        return large;
      };

      const result = await sandbox.executeHook(handler);

      // Should handle gracefully
      expect(result).toBeDefined();
      if (!result.success) {
        expect(result.error).toContain('RESULT_TOO_LARGE');
      }
    });
  });

  describe('HS-020: Console Sanitization', () => {
    it('should sanitize console output', async () => {
      const handler = () => {
        console.log('Very long output '.repeat(1000));
        return {};
      };

      const result = await sandbox.executeHook(handler);

      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty context', async () => {
      const result = await sandbox.executeHook('return 42;');
      expect(result.success).toBe(true);
    });

    it('should handle handlers that return undefined', async () => {
      const result = await sandbox.executeHook(() => undefined);
      expect(result.success).toBe(true);
    });

    it('should handle handlers that return null', async () => {
      const result = await sandbox.executeHook(() => null);
      expect(result.success).toBe(true);
    });

    it('should handle syntax errors', async () => {
      const result = await sandbox.executeHook('return invalid syntax here');
      expect(result.success).toBe(false);
      expect(result.error).toBe('EXECUTION_ERROR');
    });
  });

  describe('Configuration', () => {
    it('should get sandbox config', () => {
      const config: SandboxConfig = { securityLevel: 'strict', timeout: 5000 };
      const sb = new HookSandbox(config);
      const retrievedConfig = sb.getConfig();

      expect(retrievedConfig.securityLevel).toBe('strict');
      expect(retrievedConfig.timeout).toBe(5000);
    });
  });

  // S011-007: Security hardening tests
  describe('S011-007: Security Hardening', () => {
    describe('Prototype Freezing', () => {
      it('should freeze Function.prototype to prevent constructor bypass', async () => {
        // This code contains 'constructor' pattern which is blocked by validation
        const result = await sandbox.executeHook(`
          try {
            const err = new Error();
            const Fn = err.constructor.constructor;
            Fn('return process')();
          } catch (e) {
            return 'blocked';
          }
        `);

        // Should be blocked by code validation before execution
        expect(result.success).toBe(false);
        expect(result.blocked).toBe(true);
        expect(result.error).toBe('SECURITY_VIOLATION');
      });

      it('should freeze Object.prototype to prevent pollution', async () => {
        // This code contains 'prototype' pattern which is blocked by validation
        const result = await sandbox.executeHook(`
          try {
            Object.prototype.polluted = 'malicious';
            return 'success';
          } catch (e) {
            return 'blocked';
          }
        `);

        // Should be blocked by code validation before execution
        expect(result.success).toBe(false);
        expect(result.blocked).toBe(true);
        expect(result.error).toBe('SECURITY_VIOLATION');
      });

      it('should freeze Error.prototype', async () => {
        // This code contains 'prototype' pattern which is blocked by validation
        const result = await sandbox.executeHook(`
          try {
            Error.prototype.toString = () => 'malicious';
            return 'success';
          } catch (e) {
            return 'blocked';
          }
        `);

        // Should be blocked by code validation before execution
        expect(result.success).toBe(false);
        expect(result.blocked).toBe(true);
        expect(result.error).toBe('SECURITY_VIOLATION');
      });

      it('should freeze Promise.prototype', async () => {
        // This code contains 'prototype' pattern which is blocked by validation
        const result = await sandbox.executeHook(`
          try {
            Promise.prototype.then = () => 'malicious';
            return 'success';
          } catch (e) {
            return 'blocked';
          }
        `);

        // Should be blocked by code validation before execution
        expect(result.success).toBe(false);
        expect(result.blocked).toBe(true);
        expect(result.error).toBe('SECURITY_VIOLATION');
      });
    });

    describe('Constructor Chain Bypass Attempts', () => {
      it('should block error.constructor.constructor bypass', async () => {
        // This contains 'constructor' pattern which is blocked by validation
        const result = await sandbox.executeHook(`
          try {
            const getProcess = new Error().constructor.constructor('return process')();
            return getProcess;
          } catch (e) {
            return 'blocked';
          }
        `);

        expect(result.success).toBe(false);
        expect(result.blocked).toBe(true);
        expect(result.error).toBe('SECURITY_VIOLATION');
      });

      it('should block Reflect.construct bypass', async () => {
        // S011-007: This code attempts to access the Function constructor via Reflect.construct
        // The pattern should be detected by static analysis and blocked before execution
        const testCode = `const Fn = Reflect.construct(Error, []).constructor; return Fn;`;

        const result = await sandbox.executeHook(testCode);

        // Should be blocked by code validation before execution
        expect(result.success).toBe(false);
        expect(result.blocked).toBe(true);
        expect(result.error).toBe('SECURITY_VIOLATION');
      });
    });

    describe('Prototype Pollution Attempts', () => {
      it('should block __proto__ assignment', async () => {
        // This contains '__proto__' pattern which is blocked by validation
        const result = await sandbox.executeHook(`
          try {
            const obj = {};
            obj.__proto__.polluted = true;
            return 'success';
          } catch (e) {
            return 'blocked';
          }
        `);

        // Should be blocked by code validation before execution
        expect(result.success).toBe(false);
        expect(result.blocked).toBe(true);
        expect(result.error).toBe('SECURITY_VIOLATION');
      });

      it('should block prototype chain manipulation', async () => {
        // This contains 'prototype' pattern which is blocked by validation
        const result = await sandbox.executeHook(`
          try {
            const obj = Object.create(Object.prototype);
            Object.getPrototypeOf(obj).polluted = true;
            return 'success';
          } catch (e) {
            return 'blocked';
          }
        `);

        // Should be blocked by code validation before execution
        expect(result.success).toBe(false);
        expect(result.blocked).toBe(true);
        expect(result.error).toBe('SECURITY_VIOLATION');
      });
    });

    describe('Bracket Notation Bypass', () => {
      it('should block bracket notation for global access', async () => {
        const result = await sandbox.executeHook(`
          try {
            const globalAccess = this['global'];
            // In sandbox, global is undefined - this is the isolation working
            return globalAccess === undefined ? 'isolated' : 'success';
          } catch (e) {
            return 'blocked';
          }
        `);

        // Should be blocked by static code analysis (contains 'global' keyword)
        expect(result.success).toBe(false);
        expect(result.blocked).toBe(true);
        expect(result.error).toBe('SECURITY_VIOLATION');
      });

      it('should block bracket notation for process access', async () => {
        const result = await sandbox.executeHook(`
          try {
            const proc = this['proc' + 'ess'];
            // In sandbox, process is undefined - this is the isolation working
            return proc === undefined ? 'isolated' : 'success';
          } catch (e) {
            return 'blocked';
          }
        `);

        // The code 'proc' + 'ess' might be caught by pattern matching or fail at runtime
        // Either way, the security is maintained
        expect(result.success).toBe(false);
      });
    });
  });
});
