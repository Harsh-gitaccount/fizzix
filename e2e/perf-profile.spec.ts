import { test, expect } from '@playwright/test'

const TOPICS = [
  '/projectile-motion',
  '/shm',
  '/optics',
  '/electrostatics',
  '/thermodynamics',
  '/modern-physics',
]

const FRAME_BUDGET_MS = 33 // 30fps minimum

test.describe('Animation Performance Profiling', () => {
  for (const topic of TOPICS) {
    test(`${topic} – frame times stay under budget`, async ({ page }) => {
      await page.goto(topic)
      await page.waitForSelector('canvas', { timeout: 15000 })

      const frameTimes: number[] = await page.evaluate(async () => {
        return new Promise<number[]>((resolve) => {
          const times: number[] = []
          let prev = performance.now()
          let count = 0
          const target = 120

          function measure() {
            const now = performance.now()
            times.push(now - prev)
            prev = now
            count++
            if (count < target) {
              requestAnimationFrame(measure)
            } else {
              resolve(times)
            }
          }
          requestAnimationFrame(measure)
        })
      })

      const play = page.getByRole('button', { name: 'Play', exact: true })
      if (await play.isVisible()) {
        await play.click()
      }

      const activeFrameTimes: number[] = await page.evaluate(async () => {
        return new Promise<number[]>((resolve) => {
          const times: number[] = []
          let prev = performance.now()
          let count = 0
          const target = 180

          function measure() {
            const now = performance.now()
            times.push(now - prev)
            prev = now
            count++
            if (count < target) {
              requestAnimationFrame(measure)
            } else {
              resolve(times)
            }
          }
          requestAnimationFrame(measure)
        })
      })

      const allTimes = [...frameTimes, ...activeFrameTimes]
      const sorted = allTimes.slice().sort((a, b) => a - b)
      const p50 = sorted[Math.floor(sorted.length * 0.5)]
      const p95 = sorted[Math.floor(sorted.length * 0.95)]
      const p99 = sorted[Math.floor(sorted.length * 0.99)]
      const max = sorted[sorted.length - 1]
      const avg = allTimes.reduce((a, b) => a + b, 0) / allTimes.length

      console.log(`${topic}: avg=${avg.toFixed(1)}ms p50=${p50.toFixed(1)}ms p95=${p95.toFixed(1)}ms p99=${p99.toFixed(1)}ms max=${max.toFixed(1)}ms`)

      expect(p95).toBeLessThan(FRAME_BUDGET_MS)
    })
  }

  test('topic switching latency', async ({ page }) => {
    const switchTimes: { from: string; to: string; ms: number }[] = []

    for (let i = 0; i < TOPICS.length; i++) {
      const from = TOPICS[i]
      const to = TOPICS[(i + 1) % TOPICS.length]

      await page.goto(from)
      await page.waitForSelector('canvas', { timeout: 15000 })

      const start = Date.now()
      await page.goto(to)
      await page.waitForSelector('canvas', { timeout: 15000 })
      const elapsed = Date.now() - start

      switchTimes.push({ from, to, ms: elapsed })
    }

    for (const s of switchTimes) {
      console.log(`Switch ${s.from} → ${s.to}: ${s.ms}ms`)
      expect(s.ms).toBeLessThan(5000)
    }
  })
})
