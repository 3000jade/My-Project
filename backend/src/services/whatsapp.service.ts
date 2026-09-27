import axios from 'axios';
import { config } from '../config';
import logger from '../utils/logger';

export interface WhatsAppInquiryLinkParams {
  phone: string;
  listingId: string;
  propertyTitle: string;
  price?: string;
  clientName?: string;
}

export interface WhatsAppLeadAlertData {
  clientName: string;
  propertyTitle: string;
  listingId: string;
  clientPhone?: string;
  message?: string;
}

export class WhatsAppService {
  /**
   * Format phone number to clean international E.164 digits without '+' or symbols
   */
  public static sanitizePhone(phone: string): string {
    return phone.replace(/[^0-9]/g, '');
  }

  /**
   * Generate universal wa.me instant click-to-chat deep link
   */
  public static generateInquiryLink(params: WhatsAppInquiryLinkParams): string {
    const cleanPhone = this.sanitizePhone(params.phone);
    const greeting = params.clientName ? `Hello, I'm ${params.clientName}. ` : 'Hello! ';
    const text = `${greeting}I am inquiring about the listing "${params.propertyTitle}" (Ref: ${params.listingId})${params.price ? ` priced at ${params.price}` : ''}. Could you provide the exclusive dossier or schedule a private showing?`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }

  /**
   * Dispatch instant lead notification to agent via Meta WhatsApp Cloud API
   */
  public static async sendLeadAlert(
    agentPhone: string,
    leadData: WhatsAppLeadAlertData
  ): Promise<{ success: boolean; messageId?: string }> {
    const cleanPhone = this.sanitizePhone(agentPhone);
    const { whatsappPhoneNumberId, whatsappAccessToken, isMockMode } = config.integrations;

    if (isMockMode || !whatsappPhoneNumberId || !whatsappAccessToken) {
      const mockId = `wamid.mock.${Date.now()}`;
      logger.warn(`[WhatsAppService] Mock mode active: sending WhatsApp lead alert to ${cleanPhone} (Mock ID: ${mockId})`);
      return {
        success: true,
        messageId: mockId,
      };
    }

    try {
      const url = `https://graph.facebook.com/v20.0/${whatsappPhoneNumberId}/messages`;
      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: `*NEW LUXURY LEAD ALERT*\n\nListing: ${leadData.propertyTitle} (${leadData.listingId})\nClient: ${leadData.clientName}\nPhone: ${leadData.clientPhone || 'N/A'}\nMessage: ${leadData.message || 'Inspection requested.'}`,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${whatsappAccessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        messageId: response.data?.messages?.[0]?.id,
      };
    } catch (err: any) {
      logger.error('[WhatsAppService] Meta API error:', err.response?.data || err.message);
      return { success: false };
    }
  }

  /**
   * Verify webhook handshake for Meta Graph API
   */
  public static verifyWebhook(mode?: string, token?: string, challenge?: string): string | null {
    const expectedToken = config.integrations.whatsappVerifyToken;
    if (mode === 'subscribe' && token === expectedToken && challenge) {
      return challenge;
    }
    return null;
  }

  /**
   * Ingest and parse inbound WhatsApp Webhook events
   */
  public static processInboundWebhook(payload: any): { handled: boolean; sender?: string; text?: string } {
    try {
      const entry = payload?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (message) {
        const sender = message.from;
        const text = message.text?.body || '[Non-text message]';
        logger.info(`[WhatsAppService] Inbound message received from ${sender}: "${text}"`);
        return { handled: true, sender, text };
      }

      return { handled: true };
    } catch (err: any) {
      logger.error('[WhatsAppService] Inbound webhook parse error:', err.message);
      return { handled: false };
    }
  }
}

export default WhatsAppService;
