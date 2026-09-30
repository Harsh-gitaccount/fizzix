import { test, expect } from '@playwright/test'

const playBtn = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: 'Play', exact: true })

const pauseBtn = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: 'Pause', exact: true })

function layerBtn(page: import('@playwright/test').Page, name: string) {
  return page.locator('button').filter({ hasText: new RegExp(`${name}$`) })
}

test.describe('Teacher Golden Path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('canvas', { timeout: 10000 })
  })

  test('1 - page loads with canvas and controls', async ({ page }) => {
    await expect(page.locator('canvas')).toBeVisible()
    await expect(page.getByText('PARAMETERS')).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Simulation' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Quiz' })).toBeVisible()
  })

  test('2 - adjust v0 slider changes value', async ({ page }) => {
    await expect(page.getByText('20.0 m/s')).toBeVisible()
  })

  test('3 - play button starts simulation', async ({ page }) => {
    await playBtn(page).click()
    const bar = page.locator('[data-playback-state]')
    await expect(bar).toHaveAttribute('data-playback-state', 'playing')
  })

  test('4 - simulation reaches landed state', async ({ page }) => {
    await playBtn(page).click()
    const bar = page.locator('[data-playback-state]')
    await expect(bar).toHaveAttribute('data-playback-state', 'landed', { timeout: 30000 })
  })

  test('5 - toggle layers on and off', async ({ page }) => {
    const gridBtn = layerBtn(page, 'Grid')
    await expect(gridBtn).toHaveClass(/bg-blue-50/)
    await gridBtn.click()
    await expect(gridBtn).toHaveClass(/bg-gray-50/)

    const velBtn = layerBtn(page, 'Velocity')
    await expect(velBtn).toHaveClass(/bg-gray-50/)
    await velBtn.click()
    await expect(velBtn).toHaveClass(/bg-blue-50/)
  })

  test('6 - load preset changes params', async ({ page }) => {
    const firstPreset = page.locator('.preset-pill').first()
    await expect(firstPreset).toBeVisible()
    await firstPreset.click()
    await expect(firstPreset).toHaveClass(/bg-blue-600/)
  })

  test('7 - switch to quiz mode shows quiz panel', async ({ page }) => {
    await page.getByRole('tab', { name: 'Quiz' }).click()
    await expect(page.getByText(/Quiz/i).first()).toBeVisible()
  })

  test('8 - toggle Hindi shows translated UI', async ({ page }) => {
    await page.locator('button', { hasText: 'हिं' }).click()
    await expect(page.getByText('प्रक्षेप्य गति')).toBeVisible()
  })

  test('9 - data table tab shows table content', async ({ page }) => {
    await page.getByRole('tab', { name: 'Data Table' }).click()
    await page.waitForTimeout(500)
    await expect(page.locator('#control-panel').getByText(/t/i).first()).toBeVisible()
  })

  test('10 - screenshot button is clickable', async ({ page }) => {
    const screenshotBtn = page.getByLabel('Screenshot')
    await expect(screenshotBtn).toBeVisible()
    await screenshotBtn.click()
  })
})

test.describe('Canvas Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('canvas', { timeout: 10000 })
  })

  test('snapshot - initial canvas state', async ({ page }) => {
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()
    await expect(canvas).toHaveScreenshot('canvas-initial.png', {
      maxDiffPixelRatio: 0.05,
    })
  })

  test('snapshot - mid-flight with trail', async ({ page }) => {
    await layerBtn(page, 'Trail').click()
    await playBtn(page).click()
    await page.waitForTimeout(1500)
    await pauseBtn(page).click()

    const canvas = page.locator('canvas')
    await expect(canvas).toHaveScreenshot('canvas-mid-flight.png', {
      maxDiffPixelRatio: 0.05,
    })
  })

  test('snapshot - landed with vectors and grid', async ({ page }) => {
    await layerBtn(page, 'Grid').click()
    await layerBtn(page, 'Velocity').click()

    await playBtn(page).click()
    const bar = page.locator('[data-playback-state]')
    await expect(bar).toHaveAttribute('data-playback-state', 'landed', { timeout: 30000 })

    const canvas = page.locator('canvas')
    await expect(canvas).toHaveScreenshot('canvas-landed-vectors.png', {
      maxDiffPixelRatio: 0.05,
    })
  })
})
