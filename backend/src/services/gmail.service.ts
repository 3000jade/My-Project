import { google } from 'googleapis';
import { config } from '../config';
import logger from '../utils/logger';
import {
  buildInquiryEmailHtml,
  buildTourConfirmationEmailHtml,
  InquiryEmailData,
  TourConfirmationEmailData,
} from '../templates/emailTemplates';

export class GmailService {
  private static getGmailClient() {
    if (
      !config.integrations.googleDriveServiceAccountEmail ||
      !config.integrations.googleDrivePrivateKey
    ) {
      return null;
    }

    const auth = new google.auth.JWT({
      email: config.integrations.googleDriveServiceAccountEmail,
      key: config.integrations.googleDrivePrivateKey,
      scopes: ['https://www.googleapis.com/auth/gmail.send'],
      subject: config.integrations.gmailUserEmail || undefined,
    });

    return google.gmail({ version: 'v1', auth });
  }

  /**
   * Helper to format an RFC 2822 compliant email and encode it as URL-safe base64
   */
  private static createMimeMessage(to: string, from: string, subject: string, html: string): string {
    const boundary = `__boundary_${Date.now()}__`;
    const messageParts = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      'Please view this email with an HTML-compatible client.',
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      html,
      '',
      `--${boundary}--`,
    ];

    const message = messageParts.join('\r\n');
    return Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Send new inquiry lead notification to agent and platform
   */
  public static async sendInquiryNotification(data: InquiryEmailData): Promise<{ success: boolean; messageId?: string }> {
    const gmail = this.getGmailClient();
    const fromAddress = config.integrations.gmailUserEmail || 'concierge@cpkerby.luxury';
    const html = buildInquiryEmailHtml(data);
    const subject = `[New Inquiry] ${data.propertyTitle} - ${data.clientName}`;

    if (config.integrations.isMockMode || !gmail) {
      const mockId = `mock-msg-${Date.now()}`;
      logger.warn(`[GmailService] Mock mode active: sending inquiry email to ${data.agentEmail} (Mock ID: ${mockId})`);
      return {
        success: true,
        messageId: mockId,
      };
    }

    try {
      const raw = this.createMimeMessage(data.agentEmail, fromAddress, subject, html);
      const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw },
      });

      return {
        success: true,
        messageId: res.data.id || undefined,
      };
    } catch (err: any) {
      logger.error('[GmailService] Failed to send inquiry email:', err.message);
      return { success: false };
    }
  }

  /**
   * Send private showing confirmation email to client
   */
  public static async sendTourConfirmation(data: TourConfirmationEmailData): Promise<{ success: boolean; messageId?: string }> {
    const gmail = this.getGmailClient();
    const fromAddress = config.integrations.gmailUserEmail || 'concierge@cpkerby.luxury';
    const html = buildTourConfirmationEmailHtml(data);
    const subject = `Private Tour Confirmed: ${data.propertyTitle}`;

    if (config.integrations.isMockMode || !gmail) {
      const mockId = `mock-tour-msg-${Date.now()}`;
      logger.warn(`[GmailService] Mock mode active: sending tour confirmation to ${data.clientEmail}`);
      return {
        success: true,
        messageId: mockId,
      };
    }

    try {
      const raw = this.createMimeMessage(data.clientEmail, fromAddress, subject, html);
      const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw },
      });

      return {
        success: true,
        messageId: res.data.id || undefined,
      };
    } catch (err: any) {
      logger.error('[GmailService] Failed to send tour confirmation:', err.message);
      return { success: false };
    }
  }
}

export default GmailService;
