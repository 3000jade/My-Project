import { describe, expect, it } from 'vitest';
import { signLiveChatToken, verifyLiveChatToken } from './chatLive.controller';

describe('Guest Live Chat HMAC Token', () => {
  it('accepts a valid token for the matching inquiryId', () => {
    const token = signLiveChatToken('inq-123', 'guest@example.com');
    const check = verifyLiveChatToken(token, 'inq-123');
    expect(check.valid).toBe(true);
    expect(check.email).toBe('guest@example.com');
  });

  it('rejects a token used against a different inquiryId', () => {
    const token = signLiveChatToken('inq-123', 'guest@example.com');
    const check = verifyLiveChatToken(token, 'inq-999');
    expect(check.valid).toBe(false);
  });

  it('rejects a tampered token', () => {
    const token = signLiveChatToken('inq-123', 'guest@example.com');
    const tampered = `${token.slice(0, -4)}xxxx`;
    expect(verifyLiveChatToken(tampered, 'inq-123').valid).toBe(false);
  });
});
