import { describe, expect, it, vi } from 'vitest';
import { signLiveChatToken, verifyLiveChatToken } from './chatLive.controller';
import { publishInquiryEvent, subscribeVisitorInquiryStream } from '../utils/inquiryStream';

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

describe('Visitor Inquiry Stream Forwarding', () => {
  it('forwards inquiry:message events to the matching visitor subscriber only', () => {
    const writesA: string[] = [];
    const writesB: string[] = [];
    const resA = { writeHead: vi.fn(), write: (chunk: string) => writesA.push(chunk) } as any;
    const resB = { writeHead: vi.fn(), write: (chunk: string) => writesB.push(chunk) } as any;

    const unsubA = subscribeVisitorInquiryStream('inq-A', resA);
    const unsubB = subscribeVisitorInquiryStream('inq-B', resB);

    publishInquiryEvent('inquiry:message', {
      inquiryId: 'inq-A',
      agentId: 'agent-1',
      message: { id: 'm1', sender: 'agent', content: 'Hello from Elena!' },
    });

    expect(writesA.some((chunk) => chunk.includes('event: inquiry:message') && chunk.includes('Hello from Elena!'))).toBe(true);
    expect(writesB.some((chunk) => chunk.includes('Hello from Elena!'))).toBe(false);

    unsubA();
    unsubB();
  });
});
