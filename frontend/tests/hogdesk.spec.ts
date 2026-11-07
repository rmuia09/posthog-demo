// HogDesk Lite — Playwright E2E / BDD-style tests
// Covers all 3 customer problems:
//   1. Weekday breakdown (generate events via API)
//   2. Video player client rate limiting (throttled captures)
//   3. PII capture & GDPR audit (capture PII as person property)
import { test, expect, APIRequestContext } from '@playwright/test'

const BACKEND = 'http://localhost:8000'

async function postJSON(request: APIRequestContext, path: string, body: any) {
  const response = await request.post(`${BACKEND}${path}`, { data: body })
  return response
}

test.describe('Problem 1: Weekday Insight Breakdown', () => {
  test('generates payment and ticket events for weekday analysis', async ({ request }) => {
    // Given: a customer wants to break down insights by day of week
    // When: we generate checkout and ticket events via the API
    const checkout = await postJSON(request, '/api/v1/checkout', {
      user_id: 'weekday_user_1',
      currency: 'KES',
      amount: 1500,
      environment: 'production',
    })
    expect(checkout.status()).toBe(200)

    const ticket = await postJSON(request, '/api/v1/tickets/route', {
      user_id: 'weekday_user_1',
      category: 'billing',
      description: 'weekday breakdown test',
      priority: 'normal',
    })
    expect(ticket.status()).toBe(200)

    // Then: events are captured and available for SQL Insights query
    const checkoutBody = await checkout.json()
    expect(checkoutBody.status).toBe('success')

    const ticketBody = await ticket.json()
    expect(ticketBody.ticket_id).toBeTruthy()
  })
})

test.describe('Problem 2: Video Player Client Rate Limiting', () => {
  test('loads video player without client rate-limit console errors', async ({ page }) => {
    // Given: the video player page is loaded
    await page.goto('/')
    await page.getByRole('button', { name: 'Video Player' }).click()

    // Collect any rate-limiting console errors
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('rate limiting')) {
        consoleErrors.push(msg.text())
      }
    })

    // When: the video player component mounts
    // Then: the video element is present and no rate-limit errors appear
    const video = page.locator('video')
    await video.waitFor({ state: 'attached' })

    // Wait briefly to allow any initialization-time capture calls
    await page.waitForTimeout(3000)

    // Then: no client rate-limiting errors should appear in console
    expect(consoleErrors.length).toBe(0)

    // And: tracked events counter is present on the page
    const trackedText = await page
      .locator('text=Tracked events:')
      .locator('..')
      .textContent()
    expect(trackedText).toContain('Tracked events:')
  })
})

test.describe('Problem 3: Accidental PII Leaks & GDPR Deletion', () => {
  test('captures a ticket containing PII for later GDPR deletion', async ({ request }) => {
    // Given: PII was accidentally sent as part of a ticket description
    const piiEmail = 'jane.doe@example.com'

    // When: a ticket containing PII is submitted
    const response = await postJSON(request, '/api/v1/tickets/route', {
      user_id: 'pii_user_123',
      category: 'privacy',
      description: `${piiEmail} called about billing issue`,
      priority: 'urgent',
    })

    // Then: the ticket is accepted and captured
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.ticket_id).toBeTruthy()
    expect(body.category).toBe('privacy')

    // The PII can now be found in PostHog → Persons → pii_user_123
    // and removed via Data Management → Deletion Requests
  })
})
