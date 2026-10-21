import { z } from 'zod';

export const createInquirySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  propertyId: z.string().optional(),
  property_id: z.string().optional(),
  propertyTitle: z.string().optional(),
  property_title: z.string().optional(),
  propertyPrice: z.string().optional(),
  property_price: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
  preferredDate: z.string().optional(),
  preferred_date: z.string().optional(),
  preferredReplyChannel: z.enum(['email', 'phone', 'whatsapp', 'chat']).optional(),
  source: z.string().optional(),
  type: z.enum(['general', 'tour', 'offer']).default('general'),
  clientId: z.string().optional(),
  client_id: z.string().optional(),
  agentId: z.string().optional(),
  agent_id: z.string().optional(),
});

export const requestAgentChatSchema = z.object({
  propertyId: z.string().min(1, 'propertyId is required'),
  propertyTitle: z.string().optional(),
  propertyPrice: z.string().optional(),
  agentId: z.string().optional(),
  returnTo: z.string().optional(),
  initialMessage: z.string().optional(),
  agentAvailable: z.boolean().optional(),
});

export const updateInquirySchema = z
  .object({
    status: z.enum(['new', 'assigned', 'contacted', 'scheduled', 'closed', 'reopened', 'resolved']).optional(),
    businessStatus: z.enum(['active', 'inactive']).optional(),
    operationalStatus: z.enum(['unassigned', 'awaiting_agent', 'awaiting_client', 'overdue', 'none']).optional(),
    closure_reason: z
      .enum(['purchased', 'not_interested', 'unresponsive', 'duplicate', 'other', 'resolved', 'withdrawn', 'closed', 'no_longer_pursued'])
      .optional(),
    closureReason: z
      .enum(['purchased', 'not_interested', 'unresponsive', 'duplicate', 'other', 'resolved', 'withdrawn', 'closed', 'no_longer_pursued'])
      .optional(),
    inactiveOutcome: z.string().optional(),
    inactiveReason: z.string().optional(),
    reactivationReason: z.string().optional(),
    agentId: z.string().optional(),
    agentName: z.string().optional(),
    preferredDate: z.string().optional(),
    preferred_date: z.string().optional(),
    message: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.status === 'closed' && !data.closure_reason && !data.closureReason && !data.inactiveOutcome) {
        return false;
      }
      return true;
    },
    {
      message: 'closure_reason is mandatory when status is closed',
      path: ['closure_reason'],
    }
  );

export const changeBusinessStatusSchema = z.object({
  businessStatus: z.enum(['active', 'inactive']),
  outcome: z.string().optional(),
  reason: z.string().min(1, 'Reason is required for status change'),
});

export const assignInquirySchema = z.object({
  agentId: z.string().min(1, 'Valid agent ID is required'),
  notes: z.string().optional(),
});

export const postInquiryMessageSchema = z.object({
  content: z.string().min(1, 'Message content cannot be empty').max(3000),
  requestId: z.string().optional(),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        mimeType: z.enum(['application/pdf', 'image/png', 'image/jpeg', 'image/webp']),
        sizeBytes: z.number().max(10 * 1024 * 1024),
        url: z.string().optional(),
      })
    )
    .optional(),
});

export const postInquiryNoteSchema = z.object({
  content: z.string().min(1, 'Note content cannot be empty').max(3000),
});

export const scheduleInquiryTourSchema = z.object({
  appointmentTime: z.string().min(1, 'Appointment time is required'),
  notes: z.string().optional(),
});

export const createFollowUpTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  notes: z.string().optional(),
  dueAt: z.string().min(1, 'Due date is required'),
  assignedTo: z.string().optional(),
});

export const updateFollowUpTaskSchema = z.object({
  status: z.enum(['pending', 'completed', 'cancelled', 'overdue']),
  notes: z.string().optional(),
});

export const queryInquirySchema = z.object({
  status: z.string().optional(),
  businessStatus: z.string().optional(),
  operationalStatus: z.string().optional(),
  agentId: z.string().optional(),
  type: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type CreateInquiryInput = z.infer<typeof createInquirySchema>;
export type UpdateInquiryInput = z.infer<typeof updateInquirySchema>;
export type AssignInquiryInput = z.infer<typeof assignInquirySchema>;
export type PostInquiryMessageInput = z.infer<typeof postInquiryMessageSchema>;
export type PostInquiryNoteInput = z.infer<typeof postInquiryNoteSchema>;
export type ScheduleInquiryTourInput = z.infer<typeof scheduleInquiryTourSchema>;
export type QueryInquiryInput = z.infer<typeof queryInquirySchema>;
