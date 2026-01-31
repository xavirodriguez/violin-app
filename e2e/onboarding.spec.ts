import { test, expect } from '@playwright/test'

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure onboarding shows
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('should complete the onboarding flow', async ({ page }) => {
    // Step 1: Welcome
    await expect(page.getByText('¡Bienvenido a Violin Mentor!')).toBeVisible()
    await page.getByRole('button', { name: 'Comenzar' }).click()

    // Step 2: Skill Level
    await expect(page.getByText('¿Cuál es tu nivel de experiencia?')).toBeVisible()
    await page.getByRole('button', { name: '🎯 Intermedio' }).click()
    await page.getByRole('button', { name: 'Continuar' }).click()

    // Step 3: Audio Test
    await expect(page.getByText('Prueba de Audio')).toBeVisible()
    await page.getByRole('button', { name: 'Probar Micrófono' }).click()

    // Wait for success (simulated)
    await expect(page.getByText('¡Micrófono funcionando correctamente!')).toBeVisible({
      timeout: 5000,
    })
    await page.getByRole('button', { name: 'Continuar' }).click()

    // Step 4: Ready
    await expect(page.getByText('¡Todo listo!')).toBeVisible()
    await page.getByRole('button', { name: '¡Empezar a Practicar!' }).click()

    // Onboarding should be gone
    await expect(page.getByText('¡Bienvenido a Violin Mentor!')).not.toBeVisible()

    // Verify persistence
    const completed = await page.evaluate(() => localStorage.getItem('onboarding-completed'))
    expect(completed).toBe('true')
  })
})
