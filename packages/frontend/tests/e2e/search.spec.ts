import { test, expect } from '@playwright/test'

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should search for folders', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Documents')
    await page.click('button[type="submit"]')

    await expect(page.locator('.search-results')).toBeVisible()
    await expect(page.locator('.search-results-header h3')).toContainText('Documents')
  })

  test('should clear search results', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'test')
    await page.click('button[type="submit"]')
    await page.waitForSelector('.search-results')

    await page.click('.search-results-header button')
    await expect(page.locator('.search-results')).not.toBeVisible()
    await expect(page.locator('.app-content')).toBeVisible()
  })

  test('should show no results message', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'nonexistentfolder123')
    await page.click('button[type="submit"]')

    await expect(page.locator('.no-results')).toBeVisible()
  })
})