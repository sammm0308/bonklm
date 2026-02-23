"use strict";
/**
 * @blackunicorn/bonklm-chroma
 *
 * ChromaDB connector for LLM-Guardrails.
 *
 * Provides security guardrails for ChromaDB vector database operations
 * in RAG applications.
 *
 * @package @blackunicorn/bonklm-chroma
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MAX_N_RESULTS = exports.DEFAULT_VALIDATION_TIMEOUT = exports.createGuardedCollection = void 0;
var guarded_chroma_js_1 = require("./guarded-chroma.js");
Object.defineProperty(exports, "createGuardedCollection", { enumerable: true, get: function () { return guarded_chroma_js_1.createGuardedCollection; } });
var types_js_1 = require("./types.js");
Object.defineProperty(exports, "DEFAULT_VALIDATION_TIMEOUT", { enumerable: true, get: function () { return types_js_1.DEFAULT_VALIDATION_TIMEOUT; } });
Object.defineProperty(exports, "DEFAULT_MAX_N_RESULTS", { enumerable: true, get: function () { return types_js_1.DEFAULT_MAX_N_RESULTS; } });
//# sourceMappingURL=index.js.map