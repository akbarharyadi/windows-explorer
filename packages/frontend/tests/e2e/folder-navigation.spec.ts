import { test, expect } from '@playwright/test'

test.describe('Folder Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display folder tree on load', async ({ page }) => {
    await expect(page.locator('.folder-tree')).toBeVisible()
    await expect(page.locator('.tree-node')).toHaveCount.greaterThan(0)
  })

  test('should expand and collapse folders', async ({ page }) => {
    const expandIcon = page.locator('.expand-icon').first()
    await expandIcon.click()

    // Check if children are visible
    await expect(page.locator('.tree-node-children').first()).toBeVisible()

    // Collapse
    await expandIcon.click()
    await expect(page.locator('.tree-node-children').first()).not.toBeVisible()
  })

  test('should select folder and show contents', async ({ page }) => {
    const firstFolder = page.locator('.tree-node-content').first()
    await firstFolder.click()

    // Check if folder list updates
    await expect(page.locator('.folder-list-header h2')).not.toContainText('Select a folder')
  })

  test('should navigate to child folder on double-click', async ({ page }) => {
    // Select a folder first
    await page.locator('.tree-node-content').first().click()
    await page.waitForTimeout(500)

    // Double-click on a child folder in the grid
    const childFolder = page.locator('.folder-item').first()
    if (await childFolder.isVisible()) {
      await childFolder.dblclick()
      await page.waitForTimeout(500)

      // Check that the folder is selected in the tree
      await expect(page.locator('.tree-node-content.selected')).toBeVisible()
    }
  })
})