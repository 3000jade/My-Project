import { test, expect } from '@playwright/test';

test.describe('AI Property Agent (V1) — Live Browser E2E', () => {
  test('Desktop: page-aware banner, nearby & property cards, comparison table, and RA 10173 handoff', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const capturedChatBodies: any[] = [];
    let capturedInquiryBody: any = null;

    // Intercept public property lookup so /properties/prop-e2e-42 loads deterministically
    await page.route('**/api/properties/prop-e2e-42*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'prop-e2e-42',
            title: 'Alabang Courtyard Villa',
            price: 28000000,
            formattedPrice: '₱28,000,000',
            status: 'available',
            standardStatus: 'Active',
            isPublished: true,
            location: { address: '12 Acacia St, Ayala Alabang', city: 'Muntinlupa', state: 'Metro Manila' },
            specs: { beds: 4, baths: 4, livingArea: 320, lotSizeArea: 450, parkingTotal: 2, propertyType: 'House & Lot', transactionType: 'For Sale' },
            features: ['Swimming Pool', 'Garden'],
            images: [],
          },
        }),
      });
    });

    // Intercept POST /api/chat
    let chatTurn = 0;
    await page.route('**/api/chat', async (route) => {
      const body = route.request().postDataJSON();
      capturedChatBodies.push(body);
      chatTurn += 1;

      if (chatTurn === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              message: 'Here are nearby schools, malls, and estimated drive times for Alabang Courtyard Villa.',
              nearby: {
                propertyId: 'prop-e2e-42',
                propertyTitle: 'Alabang Courtyard Villa',
                landmarks: [
                  { category: 'school', label: 'De La Salle Santiago Zobel (5 mins)' },
                  { category: 'mall', label: 'Alabang Town Center (6 mins)' },
                ],
                commutes: [
                  { destinationName: 'Ayala Avenue (Makati CBD)', distanceText: '18.2 km', durationText: '32 mins' },
                ],
                unavailable: false,
              },
              handoffDraft: {
                propertyId: 'prop-e2e-42',
                propertyTitle: 'Alabang Courtyard Villa',
                propertyPrice: '₱28,000,000',
                summary: 'Interested in Alabang Courtyard Villa nearby schools and commute.',
              },
            },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            message: 'Here is a matching condo and side-by-side comparison.',
            cards: [
              {
                id: 'prop-bgc-7',
                title: 'BGC Garden Suite',
                city: 'Taguig',
                price: 19500000,
                formattedPrice: '₱19,500,000',
                propertyType: 'Condominium',
                transactionType: 'For Sale',
                bedrooms: 2,
                bathrooms: 2,
                mainImage: null,
                status: 'Active',
              },
            ],
            comparison: {
              properties: [
                { id: 'prop-e2e-42', title: 'Alabang Courtyard Villa', city: 'Muntinlupa', formattedPrice: '₱28,000,000' },
                { id: 'prop-bgc-7', title: 'BGC Garden Suite', city: 'Taguig', formattedPrice: '₱19,500,000' },
              ],
              rows: [
                { label: 'Price', values: ['₱28,000,000', '₱19,500,000'] },
                { label: 'Bedrooms', values: ['4', '2'] },
              ],
            },
            handoffDraft: {
              propertyId: 'prop-bgc-7',
              propertyTitle: 'BGC Garden Suite',
              propertyPrice: '₱19,500,000',
              summary: 'Comparing Alabang Courtyard Villa and BGC Garden Suite.',
            },
          },
        }),
      });
    });

    // Intercept POST /api/inquiries
    await page.route('**/api/inquiries', async (route) => {
      capturedInquiryBody = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 'INQ-E2E-777' },
        }),
      });
    });

    await page.goto('/properties/prop-e2e-42');

    const toggleBtn = page.getByRole('button', { name: /toggle ai property concierge/i });
    await expect(toggleBtn).toBeVisible({ timeout: 15000 });
    await toggleBtn.click();

    const chat = page.locator('#ai-chat');

    // Verify RA 9646 disclosure & page-aware active listing banner
    await expect(chat.getByRole('heading', { name: 'AI Property Concierge' })).toBeVisible();
    await expect(chat.getByText(/Currently viewing: Alabang Courtyard Villa/i)).toBeVisible();

    // Turn 1: Click adaptive "What's nearby?" quick action
    await chat.getByRole('button', { name: /what's nearby\?/i }).click();
    await expect(chat.getByText(/De La Salle Santiago Zobel/i)).toBeVisible();
    await expect(chat.getByText(/Ayala Avenue \(Makati CBD\)/i)).toBeVisible();
    expect(capturedChatBodies[0].pageContext).toEqual({
      route: '/properties/prop-e2e-42',
      propertyId: 'prop-e2e-42',
    });

    // Turn 2: Ask to compare homes -> verify property card & comparison table
    await chat.getByRole('button', { name: /compare similar/i }).click();
    await expect(chat.getByRole('heading', { name: 'Side-by-Side Comparison' })).toBeVisible();
    await expect(chat.getByRole('link', { name: /view home/i })).toHaveAttribute('href', '/properties/prop-bgc-7');

    // Click "Ask Agent" on the returned property card
    await chat.getByRole('button', { name: /^ask agent$/i }).first().click();

    await expect(chat.getByText('Connect to Licensed Agent')).toBeVisible();
    await expect(chat.getByText(/Property: BGC Garden Suite/i)).toBeVisible();

    const submitBtn = chat.getByRole('button', { name: /request licensed agent/i });
    await expect(submitBtn).toBeDisabled();

    await chat.getByPlaceholder('Full name').fill('Elena Cruz');
    await chat.getByPlaceholder('Email address').fill('elena@example.com');
    await chat.getByRole('checkbox').click();
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    await expect(chat.getByText(/INQ-E2E-777/)).toBeVisible();
    expect(capturedInquiryBody).toMatchObject({
      name: 'Elena Cruz',
      email: 'elena@example.com',
      propertyId: 'prop-bgc-7',
      propertyTitle: 'BGC Garden Suite',
      propertyPrice: '₱19,500,000',
      source: 'ai_chatbot',
      consentAccepted: true,
    });
    expect(typeof capturedInquiryBody.propertyPrice).toBe('string');
  });

  test('Mobile 375x667: handoff form scrolls cleanly and submit button remains reachable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const toggleBtn = page.getByRole('button', { name: /toggle ai property concierge/i });
    await expect(toggleBtn).toBeVisible({ timeout: 15000 });
    await toggleBtn.click();

    await page.getByRole('button', { name: /connect to agent/i }).click();
    const submitBtn = page.getByRole('button', { name: /request licensed agent/i });
    await submitBtn.scrollIntoViewIfNeeded();
    await expect(submitBtn).toBeVisible();
  });
});
