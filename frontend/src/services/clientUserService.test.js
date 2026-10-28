import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clientUserService } from './clientUserService';

vi.mock('./profileService', () => ({
  default: {
    getProfile: vi.fn().mockResolvedValue(null),
    updateProfile: vi.fn().mockImplementation((updates) => Promise.resolve(updates)),
  },
  mockDefaultProfiles: {},
  normalizeProfile: (p) => p,
}));

describe('clientUserService (Mock Client Management Service)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides default client profile with full attributes', async () => {
    const profile = await clientUserService.getClientProfile();
    expect(profile).toBeDefined();
    expect(profile.name).toBe('Sophia Isabella Laurel');
    expect(profile.email).toBe('client@pt.com');
    expect(profile.role).toBe('Registered Client');
    expect(profile.phone).toBe('+63 917 555 8899');
  });

  it('updates client profile and persists in localStorage', async () => {
    const updated = await clientUserService.updateClientProfile({
      firstName: 'Sophia',
      lastName: 'Villar',
      phone: '+63 918 123 4567',
      preferredLocation: 'Makati & BGC',
    });

    expect(updated.firstName).toBe('Sophia');
    expect(updated.lastName).toBe('Villar');
    expect(updated.name).toBe('Sophia Villar');
    expect(updated.phone).toBe('+63 918 123 4567');
    expect(updated.preferredLocation).toBe('Makati & BGC');

    // Retrieve again to ensure persistence
    const retrieved = await clientUserService.getClientProfile();
    expect(retrieved.name).toBe('Sophia Villar');
  });

  it('fetches default saved properties and handles remove & re-save', async () => {
    const saved = await clientUserService.getSavedProperties();
    expect(Array.isArray(saved)).toBe(true);
    expect(saved.length).toBeGreaterThan(0);

    const firstId = saved[0].id;
    const remaining = await clientUserService.removeSavedProperty(firstId);
    expect(remaining.some((p) => p.id === firstId)).toBe(false);

    // Save back
    const restored = await clientUserService.saveProperty(firstId);
    expect(restored.some((p) => p.id === firstId)).toBe(true);
  });

  it('fetches client inquiries and supports sending follow-up messages', async () => {
    const inquiries = await clientUserService.getClientInquiries();
    expect(Array.isArray(inquiries)).toBe(true);
    expect(inquiries.length).toBeGreaterThan(0);

    const firstInquiry = inquiries[0];
    const initialMsgCount = firstInquiry.messages.length;

    const updated = await clientUserService.addInquiryMessage(firstInquiry.id, 'Following up on available inspection slots.');
    expect(updated.messages.length).toBe(initialMsgCount + 1);
    expect(updated.messages[updated.messages.length - 1].content).toBe('Following up on available inspection slots.');
  });
});
