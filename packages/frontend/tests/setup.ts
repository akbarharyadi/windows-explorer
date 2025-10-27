import { vi } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn()

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})

// Mock ResizeObserver (used by some UI libraries)
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock Element.prototype.scrollIntoView (used by UI libraries)
Element.prototype.scrollIntoView = vi.fn()