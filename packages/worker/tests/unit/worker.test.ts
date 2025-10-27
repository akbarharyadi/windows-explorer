import { describe, it, expect, beforeEach, afterEach, vi } from 'bun:test'
import { WorkerService } from '../../src/index'

// Mock all external dependencies
vi.mock('../src/infrastructure/queue/rabbitmq', () => ({
  default: {
    connect: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  }
}))

vi.mock('../src/infrastructure/cache/redis', () => ({
  default: {
    quit: vi.fn().mockResolvedValue(undefined),
  }
}))

vi.mock('../src/infrastructure/database/prisma', () => ({
  default: {
    $disconnect: vi.fn().mockResolvedValue(undefined),
  }
}))

vi.mock('../src/consumers/FolderConsumer', () => ({
  FolderConsumer: class {
    start = vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('../src/consumers/FileConsumer', () => ({
  FileConsumer: class {
    start = vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('../src/consumers/CacheConsumer', () => ({
  CacheConsumer: class {
    start = vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('../src/consumers/SearchConsumer', () => ({
  SearchConsumer: class {
    start = vi.fn().mockResolvedValue(undefined)
  }
}))

describe('WorkerService', () => {
  let workerService: WorkerService

  beforeEach(() => {
    workerService = new WorkerService()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize correctly', () => {
    expect(workerService).toBeDefined()
  })

  it('should start successfully', async () => {
    const startSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    await workerService.start()
    
    expect(startSpy).toHaveBeenCalledWith('🚀 Starting window-explorer Worker Service...')
    startSpy.mockRestore()
  })

  it('should shutdown gracefully', async () => {
    const shutdownSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    // Start the service first
    await workerService.start()
    
    // Then shutdown
    await workerService.shutdown()
    
    expect(shutdownSpy).toHaveBeenCalledWith('🛑 Shutting down Worker Service...')
    shutdownSpy.mockRestore()
  })
})