// Object pool to reduce allocations
export class ObjectPool<T> {
  private pool: T[] = []
  private createFn: () => T
  private resetFn: (obj: T) => void
  private maxSize: number

  constructor(createFn: () => T, resetFn: (obj: T) => void, maxSize = 100) {
    this.createFn = createFn
    this.resetFn = resetFn
    this.maxSize = maxSize
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    return this.createFn()
  }

  release(obj: T) {
    if (this.pool.length < this.maxSize) {
      this.resetFn(obj)
      this.pool.push(obj)
    }
  }

  clear() {
    this.pool = []
  }

  get size(): number {
    return this.pool.length
  }
}

// Special pool for mouse events
export interface PooledMouseEvent {
  type: string
  x: number
  y: number
  button: number
  modifiers: {
    ctrl: boolean
    alt: boolean
    shift: boolean
  }
  clickCount?: number
  isDragging?: boolean
}

export class MouseEventPool {
  private pool = new ObjectPool<PooledMouseEvent>(
    () => ({
      type: "",
      x: 0,
      y: 0,
      button: 0,
      modifiers: { ctrl: false, alt: false, shift: false },
      clickCount: 0,
      isDragging: false,
    }),
    (event) => {
      event.type = ""
      event.x = 0
      event.y = 0
      event.button = 0
      event.modifiers.ctrl = false
      event.modifiers.alt = false
      event.modifiers.shift = false
      event.clickCount = 0
      event.isDragging = false
    },
    50 // Max 50 events in pool
  )

  acquire(): PooledMouseEvent {
    return this.pool.acquire()
  }

  release(event: PooledMouseEvent) {
    this.pool.release(event)
  }

  clear() {
    this.pool.clear()
  }
}

// Pool for temporary render objects
export class RenderObjectPool {
  private pools = new Map<string, ObjectPool<any>>()

  constructor() {
    // Pool for rectangles
    this.pools.set("rect", new ObjectPool(
      () => ({ x: 0, y: 0, width: 0, height: 0 }),
      (rect) => {
        rect.x = 0
        rect.y = 0
        rect.width = 0
        rect.height = 0
      },
      20
    ))

    // Pool for points
    this.pools.set("point", new ObjectPool(
      () => ({ x: 0, y: 0 }),
      (point) => {
        point.x = 0
        point.y = 0
      },
      30
    ))

    // Pool for dimensions
    this.pools.set("dimension", new ObjectPool(
      () => ({ width: 0, height: 0 }),
      (dim) => {
        dim.width = 0
        dim.height = 0
      },
      20
    ))
  }

  acquire<T>(type: string): T {
    const pool = this.pools.get(type)
    if (!pool) {
      throw new Error(`Unknown pool type: ${type}`)
    }
    return pool.acquire()
  }

  release<T>(type: string, obj: T) {
    const pool = this.pools.get(type)
    if (pool) {
      pool.release(obj)
    }
  }

  clear() {
    for (const pool of this.pools.values()) {
      pool.clear()
    }
  }

  getStats() {
    const stats: Record<string, number> = {}
    for (const [type, pool] of this.pools.entries()) {
      stats[type] = pool.size
    }
    return stats
  }
}

// Global singleton for the pools
export const GlobalObjectPool = new RenderObjectPool()
export const GlobalMouseEventPool = new MouseEventPool()

// Utility to measure performance
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>()
  private startTimes = new Map<string, number>()

  start(name: string) {
    this.startTimes.set(name, performance.now())
  }

  end(name: string): number {
    const startTime = this.startTimes.get(name)
    if (!startTime) return 0

    const duration = performance.now() - startTime
    this.startTimes.delete(name)

    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const metrics = this.metrics.get(name)!
    metrics.push(duration)
    
    // Keep only the last 100 measurements
    if (metrics.length > 100) {
      metrics.shift()
    }

    return duration
  }

  getAverage(name: string): number {
    const metrics = this.metrics.get(name)
    if (!metrics || metrics.length === 0) return 0
    
    return metrics.reduce((a, b) => a + b, 0) / metrics.length
  }

  getStats(name: string) {
    const metrics = this.metrics.get(name)
    if (!metrics || metrics.length === 0) return null

    const sorted = [...metrics].sort((a, b) => a - b)
    const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length
    const p50 = sorted[Math.floor(sorted.length * 0.5)]
    const p95 = sorted[Math.floor(sorted.length * 0.95)]

    return {
      average: avg,
      median: p50,
      p95: p95,
      count: sorted.length
    }
  }

  clear() {
    this.metrics.clear()
    this.startTimes.clear()
  }
}

export const GlobalPerformanceMonitor = new PerformanceMonitor()