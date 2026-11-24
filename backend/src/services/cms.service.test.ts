import { describe, it, expect, vi } from 'vitest';

vi.mock('../config/supabase', () => ({
  isSupabaseConfigured: false,
  supabaseAdmin: {},
}));

import { CmsService, slugifyTitle } from './cms.service';

describe('CmsService', () => {
  it('slugifies titles with fallback for very short values', () => {
    expect(slugifyTitle('  Maria Clara — Senior Broker!  ')).toBe('maria-clara-senior-broker');
    expect(slugifyTitle('!')).toMatch(/^item-/);
  });

  it('auto-generates unique slugs when omitted for staff items', async () => {
    const first = await CmsService.createContent('admin-1', {
      content_type: 'staff',
      title: 'Maria Clara',
      payload: { department: 'Sales', role: 'Broker' },
      status: 'DRAFT',
    });

    const second = await CmsService.createContent('admin-1', {
      content_type: 'staff',
      title: 'Maria Clara',
      payload: { department: 'Sales', role: 'Senior Broker' },
      status: 'DRAFT',
    });

    expect(first.slug).toMatch(/^maria-clara/);
    expect(second.slug).toMatch(/^maria-clara/);
    expect(second.slug).not.toBe(first.slug);
  });

  it('rejects duplicate explicit slugs on page items', async () => {
    await CmsService.createContent('admin-1', {
      content_type: 'page',
      slug: 'about-our-firm',
      title: 'About Our Firm',
      status: 'PUBLISHED',
    });

    await expect(
      CmsService.createContent('admin-1', {
        content_type: 'page',
        slug: 'about-our-firm',
        title: 'About Our Firm Duplicate',
        status: 'DRAFT',
      })
    ).rejects.toThrow(/already in use/i);
  });

  it('rejects updating slug to collide with another active item of the same type', async () => {
    await CmsService.createContent('admin-1', {
      content_type: 'page',
      slug: 'privacy-policy',
      title: 'Privacy Policy',
      status: 'PUBLISHED',
    });

    const other = await CmsService.createContent('admin-1', {
      content_type: 'page',
      slug: 'terms-of-service',
      title: 'Terms of Service',
      status: 'DRAFT',
    });

    await expect(
      CmsService.updateContent(other.id, { slug: 'privacy-policy' })
    ).rejects.toThrow(/already in use/i);
  });

  it('listPublicContents("partner") returns only PUBLISHED records and excludes DRAFT records', async () => {
    const published = await CmsService.createContent('admin-1', {
      content_type: 'partner',
      title: 'Published Partner Corp',
      payload: { partner_type: 'developer' },
      status: 'PUBLISHED',
    });

    const draft = await CmsService.createContent('admin-1', {
      content_type: 'partner',
      title: 'Draft Partner Bank',
      payload: { partner_type: 'bank' },
      status: 'DRAFT',
    });

    const results = await CmsService.listPublicContents('partner');

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((item) => item.status === 'PUBLISHED')).toBe(true);
    expect(results.some((item) => item.id === published.id)).toBe(true);
    expect(results.some((item) => item.id === draft.id)).toBe(false);
  });
});
