# Story 3.2: Service Detection (port scanning + Docker)

Status: ready-for-dev

**Epic:** EPIC-3 - Detection Engine
**Priority:** P1
**Dependency:** EPIC-2
**Points:** 5
**Files:** `src/detection/services.ts`, `src/detection/docker.ts`

## Story

As the wizard detecting running services,
I want to detect local services via port scanning and Docker containers,
so that I can pre-select local connectors like Ollama and vector databases.

## Acceptance Criteria

1. Port scanning for Ollama (:11434)
2. Docker container detection (Chroma, Weaviate, Qdrant)
3. Timeout enforcement (5 second max)
4. Return detected services with availability status
5. Handle missing Docker gracefully
6. All tests pass with 90% coverage

## Tasks / Subtasks

- [ ] Define DetectedService interface
  - [ ] name: string
  - [ ] type: 'port' | 'docker'
  - [ ] available: boolean
  - [ ] address?: string
- [ ] Implement checkPort() function (AC: 1, 3)
  - [ ] Accept host, port, timeout parameters
  - [ ] Create TCP connection using net.createConnection()
  - [ ] Set timeout on socket
  - [ ] Return true on 'connect' event
  - [ ] Return false on 'timeout', 'error' events
  - [ ] Destroy socket in all cases
- [ ] Define SERVICE_PORTS constant
  - [ ] ollama: 11434
  - [ ] chroma: 8000 (optional)
  - [ ] weaviate: 8080 (optional)
  - [ ] qdrant: 6333 (optional)
- [ ] Implement port-based detection (AC: 1)
  - [ ] Iterate over SERVICE_PORTS
  - [ ] Call checkPort() for each
  - [ ] Create DetectedService entries
- [ ] Implement Docker container detection (AC: 2, 5)
  - [ ] Execute `docker ps --format '{{.Names}}'`
  - [ ] Parse container names
  - [ ] Match against vector DB patterns
  - [ ] Handle command not found (Docker not installed)
  - [ ] Create DetectedService entries
- [ ] Implement detectServices() main function (AC: 4)
  - [ ] Run port detection in parallel
  - [ ] Run Docker detection
  - [ ] Combine results
  - [ ] Return array of DetectedService
- [ ] Add timeout enforcement (AC: 3)
  - [ ] Port scan timeout: 1 second per port
  - [ ] Docker command timeout: 2 seconds
  - [ ] Overall detection timeout: 5 seconds
- [ ] Create unit tests (AC: 6)
  - [ ] Test port detection with mock
  - [ ] Test Docker detection with mock
  - [ ] Test timeout handling
  - [ ] Test Docker not installed
  - [ ] Test service not available
  - [ ] Test service available
  - [ ] Achieve 90% coverage

## Dev Notes

### DetectedService Interface

```typescript
export interface DetectedService {
  name: string;
  type: 'port' | 'docker';
  available: boolean;
  address?: string;
}
```

### Port Scanning Implementation

```typescript
import { createConnection } from 'net';

async function checkPort(
  host: string,
  port: number,
  timeout = 1000
): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection(port, host);
    socket.setTimeout(timeout);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
  });
}
```

### Docker Detection Implementation

```typescript
import { execFile } from 'child_process/promises';

async function detectDockerContainers(): Promise<string[]> {
  try {
    const { stdout } = await execFile('docker', [
      'ps',
      '--format',
      '{{.Names}}'
    ], {
      timeout: 2000,
    });
    return stdout.trim().split('\n').filter(Boolean);
  } catch {
    // Docker not installed or not running
    return [];
  }
}
```

### Service Detection

```typescript
const SERVICE_PORTS = {
  ollama: 11434,
} as const;

const VECTOR_DB_PATTERNS = ['chroma', 'weaviate', 'qdrant'];

export async function detectServices(): Promise<DetectedService[]> {
  const detected: DetectedService[] = [];

  // Port-based detection
  for (const [name, port] of Object.entries(SERVICE_PORTS)) {
    const available = await checkPort('localhost', port);
    detected.push({
      name,
      type: 'port',
      available,
      address: `localhost:${port}`,
    });
  }

  // Docker-based detection
  const containers = await detectDockerContainers();

  for (const container of containers) {
    const lowerName = container.toLowerCase();
    for (const pattern of VECTOR_DB_PATTERNS) {
      if (lowerName.includes(pattern)) {
        detected.push({
          name: container,
          type: 'docker',
          available: true,
        });
        break;
      }
    }
  }

  return detected;
}
```

### Usage Example

```typescript
const services = await detectServices();
// Returns:
// [
//   { name: 'ollama', type: 'port', available: true, address: 'localhost:11434' },
//   { name: 'chroma-db', type: 'docker', available: true },
//   { name: 'weaviate', type: 'docker', available: true }
// ]
```

### Docker Container Name Patterns

Vector DB containers typically include the DB name:
- `chroma`, `chromadb`, `chroma-db`
- `weaviate`, `weaviate-db`
- `qdrant`, `qdrant-db`

### Cross-Platform Considerations

- **Port scanning:** Works on all platforms (TCP is universal)
- **Docker:** May not be installed or running (handle gracefully)
- **Timeouts:** Essential for non-blocking detection

### Error Handling

- Port connection refused → Service not available (expected)
- Port timeout → Service not responding
- Docker command fails → Docker not available (not an error)
- Invalid container names → Skip gracefully

### Test Strategy

- Mock `net.createConnection()` for port tests
- Mock `child_process.execFile()` for Docker tests
- Test timeout scenarios
- Test with various container names

### Project Context Reference

- Detection Engine: [working-document.md#L482-L580](../working-document.md#L482-L580)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

### File List
