// tests/setup.ts
import { vi } from 'vitest'

// Mock ResizeObserver (used by some UI libraries)
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock Element.prototype.scrollIntoView (used by UI libraries)
Element.prototype.scrollIntoView = vi.fn()