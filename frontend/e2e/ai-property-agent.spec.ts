import { test, expect } from '@playwright/test';

function formatSseEvents(events: Array<{ event: string; data: unknown }>): string {
  return events
    .map(({ event, data }) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    .join('');
}

test.describe('AI Property Agent (V2) — High-UX Streaming Browser E2E', () => {
  test('Desktop: welcome screen, SSE stream + nearby card, follow-up chip, expand panel, + Compare bar, comparison table, and RA 10173 handoff', async ({ page }) => {
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
            specs: {
              beds: 4,
              baths: 4,
              livingArea: 320,
              lotSizeArea: 450,
              parkingTotal: 2,
              propertyType: 'House & Lot',
              transactionType: 'For Sale',
            },
            features: ['Swimming Pool', 'Garden'],
            images: [],
          },
        }),
      });
    });

    // Intercept POST /api/chat/stream with real text/event-stream SSE frames
    let streamTurn = 0;
    await page.route('**/api/chat/stream', async (route) => {
      const body = route.request().postDataJSON();
      capturedChatBodies.push(body);
      streamTurn += 1;

      if (streamTurn === 1) {
        const resultPayload = {
          message:
            'Here are **nearby** schools, malls, and estimated drive times for Alabang Courtyard Villa.',
          cards: [],
          comparison: null,
          nearby: {
            propertyId: 'prop-e2e-42',
            propertyTitle: 'Alabang Courtyard Villa',
            landmarks: [
              { category: 'school', label: 'De La Salle Santiago Zobel (5 mins)' },
              { category: 'mall', label: 'Alabang Town Center (6 mins)' },
            ],
            commutes: [
              {
                destinationName: 'Ayala Avenue (Makati CBD)',
                distanceText: '18.2 km',
                durationText: '32 mins',
              },
            ],
            unavailable: false,
          },
          handoffDraft: {
            propertyId: 'prop-e2e-42',
            propertyTitle: 'Alabang Courtyard Villa',
            propertyPrice: '₱28,000,000',
            summary: 'Interested in Alabang Courtyard Villa nearby schools and commute.',
          },
          followUpSuggestions: ['Show similar homes under ₱25M', 'Check monthly dues'],
        };

        await route.fulfill({
          status: 200,
          contentType: 'text/event-stream; charset=utf-8',
          body: formatSseEvents([
            {
              event: 'status',
              data: { step: 'nearby', label: 'Looking up nearby schools, malls & drive times...' },
            },
            { event: 'delta', data: { text: 'Here are **nearby** schools, malls, ' } },
            {
              event: 'delta',
              data: { text: 'and estimated drive times for Alabang Courtyard Villa.' },
            },
            { event: 'result', data: resultPayload },
            { event: 'done', data: { stopped: false } },
          ]),
        });
        return;
      }

      if (streamTurn === 2) {
        const resultPayload = {
          message: 'Here are two published homes under ₱25M you can compare:',
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
            {
              id: 'prop-makati-9',
              title: 'Makati Parkview Residence',
              city: 'Makati',
              price: 22000000,
              formattedPrice: '₱22,000,000',
              propertyType: 'Condominium',
              transactionType: 'For Sale',
              bedrooms: 2,
              bathrooms: 2,
              mainImage: null,
              status: 'Active',
            },
          ],
          comparison: null,
          nearby: null,
          handoffDraft: {
            propertyId: 'prop-bgc-7',
            propertyTitle: 'BGC Garden Suite',
            propertyPrice: '₱19,500,000',
            summary: 'Exploring condos under ₱25M in Taguig and Makati.',
          },
          followUpSuggestions: ['Check commute to BGC'],
        };

        await route.fulfill({
          status: 200,
          contentType: 'text/event-stream; charset=utf-8',
          body: formatSseEvents([
            { event: 'status', data: { step: 'search', label: 'Searching published homes...' } },
            { event: 'delta', data: { text: resultPayload.message } },
            { event: 'result', data: resultPayload },
            { event: 'done', data: { stopped: false } },
          ]),
        });
        return;
      }

      const comparisonPayload = {
        message: 'Here is your side-by-side comparison of the two selected homes.',
        cards: [],
        comparison: {
          properties: [
            {
              id: 'prop-bgc-7',
              title: 'BGC Garden Suite',
              city: 'Taguig',
              formattedPrice: '₱19,500,000',
            },
            {
              id: 'prop-makati-9',
              title: 'Makati Parkview Residence',
              city: 'Makati',
              formattedPrice: '₱22,000,000',
            },
          ],
          rows: [
            { label: 'Price', values: ['₱19,500,000', '₱22,000,000'] },
            { label: 'City', values: ['Taguig', 'Makati'] },
          ],
        },
        nearby: null,
        handoffDraft: {
          propertyId: 'prop-bgc-7',
          propertyTitle: 'BGC Garden Suite',
          propertyPrice: '₱19,500,000',
          summary: 'Comparing BGC Garden Suite and Makati Parkview Residence.',
        },
        followUpSuggestions: [],
      };

      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream; charset=utf-8',
        body: formatSseEvents([
          {
            event: 'status',
            data: { step: 'compare', label: 'Comparing properties side by side...' },
          },
          { event: 'delta', data: { text: comparisonPayload.message } },
          { event: 'result', data: comparisonPayload },
          { event: 'done', data: { stopped: false } },
        ]),
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

    // Verify Crisp White header, RA 9646 badge, active listing banner, and Welcome View
    await expect(chat.getByRole('heading', { name: 'AI Property Concierge' })).toBeVisible();
    await expect(chat.getByText('RA 9646')).toBeVisible();
    await expect(chat.getByText(/Currently viewing: Alabang Courtyard Villa/i)).toBeVisible();
    await expect(chat.getByText(/How can I help you find your next home\?/i)).toBeVisible();

    // Turn 1: Tap listing welcome prompt -> streamed reply + nearby card + follow-up chip
    await chat.getByRole('button', { name: /what's nearby\?/i }).click();
    await expect(chat.getByText(/De La Salle Santiago Zobel/i)).toBeVisible();
    await expect(chat.getByText(/Ayala Avenue \(Makati CBD\)/i)).toBeVisible();
    expect(capturedChatBodies[0].pageContext).toEqual({
      route: '/properties/prop-e2e-42',
      propertyId: 'prop-e2e-42',
    });

    // Turn 2: Tap 1-tap follow-up chip -> 2 property cards arrive
    const followUpChip = chat.getByRole('button', { name: 'Show similar homes under ₱25M' });
    await expect(followUpChip).toBeVisible();
    await followUpChip.click();

    await expect(chat.getByText('BGC Garden Suite')).toBeVisible();
    await expect(chat.getByText('Makati Parkview Residence')).toBeVisible();
    await expect(chat.getByRole('link', { name: /view home/i }).first()).toHaveAttribute(
      'href',
      '/properties/prop-bgc-7'
    );

    // Expand side panel on desktop
    await chat.getByRole('button', { name: /expand chat/i }).click();
    await expect(chat.getByRole('button', { name: /collapse chat/i })).toBeVisible();

    // Toggle + Compare on both property cards
    const compareToggles = chat.getByRole('button', { name: /\+ compare/i });
    await compareToggles.first().click();
    await expect(chat.getByRole('button', { name: /compare selected \(1\)/i })).toBeDisabled();

    await chat.getByRole('button', { name: /\+ compare/i }).click();
    const compareSelectedBtn = chat.getByRole('button', { name: /compare selected \(2\)/i });
    await expect(compareSelectedBtn).toBeEnabled();
    await compareSelectedBtn.click();

    // Turn 3: Side-by-side comparison table renders
    await expect(chat.getByRole('heading', { name: 'Side-by-Side Comparison' })).toBeVisible();
    expect(capturedChatBodies[2].messages.at(-1).content).toContain(
      'BGC Garden Suite (ID: prop-bgc-7)'
    );
    expect(capturedChatBodies[2].messages.at(-1).content).toContain(
      'Makati Parkview Residence (ID: prop-makati-9)'
    );

    // Click "Ask Agent" on BGC Garden Suite card -> consent-gated RA 10173 handoff
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

  test('Mobile 375x667: full-height sheet opens cleanly and handoff form submit button remains reachable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const toggleBtn = page.getByRole('button', { name: /toggle ai property concierge/i });
    await expect(toggleBtn).toBeVisible({ timeout: 15000 });
    await toggleBtn.click();

    const panel = page.getByTestId('chat-widget-panel');
    await expect(panel).toBeVisible();
    const box = await panel.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(370);
    expect(box?.height).toBeGreaterThanOrEqual(660);

    await expect(page.getByText(/How can I help you find your next home\?/i)).toBeVisible();

    await page.getByRole('button', { name: /talk to a licensed agent/i }).click();
    const submitBtn = page.getByRole('button', { name: /request licensed agent/i });
    await submitBtn.scrollIntoViewIfNeeded();
    await expect(submitBtn).toBeVisible();
  });
});
