/**
 * Service Detection Module
 *
 * Detects running services on the local machine through:
 * - Port scanning for known services (e.g., Ollama on :11434)
 * - Docker container detection for vector databases (Chroma, Weaviate, Qdrant)
 *
 * SECURITY CONSIDERATIONS:
 * - C-1: Command Injection - Uses `which()` to validate Docker binary path
 * - C-6: DoS - Enforces MAX_PORTS_TO_CHECK limit to prevent resource exhaustion
 * - Input validation on all ports and hosts
 * - Timeout enforcement on all network operations
 *
 * @module detection/services
 */
/**
 * Detected service information
 */
export interface DetectedService {
    /** Service name (e.g., 'ollama', 'chroma-db') */
    name: string;
    /** Detection method used */
    type: 'port' | 'docker';
    /** True if the service is available/running */
    available: boolean;
    /** Network address (for port-based services) */
    address?: string;
}
/**
 * Detects running Docker containers
 *
 * SECURITY FIX (C-1): Validates Docker binary path using `which()`
 * to prevent PATH manipulation attacks. Uses execFile with explicit
 * binary path instead of shell execution.
 *
 * Also sanitizes container names to prevent injection attacks.
 *
 * @returns Promise resolving to array of container names
 */
export declare function detectDockerContainers(): Promise<string[]>;
/**
 * Docker detection function type for dependency injection
 */
type DockerDetectionFn = () => Promise<string[]>;
/**
 * Detects services running on the local machine
 *
 * Performs port-based and Docker-based detection with timeout enforcement.
 * All detection is wrapped in a timeout to prevent hanging.
 *
 * SECURITY FIXES:
 * - C-1: Command Injection - Docker binary validated with which()
 * - C-6: DoS - MAX_PORTS_TO_CHECK limit enforced
 * - Input validation on all ports and hosts
 * - Timeout enforcement (5 seconds max)
 *
 * @param detectDockerContainersFn - Optional Docker detection function for testing
 * @returns Promise resolving to array of detected services
 */
export declare function detectServices(detectDockerContainersFn?: DockerDetectionFn): Promise<DetectedService[]>;
/**
 * Checks if Ollama is available on the default port
 *
 * Convenience function for checking Ollama specifically.
 *
 * @returns Promise resolving to true if Ollama is detected
 */
export declare function isOllamaAvailable(): Promise<boolean>;
/**
 * Checks if any vector database containers are running
 *
 * Convenience function for checking vector databases specifically.
 *
 * @returns Promise resolving to array of detected vector database container names
 */
export declare function getVectorDbContainers(): Promise<string[]>;
export {};
//# sourceMappingURL=services.d.ts.map