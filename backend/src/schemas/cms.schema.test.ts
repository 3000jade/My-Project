import { describe, it, expect } from 'vitest';
import {
  cmsContentTypeEnum,
  createCmsContentSchema,
  updateCmsContentSchema,
} from './cms.schema';

describe('cms.schema', () => {
  it('accepts all 8 private realty content types', () => {
    const types = ['banner', 'page', 'office', 'staff', 'partner', 'award', 'article', 'faq'];
    for (const t of types) {
      expect(cmsContentTypeEnum.safeParse(t).success).toBe(true);
    }
  });

  it('requires department and role for staff and allows omitting slug', () => {
    const valid = createCmsContentSchema.safeParse({
      content_type: 'staff',
      title: 'Gina Punzalan',
      media_url: '/api/drive/media/file-123',
      payload: { department: 'Business Development & Growth', role: 'Senior Business Development' },
      status: 'PUBLISHED',
    });
    expect(valid.success).toBe(true);

    const missingRole = createCmsContentSchema.safeParse({
      content_type: 'staff',
      title: 'Gina Punzalan',
      payload: { department: 'Accounting Department' },
    });
    expect(missingRole.success).toBe(false);
  });

  it('requires address for office branches', () => {
    const valid = createCmsContentSchema.safeParse({
      content_type: 'office',
      title: 'Makati Main Office',
      payload: { address: '123 Ayala Ave, Makati City', phone: '+63 2 8888 0000' },
    });
    expect(valid.success).toBe(true);

    const missingAddress = createCmsContentSchema.safeParse({
      content_type: 'office',
      title: 'Makati Main Office',
      payload: {},
    });
    expect(missingAddress.success).toBe(false);
  });

  it('validates partner_type as developer or bank', () => {
    const valid = createCmsContentSchema.safeParse({
      content_type: 'partner',
      title: 'Ayala Land',
      media_url: 'https://example.com/logo.png',
      payload: { partner_type: 'developer' },
    });
    expect(valid.success).toBe(true);

    const invalid = createCmsContentSchema.safeParse({
      content_type: 'partner',
      title: 'Unknown Org',
      payload: { partner_type: 'other' },
    });
    expect(invalid.success).toBe(false);
  });

  it('requires year and organization for awards', () => {
    const valid = createCmsContentSchema.safeParse({
      content_type: 'award',
      title: 'Top Luxury Brokerage',
      payload: { year: '2025', organization: 'Asian Real Estate Awards', featured: true },
    });
    expect(valid.success).toBe(true);

    const missingYear = createCmsContentSchema.safeParse({
      content_type: 'award',
      title: 'Top Luxury Brokerage',
      payload: { organization: 'Asian Real Estate Awards' },
    });
    expect(missingYear.success).toBe(false);
  });

  it('requires explicit slug for page and article types', () => {
    const missingSlug = createCmsContentSchema.safeParse({
      content_type: 'article',
      title: 'First-Time Buyer Guide',
    });
    expect(missingSlug.success).toBe(false);
  });

  it('rejects unsafe javascript: URLs in media_url', () => {
    const badMedia = createCmsContentSchema.safeParse({
      content_type: 'banner',
      title: 'Promo',
      media_url: 'javascript:alert(1)',
    });
    expect(badMedia.success).toBe(false);

    const badUpdate = updateCmsContentSchema.safeParse({
      media_url: 'javascript:alert(1)',
    });
    expect(badUpdate.success).toBe(false);
  });

  it('accepts empty string and internal /images/ media_url values', () => {
    const emptyMedia = createCmsContentSchema.safeParse({
      content_type: 'banner',
      title: 'Promo Banner',
      media_url: '',
    });
    expect(emptyMedia.success).toBe(true);
    if (emptyMedia.success) {
      expect(emptyMedia.data.media_url).toBeNull();
    }

    const staticImg = createCmsContentSchema.safeParse({
      content_type: 'partner',
      title: 'BDO Unibank',
      media_url: '/images/partners/bdo.png',
      payload: { partner_type: 'bank' },
    });
    expect(staticImg.success).toBe(true);
  });

  it('validates award media_type and partial update enums without injecting defaults', () => {
    const badAwardMedia = createCmsContentSchema.safeParse({
      content_type: 'award',
      title: 'Best Realty',
      payload: { year: '2025', organization: 'Org', media_type: 'pdf' },
    });
    expect(badAwardMedia.success).toBe(false);

    const badPatchPartner = updateCmsContentSchema.safeParse({
      payload: { partner_type: 'other' },
    });
    expect(badPatchPartner.success).toBe(false);

    const partialTitle = updateCmsContentSchema.parse({ title: 'Updated Title' });
    expect(partialTitle).toEqual({ title: 'Updated Title' });
  });
});
