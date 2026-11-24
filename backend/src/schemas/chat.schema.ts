import { z } from 'zod';

/**
 * Optional route/listing context sent from the public ChatWidget.
 * Bounded to prevent oversized prompt-context payloads (OWASP LLM04).
 */
export const chatPageContextSchema = z
  .object({
    route: z.string().trim().max(200, 'Route exceeds 200 character limit.').optional(),
    propertyId: z.string().trim().min(1, 'Property ID cannot be empty.').max(100, 'Property ID exceeds 100 character limit.').optional(),
  })
  .optional();

/**
 * Strict schema for AI Chat Concierge requests.
 * Rejects client-supplied 'system' roles (OWASP LLM01) and bounds payload size (OWASP LLM04).
 */
export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1, 'Message content cannot be empty.').max(2000, 'Message exceeds 2,000 character limit.'),
      })
    )
    .min(1, 'At least one message is required.')
    .max(20, 'Conversation window cannot exceed 20 messages per request.'),
  pageContext: chatPageContextSchema,
});
