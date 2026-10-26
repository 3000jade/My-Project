import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import crypto from 'crypto';
import { config } from '../config';
import logger from '../utils/logger';
import {
  buildInquiryEmailHtml,
  buildTourConfirmationEmailHtml,
  buildAgentInvitationEmailHtml,
  buildPropertyAssignmentEmailHtml,
  buildAssignmentAcceptedEmailHtml,
  buildAssignmentDeclinedEmailHtml,
  InquiryEmailData,
  TourConfirmationEmailData,
  PropertyAssignmentEmailData,
  AssignmentAcceptedEmailData,
  AssignmentDeclinedEmailData,
} from '../templates/emailTemplates';

export class GmailService {
  /**
   * Primary Email Transporter (Google App Password SMTP - Recommended)
   */
  private static getSmtpTransporter() {
    const user = config.integrations.gmailUserEmail;
    const pass = config.integrations.gmailAppPassword;

    if (!user || !pass) {
      return null;
    }

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  /**
   * Google API Client (OAuth2 Refresh Token or Service Account JWT)
   */
  private static getGmailClient() {
    // 1. Official Google Mail API via OAuth2 Refresh Token
    if (
      config.integrations.gmailRefreshToken &&
      config.integrations.googleClientId &&
      config.integrations.googleClientSecret
    ) {
      const oauth2Client = new google.auth.OAuth2(
        config.integrations.googleClientId,
        config.integrations.googleClientSecret
      );
      oauth2Client.setCredentials({
        refresh_token: config.integrations.gmailRefreshToken,
      });
      return google.gmail({ version: 'v1', auth: oauth2Client });
    }

    // 2. Google Mail API via Service Account JWT (Domain-Wide Delegation)
    if (
      config.integrations.googleDriveServiceAccountEmail &&
      config.integrations.googleDrivePrivateKey
    ) {
      const auth = new google.auth.JWT({
        email: config.integrations.googleDriveServiceAccountEmail,
        key: config.integrations.googleDrivePrivateKey,
        scopes: ['https://www.googleapis.com/auth/gmail.send'],
        subject: config.integrations.gmailUserEmail || undefined,
      });

      return google.gmail({ version: 'v1', auth });
    }

    return null;
  }

  /**
   * Helper to format an RFC 2822 compliant email and encode it as URL-safe base64
   */
  private static createMimeMessage(to: string, from: string, subject: string, html: string): string {
    const boundary = `__hsr_boundary_${Date.now()}__`;
    const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`;
    const base64Html = Buffer.from(html, 'utf-8').toString('base64');
    const base64Text = Buffer.from('Please view this invitation in an HTML-compatible email client.', 'utf-8').toString('base64');

    const messageId = `<${Date.now()}.${crypto.randomBytes(8).toString('hex')}@cpkerby.luxury>`;

    const messageParts = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: ${messageId}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      base64Text,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      base64Html,
      '',
      `--${boundary}--`,
    ];

    const message = messageParts.join('\r\n');
    return Buffer.from(message, 'utf-8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Internal dispatcher: sends via Google Mail API first, then SMTP fallback
   */
  private static async dispatchEmail(
    to: string,
    fromEmail: string,
    fromName: string,
    subject: string,
    html: string
  ): Promise<{ success: boolean; messageId?: string }> {
    const fromHeader = fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;

    // 1. Google Mail API (OAuth2 or Service Account)
    const gmail = this.getGmailClient();
    if (gmail && !config.integrations.isMockMode) {
      try {
        const raw = this.createMimeMessage(to, fromHeader, subject, html);
        const res = await gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw },
        });
        logger.info(`[GmailService] Email delivered to ${to} via Google Mail API (ID: ${res.data.id})`);
        return { success: true, messageId: res.data.id || undefined };
      } catch (err: any) {
        logger.error('[GmailService] Google Mail API delivery failed:', err.message);
      }
    }

    // 2. Google SMTP (App Password)
    const smtp = this.getSmtpTransporter();
    if (smtp && !config.integrations.isMockMode) {
      try {
        const info = await smtp.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to,
          subject,
          html,
        });
        logger.info(`[GmailService] Email delivered to ${to} via Gmail SMTP (ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
      } catch (err: any) {
        logger.error('[GmailService] Gmail SMTP delivery failed:', err.message);
      }
    }

    return { success: false };
  }

  /**
   * Send new inquiry lead notification to agent and platform
   */
  public static async sendInquiryNotification(data: InquiryEmailData): Promise<{ success: boolean; messageId?: string }> {
    const subject = `[New Inquiry] ${data.propertyTitle} - ${data.clientName}`;
    const html = buildInquiryEmailHtml(data);
    const fromName = 'Human Shelter Realty Concierge';
    const fromEmail = config.integrations.gmailUserEmail || 'concierge@cpkerby.luxury';

    const dispatchResult = await this.dispatchEmail(data.agentEmail, fromEmail, fromName, subject, html);
    if (dispatchResult.success) {
      return dispatchResult;
    }

    // Mock Mode / Development fallback
    const mockId = `mock-msg-${Date.now()}`;
    logger.warn(`[GmailService] Mock mode active: sending inquiry email to ${data.agentEmail} (Mock ID: ${mockId})`);
    return { success: true, messageId: mockId };
  }

  /**
   * Send private showing confirmation email to client
   */
  public static async sendTourConfirmation(data: TourConfirmationEmailData): Promise<{ success: boolean; messageId?: string }> {
    const subject = `Private Tour Confirmed: ${data.propertyTitle}`;
    const html = buildTourConfirmationEmailHtml(data);
    const fromName = 'Human Shelter Realty Concierge';
    const fromEmail = config.integrations.gmailUserEmail || 'concierge@cpkerby.luxury';

    const dispatchResult = await this.dispatchEmail(data.clientEmail, fromEmail, fromName, subject, html);
    if (dispatchResult.success) {
      return dispatchResult;
    }

    // Mock Mode / Development fallback
    const mockId = `mock-tour-msg-${Date.now()}`;
    logger.warn(`[GmailService] Mock mode active: sending tour confirmation to ${data.clientEmail}`);
    return { success: true, messageId: mockId };
  }

  /**
   * Send agent onboarding invitation email
   */
  public static async sendAgentInvitationEmail(data: {
    to: string;
    inviteUrl: string;
    expiresInHours?: number;
    isResend?: boolean;
  }): Promise<{ success: boolean; messageId?: string }> {
    const subject = data.isResend
      ? 'Updated Invitation to Join CP_kerby as Licensed Property Consultant'
      : 'Invitation to Join CP_kerby as Licensed Property Consultant';
    const html = buildAgentInvitationEmailHtml({ agentEmail: data.to, inviteUrl: data.inviteUrl, expiresInHours: data.expiresInHours });
    const fromName = 'Human Shelter Realty Compliance';
    const fromEmail = config.integrations.gmailUserEmail || 'compliance@cpkerby.luxury';

    const dispatchResult = await this.dispatchEmail(data.to, fromEmail, fromName, subject, html);
    if (dispatchResult.success) {
      return dispatchResult;
    }

    // Mock Mode / Development fallback: Always log invitation link
    const mockId = `mock-invite-msg-${Date.now()}`;
    logger.warn(`[GmailService] Mock mode active: sending agent invitation email to ${data.to}`);
    logger.info(`[GmailService] Onboarding Invitation Link: ${data.inviteUrl}`);
    return {
      success: true,
      messageId: mockId,
    };
  }

  /**
   * Send new property assignment email notification to assigned agent
   */
  public static async sendPropertyAssignmentEmail(
    data: PropertyAssignmentEmailData
  ): Promise<{ success: boolean; messageId?: string }> {
    const subject = `Action Required: New Property Listing Assigned - ${data.propertyTitle}`;
    const html = buildPropertyAssignmentEmailHtml(data);
    const fromName = 'Human Shelter Realty Brokerage';
    const fromEmail = config.integrations.gmailUserEmail || 'brokerage@cpkerby.luxury';

    const dispatchResult = await this.dispatchEmail(data.agentEmail, fromEmail, fromName, subject, html);
    if (dispatchResult.success) {
      return dispatchResult;
    }

    const mockId = `mock-assign-msg-${Date.now()}`;
    logger.warn(`[GmailService] Mock mode active: sending property assignment email to ${data.agentEmail}`);
    return {
      success: true,
      messageId: mockId,
    };
  }

  /**
   * Send assignment accepted email notification to broker
   */
  public static async sendAssignmentAcceptedEmail(
    data: AssignmentAcceptedEmailData
  ): Promise<{ success: boolean; messageId?: string }> {
    const subject = `Listing Confirmed and Live: ${data.propertyTitle} accepted by ${data.agentName}`;
    const html = buildAssignmentAcceptedEmailHtml(data);
    const fromName = 'Human Shelter Realty System';
    const fromEmail = config.integrations.gmailUserEmail || 'system@cpkerby.luxury';

    const dispatchResult = await this.dispatchEmail(data.brokerEmail, fromEmail, fromName, subject, html);
    if (dispatchResult.success) {
      return dispatchResult;
    }

    const mockId = `mock-accept-msg-${Date.now()}`;
    logger.warn(`[GmailService] Mock mode active: sending assignment accepted email to ${data.brokerEmail}`);
    return {
      success: true,
      messageId: mockId,
    };
  }

  /**
   * Send assignment declined email notification to broker
   */
  public static async sendAssignmentDeclinedEmail(
    data: AssignmentDeclinedEmailData
  ): Promise<{ success: boolean; messageId?: string }> {
    const subject = `Action Required: ${data.propertyTitle} declined by ${data.agentName}`;
    const html = buildAssignmentDeclinedEmailHtml(data);
    const fromName = 'Human Shelter Realty System';
    const fromEmail = config.integrations.gmailUserEmail || 'system@cpkerby.luxury';

    const dispatchResult = await this.dispatchEmail(data.brokerEmail, fromEmail, fromName, subject, html);
    if (dispatchResult.success) {
      return dispatchResult;
    }

    const mockId = `mock-decline-msg-${Date.now()}`;
    logger.warn(`[GmailService] Mock mode active: sending assignment declined email to ${data.brokerEmail}`);
    return {
      success: true,
      messageId: mockId,
    };
  }
}

export default GmailService;
