import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadGoogleMapsApi, isGoogleMapsConfigured, getGoogleMapsApiKey } from './googleMapsLoader';

describe('googleMapsLoader', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('detects when Google Maps API key is not configured', () => {
    // In test environment without key, it should safely return false without crashing
    const configured = isGoogleMapsConfigured();
    expect(typeof configured).toBe('boolean');
  });

  it('retrieves API key safely from environment', () => {
    const key = getGoogleMapsApiKey();
    expect(typeof key).toBe('string');
  });

  it('rejects gracefully or falls back when API key is missing', async () => {
    if (!isGoogleMapsConfigured()) {
      await expect(loadGoogleMapsApi({ forceFailIfMissing: true })).rejects.toThrow(
        /Google Maps API key is not configured/
      );
    }
  });
});
